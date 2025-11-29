// This is a Vercel-style serverless function that acts as a Backend-for-Frontend (BFF).
// It fetches live matches from the api-football API, transforms the data,
// and caches it for 1 minute to reduce API calls and improve performance.

const cache = {
  data: null as any,
  timestamp: 0,
  leagueIds: '',
};

// Cache for 1 minute for live scores
const CACHE_TTL = 60 * 1000; 

const COUNTRY_MAP: { [key: string]: string } = {
    'Saudi Arabia': 'السعودية',
    'England': 'الدوري الإنجليزي',
    'Spain': 'الدوري الإسباني',
    'Italy': 'الدوري الإيطالي',
    'Germany': 'الدوري الألماني',
    'World': 'دوري أبطال أوروبا',
    'United Arab Emirates': 'الإمارات'
};

export default async function handler(request: any, response: any) {
  // Vercel populates `request.query` with the query string parameters.
  const { leagues = '' } = request.query;
  const apiKey = process.env.APIFOOTBALL_KEY;

  if (!apiKey) {
    return response.status(500).json({ error: 'API key not configured on the server.' });
  }

  const now = Date.now();
  // Check if a valid cache entry exists for the requested leagues.
  if (cache.data && (now - cache.timestamp < CACHE_TTL) && cache.leagueIds === leagues) {
    response.setHeader('X-Cache-Status', 'HIT');
    return response.status(200).json(cache.data);
  }

  try {
    const today = new Date().toISOString().split('T')[0];
    const apiUrl = `https://v3.football.api-sports.io/fixtures?date=${today}&leagues=${leagues}`;
    
    const apiResponse = await fetch(apiUrl, {
      headers: { 'x-apisports-key': apiKey },
    });

    if (!apiResponse.ok) {
        const errorText = await apiResponse.text();
        console.error("API Football Error:", errorText);
        throw new Error(`API Football responded with status ${apiResponse.status}`);
    }

    const data = await apiResponse.json();

    const matches = (data.response || []).map((match: any) => ({
      id: match.fixture.id.toString(),
      homeTeam: match.teams.home.name,
      homeLogo: match.teams.home.logo,
      awayTeam: match.teams.away.name,
      awayLogo: match.teams.away.logo,
      scoreHome: match.goals.home,
      scoreAway: match.goals.away,
      time: match.fixture.status.short === 'FT' 
        ? 'انتهت' 
        : match.fixture.status.short === 'HT' 
        ? 'استراحة' 
        : match.fixture.status.elapsed 
        ? `${match.fixture.status.elapsed}'` 
        : new Date(match.fixture.date).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit', hour12: false }),
      status: ['1H', 'HT', '2H', 'ET', 'BT', 'P', 'LIVE', 'INT'].includes(match.fixture.status.short) 
        ? 'LIVE' 
        : ['TBD', 'NS'].includes(match.fixture.status.short) 
        ? 'UPCOMING' 
        : 'FINISHED',
      league: match.league.name,
      country: COUNTRY_MAP[match.league.country] || match.league.country,
    }));
    
    // Update cache with new data
    cache.data = matches;
    cache.timestamp = now;
    cache.leagueIds = leagues;

    response.setHeader('X-Cache-Status', 'MISS');
    return response.status(200).json(matches);
  } catch (error: any) {
    console.error('Failed to fetch matches:', error);
    // In case of an error, return an empty array but don't cache it
    return response.status(502).json([]);
  }
}