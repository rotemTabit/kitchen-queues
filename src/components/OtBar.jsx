import { OT_BUTTONS } from '../data/bonConfig';
import { getAllowedOTs } from '../utils/otLogic';

export default function OtBar({ selectedOT, orderTypes, sources, onSelect }) {
  const allowedOTs = getAllowedOTs(orderTypes, sources);

  return (
    <div className="ot-bar">
      
      <div className="ot-bar-btns">
        {OT_BUTTONS.filter(b => allowedOTs.has(b.ot)).map(b => (
          <button
            key={b.ot}
            className={`ot-btn${selectedOT === b.ot ? ' active' : ''}`}
            onClick={() => onSelect(b.ot)}
          >
            {b.label}
          </button>
        ))}
      </div>
      <span className="ot-bar-label" dir='rtl'>
  תצוגה מקדימה לפי סוג הזמנה:{' '}
  <span style={{ color: 'rgba(255,255,255,.75)', fontWeight: 700 }}>
    {OT_BUTTONS.find(b => b.ot === selectedOT)?.label || ''}
  </span>
</span>
    </div>
  );
}
