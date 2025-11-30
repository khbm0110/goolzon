import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';

export const formatTimeAgo = (dateString: string): string => {
  try {
    return formatDistanceToNow(new Date(dateString), { addSuffix: true, locale: ar });
  } catch (error) {
    console.warn('Invalid date provided to formatTimeAgo:', dateString);
    return 'منذ زمن';
  }
};
