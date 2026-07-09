/* admin-analytics.js — verkeer-aggregaties uit page_views (cookieloze meting).
   HMAC-beveiligd (elke ingelogde rol). Inert-safe: 503 zonder secret/DB. */
'use strict';
const store = require('./_lib/supabase.js');
const { requireAuth } = require('./_lib/auth.js');
const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN || '*';
function res(statusCode, body){
  return { statusCode, headers:{ 'Content-Type':'application/json','Cache-Control':'no-store','Access-Control-Allow-Origin':ALLOWED_ORIGIN,'Access-Control-Allow-Headers':'Content-Type','Access-Control-Allow-Methods':'POST, OPTIONS' }, body: JSON.stringify(body) };
}
exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return res(204, {});
  if (event.httpMethod !== 'POST') return res(405, { ok:false, error:'method_not_allowed' });
  if (!process.env.ADMIN_SESSION_SECRET) return res(503, { ok:false, error:'auth_not_configured' });
  if (!store.isConfigured()) return res(503, { ok:false, error:'db_not_configured' });
  const auth = requireAuth(event);
  if (!auth.ok) return res(auth.status, { ok:false, error:auth.error });
  let body={}; try{ body=JSON.parse(event.body||'{}'); }catch(e){}
  let days = parseInt(body.days,10); if(!(days>0 && days<=365)) days=30;
  const since = new Date(Date.now() - days*86400000).toISOString();
  let rows;
  try { rows = await store.listPageViews(since, 20000); }
  catch(e){ console.error('[admin-analytics]', e.message); return res(502, { ok:false, error:'db_read_failed' }); }
  const byDay={}, byPath={}, bySource={}, byDevice={}, byLang={};
  rows.forEach(function(r){
    var day=(r.created_at||'').slice(0,10); if(day) byDay[day]=(byDay[day]||0)+1;
    if(r.path) byPath[r.path]=(byPath[r.path]||0)+1;
    var src=r.referrer||'direct'; bySource[src]=(bySource[src]||0)+1;
    var dev=r.device||'onbekend'; byDevice[dev]=(byDevice[dev]||0)+1;
    var lang=r.lang||'\u2014'; byLang[lang]=(byLang[lang]||0)+1;
  });
  function top(obj,n){ return Object.keys(obj).map(function(k){return {key:k,count:obj[k]};}).sort(function(a,b){return b.count-a.count;}).slice(0,n||10); }
  var daySeries=[];
  for(var i=days-1;i>=0;i--){ var d=new Date(Date.now()-i*86400000).toISOString().slice(0,10); daySeries.push({day:d, count:byDay[d]||0}); }
  return res(200, { ok:true, days:days, total:rows.length, byDay:daySeries, topPaths:top(byPath,12), sources:top(bySource,8), devices:top(byDevice,5), langs:top(byLang,5) });
};
