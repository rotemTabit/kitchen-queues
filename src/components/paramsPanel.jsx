import { useState } from "react";

export default function ParamsPanel({ params, onParamChange, paramGroups = [] }) {
  const [collapsed, setCollapsed] = useState(
    Object.fromEntries(paramGroups.map(g => [g.id, true]))
  );

  const toggleGroup = (id) =>
    setCollapsed(p => ({ ...p, [id]: !p[id] }));

  if (!paramGroups.length) return (
    <div style={{ padding: 24, color: "var(--sub)", fontSize: 12, textAlign: "center" }}>
      טוען פרמטרים...
    </div>
  );

  return (
    <div>
      {paramGroups.map(group => {
        const activeCount = group.params.filter(p => params[p.id]).length;
        const isCollapsed = collapsed[group.id] !== false;
        return (
          <div key={group.id} className={`pg${isCollapsed ? " collapsed" : ""}`}>
            <div className="pg-hdr" onClick={() => toggleGroup(group.id)}>
              <span className="pg-icon">{group.icon}</span>
              <span className="pg-ttl">{group.label}</span>
              {activeCount > 0 && (
                <span className="pg-count">{activeCount}/{group.params.length}</span>
              )}
              <span className="pg-arr">▼</span>
            </div>
            {!isCollapsed && (
              <div className="pg-body">
                {group.params.map(p => (
                  <div key={p.id} className="pr">
                    <div className="pr-l" style={{ paddingLeft: '12px' }}>
                      <div className="pr-lbl">{p.lbl}</div>
                      {p.sub && <div className="pr-sub">{p.sub}</div>}
                    </div>
                    <label className="tg">
                      <input
                        type="checkbox"
                        checked={!!params[p.id]}
                        onChange={e => onParamChange(p.id, e.target.checked)}
                      />
                      <div className="tg-tr" />
                      <div className="tg-th" />
                    </label>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
