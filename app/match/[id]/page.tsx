import type { Metadata } from 'next';
import { data } from '@/lib/data';
import MatchCenterClient from './MatchCenterClient';

// Per-match title/description so a shared match link shows the actual
// fixture ("الهلال × النصر") instead of the generic site-wide fallback.
// The page itself stays a client component (MatchCenterClient) since it
// needs live polling/state — this server wrapper only handles metadata.
export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const match = await data.getMatchById(id);
  if (!match) return {};

  const title = `${match.homeTeam} × ${match.awayTeam}`;
  const description = match.status === 'FINISHED'
    ? `نتيجة مباراة ${match.homeTeam} و${match.awayTeam}: ${match.scoreHome ?? '-'} - ${match.scoreAway ?? '-'}`
    : `تابع مباراة ${match.homeTeam} و${match.awayTeam} في ${match.league ?? 'الدوري'} لحظة بلحظة.`;

  return {
    title,
    description,
    openGraph: {
      type: 'website',
      title,
      description,
      images: match.homeLogo ? [{ url: match.homeLogo }] : undefined,
    },
  };
}

export default function MatchPage() {
  return <MatchCenterClient />;
}
