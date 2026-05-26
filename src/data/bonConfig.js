export const BASE_PD = {
  ORDER_TYPE: 'SEATED',
  ORDER_SERVICE_TYPE: 'SEATED',
  ORDER_NO: 1,
  FIRED_BY: 'Roi Haruvi',
  NUMBER_OF_GUESTS: 4,
  REPRINT: false,
  TABLE_NO: '2001',
  ORDER_SOURCE: 'restaurantOnPremise',
  IS_SEATED_WITHOUT_TABLE: '0',
  BOLD_TD_DETAILS: false,
  DIFF_LEAD_VS_NONLEAD_ITEM: false,
  NO_COURSE_NAME: false,
};

export const SOURCE_OT_MAP = {
  online:               ['TA', 'DELIVERY', 'OTC_TA'],
  restaurantOnPremise:  ['SEATED', 'OTC_SEATED', 'OTC_TA'],
  callCenter:           ['TA', 'DELIVERY'],
  phone:                ['TA', 'DELIVERY'],
  external:             ['TA', 'DELIVERY'],
  kiosk:                ['OTC_SEATED', 'OTC_TA'],
};

export const OT_BUTTONS = [
  { ot: 'SEATED',     label: 'ישיבה' },
  { ot: 'TA',         label: 'טייק אווי (TA)' },
  { ot: 'DELIVERY',   label: 'משלוח (Delivery)' },
  { ot: 'OTC_SEATED', label: 'OTC - ישיבה' },
  { ot: 'OTC_TA',     label: 'OTC - לקחת' },
];

export const TMPLS = [
  { id: 'general', name: 'בון כללי' },
  { id: 'allday',  name: 'כל היום' },
  { id: 'peritem', name: 'פריט בודד' },
  { id: 'perdiner', name: 'לפי סועדים' },
];

// ── Static select options ────────────────────────────────────────────────
export const TAGS_ITEM = [
  'מנה עלינו','יום הולדת','לקחת','לא להוציא','עם האוכל',
  'צירוף בונים','החלפת מנה','להוציא ראשון',
];
export const TAGS_COURSE = [
  'מוכן יוצא','לא להכין','הכל ביחד','עם האוכל',
  'לקחת','לא להוציא','דחוף',
];
export const WORKFLOW_PROFILES = [
  { type: 'S',   type_display_name: 'מתן שירות', name: 'פנים' },
  { type: 'S',   type_display_name: 'מתן שירות', name: 'חצר' },
  { type: 'S',   type_display_name: 'מתן שירות', name: 'VIP' },
  { type: 'B',   type_display_name: 'בר',        name: 'בר פנים' },
  { type: 'OTC', type_display_name: 'דלפק',      name: 'קיוסק' },
  { type: 'TD',  type_display_name: 'TD',        name: 'משלוחים ו-TA' },
];
export const MENU_VIEWS = ['תפריט בוקר','תפריט ערב','משלוחים ו-TA','Wolt'];

// ── Param types ──────────────────────────────────────────────────────────
// type: 'bool' | 'numeric' | 'select' | 'text' | 'multi'
// multi = can be added multiple times, each with a value
// children = array of param ids that appear nested under this param
// selectOpts = array of strings or {label, value} objects
// noImpl = true → show disabled (not implemented)
// parentId = id of parent param (auto-set, for reference)

export const CTX_ZONES = {

  // ════════════════════════════════════════════════════
  // GENERAL — הגדרות כלליות של הבון
  // ════════════════════════════════════════════════════
  general: {
    title: 'הגדרות כלליות',
    cats: {
      'הגבלות הדפסה': [
        { id: 'EXCLUDE_TABLES_',
          lbl: 'החרג טווח שולחנות',
          sub: 'הגדר טווח שולחנות שהזמנות מהם לא יודפסו בעמדה זה. למשל מ-101 עד-110, בונים שהודפסו מטווח שולחנות זה לא יודפסו.',
          templates: ['general','allday','perdiner'],
          type: 'range', noImpl: true },

        { id: 'EXCLUDE_PROFILE_',
          lbl: 'החרג פרופיל עבודה',
          sub: 'בחר פרופיל עבודה שהזמנות ממנו לא יודפסו בעמדה זו.',
          templates: ['general','allday','perdiner'],
          type: 'multi', selectSrc: 'workflow_profiles',
          noImpl: true },

        { id: 'INCLUDE_PROFILE_',
          lbl: 'הדפס רק מפרופיל עבודה נבחר',
          sub: 'רק הזמנות מפרופיל העבודה הנבחר יודפסו בעמדה זו.',
          templates: ['general','allday','perdiner'],
          type: 'multi', selectSrc: 'workflow_profiles',
          noImpl: true },

        { id: 'EXCLUDE_MENU_VIEW_',
          lbl: 'החרגת  תצוגה',
          sub: 'בחר תפריט תצוגה שפריטים שהוזמנו ממנה לא יודפסו בעמדה זו',
          templates: ['general','allday','perdiner'],
          type: 'multi', selectSrc: 'menu_views',
          noImpl: true },

        { id: 'IGNORE_KIOSK_ORDERS',
          lbl: 'אל תדפיס הזמנות קיוסק',
          sub: 'הזמנות שמקור ההזמנה שלהן הוא קיוסק לא יודפסו בעמדה זו. שימושי כאשר לקיוסק יש בון נפרד',
          templates: ['general','allday','perdiner'],
          noImpl: true },
      ],

      'תיאום תחנות': [
        { id: 'NOTIFY_OTHER_STATION',
          lbl: 'שלח התראה לתחנות אחרות',
          sub: 'מפעיל שליחת בון התראה לתחנות עבודה נוספות שמעורבות בהזמנה. שימושי לתיאום בין מטבח לבר או בין גריל למחלקת קינוחים.',
          templates: ['general'],
          noImpl: true },
      ],

      'Course והדפסה': [
        { id: 'SEPARATE_BON_4_EVERY_COURSE',
          lbl: 'בון נפרד לכל שלב בארוחה',
          sub: 'כל קורס יודפס כבון עצמאי עם כותרת, גוף ותחתית משלו. כך כל תחנת הכנה מקבלת בון נקי עבור הראשונות, עוד אחד לעיקריות וכן הלאה.',
          templates: ['general'] },

        { id: 'IGNORE_FIRE_TICKETS',
          lbl: 'בטל הדפסת בון שידור',
          sub: 'מבטל את הדפסת בון ה-FIRE לחלוטין. הפריטים יכנסו למטבח רק דרך הבון הראשוני, ללא בון שידור נפרד.',
          templates: ['general'],
          noImpl: true },

        { id: 'COURSE_SEPARATOR',
          lbl: 'קו הפרדה בין קורסים',
          sub: 'מוסיף שורת כוכביות (***) בין כל קורס לקורס הבא. עוזר לצוות לזהות בקלות איפה מסתיימות הראשונות ומתחילות העיקריות.',
          templates: ['general'],
          noImpl: true },

        { id: 'ONLY_COURSE_ACTION_FIRE',
          lbl: 'הדפס רק פריטים ששודרו',
          sub: 'הבון יציג רק פריטים שהמלצר שלח לשידור (FIRE). פריטים שעדיין בהמתנה לא יוצגו. שימושי במטבח עם מערכת Course.',
          templates: ['general','allday','perdiner'],
          noImpl: true },

        { id: 'ONLY_COURSE_ACTION_NOTIFY',
          lbl: 'הדפס פריטים ממתינים בלבד',
          sub: 'הבון יציג רק פריטים שטרם שודרו ונמצאים בהמתנה. שימושי למעקב אחר מה צריך עוד להתחיל להכין.',
          templates: ['general','allday','perdiner'],
          noImpl: true },

        { id: 'ONLY_COURSE_ACTION_FIRE_NOTIFY',
          lbl: 'פריטים שיצאו לאחר המתנה',
          sub: 'מדפיס בון עבור פריטים שנשלחו לשידור (FIRE) לאחר שהמתינו בתור. חלק ממערכת Course שמנהלת את סדר ההגשה.',
          templates: ['general','allday','perdiner'],
          noImpl: true },

        { id: 'ONLY_COURSE_IMMEDIATE_ACTION_FIRE_NOTIFY',
          lbl: 'פריטים שעברו מהמתנה לשידור',
          sub: 'מדפיס בון עבור פריטים שהיו בהמתנה ושודרו מיידית. חלק ממערכת Course שמנהלת את זרימת ההכנה בין תחנות.',
          templates: ['general','allday','perdiner'],
          noImpl: true },

        { id: 'ENABLE_ITEMS_FOR_FIRE_OF_NOTIFY_COURSE',
          lbl: 'הצג ממתינים על בון השידור',
          sub: 'מוסיף לבון השידור (FIRE) גם את שמות הפריטים שעדיין ממתינים בתור. עוזר לצוות המטבח לראות את התמונה המלאה של השולחן.',
          templates: ['general','allday','perdiner'],
          noImpl: true },

        { id: 'CLEAN_COURSE_STYLE',
          lbl: 'סגנון נקי לבון המתנה',
          sub: 'מסיר את המילה FIRE מבון ההמתנה ומציג אותו בסגנון נקי יותר. שימושי במסעדות שמעדיפות מינימליזם על הבון.',
          templates: ['general'],
          noImpl: true },
      ],
    },
  },

  // ════════════════════════════════════════════════════
  // HEADER
  // ════════════════════════════════════════════════════
  header: {
    title: 'עריכת ראש הבון',
    cats: {
      'הצגת מידע': [
        { id: 'HEADER_TABLE_NUMBER',
          lbl: 'מספר שולחן בולט בראש הבון',
          sub: 'מדפיס את מספר השולחן, TA או משלוח בגדול בראש הדף',
          templates: ['general','allday','peritem','perdiner'] },

        { id: 'ENLARGE_ORDER_TAGS',
          lbl: 'הגדלת הערות הזמנה',
          sub: 'תגיות מיוחדות כמו "אלרגיה" או "יום הולדת" יוצגו בגופן גדול',
          templates: ['general','perdiner'] },

        { id: 'PRINT_DELAYED_SUPPLY_DATETIME',
          lbl: 'תאריך ושעה להזמנה עתידית',
          sub: 'מציג תאריך ושעת אספקה בולטים בראש הבון — לבוקר למחרת, ארוחות חגים וכו',
          templates: ['general'] },

        { id: 'PRINT_DELAYED_SUPPLY_DATE',
          lbl: 'תאריך בלבד להזמנה עתידית',
          sub: 'מציג רק את התאריך, ללא שעת האספקה',
          templates: ['general'] },

        { id: 'PRINT_SUPPLY_TIME',
          lbl: 'שעת ביצוע ההזמנה הדחויה',
          sub: 'מציג בבולד כי ההזמנה מיועדת לשעה מאוחרת יותר',
          templates: ['allday'] },

        { id: 'SUPPLIED_TIME_ON_TOP',
          lbl: 'שעת אספקה בראש הבון',
          sub: 'מוסיף את השעה שבה ההזמנה צריכה להיות מוכנה',
          templates: ['allday'] },

        { id: 'PRINT_DELIVERY_ETA',
          lbl: 'שעת אספקה למשלוחים',
          sub: 'מוסיף בלוק בולט עם שעת המשלוח — למשלוחים בלבד',
          templates: ['general','allday'] },

        { id: 'PRINT_DETAILED_DELIVERY_ETA',
          lbl: 'שעת הזמנה ושעת אספקה',
          sub: 'מציג שתי שורות: מתי נקלטה ההזמנה ומתי היא צריכה להיות מוכנה',
          templates: ['general','allday'] },

        { id: 'ORDERER_ADDRESS_ON_HEADER',
          lbl: 'כתובת המשלוח בראש הבון',
          sub: 'רחוב, קומה ודירה יוצגו בראש הדף — שימושי למשלוחים',
          templates: ['general','allday'],
          children: ['TA_OTC_ORDERER_ADDRESS_REMARKS'] },

        { id: 'TA_OTC_ORDERER_ADDRESS_REMARKS',
          lbl: 'מספר שולחן בהזמנת דלפק לישיבה',
          sub: 'מוסיף מספר שולחן להזמנות OTC שמיועדות לישיבה במקום',
          templates: ['general','perdiner'],
          parentId: 'ORDERER_ADDRESS_ON_HEADER' },
      ],

      'הסרת מידע': [
        { id: 'OMIT_ORDER_TAGS',
          lbl: 'הסתר הערות הזמנה',
          sub: 'הערות כלליות כמו "אלרגיה" או "יום הולדת" לא יופיעו על הבון',
          templates: ['general','allday','perdiner'] },

        { id: 'OMIT_CUSTOMER_DETAILS',
          lbl: 'הסתר שם וטלפון של הלקוח',
          sub: 'פרטי הלקוח לא יודפסו על הבון — שימושי כשהמידע רגיש',
          templates: ['general'] },

        { id: 'OMIT_ORDERRER_TEL',
          lbl: 'הסתר מספר טלפון',
          sub: 'מסיר רק את הטלפון, השם עדיין יופיע',
          templates: ['general'] },

        { id: 'OMIT_OTC_TYPE',
          lbl: 'הסתר כותרת OTC',
          sub: 'מסיר את התוויות "לשבת" / "לקחת" בהזמנות דלפק',
          templates: ['general','allday','peritem','perdiner'] },
      ],

      'גודל ומראה': [
        { id: 'ENLARGE_BON_NAME',
          lbl: 'שם הבון בגופן גדול',
          sub: 'שם תחנת ההכנה יוצג גדול ובולד בראש הדף',
          templates: ['general','allday','peritem','perdiner'] },

        { id: 'BOLD_TD_DETAILS',
          lbl: 'TA / משלוח בהבלטה',
          sub: 'טקסט לבן על רקע שחור — בולט מאוד, קשה לפספס',
          templates: ['general','allday','peritem','perdiner'] },

        { id: 'HIGHLIGHT_ORDER_TYPE',
          lbl: 'סוג הזמנה בולט',
          sub: 'ישיבה / לקחת / משלוח / OTC יוצגו בבולד בהדגשה',
          templates: ['general','allday','peritem','perdiner'] },

        { id: 'TIME_DBL_HIGHT',
          lbl: 'שורת שעה וסועדים בגדול',
          sub: 'מספר הסועדים והשעה יוצגו בגופן גדול ובולד',
          templates: ['general','allday','peritem','perdiner'] },

        { id: 'DINER_FULL_NAME',
          lbl: 'שם הלקוח בגופן גדול',
          sub: 'שם המזמין יוצג בגדול — שימושי להזמנות משלוח ולקחת',
          templates: ['general'] },

        { id: 'ENLARGE_ORDERER_DETAILS',
          lbl: 'שם וטלפון בגדול',
          sub: 'שם ומספר טלפון המזמין יוצגו בגופן גדול',
          templates: ['perdiner'] },

        { id: 'REPRINT',
          lbl: 'כרזת שחזור',
          sub: 'מוסיף כרזת "ש ח ז ו ר" בולטת — לסימון שהבון הודפס מחדש',
          templates: ['general','allday','peritem','perdiner'] },

        { id: 'EXTRA_HDR_FEED',
          lbl: 'רווח בראש הבון',
          sub: 'מוסיף שורות ריקות לפני תחילת ההדפסה — לכיוון נייר',
          templates: ['general','allday','peritem','perdiner'],
          type: 'numeric' },
      ],
    },
  },

  // ════════════════════════════════════════════════════
  // ITEMS
  // ════════════════════════════════════════════════════
  items: {
    title: 'עריכת פריטים ומשנים',
    cats: {
      'שם הפריט': [
        { id: 'IGNORE_ITEM_PRINT_NAME',
          lbl: 'השתמש בשם המנה הרגיל',
          sub: 'גם כשהוגדר שם מטבח ייעודי, יוצג שם המנה הרגיל',
          templates: ['general'] },

        { id: 'ADD_OFFER_NAME',
          lbl: 'הצג שם הצעת המחיר',
          sub: 'מוסיף מעל כל פריט את שם הצעת המחיר (למשל: "ארוחה") בגופן קטן',
          templates: ['general','perdiner'] },

        { id: 'REPLACE_OFFER_NAME_FOR_LEAD_ITEMS',
          lbl: 'החלף שם מנה בשם הצעת המחיר',
          sub: 'שם הצעת המחיר יוצג במקום שם המנה — גובר על כל הגדרה אחרת',
          templates: ['general'] },

        { id: 'ADD_LONG_NAME_BELOW_ITEM',
          lbl: 'הצג שם מורחב מתחת למנה',
          sub: 'מוסיף שם ארוך/מפורט מתחת לשם המנה הרגיל',
          templates: ['general'] },
      ],

      'הצגת מידע': [
        { id: 'INCLUDE_DEFAULT_MODIFIERS',
          lbl: 'הצג תוספות ברירת מחדל',
          sub: 'תוספות שמגיעות עם המנה כברירת מחדל יוצגו גם כן על הבון',
          templates: ['general','allday','peritem','perdiner'] },

        { id: 'DIFF_LEAD_VS_NONLEAD_ITEM',
          lbl: 'פריטי צד בפורמט משנים',
          sub: 'פריטים נלווים (כמו שתייה בארוחה) יוצגו בקטן מתחת למנה הראשית',
          templates: ['general'] },

        { id: 'ADD_DINER_NUMBERS',
          lbl: 'מספר כסא מתחת לכל פריט',
          sub: 'מציג לאיזה סועד שייכת כל מנה — שימושי לשירות לשולחן',
          templates: ['general','peritem'],
          children: ['ADD_L_DINER_NUMBERS'] },

        { id: 'ADD_L_DINER_NUMBERS',
          lbl: 'מספר כסא בגדול ובולד',
          sub: 'גרסה מוגדלת — מספר הסועד יוצג גדול מאוד, קל לראות מרחוק',
          templates: ['general','peritem'],
          parentId: 'ADD_DINER_NUMBERS' },

        { id: 'DINER_HEADER',
          lbl: 'כותרת לכל סועד',
          sub: 'מציג "סועד 1", "סועד 2" מעל המנות של כל אחד',
          templates: ['general'] },

        { id: 'COURSE_TAGS_BEFORE_ITEMS',
          lbl: 'תגית דחוף',
          sub: 'מציג כרזת "דחוף" מעל מנות שדורשות טיפול מיידי',
          templates: ['general'] },

        { id: 'SIMPLE_ITEM_REMARKS',
          lbl: 'הסתר @ מהערות',
          sub: 'הערות שנכתבו עם @ (כגון @ללא מלח) יוצגו נקי ללא הסימן',
          templates: ['general'] },

        { id: 'OMIT_ITEM_REMARKS_4_EXTERNAL_ORDER',
          lbl: 'הסתר הערות מממשקים חיצוניים',
          sub: 'הערות שנכתבו ב-Wolt / Ten Bis וכד\' לא יודפסו על הבון',
          templates: ['general','peritem'] },

        { id: 'PRINT_ITEM_GROUP_NAME_',
          lbl: 'הצג שם קבוצת הפריטים',
          sub: 'שם הקבוצה (למשל: "תוספות") יוצג בבולט מעל הפריטים השייכים לה',
          templates: ['general'],
          type: 'multi', selectSrc: 'ig_groups' },

        { id: 'USE_MODIFIER_PRINT_NAME',
          lbl: 'שם מטבח למשנים',
          sub: 'השם הפנימי של המטבח למשנה יוצג במקום השם שהלקוח רואה',
          templates: ['allday'] },
      ],

      'הסרת מידע': [
        { id: 'IGNORE_ALL_MODIFIERS',
          lbl: 'הסתר משנים',
          sub: 'משנים ובחירות לא יודפסו — למעט מידת עשייה שתמיד מוצגת',
          templates: ['general'] },

        { id: 'OMIT_DINER_NAME',
          lbl: 'הסתר שמות סועדים',
          sub: 'שם הסועד שהזמין לא יוצג מתחת לפריטים',
          templates: ['general','allday'] },

        { id: 'NO_COURSE_NAME',
          lbl: 'הסתר כותרות קורס',
          sub: 'המנות יסודרו לפי קורס (ראשונות, עיקריות...) אך ללא כותרת מעל כל קבוצה',
          templates: ['general','allday','perdiner'] },

        { id: 'FILTER_OFFER_MODIFIERS_BY_MODIFER_GROUP_',
          lbl: 'סנן קבוצות משנים (מהפריט)',
          sub: 'רק המשנים מהקבוצות שתבחר יוצגו — שאר הקבוצות מוסתרות',
          templates: ['general'],
          type: 'multi', selectSrc: 'modifier_groups' },

        { id: 'OMIT_BON_TAGS',
          lbl: 'הסתר תגיות על פריטים ספציפיים',
          sub: 'מסיר תגיות שמוצמדות לפריטים בודדים (כמו "מנה עלינו" או "ללא חיוב"). שימושי כשהמידע הזה אינו רלוונטי לתחנת ההכנה.',
          templates: ['general'],
          noImpl: true },
      ],

      'סינון קורסים': [
        { id: 'INCLUDE_COURSE_BEVERAGES',
          lbl: 'הדפס משקאות בלבד',
          sub: 'רק מנות שסווגו כמשקאות יופיעו על הבון הזה',
          templates: ['general','allday','perdiner'] },

        { id: 'INCLUDE_COURSE_ENTREES',
          lbl: 'הדפס ראשונות בלבד',
          sub: 'רק מנות ראשונות יופיעו על הבון הזה',
          templates: ['general','allday','perdiner'] },

        { id: 'INCLUDE_COURSE_MAINS',
          lbl: 'הדפס עיקריות בלבד',
          sub: 'רק מנות עיקריות יופיעו על הבון הזה',
          templates: ['general','allday','perdiner'] },

        { id: 'INCLUDE_COURSE_DESSERTS',
          lbl: 'הדפס קינוחים בלבד',
          sub: 'רק קינוחים יופיעו על הבון הזה',
          templates: ['general','allday','perdiner'] },

        { id: 'INCLUDE_ITEM_TAG_',
          lbl: 'הדפס רק פריטים עם תגית נבחרת',
          sub: 'הבון יציג רק את הפריטים שתויגו בתגית הספציפית שתבחר. לדוגמה: הצג רק פריטים עם תגית "לקחת" או "להוציא ראשון".',
          templates: ['general','allday','perdiner'],
          type: 'multi', selectSrc: 'tags_item', noImpl: true },

        { id: 'EXCLUDE_ITEM_TAG_',
          lbl: 'הסתר פריטים עם תגית נבחרת',
          sub: 'פריטים שתויגו בתגית שתבחר לא יודפסו על הבון. לדוגמה: הסתר פריטים עם תגית "לא להוציא" או "מנה עלינו" כשלא רלוונטי לתחנה.',
          templates: ['general','allday','perdiner'],
          type: 'multi', selectSrc: 'tags_item', noImpl: true },

        { id: 'INCLUDE_COURSE_TAG_',
          lbl: 'הדפס קורס עם תגית נבחרת בלבד',
          sub: 'הבון יציג רק קורסים שסומנו בתגית הספציפית. לדוגמה: הצג רק קורסים עם תגית "מוכן יוצא" להדגשת מה מוכן עכשיו.',
          templates: ['general','allday','perdiner'],
          type: 'multi', selectSrc: 'tags_course', noImpl: true },

        { id: 'EXCLUDE_COURSE_TAG_',
          lbl: 'הסתר קורס עם תגית נבחרת',
          sub: 'קורסים שסומנו בתגית שתבחר לא יודפסו. לדוגמה: הסתר קורסים עם תגית "לא להכין" שמיועדים לעצירה זמנית.',
          templates: ['general','allday','perdiner'],
          type: 'multi', selectSrc: 'tags_course', noImpl: true },
      ],

      'גודל ומראה': [
        { id: 'MODIFIER_XL',
          lbl: 'משנים בגופן גדול',
          sub: 'בחירות ושינויים יוצגו בגופן גדול — קל לקריאה',
          templates: ['general'] },

        { id: 'ENLARGE_COOKING_LEVEL',
          lbl: 'מידת עשייה בולטת',
          sub: 'M, MR, WD ומידות עשייה קצרות יוצגו גדול ובולד',
          templates: ['general'] },

        { id: 'ADD_MODIFIER_GROUP_NAME_',
          lbl: 'כותרת לקבוצות משנים',
          sub: 'מוסיף כותרת מעל כל קבוצה (למשל: "רמת עשייה", "תוספות")',
          templates: ['general'],
          type: 'numeric' },

        { id: 'LARGE_MAIN_DISH',
          lbl: 'מנה עיקרית בגופן גדול',
          sub: 'שמות המנות העיקריות יוצגו בגדול — מבדיל בין עיקרית לתוספות',
          templates: ['general'] },

        { id: 'ITEM_NAME_SINGLE_HIGHT',
          lbl: 'בון קומפקטי',
          sub: 'מקטין את הגובה של שורות הפריטים — חוסך נייר בהזמנות ארוכות',
          templates: ['general'] },

        { id: 'PRINT_CONDENSE_FORMAT',
          lbl: 'תצוגה מקובצת',
          sub: 'פריטים יוצגו בשורה צרה — מתאים לבון לפי סועדים עם הרבה פריטים',
          templates: ['perdiner'] },

        { id: 'NORMAL_ITEM_LINE',
          lbl: 'הזזת כמות לצד ימין',
          sub: 'כמות המנה תוצג בצד ימין השורה במקום שמאל',
          templates: ['allday'] },

        { id: 'SHORT_TICKET',
          lbl: 'בון קצר ללא קווים',
          sub: 'מסיר קווי הפרדה בין פריטים — חוסך נייר',
          templates: ['general','allday','peritem','perdiner'] },
      ],

      'שפה': [
        { id: 'ENGLISH_TEXT',
          lbl: 'משנים בשפה אנגלית',
          sub: 'No / With / Side / More / Less — לתחנות עם צוות דובר אנגלית',
          templates: ['general','allday','peritem','perdiner'] },

        { id: 'USE_REMOVE_AS_NO',
          lbl: 'הסרות בסגנון אנגלי',
          sub: 'במקום "בלי X" יוצג "No X" — בשילוב עם בון באנגלית',
          templates: ['general'] },
      ],
    },
  },

  // ════════════════════════════════════════════════════
  // FOOTER
  // ════════════════════════════════════════════════════
  footer: {
    title: 'עריכת תחתית הבון',
    cats: {
      'הצגת מידע': [
        { id: 'ADD_SERVER_NAME',
          lbl: 'שם המלצר בתחתית',
          sub: 'מוסיף את שם המלצר שהזמין בתחתית הדף',
          templates: ['general','allday','perdiner'] },

        { id: 'ADD_TIME',
          lbl: 'שעת הדפסה בתחתית',
          sub: 'מוסיף את השעה שהבון הודפס — לבקרה ומעקב',
          templates: ['general','allday','perdiner'] },

        { id: 'PRINT_ORDER_SOURCE',
          lbl: 'מקור ההזמנה',
          sub: 'מציג מאיפה הגיעה ההזמנה: אתר, טלפון, קיוסק, ממשק חיצוני',
          templates: ['general','allday','perdiner'],
          children: ['ADD_ORDER_EXTERNAL_SOURCE_NAME'] },

        { id: 'ADD_ORDER_EXTERNAL_SOURCE_NAME',
          lbl: 'שם ממשק ההזמנות',
          sub: 'מציג Wolt / Tenbis / Cibus במקום "External" הגנרי',
          templates: ['general','allday','perdiner'],
          parentId: 'PRINT_ORDER_SOURCE' },

        { id: 'ORDERER_ADDRESS_ON_FOOTER',
          lbl: 'כתובת המשלוח בתחתית',
          sub: 'רחוב, קומה, דירה והערות השליח יוצגו בתחתית הבון',
          templates: ['general','allday'],
          children: ['ORDERER_STREET_ON_FOOTER'] },

        { id: 'ORDERER_STREET_ON_FOOTER',
          lbl: 'רחוב ומספר בית בלבד בתחתית',
          sub: 'גרסה מקוצרת — רק רחוב ומספר, ללא קומה ודירה',
          templates: ['allday'],
          parentId: 'ORDERER_ADDRESS_ON_FOOTER' },

        { id: 'ADD_ORDERER_REGION_NAME',
          lbl: 'אזור החלוקה',
          sub: 'מציג את שכונת/עיר המשלוח — שימושי לתיאום שליחים',
          templates: ['general'] },

        { id: 'NOTIFY_ON_ALL_OTHER_BONS',
          lbl: 'רשימת תחנות נוספות',
          sub: 'מציג אילו תחנות הכנה נוספות קיבלו בון עבור אותה הזמנה',
          templates: ['general'] },

        { id: 'PRINT_ORDERRER_TAGS',
          lbl: 'תגיות לקוח',
          sub: 'מוסיף תגיות לקוח מהמערכת (למשל: VIP, לקוח חוזר)',
          templates: ['general'] },

        { id: 'PRINT_HQ_ORDERRER_TAGS',
          lbl: 'תגיות לקוח רשתי',
          sub: 'תגיות לקוח מהמערכת הרשתית המרכזית',
          templates: ['general'] },

        { id: 'INCLUDE_ALCOHOL_WARNING',
          lbl: 'התראת אלכוהול',
          sub: 'מוסיף הודעה בתחתית אם ההזמנה מכילה משקאות אלכוהוליים',
          templates: ['general'] },
      ],

      'הסרת מידע': [
        { id: 'OMIT_BOTTOM_ORDERER_DETAILS',
          lbl: 'הסתר פרטי לקוח מהתחתית',
          sub: 'שם, טלפון וכתובת לא יוצגו בתחתית הבון',
          templates: ['general'] },
      ],

      'שם הבון בתחתית': [
        { id: 'ADD_BON_NAME_BOTTOM',
          lbl: 'שם תחנת ההכנה בתחתית',
          sub: 'מוסיף את שם הבון (תחנת ההכנה) בתחתית הדף',
          templates: ['allday'],
          children: ['BON_NAME_BOTTOM_HIGHLIGHT'] },

        { id: 'BON_NAME_BOTTOM_HIGHLIGHT',
          lbl: 'שם תחנת ההכנה בולט',
          sub: 'שם הבון יוצג גדול ובולט בתחתית — קל לזיהוי',
          templates: ['allday'],
          parentId: 'ADD_BON_NAME_BOTTOM' },
      ],

      'סיכום בתחתית הבון': [
        { id: '__SUMMARY_SECTION__',
          lbl: 'סיכום בתחתית הבון',
          sub: 'מוסיף אזור סיכום בתחתית הדף — בחר למטה מה לסכם',
          templates: ['general'],
          children: [
            'INCLUDE_BEVERAGE_SUMMARY',
            'INCLUDE_SAUCE_SUMMARY',
            'INCLUDE_SUMMARY_SECTION',
            'ENABLE_FORCE_AGGREGATED_ITEMS_SECTION',
            'FILTER_BON_SUMMARY_BY_MODIFER_GROUP_',
          ] },

        { id: 'INCLUDE_BEVERAGE_SUMMARY',
          lbl: 'סיכום משקאות',
          sub: 'מרכז את כל המשקאות בהזמנה בסיכום בתחתית',
          templates: ['general'],
          parentId: '__SUMMARY_SECTION__',
          children: ['ENLARGE_BEVERAGE_SUMMARY','HIDE_BEV_ITEMS_IF_BEVERAGE_SUMMARY'] },

        { id: 'ENLARGE_BEVERAGE_SUMMARY',
          lbl: 'שמות משקאות בגדול',
          sub: 'שמות המשקאות בסיכום יוצגו בגופן גדול',
          templates: ['general'],
          parentId: 'INCLUDE_BEVERAGE_SUMMARY' },

        { id: 'HIDE_BEV_ITEMS_IF_BEVERAGE_SUMMARY',
          lbl: 'הסתר משקאות מרשימת הפריטים',
          sub: 'המשקאות יופיעו רק בסיכום ולא ברשימה הרגילה',
          templates: ['general'],
          parentId: 'INCLUDE_BEVERAGE_SUMMARY' },

        { id: 'INCLUDE_SAUCE_SUMMARY',
          lbl: 'סיכום רטבים',
          sub: 'מרכז את כל הרטבים בהזמנה בסיכום בתחתית',
          templates: ['general'],
          parentId: '__SUMMARY_SECTION__',
          children: ['HIDE_SAUCE_ITEMS_IF_SAUCE_SUMMARY'] },

        { id: 'HIDE_SAUCE_ITEMS_IF_SAUCE_SUMMARY',
          lbl: 'הסתר רטבים מרשימת הפריטים',
          sub: 'הרטבים יופיעו רק בסיכום ולא ברשימה הרגילה',
          templates: ['general'],
          parentId: 'INCLUDE_SAUCE_SUMMARY' },

        { id: 'INCLUDE_SUMMARY_SECTION',
          lbl: 'סיכום משולב',
          sub: 'מרכז משקאות, רטבים ותוספות ביחד בסיכום אחד בתחתית',
          templates: ['general'],
          parentId: '__SUMMARY_SECTION__',
          children: ['HIDE_ITEMS_INCLUDED_IN_SUMMARY'] },

        { id: 'HIDE_ITEMS_INCLUDED_IN_SUMMARY',
          lbl: 'הסתר פריטים מהרשימה',
          sub: 'פריטים שמופיעים בסיכום לא יוצגו פעמיים ברשימה הרגילה',
          templates: ['general'],
          parentId: 'INCLUDE_SUMMARY_SECTION' },

        { id: 'ENABLE_FORCE_AGGREGATED_ITEMS_SECTION',
          lbl: 'סיכום מאוחד',
          sub: 'פריטים זהים בסיכום יוצגו כשורה אחת עם כמות — גם אם הבון מציג אותם נפרד',
          templates: ['general'],
          parentId: '__SUMMARY_SECTION__' },

        { id: 'FILTER_BON_SUMMARY_BY_MODIFER_GROUP_',
          lbl: 'הוסף קבוצת משנים לסיכום',
          sub: 'בחר קבוצת משנים שתרוכז ותוצג בסיכום בתחתית הבון',
          templates: ['general'],
          parentId: '__SUMMARY_SECTION__',
          type: 'multi', selectSrc: 'modifier_groups' },
      ],

      'גודל ומראה': [
        { id: 'BOLD_TD_DETAILS',
          lbl: 'TA / משלוח בולט בתחתית',
          sub: 'כותרת TA או משלוח תוצג בהיפוך צבעים בתחתית הבון',
          templates: ['general','allday','perdiner'],
          _dupKey: 'BOLD_TD_DETAILS_footer' },

        { id: 'EXTRA_FTR_FEED',
          lbl: 'רווח לפני חיתוך',
          sub: 'מוסיף שורות ריקות לפני חיתוך הנייר — לקיפול נוח יותר',
          templates: ['general','allday','peritem','perdiner'],
          type: 'numeric' },
      ],

      'לא ממומש': [
        { id: 'PRINT_OTHER_BONS',
          lbl: 'הדפס בכל תחנות ההכנה',
          sub: 'שולח את הבון לכל תחנות ההכנה הפעילות במקביל. שימושי לתחנות שצריכות תיאום מלא, כמו בחתונות או אירועים גדולים.',
          templates: ['allday'],
          noImpl: true },
      ],
    },
  },
};