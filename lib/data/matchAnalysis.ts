import type { SupabaseClient } from '@supabase/supabase-js';
import { getProvider } from '@/lib/services/ai/providers';
import { buildAnalysisPrompt } from '@/lib/services/ai/prompt';
import { getErrorMessage } from '@/lib/utils/errors';

// Server-only. Called right after a match is marked FINISHED (see
// /api/cron/sync-finished-matches). Turns whatever real data we have
// about the match (score, and stats if match_details exists) into a
// prompt for the "وكيل التحليل" agent, and queues the result the same
// way the RSS agents do — same review-queue, same auto-publish timer.
//
// Deliberately does nothing (no error) if the analysis agent is
// disabled/unconfigured, or if match_details has no stats yet — a
// score-only analysis without any underlying numbers isn't worth
// generating, and this cron runs often enough to catch it once stats
// do show up on a later pass... except we already marked the match
// FINISHED and won't re-check it. That's an accepted limitation for
// now: an admin can always trigger this manually later if needed.
export async function generateMatchAnalysis(
  admin: SupabaseClient,
  match: { id: string; home_team: string; away_team: string; score_home: number | null; score_away: number | null; league: string | null; date: string | null }
) {
  const { data: agent } = await admin.from('ai_agents').select('*').eq('id', 'analysis').eq('source_type', 'match_analysis').maybeSingle();
  if (!agent || !agent.enabled) return { skipped: 'agent-disabled' };

  const provider = getProvider(agent.provider_id);
  if (!provider || !provider.isConfigured()) return { skipped: 'provider-not-configured' };

  const pendingId = `af-analysis-${match.id}`;
  const { data: existing } = await admin.from('pending_articles').select('id').eq('id', pendingId).maybeSingle();
  if (existing) return { skipped: 'already-exists' };

  const { data: details } = await admin.from('match_details').select('stats').eq('match_id', match.id).maybeSingle();

  let summary = `${match.home_team} ${match.score_home ?? '?'} - ${match.score_away ?? '?'} ${match.away_team}`;
  if (match.league) summary += `\nالبطولة: ${match.league}`;
  if (details?.stats) {
    const s = details.stats;
    summary += `\nنسبة الاستحواذ: ${match.home_team} ${s.possession?.home ?? '?'}% - ${s.possession?.away ?? '?'}% ${match.away_team}`;
    summary += `\nالتسديدات: ${s.shotsHome ?? '?'} - ${s.shotsAway ?? '?'}`;
    summary += `\nالتسديدات على المرمى: ${s.shotsOnTargetHome ?? '?'} - ${s.shotsOnTargetAway ?? '?'}`;
    summary += `\nالركلات الركنية: ${s.cornersHome ?? '?'} - ${s.cornersAway ?? '?'}`;
  }

  try {
    const prompt = buildAnalysisPrompt(agent.persona, summary);
    const rewritten = await provider.complete(prompt);
    const { error } = await admin.from('pending_articles').insert({
      id: pendingId,
      agent_id: 'analysis',
      title: rewritten.title,
      summary: rewritten.summary,
      content: rewritten.content,
      category: agent.default_category,
      image_url: null,
      source_url: null,
      source_name: `تحليل تلقائي — ${match.home_team} ضد ${match.away_team}`,
      ai_provider: provider.id,
      status: 'PENDING',
    });
    if (error) throw new Error(error.message);
    return { queued: true };
  } catch (e: unknown) {
    return { error: getErrorMessage(e, 'unknown error') };
  }
}
