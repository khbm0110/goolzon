import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  searchApiFootballTeams,
  fetchApiFootballTeam,
  searchApiFootballPlayersByName,
  fetchApiFootballPlayer,
  ApiFootballRateLimitError,
} from '@/lib/services/apiFootball';
import { getErrorMessage } from '@/lib/utils/errors';

async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  if (profile?.role !== 'admin') return null;
  return user;
}

interface FieldCheck {
  field: string;
  value: unknown;
  present: boolean;
}

function checkFields(obj: Record<string, unknown> | null, fields: string[]): FieldCheck[] {
  return fields.map((field) => {
    const value = obj?.[field];
    const present = value !== null && value !== undefined && value !== '';
    return { field, value, present };
  });
}

// POST { clubName, playerName? }
// Makes REAL calls to API-Football using the server's actual key and
// reports exactly what came back for each data type this app relies
// on — team info, player bio, season stats — flagging any field that's
// null/missing. This is the honest way to answer "does the free plan
// actually give us what we need": run it and look, instead of guessing
// from documentation.
export async function POST(request: Request) {
  if (!(await requireAdmin())) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { clubName, playerName } = await request.json();
  if (!clubName || String(clubName).trim().length < 2) {
    return NextResponse.json({ error: 'اكتب اسم نادٍ للاختبار (3 أحرف على الأقل)' }, { status: 400 });
  }

  const results: Record<string, unknown> = {};

  try {
    // 1) Team search
    const teamResults = await searchApiFootballTeams(clubName.trim());
    results.teamSearch = {
      resultCount: teamResults.length,
      sample: teamResults[0] ?? null,
      fieldsChecked: teamResults[0] ? checkFields(teamResults[0] as unknown as Record<string, unknown>, ['name', 'logo', 'country']) : [],
    };

    // 2) Team details (using the first search hit, if any)
    if (teamResults[0]) {
      const team = await fetchApiFootballTeam(teamResults[0].apiTeamId);
      results.teamDetails = {
        raw: team,
        fieldsChecked: checkFields(team as unknown as Record<string, unknown>, ['name', 'logo', 'country', 'founded']),
      };
    }

    // 3) Player search (only if a player name was given)
    if (playerName && String(playerName).trim().length >= 3) {
      const playerResults = await searchApiFootballPlayersByName(playerName.trim());
      results.playerSearch = {
        resultCount: playerResults.length,
        sample: playerResults[0] ?? null,
      };

      if (playerResults[0]) {
        const player = await fetchApiFootballPlayer(playerResults[0].apiPlayerId);
        results.playerDetails = {
          raw: player,
          fieldsChecked: checkFields(player as unknown as Record<string, unknown>, [
            'name', 'age', 'birthDate', 'birthPlace', 'heightCm', 'weightKg', 'nationality', 'photo', 'number', 'position', 'seasonStats',
          ]),
          note: player && !player.seasonStats
            ? 'ملاحظة: seasonStats فاضي — هذا طبيعي لو اللاعب ما لعب أي دقيقة بالموسم الحالي بعد، جرّب لاعب نشط حاليًا.'
            : null,
        };
      }
    }

    return NextResponse.json({ success: true, results });
  } catch (e: unknown) {
    if (e instanceof ApiFootballRateLimitError) {
      return NextResponse.json({ error: 'تم تجاوز حد الطلبات (429) — انتظر دقيقة وجرّب مرة ثانية.', partialResults: results }, { status: 429 });
    }
    return NextResponse.json({ error: getErrorMessage(e, 'فشل الاتصال بـ API-Football'), partialResults: results }, { status: 502 });
  }
}
