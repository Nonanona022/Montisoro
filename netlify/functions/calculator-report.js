/* ═══════════════════════════════════════════════════════════════════
   calculator-report.js — Netlify Function (POST)
   Orchestrates: validate → compute → PDF → store → mail (customer+internal)
   Every stage is isolated: a failure is recorded as a status, the user
   always gets a clean response, and Laurence is alerted on partial failure.
   Endpoint: /api/calculator-report  (alias) or /.netlify/functions/calculator-report
═══════════════════════════════════════════════════════════════════ */
'use strict';
const ENGINE = require('../../website/services/verzuim-engine.js');
const CALC_CONFIG = require('../../website/config/calculator-params.js');
ENGINE.applyConfig(CALC_CONFIG);   // server-side compute uses the same editable parameters
const pdf = require('./_lib/pdf.js');
const store = require('./_lib/supabase.js');
const mailer = require('./_lib/mailer.js');
const rl = require('./_lib/rateLimit.js');
const auth = require('./_lib/auth.js');

const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN || '*';
const ADMIN_BASE = process.env.ADMIN_BASE_URL || '';

function res(statusCode, body) {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Allow-Methods': 'POST, OPTIONS'
    },
    body: JSON.stringify(body)
  };
}

const isEmail = (s) => typeof s === 'string' && /^\S+@\S+\.\S+$/.test(s);

/* ── Admin action: regenerate / resend a stored report (P11) ─────────────────
   Authenticated & fully isolated from the public visitor flow. The admin report
   drawer POSTs { action:'regenerate'|'resend', id, email, lang, token }.
   Inert-safe: without Supabase configured → 503 (the admin falls back to a demo
   toast). Non-destructive mutation → same role allowlist as admin-pdf.js. */
async function adminAction(payload) {
  if (!store.isConfigured()) return res(503, { ok: false, error: 'db_not_configured' });
  const session = auth.verifyToken(payload.token);
  if (!session) return res(401, { ok: false, error: 'unauthorized' });
  if (!['admin', 'consultant', 'sales'].includes(session.role || '')) {
    return res(403, { ok: false, error: 'forbidden', detail: 'Insufficient role: ' + (session.role || 'unknown') });
  }
  const id = payload.id;
  if (!id) return res(400, { ok: false, error: 'missing_id' });

  let sub;
  try { sub = await store.getSubmission(id); }
  catch (e) { console.error('[calculator-report:admin] read failed:', e.message); return res(502, { ok: false, error: 'db_read_failed' }); }
  if (!sub) return res(404, { ok: false, error: 'submission_not_found' });

  const sLang = payload.lang === 'en' ? 'en' : (sub.lang || 'nl');
  const report = ENGINE.report(sub.input || {}, sLang);   // recompute from the STORED input
  const r = report.results;
  const meta = { name: sub.name || '', company: sub.company || '', email: payload.email || sub.email };

  // (Re)render the PDF from the stored input — a resend always ships a fresh copy.
  let pdfBuffer = null, pdfPath = null, pdfStatus = 'failed';
  try {
    pdfBuffer = await pdf.renderPdf({ lang: sLang, meta: { ...meta,
      company_name: sub.company || (sLang === 'en' ? 'Your organisation' : 'Uw organisatie'),
      report_date: new Date().toLocaleDateString(sLang === 'en' ? 'en-GB' : 'nl-BE', { day: 'numeric', month: 'long', year: 'numeric' }),
      lang_label: sLang === 'en' ? 'English' : 'Nederlands' },
      vars: report.vars, results: r });
    pdfStatus = 'generated';
    try { pdfPath = await store.uploadPdf(id, pdfBuffer); } catch (e) { console.error('[admin regen upload]', e.message); }
  } catch (e) { console.error('[admin regen pdf]', e.message); }

  let pdfUrl = '';
  if (pdfPath) { try { pdfUrl = await store.signedPdfUrl(pdfPath, 60 * 60 * 24 * 7) || ''; } catch (e) { console.error('[admin regen signed url]', e.message); } }

  if (payload.action === 'regenerate') {
    try { await store.patchSubmission(id, { pdf_status: pdfStatus, pdf_path: pdfPath }); } catch (e) { console.error('[admin regen patch]', e.message); }
    return res(200, { ok: pdfStatus === 'generated', action: 'regenerate', pdf_status: pdfStatus, pdf_url: pdfUrl });
  }

  // resend → mail the customer with the freshly rendered PDF.
  let mailStatus = 'failed';
  try { await mailer.sendCustomer({ lang: sLang, meta, vars: report.vars, pdfBuffer, pdfUrl }); mailStatus = 'sent'; }
  catch (e) { console.error('[admin resend mail]', e.message); }
  try { await store.patchSubmission(id, { pdf_status: pdfStatus, pdf_path: pdfPath, mail_status: mailStatus }); } catch (e) { console.error('[admin resend patch]', e.message); }
  return res(200, { ok: mailStatus === 'sent', action: 'resend', mail_status: mailStatus, pdf_url: pdfUrl });
}

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return res(204, {});
  if (event.httpMethod !== 'POST') return res(405, { ok: false, error: 'method_not_allowed' });

  // ── parse ──
  let payload;
  try { payload = JSON.parse(event.body || '{}'); }
  catch (e) { return res(400, { ok: false, error: 'bad_json' }); }

  const lang = payload.lang === 'en' ? 'en' : 'nl';
  const contact = payload.contact || {};
  const input = payload.input || {};

  // ── Admin regenerate / resend — authenticated, isolated from the public flow.
  //    Returns before any visitor logic (rate-limit, consent, honeypot). ──
  if (payload.action === 'regenerate' || payload.action === 'resend') {
    return await adminAction(payload);
  }

  // ── server-side validation + consent + honeypot ──
  if (payload.botcheck) return res(200, { ok: true });            // silently swallow bots

  // ── rate-limit the expensive Chromium render (per IP) — cost/DoS first layer ──
  const ip = rl.clientIp(event);
  const perMin = rl.hit('calc:m:' + ip, 5, 60 * 1000);
  const perHour = rl.hit('calc:h:' + ip, 30, 60 * 60 * 1000);
  if (!perMin.ok || !perHour.ok) return res(429, { ok: false, error: 'rate_limited', retry_after: Math.max(perMin.retryAfter, perHour.retryAfter) });

  if (!isEmail(contact.email)) return res(400, { ok: false, error: 'invalid_email' });
  if (contact.consent !== true) return res(400, { ok: false, error: 'consent_required' });

  // ── compute (pure, cannot fail) ──
  const report = ENGINE.report(input, lang);
  const r = report.results;
  const meta = { name: contact.name || '', company: contact.company || '', email: contact.email };

  // ── persist (row first, so we have an id even if later stages fail) ──
  let submissionId = null;
  const baseRecord = {
    lang, source: 'calculator',
    name: contact.name || null, company: contact.company || null,
    email: contact.email, phone: contact.phone || null, consent: true,
    input: report.input,
    annual_cost: Math.round(r.total), lost_workdays: r.lostDays,
    cost_per_employee: Math.round(r.perEmp), cost_per_lost_day: r.costPerDay,
    absence_rate: r.totVerz, risk_level: r.riskKey,
    pdf_status: 'pending', mail_status: 'pending', internal_mail_status: 'pending', lead_status: 'new'
  };
  try {
    const row = await store.insertSubmission(baseRecord);
    submissionId = row.id;
  } catch (e) {
    console.error('[calculator-report] DB insert failed:', e.message);
    // continue: we still try to email the customer so their effort isn't lost
  }

  // ── PDF ──
  let pdfBuffer = null, pdfStatus = 'failed', pdfPath = null;
  try {
    pdfBuffer = await pdf.renderPdf({ lang, meta: { ...meta,
      company_name: contact.company || (lang === 'en' ? 'Your organisation' : 'Uw organisatie'),
      report_date: new Date().toLocaleDateString(lang === 'en' ? 'en-GB' : 'nl-BE', { day: 'numeric', month: 'long', year: 'numeric' }),
      lang_label: lang === 'en' ? 'English' : 'Nederlands' },
      vars: report.vars, results: r });
    pdfStatus = 'generated';
    if (submissionId) { try { pdfPath = await store.uploadPdf(submissionId, pdfBuffer); } catch (e) { console.error('[pdf upload]', e.message); } }
  } catch (e) {
    console.error('[calculator-report] PDF failed:', e.message);
  }

  // signed download link (7 days) as a fallback if the attachment is stripped/unopened
  let pdfUrl = '';
  if (pdfPath) { try { pdfUrl = await store.signedPdfUrl(pdfPath, 60 * 60 * 24 * 7) || ''; } catch (e) { console.error('[signed url]', e.message); } }

  const dashboardUrl = (ADMIN_BASE && submissionId) ? `${ADMIN_BASE}/#forms?submission=${submissionId}` : '';

  // ── customer mail (with PDF if available) ──
  let mailStatus = 'failed';
  try {
    await mailer.sendCustomer({ lang, meta, vars: report.vars, pdfBuffer, pdfUrl });
    mailStatus = 'sent';
  } catch (e) { console.error('[calculator-report] customer mail failed:', e.message); }

  // ── internal mail ──
  let internalStatus = 'failed';
  try {
    await mailer.sendInternal({
      lang, vars: report.vars,
      contact: { ...contact, consent: true },
      status: { pdf: pdfStatus, lead: 'new' },
      dashboardUrl
    });
    internalStatus = 'sent';
  } catch (e) { console.error('[calculator-report] internal mail failed:', e.message); }

  // ── persist final statuses ──
  if (submissionId) {
    try { await store.patchSubmission(submissionId, {
      pdf_status: pdfStatus, pdf_path: pdfPath,
      mail_status: mailStatus, internal_mail_status: internalStatus
    }); } catch (e) { console.error('[status patch]', e.message); }
  }

  return res(200, {
    ok: true,
    submission_id: submissionId,
    pdf_status: pdfStatus,
    mail_status: mailStatus
  });
};
