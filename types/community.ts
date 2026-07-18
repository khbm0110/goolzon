export interface Prediction {
  matchId: string;
  userId: string;
  username: string;
  predictedHome: number;
  predictedAway: number;
  points?: number; // filled in once the match is FINISHED
}

// These three mirror what a real provider like API-Football would return.
// They're intentionally separate from types.ts (Player/ClubProfile) so
// swapping in real API data later just means the fetch layer starts
// returning these shapes — no UI changes needed.
export interface TransferRecord {
  season: string; // e.g. "2023/2024"
  from: string;
  to: string;
  type: 'permanent' | 'loan' | 'free';
}

export interface InjuryRecord {
  date: string;
  type: string;
  status: 'active' | 'recovered';
  expectedReturn?: string;
}

export interface AwardRecord {
  title: string;
  season: string;
}

export interface CoachCareerEntry {
  club: string;
  from: string;
  to?: string; // undefined = current
  achievement?: string;
}

export interface PollOption {
  id: string;
  label: string;
  votes: number;
}

export interface Poll {
  id: string;
  question: string;
  options: PollOption[];
}

export interface LeaderboardEntry {
  userId: string;
  username: string;
  name: string;
  avatar?: string;
  totalPoints: number;
  predictionsCount: number;
}
