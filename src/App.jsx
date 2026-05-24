import { useState, useRef, useMemo, useEffect, useCallback } from "react";
import { Save, RotateCcw, Copy, Trash2, ReceiptText } from "lucide-react";
import SettingsPanel from "./components/settingsPanel";
import ItemPicker from "./components/ItemPicker";
import BonElement from "./components/BonElement";
import ZoneButtons from "./components/ZoneButtons";
import CtxPanel from "./components/CtxPanel";
import FloatingToolbar from "./components/FloatingToolbar";
import OtBar from "./components/OtBar";
import { useMenu, useMenuWithGroups } from "./hooks/useSupabase";
import { buildElements } from "./utils/buildElements";

// ══════════════════════════════════════════════════════════
// STYLES
// ══════════════════════════════════════════════════════════
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Assistant:wght@300;400;500;600;700&display=swap');
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
:root{
  --bd:#0B4440;--bm:#0F5853;--ba:#73DED7;
  --bg:#F0FAF5;--bgpreview:#0F5853;
  --text:#1a2332;--sub:#5a6a7a;
  --bdr:rgba(0,0,0,0.09);--bdr2:rgba(11,68,64,0.25);
  --mono:'Courier New',Courier,monospace;
  --sans:'Assistant',-apple-system,sans-serif;
}
html,body{height:100%; width:100%; overflow:hidden}#root{height:100%;width:100%}
body{font-family:var(--sans);background:#fff;color:var(--text)}
.app{display:flex;height:100vh;overflow:hidden}
.left{width:67%;display:flex;flex-direction:column;overflow:hidden;border-left:1px solid rgba(255,255,255,.1);background:var(--bgpreview)}
.right{width:33%;display:flex;flex-direction:column;overflow:hidden;background:white;position:relative}
.topbar{height:50px;display:flex;align-items:center;justify-content:space-between;padding:0 16px;flex-shrink:0;border-bottom:1px solid var(--bdr)}
.left .topbar{background:rgba(11,68,64,.6);border-bottom:1px solid rgba(255,255,255,.1)}
.right .topbar{background:#fff}
.tb-brand{display:flex;align-items:center;gap:8px}
.tb-title{font-weight:700;font-size:20px;color:rgba(255, 255, 255);padding: 2px 2px;}
.tb-badge{font-size:14px;font-weight:700;padding:2px 18px;border-radius:20px;background:rgba(255,255,255,.15);color:rgba(255,255,255,.7);border:1px solid rgba(255,255,255,.2)}
.tb-icon{font-size:20px;font-weight:700;padding:2px 2px;color:white;}
.tb-btns{display:flex;gap:6px;align-items:center}
.btn-ghost{padding:5px 12px;border-radius:6px;border:1px solid var(--bdr);background:transparent;cursor:pointer;color:var(--sub);font-size:12px;font-family:var(--sans);transition:all .15s}
.left .btn-ghost{border-color:rgba(255,255,255,.2);color:rgba(255,255,255,.7)}
.left .btn-ghost:hover{background:rgba(255,255,255,.1);color:#fff}
.btn-save{padding:5px 14px;border-radius:6px;border:none;background:var(--ba);cursor:pointer;color:var(--bd);font-size:12px;font-family:var(--sans);font-weight:700;transition:all .15s}
.btn-save:hover{background:#5ecfc8}
.tb-dot{width:8px;height:8px;border-radius:50%;background:var(--ba)}
.ot-bar{display:flex;gap:6px;padding:8px 10px 6px;border-bottom:1px solid rgba(255,255,255,.1);flex-wrap:wrap;background:var(--bgpreview);justify-content:center}
.ot-btn{padding:4px 12px;border-radius:20px;border:1.5px solid rgba(255,255,255,.25);background:transparent;color:rgba(255,255,255,.7);font-size:11px;font-family:var(--sans);cursor:pointer;transition:all .15s}
.ot-btn:hover{background:rgba(255,255,255,.1);color:#fff}
.ot-btn.active{background:var(--ba);border-color:var(--ba);color:var(--bd);font-weight:700}
.prev{flex:1;overflow-y:auto;padding:20px;display:flex;flex-direction:column;align-items:center;gap:12px;background:#e3e1e1;position:relative}
.prev-controls{width:290px;display:flex;gap:6px;align-items:center}
.preview-item-btn{flex:1;padding:6px 10px;border-radius:6px;border:1px solid rgba(0,0,0,1);background:rgba(255,255,255,1);cursor:pointer;font-size:11px;font-family:var(--sans);color:#000000;font-weight:500;display:flex;align-items:center;gap:5px;transition:all .15s;justify-content:center}
.preview-item-btn:hover{background:#0B4440;color:white;border-color:rgba(255,255,255,.4)}
.chips-area{width:290px;display:flex;align-items:center;gap:6px;flex-wrap:wrap}
.chips-bar{display:flex;flex-wrap:wrap;gap:4px;flex:1}
.pi-chip{display:flex;align-items:center;gap:4px;padding:3px 8px;border-radius:20px;background:rgba(255,255,255,.15);color:#fff;font-size:11px;font-family:var(--sans);cursor:pointer;border:1px solid rgba(255,255,255,.2)}
.pi-chip:hover{background:rgba(255,255,255,.25)}
.pi-chip-rm{color:rgba(255,255,255,.6);font-size:13px;line-height:1;margin-left:2px}
.pi-chip-rm:hover{color:#fff}
.chips-clear{padding:3px 8px;border-radius:20px;border:1px solid rgba(255,255,255,.25);background:transparent;color:rgba(255,255,255,.6);font-size:11px;cursor:pointer;font-family:var(--sans)}
.chips-clear:hover{background:rgba(255,255,255,.1);color:#fff;border-color:rgba(255,255,255,.4)}
.rw{width:290px;position:relative}
.rp{background:#fff;box-shadow:0 2px 16px rgba(0,0,0,.1),0 0 0 1px rgba(0,0,0,.04);border-radius:2px;font-family:'Courier New',Courier,monospace;font-size:11.5px;direction:rtl;min-height:80px;position:relative}
.rp::before,.rp::after{content:'';display:block;height:6px;background:repeating-linear-gradient(90deg,#fff 0 6px,#ddd 6px 8px)}
.be{position:relative;cursor:pointer;transition:background .08s;direction:rtl;user-select:none;padding:1px 10px;color:#111}
.be.clickable:hover{background:rgba(11,68,64,.05)}
.be.sel{background:rgba(115,222,215,.25)!important;outline:1.5px solid var(--bm);outline-offset:-1px;z-index:1}
.dh{opacity:0;position:absolute;left:4px;top:50%;transform:translateY(-50%);pointer-events:none;transition:opacity .15s;color:#aaa;font-size:10px}
.be.sel .dh,.be.clickable:hover .dh{opacity:1}
.stb{position:fixed;background:#fff;border:1.5px solid var(--bdr2);border-radius:9px;padding:5px 7px;display:none;gap:2px;align-items:center;box-shadow:0 4px 20px rgba(0,0,0,.12);flex-wrap:wrap;max-width:320px;z-index:200}
.stb.vis{display:flex}
.tb{padding:4px 7px;border-radius:5px;border:1.5px solid transparent;background:#f8fafb;color:var(--sub);cursor:pointer;font-size:11px;font-family:var(--sans);transition:all .1s}
.tb:hover{background:#eef7f3;color:var(--bd)}
.tb.on{background:#e0f5f1;color:var(--bd);font-weight:700}
.tsep{width:1px;height:16px;background:var(--bdr);margin:0 2px}
.tsz{padding:2px 6px;border-radius:4px;font-size:11px;font-family:var(--mono);color:var(--sub);cursor:pointer;background:#f0f2f4}
.tcl{padding:4px 7px;border-radius:5px;font-size:11px;cursor:pointer;color:#e53935;background:#fff0f0;border:none}
.tabs{display:flex;border-bottom:1px solid var(--bdr);padding:0 8px;flex-shrink:0;justify-content:center;}
.tab{padding:10px 14px;font-size:12px;font-family:var(--sans);color:var(--sub);cursor:pointer;border-bottom:2px solid transparent;transition:all .15s;user-select:none}
.tab:hover{color:var(--text)}
.tab.on{color:var(--bm);border-bottom-color:var(--bm);font-weight:600}
.right-scroll{flex:1;overflow-y:auto;padding:16px}
.section-label{font-size:11px;font-weight:700;color:var(--sub);text-transform:uppercase;letter-spacing:.5px;margin:16px 0 8px;padding-bottom:4px;border-bottom:1px solid var(--bdr)}
.section-label:first-child{margin-top:0}
.tmpl-cards{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:8px}
.tmpl-card{border-radius:10px;cursor:pointer;transition:all .15s;overflow:hidden;border:1.5px solid var(--bdr);background:#fff;position:relative}
.tmpl-card:hover{border-color:var(--bm)}
.tmpl-card.on{border-color:var(--bm);box-shadow:0 0 0 1px var(--bm)}
.tmpl-sel-dot{position:absolute;top:6px;left:6px;width:8px;height:8px;border-radius:50%;background:var(--bm);opacity:0;transition:opacity .15s}
.tmpl-card.on .tmpl-sel-dot{opacity:1}
.tmpl-card-preview{padding:6px 4px;background:#fff;border-bottom:1px solid var(--bdr);overflow:hidden;min-height:50px}
.tmpl-card-name{padding:5px 8px;font-size:10px;font-weight:600;color:var(--sub);text-align:right}
.tcp-receipt{background:#fff;border-radius:2px;padding:4px;font-family:'Courier New',Courier,monospace;font-size:6px;direction:rtl;line-height:1.4;color:#111;text-align:right}
.tcp-bold{font-weight:bold}.tcp-center{text-align:center}.tcp-right{text-align:right}.tcp-indent{padding-right:8px}
.field{margin-bottom:12px}
.field label{display:block;font-size:11px;font-weight:600;color:var(--sub);margin-bottom:5px;text-align:right}
.field input[type=text]{width:100%;padding:7px 10px;border-radius:7px;border:1.5px solid var(--bdr);background:#fff;color:var(--text);font-size:12px;font-family:var(--sans);transition:border .15s;outline:none;direction:rtl}
.field input[type=text]:focus{border-color:var(--bm)}
.code-field{display:flex;border-radius:7px;border:1.5px solid var(--bdr);overflow:hidden;transition:border .15s}
.code-field:focus-within{border-color:var(--bm)}
.code-prefix{padding:7px 10px;background:#f8fafb;color:var(--sub);font-size:12px;font-family:var(--mono);border-left:1px solid var(--bdr);white-space:nowrap}
.code-input{flex:1;padding:7px 10px;border:none;outline:none;font-size:12px;font-family:var(--mono);color:var(--text);direction:ltr;background:#fff}
.ms-wrap{position:relative;margin-bottom:4px}
.ms-trigger{width:100%;padding:7px 10px;border-radius:7px;border:1.5px solid var(--bdr);background:#fff;color:var(--text);font-size:12px;font-family:var(--sans);cursor:pointer;display:flex;align-items:center;justify-content:space-between;transition:border .15s;user-select:none;direction:rtl}
.ms-trigger:hover{border-color:var(--bm)}
.ms-trigger.open{border-color:var(--bm);border-radius:7px 7px 0 0}
.ms-arrow{font-size:10px;color:var(--sub);transition:transform .2s}
.ms-trigger.open .ms-arrow{transform:rotate(180deg)}
.ms-pl{color:#b0bec5}
.ms-dropdown{position:absolute;top:100%;right:0;left:0;background:#fff;border:1.5px solid var(--bm);border-top:none;border-radius:0 0 7px 7px;z-index:100;max-height:200px;overflow-y:auto;box-shadow:0 4px 12px rgba(0,0,0,.1)}
.ms-item{padding:8px 10px;display:flex;align-items:center;gap:8px;cursor:pointer;font-size:12px;direction:rtl}
.ms-item:hover{background:#f0fdf6}
.ms-item input[type=checkbox]{accent-color:var(--bm)}
.ms-tags{display:flex;flex-wrap:wrap;gap:4px;margin-top:4px}
.ms-tag{display:flex;align-items:center;gap:4px;padding:2px 8px;border-radius:20px;background:#e8f5f0;color:var(--bm);font-size:11px;font-weight:600}
.ms-tag-rm{cursor:pointer;color:var(--bm);opacity:.6}
.ms-tag-rm:hover{opacity:1}
.mrow{display:flex;flex-direction:row-reverse;align-items:center;gap:8px;padding:6px 12px;cursor:pointer;border-bottom:1px solid rgba(0,0,0,0.05);transition:background .1s}
.mrow:hover{background:rgba(0,0,0,0.02)}
.mrow.sel{background:rgba(115,222,215,0.12)}
.mrow-arrow{font-size:10px;color:#aaa;width:12px;flex-shrink:0;user-select:none}
.mrow-check{width:16px;height:16px;border-radius:4px;flex-shrink:0;border:2px solid #d1d5db;background:#fff;display:flex;align-items:center;justify-content:center}
.mrow-check.on{border-color:var(--bm);background:var(--bm)}
.mrow-check.partial{border-color:var(--bm);background:rgba(15,88,83,0.15)}
.mrow-label{font-size:12px;color:#1a2332;flex:1}
.mrow-label.cat{font-weight:600}
.mrow-label.item{font-size:11px;color:#374151;font-weight:400}
.mrow-code{font-size:10px;color:#9ca3af;font-family:monospace;background:#f3f4f6;padding:1px 5px;border-radius:3px;flex-shrink:0}
.mrow-count{font-size:10px;color:#aaa;flex-shrink:0}
.mrow-rm{font-size:11px;color:#9ca3af;cursor:pointer;padding:0 4px;flex-shrink:0}
.mrow-rm:hover{color:#ef4444}
.ms-tag-rm:hover{opacity:1}
.tg{position:relative;display:inline-block;width:32px;height:18px;flex-shrink:0}
.tg input{opacity:0;width:0;height:0}
.tg-tr{position:absolute;cursor:pointer;inset:0;background:#d1d5db;border-radius:9px;transition:background .18s}
.tg input:checked+.tg-tr{background:var(--bm)}
.tg-th{position:absolute;left:2px;top:2px;width:14px;height:14px;background:#fff;border-radius:50%;transition:left .18s;pointer-events:none;box-shadow:0 1px 3px rgba(0,0,0,.2)}
.tg input:checked~.tg-th{left:16px}
.pg{margin-bottom:4px;border:1.5px solid var(--bdr);border-radius:8px;overflow:hidden}
.pg-hdr{display:flex;align-items:center;gap:8px;padding:8px 10px;cursor:pointer;user-select:none;background:#f8fafb;transition:background .15s}
.pg-hdr:hover{background:#eef7f3}
.pg-icon{font-size:14px}
.pg-ttl{font-size:12px;font-weight:600;color:var(--text);flex:1;direction:rtl;text-align:right}
.pg-count{font-size:10px;color:var(--sub);background:#e8f0f0;padding:1px 6px;border-radius:10px}
.pg-arr{font-size:10px;color:var(--sub);transition:transform .2s}
.pg.collapsed .pg-arr{transform:rotate(-90deg)}
.pg-body{padding:4px 10px 8px;border-top:1px solid var(--bdr)}
.pg.collapsed .pg-body{display:none}
.pr{display:flex;align-items:center;justify-content:space-between;padding:7px 0;border-bottom:1px solid var(--bdr)}
.pr:last-child{border-bottom:none}
.pr-l{flex:1;direction:rtl;text-align:right}
.pr-lbl{font-size:11px;color:var(--text);font-weight:500}
.pr-sub{font-size:10px;color:var(--sub);margin-top:1px}
.picker-overlay{position:fixed;inset:0;background:rgba(0,0,0,.4);z-index:300;display:none;align-items:center;justify-content:center}
.picker-overlay.open{display:flex}
.picker-box{background:#fff;border:1.5px solid var(--bdr2);border-radius:12px;width:380px;max-height:80vh;display:flex;flex-direction:column;overflow:hidden;box-shadow:0 20px 40px rgba(0,0,0,.15)}
.picker-hdr{display:flex;align-items:center;padding:12px 16px;border-bottom:1px solid var(--bdr);background:var(--bm)}
.picker-title{font-size:14px;font-weight:700;color:#fff;flex:1;direction:rtl;text-align:right}
.picker-close{background:transparent;border:none;color:rgba(255,255,255,.7);font-size:18px;cursor:pointer;line-height:1;padding:2px}
.picker-close:hover{color:#fff}
.picker-search{padding:10px 12px;border-bottom:1px solid var(--bdr);background:#f8fafb}
.picker-search input{width:100%;border:1px solid var(--bdr);border-radius:6px;padding:6px 10px;font-size:12px;font-family:var(--sans);outline:none;direction:rtl}
.picker-search input:focus{border-color:var(--bm)}
.picker-list{flex:1;overflow-y:auto}
.picker-cat{display:flex;align-items:center;justify-content:space-between;padding:6px 12px;background:#f0fdf6;border-bottom:1px solid var(--bdr);position:sticky;top:0;z-index:1}
.picker-cat-label{font-size:10px;font-weight:700;color:var(--bm);direction:rtl}
.picker-cat-selall{font-size:10px;color:var(--bm);background:transparent;border:1px solid var(--bm);cursor:pointer;font-family:var(--sans);padding:2px 6px;border-radius:4px}
.picker-cat-selall:hover{background:var(--bm);color:#fff}
.picker-item{display:flex;align-items:center;gap:10px;padding:8px 12px;cursor:pointer;direction:rtl;border-bottom:1px solid var(--bdr)}
.picker-item:hover{background:#f0fdf6}
.picker-item.on{background:#e8fdf3}
.picker-item input[type=checkbox]{accent-color:var(--bm)}
.picker-item-name{font-size:12px;color:var(--text);flex:1;text-align:right}
.picker-item-badge{font-size:10px;color:var(--sub);white-space:nowrap;background:#f0f0f0;padding:1px 6px;border-radius:10px}
.picker-footer{padding:10px 12px;border-top:1px solid var(--bdr);display:flex;gap:8px;justify-content:flex-end;background:#f8fafb}
.picker-footer button{padding:6px 16px;border-radius:6px;font-size:12px;font-family:var(--sans);cursor:pointer;font-weight:600}
.picker-footer .p-cancel{border:1px solid var(--bdr);background:#fff;color:var(--sub)}
.picker-footer .p-ok{border:none;background:var(--bm);color:#fff}
.gconf-box{background:#fff;border:1.5px solid var(--bdr2);border-radius:12px;width:360px;max-height:78vh;display:flex;flex-direction:column;overflow:hidden;box-shadow:0 20px 40px rgba(0,0,0,.15)}
.gconf-hdr{display:flex;align-items:center;padding:12px 16px;border-bottom:1px solid var(--bdr);background:var(--bm)}
.gconf-item-name{font-size:14px;font-weight:700;color:#fff;flex:1;direction:rtl;text-align:right}
.gconf-body{flex:1;overflow-y:auto;padding:12px}
.gconf-progress{padding:4px 16px 10px;background:#f8fafb;border-bottom:1px solid var(--bdr)}
.gconf-progress-label{font-size:10px;color:var(--sub);direction:rtl;text-align:right;margin-bottom:4px;display:flex;justify-content:space-between}
.gconf-progress-bar{height:4px;background:#e0e0e0;border-radius:2px}
.gconf-progress-fill{height:100%;background:var(--bm);border-radius:2px;transition:width .3s}
.gconf-qty{display:flex;align-items:center;gap:8px;margin-bottom:12px;direction:rtl}
.gconf-qty label{font-size:12px;color:var(--sub);flex:1;text-align:right}
.gconf-qty input{width:50px;text-align:center;border:1.5px solid var(--bdr);border-radius:6px;padding:4px;font-size:13px;font-family:var(--sans);outline:none}
.gconf-qty input:focus{border-color:var(--bm)}
.gconf-group{margin-bottom:10px}
.gconf-group-hdr{display:flex;align-items:center;gap:6px;padding:6px 8px;background:#f0fdf6;border-radius:6px;margin-bottom:4px}
.gconf-group-name{font-size:12px;font-weight:600;color:var(--bd);flex:1;direction:rtl;text-align:right}
.gconf-group-type{font-size:10px;color:var(--sub)}
.gconf-group-req{font-size:10px;color:#d97706}
.gconf-group-counter{font-size:11px;font-weight:700;color:var(--bm)}
.gconf-opts{display:flex;flex-wrap:wrap;gap:4px;padding:0 4px}
.gconf-opt{padding:4px 10px;border-radius:20px;border:1.5px solid var(--bdr);background:#f8fafb;color:var(--sub);font-size:11px;font-family:var(--sans);cursor:pointer;transition:all .12s}
.gconf-opt:hover{background:#fff}
.gconf-opt.active{background:#e8fdf3;border-color:var(--bm);color:var(--bd);font-weight:600}
.gconf-opt-count{background:var(--bm);color:#fff;border-radius:8px;padding:0 5px;font-weight:700;display:inline-block;min-width:14px;text-align:center;margin-right:4px}
.gconf-footer{padding:10px 12px;border-top:1px solid var(--bdr);display:flex;gap:8px;justify-content:flex-end;background:#f8fafb}
.gconf-footer button{padding:6px 16px;border-radius:6px;font-size:12px;font-family:var(--sans);cursor:pointer;font-weight:600}
.gconf-footer .g-back{border:1px solid var(--bdr);background:#fff;color:var(--sub)}
.gconf-footer .g-next{border:none;background:var(--bm);color:#fff}
.ctx-panel{position:absolute;top:50px;left:0;width:100%;height:calc(100% - 50px);background:var(--bg);z-index:200;transform:translateX(100%);transition:transform .28s cubic-bezier(.4,0,.2,1);display:flex;flex-direction:column}
.ctx-panel.open{transform:translateX(0)}
.ctx-panel-hdr{display:flex;align-items:center;gap:10px;padding:14px 16px;background:var(--bd);color:#fff;flex-shrink:0}
.ctx-panel-back{background:transparent;border:none;color:rgba(255,255,255,.7);font-size:16px;cursor:pointer;line-height:1;padding:2px 6px}
.ctx-panel-back:hover{color:#fff}
.ctx-panel-title{font-size:14px;font-weight:700;color:#fff;flex:1;text-align:right}
.ctx-panel-body{flex:1;overflow-y:auto;padding:8px 0}
.ctx-acc-hdr{display:flex;align-items:center;justify-content:space-between;padding:10px 12px;background:var(--bm);color:#fff;cursor:pointer;font-family:var(--sans);font-size:12px;font-weight:700;margin-bottom:1px;user-select:none;direction:rtl}
.ctx-acc-hdr.open{border-radius:6px 6px 0 0}
.ctx-acc-arrow{transition:transform .2s;font-size:10px}
.ctx-acc-hdr.open .ctx-acc-arrow{transform:rotate(180deg)}
.ctx-acc-body{display:none;border:1px solid #e0f0e8;border-top:none;border-radius:0 0 6px 6px;padding:4px 0;margin-bottom:6px}
.ctx-acc-body.open{display:block}
.ctx-pr{display:flex;align-items:center;gap:8px;padding:8px 12px;border-bottom:1px solid #eef7f3}
.ctx-pr:last-child{border-bottom:none}
.ctx-pr-lbl{flex:1;direction:rtl;text-align:right;font-size:12px;color:var(--text);font-weight:500}
.ctx-pr-lbl small{display:block;font-size:10px;color:var(--sub);margin-top:1px}
.right-scroll::-webkit-scrollbar,.prev::-webkit-scrollbar,.ctx-panel-body::-webkit-scrollbar{width:5px}
.right-scroll::-webkit-scrollbar-thumb{background:var(--bdr2);border-radius:3px}
.prev::-webkit-scrollbar-thumb{background:rgba(115,222,215,.4);border-radius:3px}
.ctx-panel-body::-webkit-scrollbar-thumb{background:var(--bdr2);border-radius:3px}
.no-template{color:#f59e0b}
.input-white::placeholder{color:white;}
.input-white{color:white;}
`;

// ══════════════════════════════════════════════════════════
// MAIN APP
// ══════════════════════════════════════════════════════════
export default function App() {
  const [bonName, setBonName]                 = useState("צ'קר");
  const [template, setTemplate]               = useState("general");
  const [params, setParams]                   = useState({});
  const [orderType, setOrderType]             = useState("SEATED");
  const [orderServiceType, setOrderServiceType] = useState("SEATED");
  const [selectedOT, setSelectedOT]           = useState("SEATED");
  const [previewItems, setPreviewItems]       = useState([]);
  const [userSelected, setUserSelected]       = useState(false);
  const [refreshKey, setRefreshKey]           = useState(0);
  const [elOrd, setElOrd]                     = useState([]);
  const [elSt, setElSt]                       = useState({});
  const [selId, setSelId]                     = useState(null);
  const [dragId, setDragId]                   = useState(null);
  const [ctxZone, setCtxZone]                 = useState(null);
  const [flashZone, setFlashZone]             = useState(null);
  const [flashCount, setFlashCount]           = useState(0);
  const flashTimer = useRef(null);
  const [selBtnPos, setSelBtnPos]             = useState({ top: 0, left: 0 });
  const [orderTypes, setOrderTypes]           = useState([]);
  const [sources, setSources]                 = useState([]);
  const [pickerOpen, setPickerOpen]           = useState(false);

  const { menu } = useMenu();
  const { enriched: allEnriched, loading: menuLoading } = useMenuWithGroups();


  // ── helper: build random choices for an item ──────────
  const buildChoices = (item) => {
    const groups = item.groups || [];
    const choices = {};
    const ratio = 0.1 + Math.random() * 0.4;
    const numGroups = Math.max(1, Math.round(groups.length * ratio));
    const pickedGroups = [...groups].sort(() => Math.random() - 0.5).slice(0, numGroups);
    pickedGroups.forEach(g => {
      const isWOid = id => String(id).startsWith('WO_');
      if (g.type === 'mgss') {
        const pick = g.members[Math.floor(Math.random() * g.members.length)];
        if (pick) choices[g.id] = [pick.id];
      } else if (g.type === 'mgms') {
        const woIds = g.members.filter(m => isWOid(m.id)).map(m => m.id);
        const selected = [...woIds];
        if (woIds.length > 0 && Math.random() > 0.5) {
          selected.splice(Math.floor(Math.random() * woIds.length), 1);
        }
        choices[g.id] = selected;
      } else if (g.type === 'ig') {
        const pick = g.members[Math.floor(Math.random() * g.members.length)];
        if (pick) choices[g.id] = [pick.id];
      }
    });
    return choices;
  };

  // random items from full catalog
  const randomItems = useMemo(() => {
    if (menuLoading || !allEnriched.length) return [];
    // ensure at least 2 Beverages + 4 from other courses
    const beverages    = allEnriched.filter(i => i.course === 'Beverages');
    const nonBeverages = allEnriched.filter(i => i.course !== 'Beverages');
    const shuffledBev  = [...beverages].sort(() => Math.random() - 0.5).slice(0, 2);
    const shuffledRest = [...nonBeverages].sort(() => Math.random() - 0.5).slice(0, 4);
    const pool = [...shuffledBev, ...shuffledRest];
    return pool.map(item => ({ item, qty: 1, choices: buildChoices(item) }));
  }, [menuLoading, refreshKey]);  // refreshKey forces new random selection
  const bonPaperRef = useRef();
  const prevRef      = useRef();

  // ── Build & sort elements ──
  // ── Effective items for preview ──
  // If user selected items: show only those (no duplication if < 6)
  // If no selection: show random items from full catalog
  const effectiveItems = previewItems.length > 0 ? previewItems : randomItems;
  // ── Save/Restore/Duplicate/Delete ──
  const [snapshot, setSnapshot]   = useState(null);
  const [isDirty, setIsDirty]     = useState(false);
  const [toast, setToast]         = useState(null);
  const snapshotRef               = useRef(null);
  const [refreshHovered, setRefreshHovered] = useState(false);

  useEffect(() => {
    const current = JSON.stringify({ bonName, template, params, orderTypes, sources });
    if (snapshotRef.current === null) {
      snapshotRef.current = current;
      setSnapshot({ bonName, template, params: {...params}, orderTypes: [...(orderTypes||[])], sources: [...(sources||[])] });
      return;
    }
    if (current !== snapshotRef.current) setIsDirty(true);
  }, [bonName, template, params, orderTypes, sources]);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 2500);
  };
  const handleSave = () => {
    snapshotRef.current = JSON.stringify({ bonName, template, params, orderTypes, sources });
    setSnapshot({ bonName, template, params: {...params}, orderTypes: [...(orderTypes||[])], sources: [...(sources||[])] });
    setIsDirty(false);
    showToast("הבון נשמר בהצלחה ✓");
  };
  const handleRestore = () => {
    if (!snapshot) return;
    setBonName(snapshot.bonName);
    setTemplate(snapshot.template);
    Object.keys(params).forEach(k => onParamChange(k, 0));
    Object.entries(snapshot.params).forEach(([k, v]) => onParamChange(k, v));
    setOrderTypes(snapshot.orderTypes);
    setSources(snapshot.sources);
    setIsDirty(false);
    showToast("ההגדרות שוחזרו ✓", "restore");
  };
  const handleDuplicate = () => {
    navigator.clipboard?.writeText(JSON.stringify({ bonName: bonName + " (עותק)", template, params, orderTypes, sources }, null, 2));
    showToast("הבון הועתק ללוח ✓");
  };
  const handleDelete = () => {
    if (window.confirm("למחוק את הבון?")) showToast("הבון נמחק ✓", "restore");
  };
  const isRestoreDisabled = !snapshot ||
    JSON.stringify({ bonName, template, params, orderTypes, sources }) === JSON.stringify(snapshot);

  const elements = buildElements({ params, bonName, orderType, orderServiceType, previewItems: effectiveItems, template });

  const sorted = elOrd.length
    ? [...elements].sort((a, b) => {
        const ai = elOrd.indexOf(a.id), bi = elOrd.indexOf(b.id);
        return (ai < 0 ? 9999 : ai) - (bi < 0 ? 9999 : bi);
      })
    : elements;

  useEffect(() => {
    setElOrd(prev => {
      const ids = elements.map(e => e.id);
      if (!prev.length) return ids;
      const next = [...prev.filter(id => ids.includes(id))];
      ids.forEach((id, i) => {
        if (!next.includes(id)) {
          let insertAfter = -1;
          for (let j = i - 1; j >= 0; j--) {
            const pos = next.indexOf(ids[j]);
            if (pos >= 0) { insertAfter = pos; break; }
          }
          if (insertAfter >= 0) next.splice(insertAfter + 1, 0, id);
          else next.push(id);
        }
      });
      return next;
    });
  }, [elements.map(e => e.id).join(",")]);

  // ── Params ──
  const onParamChange = (id, val) => {
    setParams(p => ({ ...p, [id]: Array.isArray(val) ? val : val ? 1 : 0 }));
    // determine which zone this param belongs to and flash it
    const zoneKey = ctxZone;
    if (zoneKey) {
      if (flashTimer.current) clearTimeout(flashTimer.current);
      setFlashZone(zoneKey);
      setFlashCount(c => c + 1);
      // scroll the zone into view if out of viewport
      const container = prevRef?.current;
      if (container) {
        const els = Array.from(container.querySelectorAll(`.be[data-zone="${zoneKey}"]`));
        if (els.length > 0) {
          const first = els[0].getBoundingClientRect();
          const cRect = container.getBoundingClientRect();
          if (first.top < cRect.top || first.bottom > cRect.bottom) {
            els[0].scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }
      }
      flashTimer.current = setTimeout(() => setFlashZone(null), 600);
    }
  };

  // ── Order type ──
  const handleOT = (ot) => {
    setSelectedOT(ot);
    if (ot === "SEATED")     { setOrderType("SEATED");   setOrderServiceType("SEATED"); }
    else if (ot === "TA")       { setOrderType("TA");      setOrderServiceType("TA"); }
    else if (ot === "DELIVERY") { setOrderType("DELIVERY"); setOrderServiceType("DELIVERY"); }
    else if (ot === "OTC_SEATED"){ setOrderType("OTC");    setOrderServiceType("SEATED"); }
    else if (ot === "OTC_TA")   { setOrderType("OTC");    setOrderServiceType("TA"); }
  };

  // ── Drag ──
  const handleDragOver = (e) => { e.preventDefault(); };
  const handleDrop = (targetId, e) => {
    if (!dragId || dragId === targetId) return;
    setElOrd(prev => {
      const next = [...prev];
      const fromI = next.indexOf(dragId), toI = next.indexOf(targetId);
      if (fromI < 0 || toI < 0) return prev;
      next.splice(fromI, 1);
      const newTo = next.indexOf(targetId);
      const rect  = bonPaperRef.current?.querySelector(`[data-id="${targetId}"]`)?.getBoundingClientRect();
      const mid   = rect ? (rect.top + rect.bottom) / 2 : 0;
      next.splice(e.clientY < mid ? newTo : newTo + 1, 0, dragId);
      return next;
    });
    setDragId(null);
  };

  // ── Selection ──
  const handleSelect = (id) => {
    setSelId(id);
    setTimeout(() => {
      const el = bonPaperRef.current?.querySelector(`[data-id="${id}"]`);
      if (el) {
        const r = el.getBoundingClientRect();
        setSelBtnPos({ top: r.bottom + 5, left: Math.max(2, Math.min(r.left - 16, window.innerWidth - 335)) });
      }
    }, 0);
  };
  const handleDesel  = () => setSelId(null);
  const handleToggle = (prop) => {
    setElSt(prev => {
      const s = { ...(prev[selId] || {}) };
      if (prop === "bsq") { s.bsq = !s.bsq; if (s.bsq) s.brd = false; }
      else if (prop === "brd") { s.brd = !s.brd; if (s.brd) s.bsq = false; }
      else s[prop] = !s[prop];
      return { ...prev, [selId]: s };
    });
  };
  const handleSetAlign = (a) => setElSt(p => ({ ...p, [selId]: { ...(p[selId] || {}), align: a } }));
  const handleAdjSize  = (d) => setElSt(p => {
    const s = { ...(p[selId] || {}) };
    s.size = Math.max(8, Math.min(26, (s.size || 11) + d));
    return { ...p, [selId]: s };
  });

  useEffect(() => {
    const handler = e => { if (!e.target.closest(".be") && !e.target.closest(".stb")) handleDesel(); };
    document.addEventListener("click", handler);
    return () => document.removeEventListener("click", handler);
  }, []);

  const TEMPLATE_NAMES = {
  general:  'בון כללי',
  allday:   'כל היום',
  peritem:  'נפרד לכל פריט',
  perdiner: 'לפי סועדים',
};

  return (
    <>
      <style>{CSS}</style>
      <div className="app">
        {/* ── LEFT: PREVIEW ── */}
        <div className="left">
          <div className="topbar">
            <div className="tb-btns" dir='rtl'>
              <button className="btn-ghost" dir='rtl'>ייצא JSON</button>
              <button onClick={handleDelete} style={{
                display:"flex", alignItems:"center", gap:4,
                padding:"4px 9px", borderRadius:6, fontSize:11,
                fontFamily:"var(--sans)", border:"1.5px solid rgba(255,100,100,0.5)",
                background:"rgba(255,100,100,0.15)", color:"#ffaaaa", cursor:"pointer",
              }}>
                <Trash2 size={12}/> מחיקה
              </button>
              <button onClick={handleDuplicate} style={{
                display:"flex", alignItems:"center", gap:4,
                padding:"4px 9px", borderRadius:6, fontSize:11,
                fontFamily:"var(--sans)", border:"1.5px solid rgba(255,255,255,0.3)",
                background:"transparent", color:"rgba(255,255,255,0.7)", cursor:"pointer",
              }}>
                <Copy size={12}/> שכפול
              </button>
              <button
                onClick={handleRestore}
                disabled={isRestoreDisabled}
                style={{
                  display:"flex", alignItems:"center", gap:4,
                  padding:"4px 9px", borderRadius:6, fontSize:11,
                  fontFamily:"var(--sans)", border:"1.5px solid rgba(255,255,255,0.3)",
                  background:"transparent", color:"rgba(255,255,255,0.7)",
                  opacity: isRestoreDisabled ? 0.4 : 1,
                  cursor: isRestoreDisabled ? "default" : "pointer",
                }}>
                <RotateCcw size={12}/> שחזור
              </button>
              <button
                onClick={handleSave}
                disabled={!isDirty}
                style={{
                  display:"flex", alignItems:"center", gap:4,
                  padding:"4px 12px", borderRadius:6, fontSize:11,
                  fontFamily:"var(--sans)", border:"none",
                  background: isDirty ? "var(--ba)" : "rgba(255,255,255,0.2)",
                  color: isDirty ? "var(--bd)" : "rgba(255,255,255,0.5)",
                  fontWeight:700, cursor: isDirty ? "pointer" : "default",
                }}>
                <Save size={12}/> שמירה
              </button>
            </div>
              <div className="tb-brand" dir='rtl'>
                <ReceiptText size={20} color="white" />
                <span className="tb-title">
                  {bonName || 'בון כללי'}: תצוגה מקדימה
                  {template ? (
                    <span style={{ fontWeight: 400, opacity: 0.7, fontSize: 13, marginRight: 6 }}>
                      ({TEMPLATE_NAMES[template] || template})
                    </span>
                  ) : (
                    <span style={{ fontWeight: 700, fontSize: 13, color: '#f59e0b', marginRight: 6 }}>
                      נא לבחור תבנית הדפסה
                    </span>
                  )}
                </span>
              </div>
          </div>

          <OtBar
            selectedOT={selectedOT}
            orderTypes={orderTypes}
            sources={sources}
            onSelect={handleOT}
          />

          <div className="prev" ref={prevRef} onClick={handleDesel}>
            <div style={{ width: 290, display: "flex", flexDirection: "column", gap: 6 }}>
              {/* Row 1: main picker button + clear */}
              <div style={{ display: "flex", gap: 6 }}>
                <button className="preview-item-btn" style={{ flex: 1 }} onClick={() => setPickerOpen(true)}>
                  <svg viewBox="0 0 14 14" fill="none" width="13" height="13">
                    <circle cx="7" cy="7" r="6" stroke="currentColor" strokeWidth="1.2"/>
                    <path d="M7 4v6M4 7h6" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
                  </svg>
                  {previewItems.length > 0
                    ? <>{previewItems.length} פריטים בתצוגה</>
                    : <>בחר פריטים לתצוגה</>
                  }
                </button>
                {previewItems.length > 0 && (
                  <button
                    onClick={e => { e.stopPropagation(); setPreviewItems([]); setUserSelected(false); }}
                    style={{ padding: "4px 10px", borderRadius: 6, border: "1px solid rgba(255,255,255,.25)", background: "rgba(255,255,255,.1)", color: "rgba(255,255,255,.7)", fontSize: 13, cursor: "pointer", fontFamily: "var(--sans)", flexShrink: 0 }}
                    title="נקה פריטים"
                  >✕</button>
                )}
              </div>
              {/* Row 2: status + refresh */}
              {allEnriched.length > 0 && (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                <span style={{ fontSize: 12, color: "rgba(0, 0, 0)", fontFamily: "var(--sans)" }}>
                  {userSelected ? "מציג פריטים שנבחרו" : "מציג פריטים אקראיים מהתפריט"}
                </span>
                {!userSelected && (
                  <button
                    onClick={() => setRefreshKey(k => k + 1)}
                    title="טען פריטים אקראיים חדשים"
                    onMouseEnter={() => setRefreshHovered(true)}
                    onMouseLeave={() => setRefreshHovered(false)}
                    style={{
                      background: refreshHovered ? "#0B4440" : "rgba(255,255,255,1)",
                      border: `1px solid ${refreshHovered ? "rgba(0,0,0,.12)" : "rgba(0,0,0)"}`,
                      borderRadius: 6,
                      color: refreshHovered ? "white" : "rgba(0,0,0)",
                      cursor: "pointer",
                      padding: "3px 10px",
                      fontSize: 15,
                      fontFamily: "var(--sans)",
                      display: "flex",
                      alignItems: "center",
                      transition: "all .15s",
                    }}
                  >↺</button>
                )}
              </div>
            )}
            </div>

            <div className="rw">
              <div className="rp" ref={bonPaperRef}>
                {sorted.map(el => (
                  <BonElement
                    key={el.id}
                    el={el}
                    override={elSt[el.id] || {}}
                    selected={selId === el.id}
                    onSelect={handleSelect}
                    onDragStart={setDragId}
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(el.id, e)}
                    onDragEnd={() => setDragId(null)}
                    flash={flashZone === el.zone}
                    flashKey={flashZone === el.zone ? flashCount : 0}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ── RIGHT: SETTINGS ── */}
        <div className="right">
          <SettingsPanel
            bonName={bonName}       setBonName={setBonName}
            template={template}     setTemplate={setTemplate}
            params={params}         onParamChange={onParamChange}
            orderTypes={orderTypes} setOrderTypes={setOrderTypes}
            sources={sources}       setSources={setSources}
            menu={menu}
          />
          {/* ── CTX PANEL ── */}
          <CtxPanel zone={ctxZone} onClose={() => setCtxZone(null)} params={params} onParamChange={onParamChange} template={template} />
        </div>
      </div>

      {/* ── ZONE EDIT BUTTONS ── */}
      <ZoneButtons bonPaperRef={bonPaperRef} containerRef={prevRef} ctxZone={ctxZone} onOpen={setCtxZone} />

      {/* ── FLOATING TOOLBAR ── */}
      <FloatingToolbar
        selId={selId}
        elSt={elSt}
        pos={selBtnPos}
        onToggle={handleToggle}
        onSetAlign={handleSetAlign}
        onAdjSize={handleAdjSize}
        onDesel={handleDesel}
      />

      {/* ── ITEM PICKER ── */}
      {pickerOpen && (
        <ItemPicker
          previewItems={previewItems}
          onUpdate={(items) => { setPreviewItems(items); setUserSelected(items.length > 0); }}
          onClose={() => setPickerOpen(false)}
        />
      )}
      {toast && (
        <div style={{
          position:"fixed", bottom:24, left:"50%", transform:"translateX(-50%)",
          background: toast.type==="restore" ? "var(--bd)" : "var(--bd)",
          color:"#fff", padding:"10px 20px", borderRadius:10, fontSize:13,
          fontFamily:"var(--sans)", fontWeight:600,
          boxShadow:"0 4px 20px rgba(0,0,0,.2)", zIndex:9999,
        }}>{toast.msg}</div>
      )}
    </>
  );
}
