'use client';

import { useEffect, useState } from 'react';
import { Target, Trophy, Lock } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { data } from '@/lib/data';
import type { Match } from '@/types';
import type { Prediction } from '@/types/community';

export default function MatchPrediction({ match }: { match: Match }) {
  const { currentUser } = useAuth();
  const [prediction, setPrediction] = useState<Prediction | null | undefined>(undefined);
  const [home, setHome] = useState('');
  const [away, setAway] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!currentUser) {
      setPrediction(null);
      return;
    }
    data.getPredictionForUserMatch(match.id, currentUser.id).then((p) => {
      setPrediction(p);
      if (p) {
        setHome(String(p.predictedHome));
        setAway(String(p.predictedAway));
      }
    });
  }, [match.id, currentUser]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!currentUser || home === '' || away === '') return;
    setSaving(true);
    const newPrediction: Prediction = {
      matchId: match.id,
      userId: currentUser.id,
      username: currentUser.username,
      predictedHome: Number(home),
      predictedAway: Number(away),
    };
    await data.submitPrediction(newPrediction);
    setPrediction(newPrediction);
    setSaving(false);
  }

  if (!currentUser) {
    return (
      <div className="flex items-center gap-2 text-xs text-[var(--fg-faint)] px-4 pb-3">
        <Lock size={12} /> سجّل الدخول لتوقع نتيجة هذه المباراة
      </div>
    );
  }

  if (match.status === 'LIVE') {
    return <div className="text-xs text-[var(--fg-faint)] px-4 pb-3">التوقعات مقفلة — المباراة جارية الآن</div>;
  }

  if (match.status === 'FINISHED') {
    if (!prediction) return null;
    const isExact = prediction.predictedHome === match.scoreHome && prediction.predictedAway === match.scoreAway;
    const actualResult = Math.sign((match.scoreHome ?? 0) - (match.scoreAway ?? 0));
    const predictedResult = Math.sign(prediction.predictedHome - prediction.predictedAway);
    const points = isExact ? 3 : actualResult === predictedResult ? 1 : 0;

    return (
      <div className="flex items-center justify-between px-4 pb-3 text-xs">
        <span className="text-[var(--fg-subtle)]">توقعك: {prediction.predictedHome} - {prediction.predictedAway}</span>
        <span className={`font-bold flex items-center gap-1 ${points > 0 ? 'text-emerald-400' : 'text-[var(--fg-faint)]'}`}>
          <Trophy size={12} /> +{points} نقطة
        </span>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-2 px-4 pb-3">
      <Target size={14} className="text-primary flex-shrink-0" />
      <input
        type="number"
        min={0}
        value={home}
        onChange={(e) => setHome(e.target.value)}
        placeholder="0"
        className="w-12 bg-[var(--bg-surface-2)] border border-[var(--border)] rounded text-center text-[var(--fg)] text-sm py-1"
      />
      <span className="text-[var(--fg-faint)]">-</span>
      <input
        type="number"
        min={0}
        value={away}
        onChange={(e) => setAway(e.target.value)}
        placeholder="0"
        className="w-12 bg-[var(--bg-surface-2)] border border-[var(--border)] rounded text-center text-[var(--fg)] text-sm py-1"
      />
      <button type="submit" disabled={saving} className="text-xs font-bold text-primary hover:text-emerald-400 disabled:opacity-50 mr-auto">
        {prediction ? 'تحديث التوقع' : 'توقّع النتيجة'}
      </button>
    </form>
  );
}
