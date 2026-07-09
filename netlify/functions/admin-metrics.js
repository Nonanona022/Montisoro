/* ═══════════════════════════════════════════════════════════════════
   admin-metrics.js — Analyse-module aggregaties uit de events-stroom.
   HMAC-beveiligd (elke ingelogde rol). Inert-safe: 503 zonder secret/DB.
   ───────────────────────────────────────────────────────────────────
   Berekent voor de HUIDIGE periode + de VORIGE gelijke periode (voor de
   ± deltas): KPI's, bezoekers/sessies/bounce/duur, dagreeks, bronnen
   (kanaal per sessie), top-pagina's, apparaten, browsers, landen, talen,
   CTA-kliks, funnels (calculator/fit check) en formulier-events.
   Web Vitals komen uit de aparte web_vitals-tabel.
═══════════════════════════════════════════════════════════════════ */
'use strict';
const store = require('./_lib/supabase.js');
const { requireAuth } = require('./_lib/auth.js');
const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN || '*';

function res(statusCode, body){
  return { statusCode, headers:{ 'Content-Type':'application/json','Cache-Control':'no-store','Access-Control-Allow-Origin':ALLOWED_ORIGIN,'Access-Control-Allow-Headers':'Content-Type','Access-Control-Allow-Methods':'POST, OPTIONS' }, body: JSON.stringify(body) };
}

const CONVERSIONS = ['contact_sent','demo_requested','fitcheck_completed','calculator_completed','report_sent'];

function channelOf(ev){
  var med=(ev.medium||'').toLowerCase(), src=(ev.source||'').toLowerCase(), ref=(ev.referrer||'').toLowerCase();
  if(med){ if(/cpc|ppc|paid/.test(med)) return 'Betaald'; if(/e?mail/.test(med)) return 'E-mail'; if(/social/.test(med)) return 'Sociaal'; }
  if(src){
    if(/google/.test(src)) return 'Google'; if(/linkedin/.test(src)) return 'LinkedIn';
    if(/facebook|fb/.test(src)) return 'Facebook'; if(/instagram|ig/.test(src)) return 'Instagram';
    if(/newsletter|mail/.test(src)) return 'E-mail'; return src.slice(0,24);
  }
  if(ref){
    if(/google\./.test(ref)) return 'Google (organiek)';
    if(/bing\./.test(ref)) return 'Bing'; if(/duckduckgo/.test(ref)) return 'DuckDuckGo';
    if(/linkedin|lnkd/.test(ref)) return 'LinkedIn';
    if(/facebook|fb\./.test(ref)) return 'Facebook'; if(/instagram/.test(ref)) return 'Instagram';
    if(/t\.co|twitter|x\.com/.test(ref)) return 'X/Twitter';
    if(/mail|outlook|gmail|proton/.test(ref)) return 'E-mail';
    return ref.replace(/^www\./,'').slice(0,28);
  }
  return 'Direct';
}
function top(obj,n){ return Object.keys(obj).map(function(k){return {key:k,count:obj[k]};}).sort(function(a,b){return b.count-a.count;}).slice(0,n||10); }
function distinct(arr){ var s={}; arr.forEach(function(v){ if(v) s[v]=1; }); return Object.keys(s).length; }
function localDay(x){ try{ return new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Brussels',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date(x)); }catch(e){ return String(x||'').slice(0,10); } }

/* Kern-KPI's voor één set events. */
function metricsFor(rows){
  var pageviews=0, sess={}, visitors={}, convSessions={}, conversions=0;
  rows.forEach(function(r){
    if(r.name==='page_view'){ pageviews++; if(r.visitor_hash) visitors[r.visitor_hash]=1; }
    if(r.session_id){
      var s = sess[r.session_id] || (sess[r.session_id]={pv:0,min:r.created_at,max:r.created_at});
      if(r.name==='page_view') s.pv++;
      if(r.created_at<s.min) s.min=r.created_at;
      if(r.created_at>s.max) s.max=r.created_at;
    }
    if(CONVERSIONS.indexOf(r.name)>=0){ conversions++; if(r.session_id) convSessions[r.session_id]=1; }
  });
  var sessionIds=Object.keys(sess), nSess=sessionIds.length, bounces=0, durSum=0, durN=0, engaged=0;
  sessionIds.forEach(function(id){
    var s=sess[id]; if(s.pv<=1) bounces++;
    var d=new Date(s.max)-new Date(s.min); if(d>0){ durSum+=d; durN++; }
    if(s.pv>1 || d>10000 || convSessions[id]) engaged++;
  });
  var nConvSess=Object.keys(convSessions).length;
  return {
    pageviews: pageviews,
    sessions: nSess,
    visitors: Object.keys(visitors).length,
    bounceRate: nSess ? Math.round(bounces/nSess*100) : 0,
    avgSessionMs: durN ? Math.round(durSum/durN) : 0,
    pagesPerSession: nSess ? Math.round(pageviews/nSess*10)/10 : 0,
    engagementRate: nSess ? Math.round(engaged/nSess*100) : 0,
    conversions: conversions,
    conversionRate: nSess ? Math.round(nConvSess/nSess*1000)/10 : 0
  };
}

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return res(204, {});
  if (event.httpMethod !== 'POST') return res(405, { ok:false, error:'method_not_allowed' });
  if (!process.env.ADMIN_SESSION_SECRET) return res(503, { ok:false, error:'auth_not_configured' });
  if (!store.isConfigured()) return res(503, { ok:false, error:'db_not_configured' });
  const auth = requireAuth(event);
  if (!auth.ok) return res(auth.status, { ok:false, error:auth.error });

  let body={}; try{ body=JSON.parse(event.body||'{}'); }catch(e){}
  let days = parseInt(body.days,10); if(!(days>0 && days<=366)) days=30;
  let offset = parseInt(body.offsetDays,10); if(!(offset>=0 && offset<=730)) offset=0;
  const now = Date.now();
  const curEnd = now - offset*86400000;
  const curStart = curEnd - days*86400000;
  const prevStart = curStart - days*86400000;

  let rows, vitals;
  try {
    rows = await store.listEvents(new Date(prevStart).toISOString(), 50000);
    vitals = await store.listWebVitals(new Date(curStart).toISOString(), 20000);
  } catch(e){ console.error('[admin-metrics]', e.message); return res(502, { ok:false, error:'db_read_failed' }); }

  const cur=[], prev=[];
  rows.forEach(function(r){ var t=new Date(r.created_at).getTime(); if(t>=curStart && t<curEnd) cur.push(r); else if(t>=prevStart && t<curStart) prev.push(r); });

  // ── dagreeks (page_view + sessies per dag) ──
  const dayPV={}, daySess={};
  cur.forEach(function(r){
    var day=localDay(r.created_at); if(!day) return;
    if(r.name==='page_view') dayPV[day]=(dayPV[day]||0)+1;
    if(r.session_id){ (daySess[day]=daySess[day]||{})[r.session_id]=1; }
  });
  const byDay=[];
  for(var i=days-1;i>=0;i--){ var d=localDay(curEnd-i*86400000); byDay.push({ day:d, pageviews:dayPV[d]||0, sessions:daySess[d]?Object.keys(daySess[d]).length:0 }); }

  // ── eerste event per sessie (voor kanaal/apparaat/land per sessie) ──
  const firstOf={};
  cur.slice().sort(function(a,b){ return new Date(a.created_at)-new Date(b.created_at); }).forEach(function(r){
    if(r.session_id && !firstOf[r.session_id]) firstOf[r.session_id]=r;
  });
  const convBySession={};
  cur.forEach(function(r){ if(CONVERSIONS.indexOf(r.name)>=0 && r.session_id) convBySession[r.session_id]=1; });

  const bySource={}, byDevice={}, byBrowser={}, byCountry={}, byLangSess={};
  Object.keys(firstOf).forEach(function(sidKey){
    var r=firstOf[sidKey];
    var conv=convBySession[sidKey]?1:0;
    var ch=channelOf(r);
    var sc = bySource[ch]||(bySource[ch]={sessions:0,conversions:0});
    sc.sessions++; sc.conversions+=conv;
    var dev=r.device||'onbekend'; var dd=byDevice[dev]||(byDevice[dev]={sessions:0,conversions:0}); dd.sessions++; dd.conversions+=conv;
    var br=r.browser||'overige'; byBrowser[br]=(byBrowser[br]||0)+1;
    if(r.country){ var cc=byCountry[r.country]||(byCountry[r.country]={sessions:0,conversions:0}); cc.sessions++; cc.conversions+=conv; }
    var lg=r.lang||'?'; var ll=byLangSess[lg]||(byLangSess[lg]={sessions:0,conversions:0}); ll.sessions++; ll.conversions+=conv;
  });
  const sources = Object.keys(bySource).map(function(k){ return { key:k, sessions:bySource[k].sessions, conversions:bySource[k].conversions }; }).sort(function(a,b){return b.sessions-a.sessions;}).slice(0,10);

  // ── pagina's: page_view + gem. dwell/scroll uit page_exit ──
  const pvByPath={}, exitAgg={}, langCount={};
  cur.forEach(function(r){
    if(r.name==='page_view'){ if(r.path) pvByPath[r.path]=(pvByPath[r.path]||0)+1; if(r.lang) langCount[r.lang]=(langCount[r.lang]||0)+1; }
    if(r.name==='page_exit' && r.path){
      var a=exitAgg[r.path]||(exitAgg[r.path]={dwell:0,scroll:0,n:0});
      var m=r.meta||{}; a.dwell+=(+m.dwell_ms||0); a.scroll+=(+m.scroll_pct||0); a.n++;
    }
  });
  // entrances (eerste page_view/sessie), exits (laatste), conversies per pad
  const sPages={};
  cur.forEach(function(r){ if(r.name!=='page_view'||!r.session_id||!r.path) return; var t=new Date(r.created_at).getTime(); var o=sPages[r.session_id]||(sPages[r.session_id]={first:null,last:null}); if(!o.first||t<o.first.t) o.first={path:r.path,t:t}; if(!o.last||t>=o.last.t) o.last={path:r.path,t:t}; });
  const entrByPath={}, exitByPath={}, convByPath={};
  Object.keys(sPages).forEach(function(sid){ var o=sPages[sid]; if(o.first) entrByPath[o.first.path]=(entrByPath[o.first.path]||0)+1; if(o.last) exitByPath[o.last.path]=(exitByPath[o.last.path]||0)+1; });
  cur.forEach(function(r){ if(CONVERSIONS.indexOf(r.name)>=0 && r.path) convByPath[r.path]=(convByPath[r.path]||0)+1; });
  const topPaths = top(pvByPath,15).map(function(p){
    var a=exitAgg[p.key];
    return { key:p.key, count:p.count,
      avgDwellMs: a&&a.n?Math.round(a.dwell/a.n):null, avgScroll: a&&a.n?Math.round(a.scroll/a.n):null,
      entrances: entrByPath[p.key]||0,
      exitRate: p.count?Math.round((exitByPath[p.key]||0)/p.count*100):0,
      conversions: convByPath[p.key]||0,
      convRate: p.count?Math.round((convByPath[p.key]||0)/p.count*1000)/10:0 };
  });

  // ── CTA-kliks (button_click) + weergaven (button_view) per id → CTR (#9) ──
  const cta={}, ctaView={};
  cur.forEach(function(r){
    if(r.name==='button_click'){ var id=(r.meta&&r.meta.id)||'onbekend'; cta[id]=(cta[id]||0)+1; }
    else if(r.name==='button_view'){ var vid=(r.meta&&r.meta.id)||'onbekend'; ctaView[vid]=(ctaView[vid]||0)+1; }
  });

  // ── funnels: distinct sessies per stap ──
  function funnel(prefix, steps, completeName){
    var deepest={};
    cur.forEach(function(r){
      if(!r.session_id) return;
      var idx=0;
      if(r.name===completeName) idx=steps+1;
      else { var m=String(r.name).match(new RegExp('^'+prefix+'_step_(\\d+)$')); if(m) idx=parseInt(m[1],10); }
      if(idx>0 && (!deepest[r.session_id] || idx>deepest[r.session_id])) deepest[r.session_id]=idx;
    });
    var reached=new Array(steps+2).fill(0);
    Object.keys(deepest).forEach(function(sid){ var lv=deepest[sid]; for(var k=1;k<=lv && k<=steps+1;k++) reached[k]++; });
    var out=[];
    for(var s=1;s<=steps;s++) out.push({ step:'Stap '+s, sessions:reached[s] });
    out.push({ step:'Afgerond', sessions:reached[steps+1], complete:true });
    return out;
  }
  const funnelCalc = funnel('calculator', 6, 'calculator_completed');
  const funnelFit  = funnel('fitcheck', 5, 'fitcheck_completed');

  // ── expliciete tellingen per conversie-/rapport-event (huidige periode) ──
  const NAMED=['report_generated','report_sent','contact_sent','demo_requested','fitcheck_completed','calculator_completed'];
  const counts={}; NAMED.forEach(function(n){ counts[n]=0; });
  cur.forEach(function(r){ if(Object.prototype.hasOwnProperty.call(counts,r.name)) counts[r.name]++; });

  // ── formulieren: start / submit / abandon + invultijd + fouten per formulier (#10) ──
  const forms={};
  cur.forEach(function(r){
    if(['form_start','form_submit','form_abandon','form_error'].indexOf(r.name)<0) return;
    var f=(r.meta&&r.meta.form)||'onbekend'; var o=forms[f]||(forms[f]={start:0,submit:0,abandon:0,errors:0,fillSum:0,fillN:0,errFields:{}});
    if(r.name==='form_start') o.start++;
    else if(r.name==='form_submit'){ o.submit++; var fm=r.meta&&r.meta.fill_ms; if(fm && fm>0 && fm<1800000){ o.fillSum+=fm; o.fillN++; } }
    else if(r.name==='form_abandon') o.abandon++;
    else if(r.name==='form_error'){ o.errors++; var fld=(r.meta&&r.meta.field)||'veld'; o.errFields[fld]=(o.errFields[fld]||0)+1; }
  });

  // ── Web Vitals: mediaan + rating-verdeling per metric ──
  const vByMetric={};
  (vitals||[]).forEach(function(v){ (vByMetric[v.metric]=vByMetric[v.metric]||[]).push(v); });
  const vitalsSummary = Object.keys(vByMetric).map(function(m){
    var arr=vByMetric[m].map(function(x){return +x.value;}).sort(function(a,b){return a-b;});
    var med=arr.length?arr[Math.floor(arr.length/2)]:0;
    var good=vByMetric[m].filter(function(x){return x.rating==='good';}).length;
    return { metric:m, median:Math.round(med*100)/100, samples:arr.length, goodPct: arr.length?Math.round(good/arr.length*100):0 };
  });

  return res(200, {
    ok:true, days:days,
    current: metricsFor(cur),
    previous: metricsFor(prev),
    byDay: byDay,
    sources: sources,
    topPaths: topPaths,
    devices: Object.keys(byDevice).map(function(k){return {key:k,count:byDevice[k].sessions,conversions:byDevice[k].conversions};}).sort(function(a,b){return b.count-a.count;}).slice(0,6),
    browsers: top(byBrowser,6),
    countries: Object.keys(byCountry).map(function(k){return {key:k,count:byCountry[k].sessions,conversions:byCountry[k].conversions};}).sort(function(a,b){return b.count-a.count;}).slice(0,8),
    langs: Object.keys(byLangSess).map(function(k){return {key:k,count:byLangSess[k].sessions,conversions:byLangSess[k].conversions};}).sort(function(a,b){return b.count-a.count;}).slice(0,5),
    cta: top(cta,12).map(function(c){ var views=ctaView[c.key]||0; return { key:c.key, count:c.count, views:views, ctr: views?Math.round(c.count/views*1000)/10:null }; }),
    funnelCalculator: funnelCalc,
    funnelFitcheck: funnelFit,
    counts: counts,
    forms: Object.keys(forms).map(function(k){ var o=forms[k]; var topErr=Object.keys(o.errFields).sort(function(a,b){return o.errFields[b]-o.errFields[a];})[0]||null; return { form:k, start:o.start, submit:o.submit, abandon:o.abandon, errors:o.errors, avgFillMs: o.fillN?Math.round(o.fillSum/o.fillN):null, topErrorField: topErr }; }),
    vitals: vitalsSummary
  });
};
