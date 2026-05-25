import { useState, useMemo } from "react";
import { useMenuWithGroups } from "../hooks/useSupabase";
import { PenLine } from "lucide-react";

// ── helpers ───────────────────────────────────────────────
const isWO = id => String(id).startsWith("WO_");
const stripLelo = name => name.replace(/^ללא\s+/u, '').trim();

function initChoices(groups) {
  const choices = {};
  for (const g of groups) {
    if (g.type === "mgss") {
      const def = g.members.find(m => !isWO(m.id)) || g.members[0];
      choices[g.id] = def ? [def.id] : [];
    } else if (g.type === "mgms") {
      choices[g.id] = g.members.filter(m => isWO(m.id)).map(m => m.id);
    } else {
      choices[g.id] = [];
    }
  }
  return choices;
}

// ── Group editor ──────────────────────────────────────────
function GroupEditor({ group, value, onChange }) {
  const { name, type, min, max, members } = group;
  const cur = value || [];
  const nonWOSelected = cur.filter(id => !isWO(id)).length;
  const hasError = min > 0 && type !== "mgss" && nonWOSelected < min;

  const toggle = (memberId) => {
    if (type === "mgss") { onChange([memberId]); return; }
    if (cur.includes(memberId)) {
      onChange(cur.filter(id => id !== memberId));
    } else {
      if (!isWO(memberId) && max !== 999 && nonWOSelected >= max) return;
      onChange([...cur, memberId]);
    }
  };

  const typeLabel = type === "mgss" ? "בחירה אחת" : type === "mgms" ? "משנים" : "תוספות";
  const typeColor = type === "mgss" ? "#3b82f6" : type === "mgms" ? "#8b5cf6" : "#f59e0b";

  return (
    <div style={{ marginBottom: 10, border: `1.5px solid ${hasError ? "#fca5a5" : "#e5e7eb"}`, borderRadius: 8, overflow: "hidden" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "5px 10px", background: hasError ? "#fff5f5" : "#f9fafb", borderBottom: "1px solid #e5e7eb", direction: "rtl" }}>
        <span style={{ fontSize: 11, fontWeight: 700, flex: 1, color: "#1a2332" }}>{name}</span>
        <span style={{ fontSize: 10, padding: "1px 6px", borderRadius: 10, background: typeColor + "22", color: typeColor, fontWeight: 600 }}>{typeLabel}</span>
        {type !== "mgss" && (
          <span style={{ fontSize: 10, color: "#6b7280" }}>
            {min > 0 && `מינ׳ ${min} · `}{nonWOSelected}/{max === 999 ? "∞" : max}
          </span>
        )}
        {hasError && <span style={{ fontSize: 10, color: "#ef4444" }}>נדרשת בחירה</span>}
      </div>
      <div style={{ padding: "8px 10px", display: "flex", flexWrap: "wrap", gap: 5, direction: "rtl" }}>
        {members.map(m => {
          const checked  = cur.includes(m.id);
          const isDefault = isWO(m.id);
          const bg     = isDefault ? (checked ? "#f0fdf4" : "#fff5f5") : (checked ? "#eff6ff" : "#f9fafb");
          const border = isDefault ? (checked ? "#86efac" : "#fca5a5") : (checked ? "#93c5fd" : "#e5e7eb");
          const color  = isDefault ? (checked ? "#166534" : "#991b1b") : (checked ? "#1d4ed8" : "#6b7280");
          return (
            <button key={m.id} onClick={() => toggle(m.id)} style={{
              padding: "3px 9px", borderRadius: 20, border: `1.5px solid ${border}`,
              background: bg, color, fontSize: 11, cursor: "pointer",
              fontFamily: "var(--sans)", display: "flex", alignItems: "center", gap: 3,
              textDecoration: isDefault && !checked ? "line-through" : "none", transition: "all .1s",
            }}>
              {isDefault && <span style={{ fontSize: 9 }}>{checked ? "✓" : "✕"}</span>}
              {!isDefault && checked && <span style={{ fontSize: 9 }}>+</span>}
              {isWO(m.id) ? stripLelo(m.name) : m.name}
              {m.price > 0 && <span style={{ fontSize: 9, color: "#f59e0b", fontWeight: 700 }}>+{m.price}₪</span>}
            </button>
          );
        })}
      </div>
      {members.some(m => isWO(m.id)) && (
        <div style={{ padding: "0 10px 5px", direction: "rtl", fontSize: 9, color: "#9ca3af" }}>
          ירוק = ברירת מחדל (לחץ להסיר) · כחול = תוספת (לחץ להוסיף)
        </div>
      )}
    </div>
  );
}

// ── Item config panel ─────────────────────────────────────
function ItemConfig({ item, choices, onChange }) {
  return (
    <div style={{ padding: "12px 14px", direction: "rtl" }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: "#1a2332", marginBottom: 4 }}>{item.name}</div>
      {item.description && <div style={{ fontSize: 11, color: "#6b7280", marginBottom: 10 }}>{item.description}</div>}
      <div style={{ height: 1, background: "#e5e7eb", marginBottom: 10 }} />
      {(item.groups || []).length === 0 && (
        <div style={{ fontSize: 11, color: "#9ca3af", textAlign: "center", padding: "12px 0" }}>אין שינויים זמינים לפריט זה</div>
      )}
      {(item.groups || []).map(g => (
        <GroupEditor key={g.id} group={g} value={choices[g.id] || []}
          onChange={val => onChange({ ...choices, [g.id]: val })} />
      ))}
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────
export default function ItemPicker({ previewItems, onUpdate, onClose }) {
  const { enriched, loading } = useMenuWithGroups();
  const [search, setSearch]   = useState("");
  const [selectedId, setSelectedId] = useState(null);

  const [preview, setPreview] = useState(() =>
    new Map(previewItems.map(pi => [pi.item.id, pi]))
  );

  const sync = (map) => { setTimeout(() => onUpdate([...map.values()]), 0); };

  const toggleItem = (item) => {
    setPreview(prev => {
      const next = new Map(prev);
      if (next.has(item.id)) {
        next.delete(item.id);
        if (selectedId === item.id) setSelectedId(null);
      } else {
        next.set(item.id, { item, qty: 1, choices: initChoices(item.groups || []) });
        setSelectedId(item.id);
      }
      sync(next);
      return next;
    });
  };

  const toggleCat = (items) => {
    const allOn = items.every(i => preview.has(i.id));
    setPreview(prev => {
      const next = new Map(prev);
      if (allOn) {
        items.forEach(i => { next.delete(i.id); if (selectedId === i.id) setSelectedId(null); });
      } else {
        items.forEach(i => { if (!next.has(i.id)) next.set(i.id, { item: i, qty: 1, choices: initChoices(i.groups || []) }); });
      }
      sync(next);
      return next;
    });
  };

  const toggleAll = () => {
    const allItems = enriched;
    const allOn = allItems.every(i => preview.has(i.id));
    setPreview(prev => {
      const next = new Map(prev);
      if (allOn) {
        next.clear();
        setSelectedId(null);
      } else {
        allItems.forEach(i => { if (!next.has(i.id)) next.set(i.id, { item: i, qty: 1, choices: initChoices(i.groups || []) }); });
      }
      sync(next);
      return next;
    });
  };

  const updateChoices = (itemId, choices) => {
    setPreview(prev => {
      const next = new Map(prev);
      const e = next.get(itemId);
      if (e) next.set(itemId, { ...e, choices });
      sync(next);
      return next;
    });
  };

  const grouped = useMemo(() => {
    const lq = search.toLowerCase();
    const filtered = enriched.filter(item =>
      !search ||
      item.name.toLowerCase().includes(lq) ||
      (item.menu_categories?.name || "").toLowerCase().includes(lq)
    );
    const map = {};
    filtered.forEach(item => {
      const k = item.menu_categories?.name || "אחר";
      if (!map[k]) map[k] = [];
      map[k].push(item);
    });
    return Object.entries(map);
  }, [enriched, search]);

  const selItem  = selectedId ? enriched.find(i => i.id === selectedId) : null;
  const selEntry = selectedId ? preview.get(selectedId) : null;

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 400, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ background: "#fff", borderRadius: 14, width: "min(1000px, 96vw)", height: "min(720px, 92vh)", display: "flex", flexDirection: "column", overflow: "hidden", boxShadow: "0 20px 60px rgba(0,0,0,.25)" }}>

        {/* header */}
        <div style={{ display: "flex", alignItems: "center", padding: "12px 16px", background: "var(--bd)", color: "#fff", gap: 10, flexShrink: 0 }}>
          <button onClick={onClose} style={{ background: "transparent", border: "none", color: "rgba(255,255,255,.6)", fontSize: 20, cursor: "pointer" }}>✕</button>
          <span style={{ flex: 1, fontWeight: 700, fontSize: 15, textAlign: "right" }}>בחר פריטים לתצוגה מקדימה</span>
          <span style={{ fontSize: 12, opacity: 0.7 }} dir='rtl'>{preview.size} פריטים</span>
        </div>

        {/* body */}
        <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>

          {/* COL 1 — item list */}
          <div style={{ width: 260, display: "flex", flexDirection: "column", borderLeft: "1px solid #e5e7eb", flexShrink: 0 }}>
            <div style={{ padding: "8px 10px", borderBottom: "1px solid #e5e7eb", flexShrink: 0 }}>
              <input autoFocus type="text" value={search} onChange={e => setSearch(e.target.value)}
                placeholder="חיפוש..." style={{ width: "100%", padding: "6px 10px", borderRadius: 6, border: "1.5px solid #e5e7eb", fontSize: 12, outline: "none", direction: "rtl", fontFamily: "var(--sans)", background: "#f9fafb" }} />
              {!search && (() => {
                const allOn = enriched.length > 0 && enriched.every(i => preview.has(i.id));
                return (
                  <button onClick={toggleAll} style={{ marginTop: 6, width: "100%", padding: "4px 0", borderRadius: 6, border: "1px solid #e5e7eb", background: allOn ? "#fff5f5" : "#f0fdf4", color: allOn ? "#ef4444" : "var(--bm)", fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: "var(--sans)" }}>
                    {allOn ? "הסר בחירת הכל" : "בחר הכל"}
                  </button>
                );
              })()}
            </div>
            <div style={{ flex: 1, overflowY: "auto" }}>
              {loading && <div style={{ padding: 16, textAlign: "center", color: "#9ca3af", fontSize: 12 }}>טוען...</div>}
              {grouped.map(([catName, items]) => (
                <div key={catName}>
                  <div style={{ padding: "4px 10px", background: "#f3f4f6", fontSize: 10, fontWeight: 700, color: "#6b7280", direction: "rtl", borderBottom: "1px solid #e5e7eb", position: "sticky", top: 0, zIndex: 1, display: "flex", alignItems: "center" }}>
                    <span style={{ flex: 1 }}>{catName}</span>
                    {(() => {
                      const allOn = items.every(i => preview.has(i.id));
                      return (
                        <button onClick={e => { e.stopPropagation(); toggleCat(items); }}
                          style={{ fontSize: 9, padding: "1px 6px", borderRadius: 8, border: `1px solid ${allOn ? "#fca5a5" : "#bbf7d0"}`, background: allOn ? "#fff5f5" : "#f0fdf4", color: allOn ? "#ef4444" : "var(--bm)", cursor: "pointer", fontFamily: "var(--sans)", fontWeight: 600 }}>
                          {allOn ? "הסר הכל" : "בחר הכל"}
                        </button>
                      );
                    })()}
                  </div>
                  {items.map(item => {
                    const isOn  = preview.has(item.id);
                    const isSel = selectedId === item.id;
                    return (
                      <div key={item.id} onClick={() => { if (!isOn) toggleItem(item); else setSelectedId(isSel ? null : item.id); }}
                        style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 10px", direction: "rtl", cursor: "pointer", background: isSel ? "#f0fdf4" : "transparent", borderBottom: "1px solid rgba(0,0,0,0.04)", borderRight: `3px solid ${isSel ? "var(--bm)" : "transparent"}`, transition: "background .1s" }}
                      >
                        <div onClick={e => { e.stopPropagation(); toggleItem(item); }}
                          style={{ width: 16, height: 16, borderRadius: 4, flexShrink: 0, border: `2px solid ${isOn ? "var(--bm)" : "#d1d5db"}`, background: isOn ? "var(--bm)" : "#fff", display: "flex", alignItems: "center", justifyContent: "center" }}
                        >
                          {isOn && <span style={{ color: "#fff", fontSize: 9 }}>✓</span>}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 12, color: "#1a2332", fontWeight: isOn ? 600 : 400 }}>{item.name}</div>
                          {item.price > 0 && <div style={{ fontSize: 10, color: "#9ca3af" }}>{item.price}₪</div>}
                        </div>
                        {(item.groups || []).length > 0 && <span style={{ fontSize: 10, color: "#9ca3af" }}>⚙</span>}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>

          {/* COL 2 — group config */}
          <div style={{ flex: 1, overflowY: "auto", borderLeft: "1px solid #e5e7eb" }} dir='rtl'>
            {!selItem ? (
<div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 16, padding: "0 32px", textAlign: "center" }}>
  <span style={{ fontSize: 36 }}>🧾</span>
  <div style={{ fontSize: 14, fontWeight: 700, color: "#1a2332" }}>
    בנה תצוגה מקדימה מותאמת אישית
  </div>
  <div style={{ fontSize: 12, color: "#6b7280", lineHeight: 1.7 }}>
    בחר פריטים מהתפריט, הוסף משנים ושינויים — וראה בדיוק איך הבון ייראה בהדפסה.
    <br />
    ניתן לבחור כמה פריטים שרוצים ולשנות כל אחד בנפרד.
  </div>
  <div style={{ fontSize: 11, color: "#9ca3af", background: "#f3f4f6", borderRadius: 8, padding: "8px 14px", lineHeight: 1.6 }}>
    💡 לחץ על פריט ברשימה משמאל כדי להוסיף אותו לתצוגה
  </div>
</div>
            ) : (
              <ItemConfig item={selItem} choices={selEntry?.choices || {}}
                onChange={choices => updateChoices(selectedId, choices)} />
            )}
          </div>

          {/* COL 3 — selected summary */}
<div style={{ width: 190, display: "flex", flexDirection: "column", flexShrink: 0, background: "#f9fafb", borderLeft: "1px solid #e5e7eb"}}>
  <div style={{ padding: "8px 10px", borderBottom: "1px solid #e5e7eb", fontSize: 10, fontWeight: 700, color: "#6b7280", direction: "rtl", flexShrink: 0 }}>בתצוגה</div>
  <div style={{ flex: 1, overflowY: "auto" }}>
    {preview.size === 0 && <div style={{ padding: 12, fontSize: 11, color: "#9ca3af", textAlign: "center" }}>לא נבחרו פריטים</div>}
    {[...preview.values()].map(({ item, choices }) => {
      const isSel = selectedId === item.id;
      const groups = item.groups || [];
      const hasGroups = groups.length > 0;
      const hasRequired = groups.some(g => g.min > 0 && g.type !== 'mgss');
      const defaults = initChoices(groups);
      const hasChanges = hasGroups && Object.keys(defaults).some(gid => {
        const def = JSON.stringify([...(defaults[gid] || [])].sort());
        const cur = JSON.stringify([...(choices[gid] || [])].sort());
        return def !== cur;
      });

      // בנה רשימת שינויים לתצוגה
      const changeLines = [];
groups.forEach(g => {
  const def = defaults[g.id] || [];
  const cur = choices[g.id] || [];

  // מה הוסר (היה בברירת מחדל, אין עכשיו)
  def.forEach(memberId => {
    if (!cur.includes(memberId)) {
      const member = g.members.find(m => m.id === memberId);
      if (member) changeLines.push(`ללא ${member.name}`);
    }
  });

  // מה נוסף (לא היה בברירת מחדל, יש עכשיו)
  cur.forEach(memberId => {
    if (!def.includes(memberId)) {
      const member = g.members.find(m => m.id === memberId);
      if (member) changeLines.push(`עם ${member.name}`);
    }
  });
});

      return (
        <div key={item.id} onClick={() => setSelectedId(isSel ? null : item.id)}
          style={{
            padding: "8px 10px 8px 10px", direction: "rtl", cursor: "pointer",
            borderBottom: "1px solid #e5e7eb",
            background: isSel ? "#f0fdf4" : "#fff",
            borderRight: `3px solid ${isSel ? "var(--bm)" : "transparent"}`,
            position: "relative", overflow: "hidden",
          }}
        >
          {/* אינדיקציה: יש קבוצות — פינה שמאל למעלה */}
          {hasGroups && (
            <div style={{
              position: "absolute", top: 0, left: 0,
              background: hasRequired ? "#f2b230" : "#0B4440",
              color: "#fff", fontSize: 9, fontWeight: 700,
              padding: "4px 10px 4px 10px",
              borderRadius: "0 0 8px 0",
              lineHeight: 1,
            }}>
              {groups.length}
            </div>
          )}

          {/* אינדיקציה: עבר שינוי — פינה שמאל למטה */}
          {hasChanges && (
            <div style={{
              position: "absolute", bottom: 0, left: 0,
              background: "#73DED7", color: "#fff",
              fontSize: 8, fontWeight: 700,
              padding: "4px 8px 4px 8px",
              borderRadius: "0 8px 0 0",
              lineHeight: 1,
            }}>
              <PenLine size={8} color="#fff" strokeWidth={2.5} />
            </div>
          )}

          {/* שם הפריט */}
          <div style={{ fontSize: 11, fontWeight: 700, color: "#1a2332", marginBottom: changeLines.length ? 4 : 0 }}>
            {item.name}
          </div>

          {/* שורות שינויים */}
          {changeLines.map((line, i) => (
            <div key={i} style={{
              fontSize: 10, color: "#4b5563", lineHeight: 1.4,
              paddingRight: 6, borderRight: "2px solid #d1d5db",
              marginBottom: 1,
            }}>
              {line}
            </div>
          ))}

          {/* כפתור הסר */}
          <button
            onClick={e => { e.stopPropagation(); toggleItem(item); }}
            style={{
              marginTop: 6, fontSize: 10, fontWeight: 600,
              color: "#fff", background: "#ef4444",
              border: "none", borderRadius: 5,
              cursor: "pointer", padding: "2px 8px",
              fontFamily: "var(--sans)",
            }}
          >
            הסר
          </button>
        </div>
      );
    })}
  </div>
</div>
        </div>

        {/* footer */}
        <div style={{ display: "flex", gap: 8, padding: "10px 16px", borderTop: "1px solid #e5e7eb", flexShrink: 0 }}>
          <button onClick={onClose} style={{ padding: "8px 20px", borderRadius: 8, border: "none", background: "var(--bm)", color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "var(--sans)" }}>
            סגור ({preview.size})
          </button>
          {preview.size > 0 && (
            <button onClick={() => { setPreview(new Map()); sync(new Map()); }}
              style={{ padding: "8px 14px", borderRadius: 8, border: "1px solid #fecaca", background: "#fff5f5", color: "#ef4444", fontSize: 12, cursor: "pointer", fontFamily: "var(--sans)" }}>
              נקה הכל
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
