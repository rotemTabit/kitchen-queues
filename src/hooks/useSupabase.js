import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

// ── helpers ───────────────────────────────────────────────
function useQuery(fn, deps = []) {
  const [data, setData]     = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fn().then(({ data, error }) => {
      if (cancelled) return;
      if (error) setError(error);
      else setData(data);
      setLoading(false);
    });
    return () => { cancelled = true; };
  }, deps);

  return { data, loading, error };
}

// ── Templates ─────────────────────────────────────────────
export function useTemplates() {
  const { data, loading, error } = useQuery(() =>
    supabase.from('templates').select('*').order('sort_order')
  );
  return { templates: data || [], loading, error };
}

// ── Printers ──────────────────────────────────────────────
export function usePrinters() {
  const { data, loading, error } = useQuery(() =>
    supabase.from('printers').select('*').eq('is_active', true).order('name')
  );
  return { printers: data || [], loading, error };
}

// ── Params ────────────────────────────────────────────────
// Returns param_groups format: [{id, icon, label, params:[{id,lbl,sub}]}]
export function useParamGroups() {
  const { data, loading, error } = useQuery(() =>
    supabase.from('params').select('*').order('group_key').order('sort_order')
  );

  const groups = data
    ? Object.values(
        data.reduce((acc, p) => {
          if (!acc[p.group_key]) {
            acc[p.group_key] = {
              id:     p.group_key,
              icon:   p.group_icon,
              label:  p.group_label,
              params: [],
            };
          }
          acc[p.group_key].params.push({
            id:  p.key,
            lbl: p.label,
            sub: p.description,
          });
          return acc;
        }, {})
      )
    : [];

  return { paramGroups: groups, loading, error };
}

// ── Menu ──────────────────────────────────────────────────
// Returns flat menu structure: [{id, external_id, category_id, name, ...}]
export function useMenuItems() {
  const { data, loading, error } = useQuery(() =>
    supabase
      .from('menu_items')
      .select('*, menu_categories(id, external_id, name, parent_id, dish_role)')
      .order('sort_order')
  );
  return { menuItems: data || [], loading, error };
}

// Returns nested menu: [{id, name, items:[...]}] — for ItemPicker
export function useMenu() {
  const { data: cats, loading: catsLoading } = useQuery(() =>
    supabase
      .from('menu_categories')
      .select('*')
      .is('parent_id', null)
      .order('sort_order')
  );

  const { data: items, loading: itemsLoading } = useQuery(() =>
    supabase.from('menu_items').select('*').order('sort_order')
  );

  const loading = catsLoading || itemsLoading;

  const menu = (cats || []).map(cat => ({
    id:       cat.id,
    name:     cat.name,
    display:  cat.display,
    items:    (items || [])
      .filter(i => i.category_id === cat.id)
      .map(i => ({ id: i.id, name: i.name, price: i.price })),
  }));

  return { menu, loading };
}

// ── Bons ──────────────────────────────────────────────────
export function useBons(refreshKey = 0) {
  const { data, loading, error } = useQuery(() =>
    supabase.from('bons').select('*').order('created_at', { ascending: false }),
    [refreshKey]
  );
  return { bons: data || [], loading, error };
}

export function useBon(id) {
  const { data, loading, error } = useQuery(
    () => supabase.from('bons').select('*').eq('id', id).single(),
    [id]
  );
  return { bon: data, loading, error };
}

export async function saveBon(id, payload) {
  if (id) {
    return supabase.from('bons').update(payload).eq('id', id).select().single();
  } else {
    return supabase.from('bons').insert(payload).select().single();
  }
}

export async function deleteBon(id) {
  return supabase.from('bons').delete().eq('id', id);
}

// ── Category Tree ─────────────────────────────────────────
// Returns full nested tree of categories + items per leaf
export function useCategoryTree() {
  const { data: cats, loading: catsLoading } = useQuery(() =>
    supabase.from('menu_categories').select('*').order('sort_order')
  );
  const { data: items, loading: itemsLoading } = useQuery(() =>
    supabase.from('menu_items').select('id, name, category_id, external_id').order('sort_order')
  );

  const loading = catsLoading || itemsLoading;

  // Build nested tree
  const buildTree = (cats, items, parentId = null) => {
    return (cats || [])
      .filter(c => c.parent_id === parentId)
      .map(c => ({
        id:       c.id,
        name:     c.name,
        display:  c.display || c.name,
        children: buildTree(cats, items, c.id),
        items:    (items || []).filter(i => i.category_id === c.id),
      }));
  };

  const tree = buildTree(cats, items);
  const flatItems = items || [];

  return { tree, flatItems, loading };
}

// ── Menu items with all groups (for ItemPicker) ───────────
export function useMenuWithGroups() {
  const { data: items, loading: itemsLoading } = useQuery(() =>
    supabase
      .from('menu_items')
      .select('*, menu_categories(id, name, display, parent_id)')
      .order('sort_order')
  );

  const { data: modgroups, loading: mgLoading } = useQuery(() =>
    supabase.from('items_modgroup').select('*').order('created_at')
  );

  const { data: iggroups, loading: igLoading } = useQuery(() =>
    supabase.from('items_ig').select('*').order('created_at')
  );

  const loading = itemsLoading || mgLoading || igLoading;

  const parseMem = (raw) => {
    if (!raw) return [];
    if (typeof raw === 'string') try { return JSON.parse(raw); } catch { return []; }
    return raw;
  };

  const enriched = (items || []).map(item => ({
    ...item,
    course:     item.course     || null,
    offer_name: item.offer_name || null,
    category_id: item.category_id || null,
    groups: [
      ...(modgroups || [])
        .filter(g => g.item_id === item.id)
        .map(g => ({
          id: g.id, name: g.name, type: g.type,
          min: g.min_select, max: g.max_select,
          members: parseMem(g.members),
        })),
      ...(iggroups || [])
        .filter(g => g.item_id === item.id)
        .map(g => ({
          id: g.id, name: g.name, type: 'ig',
          min: g.min_select, max: g.max_select,
          members: parseMem(g.members),
        })),
    ],
  }));

  return { enriched, loading };
}

export function useTags(type = null) {
  const [tags, setTags] = useState([]);
  useEffect(() => {
    let q = supabase.from('tags').select('*').order('tag_name');
    if (type) q = q.eq('type', type);
    q.then(({ data, error }) => { if (error) console.error('useTags error:', error); setTags(data || []); });
  }, [type]);
  return tags;
}

export function useWorkflowProfiles() {
  const [profiles, setProfiles] = useState([]);
  useEffect(() => {
    supabase.from('workflow_profiles').select('*').order('name')
      .then(({ data, error }) => { if (error) console.error('useWorkflowProfiles error:', error); setProfiles(data || []); });
  }, []);
  return profiles; // [{id, type, type_display_name, name}]
}

export function useMenuViews() {
  const [views, setViews] = useState([]);
  useEffect(() => {
    supabase.from('menu_views').select('*').order('name')
      .then(({ data, error }) => { if (error) console.error('useMenuViews error:', error); setViews(data || []); });
  }, []);
  return views; // [{id, name}]
}

export function useModifierGroups() {
  const [groups, setGroups] = useState([]);
  useEffect(() => {
    supabase.from('items_modgroup').select('name').order('name')
      .then(({ data }) => {
        const unique = [...new Set((data || []).map(g => g.name))];
        setGroups(unique);
      });
  }, []);
  return groups;
}

export function useIgGroups() {
  const [groups, setGroups] = useState([]);
  useEffect(() => {
    supabase.from('items_ig').select('name').order('name')
      .then(({ data }) => {
        const unique = [...new Set((data || []).map(g => g.name))];
        setGroups(unique);
      });
  }, []);
  return groups;
}