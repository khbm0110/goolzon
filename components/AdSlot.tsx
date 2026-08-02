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

  // Browsers ignore <script> tags injected via innerHTML/cloneNode, so ad
  // embed codes (which almost always include one) need to be re-created
  // manually to actually execute. Crucially this must walk the WHOLE tree,
  // not just top-level children: Google AdSense codes happen to be two
  // flat top-level siblings (<ins> + <script>), which is why they worked
  // before — but most other ad networks wrap their <script> inside a
  // container <div> (e.g. `<div id="ad-123"><script>...</script></div>`),
  // and a nested script like that was being silently cloned without ever
  // running.
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    el.innerHTML = '';
    if (!slot?.code) return;

    const temp = document.createElement('div');
    temp.innerHTML = slot.code;
    el.appendChild(temp);

    // Replace every <script> anywhere in the tree (any depth) with a
    // freshly created one — only scripts made via createElement +
    // inserted through a real DOM method (appendChild/replaceWith) run.
    temp.querySelectorAll('script').forEach((oldScript) => {
      const newScript = document.createElement('script');
      Array.from(oldScript.attributes).forEach((attr) => newScript.setAttribute(attr.name, attr.value));
      newScript.textContent = oldScript.textContent;
      oldScript.replaceWith(newScript);
    });
  }, [slot]);

  if (!masterEnabled || !slot) return null;

  return (
    <div className="w-full flex justify-center my-4 overflow-hidden" data-ad-slot={slot.id} data-ad-placement={placement}>
      <div ref={containerRef} className="w-full flex justify-center" />
    </div>
  );
}
