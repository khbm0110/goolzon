'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { AlertTriangle, RotateCw } from 'lucide-react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Page error:', error);
  }, [error]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <AlertTriangle size={48} className="text-red-500 mx-auto mb-4" />
        <h1 className="text-2xl font-black text-[var(--fg)] mb-2">حدث خطأ بهذا القسم</h1>
        <p className="text-[var(--fg-subtle)] text-sm mb-6">
          نعتذر عن الإزعاج — واجهنا مشكلة تقنية مؤقتة. جرّب تحديث الصفحة، أو ارجع للرئيسية.
        </p>
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={reset}
            className="flex items-center gap-2 px-5 py-2.5 bg-primary hover:bg-emerald-600 text-white rounded-lg font-bold text-sm transition-colors"
          >
            <RotateCw size={16} /> إعادة المحاولة
          </button>
          <Link href="/" className="px-5 py-2.5 bg-[var(--bg-surface-2)] hover:bg-[var(--bg-surface-3)] text-[var(--fg)] rounded-lg font-bold text-sm transition-colors">
            الرئيسية
          </Link>
        </div>
        {error.digest && <p className="text-[10px] text-[var(--fg-faint)] mt-6">رمز الخطأ: {error.digest}</p>}
      </div>
    </div>
  );
}
