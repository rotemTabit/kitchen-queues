import { useState, useEffect, useCallback } from 'react';

const PencilIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
  </svg>
);

const SettingsIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="3"/>
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
  </svg>
);

const LABELS = { general: 'הגדרות כלליות', header: 'ראש הבון', items: 'פריטים ומשנים', footer: 'תחתית הבון' };

export default function ZoneButtons({ bonPaperRef, containerRef, ctxZone, onOpen }) {
  const [positions, setPositions] = useState({});
  const [hovered, setHovered]     = useState(null);

  const calculate = useCallback(() => {
    const p = bonPaperRef.current;
    const c = containerRef?.current;
    if (!p || !c) return;

    const elems = Array.from(p.querySelectorAll('.be'));
    if (!elems.length) return;

    const buckets = { header: [], items: [], footer: [] };
    elems.forEach(el => {
      const zone = el.dataset.zone || 'items';
      if (buckets[zone]) buckets[zone].push(el);
    });

    const pRect = p.getBoundingClientRect();
    const cRect = c.getBoundingClientRect();

    const bonFitsInContainer = pRect.height <= cRect.height;
    const leftBtnX  = pRect.left - 40;
    const rightBtnX = pRect.right + 14;

    const newPos = {};

    // ── general: תמיד במרכז הקונטיינר — סטטי, לא זז עם הבון ──
    newPos.general = {
      x: rightBtnX,
      y: (cRect.top + cRect.bottom) / 2,
      side: 'right',
    };

    if (bonFitsInContainer) {
      Object.entries(buckets).forEach(([zone, els]) => {
        if (!els.length) return;
        const firstRect = els[0].getBoundingClientRect();
        const lastRect  = els[els.length - 1].getBoundingClientRect();
        let y;
        if (zone === 'header')      y = firstRect.top + firstRect.height / 2;
        else if (zone === 'footer') y = lastRect.top  + lastRect.height  / 2;
        else                        y = (firstRect.top + lastRect.bottom) / 2;

        y = Math.max(pRect.top + 14, Math.min(pRect.bottom - 14, y));
        newPos[zone] = { x: leftBtnX, y, side: 'left' };
      });
    } else {
      const top    = cRect.top    + 24;
      const bottom = cRect.bottom - 24;
      const mid    = (cRect.top + cRect.bottom) / 2;

      if (buckets.header.length) newPos.header = { x: leftBtnX, y: top,    side: 'left' };
      if (buckets.items.length)  newPos.items  = { x: leftBtnX, y: mid,    side: 'left' };
      if (buckets.footer.length) newPos.footer = { x: leftBtnX, y: bottom, side: 'left' };
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

  return Object.entries(positions).map(([zone, pos]) => {
    const isGeneral = zone === 'general';
    const isActive  = ctxZone === zone;

    return (
      <div key={zone} style={{ position: 'fixed', top: 0, left: 0, pointerEvents: 'none', zIndex: 80 }}>

        {/* Tooltip */}
        {hovered === zone && (
          <div style={{
            position: 'fixed',
            top: pos.y,
            ...(isGeneral
              ? { left: pos.x + 44, transform: 'translateY(-50%)' }
              : { left: pos.x - 8,  transform: 'translateY(-50%) translateX(-100%)' }
            ),
            background: 'rgba(11,68,64,.92)', color: 'var(--ba)',
            fontFamily: 'var(--sans)', fontSize: '11px', fontWeight: 700,
            padding: '3px 8px', borderRadius: '6px', whiteSpace: 'nowrap',
            boxShadow: '0 2px 8px rgba(0,0,0,.3)', pointerEvents: 'none',
          }}>
            {LABELS[zone]}
          </div>
        )}

        {/* Button */}
        <button
          onMouseEnter={() => setHovered(zone)}
          onMouseLeave={() => setHovered(null)}
          onClick={() => onOpen(zone)}
          style={{
            position: 'fixed',
            top: pos.y,
            left: pos.x,
            transform: 'translateY(-50%)',
            width:        isGeneral ? 36 : 30,
            height:       isGeneral ? 36 : 30,
            borderRadius: isGeneral ? '10px' : '50%',
            border:       'none',
            background:   isActive ? 'var(--ba)' : 'var(--bm)',
            color:        isActive ? 'var(--bd)' : 'var(--ba)',
            cursor:       'pointer',
            display:      'flex', alignItems: 'center', justifyContent: 'center',
            transition:   'all .18s',
            boxShadow:    '0 2px 8px rgba(0,0,0,.25)',
            overflow:     'hidden',   // מונע את הצל הכהה בפינות
            pointerEvents: 'auto',
            zIndex: 500,
          }}
        >
          {isGeneral ? <SettingsIcon /> : <PencilIcon />}
        </button>
      </div>
    );
  });
}
