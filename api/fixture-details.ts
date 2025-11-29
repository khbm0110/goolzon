// This is a Vercel-style serverless function that acts as a Backend-for-Frontend (BFF).
// It fetches detailed fixture data (stats, lineups, events) from the api-football API,
// transforms it into a unified format, and caches it for 1 minute.

const cache = new Map<string, { data: any, timestamp: number }>();
const CACHE_TTL = 60 * 1000; // 1 minute

export default async function handler(request: any, response: any) {
    const { id } = request.query;
    const apiKey = process.env.APIFOOTBALL_KEY;

    if (!apiKey) {
        return response.status(500).json({ error: 'API key not configured on the server.' });
    }
    if (!id) {
        return response.status(400).json({ error: 'Fixture ID is required.' });
    }

    const now = Date.now();
    const cached = cache.get(id as string);
    if (cached && (now - cached.timestamp < CACHE_TTL)) {
        response.setHeader('X-Cache-Status', 'HIT');
        return response.status(200).json(cached.data);
    }

    try {
        const detailsUrl = `https://v3.football.api-sports.io/fixtures?id=${id}`;
        const eventsUrl = `https://v3.football.api-sports.io/fixtures/events?fixture=${id}`;
        const lineupsUrl = `https://v3.football.api-sports.io/fixtures/lineups?fixture=${id}`;
        
        const [detailsRes, eventsRes, lineupsRes] = await Promise.all([
            fetch(detailsUrl, { headers: { 'x-apisports-key': apiKey } }),
            fetch(eventsUrl, { headers: { 'x-apisports-key': apiKey } }),
            fetch(lineupsUrl, { headers: { 'x-apisports-key': apiKey } })
        ]);

        if (!detailsRes.ok || !eventsRes.ok || !lineupsRes.ok) {
            console.error(`One or more API requests failed for fixture ${id}`);
            // Return null to match frontend expectation on error
            return response.status(502).json(null);
        }

        const [detailsData, eventsData, lineupsData] = await Promise.all([
            detailsRes.json(),
            eventsRes.json(),
            lineupsRes.json()
        ]);
        
        const fixtureDetails = detailsData.response[0];
        if (!fixtureDetails) {
            return response.status(404).json({ error: 'Fixture not found' });
        }
        
        const homeStats = fixtureDetails.statistics?.find((s: any) => s.team.id === fixtureDetails.teams.home.id);
        const awayStats = fixtureDetails.statistics?.find((s: any) => s.team.id === fixtureDetails.teams.away.id);
        
        const getStat = (stats: any, type: string) => stats?.statistics.find((s:any) => s.type === type)?.value || 0;
        
        const possessionHome = parseInt(getStat(homeStats, 'Ball Possession')?.toString().replace('%', '')) || 50;
        
        const result = {
            stats: {
                possession: possessionHome,
                shotsHome: getStat(homeStats, 'Total Shots'),
                shotsAway: getStat(awayStats, 'Total Shots'),
                shotsOnTargetHome: getStat(homeStats, 'Shots on Goal'),
                shotsOnTargetAway: getStat(awayStats, 'Shots on Goal'),
                cornersHome: getStat(homeStats, 'Corner Kicks'),
                cornersAway: getStat(awayStats, 'Corner Kicks'),
            },
            lineups: {
                home: lineupsData.response[0]?.startXI.map((p: any) => p.player.name) || [],
                away: lineupsData.response[1]?.startXI.map((p: any) => p.player.name) || [],
            },
            events: (eventsData.response || []).map((e: any) => ({
                time: `${e.time.elapsed}'`,
                team: e.team.id === fixtureDetails.teams.home.id ? 'HOME' : 'AWAY',
                type: e.type === 'Goal' ? 'GOAL' : e.type === 'Card' ? (e.detail === 'Yellow Card' ? 'YELLOW' : 'RED') : e.type === 'subst' ? 'SUB' : 'OTHER',
                player: e.player.name,
            })),
            summary: 'ملخص المباراة سيتم إنشاؤه بواسطة الذكاء الاصطناعي قريباً.',
        };

        cache.set(id as string, { data: result, timestamp: now });
        
        response.setHeader('X-Cache-Status', 'MISS');
        return response.status(200).json(result);

    } catch (error: any) {
        console.error(`Failed to fetch details for fixture ${id}:`, error);
        // Don't cache errors, return null as the frontend expects
        return response.status(502).json(null);
    }
}