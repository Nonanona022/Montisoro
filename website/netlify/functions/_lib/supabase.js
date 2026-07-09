/* ═══════════════════════════════════════════════════════════════════
   _lib/supabase.js — persistence (Postgres + private Storage)
   Service-role client — SERVER-SIDE ONLY. Never expose this key.
═══════════════════════════════════════════════════════════════════ */
'use strict';
const { createClient } = require('@supabase/supabase-js');

const URL = process.env.SUPABASE_URL;
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const BUCKET = process.env.PDF_BUCKET || 'verzuimrapporten';

let client = null;
function db() {
  if (!client) client = createClient(URL, KEY, { auth: { persistSession: false } });
  return client;
}

/* Insert a submission row. Returns { id }. */
async function insertSubmission(record) {
  const { data, error } = await db()
    .from('calculator_submissions')
    .insert(record)
    .select('id')
    .single();
  if (error) throw new Error('DB insert failed: ' + error.message);
  return data;
}

/* Unique, sortable version stamp: YYYYMMDD-HHMMSS-rand (UTC). */
function versionStamp() {
  const d = new Date();
  const p = (n) => String(n).padStart(2, '0');
  return '' + d.getUTCFullYear() + p(d.getUTCMonth() + 1) + p(d.getUTCDate())
       + '-' + p(d.getUTCHours()) + p(d.getUTCMinutes()) + p(d.getUTCSeconds())
       + '-' + Math.random().toString(36).slice(2, 6);
}

/* Upload a PDF buffer to the private bucket; returns the storage path.
   VERSIONED: each (re)generation writes a NEW object under {year}/{id}/{stamp}.pdf
   with upsert:false, so a regeneration never overwrites the previous PDF (history
   is retained). The caller stores the returned path as the CURRENT pdf_path. */
async function uploadPdf(id, buffer) {
  const year = new Date().getFullYear();
  const pathInBucket = `${year}/${id}/${versionStamp()}.pdf`;
  const { error } = await db().storage
    .from(BUCKET)
    .upload(pathInBucket, buffer, { contentType: 'application/pdf', upsert: false });
  if (error) throw new Error('Storage upload failed: ' + error.message);
  return pathInBucket;
}

/* List stored PDF versions for a submission, newest-first (paths in the bucket).
   `year` defaults to the current year; pass the submission's created-year for
   reports (re)generated in a different year. Enables a future "PDF history" view. */
async function listPdfVersions(id, year) {
  const prefix = `${year || new Date().getFullYear()}/${id}`;
  const { data, error } = await db().storage
    .from(BUCKET)
    .list(prefix, { sortBy: { column: 'name', order: 'desc' } });
  if (error) throw new Error('Storage list failed: ' + error.message);
  return (data || []).map((o) => `${prefix}/${o.name}`);
}

/* Patch a submission (status updates, pdf_path, etc). */
async function patchSubmission(id, patch) {
  const { error } = await db().from('calculator_submissions').update(patch).eq('id', id);
  if (error) throw new Error('DB patch failed: ' + error.message);
}

/* List submissions newest-first (admin inbox read bridge). */
async function listSubmissions(limit) {
  const { data, error } = await db()
    .from('calculator_submissions')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit || 200);
  if (error) throw new Error('DB list failed: ' + error.message);
  return data || [];
}

/* ── Website ↔ dashboard read-bridge: public content managed in the admin ──
   Returns a { trusted_by, testimonials, calc_params } map. Missing keys are
   simply absent → the site falls back to its hardcoded data for those. */
async function getSiteContent() {
  const { data, error } = await db().from('site_content').select('key, data');
  if (error) throw new Error('site_content read failed: ' + error.message);
  const out = {};
  (data || []).forEach((r) => { out[r.key] = r.data; });
  return out;
}

/* Upsert one content key (admin write-path). */
async function setSiteContent(key, data, updatedBy) {
  const { error } = await db()
    .from('site_content')
    .upsert({ key, data, updated_at: new Date().toISOString(), updated_by: updatedBy || null }, { onConflict: 'key' });
  if (error) throw new Error('site_content write failed: ' + error.message);
}

/* Insert a light-form submission (contact / fitcheck / casey). Returns { id }. */
async function insertFormSubmission(record) {
  const { data, error } = await db()
    .from('form_submissions')
    .insert(record)
    .select('id')
    .single();
  if (error) throw new Error('Form DB insert failed: ' + error.message);
  return data;
}

/* Patch a light-form submission (delivery statuses, notes, lead_status). */
async function patchFormSubmission(id, patch) {
  const { error } = await db().from('form_submissions').update(patch).eq('id', id);
  if (error) throw new Error('Form DB patch failed: ' + error.message);
}

/* Create a time-limited signed URL for the admin download link. */
async function signedPdfUrl(pathInBucket, expiresSeconds = 60 * 60 * 24 * 7) {
  const { data, error } = await db().storage.from(BUCKET).createSignedUrl(pathInBucket, expiresSeconds);
  if (error) return null;
  return data.signedUrl;
}

/* Write a delivery failure record (email / PDF). */
async function logDeliveryFailure(record) {
  const { error } = await db().from('delivery_failures').insert(record);
  if (error) throw new Error('delivery_failures insert failed: ' + error.message);
}

/* List recent unresolved delivery failures (admin alert bridge). */
async function listDeliveryFailures(limit) {
  const { data, error } = await db()
    .from('delivery_failures')
    .select('*')
    .eq('resolved', false)
    .order('created_at', { ascending: false })
    .limit(limit || 20);
  if (error) throw new Error('delivery_failures list failed: ' + error.message);
  return data || [];
}

/* Mark a delivery failure as resolved. */
async function resolveFailure(id) {
  const { error } = await db()
    .from('delivery_failures')
    .update({ resolved: true, resolved_at: new Date().toISOString() })
    .eq('id', id);
  if (error) throw new Error('resolve failed: ' + error.message);
}

/* List form submissions (contact/fitcheck/casey/booking) newest-first. */
async function listFormSubmissions(limit) {
  const { data, error } = await db()
    .from('form_submissions')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit || 500);
  if (error) throw new Error('form_submissions list failed: ' + error.message);
  return data || [];
}

/* ── CRM Leads (migration 0006) ─────────────────────────────────── */

/* Insert a new lead. Returns { id }. */
async function insertLead(data) {
  const { data: row, error } = await db()
    .from('leads')
    .insert(data)
    .select('*')
    .single();
  if (error) throw new Error('Lead insert failed: ' + error.message);
  return row;
}

/* List leads newest-first. */
async function listLeads(limit) {
  const { data, error } = await db()
    .from('leads')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit || 500);
  if (error) throw new Error('Leads list failed: ' + error.message);
  return data || [];
}

/* Patch a lead (stage, notes, value, etc.). */
async function patchLead(id, patch) {
  const { error } = await db().from('leads').update(patch).eq('id', id);
  if (error) throw new Error('Lead patch failed: ' + error.message);
}

/* Hard-delete a lead. */
async function deleteLead(id) {
  const { error } = await db().from('leads').delete().eq('id', id);
  if (error) throw new Error('Lead delete failed: ' + error.message);
}

/* Hard-delete a record by table + id (GDPR Art. 17). Admin-only, called via admin-delete.js */
async function deleteRecord(table, id) {
  /* First fetch to get audit info */
  const { data: existing, error: fetchErr } = await db().from(table).select('id, email, created_at').eq('id', id).single();
  if (fetchErr || !existing) throw new Error('Record not found: ' + (fetchErr?.message || id));
  /* Delete */
  const { error: delErr } = await db().from(table).delete().eq('id', id);
  if (delErr) throw new Error('Delete failed: ' + delErr.message);
  return existing; /* return the deleted record's metadata for logging */
}

/* List audit log newest-first. */
async function listAudit(limit){
  const { data, error } = await db().from('audit_log').select('*').order('created_at',{ascending:false}).limit(limit||200);
  if (error) throw new Error('audit list failed: '+error.message);
  return data || [];
}
async function insertAudit(rec){
  const { error } = await db().from('audit_log').insert(rec);
  if (error) throw new Error('audit insert failed: '+error.message);
}

/* ── Admin users (migratie 0011 + 0015) — STAP 4 ─────────────────────
   E-mails worden door de aanroepers gelowercased (de unieke index staat op
   lower(email)); daarom matcht .eq('email', …) veilig zonder wildcard-risico. */
async function getUserByEmail(email){
  const { data, error } = await db().from('users').select('*').eq('email', email).limit(1).maybeSingle();
  if (error) throw new Error('user lookup failed: '+error.message);
  return data || null;
}
async function touchUserLogin(email){
  const { error } = await db().from('users').update({ last_login: new Date().toISOString() }).eq('email', email);
  if (error) throw new Error('user touch failed: '+error.message);
}
async function listUsers(){
  const { data, error } = await db().from('users')
    .select('id,created_at,updated_at,email,name,role,status,last_login,invited_by,mfa_enabled')
    .order('created_at',{ascending:true});
  if (error) throw new Error('users list failed: '+error.message);
  return data || [];
}
async function upsertUser(rec){
  const existing = await getUserByEmail(rec.email);
  if (existing){
    const { data, error } = await db().from('users').update(rec).eq('id', existing.id).select('*').single();
    if (error) throw new Error('user update failed: '+error.message);
    return data;
  }
  const { data, error } = await db().from('users').insert(rec).select('*').single();
  if (error) throw new Error('user insert failed: '+error.message);
  return data;
}
async function setUserPassword(email, passwordHash){
  const { error } = await db().from('users').update({ password_hash: passwordHash }).eq('email', email);
  if (error) throw new Error('set password failed: '+error.message);
}

/* ── Content-versies (migratie 0012) — STAP 5 (rollback) ────────────────
   Bij elke publish wordt een snapshot bewaard; de historie-lijst laat het
   zware 'data'-veld weg (alleen metadata), getContentVersion levert de volle
   payload voor een rollback. */
async function insertContentVersion(rec){
  const { error } = await db().from('content_versions').insert(rec);
  if (error) throw new Error('content_version insert failed: '+error.message);
}
async function listContentVersions(key, limit){
  const { data, error } = await db().from('content_versions')
    .select('id, created_at, key, published_by, note')
    .eq('key', key).order('created_at',{ascending:false}).limit(limit||20);
  if (error) throw new Error('content_versions list failed: '+error.message);
  return data || [];
}
async function getContentVersion(id){
  const { data, error } = await db().from('content_versions').select('*').eq('id', id).limit(1).maybeSingle();
  if (error) throw new Error('content_version get failed: '+error.message);
  return data || null;
}

async function listPageViews(sinceIso, limit){
  let q = db().from('page_views').select('path, referrer, lang, device, screen_w, created_at').order('created_at',{ascending:false}).limit(limit||20000);
  if (sinceIso) q = q.gte('created_at', sinceIso);
  const { data, error } = await q;
  if (error) throw new Error('page_views list failed: ' + error.message);
  return data || [];
}

async function insertPageView(record){
  const { error } = await db().from('page_views').insert(record);
  if (error) throw new Error('page_views insert failed: ' + error.message);
}

/* ── Analyse-module (migraties 0018/0019) — event-stroom + web vitals ── */
async function insertEvent(record){
  const { error } = await db().from('events').insert(record);
  if (error) throw new Error('events insert failed: ' + error.message);
}
async function insertWebVital(record){
  const { error } = await db().from('web_vitals').insert(record);
  if (error) throw new Error('web_vitals insert failed: ' + error.message);
}
async function listEvents(sinceIso, limit){
  let q = db().from('events')
    .select('session_id, visitor_hash, name, path, referrer, source, medium, campaign, lang, device, browser, country, meta, created_at')
    .order('created_at',{ascending:false}).limit(limit||50000);
  if (sinceIso) q = q.gte('created_at', sinceIso);
  const { data, error } = await q;
  if (error) throw new Error('events list failed: ' + error.message);
  return data || [];
}
async function listWebVitals(sinceIso, limit){
  let q = db().from('web_vitals')
    .select('path, metric, value, rating, device, created_at')
    .order('created_at',{ascending:false}).limit(limit||20000);
  if (sinceIso) q = q.gte('created_at', sinceIso);
  const { data, error } = await q;
  if (error) throw new Error('web_vitals list failed: ' + error.message);
  return data || [];
}

/* ── daily_metrics (migratie 0020) — nachtelijke rollup ──────────────
   #6 schaal: lange periodes worden uit deze voorberekende dagtabel gelezen
   i.p.v. telkens duizenden ruwe events te scannen. */
async function upsertDailyMetric(row){
  const rec = Object.assign({ updated_at: new Date().toISOString() }, row);
  const { error } = await db().from('daily_metrics').upsert(rec, { onConflict:'day' });
  if (error) throw new Error('daily_metrics upsert failed: ' + error.message);
}
async function listDailyMetrics(startDay, endDay){
  let q = db().from('daily_metrics').select('*').order('day',{ascending:true});
  if (startDay) q = q.gte('day', startDay);
  if (endDay)   q = q.lte('day', endDay);
  const { data, error } = await q;
  if (error) throw new Error('daily_metrics list failed: ' + error.message);
  return data || [];
}

/* ── GSC-koppeling (migratie 0022) — één-rij tabel id='default' ────────
   Bewaart de (versleutelde) Google Search Console OAuth-tokens + gekozen
   property. Service-role only (RLS zonder public policy). */
async function getGscConnection(){
  const { data, error } = await db().from('gsc_connection').select('*').eq('id','default').limit(1).maybeSingle();
  if (error) throw new Error('gsc_connection read failed: ' + error.message);
  return data || null;
}
async function setGscConnection(patch){
  const rec = Object.assign({ id:'default', updated_at: new Date().toISOString() }, patch);
  const { error } = await db().from('gsc_connection').upsert(rec, { onConflict:'id' });
  if (error) throw new Error('gsc_connection write failed: ' + error.message);
}
async function clearGscConnection(){
  const { error } = await db().from('gsc_connection').delete().eq('id','default');
  if (error) throw new Error('gsc_connection clear failed: ' + error.message);
}

module.exports = { insertPageView, listPageViews, insertSubmission, uploadPdf, listPdfVersions, patchSubmission, listSubmissions, insertFormSubmission, patchFormSubmission, signedPdfUrl, getSiteContent, setSiteContent, listFormSubmissions, logDeliveryFailure, listDeliveryFailures, resolveFailure, deleteRecord, insertLead, listLeads, patchLead, deleteLead, listAudit, insertAudit, getUserByEmail, touchUserLogin, listUsers, upsertUser, setUserPassword, insertContentVersion, listContentVersions, getContentVersion, insertEvent, insertWebVital, listEvents, listWebVitals, upsertDailyMetric, listDailyMetrics, getGscConnection, setGscConnection, clearGscConnection, isConfigured: () => !!(URL && KEY) };
