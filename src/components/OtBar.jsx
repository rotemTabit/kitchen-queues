import { OT_BUTTONS } from '../data/bonConfig';
import { getAllowedOTs } from '../utils/otLogic';

export default function OtBar({ selectedOT, orderTypes, sources, onSelect }) {
  const allowedOTs = getAllowedOTs(orderTypes, sources);

  return (
    <div className="ot-bar">
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
  );
}
