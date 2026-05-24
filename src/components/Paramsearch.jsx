import { useState } from 'react';

const FILTER_GROUPS = [
  { id: 'size',     lbl: 'גודל גופן' },
  { id: 'hide',     lbl: 'הסתרת מידע' },
  { id: 'address',  lbl: 'כתובת ומשלוח' },
  { id: 'diners',   lbl: 'סועדים' },
  { id: 'courses',  lbl: 'סינון קורסים' },
  { id: 'td',       lbl: 'הזמנות TD' },
  { id: 'summaries',lbl: 'סיכומים' },
  { id: 'names',    lbl: 'שמות פריטים' },
  { id: 'layout',   lbl: 'שורות ורווח' },
  { id: 'lang',     lbl: 'שפה' },
];

const FILTER_IDS = {
  size:      ['ENLARGE_BON_NAME','TIME_DBL_HIGHT','DINER_FULL_NAME','ENLARGE_ORDERER_DETAILS','ENLARGE_COOKING_LEVEL','ENLARGE_ORDER_TAGS','LARGE_MAIN_DISH','MODIFIER_XL','ITEM_NAME_SINGLE_HIGHT','PRINT_CONDENSE_FORMAT','ENLARGE_BEVERAGE_SUMMARY'],
  hide:      ['OMIT_ORDER_TAGS','OMIT_CUSTOMER_DETAILS','OMIT_ORDERRER_TEL','OMIT_OTC_TYPE','OMIT_DINER_NAME','OMIT_BOTTOM_ORDERER_DETAILS','OMIT_ITEM_REMARKS_4_EXTERNAL_ORDER','IGNORE_ALL_MODIFIERS','NO_COURSE_NAME','HIDE_BEV_ITEMS_IF_BEVERAGE_SUMMARY','HIDE_SAUCE_ITEMS_IF_SAUCE_SUMMARY','HIDE_ITEMS_INCLUDED_IN_SUMMARY'],
  address:   ['ORDERER_ADDRESS_ON_HEADER','ORDERER_ADDRESS_ON_FOOTER','ORDERER_STREET_ON_FOOTER','ADD_ORDERER_REGION_NAME','PRINT_DELIVERY_ETA','PRINT_DETAILED_DELIVERY_ETA','PRINT_SUPPLY_TIME','SUPPLIED_TIME_ON_TOP','PRINT_DELAYED_SUPPLY_DATETIME','PRINT_DELAYED_SUPPLY_DATE'],
  diners:    ['ADD_DINER_NUMBERS','ADD_L_DINER_NUMBERS','DINER_HEADER','OMIT_DINER_NAME'],
  courses:   ['INCLUDE_COURSE_BEVERAGES','INCLUDE_COURSE_ENTREES','INCLUDE_COURSE_MAINS','INCLUDE_COURSE_DESSERTS','NO_COURSE_NAME','SEPARATE_BON_4_EVERY_COURSE'],
  td:        ['BOLD_TD_DETAILS','HIGHLIGHT_ORDER_TYPE','PRINT_ORDER_SOURCE','ADD_ORDER_EXTERNAL_SOURCE_NAME','OMIT_CUSTOMER_DETAILS','PRINT_SUPPLY_TIME','DINER_FULL_NAME','ENLARGE_ORDERER_DETAILS'],
  summaries: ['INCLUDE_BEVERAGE_SUMMARY','INCLUDE_SAUCE_SUMMARY','INCLUDE_SUMMARY_SECTION','ENABLE_FORCE_AGGREGATED_ITEMS_SECTION','FILTER_BON_SUMMARY_BY_MODIFER_GROUP_','INCLUDE_ALCOHOL_WARNING'],
  names:     ['ADD_OFFER_NAME','REPLACE_OFFER_NAME_FOR_LEAD_ITEMS','ADD_LONG_NAME_BELOW_ITEM','IGNORE_ITEM_PRINT_NAME','PRINT_ITEM_GROUP_NAME_','USE_MODIFIER_PRINT_NAME'],
  layout:    ['EXTRA_HDR_FEED','EXTRA_FTR_FEED','SHORT_TICKET','ITEM_NAME_SINGLE_HIGHT','PRINT_CONDENSE_FORMAT','NORMAL_ITEM_LINE'],
  lang:      ['ENGLISH_TEXT','USE_REMOVE_AS_NO'],
};

export default function ParamSearch({ query, setQuery, activeFilter, setFilter }) {
  const [focused, setFocused] = useState(false);

  const showChips = focused || query || activeFilter;

  return (
    <div style={{ direction: 'rtl' }}>
      {/* Search input */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 6,
        background: 'var(--bm)',
        borderRadius: 10, padding: '7px 12px',
        transition: 'border-color .15s',
        ...(focused ? { borderColor: 'var(--ba)' } : {}),
      }}>
        <span style={{ fontSize: 13, color: 'var(--sub)' }}>🔍</span>
        <input
          value={query}
          onChange={e => setQuery(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setTimeout(() => setFocused(false), 150)}
          className='input-white'
          placeholder="חפש פרמטר..."
          style={{
            flex: 1, border: 'none', background: 'transparent', outline: 'none',
            fontSize: 13, color: 'white', direction: 'rtl',
            fontFamily: 'var(--sans)',
          }}
        />
        {(query || activeFilter) && (
          <button onClick={() => { setQuery(''); setFilter(null); }}
            style={{ background: 'none', border: 'none', cursor: 'pointer',
                     color: 'var(--sub)', fontSize: 15, lineHeight: 1, padding: 0 }}>
            ×
          </button>
        )}
      </div>

      {/* Filter chips */}
      {showChips && (
        <div style={{
          display: 'flex', flexWrap: 'wrap', gap: 6,
          padding: '8px 2px 4px',
        }}>
          {FILTER_GROUPS.map(fg => {
            const active = activeFilter === fg.id;
            return (
              <button
                key={fg.id}
                onMouseDown={e => { e.preventDefault(); setFilter(active ? null : fg.id); }}
                style={{
                  fontSize: 11, padding: '4px 11px', borderRadius: 20,
                  border: `2px solid ${active ? 'var(--ba)' : 'var(--bdr)'}`,
                  background: active ? 'var(--ba)' : 'transparent',
                  color: active ? '#fff' : 'var(--sub)',
                  cursor: 'pointer', fontFamily: 'var(--sans)',
                  transition: 'all .15s',
                  fontWeight: active ? 600 : 600,
                }}
              >
                {fg.lbl}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export { FILTER_IDS };
