import { useState, useRef, useEffect, useMemo } from "react";

// ── helpers ───────────────────────────────────────────────
function collectIds(node) {
  const catIds  = [node.id];
  const itemIds = (node.items || []).map(i => i.id);
  for (const child of (node.children || [])) {
    const r = collectIds(child);
    catIds.push(...r.catIds);
    itemIds.push(...r.itemIds);
  }
  return { catIds, itemIds };
}

function nodeState(node, selectedCats, selectedItems) {
  const { catIds, itemIds } = collectIds(node);
  const allIds = [...catIds, ...itemIds];
  const selCount = allIds.filter(id =>
    selectedCats.includes(id) || selectedItems.includes(id)
  ).length;
  if (selCount === 0) return "none";
  if (selCount === allIds.length) return "all";
  return "some";
}

// filter tree to only nodes matching search
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
    if (nameMatch || matchingItems.length > 0 || filteredChildren.length > 0) {
      acc.push({
        ...node,
        items: nameMatch ? node.items : matchingItems,
        children: filteredChildren,
        _forceOpen: true,
      });
    }
    return acc;
  }, []);
}

// ── single tree node ──────────────────────────────────────
function TreeNode({ node, depth, selectedCats, selectedItems, onToggle, forceOpen }) {
  const [open, setOpen] = useState(forceOpen || depth < 1);
  const state       = nodeState(node, selectedCats, selectedItems);
  const hasChildren = (node.children || []).length > 0;
  const hasItems    = (node.items || []).length > 0;

  useEffect(() => {
    if (forceOpen) setOpen(true);
  }, [forceOpen]);

  const checkboxRef = useRef();
  useEffect(() => {
    if (checkboxRef.current)
      checkboxRef.current.indeterminate = state === "some";
  }, [state]);

  const indent = depth * 14;

  return (
    <div>
      {/* category row */}
      <div style={{
        display: "flex", alignItems: "center", gap: 6,
        padding: "5px 10px", paddingRight: indent + 10,
        direction: "rtl",
        background: state !== "none" ? "#f0fdf6" : "transparent",
        borderBottom: "1px solid var(--bdr)",
      }}>
        {/* expand arrow */}
        <span
          style={{
            fontSize: 10, color: "var(--sub)", width: 14,
            cursor: (hasChildren || hasItems) ? "pointer" : "default",
            userSelect: "none", flexShrink: 0,
          }}
          onClick={e => { e.stopPropagation(); if (hasChildren || hasItems) setOpen(o => !o); }}
        >
          {(hasChildren || hasItems) ? (open ? "▾" : "▸") : ""}
        </span>

        {/* checkbox */}
        <input
          ref={checkboxRef}
          type="checkbox"
          checked={state === "all"}
          style={{ accentColor: "var(--bm)", flexShrink: 0, cursor: "pointer" }}
          onChange={() => onToggle(node, state === "all" ? "deselect" : "select")}
        />

        {/* label */}
        <span
          style={{ fontSize: 12, color: "var(--text)", flex: 1, textAlign: "right", cursor: "pointer" }}
          onClick={() => onToggle(node, state === "all" ? "deselect" : "select")}
        >
          {node.display || node.name}
          {hasItems && (
            <span style={{ fontSize: 10, color: "var(--sub)", marginRight: 5 }}>
              ({node.items.length})
            </span>
          )}
        </span>
      </div>

      {/* children */}
      {open && (
        <div>
          {node.children?.map(child => (
            <TreeNode
              key={child.id}
              node={child}
              depth={depth + 1}
              selectedCats={selectedCats}
              selectedItems={selectedItems}
              onToggle={onToggle}
              forceOpen={child._forceOpen}
            />
          ))}

          {/* leaf items */}
          {hasItems && node.items.map(item => {
            const sel = selectedItems.includes(item.id);
            return (
              <div
                key={item.id}
                style={{
                  display: "flex", alignItems: "center", gap: 6,
                  padding: "4px 10px", paddingRight: (depth + 2) * 14 + 10,
                  direction: "rtl", cursor: "pointer",
                  background: sel ? "#e8fdf3" : "transparent",
                  borderBottom: "1px solid var(--bdr)",
                }}
                onClick={() => onToggle(
                  { _item: true, id: item.id, name: item.name },
                  sel ? "deselect" : "select"
                )}
              >
                <span style={{ width: 14, flexShrink: 0 }} />
                <input
                  type="checkbox"
                  checked={sel}
                  readOnly
                  style={{ accentColor: "var(--bm)", flexShrink: 0 }}
                />
                <span style={{ fontSize: 11, color: "var(--text)", flex: 1, textAlign: "right" }}>
                  {item.name}
                </span>
                {item.external_id && (
                  <span style={{
                    fontSize: 10, color: "var(--sub)",
                    background: "#f0f2f4", borderRadius: 4,
                    padding: "1px 5px", flexShrink: 0, fontFamily: "monospace",
                  }}>
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

// ── main component ────────────────────────────────────────
export default function TreeSelect({
  tree = [],
  flatItems = [],
  selectedCats = [],
  selectedItems = [],
  onChangeCats,
  onChangeItems,
  placeholder = "בחר...",
}) {
  const [open, setOpen]       = useState(false);
  const [search, setSearch]   = useState("");
  const ref                   = useRef();

  useEffect(() => {
    const handler = e => { if (!ref.current?.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const filteredTree = useMemo(() => filterTree(tree, search), [tree, search]);

  const handleToggle = (node, action) => {
    const select = action === "select";

    if (node._item) {
      if (!onChangeItems) return;
      const next = select
        ? [...new Set([...selectedItems, node.id])]
        : selectedItems.filter(id => id !== node.id);
      onChangeItems(next);
      return;
    }

    const { catIds, itemIds } = collectIds(node);
    if (onChangeCats) {
      const next = select
        ? [...new Set([...selectedCats, ...catIds])]
        : selectedCats.filter(id => !catIds.includes(id));
      onChangeCats(next);
    }
    if (onChangeItems) {
      const next = select
        ? [...new Set([...selectedItems, ...itemIds])]
        : selectedItems.filter(id => !itemIds.includes(id));
      onChangeItems(next);
    }
  };

  const totalSel = selectedCats.length + selectedItems.length;
  const chips = [];
  if (selectedCats.length)  chips.push(`${selectedCats.length} קטגוריות`);
  if (selectedItems.length) chips.push(`${selectedItems.length} פריטים`);

  return (
    <div ref={ref} style={{ position: "relative" }}>
      {/* trigger */}
      <div
        onClick={() => setOpen(o => !o)}
        style={{
          padding: "7px 10px", borderRadius: 8,
          border: `1.5px solid ${open ? "var(--bm)" : "var(--bdr)"}`,
          background: "#fff", cursor: "pointer", direction: "rtl",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          fontSize: 12, fontFamily: "var(--sans)",
          color: totalSel ? "var(--text)" : "#b0bec5",
        }}
      >
        <span>{chips.length ? chips.join(" · ") : placeholder}</span>
        <span style={{ fontSize: 10, color: "var(--sub)", transition: "transform .2s", transform: open ? "rotate(180deg)" : "none" }}>▾</span>
      </div>

      {/* dropdown */}
      {open && (
        <div style={{
          position: "absolute", top: "calc(100% + 4px)", right: 0, left: 0, zIndex: 300,
          background: "#fff", border: "1.5px solid var(--bm)",
          borderRadius: 8, boxShadow: "0 4px 16px rgba(0,0,0,.12)",
          display: "flex", flexDirection: "column", maxHeight: 360,
        }}>
          {/* search */}
          <div style={{ padding: "8px 10px", borderBottom: "1px solid var(--bdr)", flexShrink: 0 }}>
            <input
              autoFocus
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="חיפוש קטגוריה או פריט..."
              style={{
                width: "100%", border: "1.5px solid var(--bdr)", borderRadius: 6,
                padding: "5px 8px", fontSize: 12, fontFamily: "var(--sans)",
                outline: "none", direction: "rtl", background: "#f8fafb",
              }}
              onFocus={e => e.target.style.borderColor = "var(--bm)"}
              onBlur={e => e.target.style.borderColor = "var(--bdr)"}
              onClick={e => e.stopPropagation()}
            />
          </div>

          {/* clear */}
          {totalSel > 0 && (
            <div
              style={{ padding: "5px 10px", direction: "rtl", fontSize: 11, color: "var(--bm)", cursor: "pointer", borderBottom: "1px solid var(--bdr)", fontWeight: 600, flexShrink: 0 }}
              onClick={() => { onChangeCats?.([]); onChangeItems?.([]); }}
            >
              נקה הכל ({totalSel})
            </div>
          )}

          {/* tree */}
          <div style={{ overflowY: "auto", flex: 1 }}>
            {filteredTree.length === 0 && (
              <div style={{ padding: 16, color: "var(--sub)", fontSize: 12, textAlign: "center" }}>
                {search ? "לא נמצאו תוצאות" : "טוען..."}
              </div>
            )}
            {filteredTree.map(node => (
              <TreeNode
                key={node.id}
                node={node}
                depth={0}
                selectedCats={selectedCats}
                selectedItems={selectedItems}
                onToggle={handleToggle}
                forceOpen={!!search || node._forceOpen}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
