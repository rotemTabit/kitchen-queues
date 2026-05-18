import { useState, useRef, useEffect } from "react";

export default function MultiSelect({ options = [], selected = [], onChange, placeholder }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const ref = useRef();

  useEffect(() => {
    const handler = e => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const toggle = v =>
    onChange(selected.includes(v) ? selected.filter(x => x !== v) : [...selected, v]);

  const filtered = options.filter(o =>
    !search || o.label.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="ms-wrap" ref={ref}>
      <div
        className={`ms-trigger${open ? " open" : ""}`}
        onClick={() => setOpen(!open)}
      >
        <span className={selected.length ? "" : "ms-pl"}>
          {selected.length ? `${selected.length} נבחרו` : placeholder}
        </span>
        <span className="ms-arrow">▾</span>
      </div>

      {open && (
        <div className="ms-dropdown">
          <div style={{ padding: "6px 8px", borderBottom: "1px solid var(--bdr)" }}>
            <input
              type="text"
              placeholder="חפש..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{
                width: "100%", border: "1px solid var(--bdr)", borderRadius: 5,
                padding: "4px 8px", fontSize: 11, fontFamily: "var(--sans)",
                outline: "none", direction: "rtl",
              }}
              onClick={e => e.stopPropagation()}
            />
          </div>
          <div className="ms-item" style={{ borderBottom: "1px solid var(--bdr)", background: "#f8fafb" }}>
            <input
              type="checkbox"
              checked={selected.length === options.length}
              onChange={e => onChange(e.target.checked ? options.map(o => o.value) : [])}
            />
            <span style={{ fontWeight: 600, fontSize: 11 }}>בחר הכל</span>
          </div>
          {filtered.map(o => (
            <div key={o.value} className={`ms-item${selected.includes(o.value) ? " on" : ""}`}>
              <input
                type="checkbox"
                checked={selected.includes(o.value)}
                onChange={() => toggle(o.value)}
              />
              <span>{o.label}</span>
            </div>
          ))}
        </div>
      )}

      {selected.length > 0 && (
        <div className="ms-tags">
          {selected.map(v => (
            <div key={v} className="ms-tag">
              {options.find(o => o.value === v)?.label || v}
              <span className="ms-tag-rm" onClick={() => toggle(v)}>×</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
