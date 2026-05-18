import { useState, useMemo } from "react";


// ── depth labels & colors ─────────────────────────────────
const DEPTH_META = [
  { label: "מחלקה",      bg: "#e8f4fd", color: "#1e6fa8", border: "#bdd8f0" },
  { label: "קטגוריה",    bg: "#f0fdf4", color: "#166534", border: "#bbf7d0" },
  { label: "תת-קטגוריה", bg: "#fef9ee", color: "#92400e", border: "#fde68a" },
];
function depthMeta(depth) {
  return DEPTH_META[Math.min(depth, DEPTH_META.length - 1)];
}

// ── helpers ───────────────────────────────────────────────
function collectAllIds(node) {
  const catIds  = [node.id];
  const itemIds = (node.items || []).map(i => i.id);
  for (const child of (node.children || [])) {
    const { catIds: cc, itemIds: ii } = collectAllIds(child);
    catIds.push(...cc);
    itemIds.push(...ii);
  }
  return { catIds, itemIds };
}

function hasSelectedDescendant(node, selected) {
  if (selected.has(node.id)) return true;
  if ((node.items || []).some(i => selected.has(i.id))) return true;
  return (node.children || []).some(c => hasSelectedDescendant(c, selected));
}

function filterTree(nodes, q) {
  if (!q) return nodes;
  const lq = q.toLowerCase();
  return nodes.reduce((acc, node) => {
    const nameMatch = (node.display || node.name || "").toLowerCase().includes(lq);
    const matchingItems = (node.items || []).filter(i =>
      i.name.toLowerCase().includes(lq) ||
      (i.external_id || "").toLowerCase().includes(lq)
    );
    const filteredChildren = filterTree(node.children || [], q);
    if (nameMatch || matchingItems.length || filteredChildren.length) {
      acc.push({
        ...node,
        items: nameMatch ? node.items : matchingItems,
        children: filteredChildren,
      });
    }
    return acc;
  }, []);
}

// ── Left panel tree node ──────────────────────────────────
function SourceNode({ node, depth, selected, onSelect, forceOpen }) {
  const [open, setOpen] = useState(forceOpen || hasSelectedDescendant(node, selected));
  const hasChildren = (node.children || []).length > 0;
  const hasItems    = (node.items || []).length > 0;

  const { catIds, itemIds } = collectAllIds(node);
  const allIds = [...catIds, ...itemIds];
  const selCount = allIds.filter(id => selected.has(id)).length;
  const state = selCount === 0 ? "none" : selCount === allIds.length ? "all" : "some";

  const toggle = () => {
    const adding = state !== "all";
    const next = new Set(selected);
    allIds.forEach(id => adding ? next.add(id) : next.delete(id));
    onSelect(next);
  };

  return (
    <div>
      <div
        style={{
          display: "flex", alignItems: "center", gap: 8,
          padding: "6px 12px",
          direction: "rtl", cursor: "pointer",
          background: state !== "none" ? "rgba(115,222,215,0.12)" : "transparent",
          borderBottom: "1px solid rgba(0,0,0,0.05)",
          transition: "background .1s",
        }}
        onClick={toggle}
      >
        <span
          style={{ fontSize: 10, width: 12, color: "#aaa", flexShrink: 0, cursor: "pointer", marginRight: depth * 16 }}
          onClick={e => { e.stopPropagation(); if (hasChildren || hasItems) setOpen(o => !o); }}
        >
          {(hasChildren || hasItems) ? (open ? "▾" : "▸") : ""}
        </span>

        <div style={{
          width: 16, height: 16, borderRadius: 4, flexShrink: 0,
          border: `2px solid ${state === "none" ? "#d1d5db" : "var(--bm)"}`,
          background: state === "all" ? "var(--bm)" : state === "some" ? "rgba(15,88,83,0.15)" : "#fff",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          {state === "all" && <span style={{ color: "#fff", fontSize: 9, lineHeight: 1 }}>✓</span>}
          {state === "some" && <span style={{ color: "var(--bm)", fontSize: 9, lineHeight: 1 }}>−</span>}
        </div>

        <span style={{ fontSize: 12, color: "#1a2332", flex: 1, fontWeight: hasChildren ? 600 : 400, display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ fontSize: 9, padding: "1px 5px", borderRadius: 10, background: depthMeta(depth).bg, color: depthMeta(depth).color, border: `1px solid ${depthMeta(depth).border}`, fontWeight: 500, flexShrink: 0 }}>
            {depthMeta(depth).label}
          </span>
          {node.display || node.name}
        </span>
        {hasItems && (
          <span style={{ fontSize: 10, color: "#aaa" }}>{node.items.length}</span>
        )}
      </div>

      {open && (
        <div>
          {node.children?.map(child => (
            <SourceNode key={child.id} node={child} depth={depth + 1} selected={selected} onSelect={onSelect} forceOpen={forceOpen} />
          ))}
          {hasItems && node.items.map(item => {
            const sel = selected.has(item.id);
            return (
              <div
                key={item.id}
                style={{
                  display: "flex", alignItems: "center", gap: 8,
                  padding: "5px 12px",
                  direction: "rtl", cursor: "pointer",
                  background: sel ? "rgba(115,222,215,0.12)" : "transparent",
                  borderBottom: "1px solid rgba(0,0,0,0.04)",
                }}
                onClick={() => {
                  const next = new Set(selected);
                  sel ? next.delete(item.id) : next.add(item.id);
                  onSelect(next);
                }}
              >
                <span style={{ width: 12, flexShrink: 0, marginRight: depth * 16 }} />
                <div style={{
                  width: 16, height: 16, borderRadius: 4, flexShrink: 0,
                  border: `2px solid ${sel ? "var(--bm)" : "#d1d5db"}`,
                  background: sel ? "var(--bm)" : "#fff",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  {sel && <span style={{ color: "#fff", fontSize: 9 }}>✓</span>}
                </div>
                <span style={{ fontSize: 11, color: "#374151", flex: 1 }}>{item.name}</span>
                {item.external_id && (
                  <span style={{ fontSize: 10, color: "#9ca3af", fontFamily: "monospace", background: "#f3f4f6", padding: "1px 5px", borderRadius: 3 }}>
                    {item.external_id}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Right panel — selected summary ────────────────────────
function SelectedPanel({ tree, selected, printAll, onRemove }) {
  const selectedTree = useMemo(() => {
    function filter(nodes) {
      return nodes.reduce((acc, node) => {
        const selItems = (node.items || []).filter(i => selected.has(i.id));
        const selChildren = filter(node.children || []);
        const catSelected = selected.has(node.id);
        if (catSelected || selItems.length || selChildren.length)
          acc.push({ ...node, items: selItems, children: selChildren, _catSelected: catSelected });
        return acc;
      }, []);
    }
    return filter(tree);
  }, [tree, selected]);

  const allCatIds = useMemo(() => {
    const ids = [];
    function walk(nodes) { nodes.forEach(n => { ids.push(n.id); walk(n.children || []); }); }
    walk(tree);
    return new Set(ids);
  }, [tree]);

  const selCatCount  = [...selected].filter(id => allCatIds.has(id)).length;
  const selItemCount = [...selected].filter(id => !allCatIds.has(id)).length;

  if (printAll && selected.size === 0) {
    return (
      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: "#6b7280", gap: 8, direction: "rtl" }}>
        <span style={{ fontSize: 32 }}>✓</span>
        <div style={{ fontSize: 13, fontWeight: 600, color: "var(--bm)" }}>כל הפריטים מודפסים</div>
        <div style={{ fontSize: 11 }}>בחר פריטים שמאלה כדי להחריגם</div>
      </div>
    );
  }

  if (selected.size === 0) {
    return (
      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: "#9ca3af", gap: 8, direction: "rtl" }}>
        <span style={{ fontSize: 32 }}>☐</span>
        <div style={{ fontSize: 13 }}>אין פריטים נבחרים</div>
        <div style={{ fontSize: 11 }}>הוסף פריטים להדפסה מהרשימה</div>
      </div>
    );
  }

  function RightNode({ node, depth }) {
    const [open, setOpen] = useState(true);
    return (
      <div>
        <div style={{
          display: "flex", alignItems: "center", gap: 6,
          padding: "5px 10px", direction: "rtl",
          borderBottom: "1px solid rgba(0,0,0,0.05)",
          background: depth === 0 ? "#f0fdf6" : "transparent",
        }}>
          <span
            style={{ fontSize: 10, color: "#aaa", width: 12, marginRight: depth * 14, flexShrink: 0,
              cursor: ((node.children || []).length > 0 || (node.items || []).length > 0) ? "pointer" : "default",
              opacity: ((node.children || []).length > 0 || (node.items || []).length > 0) ? 1 : 0.3,
            }}
            onClick={() => { if ((node.children||[]).length > 0 || (node.items||[]).length > 0) setOpen(o => !o); }}
          >
            {((node.children || []).length > 0 || (node.items || []).length > 0) ? (open ? "▾" : "▸") : "▸"}
          </span>
          <span style={{ fontSize: 12, fontWeight: depth === 0 ? 700 : 600, color: "#1a2332", flex: 1, display: "flex", alignItems: "center", gap: 5 }}>
            <span style={{ fontSize: 9, padding: "1px 5px", borderRadius: 10, background: depthMeta(depth).bg, color: depthMeta(depth).color, border: `1px solid ${depthMeta(depth).border}`, fontWeight: 500, flexShrink: 0 }}>
              {depthMeta(depth).label}
            </span>
            {node.display || node.name}
            {node._catSelected && (
              <span style={{ fontSize: 9, padding: "1px 5px", borderRadius: 10, background: "#f0fdf4", color: "var(--bm)", border: "1px solid #bbf7d0", fontWeight: 500, flexShrink: 0 }}>כל הפריטים</span>
            )}
          </span>
          <span
            style={{ fontSize: 11, color: "#9ca3af", cursor: "pointer", padding: "0 4px" }}
            onClick={() => {
              const { catIds, itemIds } = collectAllIds(node);
              const next = new Set(selected);
              [...catIds, ...itemIds].forEach(id => next.delete(id));
              onRemove(next);
            }}
          >✕</span>
        </div>
        {open && (
          <div>
            {node.children?.map(c => <RightNode key={c.id} node={c} depth={depth + 1} />)}
            {node.items?.map(item => (
              <div key={item.id} style={{
                display: "flex", alignItems: "center", gap: 6,
                padding: "4px 10px", direction: "rtl",
                borderBottom: "1px solid rgba(0,0,0,0.03)",
              }}>
                <span style={{ width: 12, marginRight: (depth + 1) * 14, flexShrink: 0 }} />
                <span style={{ fontSize: 11, color: "#374151", flex: 1 }}>{item.name}</span>
                {item.external_id && (
                  <span style={{ fontSize: 10, color: "#9ca3af", fontFamily: "monospace", background: "#f3f4f6", padding: "1px 4px", borderRadius: 3 }}>
                    {item.external_id}
                  </span>
                )}
                <span
                  style={{ fontSize: 11, color: "#9ca3af", cursor: "pointer", padding: "0 4px" }}
                  onClick={() => { const next = new Set(selected); next.delete(item.id); onRemove(next); }}
                >✕</span>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div style={{ flex: 1, overflowY: "auto" }}>
      <div style={{ padding: "6px 10px", background: "#f0fdf6", borderBottom: "1px solid var(--bdr)", direction: "rtl", fontSize: 11, color: "var(--bm)", fontWeight: 600 }}>
        {selCatCount > 0 && `${selCatCount} קטגוריות`}{selCatCount > 0 && selItemCount > 0 && " · "}{selItemCount > 0 && `${selItemCount} פריטים`} נבחרו
      </div>
      {selectedTree.map(node => <RightNode key={node.id} node={node} depth={0} />)}
    </div>
  );
}

// ── Main Modal ────────────────────────────────────────────
export default function ItemsModal({
  tree = [], printAll = false,
  incCats = [], incItems = [],
  excCats = [], excItems = [],
  onSave, onClose,
}) {
  const [search, setSearch] = useState("");

  const initSelected = useMemo(() => {
    return new Set(printAll ? [...excCats, ...excItems] : [...incCats, ...incItems]);
  }, []);

  const [selected, setSelected] = useState(initSelected);
  const filteredTree = useMemo(() => filterTree(tree, search), [tree, search]);

  const handleSave = () => {
    const catIds  = [...selected].filter(id => tree.some(n => findCat(n, id)));
    const itemIds = [...selected].filter(id => !catIds.includes(id));
    if (printAll) {
      onSave({ excCats: catIds, excItems: itemIds, incCats: [], incItems: [] });
    } else {
      onSave({ incCats: catIds, incItems: itemIds, excCats: [], excItems: [] });
    }
    onClose();
  };

  const mainTitle  = printAll ? "בחירת פריטים וקטגוריות להחרגה" : "בחירת פריטים וקטגוריות להדפסה";
  const leftTitle  = printAll ? "פריטים מודפסים — בחר כדי להחריג" : "פריטים זמינים — בחר כדי להדפיס";
  const rightTitle = printAll ? "מוחרגים (לא יודפסו)" : "יודפסו";
  const rightColor = printAll ? "#ef4444" : "var(--bm)";

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 500, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{
        background: "#fff", borderRadius: 14, width: "min(900px, 95vw)", height: "min(680px, 90vh)",
        display: "flex", flexDirection: "column", overflow: "hidden",
        boxShadow: "0 20px 60px rgba(0,0,0,.25)",
      }}>
        <div style={{ display: "flex", alignItems: "center", padding: "14px 20px", background: "var(--bd)", color: "#fff", direction: "rtl", gap: 12, flexShrink: 0 }}>
          <span style={{ fontSize: 16, fontWeight: 700, flex: 1 }}>{mainTitle}</span>
          <button onClick={onClose} style={{ background: "transparent", border: "none", color: "rgba(255,255,255,.6)", fontSize: 20, cursor: "pointer", lineHeight: 1 }}>✕</button>
        </div>

        <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
          <div style={{ flex: 1, display: "flex", flexDirection: "column", borderLeft: "1px solid #e5e7eb" }}>
            <div style={{ padding: "10px 12px", borderBottom: "1px solid #e5e7eb", flexShrink: 0 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#6b7280", marginBottom: 6, direction: "rtl" }}>{leftTitle}</div>
              <input
                type="text" value={search} onChange={e => setSearch(e.target.value)}
                placeholder="חיפוש..."
                style={{ width: "100%", padding: "6px 10px", borderRadius: 6, border: "1.5px solid #e5e7eb", fontSize: 12, outline: "none", direction: "rtl", fontFamily: "var(--sans)", background: "#f9fafb" }}
              />
            </div>
            <div style={{ flex: 1, overflowY: "auto" }}>
              {filteredTree.map(node => (
                <SourceNode key={node.id} node={node} depth={0} selected={selected} onSelect={setSelected} forceOpen={!!search} />
              ))}
            </div>
          </div>

          <div style={{ width: 450, display: "flex", flexDirection: "column", flexShrink: 0 }}>
            <div style={{ padding: "10px 12px", borderBottom: "1px solid #e5e7eb", flexShrink: 0 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: rightColor, direction: "rtl" }}>{rightTitle}</div>
            </div>
            <SelectedPanel tree={tree} selected={selected} printAll={printAll} onRemove={setSelected} />
          </div>
        </div>

        <div style={{ display: "flex", gap: 8, padding: "12px 20px", borderTop: "1px solid #e5e7eb", justifyContent: "flex-start", flexShrink: 0 }}>
          <button onClick={handleSave} style={{ padding: "8px 20px", borderRadius: 8, border: "none", background: "var(--bm)", color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "var(--sans)" }}>שמור</button>
          <button onClick={onClose} style={{ padding: "8px 16px", borderRadius: 8, border: "1px solid #e5e7eb", background: "#fff", color: "#6b7280", fontSize: 13, cursor: "pointer", fontFamily: "var(--sans)" }}>ביטול</button>
          {selected.size > 0 && (
            <button onClick={() => setSelected(new Set())} style={{ padding: "8px 14px", borderRadius: 8, border: "1px solid #fecaca", background: "#fff5f5", color: "#ef4444", fontSize: 12, cursor: "pointer", fontFamily: "var(--sans)", marginRight: "auto" }}>נקה הכל</button>
          )}
        </div>
      </div>
    </div>
  );
}

function findCat(node, id) {
  if (node.id === id) return true;
  return (node.children || []).some(c => findCat(c, id));
}
