
import { Match, Category, MatchDetails, Standing, MatchEvent } from '../types';

const BASE_URL = 'https://v3.football.api-sports.io';

export const LEAGUE_MAPPING: Record<number, Category> = {
  // Major European
  2: Category.CHAMPIONS_LEAGUE,
  39: Category.ENGLAND,
  140: Category.SPAIN,
  135: Category.ITALY,
  78: Category.GERMANY,
  // Gulf
  307: Category.SAUDI,
  301: Category.UAE,
  306: Category.QATAR,
  312: Category.KUWAIT,
  315: Category.BAHRAIN,
  318: Category.OMAN
};

const categoryToKey = (cat: Category): string => {
    const mapping: Partial<Record<Category, string>> = {
        [Category.SAUDI]: 'SAUDI',
        [Category.UAE]: 'UAE',
        [Category.QATAR]: 'QATAR',
        [Category.KUWAIT]: 'KUWAIT',
        [Category.OMAN]: 'OMAN',
        [Category.BAHRAIN]: 'BAHRAIN',
        [Category.ENGLAND]: 'ENGLAND',
        [Category.SPAIN]: 'SPAIN',
        [Category.ITALY]: 'ITALY',
        [Category.GERMANY]: 'GERMANY',
    };
    return mapping[cat] || 'GENERAL';
};


// Helper to map API status to our internal status
const getStatus = (shortStatus: string): 'UPCOMING' | 'LIVE' | 'FINISHED' => {
  const live = ['1H', 'HT', '2H', 'ET', 'BT', 'P', 'LIVE'];
  const finished = ['FT', 'AET', 'PEN'];
  
  if (live.includes(shortStatus)) return 'LIVE';
  if (finished.includes(shortStatus)) return 'FINISHED';
  return 'UPCOMING';
};

const getHeaders = (apiKey: string) => ({
  'x-apisports-key': apiKey,
});

export const fetchLiveMatches = async (apiKey: string, leagueIds: string): Promise<Match[]> => {
  if (!apiKey) return [];

  const headers = getHeaders(apiKey);
  const today = new Date().toISOString().split('T')[0];
  // Safe parsing of league IDs
  const targetIds = (leagueIds || '').split(',').map(id => parseInt(id.trim())).filter(n => !isNaN(n));
  
  try {
    const response = await fetch(`${BASE_URL}/fixtures?date=${today}&timezone=Asia/Riyadh`, { headers });
    
    if (!response.ok) {
        console.warn(`API Error ${response.status}: ${await response.text()}`);
        return [];
    }

    const data = await response.json();
    if (!data.response || !Array.isArray(data.response)) return [];

    return data.response
      .filter((item: any) => {
         // Filter by configured leagues if provided, else filter by known Gulf leagues
         if (targetIds.length > 0) return targetIds.includes(item.league.id);
         return LEAGUE_MAPPING[item.league.id] !== undefined;
      })
      .map((item: any) => {
        const category = LEAGUE_MAPPING[item.league.id] || Category.SAUDI;
        return {
          id: String(item.fixture.id),
          homeTeam: item.teams.home.name,
          homeLogo: item.teams.home.logo,
          awayTeam: item.teams.away.name,
          awayLogo: item.teams.away.logo,
          scoreHome: item.goals.home,
          scoreAway: item.goals.away,
          time: getStatus(item.fixture.status.short) === 'LIVE' 
                ? `${item.fixture.status.elapsed}'` 
                : new Date(item.fixture.date).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' }),
          status: getStatus(item.fixture.status.short),
          league: item.league.name,
          country: category
        };
      });

  } catch (e) {
    console.error("Failed to fetch matches:", e);
    return [];
  }
};

export const fetchFixtureDetails = async (apiKey: string, fixtureId: string): Promise<MatchDetails | null> => {
    if (!apiKey || !fixtureId) return null;

    try {
        const response = await fetch(`${BASE_URL}/fixtures?id=${fixtureId}`, { headers: getHeaders(apiKey) });
        if (!response.ok) return null;
        
        const data = await response.json();
        const fixture = data.response?.[0];

        if (!fixture) return null;

        // Map Stats
        const statsRaw = fixture.statistics || [];
        const homeStats = statsRaw[0]?.statistics || [];
        const awayStats = statsRaw[1]?.statistics || [];

        const getStat = (arr: any[], type: string) => {
            const item = arr.find((s: any) => s.type === type);
            // Handle various return types (null, string, number)
            const val = item?.value;
            if (val === null || val === undefined) return 0;
            if (typeof val === 'string') return parseInt(val.replace('%', ''));
            return val;
        };

        const stats = {
            possession: getStat(homeStats, "Ball Possession") || 50,
            shotsHome: getStat(homeStats, "Total Shots"),
            shotsAway: getStat(awayStats, "Total Shots"),
            shotsOnTargetHome: getStat(homeStats, "Shots on Goal"),
            shotsOnTargetAway: getStat(awayStats, "Shots on Goal"),
            cornersHome: getStat(homeStats, "Corner Kicks"),
            cornersAway: getStat(awayStats, "Corner Kicks"),
        };

        // Map Lineups
        const lineups = {
            home: fixture.lineups?.[0]?.startXI?.map((p: any) => p.player.name) || [],
            away: fixture.lineups?.[1]?.startXI?.map((p: any) => p.player.name) || [],
        };

        // Map Events
        const events: MatchEvent[] = (fixture.events || []).map((e: any) => ({
            time: `${e.time.elapsed}'`,
            team: e.team.id === fixture.teams.home.id ? 'HOME' : 'AWAY',
            type: e.type === 'Goal' ? 'GOAL' : e.detail === 'Yellow Card' ? 'YELLOW' : e.detail === 'Red Card' ? 'RED' : 'SUB',
            player: e.player.name
        }));

        return {
            stats,
            lineups,
            events,
            summary: fixture.fixture.status.long
        };

    } catch (e) {
        console.error("Failed to fetch fixture details:", e);
        return null;
    }
};

export const fetchStandings = async (apiKey: string, leagueIds: string): Promise<Standing[]> => {
    if (!apiKey) return [];
    
    // Safe parsing of league IDs
    const targetIds = (leagueIds || '').split(',').map(s => parseInt(s.trim())).filter(n => !isNaN(n));
    if (targetIds.length === 0) return [];

    const headers = getHeaders(apiKey);
    const currentYear = new Date().getFullYear();

    // Helper: Try to fetch a specific league season
    const fetchLeagueSeason = async (leagueId: number, season: number) => {
         try {
            const res = await fetch(`${BASE_URL}/standings?league=${leagueId}&season=${season}`, { headers });
            if (!res.ok) return null;
            const json = await res.json();
            return json.response?.[0]?.league?.standings?.[0]; // API-Football returns nested arrays for standings
         } catch { return null; }
    };

    try {
        let allStandings: Standing[] = [];

        for (const id of targetIds) {
            // Priority 1: Try current year (e.g., 2025)
            let rawData = await fetchLeagueSeason(id, currentYear);
            
            // Priority 2: Try previous year (e.g., 2024 - commonly the active season for 24/25)
            if (!rawData || rawData.length === 0) {
                rawData = await fetchLeagueSeason(id, currentYear - 1);
            }

            const category = LEAGUE_MAPPING[id];
            if (rawData && category) {
                const leagueKey = categoryToKey(category);

                // Map the data
                const mapped = rawData.map((item: any) => ({
                    rank: item.rank,
                    team: item.team.name,
                    logo: item.team.logo,
                    played: item.all.played,
                    won: item.all.win,
                    drawn: item.all.draw,
                    lost: item.all.lose,
                    gf: item.all.goals.for,
                    ga: item.all.goals.against,
                    gd: item.goalsDiff,
                    points: item.points,
                    league: leagueKey
                }));
                allStandings = [...allStandings, ...mapped];
            }
        }
        
        return allStandings;

    } catch (e) {
        console.error("Failed to fetch standings:", e);
        return [];
    }
};

export const fetchTeamSquad = async (apiKey: string, teamId: number): Promise<any[]> => {
    if (!apiKey || !teamId) return [];
    const headers = getHeaders(apiKey);
    
    try {
        const response = await fetch(`${BASE_URL}/players/squads?team=${teamId}`, { headers });
        if (!response.ok) {
            console.error(`API-Football error for team ${teamId}: ${response.status}`);
            return [];
        }
        const data = await response.json();
        if (!data.response?.[0]?.players) return [];

        const posMap: Record<string, any> = {
            'Goalkeeper': 'GK',
            'Defender': 'DEF',
            'Midfielder': 'MID',
            'Attacker': 'FWD'
        };

        return data.response[0].players.map((p: any) => ({
            id: `apif-${p.id}`,
            apiFootballId: p.id, // Storing the numeric API ID is crucial
            name: p.name,
            number: p.number || 0,
            position: posMap[p.position] || 'MID',
            rating: 75, // Default rating, can be customized later
            image: p.photo,
            nationality: p.nationality || '', 
            stats: { pac: 70, sho: 70, pas: 70, dri: 70, def: 50, phy: 60 } // Default stats
        }));
    } catch (e) {
        console.error(`Failed to fetch squad for team ${teamId}:`, e);
        return [];
    }
};

export const fetchTeamCoach = async (apiKey: string, teamId: number): Promise<string | null> => {
    if (!apiKey || !teamId) return null;
    const headers = getHeaders(apiKey);
    
    try {
        const response = await fetch(`${BASE_URL}/coachs?team=${teamId}`, { headers });
        if (!response.ok) return null;
        
        const data = await response.json();
        // Return the name of the first coach found (usually the current head coach)
        return data.response?.[0]?.name || null;
    } catch (e) {
        console.error(`Failed to fetch coach for team ${teamId}:`, e);
        return null;
    }
};

export const fetchFinishedFixturesByDate = async (apiKey: string, date: string, leagueIds: string): Promise<{id: number, homeTeamId: number, awayTeamId: number}[]> => {
    if (!apiKey) return [];
    const headers = getHeaders(apiKey);
    const targetIds = (leagueIds || '').split(',').map(id => parseInt(id.trim())).filter(n => !isNaN(n));
    if (targetIds.length === 0) return [];
    
    try {
        const response = await fetch(`${BASE_URL}/fixtures?date=${date}&status=FT`, { headers });
        if (!response.ok) return [];
        const data = await response.json();
        if (!data.response) return [];
        
        return data.response
            .filter((f: any) => targetIds.includes(f.league.id))
            .map((f: any) => ({
                id: f.fixture.id,
                homeTeamId: f.teams.home.id,
                awayTeamId: f.teams.away.id
            }));
    } catch (e) {
        console.error('Failed to fetch finished fixtures:', e);
        return [];
    }
};

export const fetchPlayerStatsForFixture = async (apiKey: string, fixtureId: number): Promise<any[]> => {
    if (!apiKey) return [];
    const headers = getHeaders(apiKey);

    try {
        const response = await fetch(`${BASE_URL}/fixtures/players?fixture=${fixtureId}`, { headers });
        if (!response.ok) return [];
        const data = await response.json();
        if (!data.response) return [];

        const performances: any[] = [];
        for (const team of data.response) {
            for (const player of team.players) {
                const stats = player.statistics[0];
                performances.push({
                    match_api_id: fixtureId,
                    player_api_id: player.player.id,
                    team_api_id: team.team.id,
                    minutes: stats.games.minutes,
                    rating: parseFloat(stats.games.rating) || 0,
                    goals: stats.goals.total,
                    assists: stats.goals.assists,
                    yellow: stats.cards.yellow,
                    red: stats.cards.red,
                });
            }
        }
        return performances;
    } catch (e) {
        console.error(`Failed to fetch player stats for fixture ${fixtureId}:`, e);
        return [];
    }
};