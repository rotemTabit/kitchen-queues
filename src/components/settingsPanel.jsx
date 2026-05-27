import { useState, useEffect, useRef } from "react";
import { MonitorPlay, Merge, ListChecks, Printer, Copy, Trash2, Plus, Minus, Settings, X, Check, PenLine, ReceiptText } from "lucide-react";
import PrinterPicker from "./PrinterPicker";
import MultiSelect from "./multiSelect";
import ParamsPanel from "./paramsPanel";
import ParamsTab from "./ParamsTab";
import { useTemplates, usePrinters, useParamGroups, useCategoryTree, useWorkflowProfiles, useMenuViews } from "../hooks/useSupabase";
import { CTX_ZONES } from '../data/bonConfig';
import ParamBot from "./Parambot";
import TreeSelect from "./TreeSelect";
import ItemsModal from "./ItemsModal";
import CtxPanel from "./CtxPanel";

// TMPLS → from Supabase via useTemplates()

const OT_OPTIONS = [
  { value: "SEATED", label: "ישיבה (Seated)" },
  { value: "TA", label: "טייק אווי (TA)" },
  { value: "DELIVERY", label: "משלוח (Delivery)" },
  { value: "OTC", label: "OTC - כל הסוגים" },
  { value: "OTC_SEATED", label: "OTC - ישיבה" },
  { value: "OTC_TA", label: "OTC - לקחת" },
];

const SRC_OPTIONS = [
  { value: "online", label: "אונליין" },
  { value: "restaurantOnPremise", label: "On Premise" },
  { value: "callCenter", label: "קול סנטר" },
  { value: "phone", label: "טלפוני" },
  { value: "external", label: "צד שלישי" },
  { value: "kiosk", label: "קיוסק" },
];

// IDs שלא נחשבים "פרמטרים" לצורך הלשונית
const NON_PARAM_KEYS = new Set([
  "INC_ITEMS","EXC_ITEMS","INC_CATS","EXC_CATS",
  "PRINT_ALL_ITEMS","KDS_ONLY","AGGREGATE",
]);

// ── Mini receipt preview ──────────────────────────────────
function TemplateReceipt({ template, bonName }) {
  const now = new Date();
  const dateStr = now.toLocaleDateString("he-IL");
  const timeStr = `${String(now.getHours()).padStart(2,"0")}:${String(now.getMinutes()).padStart(2,"0")}`;

  const S = {
    wrap: {
      border: "2px solid #1a4a3a", borderRadius: 10, background: "#f5f0e8",
      fontFamily: "'Courier New', Courier, monospace", direction: "rtl",
      overflow: "hidden", color: "#2a2a1a",
    },
    zigzag: { height: 8, background: `repeating-linear-gradient(-45deg,#f5f0e8 0 5px,#1a4a3a 5px 6px,#f5f0e8 6px 11px)` },
    inner: { padding: "10px 12px" },
    title: { textAlign: "center", fontWeight: 700, fontSize: 12, marginBottom: 6 },
    sep: { borderTop: "0.5px dashed #7a9a8a", margin: "6px 0" },
    sepSolid: { borderTop: "1px solid #7a9a8a", margin: "6px 0" },
    infoRow: { display: "flex", justifyContent: "space-between", fontSize: 9, marginBottom: 2 },
    item: { fontWeight: 700, fontSize: 10, margin: "2px 0", textAlign: "right" },
    itemNormal: { fontWeight: 400, fontSize: 10, margin: "2px 0", textAlign: "right" },
    footer: { textAlign: "center", fontSize: 9, color: "#5a7a6a", marginTop: 4 },
    empty: { textAlign: "center", color: "#8a9a8a", fontSize: 9, padding: "10px 0" },
    plateHdr: { textAlign: "center", fontWeight: 700, fontSize: 10, background: "#e8e3d8", padding: "2px 0", margin: "4px 0 2px" },
  };

  const DEMO = [
    { qty: 1, name: "סמאש בורגר" },
    { qty: 1, name: "צ׳יפס" },
    { qty: 1, name: "קוקה קולה" },
  ];

  const renderItems = () => {
    if (!template) return <div style={S.empty}>בחר תבנית לתצוגה</div>;
    if (template === "allday") {
      return (
        <>
          {[{ qty: 2, name: "סמאש בורגר" }, { qty: 2, name: "צ׳יפס" }, { qty: 2, name: "קוקה קולה" }].map((it, i) => (
            <div key={i} style={S.item}>{String(it.name).padEnd(18)} {it.qty}</div>
          ))}
        </>
      );
    }
    if (template === "peritem") {
      return (
        <>
          {[1, 2].map(i => (
            <div key={i}>
              {i > 1 && <div style={{ ...S.sep, borderStyle: "dashed" }} />}
              <div style={S.item}>1  סמאש בורגר</div>
              <div style={S.sep} />
              <div style={{ fontSize: 9, textAlign: "center", color: "#5a7a6a" }}>שולחן 2001</div>
            </div>
          ))}
        </>
      );
    }
    if (template === "perdiner") {
      return (
        <>
          {[1, 2].map(plate => (
            <div key={plate}>
              {plate > 1 && <div style={S.sep} />}
              <div style={S.plateHdr}>צלחת {plate}</div>
              <div style={S.sep} />
              {DEMO.map((it, i) => (
                <div key={i} style={S.itemNormal}>{it.qty}  {it.name}</div>
              ))}
            </div>
          ))}
        </>
      );
    }
    // general
    return (
      <>
        {[0, 1].map(gi => (
          <div key={gi}>
            {gi > 0 && <div style={S.sep} />}
            {DEMO.map((it, i) => (
              <div key={i} style={S.item}>{it.qty}  {it.name}</div>
            ))}
          </div>
        ))}
      </>
    );
  };

  return (
    <div style={S.wrap}>
      <div style={S.zigzag} />
      <div style={S.inner}>
        <div style={S.title}>{bonName || "שם הבון"}</div>
        <div style={S.sep} />
        {template && (
          <>
            <div style={S.infoRow}>
              <span>מלצר: ישראל ישראלי</span>
              <span>שולחן: 2001</span>
            </div>
            <div style={{ fontSize: 9, textAlign: "center", marginBottom: 2 }}>סועדים: 2</div>
            <div style={S.sepSolid} />
          </>
        )}
        {renderItems()}
        {template && (
          <>
            <div style={S.sepSolid} />
            <div style={S.footer}>{dateStr} · {timeStr}</div>
          </>
        )}
      </div>
      <div style={S.zigzag} />
    </div>
  );
}

// ── buildParamMeta — סריקת CTX_ZONES לקבלת label + zone לכל פרמטר ──────────
const ZONE_LABELS = {
  general: { label: 'כללי',         bg: '#f0fdf4', color: '#166534', border: '#bbf7d0' },
  header:  { label: 'ראש הבון',     bg: '#eff6ff', color: '#1d4ed8', border: '#bfdbfe' },
  items:   { label: 'פריטים',       bg: '#fdf4ff', color: '#7e22ce', border: '#e9d5ff' },
  footer:  { label: 'תחתית הבון',   bg: '#fff7ed', color: '#c2410c', border: '#fed7aa' },
};

function buildParamMeta() {
  const map = {};
  Object.entries(CTX_ZONES).forEach(([zoneKey, zoneDef]) => {
    Object.values(zoneDef.cats).forEach(catParams => {
      catParams.forEach(p => {
        map[p.id] = {
          lbl:      p.lbl || p.id,
          sub:      p.sub || null,
          parentId: p.parentId || null,
          zone:     zoneKey,
          type:     p.type || 'bool',
          virtual:  p.id.startsWith('__'),
        };
      });
    });
  });
  return map;
}

const PARAM_META = buildParamMeta();

// ── Active Params Tab ─────────────────────────────────────────────────────
// מציג רק פרמטרים פעילים + כפתור "הוספת פרמטרים"
function ActiveParamsTab({ params, onParamChange, paramGroups, onAddParam }) {
  const wpProfiles = useWorkflowProfiles(); // לתצוגת UUID → label
  const menuViews  = useMenuViews();

  const resolveLabel = (paramId, val) => {
    if (paramId === 'EXCLUDE_PROFILE_' || paramId === 'INCLUDE_PROFILE_') {
      return wpProfiles.find(p => p.id === val)
        ? `${wpProfiles.find(p => p.id === val).type_display_name} — ${wpProfiles.find(p => p.id === val).name}`
        : val;
    }
    if (paramId === 'EXCLUDE_MENU_VIEW_') {
      return menuViews.find(v => v.id === val)?.name || val;
    }
    return val;
  };

  const isActive = (val) => {
    if (Array.isArray(val)) return val.length > 0;
    if (typeof val === 'number') return val > 0;
    return !!val;
  };

  const activeEntries = Object.entries(params).filter(([k, v]) => {
    if (NON_PARAM_KEYS.has(k)) return false;
    if (!isActive(v)) return false;
    const meta = PARAM_META[k];
    if (meta?.virtual) return false;
    return true;
  });

  const [undoEntry, setUndoEntry] = useState(null);
  const undoTimer = useRef(null);

  const handleRemove = (id, val) => {
    onParamChange(id, false);
    if (undoTimer.current) clearTimeout(undoTimer.current);
    setUndoEntry({ id, val });
    undoTimer.current = setTimeout(() => setUndoEntry(null), 5000);
  };

  const handleUndo = () => {
    if (!undoEntry) return;
    onParamChange(undoEntry.id, undoEntry.val);
    if (undoTimer.current) clearTimeout(undoTimer.current);
    setUndoEntry(null);
  };

  const byZone = {};
  activeEntries.forEach(([id, val]) => {
    const meta = PARAM_META[id];
    const zone = meta?.zone || 'items';
    if (!byZone[zone]) byZone[zone] = [];
    byZone[zone].push({ id, val, meta });
  });

  const zoneOrder = ['general', 'header', 'items', 'footer'];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ flex: 1, overflowY: 'auto', padding: '8px 12px' }}>
        {activeEntries.length === 0 ? (
          <div style={{ padding: '32px 16px', textAlign: 'center', color: 'var(--sub)', fontSize: 12, direction: 'rtl' }}>
            <div style={{ fontSize: 28, marginBottom: 10 }}>🎛️</div>
            <div style={{ fontWeight: 600, marginBottom: 4 }}>אין פרמטרים פעילים</div>
            <div style={{ opacity: .7 }}>לחץ על "הוספת פרמטרים" כדי להתחיל</div>
          </div>
        ) : (
          zoneOrder.filter(z => byZone[z]).map(zoneKey => {
            const zm = ZONE_LABELS[zoneKey] || ZONE_LABELS.items;
            return (
              <div key={zoneKey} style={{ marginBottom: 12 }}>
                <div style={{
                  fontSize: 10, fontWeight: 700, color: zm.color,
                  background: zm.bg, border: `1px solid ${zm.border}`,
                  borderRadius: 6, padding: '3px 10px', marginBottom: 6,
                  direction: 'rtl', display: 'inline-block',
                }}>
                  {zm.label}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {byZone[zoneKey].map(({ id, val, meta }) => {
                    const activeChildren = Object.entries(params).filter(([cid, cv]) => {
                      const cm = PARAM_META[cid];
                      return cm?.parentId === id && isActive(cv) && !cm?.virtual;
                    });
                    return (
                      <div key={id} style={{ background: '#fff', border: '1.5px solid var(--bdr)', borderRadius: 8, overflow: 'hidden' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', direction: 'rtl' }}>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--bd)' }}>{meta?.lbl || id}</div>
                            {typeof val === 'number' && val > 1 && (
                              <div style={{ fontSize: 10, color: 'var(--sub)', marginTop: 1 }}>ערך: {val}</div>
                            )}
                            {Array.isArray(val) && val.length > 0 && (
                              <div style={{ fontSize: 10, color: 'var(--sub)', marginTop: 1 }}>{val.join(' · ')}</div>
                            )}
                          </div>
                          <button
                            onClick={() => handleRemove(id, val)}
                            style={{
                              background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 6,
                              color: '#ef4444', cursor: 'pointer', fontSize: 11, fontWeight: 700,
                              padding: '3px 8px', fontFamily: 'var(--sans)', flexShrink: 0,
                            }}
                          >הסר</button>
                        </div>
                        {activeChildren.map(([cid, cv]) => {
                          const cm = PARAM_META[cid];
                          return (
                            <div key={cid} style={{
                              display: 'flex', alignItems: 'center', gap: 8,
                              padding: '5px 10px', direction: 'rtl',
                              background: '#f8fafb', borderTop: '1px solid var(--bdr)', marginRight: 12,
                            }}>
                              <span style={{ fontSize: 10, color: 'var(--sub)', marginLeft: 2 }}>↳</span>
                              <div style={{ flex: 1, fontSize: 11, color: 'var(--sub)' }}>{cm?.lbl || cid}</div>
                              <button onClick={() => handleRemove(cid, cv)}
                                style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: 14, lineHeight: 1, padding: '0 2px' }}>×</button>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })
        )}
      </div>

      {undoEntry && (
        <div style={{
          margin: '0 12px 8px', padding: '8px 12px', borderRadius: 8,
          background: 'var(--bd)', color: '#fff', direction: 'rtl',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          fontSize: 12, flexShrink: 0,
        }}>
          <span>הפרמטר הוסר</span>
          <button onClick={handleUndo} style={{
            background: 'var(--ba)', border: 'none', borderRadius: 5,
            color: 'var(--bd)', fontSize: 11, fontWeight: 700,
            cursor: 'pointer', padding: '3px 10px', fontFamily: 'var(--sans)',
          }}>ביטול</button>
        </div>
      )}

      <div style={{ padding: '10px 12px', borderTop: '1px solid var(--bdr)', flexShrink: 0 }}>
        <button onClick={onAddParam}
          style={{
            width: '100%', padding: '10px 14px', borderRadius: 9,
            border: '1.5px solid var(--bm)', background: 'var(--bm)',
            color: 'var(--ba)', fontSize: 13, fontFamily: 'var(--sans)',
            cursor: 'pointer', fontWeight: 700, direction: 'rtl',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'var(--bd)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'var(--bm)'; }}
        >
          <span style={{ fontSize: 18, lineHeight: 1 }}>＋</span>
          הוספת פרמטרים
        </button>
      </div>
    </div>
  );
}


// ── Main component ────────────────────────────────────────
export default function SettingsPanel({
  bonName, setBonName,
  template, setTemplate,
  params, onParamChange,
  orderTypes, setOrderTypes,
  sources, setSources,
  menu,
  selectedPrinters, setSelectedPrinters,
  copies, setCopies,
  zoneFilter = [],
  onZoneFilterChange,
  onBonFlash,
  onZoneFilterClear,
  paramsTabActive = false,
  onParamsTabActivated,
}) {
  const [activeTab, setActiveTab]         = useState("bon");

  // עבור לטאב פרמטרים כשZoneButtons לוחץ
  useEffect(() => {
    if (paramsTabActive) {
      setActiveTab("params");
      onParamsTabActivated?.();
    }
  }, [paramsTabActive]);
  const [showBot, setShowBot]             = useState(false);
  const [botKey, setBotKey]               = useState(0);
  const [itemsModalOpen, setItemsModalOpen] = useState(false);
  // ── Picker state ──

  // ── Supabase data ──
  const { templates }     = useTemplates();
  const { printers }      = usePrinters();
  const { paramGroups }   = useParamGroups();
  const { tree, flatItems } = useCategoryTree();

  const activePrinters = printers.filter(p => selectedPrinters.includes(p.id));
  const printerColor   = activePrinters.length > 0 ? "#4caf50" : "#f59e0b";

  const bonOk    = !!template && !!bonName?.trim();
  const bonColor = bonOk ? "#4caf50" : "#f59e0b";
  const itemsOk  = !!params["PRINT_ALL_ITEMS"]
    || (params["INC_ITEMS"] || []).length > 0
    || (params["INC_CATS"]  || []).length > 0;
  const itemsColor  = itemsOk ? "#4caf50" : "#f59e0b";
  const hasParams   = Object.entries(params).some(([k, v]) =>
    !NON_PARAM_KEYS.has(k) && !!v
  );
  const paramsColor = hasParams ? "#4caf50" : "#64748b";

  const iconStyle = { display: "inline", verticalAlign: "middle", marginLeft: 4 };
  const TABS = [
    { id: "bon",    label: "הגדרות בון", icon: <Settings size={12} color={bonColor}    style={iconStyle} /> },
    { id: "print",  label: "הדפסה",      icon: <Printer  size={12} color={printerColor} style={iconStyle} /> },
    { id: "items",  label: "פריטים",     icon: itemsOk ? <Check size={12} color={itemsColor} style={iconStyle} /> : <X size={12} color={itemsColor} style={iconStyle} /> },
    { id: "params", label: "פרמטרים",    icon: <PenLine  size={12} color={paramsColor}  style={iconStyle} /> },
  ];

  return (
    <>
      {/* ── Topbar ── */}
      <div className="topbar">
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Settings size={20} color="var(--bm)" />
          <span style={{ fontSize: 22, fontWeight: 900, color: "var(--bd)", letterSpacing: -0.5 }}>
            הגדרת בון: {bonName?.trim() || "בון חדש"}
          </span>
        </div>
        {/* AI pill */}
        {!showBot ? (
          <div onClick={() => setShowBot(true)} style={{ display: "flex", alignItems: "center", cursor: "pointer" }}>
            <div style={{
              background: "#0d4a3e", color: "#5DCAA5", fontFamily: "var(--sans)", fontSize: 13, fontWeight: 600,
              padding: "0 14px 0 18px", height: 27, borderRadius: "22px 0 0 22px",
              display: "flex", alignItems: "center", whiteSpace: "nowrap",
              border: "1.5px solid #0d4a3e", borderRight: "none", marginRight: -1,
            }} dir='rtl'>עוזר AI</div>
            <div style={{
              width: 38, height: 38, borderRadius: "50%", background: "#1D9E75",
              border: "2px solid #5DCAA5", display: "flex", alignItems: "center",
              justifyContent: "center", flexShrink: 0, boxShadow: "0 0 0 3px #0d4a3e",
            }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
                style={{ display: "block", transformOrigin: "12px 12px", animation: "tabot-spin .75s ease-in-out alternate infinite" }}>
                <path d="M12 2 L13.4 10.6 L22 12 L13.4 13.4 L12 22 L10.6 13.4 L2 12 L10.6 10.6 Z" fill="white"/>
                <path d="M20 3 L20.6 5.4 L23 6 L20.6 6.6 L20 9 L19.4 6.6 L17 6 L19.4 5.4 Z" fill="white" opacity="0.75"/>
                <path d="M4 17 L4.5 19.5 L7 20 L4.5 20.5 L4 23 L3.5 20.5 L1 20 L3.5 19.5 Z" fill="white" opacity="0.55"/>
              </svg>
            </div>
          </div>
        ) : null}
      </div>

      {/* ── Content area: tabs + scroll + overlays — topbar בחוץ ── */}
      <div style={{ position: 'relative', flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minHeight: 0 }}>

      {/* ── Tabs ── */}
      <div className="tabs" dir='rtl'>
        {TABS.map(t => (
          <div key={t.id} className={`tab${activeTab === t.id ? " on" : ""}`} onClick={() => setActiveTab(t.id)}>
            {t.icon}{t.label}
          </div>
        ))}
      </div>

      <div className="right-scroll" style={activeTab === 'params' ? { padding: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' } : {}}>

        {/* ── BON SETTINGS ── */}
        {activeTab === "bon" && (
          <div>
            <div className="section-label">בחירת תבנית</div>
            <div style={{ display: "flex", gap: 12, direction: "rtl", alignItems: "flex-start" }}>
              <div style={{ flex: "0 0 50%" }}>
                <div style={{ marginBottom: 10 }}>
                  <select
                    value={template || ""}
                    onChange={e => setTemplate(e.target.value || null)}
                    style={{
                      width: "100%", padding: "8px 10px", borderRadius: 8,
                      border: "1.5px solid var(--bdr)", background: "#fff",
                      color: template ? "var(--text)" : "#b0bec5",
                      fontSize: 12, fontFamily: "var(--sans)", cursor: "pointer",
                      outline: "none", direction: "rtl", appearance: "none",
                      backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6' viewBox='0 0 10 6'%3E%3Cpath d='M1 1l4 4 4-4' stroke='%235a6a7a' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E")`,
                      backgroundRepeat: "no-repeat", backgroundPosition: "left 10px center",
                    }}
                  >
                    <option value="">בחירת תבנית</option>
                    {templates.map(t => <option key={t.id} value={t.key}>{t.name}</option>)}
                  </select>
                </div>
                {(() => {
                  const sel = templates.find(t => t.key === template);
                  return (
                    <div style={{ border: "1.5px solid var(--bdr)", borderRadius: 8, background: "#f8fafb", padding: "10px 12px", minHeight: 64, direction: "rtl" }}>
                      {sel ? (
                        <>
                          <div style={{ fontSize: 11, fontWeight: 700, color: "var(--bm)", marginBottom: 5 }}>{sel.name}</div>
                          <div style={{ fontSize: 11, color: "var(--sub)", lineHeight: 1.6 }}>{sel.description || sel.desc}</div>
                        </>
                      ) : (
                        <div style={{ fontSize: 12, color: "#f59e0b", textAlign: "center", paddingTop: 14, fontWeight: 700 }}>
                          נא לבחור תבנית הדפסה
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>
              <div style={{ flex: "0 0 calc(50% - 12px)" }}>
                <TemplateReceipt template={template} bonName={bonName} />
              </div>
            </div>

            <div className="section-label">פרטי בון</div>
            <div className="field">
              <label>שם הבון</label>
              <input type="text" value={bonName} onChange={e => setBonName(e.target.value)} placeholder="שם הבון" dir="rtl" />
            </div>
            <div className="field">
              <label>קוד בון</label>
              <div className="code-field">
                <input className="code-input" defaultValue="7294" style={{ textAlign: "right" }} />
                <div className="code-prefix">-BON</div>
              </div>
            </div>
          </div>
        )}

        {/* ── PRINT ── */}
        {activeTab === "print" && (
          <div>
            <div className="section-label">מדפסת</div>
            <div className="pr" style={{ flexDirection: "column", alignItems: "stretch", gap: 8 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, direction: "rtl" }}>
                <Printer size={18} color="var(--bm)" style={{ flexShrink: 0 }} />
                <div className="pr-l">
                  <div className="pr-lbl">בחירת מדפסות</div>
                  <div className="pr-sub">הבון ישלח למדפסות שנבחרו</div>
                </div>
              </div>
              <PrinterPicker printers={printers} selectedPrinters={selectedPrinters} setSelectedPrinters={setSelectedPrinters} />
            </div>

            <div className="pr">
              <label className="tg">
                <input type="checkbox" checked={!!params["KDS_ONLY"]} onChange={e => onParamChange("KDS_ONLY", e.target.checked)} />
                <div className="tg-tr" /><div className="tg-th" />
              </label>
              <div className="pr-l">
                <div className="pr-lbl">הדפסה מ-KDS בלבד</div>
                <div className="pr-sub">הבון יודפס רק לאחר אישור ב-KDS</div>
              </div>
              <MonitorPlay size={18} color="var(--bm)" style={{ flexShrink: 0, marginLeft: 12 }} />
            </div>

            <div className="pr">
              <label className="tg">
                <input type="checkbox" checked={!!params["AGGREGATE"]} onChange={e => onParamChange("AGGREGATE", e.target.checked)} />
                <div className="tg-tr" /><div className="tg-th" />
              </label>
              <div className="pr-l">
                <div className="pr-lbl">אגרגציה</div>
                <div className="pr-sub">פריטים זהים מקובצים יחד</div>
              </div>
              <Merge size={18} color="var(--bm)" style={{ flexShrink: 0, marginLeft: 12 }} />
            </div>

            <div className="pr">
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                <button
                  onClick={() => setCopies(c => Math.max(1, c - 1))}
                  style={{ width: 26, height: 26, borderRadius: 6, border: '1.5px solid var(--bdr)', background: '#f8fafb', color: 'var(--sub)', fontSize: 16, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1 }}
                >−</button>
                <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--bd)', minWidth: 20, textAlign: 'center', fontFamily: 'var(--mono)' }}>{copies}</span>
                <button
                  onClick={() => setCopies(c => Math.min(10, c + 1))}
                  style={{ width: 26, height: 26, borderRadius: 6, border: '1.5px solid var(--bdr)', background: '#f8fafb', color: 'var(--sub)', fontSize: 16, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1 }}
                >+</button>
              </div>
              <div className="pr-l">
                <div className="pr-lbl">מספר עותקים</div>
                <div className="pr-sub">כמה עותקים להדפיס מכל בון</div>
              </div>
              <Copy size={18} color="var(--bm)" style={{ flexShrink: 0, marginLeft: 12 }} />
            </div>

            <div className="section-label">הגבלות</div>
            <div className="field">
              <label>סוגי הזמנה</label>
              <MultiSelect options={OT_OPTIONS} selected={orderTypes} onChange={setOrderTypes} placeholder="כל סוגי ההזמנה" />
            </div>
            <div className="field">
              <label>מקורות הזמנה</label>
              <MultiSelect options={SRC_OPTIONS} selected={sources} onChange={setSources} placeholder="כל המקורות" />
            </div>
          </div>
        )}

        {/* ── ITEMS ── */}
        {activeTab === "items" && (
          <div>
            <div className="section-label">הגדרות הדפסה</div>
            <div className="pr">
              <label className="tg">
                <input type="checkbox" checked={!!params["PRINT_ALL_ITEMS"]} onChange={e => onParamChange("PRINT_ALL_ITEMS", e.target.checked)} />
                <div className="tg-tr" /><div className="tg-th" />
              </label>
              <div className="pr-l">
                <div className="pr-lbl">הדפסת כל הפריטים</div>
                <div className="pr-sub">כולל פריטים ללא שינויים</div>
                {!!params["PRINT_ALL_ITEMS"] && (
                  <div style={{ fontSize: 10, color: "var(--bm)", marginTop: 4, fontWeight: 500 }}>
                    כלל הפריטים בקטלוג מודפסים למעט פריטים שהוחרגו
                  </div>
                )}
              </div>
              <ListChecks size={18} color="var(--bm)" style={{ flexShrink: 0, marginLeft: 12 }} />
            </div>

            <div className="section-label">סינון פריטים</div>
            {(() => {
              const incI = (params["INC_ITEMS"] || []).length;
              const incC = (params["INC_CATS"]  || []).length;
              const excI = (params["EXC_ITEMS"] || []).length;
              const excC = (params["EXC_CATS"]  || []).length;
              const hasInc = incI + incC > 0;
              const hasExc = excI + excC > 0;
              const printAll = !!params["PRINT_ALL_ITEMS"];
              return (
                <div style={{ marginBottom: 12, direction: "rtl" }}>
                  {!hasInc && !hasExc && (
                    <div style={{ fontSize: 11, color: "#9ca3af", marginBottom: 8 }}>
                      {printAll ? "לא הוגדרו החרגות — כל הפריטים יודפסו" : "לא נבחרו פריטים"}
                    </div>
                  )}
                  {hasInc && !printAll && (
                    <div style={{ fontSize: 11, color: "var(--bm)", marginBottom: 4 }}>
                      ✓ {incI > 0 ? `${incI} פריטים` : ""}{incI > 0 && incC > 0 ? " + " : ""}{incC > 0 ? `${incC} קטגוריות` : ""} להדפסה
                    </div>
                  )}
                  {hasExc && (
                    <div style={{ fontSize: 11, color: "#ef4444", marginBottom: 4 }}>
                      ✕ {excI > 0 ? `${excI} פריטים` : ""}{excI > 0 && excC > 0 ? " + " : ""}{excC > 0 ? `${excC} קטגוריות` : ""} מוחרגים
                    </div>
                  )}
                </div>
              );
            })()}
            <button
              onClick={() => setItemsModalOpen(true)}
              style={{
                width: "100%", padding: "9px 14px", borderRadius: 8,
                border: "1.5px dashed var(--bm)", background: "#f0fdf6",
                color: "var(--bm)", fontSize: 12, fontFamily: "var(--sans)",
                cursor: "pointer", fontWeight: 600, direction: "rtl",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
              }}
            >
              <span>⊞</span>
              {!!params["PRINT_ALL_ITEMS"] ? "הגדר החרגות" : "בחר פריטים להדפסה"}
            </button>
          </div>
        )}

        {/* ── PARAMS ── */}
        {activeTab === "params" && (
          <ParamsTab
            params={params}
            onParamChange={onParamChange}
            template={template}
            initialZoneFilter={zoneFilter}
            onZoneFilterChange={onZoneFilterChange}
            onBonFlash={onBonFlash}
          />
        )}
      </div>

      {/* Items Modal */}
      {itemsModalOpen && (
        <ItemsModal
          tree={tree}
          printAll={!!params["PRINT_ALL_ITEMS"]}
          incCats={params["INC_CATS"] || []}
          incItems={params["INC_ITEMS"] || []}
          excCats={params["EXC_CATS"] || []}
          excItems={params["EXC_ITEMS"] || []}
          onSave={({ incCats, incItems, excCats, excItems }) => {
            onParamChange("INC_CATS",  incCats);
            onParamChange("INC_ITEMS", incItems);
            onParamChange("EXC_CATS",  excCats);
            onParamChange("EXC_ITEMS", excItems);
          }}
          onClose={() => setItemsModalOpen(false)}
        />
      )}

      <style>{`@keyframes tabot-spin{0%{transform:rotate(-18deg) scale(.95)}100%{transform:rotate(18deg) scale(1.1)}}`}</style>

      </div>{/* /content area */}



      {/* ── ParamBot overlay — מכסה הכל כולל הטופבר ── */}
      {showBot && (
        <ParamBot
          key={botKey}
          params={params}
          onParamChange={onParamChange}
          onClose={() => setShowBot(false)}
          template={template}
          setTemplate={setTemplate}
          printers={printers}
          selectedPrinters={selectedPrinters}
          setSelectedPrinters={setSelectedPrinters}
          orderTypes={orderTypes}
          setOrderTypes={setOrderTypes}
          sources={sources}
          setSources={setSources}
          tree={tree}
          flatItems={flatItems}
          bonName={bonName}
          setBonName={setBonName}
        />
      )}
    </>
  );
}
