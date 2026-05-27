import { useState, useEffect } from 'react';
import { CTX_ZONES } from '../data/bonConfig';
import ParamSearch, { FILTER_IDS } from './Paramsearch';
import {
  useTags, useWorkflowProfiles, useMenuViews,
  useModifierGroups, useIgGroups,
} from '../hooks/useSupabase';

const GENERAL_ZONE = 'general';

// ── Zone picker options ───────────────────────────────────────────────────
const ZONE_PICKER_OPTIONS = [
  { id: 'general', label: 'הגדרות כלליות של הבון',      icon: '⚙️' },
  { id: 'header',  label: 'עריכת ראש הבון',              icon: '📄' },
  { id: 'items',   label: 'עריכת אזור הפריטים והמשנים',  icon: '🍽️' },
  { id: 'footer',  label: 'עריכת תחתית הבון',            icon: '📋' },
  { id: '__all__', label: 'כל הפרמטרים',                 icon: '☰'  },
];

const findParam = (id, zone) => {
  for (const cat of Object.values(zone.cats))
    for (const p of cat) if (p.id === id) return p;
  return null;
};

// ── Dynamic select source hook ────────────────────────────────────────────
function useSelectOpts(src) {
  const tagsItem   = useTags('item');
  const tagsCourse = useTags('course');
  const profiles   = useWorkflowProfiles();
  const views      = useMenuViews();
  const modGroups  = useModifierGroups();
  const igGroups   = useIgGroups();

  switch (src) {
    case 'tags_item':         return tagsItem.map(t => ({ value: t.id || t.tag_name, label: t.tag_name }));
    case 'tags_course':       return tagsCourse.map(t => ({ value: t.id || t.tag_name, label: t.tag_name }));
    case 'workflow_profiles': return profiles.map(p => ({ value: p.id, label: `${p.type_display_name} — ${p.name}` }));
    case 'menu_views':        return views.map(v => ({ value: v.id, label: v.name }));
    case 'modifier_groups':   return modGroups.map(g => ({ value: g, label: g }));
    case 'ig_groups':         return igGroups.map(g => ({ value: g, label: g }));
    default:                  return (src || []).map(s => typeof s === 'string' ? { value: s, label: s } : s);
  }
}

// ── Multi-instance control ────────────────────────────────────────────────
function MultiParam({ p, params, onParamChange }) {
  const instances   = params[p.id] || [];
  const dynamicOpts = useSelectOpts(p.selectSrc);
  const opts        = dynamicOpts.length > 0 ? dynamicOpts : (p.selectOpts || []);

  const firstVal = opts.length > 0 ? (opts[0]?.value ?? opts[0]) : '';
  const add    = () => onParamChange(p.id, [...instances, firstVal]);
  const remove = (i) => onParamChange(p.id, instances.filter((_, idx) => idx !== i));
  const change = (i, val) => onParamChange(p.id, instances.map((v, idx) => idx === i ? val : v));

useEffect(() => {
  if (!opts.length || !instances.length) return;
  const hasEmpty = instances.some(v => !v);
  if (hasEmpty) {
    onParamChange(p.id, instances.map(v => v || firstVal));
  }
}, [opts.length]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, width: '100%' }}>
      {instances.map((val, i) => (
        <div key={i} style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
          {opts.length > 0 ? (
            <select
              value={val}
              onChange={e => change(i, e.target.value)}
              style={{ flex: 1, fontSize: 11, padding: '3px 6px',
                       border: '1px solid var(--ba)', borderRadius: 5,
                       background: 'var(--bm)', color: 'var(--bd)', direction: 'rtl' }}
            >
              {opts.map(o => {
                const v = o?.value ?? o;
                const l = o?.label ?? o;
                return <option key={v} value={v}>{l}</option>;
              })}
            </select>
          ) : (
            <input
              type="text" value={val}
              onChange={e => change(i, e.target.value)}
              placeholder="הזן ערך"
              style={{ flex: 1, fontSize: 11, padding: '3px 6px',
                       border: '1px solid var(--ba)', borderRadius: 5,
                       background: 'whi', color: 'var(--bd)' }}
            />
          )}
          <button onClick={() => remove(i)}
            style={{ background: 'none', border: 'none', color: '#e55',
                     cursor: 'pointer', fontSize: 16, lineHeight: 1, padding: '0 2px' }}>×</button>
        </div>
      ))}
      <button onClick={add}
        style={{ fontSize: 11, padding: '3px 10px', borderRadius: 5,
                 border: '1px dashed var(--ba)', background: 'transparent',
                 color: 'var(--ba)', cursor: 'pointer', alignSelf: 'flex-start',
                 marginTop: 2 }}>
        + הוסף
      </button>
    </div>
  );
}

// ── Single param row ──────────────────────────────────────────────────────
function ParamRow({ p, params, onParamChange, zone, indent = 0, isGeneral = false, onBonFlash }) {
  const isEnabled = p.type === 'multi'
    ? (params[p.id] || []).length > 0
    : !!params[p.id];

  const children = (p.children || [])
    .map(cid => findParam(cid, zone))
    .filter(Boolean);

  const handleChange = (id, val) => {
    onParamChange(id, val);
    if (isGeneral && onBonFlash) onBonFlash();
  };

  return (
    <>
      <div
        className="ctx-pr"
        style={{
          marginRight: indent * 14,
          borderRight: indent > 0 ? '2px solid var(--ba)' : 'none',
          paddingRight: indent > 0 ? 10 : 0,
        }}
      >
        <div className="ctx-pr-lbl">
          {indent > 0 && <span style={{ color: 'var(--b)', opacity: 0.5, marginLeft: 4, fontSize: 10 }}>↳</span>}
          <span style={{ fontWeight: 600 }}>{p.lbl}</span>
          {p.noImpl && (
            <span style={{
              fontSize: 9, color: 'var(--bd)', opacity: 0.6,
              background: 'rgba(0,0,0,0.08)', borderRadius: 3,
              padding: '1px 4px', marginRight: 4,
            }}>לא משפיע על התצוגה</span>
          )}
          {p.sub && <small style={{ display: 'block', opacity: 0.7, marginTop: 1 }}>{p.sub}</small>}
        </div>

        <div style={{ flexShrink: 0 }}>
          {p.type === 'range' ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <input
                type="number" min={1} placeholder="מ-"
                value={(params[p.id] || '').toString().split(':')[0] || ''}
                onChange={e => {
                  const to = (params[p.id] || '').toString().split(':')[1] || '';
                  handleChange(p.id, e.target.value ? `${e.target.value}:${to}` : '');
                }}
                style={{ width: 52, textAlign: 'center', border: '1.5px solid var(--ba)',
                         borderRadius: 6, padding: '3px 4px', background: 'white',
                         color: 'var(--bd)', fontFamily: 'var(--mono)', fontSize: 12 }}
              />
              <span style={{ color: 'var(--ba)', fontSize: 11 }}>:</span>
              <input
                type="number" min={1} placeholder="עד-"
                value={(params[p.id] || '').toString().split(':')[1] || ''}
                onChange={e => {
                  const from = (params[p.id] || '').toString().split(':')[0] || '';
                  handleChange(p.id, e.target.value ? `${from}:${e.target.value}` : '');
                }}
                style={{ width: 52, textAlign: 'center', border: '1.5px solid var(--ba)',
                         borderRadius: 6, padding: '3px 4px', background: 'white',
                         color: 'var(--bd)', fontFamily: 'var(--mono)', fontSize: 12 }}
              />
            </div>
          ) : p.type === 'numeric' ? (
            <input
              type="number" min={1} max={10}
              value={params[p.id] || 0}
              onChange={e => handleChange(p.id, parseInt(e.target.value) || 0)}
              style={{ width: 54, textAlign: 'center', border: '1.5px solid var(--ba)',
                       borderRadius: 6, padding: '3px 4px', background: 'var(--bm)',
                       color: 'var(--bd)', fontFamily: 'var(--mono)', fontSize: 13 }}
            />
          ) : p.type === 'multi' ? (
            <div style={{ minWidth: 160, maxWidth: 200 }}>
              <MultiParam p={p} params={params} onParamChange={(id, val) => handleChange(id, val)} />
            </div>
          ) : p.type === 'text' ? (
            <input
              type="text"
              value={params[p.id] || ''}
              onChange={e => handleChange(p.id, e.target.value)}
              placeholder="הזן ערך"
              style={{ width: 130, fontSize: 11, padding: '3px 7px',
                       border: '1.5px solid var(--ba)', borderRadius: 5,
                       background: 'white', color: 'var(--bd)' }}
            />
          ) : (
            <label className="tg">
              <input
                type="checkbox"
                checked={!!params[p.id]}
                onChange={e => handleChange(p.id, e.target.checked)}
              />
              <div className="tg-tr" />
              <div className="tg-th" />
            </label>
          )}
        </div>
      </div>

      {children.length > 0 && isEnabled && children.map(child => (
        <ParamRow
          key={child.id}
          p={child}
          params={params}
          onParamChange={onParamChange}
          zone={zone}
          indent={indent + 1}
          isGeneral={isGeneral}
          onBonFlash={onBonFlash}
        />
      ))}
    </>
  );
}

// ── Zone param body ────────────────────────────────────────────────────────
function ZoneParamBody({ def, params, onParamChange, template, isGeneral, onBonFlash }) {
  const [openCats, setOpenCats] = useState({});
  const [query, setQuery]       = useState('');
  const [activeFilter, setFilter] = useState(null);

  const isSearching = query.trim() || activeFilter;

  const matchesSearch = (p) => {
    if (activeFilter && !FILTER_IDS[activeFilter]?.includes(p.id)) return false;
    if (query.trim()) {
      const q = query.trim().toLowerCase();
      return (p.lbl || '').toLowerCase().includes(q) ||
             (p.sub || '').toLowerCase().includes(q) ||
             (p.id || '').toLowerCase().includes(q);
    }
    return true;
  };

  const filteredCats = Object.fromEntries(
    Object.entries(def.cats).map(([catName, catParams]) => [
      catName,
      catParams.filter(p =>
        (!p.templates || !template || p.templates.includes(template)) &&
        !p.parentId &&
        (!isSearching || matchesSearch(p))
      ),
    ]).filter(([, catParams]) => catParams.length > 0)
  );

  const effectiveOpenCats = isSearching
    ? Object.fromEntries(Object.keys(filteredCats).map(k => [k, true]))
    : openCats;

  return (
    <>
      <div style={{ padding: '8px 12px', borderBottom: '0.5px solid rgba(0,0,0,0.08)', flexShrink: 0 }}>
        <ParamSearch
          query={query}
          setQuery={setQuery}
          activeFilter={activeFilter}
          setFilter={setFilter}
        />
      </div>
      <div className="ctx-panel-body">
        {Object.entries(filteredCats).map(([catName, catParams]) => (
          <div key={catName}>
            <div
              className={`ctx-acc-hdr${effectiveOpenCats[catName] ? ' open' : ''}`}
              onClick={() => setOpenCats(p => ({ ...p, [catName]: !p[catName] }))}
            >
              {catName}
              <span className="ctx-acc-arrow">▲</span>
            </div>
            <div className={`ctx-acc-body${effectiveOpenCats[catName] ? ' open' : ''}`}>
              {catParams.map(p => (
                <ParamRow
                  key={p._dupKey || p.id}
                  p={p}
                  params={params}
                  onParamChange={onParamChange}
                  zone={def}
                  indent={0}
                  isGeneral={isGeneral}
                  onBonFlash={isGeneral ? onBonFlash : undefined}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

// ── All params view ────────────────────────────────────────────────────────
function AllParamsView({ params, onParamChange, paramGroups }) {
  const [collapsed, setCollapsed] = useState(
    Object.fromEntries((paramGroups || []).map(g => [g.id, true]))
  );

  const toggle = (id) => setCollapsed(p => ({ ...p, [id]: !p[id] }));

  if (!paramGroups?.length) return (
    <div style={{ padding: 24, color: 'var(--sub)', fontSize: 12, textAlign: 'center' }}>
      טוען פרמטרים...
    </div>
  );

  return (
    <div className="ctx-panel-body">
      {paramGroups.map(group => {
        const activeCount = group.params.filter(p => params[p.id]).length;
        const isCollapsed = collapsed[group.id] !== false;
        return (
          <div key={group.id} className={`pg${isCollapsed ? ' collapsed' : ''}`}>
            <div className="pg-hdr" onClick={() => toggle(group.id)}>
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

// ── Zone Picker ───────────────────────────────────────────────────────────
function ZonePicker({ onSelect }) {
  return (
    <div style={{ flex: 1, overflowY: 'auto' }}>
      <div style={{
        padding: '14px 16px 8px', fontSize: 11, color: 'var(--sub)',
        fontWeight: 600, direction: 'rtl', textTransform: 'uppercase', letterSpacing: '.5px',
      }}>
        בחר אזור לעריכה
      </div>
      {ZONE_PICKER_OPTIONS.map(opt => (
        <button
          key={opt.id}
          onClick={() => onSelect(opt.id)}
          style={{
            width: '100%', display: 'flex', alignItems: 'center', gap: 12,
            padding: '14px 16px', background: 'none', border: 'none',
            borderBottom: '1px solid rgba(0,0,0,0.06)', cursor: 'pointer',
            direction: 'rtl', textAlign: 'right', transition: 'background .12s',
            fontFamily: 'var(--sans)',
          }}
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(29,158,117,0.06)'}
          onMouseLeave={e => e.currentTarget.style.background = 'none'}
        >
          <span style={{ fontSize: 20, flexShrink: 0 }}>{opt.icon}</span>
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--bd)', flex: 1 }}>
            {opt.label}
          </span>
          <span style={{ fontSize: 18, color: 'var(--sub)', opacity: .4 }}>›</span>
        </button>
      ))}
    </div>
  );
}

// ── Back button ───────────────────────────────────────────────────────────
function BackBtn({ onClick }) {
  return (
    <button
      onClick={onClick}
      title="חזור"
      style={{
        background: 'none', border: 'none', cursor: 'pointer',
        color: 'var(--ba)', fontSize: 22, lineHeight: 1,
        padding: '0 2px 0 6px', display: 'flex', alignItems: 'center',
        flexShrink: 0,
      }}
    >
      ‹
    </button>
  );
}

// ── Main panel ────────────────────────────────────────────────────────────
export default function CtxPanel({
  zone,           // זון מ-ZoneButtons (header/items/footer/general/null)
  onClose,        // סגור את הפאנל לגמרי
  params,
  onParamChange,
  template,
  onBonFlash,     // אפקט הבהוב על כל הבון (general בלבד)
  paramGroups,    // עבור "כל הפרמטרים"
  showPicker,     // אם true — נפתח מ-settingsPanel עם ZonePicker
}) {
  // innerZone — הזון שנבחר בתוך ה-picker
  const [innerZone, setInnerZone] = useState(null);

  const effectiveZone = showPicker ? innerZone : zone;
  const isPickerMode  = showPicker && !innerZone;
  const isGeneral     = effectiveZone === GENERAL_ZONE;
  const isAll         = effectiveZone === '__all__';
  const def           = (effectiveZone && !isAll) ? CTX_ZONES[effectiveZone] : null;

  const panelTitle = isPickerMode
    ? 'הוספת פרמטרים'
    : isAll
      ? 'כל הפרמטרים'
      : def?.title || '';

  const handleBack = () => {
    if (showPicker && innerZone) {
      setInnerZone(null); // חזרה ל-picker
    } else {
      onClose();
    }
  };

  // כפתור חזרה: ב-picker mode — רק כשבפנים; במצב רגיל — תמיד
  const showBack = showPicker ? !!innerZone : !!zone;

  const isOpen = !!(zone || showPicker);

  return (
    <div className={`ctx-panel${isOpen ? ' open' : ''}`} dir='rtl'>

      {/* ── Header ── */}
      <div
        className="ctx-panel-hdr"
        style={isGeneral ? { background: 'var(--bm)', borderBottom: '2px solid var(--ba)' } : {}}
      >
        {showBack && <BackBtn onClick={handleBack} />}
        <button className="ctx-panel-back" onClick={onClose}>✕</button>
        <span className="ctx-panel-title">{panelTitle}</span>
      </div>

      {/* ── Zone Picker ── */}
      {isPickerMode && (
        <ZonePicker onSelect={id => setInnerZone(id)} />
      )}

      {/* ── All Params ── */}
      {!isPickerMode && isAll && (
        <AllParamsView
          params={params}
          onParamChange={onParamChange}
          paramGroups={paramGroups}
        />
      )}

      {/* ── Specific Zone ── */}
      {!isPickerMode && !isAll && def && (
        <>
          {isGeneral && (
            <div style={{
              padding: '7px 14px',
              background: 'rgba(29,158,117,0.08)',
              borderBottom: '1px solid rgba(29,158,117,0.18)',
              fontSize: 11, color: 'var(--ba)', direction: 'rtl',
              lineHeight: 1.5, flexShrink: 0,
            }}>
              הגדרות אלו משפיעות על <strong>כל הבון</strong>.
            </div>
          )}
          <ZoneParamBody
            def={def}
            params={params}
            onParamChange={onParamChange}
            template={template}
            isGeneral={isGeneral}
            onBonFlash={onBonFlash}
          />
        </>
      )}
    </div>
  );
}
