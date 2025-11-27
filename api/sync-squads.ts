
import { getSupabase } from '../services/supabaseClient';
import { fetchTeamSquad, fetchTeamCoach } from '../services/apiFootball';
import { ClubProfile, Player } from '../types';

// This is a Vercel Serverless Function, designed to be triggered by Supabase Cron via HTTP.

export default async function handler(request: any, response: any) {
  // --- Security Check ---
  // We expect an Authorization header: "Bearer <CRON_SECRET>"
  const authHeader = request.headers['authorization'];
  const expectedSecret = `Bearer ${process.env.CRON_SECRET}`;

  if (authHeader !== expectedSecret) {
      console.log("Sync Engine: Unauthorized access attempt.");
      return response.status(401).json({ error: 'Unauthorized' });
  }

  // --- Economic Check: Only run during transfer windows for AUTOMATED runs ---
  if (!isWithinTransferWindow()) {
      console.log("Sync Engine: Skipped job, outside of transfer window.");
      return response.status(200).json({ message: "Sync skipped: Not a transfer window." });
  }

  console.log("Sync Engine: Job running within transfer window.");

  const supabase = getSupabase();
  const apiKey = process.env.VITE_APIFOOTBALL_KEY;

  if (!supabase || !apiKey) {
    return response.status(500).json({ error: "Server configuration error: Supabase or API key is missing." });
  }

  try {
    // 1. Fetch all clubs from our database
    const { data: clubs, error: clubsError } = await supabase.from('clubs').select('*');
    if (clubsError) throw clubsError;

    let updatedClubs = 0;
    let totalPlayersSynced = 0;

    // 2. Loop through each club and sync its squad AND coach
    for (const club of (clubs as ClubProfile[])) {
      if (!club.apiFootballId || club.apiFootballId === 0) {
        console.log(`Skipping sync for ${club.name} (no API ID).`);
        continue;
      }
      
      console.log(`Syncing data for ${club.name}...`);
      
      // Fetch both squad and coach in parallel
      const [apiSquad, apiCoach] = await Promise.all([
          fetchTeamSquad(apiKey, club.apiFootballId),
          fetchTeamCoach(apiKey, club.apiFootballId)
      ]);

      const updates: any = {};
      let hasUpdates = false;

      if (apiSquad.length > 0) {
        updates.squad = apiSquad;
        hasUpdates = true;
      }

      if (apiCoach && apiCoach !== club.coach) {
        updates.coach = apiCoach;
        hasUpdates = true;
      }

      if (hasUpdates) {
        const { error: updateError } = await supabase
          .from('clubs')
          .update(updates)
          .eq('id', club.id);

        if (updateError) {
          console.error(`Failed to update data for ${club.name}:`, updateError.message);
        } else {
          updatedClubs++;
          totalPlayersSynced += apiSquad.length;
          console.log(`Successfully synced ${club.name} (Players: ${apiSquad.length}, Coach: ${apiCoach || 'No change'}).`);
        }
      } else {
         console.warn(`No new data returned from API for ${club.name}.`);
      }
    }

    const message = `Sync complete. Updated ${updatedClubs} clubs with a total of ${totalPlayersSynced} players.`;
    console.log(message);
    return response.status(200).json({ message });

  } catch (error: any) {
    console.error("Sync Engine Failure:", error);
    return response.status(500).json({ error: error.message || "An unknown error occurred during sync." });
  }
}

// --- Helper Function to Check Transfer Window ---
function isWithinTransferWindow(): boolean {
  // Read dates from environment variables with fallbacks
  const summerStart = process.env.TRANSFER_WINDOW_SUMMER_START || '07-01'; // July 1st
  const summerEnd = process.env.TRANSFER_WINDOW_SUMMER_END || '09-01';     // Sep 1st
  const winterStart = process.env.TRANSFER_WINDOW_WINTER_START || '01-01'; // Jan 1st
  const winterEnd = process.env.TRANSFER_WINDOW_WINTER_END || '02-01';     // Feb 1st

  const today = new Date();
  const currentDateStr = `${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  const isSummer = currentDateStr >= summerStart && currentDateStr <= summerEnd;
  const isWinter = currentDateStr >= winterStart && currentDateStr <= winterEnd;

  return isSummer || isWinter;
}
