import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';

export const formatTimeAgo = (dateString: string): string => {
  try {
    return formatDistanceToNow(new Date(dateString), { addSuffix: true, locale: ar });
  } catch {
    console.warn('Invalid date provided to formatTimeAgo:', dateString);
    return 'منذ زمن';
  }
};

// Compares calendar day (not exact time) between two dates — used for
// "matches today / tomorrow / yesterday" filtering across the site.
export function isSameCalendarDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

export function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}
