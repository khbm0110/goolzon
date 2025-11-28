
import { createClient } from '@supabase/supabase-js';

// تعريف الدوال المساعدة محلياً لأن ملفات الـ API في Vercel تعمل كـ Serverless Functions معزولة
// ولا يمكنها استيراد ملفات من مجلد src بسهولة في بعض الهيكليات.
const getSupabase = () => {
  const url = process.env.VITE_SUPABASE_URL;
  const key = process.env.VITE_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
};

const BASE_URL = 'https://v3.football.api-sports.io';

const fetchTeamSquad = async (apiKey: string, teamId: number) => {
    try {
        const response = await fetch(`${BASE_URL}/players/squads?team=${teamId}`, { headers: { 'x-apisports-key': apiKey } });
        const data = await response.json();
        if (!data.response?.[0]?.players) return [];

        const posMap: Record<string, string> = {
            'Goalkeeper': 'GK', 'Defender': 'DEF', 'Midfielder': 'MID', 'Attacker': 'FWD'
        };

        return data.response[0].players.map((p: any) => ({
            id: `apif-${p.id}`,
            apiFootballId: p.id,
            name: p.name,
            number: p.number || 0,
            position: posMap[p.position] || 'MID',
            rating: 75, 
            image: p.photo,
            nationality: p.nationality || '', 
            stats: { pac: 70, sho: 70, pas: 70, dri: 70, def: 50, phy: 60 }
        }));
    } catch (e) {
        console.error(`Failed to fetch squad for team ${teamId}:`, e);
        return [];
    }
};

const fetchTeamCoach = async (apiKey: string, teamId: number) => {
    try {
        const response = await fetch(`${BASE_URL}/coachs?team=${teamId}`, { headers: { 'x-apisports-key': apiKey } });
        const data = await response.json();
        return data.response?.[0]?.name || null;
    } catch (e) { return null; }
};

export default async function handler(request: any, response: any) {
  // --- Security Check ---
  // Allow authorization header or query parameter (for easy testing if needed, though header is preferred)
  const authHeader = request.headers['authorization'];
  const expectedSecret = `Bearer ${process.env.CRON_SECRET}`;

  if (authHeader !== expectedSecret) {
      console.log("Sync Engine: Unauthorized access attempt.");
      return response.status(401).json({ error: 'Unauthorized' });
  }

  const supabase = getSupabase();
  const apiKey = process.env.VITE_APIFOOTBALL_KEY;

  if (!supabase || !apiKey) {
    return response.status(500).json({ error: "Server configuration error: Supabase or API key is missing." });
  }

  try {
    const { data: clubs } = await supabase.from('clubs').select('*');
    if (!clubs) throw new Error("No clubs found");

    let updatedClubs = 0;

    for (const club of clubs) {
      if (!club.apiFootballId) continue;
      
      const [apiSquad, apiCoach] = await Promise.all([
          fetchTeamSquad(apiKey, club.apiFootballId),
          fetchTeamCoach(apiKey, club.apiFootballId)
      ]);

      const updates: any = {};
      if (apiSquad.length > 0) updates.squad = apiSquad;
      if (apiCoach && apiCoach !== club.coach) updates.coach = apiCoach;

      if (Object.keys(updates).length > 0) {
        await supabase.from('clubs').update(updates).eq('id', club.id);
        updatedClubs++;
      }
    }

    return response.status(200).json({ message: `Sync complete. Updated ${updatedClubs} clubs.` });
  } catch (error: any) {
    return response.status(500).json({ error: error.message });
  }
}
