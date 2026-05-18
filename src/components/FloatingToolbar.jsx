export default function FloatingToolbar({ selId, elSt, pos, onToggle, onSetAlign, onAdjSize, onDesel }) {
  if (!selId) return null;
  const s = elSt[selId] || {};

  return (
    <div
      className="stb vis"
      style={{ position: 'fixed', top: pos.top, left: pos.left, zIndex: 200 }}
    >
      <button className={`tb${s.bold ? ' on' : ''}`} onClick={() => onToggle('bold')}>B</button>
      <button className={`tb${s.dbl  ? ' on' : ''}`} onClick={() => onToggle('dbl')}>2×</button>
      <button className={`tb${s.rev  ? ' on' : ''}`} onClick={() => onToggle('rev')}>⬛</button>
      <div className="tsep" />
      <button className={`tb${s.align === 'right'  ? ' on' : ''}`} onClick={() => onSetAlign('right')}>→</button>
      <button className={`tb${s.align === 'center' ? ' on' : ''}`} onClick={() => onSetAlign('center')}>≡</button>
      <button className={`tb${s.align === 'left'   ? ' on' : ''}`} onClick={() => onSetAlign('left')}>←</button>
      <div className="tsep" />
      <button className="tsz" onClick={() => onAdjSize(-1)}>−</button>
      <span  className="tsz" style={{ cursor: 'default' }}>{s.size || 11}</span>
      <button className="tsz" onClick={() => onAdjSize(1)}>+</button>
      <div className="tsep" />
      <button className={`tb${s.bsq ? ' on' : ''}`} onClick={() => onToggle('bsq')}>▣</button>
      <div className="tsep" />
      <button className="tcl" onClick={onDesel}>✕</button>
    </div>
  );
}
