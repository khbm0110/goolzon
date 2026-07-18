'use client';

import { useEffect, useRef, useState } from 'react';
import { data } from '@/lib/data';
import type { AdSlot as AdSlotType, AdPlacement, AdsGlobalSettings } from '@/types';

// Small module-level cache so multiple <AdSlot/> instances on the same
// page share a single fetch instead of each hitting the DB separately.
let slotsPromise: Promise<AdSlotType[]> | null = null;
let globalPromise: Promise<AdsGlobalSettings> | null = null;

export default function AdSlot({ placement, page }: { placement: AdPlacement; page: string }) {
  const [slot, setSlot] = useState<AdSlotType | null>(null);
  const [masterEnabled, setMasterEnabled] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let active = true;
    if (!slotsPromise) slotsPromise = data.getAdSlots();
    if (!globalPromise) globalPromise = data.getAdsGlobalSettings();

    Promise.all([slotsPromise, globalPromise]).then(([slots, global]) => {
      if (!active) return;
      setMasterEnabled(global.masterEnabled);
      const today = new Date().toISOString().slice(0, 10);
      const match = slots.find(
        (s) =>
          s.placement === placement &&
          s.enabled &&
          (s.pages.includes('all') || s.pages.includes(page)) &&
          (!s.startDate || s.startDate <= today) &&
          (!s.endDate || s.endDate >= today)
      );
      setSlot(match || null);
    });

    return () => {
      active = false;
    };
  }, [placement, page]);

  // Browsers ignore <script> tags injected via innerHTML, so ad embed
  // codes (which almost always include one) need to be re-created
  // manually to actually execute.
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    el.innerHTML = '';
    if (!slot?.code) return;

    const temp = document.createElement('div');
    temp.innerHTML = slot.code;
    Array.from(temp.childNodes).forEach((node) => {
      if (node.nodeName === 'SCRIPT') {
        const script = document.createElement('script');
        Array.from((node as HTMLScriptElement).attributes).forEach((attr) => script.setAttribute(attr.name, attr.value));
        script.textContent = (node as HTMLScriptElement).textContent;
        el.appendChild(script);
      } else {
        el.appendChild(node.cloneNode(true));
      }
    });
  }, [slot]);

  if (!masterEnabled || !slot) return null;

  return (
    <div className="w-full flex justify-center my-4 overflow-hidden" data-ad-slot={slot.id} data-ad-placement={placement}>
      <div ref={containerRef} className="w-full flex justify-center" />
    </div>
  );
}
