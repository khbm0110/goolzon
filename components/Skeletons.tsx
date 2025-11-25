import React from 'react';

export const NewsCardSkeleton: React.FC<{ featured?: boolean }> = ({ featured = false }) => {
  return (
    <div className={`bg-slate-900 rounded-xl border border-slate-800 overflow-hidden ${featured ? 'md:col-span-2 md:row-span-2' : ''}`}>
      <div className={`bg-slate-800 animate-pulse ${featured ? 'h-64 md:h-96' : 'h-32 md:h-48'}`} />
      <div className="p-5 space-y-4">
        <div className="h-4 bg-slate-800 rounded w-1/4 animate-pulse" />
        <div className="space-y-2">
           <div className={`h-6 bg-slate-800 rounded animate-pulse ${featured ? 'w-3/4' : 'w-full'}`} />
           <div className={`h-6 bg-slate-800 rounded animate-pulse ${featured ? 'w-1/2' : 'w-2/3'}`} />
        </div>
        {featured && (
             <div className="space-y-2 pt-2">
                <div className="h-3 bg-slate-800 rounded w-full animate-pulse" />
                <div className="h-3 bg-slate-800 rounded w-5/6 animate-pulse" />
             </div>
        )}
        <div className="flex justify-between pt-2">
            <div className="h-3 bg-slate-800 rounded w-16 animate-pulse" />
            <div className="h-3 bg-slate-800 rounded w-8 animate-pulse" />
        </div>
      </div>
    </div>
  );
};

export const MatchRowSkeleton: React.FC = () => {
    return (
        <div className="p-3 border-b border-slate-800/50 flex items-center justify-between">
            <div className="flex items-center gap-2 w-1/3">
                 <div className="w-6 h-6 rounded-full bg-slate-800 animate-pulse" />
                 <div className="h-3 w-16 bg-slate-800 rounded animate-pulse" />
            </div>
            <div className="w-12 h-6 bg-slate-800 rounded animate-pulse" />
            <div className="flex items-center gap-2 w-1/3 flex-row-reverse">
                 <div className="w-6 h-6 rounded-full bg-slate-800 animate-pulse" />
                 <div className="h-3 w-16 bg-slate-800 rounded animate-pulse" />
            </div>
        </div>
    )
}
