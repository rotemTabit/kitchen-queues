import { useState, useEffect, useCallback } from 'react';

const PencilIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
  </svg>
);

const FOOTER_IDS = ['ft_tbl','ft_r1','ft_r2','ft_r3','ft_ta','ft_srv','ft_time','ft_bname','main_s'];
const HEADER_IDS = ['bon_name','hdr_tbl','ta_r','ta_h','dl_r','dl_h','rp1','rp2','rp3','rp_s','ord_no','ord_nm','info','date','hdr_s','bt_','otc_'];
const LABELS = { header: 'ראש הבון', items: 'פריטים ומשנים', footer: 'תחתית הבון' };

export default function ZoneButtons({ bonPaperRef, containerRef, ctxZone, onOpen }) {
  const [positions, setPositions] = useState({});
  const [hovered, setHovered]     = useState(null);

  const calculate = useCallback(() => {
    const p = bonPaperRef.current;
    const c = containerRef?.current;
    if (!p || !c) return;

    const elems = Array.from(p.querySelectorAll('.be'));
    if (!elems.length) return;

    // bucket elements into zones using data-zone attribute (set by buildElements)
    const buckets = { header: [], items: [], footer: [] };
    elems.forEach(el => {
      const zone = el.dataset.zone || 'items';
      if (buckets[zone]) buckets[zone].push(el);
    });

    const pRect = p.getBoundingClientRect();  // bon paper
    const cRect = c.getBoundingClientRect();  // scroll container

    const bonFitsInContainer = pRect.height <= cRect.height;
    const btnX = pRect.left - 40;

    const newPos = {};

    if (bonFitsInContainer) {
      // ── BON FITS: buttons follow actual zone positions, clamped to bon ──
      Object.entries(buckets).forEach(([zone, els]) => {
        if (!els.length) return;
        const firstRect = els[0].getBoundingClientRect();
        const lastRect  = els[els.length - 1].getBoundingClientRect();
        let y;
        if (zone === 'header') y = firstRect.top + firstRect.height / 2;
        else if (zone === 'footer') y = lastRect.top + lastRect.height / 2;
        else y = (firstRect.top + lastRect.bottom) / 2;

        // clamp to bon paper bounds
        y = Math.max(pRect.top + 14, Math.min(pRect.bottom - 14, y));
        newPos[zone] = { x: btnX, y, mode: 'fixed' };
      });
    } else {
      // ── BON OVERFLOWS: buttons pin to container top / center / bottom ──
      const top    = cRect.top    + 24;
      const bottom = cRect.bottom - 24;
      const mid    = (cRect.top + cRect.bottom) / 2;

      if (buckets.header.length)  newPos.header  = { x: btnX, y: top,    mode: 'fixed' };
      if (buckets.items.length)   newPos.items   = { x: btnX, y: mid,    mode: 'fixed' };
      if (buckets.footer.length)  newPos.footer  = { x: btnX, y: bottom, mode: 'fixed' };
    }

    setPositions(newPos);
  }, [bonPaperRef, containerRef]);

  useEffect(() => {
    const timer = setTimeout(calculate, 50);
    return () => clearTimeout(timer);
  });

  useEffect(() => {
    const c = containerRef?.current;
    if (c) c.addEventListener('scroll', calculate);
    window.addEventListener('scroll', calculate, true);
    window.addEventListener('resize', calculate);
    return () => {
      if (c) c.removeEventListener('scroll', calculate);
      window.removeEventListener('scroll', calculate, true);
      window.removeEventListener('resize', calculate);
    };
  }, [calculate, containerRef]);

  return Object.entries(positions).map(([zone, pos]) => (
    <div key={zone} style={{ position: 'fixed', top: 0, left: 0, pointerEvents: 'none', zIndex: 80 }}>
      {hovered === zone && (
        <div style={{
          position: 'fixed', top: pos.y, left: pos.x - 8,
          transform: 'translateY(-50%) translateX(-100%)',
          background: 'rgba(11,68,64,.92)', color: 'var(--ba)',
          fontFamily: 'var(--sans)', fontSize: '11px', fontWeight: 700,
          padding: '3px 8px', borderRadius: '6px', whiteSpace: 'nowrap',
          boxShadow: '0 2px 8px rgba(0,0,0,.3)', pointerEvents: 'none',
        }}>
          {LABELS[zone]}
        </div>
      )}
      <button
        onMouseEnter={() => setHovered(zone)}
        onMouseLeave={() => setHovered(null)}
        onClick={() => onOpen(zone)}
        style={{
          position: 'fixed', top: pos.y, left: pos.x,
          transform: 'translateY(-50%)',
          width: 30, height: 30, borderRadius: '50%',
          border: '1.5px solid var(--ba)',
          background: ctxZone === zone ? 'var(--ba)' : 'var(--bm)',
          color:      ctxZone === zone ? 'var(--bd)' : 'var(--ba)',
          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'all .18s', boxShadow: '0 2px 8px rgba(0,0,0,.3)',
          pointerEvents: 'auto', zIndex: 500,
        }}
      >
        <PencilIcon />
      </button>
    </div>
  ));
}
