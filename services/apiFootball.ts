import { Match, MatchDetails, Standing } from '../types';

// These functions now call the Backend-for-Frontend (BFF) serverless functions
// located in the /api directory, which securely handle the API key and caching.

export const fetchLiveMatches = async (apiKey: string, leagueIds: string): Promise<Match[]> => {
  try {
    const response = await fetch(`/api/matches?leagues=${leagueIds}`);
    if (!response.ok) {
      console.error('Failed to fetch live matches from BFF');
      return [];
    }
    return response.json();
  } catch (error) {
    console.error('Error fetching live matches:', error);
    return [];
  }
};

export const fetchFixtureDetails = async (apiKey: string, fixtureId: string): Promise<MatchDetails | null> => {
    try {
        const response = await fetch(`/api/fixture-details?id=${fixtureId}`);
        if (!response.ok) {
            console.error(`Failed to fetch fixture details for ${fixtureId}`);
            return null;
        }
        return response.json();
    } catch (error) {
        console.error(`Error fetching fixture details for ${fixtureId}:`, error);
        return null;
    }
};

export const fetchStandings = async (apiKey: string, leagueIds: string): Promise<Standing[]> => {
    try {
        const response = await fetch('/api/standings');
        if (!response.ok) {
            console.error('Failed to fetch standings from BFF');
            return [];
        }
        return response.json();
    } catch (error) {
        console.error('Error fetching standings:', error);
        return [];
    }
};
