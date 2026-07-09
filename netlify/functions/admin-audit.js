/* ═══════════════════════════════════════════════════════════════════
   admin-audit.js — Netlify Function (POST)
   Onverliesbare audit-trail in Supabase (tabel audit_log).
   HMAC-beveiligd (zelfde token als admin-auth). Acties:
     - list   → recente log-regels (default 200)
     - add    → nieuwe regel ({action, icon})
   Endpoint: /api/admin-audit
═══════════════════════════════════════════════════════════════════ */
'use strict';
const crypto = require('crypto');
const store  = require('./_lib/supabase.js');

const SECRET         = process.env.ADMIN_SESSION_SECRET || '';
const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN || '*';

function res(sc, body){
  return { statusCode: sc, headers: {
    'Content-Type':'application/json','Cache-Control':'no-store',
    'Access-Control-Allow-Origin':ALLOWED_ORIGIN,'Access-Control-Allow-Headers':'Content-Type','Access-Control-Allow-Methods':'POST, OPTIONS'
  }, body: JSON.stringify(body) };
}
function verify(token){
  if(!token||typeof token!=='string') return null;
  var dot=token.lastIndexOf('.'); if(dot<0) return null;
  var data=token.slice(0,dot), mac=token.slice(dot+1);
  var expected=crypto.createHmac('sha256',SECRET).update(data).digest('base64url');
  var ok=false; try{var a=Buffer.from(mac),b=Buffer.from(expected); ok=a.length===b.length&&crypto.timingSafeEqual(a,b);}catch(e){}
  if(!ok) return null;
  try{ var p=JSON.parse(Buffer.from(data,'base64url').toString('utf8')); if(!p||!p.exp||Date.now()>p.exp) return null; return p; }catch(e){ return null; }
}

exports.handler = async function(event){
  if(event.httpMethod==='OPTIONS') return res(200,{});
  if(event.httpMethod!=='POST') return res(405,{error:'method_not_allowed'});
  if(!SECRET) return res(503,{error:'auth_not_configured'});
  if(!store.isConfigured()) return res(503,{error:'db_not_configured'});

  let body; try{ body=JSON.parse(event.body||'{}'); }catch(e){ return res(400,{error:'bad_json'}); }
  var payload=verify(body.token); if(!payload) return res(401,{error:'unauthorized'});
  var action=body.action||'list';

  try{
    var db=store._db ? store._db() : null;
    if(action==='add'){
      if(!body.what) return res(400,{error:'missing_what'});
      await store.insertAudit({ actor: payload.email||'admin', action: String(body.what).slice(0,300), icon: body.icon||null });
      return res(200,{ok:true});
    }
    var rows=await store.listAudit(body.limit||200);
    return res(200,{ok:true, log:rows});
  }catch(e){ return res(500,{error:'db_error', detail:e.message}); }
};
