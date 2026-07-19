'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Shield } from 'lucide-react';

interface TeamLogoProps {
  src: string;
  alt: string;
  className?: string;
}

export default function TeamLogo({ src, alt, className = 'w-6 h-6' }: TeamLogoProps) {
  const [error, setError] = useState(false);

  if (error || !src) {
    return (
      <div className={`${className} bg-[var(--bg-surface-2)] rounded-full flex items-center justify-center text-[var(--fg-faint)] border border-[var(--border)]`}>
        <Shield size="60%" />
      </div>
    );
  }

  return (
    <div className={`${className} relative`}>
      <Image src={src} alt={alt} fill sizes="64px" className="object-contain" onError={() => setError(true)} />
    </div>
  );
}
