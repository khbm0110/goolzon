// This is a Vercel-style serverless function that acts as a Backend-for-Frontend (BFF).
// It fetches standings for a predefined set of leagues from the api-football API,
// transforms the data, and caches each league's standings for 15 minutes.

const cache = new Map<string, { data: any, timestamp: number }>();
const CACHE_TTL = 15 * 60 * 1000; // 15 minutes

const LEAGUE_MAP: { [key: string]: string } = {
    'SAUDI': '307',
    'ENGLAND': '39',
    'SPAIN': '140',
    'ITALY': '135',
    'GERMANY': '78'
};

const fetchStandingForLeague = async (apiKey: string, leagueId: string) => {
    const now = Date.now();
    const cached = cache.get(leagueId);
    if (cached && (now - cached.timestamp < CACHE_TTL)) {
        return cached.data;
    }

    // Use current year for the season, which is correct for most leagues.
    const currentSeason = new Date().getFullYear();
    const apiUrl = `https://v3.football.api-sports.io/standings?league=${leagueId}&season=${currentSeason}`;
    
    const apiResponse = await fetch(apiUrl, {
        headers: { 'x-apisports-key': apiKey },
    });
    
    if (!apiResponse.ok) {
        throw new Error(`API Football responded with status ${apiResponse.status} for league ${leagueId}`);
    }

    const data = await apiResponse.json();
    const standingsData = data.response?.[0]?.league?.standings?.[0] || [];

    // Cache the new data
    cache.set(leagueId, { data: standingsData, timestamp: now });
    return standingsData;
};

export default async function handler(request: any, response: any) {
    const apiKey = process.env.APIFOOTBALL_KEY;

    if (!apiKey) {
        return response.status(500).json({ error: 'API key not configured on the server.' });
    }

    try {
        const allStandingsPromises = Object.entries(LEAGUE_MAP).map(async ([leagueKey, leagueId]) => {
            const leagueStanding = await fetchStandingForLeague(apiKey, leagueId);
            return leagueStanding.map((team: any) => ({
                rank: team.rank,
                team: team.team.name,
                logo: team.team.logo,
                played: team.all.played,
                won: team.all.win,
                drawn: team.all.draw,
                lost: team.all.lose,
                gf: team.all.goals.for,
                ga: team.all.goals.against,
                gd: team.goalsDiff,
                points: team.points,
                league: leagueKey,
            }));
        });

        const allStandingsArrays = await Promise.all(allStandingsPromises);
        const flattenedStandings = allStandingsArrays.flat();

        return response.status(200).json(flattenedStandings);
    } catch (error: any) {
        console.error('Failed to fetch standings:', error);
        return response.status(502).json([]);
    }
}