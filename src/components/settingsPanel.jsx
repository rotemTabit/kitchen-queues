import { useState, useEffect, useRef } from "react";
import { MonitorPlay, Merge, ListChecks, Printer, Copy, Trash2, Plus, Minus, Settings, X, Check, PenLine, ReceiptText } from "lucide-react";
import MultiSelect from "./multiSelect";
import ParamsPanel from "./paramsPanel";
import { useTemplates, usePrinters, useParamGroups, useCategoryTree } from "../hooks/useSupabase";
import ParamBot from "./Parambot";
import TreeSelect from "./TreeSelect";
import ItemsModal from "./ItemsModal";

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

// PRINTERS → from Supabase via usePrinters()

const DEMO_ITEMS_GENERAL = [
  [
    { qty: 1, name: "סמאש בורגר" },
    { qty: 1, name: "צ׳יפס" },
    { qty: 1, name: "קוקה קולה" },
  ],
  [
    { qty: 1, name: "סמאש בורגר" },
    { qty: 1, name: "צ׳יפס" },
    { qty: 1, name: "קוקה קולה" },
  ],
];
const DEMO_ITEMS_ALLDAY = [
  [
    { qty: 2, name: "סמאש בורגר" },
    { qty: 2, name: "צ׳יפס" },
    { qty: 2, name: "קוקה קולה" },
  ],
];

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

    // general (default)
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

// ── Main component ────────────────────────────────────────
export default function SettingsPanel({
  bonName, setBonName,
  template, setTemplate,
  params, onParamChange,
  orderTypes, setOrderTypes,
  sources, setSources,
  menu,
}) {
  const [activeTab, setActiveTab]         = useState("bon");
  const [selectedPrinters, setSelectedPrinters] = useState([]);
  const [showBot, setShowBot]                 = useState(false);
  const [botKey, setBotKey]                   = useState(0);
  const [copies, setCopies]               = useState(1);
  const [itemsModalOpen, setItemsModalOpen] = useState(false);

  // ── Supabase data ──
  const { templates }               = useTemplates();
  const { printers }                = usePrinters();
  const { paramGroups }             = useParamGroups();
  const { tree, flatItems }           = useCategoryTree();

  const allItems = menu.flatMap(cat => (cat.items || []).map(it => ({
    value: it.id, label: it.name,
  })));
  const allCats = menu.map(cat => ({
    value: cat.id, label: `${cat.display || cat.name} (${(cat.items || []).length})`,
  }));

  const activePrinters = printers.filter(p => selectedPrinters.includes(p.id));
  const printerColor   = activePrinters.length > 0 ? "#4caf50" : "#f59e0b";

  // ── Tab status indicators ──
  const bonOk      = !!template && !!bonName?.trim();
  const bonColor   = bonOk ? "#4caf50" : "#f59e0b";
  const itemsOk    = !!params["PRINT_ALL_ITEMS"]
    || (params["INC_ITEMS"] || []).length > 0
    || (params["INC_CATS"]  || []).length > 0;
  const itemsColor = itemsOk ? "#4caf50" : "#f59e0b";
  const hasParams  = Object.entries(params).some(([k, v]) =>
    !["INC_ITEMS","EXC_ITEMS","INC_CATS","EXC_CATS","PRINT_ALL_ITEMS","KDS_ONLY","AGGREGATE"].includes(k) && !!v
  );
  const paramsColor = hasParams ? "#4caf50" : "#64748b";

  const iconStyle = { display: "inline", verticalAlign: "middle", marginRight: 4 };
  const TABS = [
    { id: "params", label: "פרמטרים", icon: <PenLine size={12} color={paramsColor} style={iconStyle} /> },
    { id: "items",  label: "פריטים",  icon: itemsOk ? <Check size={12} color={itemsColor} style={iconStyle} /> : <X size={12} color={itemsColor} style={iconStyle} /> },
    { id: "print",  label: "הדפסה",   icon: <Printer size={12} color={printerColor} style={iconStyle} /> },
    { id: "bon",    label: "הגדרות בון", icon: <Settings size={12} color={bonColor} style={iconStyle} /> },
  ];

  return (
    <>
      {/* ── Toast ── */}

      {/* ── Topbar ── */}
      <div className="topbar">
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <ReceiptText size={18} color="var(--bm)" />
          <span style={{ fontSize: 22, fontWeight: 900, color: "var(--bd)", letterSpacing: -0.5 }}>
            {bonName?.trim() || "בון חדש"}
          </span>
        </div>
        {/* AI pill — doubles as bot header when open */}
        <div
          onClick={() => setShowBot(b => !b)}
          style={{ display: "flex", alignItems: "center", cursor: "pointer" }}
        >
          {showBot ? (
            /* When bot is open: show X + נקה as the pill content */
            <div style={{
              display: "flex", alignItems: "center", gap: 6,
              background: "#0d4a3e", borderRadius: "22px 0 0 22px",
              padding: "0 10px 0 14px", height: 36,
              border: "1.5px solid #1D9E75", borderRight: "none",
              marginRight: -1,
            }}>
              <button onClick={e => { e.stopPropagation(); setShowBot(false); }}
                style={{ background: "none", border: "none", cursor: "pointer",
                         color: "#5DCAA5", fontSize: 16, lineHeight: 1, padding: 0 }}>✕</button>
              <button onClick={e => { e.stopPropagation(); setBotKey(k => k+1); }}
                style={{ background: "rgba(255,255,255,0.1)", border: "none", cursor: "pointer",
                         color: "#5DCAA5", fontSize: 11, borderRadius: 5,
                         padding: "2px 8px", fontFamily: "var(--sans)" }}>↺ נקה</button>
            </div>
          ) : (
            <div style={{
              background: "#0d4a3e", color: "#5DCAA5",
              fontFamily: "var(--sans)", fontSize: 13, fontWeight: 600,
              padding: "0 14px 0 18px", height: 27, borderRadius: "22px 0 0 22px",
              display: "flex", alignItems: "center", whiteSpace: "nowrap",
              border: "1.5px solid #0d4a3e", borderRight: "none", marginRight: -1,
              transition: "background .2s",
            }} dir='rtl'>עוזר AI</div>
          )}
          <div style={{
            width: 38, height: 38, borderRadius: "50%",
            background: showBot ? "rgba(0,0,0,0.65)" : "#1D9E75",
            border: "2px solid #5DCAA5",
            display: "flex", alignItems: "center", justifyContent: "center",
            flexShrink: 0, transition: "background .2s",
            boxShadow: "0 0 0 3px #0d4a3e",
          }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
              style={{ display: "block", transformOrigin: "12px 12px",
                       animation: "tabot-spin .75s ease-in-out alternate infinite" }}>
              <path d="M12 2 L13.4 10.6 L22 12 L13.4 13.4 L12 22 L10.6 13.4 L2 12 L10.6 10.6 Z" fill="white"/>
              <path d="M20 3 L20.6 5.4 L23 6 L20.6 6.6 L20 9 L19.4 6.6 L17 6 L19.4 5.4 Z" fill="white" opacity="0.75"/>
              <path d="M4 17 L4.5 19.5 L7 20 L4.5 20.5 L4 23 L3.5 20.5 L1 20 L3.5 19.5 Z" fill="white" opacity="0.55"/>
            </svg>
          </div>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className="tabs">
        {TABS.map(t => (
          <div key={t.id} className={`tab${activeTab === t.id ? " on" : ""}`} onClick={() => setActiveTab(t.id)}>
            {t.icon}{t.label}
          </div>
        ))}
      </div>

      <div className="right-scroll">

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
                    <div style={{
                      border: "1.5px solid var(--bdr)", borderRadius: 8,
                      background: "#f8fafb", padding: "10px 12px", minHeight: 64, direction: "rtl",
                    }}>
                      {sel ? (
                        <>
                          <div style={{ fontSize: 11, fontWeight: 700, color: "var(--bm)", marginBottom: 5 }}>{sel.name}</div>
                          <div style={{ fontSize: 11, color: "var(--sub)", lineHeight: 1.6 }}>{sel.description || sel.desc}</div>
                        </>
                      ) : (
                        <div style={{ fontSize: 12, color: "#f59e0b", textAlign: "center", paddingTop: 14, fontWeight:700}}>
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
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                {printers.length === 0 && (
                  <div style={{ fontSize: 12, color: "#999", padding: "6px 0", direction: "rtl" }}>
                    אין מדפסות מחוברות
                  </div>
                )}
                {printers.map(p => {
                  const checked = selectedPrinters.includes(p.id);
                  return (
                    <div key={p.id} onClick={() => setSelectedPrinters(prev =>
                      checked ? prev.filter(id => id !== p.id) : [...prev, p.id]
                    )} style={{
                      display: "flex", alignItems: "center", gap: 10,
                      padding: "8px 12px", borderRadius: 8, cursor: "pointer",
                      border: `1.5px solid ${checked ? "#1D9E75" : "var(--bdr)"}`,
                      background: checked ? "#f0fdf4" : "#fff",
                      transition: "all .15s", direction: "rtl",
                    }}>
                      <Printer size={16} color={checked ? "#1D9E75" : "#aaa"} style={{ flexShrink: 0 }} />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 12, fontWeight: 600, color: checked ? "#166534" : "var(--bd)" }}>
                          {p.name}
                        </div>
                        <div style={{ fontSize: 11, color: "#888" }}>{p.type} — {p.ip}</div>
                      </div>
                      <div style={{
                        width: 18, height: 18, borderRadius: 5, flexShrink: 0,
                        border: `2px solid ${checked ? "#1D9E75" : "#ccc"}`,
                        background: checked ? "#1D9E75" : "#fff",
                        display: "flex", alignItems: "center", justifyContent: "center",
                      }}>
                        {checked && <Check size={11} color="#fff" strokeWidth={3} />}
                      </div>
                    </div>
                  );
                })}
              </div>
              <div style={{
                borderRadius: 8, padding: "8px 12px", direction: "rtl",
                border: `1.5px solid ${activePrinters.length > 0 ? "#4caf50" : "#f59e0b"}`,
                background: activePrinters.length > 0 ? "#f0fdf4" : "#fffbeb",
                fontSize: 11, lineHeight: 1.7,
                color: activePrinters.length > 0 ? "#166534" : "#92400e",
                transition: "all .2s",
              }}>
                {activePrinters.length > 0 ? (
                  <>
                    <div style={{ fontWeight: 700, marginBottom: 4 }}>✓ הבון מחובר ל-{activePrinters.length} מדפסות</div>
                    {activePrinters.map(p => (
                      <div key={p.id} style={{ marginBottom: 2 }}>{p.name} — {p.type} — {p.ip}</div>
                    ))}
                  </>
                ) : (
                  <div>⚠ הבון אינו מחובר למדפסת</div>
                )}
              </div>
            </div>

            <div className="pr">
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <button onClick={() => setCopies(c => Math.max(1, c - 1))} style={{
                  width: 24, height: 24, borderRadius: 6, border: "1.5px solid var(--bdr)",
                  background: "#f8fafb", cursor: "pointer", display: "flex",
                  alignItems: "center", justifyContent: "center",
                }}>
                  <Minus size={10} color="var(--bm)" />
                </button>
                <input
                  type="number" min={1} max={10} value={copies}
                  onChange={e => setCopies(Math.min(10, Math.max(1, parseInt(e.target.value) || 1)))}
                  style={{
                    width: 38, textAlign: "center", border: "1.5px solid var(--bdr)",
                    borderRadius: 6, padding: "3px 4px", fontSize: 12,
                    fontFamily: "var(--sans)", outline: "none",
                  }}
                />
                <button onClick={() => setCopies(c => Math.min(10, c + 1))} style={{
                  width: 24, height: 24, borderRadius: 6, border: "1.5px solid var(--bdr)",
                  background: "#f8fafb", cursor: "pointer", display: "flex",
                  alignItems: "center", justifyContent: "center",
                }}>
                  <Plus size={10} color="var(--bm)" />
                </button>
              </div>
              <div className="pr-l">
                <div className="pr-lbl">מספר עותקים</div>
                <div className="pr-sub">כמה עותקים יודפסו בכל הזמנה</div>
              </div>
              <Copy size={18} color="var(--bm)" style={{ flexShrink: 0, marginLeft: 12 }} />
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

            {/* Summary */}
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

            {/* Open modal button */}
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
          <ParamsPanel params={params} onParamChange={onParamChange} paramGroups={paramGroups} />
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
      {/* ── ParamBot overlay ── */}
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

      {/* FAB moved to topbar */}
    </>
  );
}
