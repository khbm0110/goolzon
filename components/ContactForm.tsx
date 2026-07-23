'use client';

import { useState } from 'react';
import { Loader2, CheckCircle2 } from 'lucide-react';
import { getErrorMessage } from '@/lib/utils/errors';

export default function ContactForm() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'sent' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus('loading');
    setErrorMsg('');
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, message }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'حدث خطأ ما.');
      setStatus('sent');
      setName('');
      setEmail('');
      setMessage('');
    } catch (err: unknown) {
      setStatus('error');
      setErrorMsg(getErrorMessage(err));
    }
  }

  if (status === 'sent') {
    return (
      <div className="flex flex-col items-center gap-3 py-12 text-center">
        <CheckCircle2 className="text-primary" size={40} />
        <p className="text-[var(--fg)] font-bold">تم إرسال رسالتك بنجاح، شكراً لتواصلك معنا.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-bold text-[var(--fg)] mb-1">الاسم</label>
        <input
          type="text"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full rounded-lg border border-[var(--border-subtle)] bg-transparent px-4 py-2 text-[var(--fg)] focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>
      <div>
        <label className="block text-sm font-bold text-[var(--fg)] mb-1">البريد الإلكتروني</label>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded-lg border border-[var(--border-subtle)] bg-transparent px-4 py-2 text-[var(--fg)] focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>
      <div>
        <label className="block text-sm font-bold text-[var(--fg)] mb-1">رسالتك</label>
        <textarea
          required
          rows={5}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className="w-full rounded-lg border border-[var(--border-subtle)] bg-transparent px-4 py-2 text-[var(--fg)] focus:outline-none focus:ring-2 focus:ring-primary resize-none"
        />
      </div>

      {status === 'error' && <p className="text-sm text-red-500">{errorMsg}</p>}

      <button
        type="submit"
        disabled={status === 'loading'}
        className="w-full flex items-center justify-center gap-2 rounded-lg bg-primary text-white font-bold py-2.5 hover:opacity-90 transition-opacity disabled:opacity-60"
      >
        {status === 'loading' && <Loader2 className="animate-spin" size={18} />}
        إرسال
      </button>
    </form>
  );
}
