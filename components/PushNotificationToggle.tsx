'use client';

import { useEffect, useState } from 'react';
import { Bell, BellOff, BellRing } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

// Converts the VAPID public key (base64url, from the server) into the
// Uint8Array format pushManager.subscribe() requires. Standard
// boilerplate for the Web Push API — there's no built-in helper for
// this conversion.
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}

type Status = 'unsupported' | 'default' | 'subscribed' | 'denied' | 'loading';

export default function PushNotificationToggle() {
  const { currentUser } = useAuth();
  const [status, setStatus] = useState<Status>('default');

  useEffect(() => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      setStatus('unsupported');
      return;
    }
    if (Notification.permission === 'denied') {
      setStatus('denied');
      return;
    }
    navigator.serviceWorker.ready.then((reg) =>
      reg.pushManager.getSubscription().then((sub) => setStatus(sub ? 'subscribed' : 'default'))
    );
  }, []);

  async function subscribe() {
    const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    if (!publicKey) {
      console.error('NEXT_PUBLIC_VAPID_PUBLIC_KEY is not set.');
      return;
    }
    setStatus('loading');
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      setStatus(permission === 'denied' ? 'denied' : 'default');
      return;
    }

    const reg = await navigator.serviceWorker.ready;
    const sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      // TS 5.7+'s stricter Uint8Array/ArrayBufferLike typing rejects
      // this even though it's a perfectly valid BufferSource at
      // runtime (a plain Uint8Array backed by a regular ArrayBuffer) —
      // the PushManager Web API type just hasn't caught up.
      applicationServerKey: urlBase64ToUint8Array(publicKey) as BufferSource,
    });

    const json = sub.toJSON();
    await fetch('/api/push/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ endpoint: json.endpoint, keys: json.keys }),
    });
    setStatus('subscribed');
  }

  async function unsubscribe() {
    setStatus('loading');
    const reg = await navigator.serviceWorker.ready;
    const sub = await reg.pushManager.getSubscription();
    if (sub) {
      await fetch('/api/push/unsubscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ endpoint: sub.endpoint }),
      });
      await sub.unsubscribe();
    }
    setStatus('default');
  }

  // Notifications are tied to a signed-in user (so they can be
  // targeted by followed leagues/teams) — nothing to show when logged
  // out, and nothing to show if the browser can't do push at all.
  if (!currentUser || status === 'unsupported') return null;

  if (status === 'denied') {
    return (
      <div className="flex items-center gap-2 text-sm text-[var(--fg-faint)]">
        <BellOff size={16} />
        الإشعارات محظورة من إعدادات المتصفح
      </div>
    );
  }

  if (status === 'subscribed') {
    return (
      <button
        onClick={unsubscribe}
        className="flex items-center gap-2 text-sm font-bold text-primary hover:opacity-80 transition-opacity"
      >
        <BellRing size={16} />
        الإشعارات مفعّلة
      </button>
    );
  }

  return (
    <button
      onClick={subscribe}
      disabled={status === 'loading'}
      className="flex items-center gap-2 text-sm font-bold text-[var(--fg-muted)] hover:text-[var(--fg)] transition-colors disabled:opacity-50"
    >
      <Bell size={16} />
      {status === 'loading' ? 'جارٍ التفعيل...' : 'فعّل الإشعارات'}
    </button>
  );
}
