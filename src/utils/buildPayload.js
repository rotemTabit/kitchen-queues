// ── Keys that are stored separately — not in the params jsonb ────────────
const STRUCTURAL_KEYS = new Set([
  'PRINT_ALL_ITEMS',
  'INC_CATS', 'EXC_CATS',
  'INC_ITEMS', 'EXC_ITEMS',
  'KDS_ONLY',
  'AGGREGATE',
  'IGNORE_ALL_MODIFIERS',
]);

// ── Inverted params: ב-UI דולק = ברירת מחדל = לא נשמר לשרת ────────────
// כשהם false ב-UI (כיבה המשתמש) → נשלח כ-true לשרת (=OMIT/HIDE)
const INVERTED_PARAMS = new Set([
  'OMIT_ORDER_TAGS', 'OMIT_CUSTOMER_DETAILS', 'OMIT_ORDERRER_TEL', 'OMIT_OTC_TYPE',
  'OMIT_DINER_NAME', 'NO_COURSE_NAME', 'OMIT_ITEM_REMARKS_4_EXTERNAL_ORDER', 'OMIT_BON_TAGS',
  'OMIT_BOTTOM_ORDERER_DETAILS',
  'HIDE_BEV_ITEMS_IF_BEVERAGE_SUMMARY', 'HIDE_SAUCE_ITEMS_IF_SAUCE_SUMMARY',
  'HIDE_ITEMS_INCLUDED_IN_SUMMARY',
]);

/**
 * buildPayload — ממיר את ה-state של App לפורמט שורת Supabase
 *
 * @param {object} opts
 * @param {string|null}  opts.bonId           — UUID קיים (null = בון חדש)
 * @param {string}       opts.bonName
 * @param {string|null}  opts.template        — key של התבנית (e.g. 'general')
 * @param {object}       opts.params          — כל הפרמטרים
 * @param {string[]}     opts.orderTypes
 * @param {string[]}     opts.sources
 * @param {string[]}     opts.selectedPrinters — מערך UUIDs
 * @param {number}       opts.copies
 * @param {string[]}     opts.elOrd           — סדר אלמנטים
 * @param {object}       opts.elSt            — overrides אלמנטים
 * @returns {object} payload מוכן ל-Supabase
 */
export function buildPayload({
  bonId,
  bonName,
  template,
  params,
  orderTypes,
  sources,
  selectedPrinters,
  copies,
  elOrd,
  elSt,
}) {
  // פרמטרים "אמיתיים" — כל מה שלא structural
  const activeParams = {};
  Object.entries(params).forEach(([k, v]) => {
    if (STRUCTURAL_KEYS.has(k)) return;

    if (INVERTED_PARAMS.has(k)) {
      // true ב-UI = הצג = ברירת מחדל = לא שולחים
      // false ב-UI = הסתר = שולחים כ-true (OMIT/HIDE)
      if (v === false || v === 0) activeParams[k] = true;
    } else {
      if (v !== undefined && v !== null && v !== false && v !== 0) {
        activeParams[k] = v;
      }
    }
  });

  return {
    ...(bonId ? { id: bonId } : {}),
    name:             bonName,
    template_id:      template || null,   // key string בינתיים (יעבור ל-UUID בהמשך)
    printer_ids:      selectedPrinters || [],
    copies:           copies || 1,
    order_types:      orderTypes || [],
    sources:          sources || [],
    kds_only:         !!params['KDS_ONLY'],
    aggregate:        !!params['AGGREGATE'],
    with_modifiers:   !params['IGNORE_ALL_MODIFIERS'],
    sort_type:        'items',
    print_all_items:  !!params['PRINT_ALL_ITEMS'],
    inc_cats:         params['INC_CATS']  || [],
    exc_cats:         params['EXC_CATS']  || [],
    inc_items:        params['INC_ITEMS'] || [],
    exc_items:        params['EXC_ITEMS'] || [],
    params:           activeParams,
    element_order:    elOrd || [],
    element_overrides: elSt || {},
  };
}