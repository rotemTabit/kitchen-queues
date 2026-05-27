import { useState, useEffect, useRef } from 'react';
import { CTX_ZONES } from '../data/bonConfig';
import {
  useTags, useWorkflowProfiles, useMenuViews,
  useModifierGroups, useIgGroups,
} from '../hooks/useSupabase';

// ── Zone meta ─────────────────────────────────────────────────────────────
const ZONE_META = {
  general: { label: 'הגדרות כלליות', icon: '⚙️', bg: '#f0fdf4', color: '#166534', border: '#bbf7d0' },
  header:  { label: 'ראש הבון',       icon: '📄', bg: '#eff6ff', color: '#1d4ed8', border: '#bfdbfe' },
  items:   { label: 'פריטים ומשנים',  icon: '🍽️', bg: '#fdf4ff', color: '#7e22ce', border: '#e9d5ff' },
  footer:  { label: 'תחתית הבון',     icon: '📋', bg: '#fff7ed', color: '#c2410c', border: '#fed7aa' },
};

const ZONE_ORDER = ['general', 'header', 'items', 'footer'];

// ── Quick-filter chip groups ──────────────────────────────────────────────
const FILTER_GROUPS = [
  { id: '__all__', lbl: 'הכל' },
  { id: 'שולחן_וסועדים', lbl: 'שולחן וסועדים', ids: ['HEADER_TABLE_NUMBER','ADD_DINER_NUMBERS','ADD_L_DINER_NUMBERS','DINER_HEADER','OMIT_DINER_NAME','TIME_DBL_HIGHT'] },
  { id: 'זמנים_ואספקה', lbl: 'זמנים ואספקה', ids: ['PRINT_DELAYED_SUPPLY_DATETIME','PRINT_DELAYED_SUPPLY_DATE','PRINT_SUPPLY_TIME','SUPPLIED_TIME_ON_TOP','PRINT_DELIVERY_ETA','PRINT_DETAILED_DELIVERY_ETA'] },
  { id: 'כתובת_ומיקום', lbl: 'כתובת ומיקום', ids: ['ORDERER_ADDRESS_ON_HEADER','TA_OTC_ORDERER_ADDRESS_REMARKS','ORDERER_ADDRESS_ON_FOOTER','ORDERER_STREET_ON_FOOTER','ADD_ORDERER_REGION_NAME'] },
  { id: 'לקוח_ומזמין', lbl: 'לקוח ומזמין', ids: ['OMIT_CUSTOMER_DETAILS','OMIT_ORDERRER_TEL','DINER_FULL_NAME','ENLARGE_ORDERER_DETAILS','PRINT_ORDERRER_TAGS','PRINT_HQ_ORDERRER_TAGS','OMIT_BOTTOM_ORDERER_DETAILS'] },
  { id: 'פריט_ושם', lbl: 'פריט ושם', ids: ['IGNORE_ITEM_PRINT_NAME','ADD_OFFER_NAME','REPLACE_OFFER_NAME_FOR_LEAD_ITEMS','ADD_LONG_NAME_BELOW_ITEM','PRINT_ITEM_GROUP_NAME_','USE_MODIFIER_PRINT_NAME','ADD_MODIFIER_GROUP_NAME_'] },
  { id: 'משנים_ובחירות', lbl: 'משנים ובחירות', ids: ['INCLUDE_DEFAULT_MODIFIERS','IGNORE_ALL_MODIFIERS','FILTER_OFFER_MODIFIERS_BY_MODIFER_GROUP_','OMIT_ITEM_REMARKS_4_EXTERNAL_ORDER','SIMPLE_ITEM_REMARKS','MODIFIER_XL','ENLARGE_COOKING_LEVEL'] },
  { id: 'קורסים_ושלבים', lbl: 'קורסים ושלבים', ids: ['SEPARATE_BON_4_EVERY_COURSE','NO_COURSE_NAME','COURSE_SEPARATOR','INCLUDE_COURSE_BEVERAGES','INCLUDE_COURSE_ENTREES','INCLUDE_COURSE_MAINS','INCLUDE_COURSE_DESSERTS','INCLUDE_ITEM_TAG_','EXCLUDE_ITEM_TAG_','INCLUDE_COURSE_TAG_','EXCLUDE_COURSE_TAG_'] },
  { id: 'בון_Fire', lbl: 'בון Fire', ids: ['ONLY_COURSE_ACTION_FIRE','ONLY_COURSE_ACTION_NOTIFY','ONLY_COURSE_ACTION_FIRE_NOTIFY','ONLY_COURSE_IMMEDIATE_ACTION_FIRE_NOTIFY','ENABLE_ITEMS_FOR_FIRE_OF_NOTIFY_COURSE','CLEAN_COURSE_STYLE','IGNORE_FIRE_TICKETS','COURSE_TAGS_BEFORE_ITEMS'] },
  { id: 'סיכומים', lbl: 'סיכומים', ids: ['__SUMMARY_SECTION__','INCLUDE_BEVERAGE_SUMMARY','ENLARGE_BEVERAGE_SUMMARY','HIDE_BEV_ITEMS_IF_BEVERAGE_SUMMARY','INCLUDE_SAUCE_SUMMARY','HIDE_SAUCE_ITEMS_IF_SAUCE_SUMMARY','INCLUDE_SUMMARY_SECTION','HIDE_ITEMS_INCLUDED_IN_SUMMARY','ENABLE_FORCE_AGGREGATED_ITEMS_SECTION','FILTER_BON_SUMMARY_BY_MODIFER_GROUP_','INCLUDE_ALCOHOL_WARNING'] },
  { id: 'מקור_הזמנה', lbl: 'מקור הזמנה', ids: ['PRINT_ORDER_SOURCE','ADD_ORDER_EXTERNAL_SOURCE_NAME','HIGHLIGHT_ORDER_TYPE','OMIT_OTC_TYPE','BOLD_TD_DETAILS','NOTIFY_ON_ALL_OTHER_BONS'] },
  { id: 'הגבלות_הדפסה', lbl: 'הגבלות הדפסה', ids: ['EXCLUDE_TABLES_','EXCLUDE_PROFILE_','INCLUDE_PROFILE_','EXCLUDE_MENU_VIEW_','IGNORE_KIOSK_ORDERS','NOTIFY_OTHER_STATION'] },
  { id: 'מבנה_ועיצוב', lbl: 'מבנה ועיצוב', ids: ['ENLARGE_BON_NAME','LARGE_MAIN_DISH','ITEM_NAME_SINGLE_HIGHT','PRINT_CONDENSE_FORMAT','NORMAL_ITEM_LINE','SHORT_TICKET','EXTRA_HDR_FEED','EXTRA_FTR_FEED','DIFF_LEAD_VS_NONLEAD_ITEM'] },
  { id: 'הערות_ותגיות', lbl: 'הערות ותגיות', ids: ['OMIT_ORDER_TAGS','ENLARGE_ORDER_TAGS','OMIT_BON_TAGS'] },
  { id: 'שם_הבון', lbl: 'שם הבון', ids: ['ADD_BON_NAME_BOTTOM','BON_NAME_BOTTOM_HIGHLIGHT','REPRINT','ENLARGE_BON_NAME'] },
  { id: 'שפה', lbl: 'שפה', ids: ['ENGLISH_TEXT','USE_REMOVE_AS_NO'] },
  { id: 'מידע_נוסף', lbl: 'מידע נוסף', ids: ['ADD_SERVER_NAME','ADD_TIME'] },
];

// ── בנה אינדקס מלא של כל הפרמטרים ───────────────────────────────────────
function buildParamIndex() {
  const idx = {};
  ZONE_ORDER.forEach(zoneKey => {
    const zone = CTX_ZONES[zoneKey];
    if (!zone) return;
    Object.entries(zone.cats).forEach(([catName, params]) => {
      params.forEach(p => {
        idx[p.id] = { p, zoneKey, catName };
      });
    });
  });
  return idx;
}

const PARAM_INDEX = buildParamIndex();

// ── Dynamic select options ────────────────────────────────────────────────
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

// ── MultiParam ────────────────────────────────────────────────────────────
function MultiParam({ p, params, onParamChange }) {
  const instances   = params[p.id] || [];
  const dynamicOpts = useSelectOpts(p.selectSrc);
  const opts        = dynamicOpts.length > 0 ? dynamicOpts : (p.selectOpts || []);
  const firstVal    = opts.length > 0 ? (opts[0]?.value ?? opts[0]) : '';
  const hasSelectSrc = !!p.selectSrc;

  const add    = () => onParamChange(p.id, [...instances, firstVal]);
  const remove = (i) => onParamChange(p.id, instances.filter((_, idx) => idx !== i));
  const change = (i, val) => onParamChange(p.id, instances.map((v, idx) => idx === i ? val : v));

  useEffect(() => {
    if (!opts.length || !instances.length) return;
    if (instances.some(v => !v))
      onParamChange(p.id, instances.map(v => v || firstVal));
  }, [opts.length]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, width: '100%' }}>
      {instances.map((val, i) => (
        <div key={i} style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
          {hasSelectSrc ? (
            opts.length > 0 ? (
              <select value={val} onChange={e => change(i, e.target.value)}
                style={{ flex: 1, fontSize: 11, padding: '3px 6px', border: '1px solid var(--ba)',
                         borderRadius: 5, background: 'white', color: 'var(--bd)', direction: 'rtl' }}>
                {opts.map(o => {
                  const v = o?.value ?? o; const l = o?.label ?? o;
                  return <option key={v} value={v}>{l}</option>;
                })}
              </select>
            ) : (
              <select disabled
                style={{ flex: 1, fontSize: 11, padding: '3px 6px', border: '1px solid var(--bdr)',
                         borderRadius: 5, background: '#f8fafb', color: 'var(--sub)', direction: 'rtl' }}>
                <option>טוען...</option>
              </select>
            )
          ) : (
            <input type="text" value={val} onChange={e => change(i, e.target.value)}
              placeholder="הזן ערך"
              style={{ flex: 1, fontSize: 11, padding: '3px 6px', border: '1px solid var(--ba)',
                       borderRadius: 5, background: 'white', color: 'var(--bd)' }} />
          )}
          <button onClick={() => remove(i)}
            style={{ background: 'none', border: 'none', color: '#e55', cursor: 'pointer',
                     fontSize: 16, lineHeight: 1, padding: '0 2px' }}>×</button>
        </div>
      ))}
      <button onClick={add}
        style={{ fontSize: 11, padding: '3px 10px', borderRadius: 5, border: '1px dashed var(--bm)',
                 background: 'transparent', color: 'var(--bm)', cursor: 'pointer',
                 alignSelf: 'flex-start', marginTop: 2 }}>
        + הוספה
      </button>
    </div>
  );
}

// ── ParamControl ──────────────────────────────────────────────────────────
function ParamControl({ p, params, onParamChange }) {
  const handleChange = (id, val) => onParamChange(id, val);

  if (p.type === 'range') {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        <input type="number" min={1} placeholder="מ-"
          value={(params[p.id] || '').toString().split(':')[0] || ''}
          onChange={e => {
            const to = (params[p.id] || '').toString().split(':')[1] || '';
            handleChange(p.id, e.target.value ? `${e.target.value}:${to}` : '');
          }}
          style={{ width: 52, textAlign: 'center', border: '1.5px solid var(--ba)',
                   borderRadius: 6, padding: '3px 4px', background: 'white',
                   color: 'var(--bd)', fontFamily: 'var(--mono)', fontSize: 12 }} />
        <span style={{ color: 'var(--ba)', fontSize: 11 }}>:</span>
        <input type="number" min={1} placeholder="עד-"
          value={(params[p.id] || '').toString().split(':')[1] || ''}
          onChange={e => {
            const from = (params[p.id] || '').toString().split(':')[0] || '';
            handleChange(p.id, e.target.value ? `${from}:${e.target.value}` : '');
          }}
          style={{ width: 52, textAlign: 'center', border: '1.5px solid var(--ba)',
                   borderRadius: 6, padding: '3px 4px', background: 'white',
                   color: 'var(--bd)', fontFamily: 'var(--mono)', fontSize: 12 }} />
      </div>
    );
  }
  if (p.type === 'numeric') {
    return (
      <input type="number" min={1} max={10} value={params[p.id] || 0}
        onChange={e => handleChange(p.id, parseInt(e.target.value) || 0)}
        style={{ width: 54, textAlign: 'center', border: '1.5px solid var(--ba)',
                 borderRadius: 6, padding: '3px 4px', background: 'white',
                 color: 'var(--bd)', fontFamily: 'var(--mono)', fontSize: 13 }} />
    );
  }
  if (p.type === 'multi') {
    return (
      <div style={{ minWidth: 160, maxWidth: 200 }}>
        <MultiParam p={p} params={params} onParamChange={onParamChange} />
      </div>
    );
  }
  if (p.type === 'text') {
    return (
      <input type="text" value={params[p.id] || ''} onChange={e => handleChange(p.id, e.target.value)}
        placeholder="הזן ערך"
        style={{ width: 130, fontSize: 11, padding: '3px 7px', border: '1.5px solid var(--ba)',
                 borderRadius: 5, background: 'white', color: 'var(--bd)' }} />
    );
  }
  const checkedVal = p.inverted
    ? (params[p.id] !== false && params[p.id] !== 0)
    : !!params[p.id];
  return (
    <label className="tg">
      <input type="checkbox" checked={checkedVal}
        onChange={e => handleChange(p.id, e.target.checked)} />
      <div className="tg-tr" />
      <div className="tg-th" />
    </label>
  );
}

// ── ParamRow ──────────────────────────────────────────────────────────────
function ParamRow({ p, params, onParamChange, zoneKey, indent = 0, catLabel }) {
  const isEnabled = p.type === 'multi'
    ? (params[p.id] || []).length > 0
    : !!params[p.id];

  const children = (p.children || [])
    .map(cid => PARAM_INDEX[cid]?.p)
    .filter(Boolean);

  return (
    <>
      <div className="ctx-pr" style={{
        marginRight: indent * 16,
        borderRight: indent > 0 ? '2px solid var(--bm)' : '2px solid var(--bm)',
        paddingRight: indent > 0 ? 10 : 16, 
      }}>
        <div className="ctx-pr-lbl">
          {indent > 0 && <span style={{ color: 'var(--ba)', opacity: 0.5, marginLeft: 4, fontSize: 10 }}>↳</span>}
          <span style={{ fontWeight: 600 }}>{p.lbl}</span>
          {catLabel && indent === 0 && (
            <span style={{
              fontSize: 9, color: 'var(--sub)', background: '#f0f2f4',
              borderRadius: 4, padding: '1px 6px', marginRight: 5, fontWeight: 400,
            }}>{catLabel}</span>
          )}
          {p.noImpl && (
            <span style={{ fontSize: 9, color: 'var(--bd)', opacity: 0.6, background: 'rgba(0,0,0,0.08)',
                           borderRadius: 3, padding: '1px 4px', marginRight: 4 }}>
              לא משפיע על התצוגה המקדימה
            </span>
          )}
          {p.sub && <small style={{ display: 'block', opacity: 0.7, marginTop: 1 }}>{p.sub}</small>}
        </div>
        <div style={{ flexShrink: 0 }}>
          <ParamControl p={p} params={params} onParamChange={onParamChange} />
        </div>
      </div>

      {children.length > 0 && isEnabled && children.map(child => (
        <ParamRow key={child.id} p={child} params={params}
          onParamChange={onParamChange} zoneKey={zoneKey} indent={indent + 1} />
      ))}
    </>
  );
}

// ── isParamActive ─────────────────────────────────────────────────────────
function isParamActive(p, params) {
  const v = params[p.id];
  if (p.inverted) return v !== false && v !== 0;
  if (Array.isArray(v)) return v.length > 0;
  if (typeof v === 'number') return v > 0;
  if (typeof v === 'string') return v.length > 0;
  return !!v;
}

// ── Filters bar ───────────────────────────────────────────────────────────
function FiltersBar({ query, setQuery, showAll, setShowAll, zoneFilters, setZoneFilters, catFilters, setCatFilters }) {
  const [focused, setFocused] = useState(false);

  const toggleZone = (z) => setZoneFilters(prev =>
    prev.includes(z) ? prev.filter(x => x !== z) : [...prev, z]
  );
  const toggleCat = (c) => {
    if (c === '__all__') { setCatFilters([]); return; }
    setCatFilters(prev => prev.includes(c) ? prev.filter(x => x !== c) : [...prev, c]);
  };
  const isAll = catFilters.length === 0;
  const hasFilters = query || zoneFilters.length || catFilters.length;

  return (
    <div style={{ padding: '10px 14px', borderBottom: '1px solid var(--bdr)', flexShrink: 0, direction: 'rtl' }}>

      {/* שורה 1: מצב + חיפוש */}
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
        <div style={{ display: 'flex', borderRadius: 8, border: '1.5px solid var(--bdr)', overflow: 'hidden', flexShrink: 0 }}>
          {[{ val: false, lbl: 'פעילים' }, { val: true, lbl: 'הכל' }].map(opt => (
            <button key={opt.lbl} onClick={() => setShowAll(opt.val)}
              style={{
                padding: '5px 12px', border: 'none', cursor: 'pointer',
                fontSize: 11, fontWeight: 600, fontFamily: 'var(--sans)',
                background: showAll === opt.val ? 'var(--bm)' : '#f8fafb',
                color: showAll === opt.val ? 'var(--ba)' : 'var(--sub)',
                transition: 'all .15s',
              }}>
              {opt.lbl}
            </button>
          ))}
        </div>

        <div style={{
          flex: 1, display: 'flex', alignItems: 'center', gap: 6,
          background: '#f8fafb', border: `1.5px solid ${focused ? 'var(--bm)' : 'var(--bdr)'}`,
          borderRadius: 8, padding: '5px 10px', transition: 'border-color .15s',
        }}>
          <span style={{ fontSize: 12, color: 'var(--sub)' }}>🔍</span>
          <input value={query} onChange={e => setQuery(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            placeholder="חיפוש פרמטר"
            style={{ flex: 1, border: 'none', background: 'transparent', outline: 'none',
                     fontSize: 12, color: 'var(--bd)', direction: 'rtl', fontFamily: 'var(--sans)' }} />
          {(query || hasFilters) && (
            <button onClick={() => { setQuery(''); setZoneFilters([]); setCatFilters([]); setShowAll(false); }}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--sub)', fontSize: 14, padding: 0 }}>
              ×
            </button>
          )}
        </div>
      </div>

      {/* שורה 2: פילטר מיקום */}
      <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginBottom: 6 }}>
        {ZONE_ORDER.map(z => {
          const zm = ZONE_META[z];
          const active = zoneFilters.includes(z);
          return (
            <button key={z} onClick={() => toggleZone(z)}
              style={{
                fontSize: 11, padding: '3px 10px', borderRadius: 20, cursor: 'pointer',
                border: `1.5px solid ${active ? zm.color : 'var(--bdr)'}`,
                background: active ? zm.bg : 'transparent',
                color: active ? zm.color : 'var(--sub)',
                fontFamily: 'var(--sans)', fontWeight: active ? 700 : 400,
                transition: 'all .15s',
              }}>
              {zm.icon} {zm.label}
            </button>
          );
        })}
      </div>

      {/* שורה 3: chips קטגוריה */}
      <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', paddingTop: 6 }}>
        {FILTER_GROUPS.map(fg => {
          const active = fg.id === '__all__' ? isAll : catFilters.includes(fg.id);
          return (
            <button key={fg.id}
              onMouseDown={e => { e.preventDefault(); toggleCat(fg.id); }}
              style={{
                fontSize: 10, padding: '3px 10px', borderRadius: 20, cursor: 'pointer',
                border: `1.5px solid ${active ? 'var(--bm)' : 'var(--bdr)'}`,
                background: active ? 'var(--bm)' : 'transparent',
                color: active ? '#fff' : 'var(--sub)',
                fontFamily: 'var(--sans)', fontWeight: active ? 600 : 400,
                transition: 'all .15s',
              }}>
              {fg.lbl}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ── Main ParamsTab ─────────────────────────────────────────────────────────
export default function ParamsTab({
  params,
  onParamChange,
  template,
  initialZoneFilter = [],
  onZoneFilterChange,
  onBonFlash,
}) {
  const [query, setQuery]             = useState('');
  const [showAll, setShowAll]         = useState(false);
  const [zoneFilters, setZoneFilters] = useState(initialZoneFilter);
  const [catFilters, setCatFilters]   = useState([]);
  const [undoEntry, setUndoEntry]     = useState(null);
  const undoTimer                     = useRef(null);

  useEffect(() => {
    setZoneFilters(initialZoneFilter);
    if (initialZoneFilter.length > 0) setShowAll(true);
  }, [initialZoneFilter.join(',')]);

  useEffect(() => {
    onZoneFilterChange?.(zoneFilters);
  }, [zoneFilters.join(',')]);

  const matchesSearch = (p) => {
    if (query.trim()) {
      const q = query.toLowerCase();
      if (!(p.lbl || '').toLowerCase().includes(q) &&
          !(p.sub || '').toLowerCase().includes(q) &&
          !(p.id || '').toLowerCase().includes(q)) return false;
    }
    if (catFilters.length > 0 && !catFilters.includes('__all__')) {
      const inAny = catFilters.some(fid => {
        const fg = FILTER_GROUPS.find(g => g.id === fid);
        return fg?.ids?.includes(p.id);
      });
      if (!inAny) return false;
    }
    return true;
  };

  const filtered = {};
  ZONE_ORDER.forEach(zoneKey => {
    if (zoneFilters.length > 0 && !zoneFilters.includes(zoneKey)) return;
    const zone = CTX_ZONES[zoneKey];
    if (!zone) return;
    const zoneCats = {};
    Object.entries(zone.cats).forEach(([catName, catParams]) => {
      const visible = catParams.filter(p => {
        if (p.parentId) return false;
        if (!p.templates || !template || p.templates.includes(template)) {
          if (!showAll && !isParamActive(p, params)) return false;
          return matchesSearch(p);
        }
        return false;
      });
      if (visible.length > 0) zoneCats[catName] = visible;
    });
    if (Object.keys(zoneCats).length > 0) filtered[zoneKey] = zoneCats;
  });

  const handleChange = (id, val) => {
    onParamChange(id, val);
    const entry = PARAM_INDEX[id];
    if (entry?.zoneKey === 'general' && onBonFlash) onBonFlash();
  };

  const handleRemove = (id) => {
    const prev = params[id];
    onParamChange(id, false);
    if (undoTimer.current) clearTimeout(undoTimer.current);
    setUndoEntry({ id, val: prev });
    undoTimer.current = setTimeout(() => setUndoEntry(null), 5000);
  };

  const handleUndo = () => {
    if (!undoEntry) return;
    onParamChange(undoEntry.id, undoEntry.val);
    clearTimeout(undoTimer.current);
    setUndoEntry(null);
  };

  const totalVisible = Object.values(filtered).reduce(
    (sum, cats) => sum + Object.values(cats).reduce((s, ps) => s + ps.length, 0), 0
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }} dir='rtl'>
      <FiltersBar
        query={query} setQuery={setQuery}
        showAll={showAll} setShowAll={setShowAll}
        zoneFilters={zoneFilters} setZoneFilters={setZoneFilters}
        catFilters={catFilters} setCatFilters={setCatFilters}
      />

      <div style={{ flex: 1, overflowY: 'auto' }}>
        {totalVisible === 0 ? (
          <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--sub)', fontSize: 12, direction: 'rtl' }}>
            <div style={{ fontSize: 32, marginBottom: 10 }}>{showAll ? '🔍' : '🎛️'}</div>
            <div style={{ fontWeight: 600, marginBottom: 6 }}>
              {showAll ? 'לא נמצאו פרמטרים' : 'אין פרמטרים פעילים'}
            </div>
            <div style={{ opacity: .7 }}>
              {showAll ? 'נסה לשנות את הפילטרים או את החיפוש' : 'עבור ל"הכל" כדי לראות ולהוסיף פרמטרים'}
            </div>
            {!showAll && (
              <button onClick={() => setShowAll(true)}
                style={{ marginTop: 14, padding: '7px 18px', borderRadius: 8,
                         border: '1.5px solid var(--bm)', background: 'transparent',
                         color: 'var(--bm)', fontSize: 12, fontWeight: 700,
                         cursor: 'pointer', fontFamily: 'var(--sans)' }}>
                הצג הכל
              </button>
            )}
          </div>
        ) : (
          ZONE_ORDER.filter(z => filtered[z]).map(zoneKey => {
            const zm = ZONE_META[zoneKey];
            const zoneCats = filtered[zoneKey];
            return (
              <div key={zoneKey}>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  padding: '8px 14px 6px', direction: 'rtl',
                  borderTop: `2px solid ${zm.border}`,
                  background: zm.bg,
                  position: 'sticky', top: 0, zIndex: 2,
                }}>
                  <span style={{ fontSize: 13 }}>{zm.icon}</span>
                  <span style={{ fontSize: 11, fontWeight: 700, color: zm.color }}>{zm.label}</span>
                </div>

                {Object.entries(zoneCats).map(([catName, catParams]) =>
                  catParams.map(p => (
                    <div key={p._dupKey || p.id}>
                      <ParamRow
                        p={p}
                        params={params}
                        onParamChange={handleChange}
                        zoneKey={zoneKey}
                        catLabel={catName}
                      />
                    </div>
                  ))
                )}
              </div>
            );
          })
        )}
      </div>

      {undoEntry && (
        <div style={{
          margin: '0 12px 8px', padding: '8px 14px', borderRadius: 8,
          background: 'var(--bd)', color: '#fff', direction: 'rtl',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          fontSize: 12, flexShrink: 0,
        }}>
          <span>הפרמטר "{PARAM_INDEX[undoEntry.id]?.p?.lbl || undoEntry.id}" הוסר</span>
          <button onClick={handleUndo}
            style={{ background: 'var(--ba)', border: 'none', borderRadius: 5,
                     color: 'var(--bd)', fontSize: 11, fontWeight: 700,
                     cursor: 'pointer', padding: '3px 10px', fontFamily: 'var(--sans)' }}>
            ביטול
          </button>
        </div>
      )}
    </div>
  );
}
