import { useState, useRef, useEffect } from 'react';
import { Printer, Pencil, Search, Check, X } from 'lucide-react';

export default function PrinterPicker({ printers = [], selectedPrinters = [], setSelectedPrinters }) {
  const [open, setOpen]       = useState(false);
  const [query, setQuery]     = useState('');
  const [pending, setPending] = useState(selectedPrinters);
  const ref                   = useRef(null);

  // sync pending when selectedPrinters changes from outside
  useEffect(() => { setPending(selectedPrinters); }, [selectedPrinters]);

  // close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const activePrinters  = printers.filter(p => selectedPrinters.includes(p.id));
  const filtered        = printers.filter(p =>
    p.name.toLowerCase().includes(query.toLowerCase()) ||
    p.ip?.toLowerCase().includes(query.toLowerCase()) ||
    p.type?.toLowerCase().includes(query.toLowerCase())
  );

  const toggle = (id) => setPending(prev =>
    prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
  );

  const confirm = () => {
    setSelectedPrinters(pending);
    setOpen(false);
  };

  const cancel = () => {
    setPending(selectedPrinters);
    setOpen(false);
  };

  return (
    <div ref={ref} style={{ direction: 'rtl', position: 'relative' }}>

      {/* ── Connected printers list ── */}
      {activePrinters.length > 0 ? (
        <div style={{
          border: '1.5px solid var(--bdr)', borderRadius: 10,
          overflow: 'hidden', marginBottom: 8,
        }}>
          {activePrinters.map((p, i) => (
            <div key={p.id} style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '9px 12px',
              borderBottom: i < activePrinters.length - 1 ? '1px solid var(--bdr)' : 'none',
              background: 'var(--bg)',
            }}>
              <Printer size={15} color="#1D9E75" style={{ flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--bd)' }}>{p.name}</div>
                <div style={{ fontSize: 11, color: '#888' }}>{p.type} — {p.ip}</div>
              </div>
              <span style={{
                fontSize: 10, fontWeight: 600, padding: '2px 7px', borderRadius: 20,
                background: '#E1F5EE', color: '#0F6E56',
              }}>מחובר</span>
            </div>
          ))}
        </div>
      ) : (
        <div style={{
          background: '#fffbeb', border: '1.5px solid #f59e0b',
          borderRadius: 8, padding: '9px 12px', fontSize: 12,
          color: '#92400e', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6,
        }}>
          ⚠ הבון לא מחובר למדפסת
        </div>
      )}

      {/* ── Edit button ── */}
      <button
        onClick={() => { setPending(selectedPrinters); setOpen(o => !o); }}
        style={{
          width: '100%', padding: '7px 12px', borderRadius: 8, fontSize: 12,
          fontWeight: 700, cursor: 'pointer', display: 'flex',
          alignItems: 'center', justifyContent: 'center', gap: 6,
          border: '1.5px solid var(--bdr)', background: 'var(--bm)',
          color: 'white', transition: 'background .15s'
        }}
      >
        <Pencil size={13} />
        ערוך מדפסות ({selectedPrinters.length}/{printers.length})
      </button>

      {/* ── Dropdown picker ── */}
      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 6px)', right: 0, left: 0,
          background: 'var(--bg)', border: '1.5px solid var(--bdr)',
          borderRadius: 10, overflow: 'hidden', zIndex: 500,
          boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
        }}>

          {/* Search */}
          <div style={{ padding: '8px 10px', borderBottom: '1px solid var(--bdr)' }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 7,
              background: 'var(--bm)', borderRadius: 7, padding: '5px 9px',
            }}>
              <Search size={13} color="#ffffff" style={{ flexShrink: 0 }} />
              <input
                autoFocus
                type="text"
                placeholder="חפש מדפסת..."
                value={query}
                onChange={e => setQuery(e.target.value)}
                style={{
                  flex: 1, border: 'none', background: 'transparent',
                  fontSize: 12, outline: 'none',  direction: 'rtl',
                }}
                className='input-white'
              />
              {query && (
                <button onClick={() => setQuery('')}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: '#aaa', display: 'flex' }}>
                  <X size={12} />
                </button>
              )}
            </div>
          </div>

          {/* List */}
          <div style={{ maxHeight: 220, overflowY: 'auto' }}>
            {filtered.length === 0 && (
              <div style={{ padding: '12px', fontSize: 12, color: '#999', textAlign: 'center' }}>
                לא נמצאו מדפסות
              </div>
            )}
            {filtered.map((p, i) => {
              const checked = pending.includes(p.id);
              return (
                <label key={p.id} style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '9px 12px', cursor: 'pointer',
                  borderBottom: i < filtered.length - 1 ? '1px solid var(--bdr)' : 'none',
                  background: checked ? '#f0fdf4' : 'var(--bg)',
                  transition: 'background .1s',
                }}>
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggle(p.id)}
                    style={{ display: 'none' }}
                  />
                  <div style={{
                    width: 17, height: 17, borderRadius: 5, flexShrink: 0,
                    border: `2px solid ${checked ? '#1D9E75' : '#ccc'}`,
                    background: checked ? '#1D9E75' : '#fff',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'all .12s',
                  }}>
                    {checked && <Check size={10} color="#fff" strokeWidth={3} />}
                  </div>
                  <Printer size={14} color={checked ? '#1D9E75' : '#bbb'} style={{ flexShrink: 0 }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: checked ? '#166534' : 'var(--bd)' }}>
                      {p.name}
                    </div>
                    <div style={{ fontSize: 11, color: '#888' }}>{p.type} — {p.ip}</div>
                  </div>
                </label>
              );
            })}
          </div>

          {/* Footer */}
          <div style={{
            display: 'flex', gap: 6, padding: '8px 10px',
            borderTop: '1px solid var(--bdr)', background: 'var(--bm)',
          }}>
            <button onClick={confirm} style={{
              flex: 1, padding: '7px', borderRadius: 7, border: 'none',
              background: '#1D9E75', color: '#fff', fontSize: 12,
              fontWeight: 600, cursor: 'pointer',
            }}>
              אשר ({pending.length})
            </button>
            <button onClick={cancel} style={{
              padding: '7px 12px', borderRadius: 7, fontSize: 12,
              border: '1.5px solid var(--bdr)', background: 'var(--bg)',
              color: 'var(--bd)', cursor: 'pointer',
            }}>
              ביטול
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
