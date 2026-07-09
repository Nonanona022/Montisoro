/* ═══════════════════════════════════════════════════════════════════
   _lib/alerting.js — Delivery failure logger (server-side only)
   ───────────────────────────────────────────────────────────────────
   Writes delivery failures to Supabase `delivery_failures` table so:
   1. The admin dashboard can show a banner when emails are failing
   2. Ops can audit exactly which leads missed their email
   3. Future retry logic has a structured queue to work from

   Inert-safe: if Supabase isn't configured, failures are logged to
   console only (same behaviour as before this module existed).
═══════════════════════════════════════════════════════════════════ */
'use strict';
const store = require('./supabase.js');

/**
 * Log a delivery failure.
 * @param {object} opts
 * @param {string} opts.type       - 'email_internal' | 'email_confirm' | 'email_booking' | 'pdf'
 * @param {string} opts.recipient  - email address (or 'internal')
 * @param {string} opts.subject    - email subject or PDF name
 * @param {string} opts.error      - error message
 * @param {string} [opts.submission_id] - form_submissions.id or calculator_submissions.id
 */
async function logFailure(opts) {
  const record = {
    type:          opts.type          || 'unknown',
    recipient:     opts.recipient     || '',
    subject:       opts.subject       || '',
    error:         String(opts.error  || '').slice(0, 500),
    submission_id: opts.submission_id || null,
    created_at:    new Date().toISOString(),
    resolved:      false
  };

  /* Always log to console (visible in Netlify function logs) */
  console.error('[DELIVERY FAILURE]', JSON.stringify(record));

  /* Persist to Supabase if configured */
  if (!store.isConfigured()) return;
  try {
    await store.logDeliveryFailure(record);
  } catch (e) {
    console.error('[alerting] Could not persist failure record:', e.message);
  }
}

/**
 * List recent unresolved failures (for admin dashboard banner).
 * Returns [] if Supabase not configured.
 */
async function listFailures(limit) {
  if (!store.isConfigured()) return [];
  try {
    return await store.listDeliveryFailures(limit || 20);
  } catch (e) {
    console.error('[alerting] listFailures error:', e.message);
    return [];
  }
}

module.exports = { logFailure, listFailures };
