import type { Metadata } from 'next';
import { data } from '@/lib/data';
import ClubDashboardClient from './ClubDashboardClient';

// Per-club title/description/logo so a shared club link shows the real
// club instead of the generic site-wide fallback.
export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const club = await data.getClubById(id);
  if (!club) return {};

  const title = club.nickname ? `${club.name} (${club.nickname})` : club.name;
  const description = `صفحة نادي ${club.name}: التشكيلة، المباريات، الإحصائيات وكل ما يخص النادي.`;

  return {
    title,
    description,
    openGraph: {
      type: 'website',
      title,
      description,
      images: club.logo ? [{ url: club.logo }] : undefined,
    },
  };
}

export default function ClubPage() {
  return <ClubDashboardClient />;
}
