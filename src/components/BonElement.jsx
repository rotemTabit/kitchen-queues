export default function BonElement({ el, override = {}, selected, onSelect, onDragStart, onDragOver, onDrop, onDragEnd, flash = false, flashKey = 0 }) {
  // flashKey changes force React to remount the animation
  const e = {
    ...el,
    bold:  override.bold  !== undefined ? override.bold  : el.bold,
    dbl:   override.dbl   !== undefined ? override.dbl   : el.dbl,
    rev:   override.rev   !== undefined ? override.rev   : el.rev,
    align: override.align || el.align,
    size:  override.size  || el.size,
  };

  const sz = e.size || (e.dbl ? 18 : 11.5);
  const style = {
    fontSize:   sz + 'px',
    lineHeight: e.dbl ? 1.7 : 1.5,
    fontWeight: e.bold ? 'bold' : 'normal',
    textAlign:  e.align === 'right' ? 'right' : e.align === 'left' ? 'left' : 'center',
    direction:  'rtl',
    padding:    '1px 10px',
    ...(e.rev ? { background: '#000', color: '#fff' } : {}),
    ...(e.bsq ? { border: '1px solid #000', margin: '1px 8px', padding: '1px 6px' } : {}),
    ...(e.brd ? { border: '1px solid #000', borderRadius: '4px', margin: '1px 8px', padding: '1px 6px' } : {}),
  };

  if (el.sep) {
    return (
      <div
        className={`be${selected ? ' sel' : ''}`}
        data-id={el.id}
        data-zone={el.zone || 'items'}
        draggable
        onDragStart={() => onDragStart(el.id)}
        onDragOver={onDragOver}
        onDrop={onDrop}
        onDragEnd={onDragEnd}
        onClick={() => onSelect(el.id)}
        style={{ padding: '3px 0', position: 'relative' }}
      >
        {flash && <div key={flashKey} style={{ position:'absolute',inset:0,background:'rgba(26,74,58,0.25)',animation:'bon-flash 0.5s ease-out forwards',pointerEvents:'none',zIndex:1 }} />}
        <div style={{ borderTop: el.solid ? '1px solid #bbb' : '0.5px dashed #ccc', margin: '1px 10px' }} />
        <span className="dh">⠿</span>
      </div>
    );
  }

  return (
    <div
      className={`be clickable${selected ? ' sel' : ''}`}
      data-id={el.id}
      data-zone={el.zone || 'items'}
      style={{ ...style, position: 'relative' }}
      draggable
      onDragStart={() => onDragStart(el.id)}
      onDragOver={onDragOver}
      onDrop={onDrop}
      onDragEnd={onDragEnd}
      onClick={ev => { ev.stopPropagation(); onSelect(el.id); }}
    >
      {flash && <div key={flashKey} style={{ position:'absolute',inset:0,background:'rgba(26,74,58,0.25)',animation:'bon-flash 0.5s ease-out forwards',pointerEvents:'none',zIndex:1 }} />}
      <span style={e.underline ? { textDecoration: 'underline' } : {}}>{el.text || ''}</span>
      <span className="dh">⠿</span>
    </div>
  );
}
