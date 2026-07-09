/* ═══════════════════════════════════════════════════════════════════
   metrics-rollup.js — nachtelijke rollup van events → daily_metrics.
   #6 schaal: draait dagelijks (Netlify scheduled function) en berekent
   per dag de kern-aggregaten voorbij, zodat het dashboard lange periodes
   uit één compacte tabel leest i.p.v. duizenden ruwe events te scannen.
   ───────────────────────────────────────────────────────────────────
   • Dag-grens op Europe/Brussels (consistent met admin-metrics).
   • Standaard: de afgelopen 3 dagen opnieuw berekenen (vangt late/na-
     komende events op). Idempotent: upsert op day-sleutel.
   • Inert-safe: zonder DB → 200 met { skipped:true }.
   Schedule staat in netlify.toml ([functions."metrics-rollup"].schedule).
═══════════════════════════════════════════════════════════════════ */
'use strict';
const store = require('./_lib/supabase.js');

const CONVERSIONS = ['contact_sent','demo_requested','fitcheck_completed','calculator_completed','report_sent'];

function localDay(x){
  try { return new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Brussels',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date(x)); }
  catch(e){ return String(x||'').slice(0,10); }
}
function channelOf(r){
  var s=(r.source||'').toLowerCase(), m=(r.medium||'').toLowerCase(), ref=(r.referrer||'').toLowerCase();
  if(m.indexOf('cpc')>=0||m.indexOf('paid')>=0||s.indexOf('ads')>=0) return 'Betaald';
  if(m==='email'||s==='email'||s==='e-mail') return 'E-mail';
  if(/google|bing|duckduckgo|ecosia|yahoo/.test(s+ref)) return 'Google';
  if(/linkedin/.test(s+ref)) return 'LinkedIn';
  if(/facebook|fb\./.test(s+ref)) return 'Facebook';
  if(/instagram/.test(s+ref)) return 'Instagram';
  if(ref) return 'Verwijzend';
  return 'Direct';
}

async function rollupDays(nDays){
  // haal ruime venster events (nDays + marge) en groepeer per lokale dag
  const sinceIso = new Date(Date.now() - (nDays+1)*86400000).toISOString();
  const rows = await store.listEvents(sinceIso, 50000);
  const days = {};
  const targetDays = {};
  for(let i=0;i<nDays;i++) targetDays[localDay(Date.now()-i*86400000)] = 1;

  rows.forEach(function(r){
    const day = localDay(r.created_at);
    if(!targetDays[day]) return;
    const D = days[day] || (days[day] = { sessions:{}, visitors:{}, pv:0, conv:0, bySrc:{}, byDev:{}, byCountry:{} });
    if(r.name==='page_view') D.pv++;
    if(r.session_id){
      const S = D.sessions[r.session_id] || (D.sessions[r.session_id] = { pv:0, min:r.created_at, max:r.created_at, first:r, conv:false });
      if(r.name==='page_view') S.pv++;
      if(r.created_at < S.min){ S.min=r.created_at; S.first=r; }
      if(r.created_at > S.max) S.max=r.created_at;
      if(CONVERSIONS.indexOf(r.name)>=0){ S.conv=true; }
    }
    if(r.visitor_hash) D.visitors[r.visitor_hash]=1;
  });

  const written = [];
  for(const day of Object.keys(days)){
    const D = days[day];
    const sids = Object.keys(D.sessions);
    let bounces=0, durSum=0, durN=0, conv=0;
    const bySrc={}, byDev={}, byCountry={};
    sids.forEach(function(id){
      const S=D.sessions[id];
      if(S.pv<=1) bounces++;
      const d=new Date(S.max)-new Date(S.min); if(d>0){ durSum+=d; durN++; }
      const cvd = S.conv?1:0; conv+=cvd;
      const ch=channelOf(S.first); (bySrc[ch]||(bySrc[ch]={sessions:0,conversions:0})).sessions++; if(cvd) bySrc[ch].conversions++;
      const dev=S.first.device||'onbekend'; (byDev[dev]||(byDev[dev]={sessions:0,conversions:0})).sessions++; if(cvd) byDev[dev].conversions++;
      if(S.first.country){ (byCountry[S.first.country]||(byCountry[S.first.country]={sessions:0,conversions:0})).sessions++; if(cvd) byCountry[S.first.country].conversions++; }
    });
    await store.upsertDailyMetric({
      day: day,
      pageviews: D.pv,
      visitors: Object.keys(D.visitors).length,
      sessions: sids.length,
      bounces: bounces,
      avg_session_ms: durN ? Math.round(durSum/durN) : 0,
      conversions: conv,
      by_source: bySrc,
      by_device: byDev,
      by_country: byCountry
    });
    written.push(day);
  }
  return written;
}

exports.handler = async (event) => {
  if (!store.isConfigured()) return { statusCode:200, body: JSON.stringify({ skipped:true, reason:'db-not-configured' }) };
  try {
    // handmatige trigger mag ?days= meegeven; scheduled → 3
    let nDays = 3;
    try { const q = (event && event.queryStringParameters) || {}; if(q.days) nDays = Math.max(1, Math.min(90, parseInt(q.days,10)||3)); } catch(e){}
    const written = await rollupDays(nDays);
    return { statusCode:200, body: JSON.stringify({ ok:true, days: written }) };
  } catch (e) {
    return { statusCode:500, body: JSON.stringify({ error: String(e.message||e) }) };
  }
};
