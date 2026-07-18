'use client';

import { useEffect, useState } from 'react';
import { BarChart3, Lock } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { data } from '@/lib/data';
import type { Poll } from '@/types/community';

export default function PollWidget() {
  const { currentUser } = useAuth();
  const [poll, setPoll] = useState<Poll | null>(null);
  const [hasVoted, setHasVoted] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    data.getActivePoll().then((p) => {
      setPoll(p);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    if (poll && currentUser) {
      data.hasUserVotedPoll(poll.id, currentUser.id).then(setHasVoted);
    }
  }, [poll, currentUser]);

  async function handleVote(optionId: string) {
    if (!poll || !currentUser || hasVoted) return;
    const updated = await data.votePoll(poll.id, optionId, currentUser.id);
    setPoll(updated);
    setHasVoted(true);
  }

  if (loading || !poll) return null;

  const totalVotes = poll.options.reduce((sum, o) => sum + o.votes, 0);
  const showResults = hasVoted || !currentUser;

  return (
    <div className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-xl overflow-hidden">
      <div className="bg-[var(--bg-surface-2)] px-4 py-3 border-b border-[var(--border)] flex items-center gap-2">
        <BarChart3 size={16} className="text-primary" />
        <h3 className="font-bold text-[var(--fg)] text-sm">استطلاع الرأي</h3>
      </div>
      <div className="p-4">
        <p className="text-[var(--fg-muted)] font-bold text-sm mb-4">{poll.question}</p>

        {!currentUser && (
          <p className="text-xs text-[var(--fg-faint)] flex items-center gap-1 mb-3">
            <Lock size={12} /> سجّل الدخول للتصويت
          </p>
        )}

        <div className="space-y-2">
          {poll.options.map((option) => {
            const pct = totalVotes > 0 ? Math.round((option.votes / totalVotes) * 100) : 0;
            return (
              <button
                key={option.id}
                onClick={() => handleVote(option.id)}
                disabled={!currentUser || hasVoted}
                className="w-full text-right relative overflow-hidden rounded-lg border border-[var(--border)] disabled:cursor-default"
              >
                {showResults && <div className="absolute inset-y-0 right-0 bg-primary/20 transition-all" style={{ width: `${pct}%` }} />}
                <div className="relative flex items-center justify-between px-3 py-2 text-sm">
                  <span className="text-[var(--fg-muted)]">{option.label}</span>
                  {showResults && <span className="text-[var(--fg-subtle)] font-mono text-xs">{pct}%</span>}
                </div>
              </button>
            );
          })}
        </div>

        <p className="text-[10px] text-[var(--fg-faint)] mt-3 text-center">{totalVotes} صوت</p>
      </div>
    </div>
  );
}
