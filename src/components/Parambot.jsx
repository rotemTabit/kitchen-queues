import { useState, useRef, useEffect } from 'react';
import { CTX_ZONES } from '../data/bonConfig';

// ── Param lookup ─────────────────────────────────────────────────────────
function getParamLabel(id) {
  for (const zone of Object.values(CTX_ZONES))
    for (const cat of Object.values(zone.cats))
      for (const p of cat)
        if (p.id === id) return p.lbl;
  return id;
}
function getParamSub(id) {
  for (const zone of Object.values(CTX_ZONES))
    for (const cat of Object.values(zone.cats))
      for (const p of cat)
        if (p.id === id) return p.sub || '';
  return '';
}

// ── Deep conversation flow ───────────────────────────────────────────────
// Each node: { q, opts: [{ lbl, next?, params?, end? }] }
// params = array → leads to recommendation screen
// end = true → show recommendations at end
const FLOW = {
  start: {
    q: 'שלום! במה תרצה להתחיל?',
    opts: [
      { lbl: '📄 שנה תבנית הדפסה',    next: 'template'    },
      { lbl: '🖨 מדפסות',              next: 'printers'    },
      { lbl: '🍽️ פריטים ותצוגה',       next: 'items_top'   },
      { lbl: '🛵 סוגי הזמנה ומקורות',  next: 'order_top'   },
      { lbl: '⚙️ הגדרות בון',          next: 'params_top'  },
      { lbl: 'ℹ️ מה פעיל עכשיו',       action: 'showActive'},
    ],
  },

  // ── Template ──
  template: {
    q: 'איזו תבנית הדפסה תרצה?',
    opts: [
      { lbl: '📋 בון כללי — הפרדה בין תמחורים תחת כל תמחור', action: 'setTemplate', value: 'general'  },
      { lbl: '🌅 כל היום — כל הפריטים ברצף ללא הפרדת תמחור', action: 'setTemplate', value: 'allday'   },
      { lbl: '1️⃣ פריט בודד — בון נפרד לכל פריט',             action: 'setTemplate', value: 'peritem'  },
      { lbl: '👤 לפי סועדים — מקובץ לפי מספר כסא',           action: 'setTemplate', value: 'perdiner' },
    ],
  },

  // ── Printers ──
  printers: {
    q: 'מה תרצה לדעת על המדפסות?',
    opts: [
      { lbl: '🟢 הצג מדפסות מחוברות לבון',  action: 'listActivePrinters',    end: false },
      { lbl: '⚫ הצג מדפסות זמינות',         action: 'listAvailablePrinters', end: false },
      { lbl: '✏️ עדכן מדפסות לבון',          action: 'editPrinters',          end: false },
    ],
  },

  // ── Items top ──
  items_top: {
    q: 'מה תרצה לשנות בפריטים?',
    opts: [
      { lbl: 'הוסף קטגוריה שלמה',       action: 'addCategory'       },
      { lbl: 'הוסף פריטים ספציפיים',     action: 'addItems'          },
      { lbl: 'נקה את רשימת הפריטים',     action: 'clearItems'        },
      { lbl: 'הפעל / כבה אגרגציה',       action: 'toggleAggregation' },
      { lbl: 'הגדרות קורסים ופילטרים',   next: 'items_main'          },
    ],
  },

  // ── Order top ──
  order_top: {
    q: 'מה תרצה לשנות?',
    opts: [
      { lbl: 'סוגי הזמנה (ישיבה/TA/משלוח)', action: 'setOrderTypes' },
      { lbl: 'מקורות הזמנה (Wolt/קיוסק...)', action: 'setSources'   },
      { lbl: 'הגדרות TA ומשלוחים בבון',      next: 'td_main'         },
    ],
  },

  // ── Params top ──
  params_top: {
    q: 'באיזה נושא?',
    opts: [
      { lbl: '🔠 תצוגה והגדלות',   next: 'display'        },
      { lbl: '🙈 הסתרת מידע',      next: 'hide_main'      },
      { lbl: '📊 סיכומים',         next: 'summaries_main' },
      { lbl: '🔒 הגבלות הדפסה',    next: 'restrictions'   },
    ],
  },

  // ── Display ──
  display: {
    q: 'מה תרצה לשנות בתצוגה?',
    opts: [
      { lbl: 'הגדלת אלמנטים',       next: 'enlarge' },
      { lbl: 'שמות פריטים',         next: 'names' },
      { lbl: 'מבנה שורות הפריט',    next: 'item_layout' },
      { lbl: 'שפה ומשנים',          next: 'language' },
      { lbl: 'כרזות ומזהים',        next: 'badges' },
    ],
  },
  enlarge: {
    q: 'מה חשוב להגדיל בבון?',
    opts: [
      { lbl: 'שם הבון / התחנה',      next: 'enlarge_bon' },
      { lbl: 'שם הלקוח',             next: 'enlarge_customer' },
      { lbl: 'פריטים ומשנים',        next: 'enlarge_items' },
      { lbl: 'מידע כללי (שעה/סועדים)', params: ['TIME_DBL_HIGHT'], end: true },
    ],
  },
  enlarge_bon: {
    q: 'איך תרצה שיוצג שם הבון?',
    opts: [
      { lbl: 'בגדול בראש הבון',        params: ['ENLARGE_BON_NAME'], end: true },
      { lbl: 'בגדול בתחתית הבון',      params: ['ADD_BON_NAME_BOTTOM', 'BON_NAME_BOTTOM_HIGHLIGHT'], end: true },
      { lbl: 'גדול בראש + גדול בתחתית', params: ['ENLARGE_BON_NAME', 'ADD_BON_NAME_BOTTOM', 'BON_NAME_BOTTOM_HIGHLIGHT'], end: true },
    ],
  },
  enlarge_customer: {
    q: 'מה תרצה להגדיל בפרטי הלקוח?',
    opts: [
      { lbl: 'שם הלקוח בלבד',         params: ['DINER_FULL_NAME'], end: true },
      { lbl: 'שם + טלפון',            params: ['ENLARGE_ORDERER_DETAILS'], end: true },
      { lbl: 'הכל',                   params: ['DINER_FULL_NAME', 'ENLARGE_ORDERER_DETAILS'], end: true },
    ],
  },
  enlarge_items: {
    q: 'מה תרצה להגדיל?',
    opts: [
      { lbl: 'מידת עשייה (M/WD/MR)',  params: ['ENLARGE_COOKING_LEVEL'], end: true },
      { lbl: 'כל המשנים',             params: ['MODIFIER_XL'], end: true },
      { lbl: 'מנה עיקרית בלבד',       params: ['LARGE_MAIN_DISH'], end: true },
      { lbl: 'הגדלת כל הנ"ל',         params: ['ENLARGE_COOKING_LEVEL', 'MODIFIER_XL', 'LARGE_MAIN_DISH'], end: true },
    ],
  },
  names: {
    q: 'מה תרצה לשנות בשמות הפריטים?',
    opts: [
      { lbl: 'להציג שם תמחור',        next: 'names_offer' },
      { lbl: 'שם ארוך / שם מטבח',     next: 'names_long' },
      { lbl: 'שם קבוצת פריטים',       params: ['PRINT_ITEM_GROUP_NAME_'], end: true },
    ],
  },
  names_offer: {
    q: 'איך תרצה להציג את שם התמחור?',
    opts: [
      { lbl: 'מעל שם הפריט (קטן)',     params: ['ADD_OFFER_NAME'], end: true },
      { lbl: 'במקום שם הפריט',         params: ['REPLACE_OFFER_NAME_FOR_LEAD_ITEMS'], end: true },
    ],
  },
  names_long: {
    q: 'איזה שם נוסף תרצה להציג?',
    opts: [
      { lbl: 'שם ארוך מתחת למנה',     params: ['ADD_LONG_NAME_BELOW_ITEM'], end: true },
      { lbl: 'השתמש בשם הרגיל (בטל שם מטבח)', params: ['IGNORE_ITEM_PRINT_NAME'], end: true },
    ],
  },
  item_layout: {
    q: 'מה תרצה לשנות במבנה שורות הפריט?',
    opts: [
      { lbl: 'כמות מימין',            params: ['NORMAL_ITEM_LINE'], end: true },
      { lbl: 'בון קצר ללא קווים',     params: ['SHORT_TICKET'], end: true },
      { lbl: 'שורות צרות (קומפקטי)', params: ['ITEM_NAME_SINGLE_HIGHT'], end: true },
      { lbl: 'רווח נוסף בראש',        params: ['EXTRA_HDR_FEED'], end: true },
      { lbl: 'רווח נוסף בתחתית',      params: ['EXTRA_FTR_FEED'], end: true },
    ],
  },
  language: {
    q: 'מה תרצה לשנות בשפת הבון?',
    opts: [
      { lbl: 'משנים באנגלית',         next: 'language_en' },
      { lbl: 'שם מטבח למשנים',        params: ['USE_MODIFIER_PRINT_NAME'], end: true },
      { lbl: 'שם קבוצות משנים',       params: ['ADD_MODIFIER_GROUP_NAME_'], end: true },
    ],
  },
  language_en: {
    q: 'איזה סגנון אנגלית?',
    opts: [
      { lbl: 'No/With/Side/More',     params: ['ENGLISH_TEXT'], end: true },
      { lbl: 'בלי X → No X',         params: ['USE_REMOVE_AS_NO'], end: true },
      { lbl: 'שניהם',                 params: ['ENGLISH_TEXT', 'USE_REMOVE_AS_NO'], end: true },
    ],
  },
  badges: {
    q: 'איזה מזהים/כרזות תרצה?',
    opts: [
      { lbl: 'כרזת שחזור (הדפסה חוזרת)', params: ['REPRINT'], end: true },
      { lbl: 'סוג הזמנה בולט',           params: ['HIGHLIGHT_ORDER_TYPE'], end: true },
      { lbl: 'TA/משלוח בהיפוך צבעים',   params: ['BOLD_TD_DETAILS'], end: true },
      { lbl: 'הגדלת הערות הזמנה',        params: ['ENLARGE_ORDER_TAGS'], end: true },
    ],
  },

  // ── Hide ──
  hide_main: {
    q: 'מה תרצה להסתיר?',
    opts: [
      { lbl: 'מידע על הלקוח',         next: 'hide_customer' },
      { lbl: 'תגיות והערות',          next: 'hide_tags' },
      { lbl: 'פרטי הזמנה',            next: 'hide_order' },
      { lbl: 'פריטים ומשנים',         next: 'hide_items' },
    ],
  },
  hide_customer: {
    q: 'מה מפרטי הלקוח להסתיר?',
    opts: [
      { lbl: 'שם וטלפון יחד',         params: ['OMIT_CUSTOMER_DETAILS'], end: true },
      { lbl: 'טלפון בלבד',            params: ['OMIT_ORDERRER_TEL'], end: true },
      { lbl: 'כל פרטי הלקוח מהתחתית', params: ['OMIT_BOTTOM_ORDERER_DETAILS'], end: true },
      { lbl: 'הכל',                   params: ['OMIT_CUSTOMER_DETAILS', 'OMIT_BOTTOM_ORDERER_DETAILS'], end: true },
    ],
  },
  hide_tags: {
    q: 'מה תרצה להסתיר מהתגיות?',
    opts: [
      { lbl: 'תגיות הזמנה (אלרגיה...)', params: ['OMIT_ORDER_TAGS'], end: true },
      { lbl: 'הערות מממשק חיצוני',      params: ['OMIT_ITEM_REMARKS_4_EXTERNAL_ORDER'], end: true },
      { lbl: 'שניהם',                   params: ['OMIT_ORDER_TAGS', 'OMIT_ITEM_REMARKS_4_EXTERNAL_ORDER'], end: true },
    ],
  },
  hide_order: {
    q: 'מה מפרטי ההזמנה להסתיר?',
    opts: [
      { lbl: 'כותרת OTC',             params: ['OMIT_OTC_TYPE'], end: true },
      { lbl: 'שמות סועדים',           params: ['OMIT_DINER_NAME'], end: true },
      { lbl: 'כותרות קורס',           params: ['NO_COURSE_NAME'], end: true },
    ],
  },
  hide_items: {
    q: 'מה מהפריטים להסתיר?',
    opts: [
      { lbl: 'כל המשנים',             params: ['IGNORE_ALL_MODIFIERS'], end: true },
      { lbl: 'משקאות (יש סיכום)',      params: ['HIDE_BEV_ITEMS_IF_BEVERAGE_SUMMARY'], end: true },
      { lbl: 'רטבים (יש סיכום)',       params: ['HIDE_SAUCE_ITEMS_IF_SAUCE_SUMMARY'], end: true },
      { lbl: 'פריטי סיכום מהרשימה',   params: ['HIDE_ITEMS_INCLUDED_IN_SUMMARY'], end: true },
    ],
  },

  // ── Items & Courses ──
  items_main: {
    q: 'מה תרצה להגדיר לגבי פריטים וקורסים?',
    opts: [
      { lbl: 'סינון לפי קורס',        next: 'course_filter' },
      { lbl: 'הפרדת בונות לפי קורס',  params: ['SEPARATE_BON_4_EVERY_COURSE'], end: true },
      { lbl: 'הגדרות סועדים',         next: 'diners' },
      { lbl: 'סינון לפי תגיות',       next: 'tag_filter' },
      { lbl: 'סינון משנים',           next: 'modifier_filter' },
    ],
  },
  course_filter: {
    q: 'אילו קורסים תרצה להציג בבון הזה?',
    opts: [
      { lbl: 'משקאות בלבד',           params: ['INCLUDE_COURSE_BEVERAGES'], end: true },
      { lbl: 'ראשונות בלבד',          params: ['INCLUDE_COURSE_ENTREES'], end: true },
      { lbl: 'עיקריות בלבד',          params: ['INCLUDE_COURSE_MAINS'], end: true },
      { lbl: 'קינוחים בלבד',          params: ['INCLUDE_COURSE_DESSERTS'], end: true },
    ],
  },
  diners: {
    q: 'מה תרצה לשנות בהגדרות הסועדים?',
    opts: [
      { lbl: 'מספר כסא מתחת לכל פריט', next: 'diner_seat' },
      { lbl: 'כותרת לכל סועד',          params: ['DINER_HEADER'], end: true },
      { lbl: 'הסתר שמות סועדים',        params: ['OMIT_DINER_NAME'], end: true },
    ],
  },
  diner_seat: {
    q: 'איך להציג את מספר הכסא?',
    opts: [
      { lbl: 'גופן רגיל',    params: ['ADD_DINER_NUMBERS'], end: true },
      { lbl: 'גופן גדול',    params: ['ADD_L_DINER_NUMBERS'], end: true },
    ],
  },
  tag_filter: {
    q: 'מה תרצה לסנן לפי תגיות?',
    opts: [
      { lbl: 'הצג פריטים עם תגית מסוימת',  params: ['INCLUDE_ITEM_TAG_'], end: true },
      { lbl: 'הסתר פריטים עם תגית',        params: ['EXCLUDE_ITEM_TAG_'], end: true },
      { lbl: 'הצג קורס עם תגית',           params: ['INCLUDE_COURSE_TAG_'], end: true },
      { lbl: 'הסתר קורס עם תגית',          params: ['EXCLUDE_COURSE_TAG_'], end: true },
    ],
  },
  modifier_filter: {
    q: 'מה תרצה לסנן מהמשנים?',
    opts: [
      { lbl: 'הצג רק קבוצות נבחרות',       params: ['FILTER_OFFER_MODIFIERS_BY_MODIFER_GROUP_'], end: true },
      { lbl: 'הצג משנים מקבוצה בסיכום',    params: ['FILTER_BON_SUMMARY_BY_MODIFER_GROUP_'], end: true },
      { lbl: 'שם קבוצת משנים מעל',         params: ['ADD_MODIFIER_GROUP_NAME_'], end: true },
    ],
  },

  // ── TD ──
  td_main: {
    q: 'מה תרצה לשנות בהגדרות TA/משלוח?',
    opts: [
      { lbl: 'כתובת המשלוח',          next: 'td_address' },
      { lbl: 'שעות וזמנים',           next: 'td_times' },
      { lbl: 'מקור ההזמנה',           next: 'td_source' },
      { lbl: 'הגדרות לקוח',           next: 'td_customer' },
    ],
  },
  td_address: {
    q: 'איפה להציג את כתובת המשלוח?',
    opts: [
      { lbl: 'בראש הבון בלבד',        params: ['ORDERER_ADDRESS_ON_HEADER'], end: true },
      { lbl: 'בתחתית הבון בלבד',      params: ['ORDERER_ADDRESS_ON_FOOTER'], end: true },
      { lbl: 'רחוב בלבד בתחתית',      params: ['ORDERER_STREET_ON_FOOTER'], end: true },
      { lbl: 'ראש + תחתית',           params: ['ORDERER_ADDRESS_ON_HEADER', 'ORDERER_ADDRESS_ON_FOOTER'], end: true },
      { lbl: 'הוסף אזור חלוקה',       params: ['ADD_ORDERER_REGION_NAME'], end: true },
    ],
  },
  td_times: {
    q: 'איזה מידע זמנים להוסיף?',
    opts: [
      { lbl: 'שעת אספקה (בלוק בולט)', params: ['PRINT_DELIVERY_ETA'], end: true },
      { lbl: 'שעת הזמנה + שעת אספקה', params: ['PRINT_DETAILED_DELIVERY_ETA'], end: true },
      { lbl: 'תאריך הזמנה עתידית',    params: ['PRINT_DELAYED_SUPPLY_DATE'], end: true },
      { lbl: 'תאריך + שעה עתידיים',   params: ['PRINT_DELAYED_SUPPLY_DATETIME'], end: true },
      { lbl: 'שעת ביצוע הזמנה דחויה', params: ['PRINT_SUPPLY_TIME'], end: true },
      { lbl: 'שעת אספקה בראש הבון',   params: ['SUPPLIED_TIME_ON_TOP'], end: true },
    ],
  },
  td_source: {
    q: 'מה להציג על מקור ההזמנה?',
    opts: [
      { lbl: 'הצג מקור (Online/Phone...)', params: ['PRINT_ORDER_SOURCE'], end: true },
      { lbl: 'הצג שם הפלטפורמה (Wolt...)', params: ['PRINT_ORDER_SOURCE', 'ADD_ORDER_EXTERNAL_SOURCE_NAME'], end: true },
    ],
  },
  td_customer: {
    q: 'מה לשנות בפרטי הלקוח ב-TA/משלוח?',
    opts: [
      { lbl: 'שם לקוח בגדול',         params: ['DINER_FULL_NAME'], end: true },
      { lbl: 'שם + טלפון בגדול',      params: ['ENLARGE_ORDERER_DETAILS'], end: true },
      { lbl: 'תגיות לקוח',            params: ['PRINT_ORDERRER_TAGS'], end: true },
      { lbl: 'תגיות לקוח רשתי',       params: ['PRINT_HQ_ORDERRER_TAGS'], end: true },
    ],
  },

  // ── Summaries ──
  summaries_main: {
    q: 'איזה סיכום תרצה להוסיף לתחתית הבון?',
    opts: [
      { lbl: 'סיכום משקאות',                   next: 'sum_bev' },
      { lbl: 'סיכום רטבים',                    next: 'sum_sauce' },
      { lbl: 'סיכום משולב (משקה+רטבים+תוספות)', params: ['INCLUDE_SUMMARY_SECTION'], end: true },
      { lbl: 'סיכום פרמטרים לפי קבוצה',        params: ['FILTER_BON_SUMMARY_BY_MODIFER_GROUP_'], end: true },
      { lbl: 'אגרגציה כפויה',                  params: ['ENABLE_FORCE_AGGREGATED_ITEMS_SECTION'], end: true },
      { lbl: 'התראת אלכוהול',                  params: ['INCLUDE_ALCOHOL_WARNING'], end: true },
    ],
  },
  sum_bev: {
    q: 'מה תרצה לעשות עם הסיכום משקאות?',
    opts: [
      { lbl: 'הוסף סיכום משקאות', params: ['INCLUDE_BEVERAGE_SUMMARY'], end: true },
      { lbl: 'הוסף + הגדל שמות',  params: ['INCLUDE_BEVERAGE_SUMMARY', 'ENLARGE_BEVERAGE_SUMMARY'], end: true },
      { lbl: 'הוסף + הסתר מהרשימה', params: ['INCLUDE_BEVERAGE_SUMMARY', 'HIDE_BEV_ITEMS_IF_BEVERAGE_SUMMARY'], end: true },
      { lbl: 'הכל יחד',           params: ['INCLUDE_BEVERAGE_SUMMARY', 'ENLARGE_BEVERAGE_SUMMARY', 'HIDE_BEV_ITEMS_IF_BEVERAGE_SUMMARY'], end: true },
    ],
  },
  sum_sauce: {
    q: 'מה תרצה לעשות עם סיכום הרטבים?',
    opts: [
      { lbl: 'הוסף סיכום רטבים',          params: ['INCLUDE_SAUCE_SUMMARY'], end: true },
      { lbl: 'הוסף + הסתר מהרשימה',       params: ['INCLUDE_SAUCE_SUMMARY', 'HIDE_SAUCE_ITEMS_IF_SAUCE_SUMMARY'], end: true },
    ],
  },

  // ── Restrictions ──
  restrictions: {
    q: 'איזה הגבלת הדפסה תרצה?',
    opts: [
      { lbl: 'הוצא טווח שולחנות',    params: ['EXCLUDE_TABLES_'], end: true },
      { lbl: 'הוצא פרופיל עבודה',    params: ['EXCLUDE_PROFILE_'], end: true },
      { lbl: 'הצג רק פרופיל נבחר',   params: ['INCLUDE_PROFILE_'], end: true },
      { lbl: 'הוצא תפריט תצוגה',     params: ['EXCLUDE_MENU_VIEW_'], end: true },
    ],
  },
};

// ── Typing indicator ─────────────────────────────────────────────────────
function TypingIndicator() {
  return (
    <div style={{ display:'flex', justifyContent:'flex-end', marginBottom:6 }}>
      <div style={{ display:'flex', alignItems:'center', gap:4, padding:'10px 14px',
                    background:'#fff', borderRadius:'4px 18px 18px 18px',
                    boxShadow:'0 1px 2px rgba(0,0,0,.1)' }}>
        {[0,1,2].map(i => (
          <div key={i} style={{
            width:7, height:7, borderRadius:'50%', background:'#bbb',
            animation:`botDot 1.2s ease-in-out ${i*0.2}s infinite`,
          }} />
        ))}
      </div>
    </div>
  );
}

// ── Recommendation card ───────────────────────────────────────────────────
function RecoCard({ paramIds, params, onParamChange }) {
  const [checked, setChecked] = useState(() =>
    Object.fromEntries(paramIds.map(id => [id, true]))
  );

  const toggle = (id) => setChecked(p => ({ ...p, [id]: !p[id] }));

  const applyAll = () => {
    paramIds.forEach(id => {
      if (checked[id]) onParamChange(id, true);
    });
  };

  return (
    <div style={{
      background:'#f9f9f9', border:'1.5px solid #e0e0e0',
      borderRadius:12, overflow:'hidden', marginTop:4,
    }}>
      {paramIds.map(id => (
        <div key={id} onClick={() => toggle(id)} style={{
          display:'flex', alignItems:'flex-start', gap:10,
          padding:'10px 14px', cursor:'pointer',
          borderBottom:'1px solid #eee',
          background: checked[id] ? '#f0f7f4' : '#fff',
          transition:'background .15s',
        }}>
          <div style={{
            width:20, height:20, borderRadius:6, flexShrink:0, marginTop:1,
            border:`2px solid ${checked[id] ? 'var(--ba)' : '#ccc'}`,
            background: checked[id] ? 'var(--ba)' : '#fff',
            display:'flex', alignItems:'center', justifyContent:'center',
            transition:'all .15s',
          }}>
            {checked[id] && <span style={{ color:'#fff', fontSize:12, lineHeight:1 }}>✓</span>}
          </div>
          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ fontSize:13, fontWeight:600, color:'#222', direction:'rtl' }}>
              {getParamLabel(id)}
            </div>
            <div style={{ fontSize:11, color:'#888', marginTop:2, direction:'rtl' }}>
              {getParamSub(id)}
            </div>
          </div>
        </div>
      ))}
      <div style={{ padding:'10px 14px' }}>
        <button onClick={applyAll} style={{
          width:'100%', padding:'9px', borderRadius:8,
          background:'var(--ba)', color:'#fff', border:'none',
          cursor:'pointer', fontSize:13, fontWeight:600,
          fontFamily:'var(--sans)',
        }}>
          הפעל סימונים ✓
        </button>
      </div>
    </div>
  );
}


// ── Sparkle icon with CSS animation ─────────────────────────────────────
// inject keyframe once
if (typeof document !== 'undefined' && !document.getElementById('tabot-kf')) {
  const s = document.createElement('style');
  s.id = 'tabot-kf';
  s.textContent = '@keyframes tabot-spin{0%{transform:rotate(-18deg) scale(.95)}100%{transform:rotate(18deg) scale(1.1)}}';
  document.head.appendChild(s);
}

function SparkleIcon() {
  return (
          <div style={{
            width: 38, height: 38, borderRadius: "50%",
            background: "#1D9E75",
            border: "2px solid #5DCAA5",
            display: "flex", alignItems: "center", justifyContent: "center",
            flexShrink: 0, transition: "background .2s",
            boxShadow: "0 0 0 4px #0d4a3e", margin: "0 0 0 1px"
          }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
              style={{ display: "block", transformOrigin: "12px 12px",
                       animation: "tabot-spin .75s ease-in-out alternate infinite" }}>
              <path d="M12 2 L13.4 10.6 L22 12 L13.4 13.4 L12 22 L10.6 13.4 L2 12 L10.6 10.6 Z" fill="white"/>
              <path d="M20 3 L20.6 5.4 L23 6 L20.6 6.6 L20 9 L19.4 6.6 L17 6 L19.4 5.4 Z" fill="white" opacity="0.75"/>
              <path d="M4 17 L4.5 19.5 L7 20 L4.5 20.5 L4 23 L3.5 20.5 L1 20 L3.5 19.5 Z" fill="white" opacity="0.55"/>
            </svg>
          </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────
export default function ParamBot({ params, onParamChange, onClose, template, setTemplate, printers = [], selectedPrinters = [], setSelectedPrinters, orderTypes, setOrderTypes, sources, setSources, tree = [], flatItems = [], bonName, setBonName }) {
  const STORAGE_KEY = 'tabot_messages_v1';

  const loadMessages = () => {
    try {
      const saved = sessionStorage.getItem(STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch(e) {}
    return [{ id:0, from:'bot', text: FLOW.start.q, step:'start', ts: Date.now() }];
  };

  const [messages, setMessages] = useState(loadMessages);
  const [step, setStep]         = useState('start');
  const [typing, setTyping]     = useState(false);
  const [done, setDone]         = useState(false);
  const [typingMsg, setTypingMsg] = useState(null); // {id, text, progress}
  const [pendingPrinters, setPendingPrinters] = useState([]);
  const [stepStack, setStepStack] = useState([]);
  const [selectedSubCats, setSelectedSubCats] = useState([]);
  const [currentCatId, setCurrentCatId] = useState(null);
  const [itemQuery, setItemQuery] = useState('');
  const [selectedItems, setSelectedItems] = useState([]);
  const bottomRef               = useRef(null);
  const msgId                   = useRef(1);
  const typingRef               = useRef(null);

  // Save to sessionStorage on change
  useEffect(() => {
    try { sessionStorage.setItem(STORAGE_KEY, JSON.stringify(messages)); } catch(e) {}
  }, [messages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior:'smooth' });
  }, [messages, typing]);

  const delay = () => 500 + Math.random() * 1000;

  const pushStep = (newStep) => {
    setStepStack(prev => [...prev, step]);
    setStep(newStep);
  };

  const goBack = () => {
    if (stepStack.length === 0) return;
    const prev = stepStack[stepStack.length - 1];
    setStepStack(s => s.slice(0, -1));
    setStep(prev);
    setDone(false);
  };

  const botSay = (text, stepKey, recoParams) => {
    setTyping(true);
    setTimeout(() => {
      setTyping(false);
      const id = msgId.current++;
      const ts = Date.now();
      const msg = { id, from:'bot', text:'', step: stepKey, ts };
      if (recoParams) msg.recoParams = recoParams;
      setMessages(m => [...m, msg]);

      // Typing effect — reveal chars one by one
      let i = 0;
      const speed = Math.max(18, 35 - text.length * 0.1); // faster for longer texts
      clearInterval(typingRef.current);
      typingRef.current = setInterval(() => {
        i++;
        setMessages(m => m.map(x => x.id === id ? { ...x, text: text.slice(0, i) } : x));
        if (i >= text.length) {
          clearInterval(typingRef.current);
          if (recoParams) setDone(true);
        }
      }, speed);
    }, delay());
  };

  const handleOpt = (opt) => {
    if (done) return;
    setMessages(m => [...m, { id: msgId.current++, from:'user', text: opt.lbl, ts: Date.now() }]);

    if (opt.action === 'setTemplate' && setTemplate) {
      const names = { general:'בון כללי', allday:'כל היום', peritem:'פריט בודד', perdiner:'לפי סועדים' };
      setTemplate(opt.value);
      botSay(`✓ התבנית שונתה ל״${names[opt.value]}״.`, 'done_msg');
      setDone(true);

    } else if (opt.action === 'listActivePrinters') {
      if (!printers || printers.length === 0) {
        botSay('לא נמצאו מדפסות בבסיס הנתונים.', step);
      } else {
        const active = printers.filter(p => (selectedPrinters || []).includes(p.id));
        if (active.length === 0) {
          botSay('הבון לא מחובר לאף מדפסת כרגע.', step);
        } else {
          botSay('מדפסות מחוברות לבון:\n' + active.map(p => '🟢 ' + p.name + ' — ' + p.type + ' — ' + p.ip).join('\n'), step);
        }
      }

    } else if (opt.action === 'listAvailablePrinters') {
      if (!printers || printers.length === 0) {
        botSay('לא נמצאו מדפסות בבסיס הנתונים.', step);
      } else {
        const inactive = printers.filter(p => !(selectedPrinters || []).includes(p.id));
        if (inactive.length === 0) {
          botSay('כל המדפסות כבר מחוברות לבון.', step);
        } else {
          botSay('מדפסות זמינות (לא מחוברות):\n' + inactive.map(p => '⚫ ' + p.name + ' — ' + p.type + ' — ' + p.ip).join('\n'), step);
        }
      }

    } else if (opt.action === 'editPrinters') {
      if (!printers || printers.length === 0) {
        botSay('לא נמצאו מדפסות בבסיס הנתונים.', step);
      } else {
        setPendingPrinters([...(selectedPrinters || [])]);
        pushStep('_editPrinters');
        botSay('בחר את המדפסות שהבון ישלח אליהן — סמן כמה שתרצה ואשר:', '_editPrinters');
      }

    } else if (opt.action === '_togglePrinter') {
      // Toggle inside pending — don't apply yet
      setPendingPrinters(prev =>
        prev.includes(opt.value) ? prev.filter(id => id !== opt.value) : [...prev, opt.value]
      );
      return; // stay in step, don't advance

    } else if (opt.action === '_confirmPrinters' && setSelectedPrinters) {
      setSelectedPrinters(pendingPrinters);
      const names = printers.filter(p => pendingPrinters.includes(p.id)).map(p => p.name).join(', ') || 'ללא';
      botSay('✓ מדפסות עודכנו: ' + names, 'done_msg');
      setDone(true);

    } else if (opt.action === 'addCategory') {
      if (!tree || tree.length === 0) {
        botSay('לא נמצאו קטגוריות. בדוק שהתפריט טעון.', step);
      } else {
        pushStep('_pickDivision');
        botSay('בחר מחלקה:', '_pickDivision');
      }

    } else if (opt.action === '_pickDivision') {
      // tree is nested: [{id, name, children:[...], items:[...]}]
      // find the division node and look at its children
      const findNode = (nodes, id) => {
        for (const n of nodes) {
          if (n.id === id) return n;
          const found = findNode(n.children || [], id);
          if (found) return found;
        }
        return null;
      };
      const divNode = findNode(tree || [], opt.value);
      const children = divNode?.children || [];
      if (children.length === 0) {
        setCurrentCatId(opt.value);
        setSelectedSubCats([]);
        pushStep('_pickSubCats');
        botSay(`בחר תתי-קטגוריות מ״${opt.label}״ (ניתן לבחור כמה):`, '_pickSubCats');
      } else {
        setCurrentCatId(opt.value);
        pushStep('_pickCategory');
        const d = delay();
        setTyping(true);
        setTimeout(() => {
          setTyping(false);
          setMessages(m => [...m, { id: msgId.current++, from:'bot',
            text: `בחר קטגוריה מ״${opt.label}״:`, step: '_pickCategory',
            _divisionId: opt.value, ts: Date.now() }]);
        }, d);
      }

    } else if (opt.action === '_pickCategory') {
      const findNode = (nodes, id) => {
        for (const n of nodes) {
          if (n.id === id) return n;
          const found = findNode(n.children || [], id);
          if (found) return found;
        }
        return null;
      };
      const catNode = findNode(tree || [], opt.value);
      const children = catNode?.children || [];
      setCurrentCatId(opt.value);
      setSelectedSubCats([]);
      if (children.length === 0) {
        onParamChange('INC_CATS', [...(params['INC_CATS'] || []), opt.value]);
        botSay(`✓ הקטגוריה ״${opt.label}״ נוספה לתצוגה.`, 'done_msg');
        setDone(true);
      } else {
        pushStep('_pickSubCats');
        botSay(`בחר תתי-קטגוריות מ״${opt.label}״ (ניתן לבחור כמה):`, '_pickSubCats');
      }

    } else if (opt.action === '_toggleSubCat') {
      setSelectedSubCats(prev =>
        prev.includes(opt.value) ? prev.filter(id => id !== opt.value) : [...prev, opt.value]
      );
      return;

    } else if (opt.action === '_selectAllSubCats') {
      const children = (tree || []).filter(c => c.parent_id === currentCatId || c.parentId === currentCatId);
      setSelectedSubCats(children.map(c => c.id));
      return;

    } else if (opt.action === '_confirmSubCats') {
      if (selectedSubCats.length === 0) {
        botSay('לא נבחרו תתי-קטגוריות. בחר לפחות אחת.', step);
        return;
      }
      const cur = params['INC_CATS'] || [];
      onParamChange('INC_CATS', [...cur, ...selectedSubCats.filter(id => !cur.includes(id))]);
      botSay(`✓ ${selectedSubCats.length} קטגוריות נוספו לתצוגה.`, 'done_msg');
      setDone(true);

    } else if (opt.action === '_selectCategory') {
      // legacy fallback
      onParamChange('INC_CATS', [...(params['INC_CATS'] || []), opt.value]);
      botSay(`✓ הקטגוריה ״${opt.label}״ נוספה לתצוגה.`, 'done_msg');
      setDone(true);

    } else if (opt.action === 'addItems') {
      if (!flatItems || flatItems.length === 0) {
        botSay('לא נמצאו פריטים. בדוק שהתפריט טעון.', step);
      } else {
        setItemQuery('');
        setSelectedItems([]);
        pushStep('_addItems');
        botSay('הקלד שם פריט לחיפוש, בחר פריטים ואשר:', '_addItems');
      }

    } else if (opt.action === '_toggleItem') {
      setSelectedItems(prev =>
        prev.includes(opt.value) ? prev.filter(id => id !== opt.value) : [...prev, opt.value]
      );
      return;

    } else if (opt.action === '_confirmItems') {
      if (selectedItems.length === 0) {
        botSay('לא נבחרו פריטים. בחר לפחות אחד.', step);
        return;
      }
      const cur = params['INC_ITEMS'] || [];
      onParamChange('INC_ITEMS', [...cur, ...selectedItems.filter(id => !cur.includes(id))]);
      const names = flatItems.filter(i => selectedItems.includes(i.id)).map(i => i.name).join(', ');
      botSay(`✓ ${selectedItems.length} פריטים נוספו: ${names}`, 'done_msg');
      setDone(true);

    } else if (opt.action === '_selectItem') {
      // legacy
      onParamChange('INC_ITEMS', [...(params['INC_ITEMS'] || []), opt.value]);
      botSay(`✓ הפריט ״${opt.label}״ נוסף לתצוגה.`, 'done_msg');
      setDone(true);

    } else if (opt.action === 'clearItems') {
      onParamChange('INC_ITEMS', []);
      onParamChange('INC_CATS', []);
      botSay('✓ רשימת הפריטים נוקתה.', 'done_msg');
      setDone(true);

    } else if (opt.action === 'toggleAggregation') {
      const cur = !!params['ENABLE_FORCE_AGGREGATED_ITEMS_SECTION'];
      onParamChange('ENABLE_FORCE_AGGREGATED_ITEMS_SECTION', !cur);
      botSay(`✓ אגרגציה ${!cur ? 'הופעלה' : 'כובתה'}.`, 'done_msg');
      setDone(true);

    } else if (opt.action === 'setOrderTypes') {
      pushStep('_setOrderTypes');
      botSay('סמן את סוגי ההזמנה שתרצה להציג:', '_setOrderTypes');

    } else if (opt.action === 'setSources') {
      pushStep('_setSources');
      botSay('סמן את מקורות ההזמנה שתרצה להציג:', '_setSources');

    } else if (opt.action === 'showActive') {
      const active = Object.entries(params)
        .filter(([,v]) => v === true || (Array.isArray(v) && v.length > 0) || (typeof v === 'number' && v > 0))
        .map(([k]) => k);
      if (active.length === 0) {
        botSay('אין פרמטרים פעילים כרגע.', step);
      } else {
        setMessages(m => [...m, {
          id: msgId.current++, from:'bot',
          text: `${active.length} פרמטרים פעילים כרגע:`,
          activeParams: active, step,
        }]);
      }

    } else if (opt.end && opt.params) {
      botSay('הנה הפרמטרים הכי מתאימים לצרכים שלך:', 'reco', opt.params);

    } else if (opt.next && FLOW[opt.next]) {
      pushStep(opt.next);
      botSay(FLOW[opt.next].q, opt.next);
    }
  };

  // ── Dynamic option lists (printers / categories / items / OT / SRC) ──
  const dynamicOpts = () => {
    if (step === '_editPrinters')
      return [
        ...printers.map(p => ({
          lbl: `${pendingPrinters.includes(p.id) ? '✓' : '○'} ${p.name} — ${p.type}`,
          action: '_togglePrinter', value: p.id, label: p.name,
          active: pendingPrinters.includes(p.id),
        })),
        { lbl: '💾 אשר בחירה', action: '_confirmPrinters', isConfirm: true },
      ];
    if (step === '_choosePrinter')
      return (printers || []).map(p => ({
        lbl: `${p.name} — ${p.type}`, action: '_selectPrinter', value: p.id, label: p.name,
      }));
    if (step === '_pickDivision') {
      // tree is already top-level nodes (parent_id=null)
      return (tree || []).map(c => ({ lbl: c.display || c.name, action: '_pickDivision', value: c.id, label: c.display || c.name }));
    }
    if (step === '_pickCategory') {
      // currentCatId holds the division id
      const findNode = (nodes, id) => {
        for (const n of nodes) { if (n.id === id) return n; const f = findNode(n.children||[],id); if(f) return f; } return null;
      };
      const divNode = findNode(tree || [], currentCatId);
      const cats = divNode?.children || [];
      return cats.map(c => ({ lbl: c.display || c.name, action: '_pickCategory', value: c.id, label: c.display || c.name }));
    }
    if (step === '_pickSubCats') {
      const findNode = (nodes, id) => {
        for (const n of nodes) { if (n.id === id) return n; const f = findNode(n.children||[],id); if(f) return f; } return null;
      };
      const catNode = findNode(tree || [], currentCatId);
      const subCats = catNode?.children || [];
      return [
        { lbl: 'בחר הכל', action: '_selectAllSubCats', isSelectAll: true },
        ...subCats.map(c => ({
          lbl: c.name, action: '_toggleSubCat', value: c.id, label: c.name,
          active: selectedSubCats.includes(c.id),
        })),
        { lbl: `✓ אשר (${selectedSubCats.length})`, action: '_confirmSubCats', isConfirm: true },
      ];
    }
    if (step === '_addItems')
      return null; // handled by search UI below
    if (step === '_setOrderTypes') {
      const OT = [
        { value:'SEATED', label:'ישיבה' }, { value:'TA', label:'טייק אווי' },
        { value:'DELIVERY', label:'משלוח' }, { value:'OTC', label:'OTC כולל' },
        { value:'OTC_SEATED', label:'OTC ישיבה' }, { value:'OTC_TA', label:'OTC לקחת' },
      ];
      return OT.map(o => ({ lbl: o.label, action: '_toggleOT', value: o.value, active: (orderTypes||[]).includes(o.value) }));
    }
    if (step === '_setSources') {
      const SRC = [
        { value:'online', label:'אונליין' }, { value:'restaurantOnPremise', label:'On Premise' },
        { value:'callCenter', label:'קול סנטר' }, { value:'phone', label:'טלפוני' },
        { value:'external', label:'צד שלישי' }, { value:'kiosk', label:'קיוסק' },
      ];
      return SRC.map(o => ({ lbl: o.label, action: '_toggleSrc', value: o.value, active: (sources||[]).includes(o.value) }));
    }
    return null;
  };

  const handleDynamicToggle = (action, value) => {
    if (action === '_toggleOT') {
      const cur = orderTypes || [];
      setOrderTypes(cur.includes(value) ? cur.filter(v=>v!==value) : [...cur, value]);
    }
    if (action === '_toggleSrc') {
      const cur = sources || [];
      setSources(cur.includes(value) ? cur.filter(v=>v!==value) : [...cur, value]);
    }
  };

  const handleDynamicConfirm = () => {
    if (step === '_setOrderTypes') { botSay(`✓ סוגי ההזמנה עודכנו.`, 'done_msg'); setDone(true); }
    if (step === '_setSources')    { botSay(`✓ מקורות ההזמנה עודכנו.`, 'done_msg'); setDone(true); }
  };

  const reset = () => {
    clearInterval(typingRef.current);
    const initMsg = { id:0, from:'bot', text: FLOW.start.q, step:'start', ts: Date.now() };
    setMessages([initMsg]);
    setStep('start');
    setStepStack([]);
    setTyping(false);
    setDone(false);
    msgId.current = 1;
    try { sessionStorage.setItem('tabot_messages_v1', JSON.stringify([initMsg])); } catch(e) {}
  };

  const current = FLOW[step];
  const lastBotStep = [...messages].reverse().find(m => m.from === 'bot')?.step;
  const showOpts = !typing;

  const S = {
    wrap: {
      position:'absolute', top:0, left:0, width:'100%', height:'100%',
      background:'#fff', display:'flex', flexDirection:'column',
      zIndex:300, direction:'rtl',
    },
    header: {
      display:'flex', alignItems:'center', justifyContent:'space-between',
      padding:'6px 16px', background:'var(--ba)', flexShrink:0,
    },
    messages: {
      flex:1, overflowY:'auto', padding:'16px 14px',
      display:'flex', flexDirection:'column',
      background:'#f0f2f5',
    },
    userBubble: {
      alignSelf:'flex-end', background:'#dcf8c6',
      padding:'9px 14px', borderRadius:'18px 4px 18px 18px',
      maxWidth:'78%', fontSize:13, lineHeight:1.5, textAlign:'right',
      fontFamily:'var(--sans)', marginBottom:2,
      boxShadow:'0 1px 2px rgba(0,0,0,.1)', color:'#111',
    },
    botBubble: {
      alignSelf:'flex-start', background:'#fff',
      padding:'9px 14px', borderRadius:'4px 18px 18px 18px',
      maxWidth:'85%', fontSize:13, lineHeight:1.5, textAlign:'right',
      fontFamily:'var(--sans)', marginBottom:2,
      boxShadow:'0 1px 2px rgba(0,0,0,.1)', color:'#111',
    },
    ts: {
      fontSize:10, color:'#aaa', marginBottom:6, direction:'ltr',
    },
    opts: {
      flexShrink:0, padding:'10px 14px 14px',
      background:'#fff', borderTop:'1px solid #eee',
    },
    confirmBtn: {
      width:'100%', padding:'9px', borderRadius:8, marginTop:6,
      background:'var(--ba)', color:'#fff', border:'none',
      cursor:'pointer', fontSize:13, fontWeight:600, fontFamily:'var(--sans)',
    },
    pill: (sel) => ({
      display:'inline-block', margin:'3px',
      padding:'7px 14px', borderRadius:20,
      border:`1.5px solid ${sel ? 'var(--ba)' : '#ddd'}`,
      background: sel ? 'var(--ba)' : '#fafafa',
      color: sel ? '#fff' : '#333',
      cursor:'pointer', fontSize:12,
      fontFamily:'var(--sans)', fontWeight: sel ? 600 : 400,
      transition:'all .15s',
    }),
  };

  return (
    <>
      <style>{`
        @keyframes botDot {
          0%,60%,100%{transform:translateY(0);opacity:.4}
          30%{transform:translateY(-5px);opacity:1}
        }
      `}</style>
      <div style={S.wrap}>
        {/* Header */}
        <div style={S.header}>
          <div style={{ display:'flex', alignItems:'center' }}>
            <SparkleIcon />
                        <div style={{
              background: "#0d4a3e", color: "#5DCAA5",
              fontFamily: "var(--sans)", fontSize: 13, fontWeight: 600,
              padding: "0 14px 0 18px", height: 27, borderRadius: "22px 0 0 22px",
              display: "flex", alignItems: "center", whiteSpace: "nowrap",
              border: "1.5px solid #0d4a3e", borderRight: "none", marginRight: -1,
              transition: "background .2s",
            }} dir='rtl'>עוזר AI</div>
          </div>
          <div style={{ display:'flex', gap:8 }}>
            <button onClick={reset} style={{
              background:'rgb(255, 255, 255)', border:'none', cursor:'pointer',
              color:'#0e4b48', borderRadius:8, padding:'5px 10px', fontSize:12,
              fontFamily:'var(--sans)',
            }}><span style={{ color:'#0e4b48', fontWeight:700, fontSize:15, fontFamily:'var(--sans)' }}>
            ↺
            </span> התחלה מחדש</button>
            <button onClick={onClose} style={{
              background:'rgb(255, 255, 255)', border:'none', cursor:'pointer',
              color:'#0e4b48', borderRadius:8, padding:'5px 10px', fontSize:12, fontWeight:700,
              fontFamily:'var(--sans)',
            }}>X</button>
          </div>
        </div>

        {/* Messages */}
        <div style={S.messages}>
          {messages.map(msg => {
            const isUser = msg.from === 'user';
            const timeStr = msg.ts ? new Date(msg.ts).toLocaleTimeString('he-IL', { hour:'2-digit', minute:'2-digit' }) : '';
            return (
              <div key={msg.id} style={{
                display:'flex', flexDirection:'column',
                alignItems: isUser ? 'flex-end' : 'flex-start',
                marginBottom: 8,
              }}>
                <div style={isUser ? S.userBubble : S.botBubble}>
                  {(msg.text || '').split('\n').map((line, i, arr) => (
                    <span key={`${msg.id}-${i}`}>{line}{i < arr.length-1 && <br/>}</span>
                  ))}
                </div>
                {msg.recoParams && (
                  <div style={{ width:'100%', marginTop:4, marginBottom:4 }}>
                    <RecoCard paramIds={msg.recoParams} params={params} onParamChange={onParamChange} />
                  </div>
                )}
                {msg.activeParams && (
                  <div style={{ width:'100%', marginTop:4, background:'#f9f9f9',
                                border:'1.5px solid #e0e0e0', borderRadius:10, overflow:'hidden' }}>
                    {msg.activeParams.map(id => (
                      <div key={id} style={{ padding:'8px 14px', borderBottom:'1px solid #eee',
                                            display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                        <span style={{ fontSize:12, color:'#333', direction:'rtl' }}>{getParamLabel(id)}</span>
                        <button onClick={() => onParamChange(id, false)}
                          style={{ background:'none', border:'none', cursor:'pointer', color:'#e55', fontSize:12 }}>
                          כבה
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                {timeStr && <span style={S.ts}>{timeStr}</span>}
              </div>
            );
          })}
          {typing && <TypingIndicator />}
          <div ref={bottomRef} />
        </div>

        {/* Options — always visible when not typing */}
        {showOpts && (() => {
          // ── Always-available done/restart pills ──
          const canGoBack = stepStack.length > 0 && !done;
          const donePills = (
            <div style={{ display:'flex', gap:6, marginTop: done ? 0 : 6,
                          borderTop: done ? 'none' : '0.5px solid var(--bdr)',
                          paddingTop: done ? 0 : 8, flexWrap:'wrap' }}>
              {canGoBack && (
                <span style={{
                  ...S.pill(false),
                  background:'#f0f0f0', color:'#555', borderColor:'#ddd',
                }} onClick={goBack}>← חזור</span>
              )}
              <span style={{
                ...S.pill(false),
                background:'var(--ba)', color:'#fff', borderColor:'var(--ba)', fontWeight:600,
              }} onClick={reset}>↺ שאלה נוספת</span>
              <span style={{
                ...S.pill(false),
                background:'#f5f5f5', color:'#555', borderColor:'#ddd',
              }} onClick={onClose}>סגור</span>
            </div>
          );

          // ── Item search UI ──
          if (step === '_addItems' && !done) {
            const results = itemQuery.trim().length >= 1
              ? (flatItems || []).filter(i => i.name.toLowerCase().includes(itemQuery.toLowerCase())).slice(0, 30)
              : [];
            return (
              <div style={S.opts}>
                <div style={{ display:'flex', alignItems:'center', gap:6,
                              background:'var(--bm)', border:'1px solid var(--bdr)',
                              borderRadius:8, padding:'5px 9px', marginBottom:6 }}>
                  <input
                    type="text"
                    placeholder="חפש פריט..."
                    value={itemQuery}
                    onChange={e => setItemQuery(e.target.value)}
                    style={{ flex:1, border:'none', background:'transparent', fontSize:12,
                             outline:'none', color:'var(--bd)', direction:'rtl' }}
                  />
                </div>
                {results.length > 0 && (
                  <div style={{ maxHeight:140, overflowY:'auto', borderRadius:8,
                                border:'1px solid var(--bdr)', marginBottom:6 }}>
                    {results.map((item) => {
                      const sel = selectedItems.includes(item.id);
                      return (
                        <div key={item.id}
                          onClick={() => setSelectedItems(prev =>
                            prev.includes(item.id) ? prev.filter(id => id !== item.id) : [...prev, item.id]
                          )}
                          style={{ display:'flex', alignItems:'center', gap:8, padding:'7px 10px',
                                   cursor:'pointer', fontSize:12, direction:'rtl',
                                   borderBottom: '1px solid var(--bdr)',
                                   background: sel ? '#f0fdf4' : 'var(--bg)' }}>
                          <div style={{ width:15, height:15, borderRadius:4, flexShrink:0,
                                        border:`2px solid ${sel ? '#1D9E75' : '#ccc'}`,
                                        background: sel ? '#1D9E75' : '#fff',
                                        display:'flex', alignItems:'center', justifyContent:'center' }}>
                            {sel && <span style={{ color:'#fff', fontSize:9, lineHeight:1 }}>✓</span>}
                          </div>
                          <span style={{ color: sel ? '#166534' : 'var(--bd)', fontWeight: sel ? 600 : 400 }}>
                            {item.name}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
                {itemQuery.trim().length >= 1 && results.length === 0 && (
                  <div style={{ fontSize:12, color:'#999', padding:'6px 2px' }}>לא נמצאו פריטים</div>
                )}
                {selectedItems.length > 0 && (
                  <button style={S.confirmBtn}
                    onClick={() => handleOpt({ action:'_confirmItems' })}>
                    הוסף {selectedItems.length} פריטים ✓
                  </button>
                )}
                {donePills}
              </div>
            );
          }

          // ── After done: just restart/close ──
          if (done) {
            return (
              <div style={S.opts}>
                {donePills}
              </div>
            );
          }

          // ── Dynamic opts (printers, categories, OT, sources) ──
          const dynOpts = dynamicOpts();
          const isToggle = step === '_setOrderTypes' || step === '_setSources';
          if (dynOpts) return (
            <div style={S.opts}>
              <div style={{ display:'flex', flexWrap:'wrap' }}>
                {dynOpts.map(opt => (
                  <span key={opt.lbl}
                    style={{
                      ...S.pill(!!opt.active),
                      ...(opt.isConfirm ? { background:'var(--ba)', color:'#fff', borderColor:'var(--ba)', fontWeight:600 } : {}),
                      ...(opt.isSelectAll ? { background:'#f0f0f0', color:'var(--bd)' } : {}),
                    }}
                    onClick={() => isToggle ? handleDynamicToggle(opt.action, opt.value) : handleOpt(opt)}>
                    {opt.lbl}
                  </span>
                ))}
              </div>
              {isToggle && <button style={S.confirmBtn} onClick={handleDynamicConfirm}>אשר בחירה ✓</button>}
              {donePills}
            </div>
          );

          // ── Static FLOW opts ──
          if (!current?.opts) return <div style={S.opts}>{donePills}</div>;
          return (
            <div style={S.opts}>
              <div style={{ display:'flex', flexWrap:'wrap' }}>
                {current.opts.map(opt => (
                  <span key={opt.lbl} style={S.pill(false)} onClick={() => handleOpt(opt)}>
                    {opt.lbl}
                  </span>
                ))}
              </div>
            </div>
          );
        })()}


      </div>
    </>
  );
}
