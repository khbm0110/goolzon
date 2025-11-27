import { getSupabase } from '../services/supabaseClient';
import { fetchFinishedFixturesByDate, fetchPlayerStatsForFixture } from '../services/apiFootball';
import { getPerformanceDataApiKey } from '../services/keyManager';
import { useSettings } from '../contexts/SettingsContext';

export default async function handler(request: any, response: any) {
    const supabase = getSupabase();
    const apiKey = getPerformanceDataApiKey();

    // Use a fixed list of league IDs for performance sync to avoid dependency on client-side settings
    const LEAGUE_IDS_FOR_SYNC = '307,39,140,2,135,78,301';

    if (!supabase || !apiKey) {
        return response.status(500).json({ error: "Server configuration error: Supabase or API key is missing." });
    }

    try {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const dateString = yesterday.toISOString().split('T')[0];

        console.log(`Performance Sync: Fetching finished fixtures for ${dateString}`);
        
        const finishedFixtures = await fetchFinishedFixturesByDate(apiKey, dateString, LEAGUE_IDS_FOR_SYNC);

        if (finishedFixtures.length === 0) {
            const message = "Performance Sync: No finished matches found for the target leagues yesterday.";
            console.log(message);
            return response.status(200).json({ message });
        }
        
        console.log(`Performance Sync: Found ${finishedFixtures.length} finished matches. Fetching player stats...`);

        let allPerformances = [];
        for (const fixture of finishedFixtures) {
            const playerStats = await fetchPlayerStatsForFixture(apiKey, fixture.id);
            if (playerStats.length > 0) {
                allPerformances.push(...playerStats);
            }
        }

        if (allPerformances.length > 0) {
            console.log(`Performance Sync: Upserting ${allPerformances.length} player performance records into Supabase.`);
            const { error } = await supabase.from('player_performances').upsert(allPerformances);

            if (error) {
                throw new Error(`Supabase upsert error: ${error.message}`);
            }
        } else {
             console.log(`Performance Sync: No player stats were found for the finished matches.`);
        }

        const message = `Performance Sync complete. Processed ${finishedFixtures.length} matches and synced ${allPerformances.length} player performance records.`;
        console.log(message);
        return response.status(200).json({ message });

    } catch (error: any) {
        console.error("Performance Sync Engine Failure:", error);
        return response.status(500).json({ error: error.message || "An unknown error occurred during performance sync." });
    }
}