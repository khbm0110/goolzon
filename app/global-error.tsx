'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { AlertTriangle, RotateCw } from 'lucide-react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Unhandled application error:', error);
  }, [error]);

  return (
    <html lang="ar" dir="rtl">
      <body className="bg-[#020617] text-white min-h-screen flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <AlertTriangle size={48} className="text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-black mb-2">حدث خطأ غير متوقع</h1>
          <p className="text-slate-400 text-sm mb-6">
            نعتذر عن الإزعاج — واجه الموقع مشكلة تقنية مؤقتة. جرّب تحديث الصفحة، أو ارجع للرئيسية.
          </p>
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={reset}
              className="flex items-center gap-2 px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg font-bold text-sm transition-colors"
            >
              <RotateCw size={16} /> إعادة المحاولة
            </button>
            <Link href="/" className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg font-bold text-sm transition-colors">
              الرئيسية
            </Link>
          </div>
          {error.digest && <p className="text-[10px] text-slate-600 mt-6">رمز الخطأ: {error.digest}</p>}
        </div>
      </body>
    </html>
  );
}
