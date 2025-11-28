
import { createClient } from '@supabase/supabase-js';

const getSupabase = () => {
  const url = process.env.VITE_SUPABASE_URL;
  const key = process.env.VITE_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
};

const BASE_URL = 'https://v3.football.api-sports.io';

const fetchFinishedFixtures = async (apiKey: string, date: string, leagueIds: string) => {
    try {
        const response = await fetch(`${BASE_URL}/fixtures?date=${date}&status=FT`, { headers: { 'x-apisports-key': apiKey } });
        const data = await response.json();
        const targetIds = leagueIds.split(',').map(id => parseInt(id.trim()));
        return (data.response || [])
            .filter((f: any) => targetIds.includes(f.league.id))
            .map((f: any) => ({ id: f.fixture.id }));
    } catch { return []; }
};

const fetchPlayerStats = async (apiKey: string, fixtureId: number) => {
    try {
        const response = await fetch(`${BASE_URL}/fixtures/players?fixture=${fixtureId}`, { headers: { 'x-apisports-key': apiKey } });
        const data = await response.json();
        const perfs: any[] = [];
        (data.response || []).forEach((team: any) => {
            team.players.forEach((player: any) => {
                const stats = player.statistics[0];
                perfs.push({
                    match_api_id: fixtureId,
                    player_api_id: player.player.id,
                    team_api_id: team.team.id,
                    minutes: stats.games.minutes,
                    rating: parseFloat(stats.games.rating) || 0,
                    goals: stats.goals.total || 0,
                    assists: stats.goals.assists || 0,
                });
            });
        });
        return perfs;
    } catch { return []; }
};

export default async function handler(request: any, response: any) {
    const authHeader = request.headers['authorization'];
    const expectedSecret = `Bearer ${process.env.CRON_SECRET}`;

    if (authHeader !== expectedSecret) {
        return response.status(401).json({ error: 'Unauthorized' });
    }

    const supabase = getSupabase();
    const apiKey = process.env.APIFOOTBALL_KEY_PERFORMANCE_DATA || process.env.VITE_APIFOOTBALL_KEY;
    const LEAGUE_IDS = '307,39,140,2,135,78,301';

    if (!supabase || !apiKey) return response.status(500).json({ error: "Configuration Error" });

    try {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const dateString = yesterday.toISOString().split('T')[0];

        const fixtures = await fetchFinishedFixtures(apiKey, dateString, LEAGUE_IDS);
        let count = 0;

        for (const fixture of fixtures) {
            const stats = await fetchPlayerStats(apiKey, fixture.id);
            if (stats.length > 0) {
                await supabase.from('player_performances').upsert(stats);
                count += stats.length;
            }
        }

        return response.status(200).json({ message: `Synced ${count} performance records.` });
    } catch (error: any) {
        return response.status(500).json({ error: error.message });
    }
}
