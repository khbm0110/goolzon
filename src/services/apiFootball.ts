import { Match, MatchDetails, Standing } from '../types';
import { MOCK_MATCHES, MOCK_STANDINGS } from '../constants';

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const fetchLiveMatches = async (apiKey: string, leagueIds: string): Promise<Match[]> => {
  await sleep(500); // Simulate network latency
  console.log('[MOCK] Fetching live matches...');
  return MOCK_MATCHES;
};

export const fetchStandings = async (apiKey: string, leagueIds: string): Promise<Standing[]> => {
  await sleep(500);
  console.log('[MOCK] Fetching standings...');
  return MOCK_STANDINGS;
};

export const fetchFixtureDetails = async (apiKey: string, fixtureId: string): Promise<MatchDetails | null> => {
  await sleep(800);
  console.log(`[MOCK] Fetching details for fixture: ${fixtureId}`);
  
  // Return generic mock details for any match
  return {
    stats: {
      possession: 55,
      shotsHome: 12,
      shotsAway: 8,
      shotsOnTargetHome: 5,
      shotsOnTargetAway: 3,
      cornersHome: 6,
      cornersAway: 4,
    },
    lineups: {
      home: ['الحارس', 'مدافع أيمن', 'مدافع أيسر', 'قلب دفاع 1', 'قلب دفاع 2', 'وسط 1', 'وسط 2', 'وسط 3', 'مهاجم 1', 'مهاجم 2', 'مهاجم 3'],
      away: ['الحارس', 'مدافع أيمن', 'مدافع أيسر', 'قلب دفاع 1', 'قلب دفاع 2', 'وسط 1', 'وسط 2', 'وسط 3', 'مهاجم 1', 'مهاجم 2', 'مهاجم 3'],
    },
    events: [
      { time: '12\'', team: 'HOME', type: 'GOAL', player: 'المهاجم الهداف' },
      { time: '34\'', team: 'AWAY', type: 'YELLOW', player: 'لاعب الوسط' },
      { time: '67\'', team: 'HOME', type: 'SUB', player: 'لاعب بديل' },
    ],
    summary: 'هذه مباراة تجريبية ببيانات وهمية لغرض العرض.',
  };
};