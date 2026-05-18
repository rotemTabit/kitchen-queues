import { useState } from 'react';
import { CTX_ZONES } from '../data/bonConfig';
import ParamSearch, { FILTER_IDS } from './Paramsearch';
import {
  useTags, useWorkflowProfiles, useMenuViews,
  useModifierGroups, useIgGroups,
} from '../hooks/useSupabase';

const findParam = (id, zone) => {
  for (const cat of Object.values(zone.cats))
    for (const p of cat) if (p.id === id) return p;
  return null;
};

// ── Dynamic select source hook ────────────────────────────────────────────
function useSelectOpts(src) {
  const tagsItem    = useTags('item');
  const tagsCourse  = useTags('course');
  const profiles    = useWorkflowProfiles();
  const views       = useMenuViews();
  const modGroups   = useModifierGroups();
  const igGroups    = useIgGroups();

  switch (src) {
    case 'tags_item':        return tagsItem.map(t => t.tag_name);
    case 'tags_course':      return tagsCourse.map(t => t.tag_name);
    case 'workflow_profiles':return profiles.map(p => `${p.type_display_name} — ${p.name}`);
    case 'menu_views':       return views.map(v => v.name);
    case 'modifier_groups':  return modGroups;
    case 'ig_groups':        return igGroups;
    default:                 return src || [];
  }
}

// ── Multi-instance control ────────────────────────────────────────────────
function MultiParam({ p, params, onParamChange }) {
  const instances   = params[p.id] || [];
  const dynamicOpts = useSelectOpts(p.selectSrc);
  const opts        = dynamicOpts.length > 0 ? dynamicOpts : (p.selectOpts || []);

  const add    = () => onParamChange(p.id, [...instances, opts[0] || '']);
  const remove = (i) => onParamChange(p.id, instances.filter((_, idx) => idx !== i));
  const change = (i, val) => onParamChange(p.id, instances.map((v, idx) => idx === i ? val : v));

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
              {opts.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
          ) : (
            <input
              type="text" value={val}
              onChange={e => change(i, e.target.value)}
              placeholder="הזן ערך..."
              style={{ flex: 1, fontSize: 11, padding: '3px 6px',
                       border: '1px solid var(--ba)', borderRadius: 5,
                       background: 'var(--bm)', color: 'var(--bd)' }}
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
function ParamRow({ p, params, onParamChange, zone, indent = 0 }) {
  const isEnabled = p.type === 'multi'
    ? (params[p.id] || []).length > 0
    : !!params[p.id];

  const children = (p.children || [])
    .map(cid => findParam(cid, zone))
    .filter(Boolean);

  return (
    <>
      <div
        className="ctx-pr"
        style={{
          marginRight: indent * 14,
          borderRight: indent > 0 ? '2px solid var(--ba)' : 'none',
          paddingRight: indent > 0 ? 10 : 0,
          opacity: 1,  // never disabled — noImpl just means no preview effect
        }}
      >
        <div className="ctx-pr-lbl">
          {indent > 0 && <span style={{ color: 'var(--ba)', opacity: 0.5, marginLeft: 4, fontSize: 10 }}>↳</span>}
          <span style={{ fontWeight: 600 }}>{p.lbl}</span>
          {p.noImpl && (
            <span style={{
              fontSize: 9, color: 'var(--ba)', opacity: 0.6,
              background: 'rgba(0,0,0,0.08)', borderRadius: 3,
              padding: '1px 4px', marginRight: 4,
            }}>לא משפיע על התצוגה</span>
          )}
          {p.sub && <small style={{ display: 'block', opacity: 0.7, marginTop: 1 }}>{p.sub}</small>}
        </div>

        <div style={{ flexShrink: 0 }}>
          {p.type === 'numeric' ? (
            <input
              type="number" min={1} max={10}
              value={params[p.id] || 0}
              onChange={e => onParamChange(p.id, parseInt(e.target.value) || 0)}
              style={{ width: 54, textAlign: 'center', border: '1.5px solid var(--ba)',
                       borderRadius: 6, padding: '3px 4px', background: 'var(--bm)',
                       color: 'var(--bd)', fontFamily: 'var(--mono)', fontSize: 13 }}
            />
          ) : p.type === 'multi' ? (
            <div style={{ minWidth: 160, maxWidth: 200 }}>
              <MultiParam p={p} params={params} onParamChange={onParamChange} />
            </div>
          ) : p.type === 'text' ? (
            <input
              type="text"
              value={params[p.id] || ''}
              onChange={e => onParamChange(p.id, e.target.value)}
              placeholder="הזן ערך"
              style={{ width: 130, fontSize: 11, padding: '3px 7px',
                       border: '1.5px solid var(--ba)', borderRadius: 5,
                       background: 'var(--bm)', color: 'var(--bd)' }}
            />
          ) : (
            <label className="tg">
              <input
                type="checkbox"
                checked={!!params[p.id]}
                onChange={e => onParamChange(p.id, e.target.checked)}
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
        />
      ))}
    </>
  );
}

// ── Main panel ────────────────────────────────────────────────────────────
export default function CtxPanel({ zone, onClose, params, onParamChange, template }) {
  const [openCats, setOpenCats] = useState({});
  const [query, setQuery]       = useState('');
  const [activeFilter, setFilter] = useState(null);

  const def = zone ? CTX_ZONES[zone] : null;

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

  const filteredCats = def ? Object.fromEntries(
    Object.entries(def.cats).map(([catName, catParams]) => [
      catName,
      catParams.filter(p =>
        (!p.templates || !template || p.templates.includes(template)) &&
        !p.parentId &&
        (!isSearching || matchesSearch(p))
      ),
    ]).filter(([, catParams]) => catParams.length > 0)
  ) : {};

  // when searching, expand all visible cats
  const effectiveOpenCats = isSearching
    ? Object.fromEntries(Object.keys(filteredCats).map(k => [k, true]))
    : openCats;

  if (!def) return null;

  return (
    <div className={`ctx-panel${zone ? ' open' : ''}`}>
      <div className="ctx-panel-hdr">
        <button className="ctx-panel-back" onClick={onClose}>✕</button>
        <span className="ctx-panel-title">{def.title}</span>
      </div>
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
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
