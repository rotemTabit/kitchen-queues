import { BASE_PD } from '../data/bonConfig';

// ── constants ────────────────────────────────────────────
const SAUCE_CATEGORY_ID = '5c960db8-4a74-4521-8128-b16c5dceae0c';

const COURSE_ORDER = ['Beverages', 'Entrees', 'Mains', 'Desserts', 'Other'];
const COURSE_HE    = { Beverages: 'משקאות', Entrees: 'ראשונות', Mains: 'עיקריות', Desserts: 'קינוחים', Other: 'אחר' };

const DEMO = {
  TABLE_NO: '2001', ORDER_NO: '1234', NUMBER_OF_GUESTS: 2,
  FIRED_BY: 'ישראל ישראלי', ORDERER_NAME: 'ישראל ישראלי', ORDERER_TEL: '050-0000000',
  ORDERER_ADDRESS_STREET: 'שדרות ירושלים', ORDERER_ADDRESS_HOUSE: '1',
  ORDERER_ADDRESS_CITY: 'ירושלים', ORDERER_ADDRESS_FLOOR: '3',
  ORDERER_ADDRESS_APARTMENT: '14', ORDERER_ADDRESS_REMARKS: 'נא לא לצלצל',
  DELIVERY_ETA: '20:30', TO_BE_SUPPLIED_ON: '20:30',
  SUPPLY_DATE: '31/12/2026', SUPPLY_TIME: '20:00',
  EXTERNAL_SOURCE: 'Wolt - 123',
  ORDER_TAG: 'אלרגיה לאגוזים',
  ORDERER_TAG: 'לקוח VIP',
};

// ── helpers ──────────────────────────────────────────────
const isWO      = id => String(id).startsWith('WO_');
const stripLelo = name => (name || '').replace(/^ללא\s+/u, '').trim();

function renderChoices(push, iid, item, choices, gp, filterGroups = []) {
  const ignoreAll  = gp('IGNORE_ALL_MODIFIERS');
  const inclDef    = gp('INCLUDE_DEFAULT_MODIFIERS');
  const modXL      = gp('MODIFIER_XL');
  const englishTxt = gp('ENGLISH_TEXT');
  const useNoWord  = gp('USE_REMOVE_AS_NO');
  const hasFilter  = Array.isArray(filterGroups) && filterGroups.length > 0;
  const useModPrint = gp('USE_MODIFIER_PRINT_NAME');

  const woPrefix  = useNoWord ? 'No ' : (englishTxt ? 'No ' : 'בלי ');
  const addPrefix = englishTxt ? '+ ' : '+ ';

  const groups = item.groups || [];
  groups.forEach((g, gi) => {
    if (hasFilter && !filterGroups.includes(g.name)) return;
    const sel = choices[g.id] || [];

    if (g.type === 'mgss') {
      if (ignoreAll) return;
      const defMember = g.members.find(m => !isWO(m.id)) || g.members[0];
      const chosen    = sel[0] ? g.members.find(m => m.id === sel[0]) : null;
      const isDefault = !chosen || (defMember && chosen.id === defMember.id);

      const val = chosen ? chosen.name : (defMember ? defMember.name : null);
      if (!val) return;

      const isShort   = val.replace(/\s/g, '').length <= 2;
      const showEnlrg = isShort && gp('ENLARGE_COOKING_LEVEL');

      if (!isDefault) {
        push({ id: `${iid}_mg${gi}`, text: `   =${val}=`, align: 'right',
               bold: !!showEnlrg, dbl: !!showEnlrg });
      } else if (inclDef) {
        push({ id: `${iid}_mgd${gi}`, text: `   ${val}`, align: 'right',
               bold: !!showEnlrg, dbl: !!showEnlrg });
      }
    } else if (g.type === 'mgms') {
      if (ignoreAll) return;
      g.members.filter(m => isWO(m.id) && !sel.includes(m.id)).forEach((m, mi) => {
        const name = stripLelo(m.name);
        push({ id: `${iid}_wo${gi}_${mi}`, text: `   ${woPrefix}${name}`,
               align: 'right', bold: false, dbl: !!modXL });
      });
      if (inclDef) {
        g.members.filter(m => isWO(m.id) && sel.includes(m.id)).forEach((m, mi) => {
          push({ id: `${iid}_wod${gi}_${mi}`, text: `   ${stripLelo(m.name)}`,
                 align: 'right', bold: false, dbl: !!modXL });
        });
      }
      sel.filter(id => !isWO(id)).map(id => g.members.find(m => m.id === id)).filter(Boolean).forEach((m, mi) => {
        const price = m.price > 0 ? ` (+${m.price}₪)` : '';
        push({ id: `${iid}_add${gi}_${mi}`, text: `   ${addPrefix}${m.name}${price}`,
               align: 'right', bold: false, dbl: !!modXL });
      });
    } else if (g.type === 'ig') {
      if (ignoreAll) return;
      sel.forEach((id, mi) => {
        const m = g.members.find(m => m.id === id);
        if (!m) return;
        const price = m.price > 0 ? ` (+${m.price}₪)` : '';
        push({ id: `${iid}_ig${gi}_${mi}`, text: `   ${addPrefix}${m.name}${price}`,
               align: 'right', bold: false, dbl: !!modXL });
      });
    }
  });
}

function sortByCourse(items) {
  return [...items].sort((a, b) => {
    const ac = a.item?.course || null;
    const bc = b.item?.course || null;
    const ai = ac ? COURSE_ORDER.indexOf(ac) : 99;
    const bi = bc ? COURSE_ORDER.indexOf(bc) : 99;
    return (ai === -1 ? 98 : ai) - (bi === -1 ? 98 : bi);
  });
}

function filterByCourse(items, gp) {
  const filters = {
    Beverages: gp('INCLUDE_COURSE_BEVERAGES'),
    Entrees:   gp('INCLUDE_COURSE_ENTREES'),
    Mains:     gp('INCLUDE_COURSE_MAINS'),
    Desserts:  gp('INCLUDE_COURSE_DESSERTS'),
  };
  const anyActive = Object.values(filters).some(Boolean);
  if (!anyActive) return items;
  return items.filter(pi => filters[pi.item?.course]);
}

// ── main export ──────────────────────────────────────────
export function buildElements({ params, bonName, orderType, orderServiceType, previewItems, template }) {
  const els  = [];
  let eid    = 0;
  let _zone = 'header';
  const push = p => els.push({ id: p.id || ('e' + (eid++)), zone: _zone, ...p });
  const setZone = z => { _zone = z; };
  const gp   = id => params?.[id] ? 1 : 0;
  const gpN  = id => parseInt(params?.[id]) || 0;

  const OT  = orderType  || 'SEATED';
  const OST = orderServiceType || 'SEATED';
  const svcType = OT === 'OTC' ? OST : OT;

  const now     = new Date();
  const hm      = `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;
  const dateStr = now.toLocaleDateString('he-IL');

  const isTD     = svcType === 'TA' || svcType === 'DELIVERY';
  const isOtcSat = OT === 'OTC' && OST === 'SEATED';

  let items = filterByCourse(previewItems, gp);
  items     = sortByCourse(items);

  const pushFeed = (n, pfx, loc) => {
    for (let i = 0; i < n; i++)
      push({ id: `${pfx}_feed_${loc}_${i}`, text: '', align: 'center' });
  };
  
  const pushOrderType = (pfx) => {
    
    if (svcType === 'SEATED') return;
    const bold = !!gp('BOLD_TD_DETAILS') || !!gp('HIGHLIGHT_ORDER_TYPE');
    if (svcType === 'TA') {
      if (bold) {
        push({ id: `${pfx}ta1`, text: '                     ', align: 'center', dbl: true, rev: true });
        push({ id: `${pfx}ta2`, text: `     TA לקחת ${DEMO.ORDER_NO}     `, align: 'center', bold: true, dbl: true, rev: true });
        push({ id: `${pfx}ta3`, text: '                     ', align: 'center', dbl: true, rev: true });
      } else {
        push({ id: `${pfx}ta1`, text: '#######################', align: 'center', bold: true, dbl: true });
        push({ id: `${pfx}ta2`, text: `###  לקחת  ${DEMO.ORDER_NO}  TA  ###`, align: 'center', bold: true, dbl: true });
        push({ id: `${pfx}ta3`, text: '#######################', align: 'center', bold: true, dbl: true });
      }
    } else if (svcType === 'DELIVERY') {
      if (bold) {
        push({ id: `${pfx}dl1`, text: '                     ', align: 'center', dbl: true, rev: true });
        push({ id: `${pfx}dl2`, text: `  משלוח ${DEMO.ORDER_NO}  `, align: 'center', bold: true, dbl: true, rev: true });
        push({ id: `${pfx}dl3`, text: '                     ', align: 'center', dbl: true, rev: true });
      } else {
        push({ id: `${pfx}dl1`, text: '#######################', align: 'center', bold: true, dbl: true });
        push({ id: `${pfx}dl2`, text: `### משלוח ${DEMO.ORDER_NO} DLVRY ###`, align: 'center', bold: true, dbl: true });
        push({ id: `${pfx}dl3`, text: '#######################', align: 'center', bold: true, dbl: true });
      }
    }
    if (OT === 'OTC' && !gp('OMIT_OTC_TYPE')) {
      const lbl = OST === 'SEATED' ? 'לשבת OTC' : OST === 'TA' ? 'לקחת OTC' : 'משלוח OTC';
      push({ id: `${pfx}otc`, text: lbl, align: 'center', bold: true, dbl: true });
    }
  };

  const pushHeader = (pfx = '') => {
    setZone('header');
    const hFeed = gpN('EXTRA_HDR_FEED');
    if (hFeed) pushFeed(hFeed, pfx, 'hdr');

    if (gp('REPRINT')) {
      push({ id: `${pfx}rp1`, text: '=====================', align: 'center', bold: true, dbl: true });
      push({ id: `${pfx}rp2`, text: 'ש ח ז ו ר',           align: 'center', bold: true, dbl: true });
      push({ id: `${pfx}rp3`, text: '=====================', align: 'center', bold: true, dbl: true });
      push({ id: `${pfx}rps`, sep: true });
    }

    const bigName = gp('ENLARGE_BON_NAME');
    push({ id: `${pfx}bon`, text: bonName || 'שם הבון', align: 'center', bold: !!bigName, dbl: !!bigName });

    if (gp('HEADER_TABLE_NUMBER')) {
      if (svcType === 'SEATED')
        push({ id: `${pfx}htn`, text: `שולחן ${DEMO.TABLE_NO}`, align: 'center', bold: true, dbl: true });
      else if (svcType === 'TA')
        push({ id: `${pfx}htn`, text: '*** TA לקחת ***', align: 'center', bold: true, dbl: true });
      else if (svcType === 'DELIVERY')
        push({ id: `${pfx}htn`, text: '*** משלוח ***', align: 'center', bold: true, dbl: true });
    }

    pushOrderType(pfx);

    if (svcType === 'SEATED' && !gp('HEADER_TABLE_NUMBER'))
      push({ id: `${pfx}tbl`, text: `שולחן ${DEMO.TABLE_NO}`, align: 'center', bold: false, dbl: true });

    if (isOtcSat && gp('TA_OTC_ORDERER_ADDRESS_REMARKS'))
      push({ id: `${pfx}otcsat`, text: 'שולחן 1', align: 'center', bold: true });

    if (gp('PRINT_DELAYED_SUPPLY_DATETIME')) {
      push({ id: `${pfx}sup_date`, text: DEMO.SUPPLY_DATE, align: 'center', bold: true, dbl: true });
      push({ id: `${pfx}sup_time`, text: `אספקה לשעה ${DEMO.SUPPLY_TIME}`, align: 'center', bold: true, dbl: true });
    }

    if (gp('PRINT_SUPPLY_TIME') && isTD)
      push({ id: `${pfx}supply`, text: `   דחוי ל ${DEMO.TO_BE_SUPPLIED_ON}   `, align: 'center', bold: false, dbl: true, rev: true });

    if (gp('SUPPLIED_TIME_ON_TOP') && isTD)
      push({ id: `${pfx}supplied`, text: `אספקה לשעה ${DEMO.TO_BE_SUPPLIED_ON}`, align: 'center', bold: false, dbl: true });

    if (gp('PRINT_DETAILED_DELIVERY_ETA') && isTD) {
      push({ id: `${pfx}deta1`, text: `| ${hm} |`,                align: 'center', bold: true, dbl: false });
      push({ id: `${pfx}deta2`, text: `| ${DEMO.DELIVERY_ETA} |`, align: 'center', bold: true, dbl: true });
    }

    if (gp('PRINT_DELIVERY_ETA') && svcType === 'DELIVERY') {
      push({ id: `${pfx}eta1`, text: '                    ', align: 'center', dbl: false, rev: true });
      push({ id: `${pfx}eta2`, text: `שעת אספקה ${DEMO.DELIVERY_ETA}`, align: 'center', bold: true, dbl: true });
      push({ id: `${pfx}eta3`, text: '                    ', align: 'center', dbl: false, rev: true });
    }

    if (svcType !== 'SEATED') {
      push({ id: `${pfx}ordno`, text: `הזמנה ${DEMO.ORDER_NO}`, align: 'center', bold: false });
      if (!gp('OMIT_CUSTOMER_DETAILS')) {
        const bigName2  = gp('DINER_FULL_NAME');
        const enlargeOD = gp('ENLARGE_ORDERER_DETAILS');
        push({ id: `${pfx}cust`, text: DEMO.ORDERER_NAME, align: 'center', bold: true, dbl: !!bigName2 || !!enlargeOD });
        if (!gp('OMIT_ORDERRER_TEL'))
          push({ id: `${pfx}tel`, text: DEMO.ORDERER_TEL, align: 'center', bold: true, dbl: !!enlargeOD });
      }
      if (gp('ORDERER_ADDRESS_ON_HEADER') && svcType === 'DELIVERY') {
        push({ id: `${pfx}addr1`, text: `${DEMO.ORDERER_ADDRESS_STREET} ${DEMO.ORDERER_ADDRESS_HOUSE}, ${DEMO.ORDERER_ADDRESS_CITY}`, align: 'center' });
        push({ id: `${pfx}addr2`, text: `קומה: ${DEMO.ORDERER_ADDRESS_FLOOR}  דירה: ${DEMO.ORDERER_ADDRESS_APARTMENT}`, align: 'center' });
      }
    }

    if (!gp('OMIT_ORDER_TAGS')) {
      push({ id: `${pfx}otag1`, text: '+++++++++++++++++++++++', align: 'center', bold: false });
      const bigTag = gp('ENLARGE_ORDER_TAGS');
      push({ id: `${pfx}otag2`, text: ` ${DEMO.ORDER_TAG}`, align: 'center', bold: true, dbl: !!bigTag });
      push({ id: `${pfx}otag3`, text: '+++++++++++++++++++++++', align: 'center', bold: false });
    }

    const timeBig = gp('TIME_DBL_HIGHT');
    push({ id: `${pfx}info`, text: `סועדים: ${DEMO.NUMBER_OF_GUESTS}       ${hm}`, align: 'center', bold: !!timeBig, dbl: !!timeBig });
    push({ id: `${pfx}date`, text: `${dateStr}  -  ${DEMO.FIRED_BY}  -  הזמנה ${DEMO.ORDER_NO}`, align: 'center', bold: false });

    // ── hdr_s נדחף כבר תחת zone='items' כדי שלחיצה עליו תפתח items ──
    setZone('items');
    push({ id: `${pfx}hdr_s`, sep: true, solid: true });
  };

  const pushFooter = (pfx = '') => {
    setZone('footer');
    if (gp('INCLUDE_BEVERAGE_SUMMARY') && template === 'general') {
      const bevs = items.filter(pi => pi.item?.course === 'Beverages');
      if (bevs.length) {
        push({ id: `${pfx}bsv_hdr`, text: 'סיכום שתייה:', align: 'right', bold: true });
        const bigBev = gp('ENLARGE_BEVERAGE_SUMMARY');
        bevs.forEach((pi, i) =>
          push({ id: `${pfx}bsv_${i}`, text: `    ${pi.qty}  ${pi.item.name}`, align: 'right', bold: !!bigBev, dbl: !!bigBev })
        );
        push({ id: `${pfx}bsv_s`, sep: true, thin: true });
      }
    }

    if (gp('INCLUDE_SAUCE_SUMMARY') && template === 'general') {
      const sauces = items.filter(pi => pi.item?.category_id === SAUCE_CATEGORY_ID);
      if (sauces.length) {
        push({ id: `${pfx}ssv_hdr`, text: 'סיכום רטבים:', align: 'right', bold: true });
        sauces.forEach((pi, i) =>
          push({ id: `${pfx}ssv_${i}`, text: `    ${pi.qty}  ${pi.item.name}`, align: 'right', bold: false })
        );
        push({ id: `${pfx}ssv_s`, sep: true, thin: true });
      }
    }

    if (gp('INCLUDE_SUMMARY_SECTION') && template === 'general') {
      const sumItems = items.filter(pi =>
        pi.item?.course === 'Beverages' ||
        pi.item?.category_id === SAUCE_CATEGORY_ID ||
        pi.item?.course === 'Entrees'
      );
      if (sumItems.length) {
        push({ id: `${pfx}sum_hdr`, text: 'סיכום:', align: 'right', bold: true });
        const agg = gp('ENABLE_FORCE_AGGREGATED_ITEMS_SECTION');
        const merged = []; const seen = new Map();
        sumItems.forEach(pi => {
          const key = pi.item.id;
          if (agg && seen.has(key)) merged[seen.get(key)].qty += pi.qty || 1;
          else { seen.set(key, merged.length); merged.push({ ...pi, qty: pi.qty || 1 }); }
        });
        merged.forEach((pi, i) =>
          push({ id: `${pfx}sum_${i}`, text: `    ${pi.qty}  ${pi.item.name}`, align: 'right', bold: false })
        );
        push({ id: `${pfx}sum_s`, sep: true, thin: true });
      }
    }

    if (gp('INCLUDE_ALCOHOL_WARNING'))
      push({ id: `${pfx}alc`, text: 'קיימים פריטים אלכוהוליים בהזמנה', align: 'center', bold: true });

    if (gp('NOTIFY_ON_ALL_OTHER_BONS') && template === 'general') {
      push({ id: `${pfx}ob_hdr`, text: 'ביחד עם', align: 'right', bold: true });
      push({ id: `${pfx}ob_1`,   text: ' + תחנת עבודה 1', align: 'right', bold: false });
      push({ id: `${pfx}ob_2`,   text: ' + תחנת עבודה 2', align: 'right', bold: false });
      push({ id: `${pfx}ob_s`,   sep: true, thin: true });
    }

    if (gp('PRINT_ORDER_SOURCE') || gp('ADD_ORDER_EXTERNAL_SOURCE_NAME')) {
      const srcName = gp('ADD_ORDER_EXTERNAL_SOURCE_NAME') ? DEMO.EXTERNAL_SOURCE : 'External';
      if (svcType === 'TA' || svcType === 'DELIVERY') {
        push({ id: `${pfx}src1`, text: '                    ', align: 'center', dbl: true, rev: true });
        push({ id: `${pfx}src2`, text: `  ${DEMO.ORDER_NO}  ${srcName}  `, align: 'center', bold: true, dbl: true, rev: true });
        push({ id: `${pfx}src3`, text: '                    ', align: 'center', dbl: true, rev: true });
      } else {
        push({ id: `${pfx}src1`, text: '                    ', align: 'center', dbl: true, rev: true });
        push({ id: `${pfx}src2`, text: srcName === 'External' ? 'External' : 'ONLINE', align: 'center', bold: true, dbl: true, rev: true });
        push({ id: `${pfx}src3`, text: '                    ', align: 'center', dbl: true, rev: true });
      }
    }

    if (svcType === 'SEATED')
      push({ id: `${pfx}ft_tbl`, text: `שולחן ${DEMO.TABLE_NO}`, align: 'center', bold: false, dbl: true });
    else if (svcType === 'TA') {
      push({ id: `${pfx}ft_ta1`, text: `###  לקחת  ${DEMO.ORDER_NO}  TA  ###`, align: 'center', bold: true, dbl: true });
      push({ id: `${pfx}ft_ta2`, text: '#######################', align: 'center', bold: true, dbl: true });
    } else if (svcType === 'DELIVERY') {
      push({ id: `${pfx}ft_dl1`, text: `### משלוח ${DEMO.ORDER_NO} DLVRY ###`, align: 'center', bold: true, dbl: true });
      push({ id: `${pfx}ft_dl2`, text: '#######################', align: 'center', bold: true, dbl: true });
    }

    if (svcType !== 'SEATED' && !gp('OMIT_CUSTOMER_DETAILS') && !gp('OMIT_BOTTOM_ORDERER_DETAILS')) {
      push({ id: `${pfx}ft_cust`, text: DEMO.ORDERER_NAME, align: 'center', bold: true });
      if (!gp('OMIT_ORDERRER_TEL'))
        push({ id: `${pfx}ft_tel`, text: DEMO.ORDERER_TEL, align: 'center', bold: false });
    }

    if (gp('ORDERER_ADDRESS_ON_FOOTER') && svcType === 'DELIVERY' && !gp('OMIT_BOTTOM_ORDERER_DETAILS')) {
      push({ id: `${pfx}ftaddr1`, text: `${DEMO.ORDERER_ADDRESS_STREET} ${DEMO.ORDERER_ADDRESS_HOUSE}, ${DEMO.ORDERER_ADDRESS_CITY}`, align: 'center' });
      push({ id: `${pfx}ftaddr2`, text: `קומה: ${DEMO.ORDERER_ADDRESS_FLOOR}  דירה: ${DEMO.ORDERER_ADDRESS_APARTMENT}`, align: 'center' });
      push({ id: `${pfx}ftaddr3`, text: `הערות: ${DEMO.ORDERER_ADDRESS_REMARKS}`, align: 'center' });
    }

    if (gp('ORDERER_STREET_ON_FOOTER') && svcType === 'DELIVERY' && !gp('OMIT_BOTTOM_ORDERER_DETAILS') && !gp('ORDERER_ADDRESS_ON_FOOTER'))
      push({ id: `${pfx}ft_street`, text: `${DEMO.ORDERER_ADDRESS_STREET} ${DEMO.ORDERER_ADDRESS_HOUSE}`, align: 'center', bold: false });

    if (gp('ADD_ORDERER_REGION_NAME') && svcType === 'DELIVERY')
      push({ id: `${pfx}ft_region`, text: DEMO.ORDERER_ADDRESS_CITY, align: 'center', bold: false });

    if (gp('PRINT_ORDERRER_TAGS') || gp('PRINT_HQ_ORDERRER_TAGS'))
      push({ id: `${pfx}ft_vtag`, text: DEMO.ORDERER_TAG, align: 'center', bold: true });

    if (gp('ADD_SERVER_NAME'))
      push({ id: `${pfx}ft_srv`, text: DEMO.FIRED_BY, align: 'center', bold: false });

    if (gp('ADD_TIME'))
      push({ id: `${pfx}ft_time`, text: hm, align: 'center', bold: false });

    if (gp('ADD_BON_NAME_BOTTOM') && template === 'allday') {
      if (gp('BON_NAME_BOTTOM_HIGHLIGHT')) {
        push({ id: `${pfx}bname_hl1`, text: ` ${bonName || 'שם הבון'} `, align: 'center', bold: true, dbl: true, rev: true });
        push({ id: `${pfx}bname_hl2`, text: '                     ',       align: 'center', dbl: true, rev: true });
      } else {
        push({ id: `${pfx}bname`, text: bonName || 'שם הבון', align: 'center', bold: false });
      }
    }

    const fFeed = gpN('EXTRA_FTR_FEED');
    if (fFeed) pushFeed(fFeed, pfx, 'ftr');
  };

  const pushItem = (pi, iid, opts = {}) => {
    const { item, qty, choices = {} } = pi;
    const { bold = true, dbl = true, dinerNo = null, courseTag = false } = opts;

    if (courseTag)
      push({ id: `${iid}_ctag`, text: '*** דחוף ***', align: 'center', bold: true, dbl: true });

    if (gp('PRINT_ITEM_GROUP_NAME_') && item.groups?.some(g => g.type === 'ig')) {
      const igGroup = item.groups.find(g => g.type === 'ig');
      if (igGroup)
        push({ id: `${iid}_grpname`, text: ` ${igGroup.name} `, align: 'center', bold: true, dbl: false, rev: true });
    }

    let displayName = item.name;
    if (item.kitchen_name && !gp('IGNORE_ITEM_PRINT_NAME'))
      displayName = item.kitchen_name;
    if (gp('REPLACE_OFFER_NAME_FOR_LEAD_ITEMS') && item.offer_name)
      displayName = item.offer_name;

    if (gp('ADD_OFFER_NAME') && item.offer_name && !gp('REPLACE_OFFER_NAME_FOR_LEAD_ITEMS'))
      push({ id: `${iid}_offer`, text: item.offer_name, align: 'right', bold: false, dbl: false });

    const singleH = gp('ITEM_NAME_SINGLE_HIGHT');
    const isMain  = item.course === 'Mains' && gp('LARGE_MAIN_DISH');
    const itemDbl = isMain ? true : (singleH ? false : dbl);
    const itemBld = isMain ? true : bold;

    const qtyStr = String(qty).padStart(2, ' ');
    push({ id: `${iid}_item`, text: `${qtyStr}  ${displayName}`, align: 'right', bold: itemBld, dbl: itemDbl });

    renderChoices(push, iid, item, choices, gp, Array.isArray(params?.FILTER_OFFER_MODIFIERS_BY_MODIFER_GROUP_) ? params.FILTER_OFFER_MODIFIERS_BY_MODIFER_GROUP_ : []);

    if (gp('ADD_LONG_NAME_BELOW_ITEM') && item.long_name)
      push({ id: `${iid}_longname`, text: item.long_name, align: 'right', bold: false, dbl: false });

    if (gp('ADD_DINER_NUMBERS') && dinerNo != null)
      push({ id: `${iid}_dno`, text: `      כסא ${dinerNo}`, align: 'right', bold: false, dbl: false });

    if (gp('ADD_L_DINER_NUMBERS') && dinerNo != null)
      push({ id: `${iid}_ldno`, text: `      כסא ${dinerNo}`, align: 'right', bold: true, dbl: true });

    if (gp('SIMPLE_ITEM_REMARKS'))
      push({ id: `${iid}_rmk`, text: 'ללא מלח', align: 'right', bold: false, dbl: false });
  };

  const pushCourseHeader = (course, pfx) => {
    if (!gp('NO_COURSE_NAME') && course !== '__none__')
      push({ id: `${pfx}_ch`, text: COURSE_HE[course] || course, align: 'center', bold: true, underline: true });
  };

  const groupByCourse = (itemsList) => {
    const map = {};
    itemsList.forEach(pi => {
      const c = pi.item?.course || '__none__';
      if (!map[c]) map[c] = [];
      map[c].push(pi);
    });
    const ordered = [...COURSE_ORDER, '__none__'];
    return ordered.filter(c => map[c]).map(c => ({ course: c, items: map[c] }));
  };

  // ════════════════════════════════════════════════════
  // ── PERDINER ────────────────────────────────────────
  // ════════════════════════════════════════════════════
  if (template === 'perdiner') {
    pushHeader('');
    setZone('items');
    if (!items.length) { setZone('footer'); push({ id: 'main_s', sep: true, solid: true }); pushFooter(''); return els; }

    const numPlates = items.length <= 4 ? 2 : 3;
    const perPlate  = Math.ceil(items.length / numPlates);
    const plates    = Array.from({ length: numPlates }, (_, i) =>
      items.slice(i * perPlate, (i + 1) * perPlate)
    ).filter(p => p.length > 0);

    plates.forEach((plate, pi) => {
      const pfx = `pd${pi}_`;
      push({ id: `${pfx}plate`, text: `צלחת ${pi + 1}`, align: 'center', bold: true, dbl: true });
      push({ id: `${pfx}sep1`,  sep: true, thin: true });
      plate.forEach((item_pi, ii) => {
        pushItem(item_pi, `pd${pi}_${ii}`, { bold: false, dbl: !gp('PRINT_CONDENSE_FORMAT'), dinerNo: pi + 1 });
      });
      push({ id: `${pfx}sep2`, sep: true, thin: true });
    });

    push({ id: 'items_s', sep: true, solid: true });
    setZone('footer');
    pushFooter('');
    return els;
  }

  // ════════════════════════════════════════════════════
  // ── PERITEM ─────────────────────────────────────────
  // ════════════════════════════════════════════════════
  if (template === 'peritem') {
    if (!items.length) {
      pushHeader('pi0_');
      push({ id: 'pi0_item', text: ' 1  פריט לדוגמה', align: 'right', bold: true, dbl: true });
      push({ id: 'pi0_sep',  sep: true, solid: true });
      pushFooter('pi0_');
      return els;
    }

    items.forEach((pi, pii) => {
      const pfx = `pi${pii}_`;
      if (pii > 0) push({ id: `${pfx}break`, sep: true });
      push({ id: `${pfx}line1`, sep: true, solid: false });
      push({ id: `${pfx}bon`,   text: bonName || 'שם הבון', align: 'center', bold: false });
      if (svcType === 'SEATED')
        push({ id: `${pfx}tbl`, text: `שולחן ${DEMO.TABLE_NO}`, align: 'center', bold: true, dbl: true });
      else if (svcType === 'TA')
        push({ id: `${pfx}ta`,  text: 'T/A', align: 'center', bold: true, dbl: true });
      else if (svcType === 'DELIVERY')
        push({ id: `${pfx}dl`,  text: 'משלוח', align: 'center', bold: true, dbl: true });
      push({ id: `${pfx}info`, text: `מס' הזמנה ${DEMO.ORDER_NO}    ${DEMO.FIRED_BY}    סועדים:${DEMO.NUMBER_OF_GUESTS}`, align: 'center', bold: false });
      push({ id: `${pfx}line2`, sep: true, solid: false });
      pushItem(pi, pfx, { bold: true, dbl: true, dinerNo: pii + 1 });
      push({ id: `${pfx}line3`, sep: true, solid: false });
      if (svcType === 'SEATED')
        push({ id: `${pfx}ft_tbl`, text: `שולחן ${DEMO.TABLE_NO}`, align: 'right', bold: true });
      else if (svcType === 'TA')
        push({ id: `${pfx}ft_ta`,  text: `${DEMO.ORDER_NO} TA`, align: 'right', bold: true });
      else if (svcType === 'DELIVERY')
        push({ id: `${pfx}ft_dl`,  text: `משלוח ${DEMO.ORDER_NO}`, align: 'right', bold: true });
      push({ id: `${pfx}ft_time`, text: hm, align: 'right', bold: true });
    });

    return els;
  }

  // ════════════════════════════════════════════════════
  // ── ALLDAY ──────────────────────────────────────────
  // ════════════════════════════════════════════════════
  if (template === 'allday') {
    pushHeader('');
    setZone('items');
    if (!items.length) { setZone('footer'); push({ id: 'main_s', sep: true, solid: true }); pushFooter(''); return els; }

    const merged = [];
    const seen   = new Map();
    items.forEach(pi => {
      const key = pi.item.id + JSON.stringify(pi.choices || {});
      if (seen.has(key)) merged[seen.get(key)].qty += pi.qty || 1;
      else { seen.set(key, merged.length); merged.push({ ...pi, qty: pi.qty || 1 }); }
    });

    const courseGroups = groupByCourse(merged);
    courseGroups.forEach(({ course, items: cItems }) => {
      pushCourseHeader(course, `ad_${course}`);
      cItems.forEach((pi, pii) => {
        const iid = `ad_${course}_${pii}`;
        push({ id: `${iid}_sep`, sep: true, thin: true });
        const nameCol = pi.item.name.padEnd(20, ' ').slice(0, 20);
        const qtyCol  = String(pi.qty).padStart(2, ' ');
        const lineText = `${nameCol} ${qtyCol}`;
        push({ id: `${iid}_item`, text: lineText, align: 'right', bold: true, dbl: true });
        if (!gp('OMIT_DINER_NAME'))
          push({ id: `${iid}_dname`, text: '   ישראל ישראלי', align: 'right', bold: false });
      });
    });

    push({ id: 'items_s', sep: true, solid: true });
    setZone('footer');
    pushFooter('');
    return els;
  }

  // ════════════════════════════════════════════════════
  // ── GENERAL (default) ───────────────────────────────
  // ════════════════════════════════════════════════════
  if (gp('SEPARATE_BON_4_EVERY_COURSE') && items.length > 0) {
    const courseGroups = groupByCourse(items);
    courseGroups.forEach(({ course, items: cItems }, ci) => {
      if (ci > 0) push({ id: `sep_course_${ci}`, sep: true });
      pushHeader(`c${ci}_`);
      setZone('items');
      pushCourseHeader(course, `c${ci}`);
      const perDiner2 = Math.ceil(cItems.length / DEMO.NUMBER_OF_GUESTS);
      cItems.forEach((pi, pii) => {
        const iid2 = `c${ci}_${pii}`;
        const dinerNo2 = Math.floor(pii / perDiner2) + 1;
        if (gp('DINER_HEADER') && pii % perDiner2 === 0)
          push({ id: `${iid2}_dhdr`, text: `סועד ${dinerNo2}`, align: 'center', bold: true, dbl: true });
        pushItem(pi, iid2, { bold: true, dbl: true, dinerNo: dinerNo2 });
        if (!gp('SHORT_TICKET')) push({ id: `${iid2}_sep`, sep: true, thin: true });
      });
      push({ id: `c${ci}_items_s`, sep: true, solid: true });
      setZone('footer');
      pushFooter(`c${ci}_`);
    });
    return els;
  }

  pushHeader('');
  // setZone('items') כבר נקרא בתוך pushHeader לפני hdr_s

  if (items.length > 0) {
    const dinersTotal = DEMO.NUMBER_OF_GUESTS;
    const perDiner    = Math.ceil(items.length / dinersTotal);

    const hideBev    = gp('HIDE_BEV_ITEMS_IF_BEVERAGE_SUMMARY') && gp('INCLUDE_BEVERAGE_SUMMARY');
    const hideSauce  = gp('HIDE_SAUCE_ITEMS_IF_SAUCE_SUMMARY')  && gp('INCLUDE_SAUCE_SUMMARY');
    const hideInSum  = gp('HIDE_ITEMS_INCLUDED_IN_SUMMARY')     && gp('INCLUDE_SUMMARY_SECTION');

    const visibleItems = items.filter(pi => {
      if (hideBev   && pi.item?.course === 'Beverages') return false;
      if (hideSauce && pi.item?.category_id === SAUCE_CATEGORY_ID) return false;
      if (hideInSum && (pi.item?.course === 'Beverages' || pi.item?.category_id === SAUCE_CATEGORY_ID || pi.item?.course === 'Entrees')) return false;
      return true;
    });

    const courseGroups = groupByCourse(visibleItems);
    courseGroups.forEach(({ course, items: cItems }) => {
      pushCourseHeader(course, `g_${course}`);
      cItems.forEach((pi, pii) => {
        const iid         = `g_${course}_${pii}`;
        const dinerNo     = Math.floor(pii / perDiner) + 1;
        const isFirst     = pii % perDiner === 0;
        const hasCourseTag = gp('COURSE_TAGS_BEFORE_ITEMS') && pii < 2;

        const isExternal = params?.ORDER_SOURCE === 'external';
        const omitRemarks = gp('OMIT_ITEM_REMARKS_4_EXTERNAL_ORDER') && isTD && isExternal;

        if (gp('DINER_HEADER') && isFirst)
          push({ id: `${iid}_dhdr`, text: `סועד ${dinerNo}`, align: 'center', bold: true, dbl: true });

        pushItem(pi, iid, { bold: true, dbl: true, dinerNo, courseTag: hasCourseTag, omitRemarks });

        if (gp('DIFF_LEAD_VS_NONLEAD_ITEM') && pi.item.addon_items?.length)
          pi.item.addon_items.forEach((addon, ai) =>
            push({ id: `${iid}_addon_${ai}`, text: `      ${addon.name}`, align: 'right', bold: true, dbl: false })
          );

        if (!gp('SHORT_TICKET'))
          push({ id: `${iid}_sep`, sep: true, thin: true });
      });
    });

    push({ id: 'items_s', sep: true, solid: true });
  } else {
    push({ id: 'main_s', sep: true, solid: true });
  }

  setZone('footer');
  pushFooter('');
  return els;
}