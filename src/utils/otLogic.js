import { SOURCE_OT_MAP, OT_BUTTONS } from '../data/bonConfig';

export function getAllowedOTs(orderTypes, sources) {
  let allowed = new Set();

  if (orderTypes.length > 0) {
    orderTypes.forEach(v => {
      if (v === 'SEATED')     allowed.add('SEATED');
      else if (v === 'TA')        allowed.add('TA');
      else if (v === 'DELIVERY')  allowed.add('DELIVERY');
      else if (v === 'OTC')     { allowed.add('OTC_SEATED'); allowed.add('OTC_TA'); }
      else if (v === 'OTC_SEATED') allowed.add('OTC_SEATED');
      else if (v === 'OTC_TA')     allowed.add('OTC_TA');
    });
  }

  if (sources.length > 0) {
    const fromSrc = new Set();
    sources.forEach(src => (SOURCE_OT_MAP[src] || []).forEach(ot => fromSrc.add(ot)));
    if (allowed.size > 0) {
      allowed = new Set([...allowed].filter(x => fromSrc.has(x)));
    } else {
      allowed = fromSrc;
    }
  }

  if (allowed.size === 0) OT_BUTTONS.forEach(b => allowed.add(b.ot));
  return allowed;
}