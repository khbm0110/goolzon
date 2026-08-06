// Sends real browser push notifications (goal alerts, breaking news)
// to subscribed users — the missing half of "follow a league/club":
// following one saved a preference in the DB, but nothing ever told
// the user anything happened until they came back and checked
// manually. This is what actually closes that loop.
//
// Server-only. Needs VAPID_PUBLIC_KEY/VAPID_PRIVATE_KEY and
// VAPID_SUBJECT (a mailto: or https: URL identifying who's sending —
// required by the Web Push protocol so a push service can contact the
// sender if something's wrong) set in the server environment.
import webPush from 'web-push';
import type { SupabaseClient } from '@supabase/supabase-js';

let configured = false;
function ensureConfigured() {
  if (configured) return;
  const publicKey = process.env.VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT || 'mailto:admin@goolzon.com';
  if (!publicKey || !privateKey) {
    throw new Error('VAPID_PUBLIC_KEY / VAPID_PRIVATE_KEY are not set in the server environment.');
  }
  webPush.setVapidDetails(subject, publicKey, privateKey);
  configured = true;
}

export interface PushPayload {
  title: string;
  body: string;
  url?: string; // opened when the notification is clicked
}

interface SubscriptionRow {
  id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
}

// Sends to a specific set of subscription rows (already fetched by the
// caller — see sendPushToUsers/sendPushToAll below for the common
// cases). Expired/invalid subscriptions (410 Gone / 404) are deleted
// automatically instead of retried forever.
async function sendToSubscriptions(admin: SupabaseClient, subs: SubscriptionRow[], payload: PushPayload) {
  const body = JSON.stringify(payload);
  await Promise.all(
    subs.map(async (sub) => {
      try {
        await webPush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          body
        );
      } catch (err: unknown) {
        const statusCode = (err as { statusCode?: number })?.statusCode;
        if (statusCode === 404 || statusCode === 410) {
          await admin.from('push_subscriptions').delete().eq('id', sub.id);
        }
        // Other errors (rate limits, transient network issues) are
        // swallowed per-subscription — one bad subscription should
        // never stop the rest of a batch from sending.
      }
    })
  );
}

// Breaking news: every subscriber, regardless of what they follow.
export async function sendPushToAll(admin: SupabaseClient, payload: PushPayload) {
  ensureConfigured();
  const { data: subs } = await admin.from('push_subscriptions').select('id, endpoint, p256dh, auth');
  if (subs && subs.length > 0) await sendToSubscriptions(admin, subs, payload);
}

// Targeted: only users following one of the given leagues/teams (goal
// alerts, a followed league's match result, etc). `names` is matched
// against BOTH followed_leagues.league and followed_teams.team_name,
// since a "goal for Al-Hilal" alert should reach someone following
// either the club or the Saudi league.
export async function sendPushToFollowers(admin: SupabaseClient, names: string[], payload: PushPayload) {
  ensureConfigured();
  if (names.length === 0) return;

  const [{ data: byLeague }, { data: byTeam }] = await Promise.all([
    admin.from('followed_leagues').select('user_id').in('league', names),
    admin.from('followed_teams').select('user_id').in('team_name', names),
  ]);
  const userIds = [...new Set([...(byLeague ?? []), ...(byTeam ?? [])].map((r) => r.user_id))];
  if (userIds.length === 0) return;

  const { data: subs } = await admin.from('push_subscriptions').select('id, endpoint, p256dh, auth').in('user_id', userIds);
  if (subs && subs.length > 0) await sendToSubscriptions(admin, subs, payload);
}
