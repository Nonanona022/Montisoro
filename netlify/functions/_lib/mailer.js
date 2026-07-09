/* ═══════════════════════════════════════════════════════════════════
   _lib/mailer.js — Resend wrapper (customer + internal mail)
   Uses the shared, branded templates from website/services/email-templates.js
═══════════════════════════════════════════════════════════════════ */
'use strict';
const { Resend } = require('resend');
const EMAILS = require('../../../website/services/email-templates.js');

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = process.env.MAIL_FROM || 'Montisoro <hello@montisoro.com>';
const INTERNAL = process.env.INTERNAL_NOTIFY_EMAIL || 'hello@montisoro.com';
const ASSET_BASE = process.env.SITE_BASE_URL || 'https://montisoro.com';

/* Customer mail WITH the PDF attached (+ optional signed download link as fallback). */
async function sendCustomer({ lang, meta, vars, pdfBuffer, pdfUrl }) {
  const mail = EMAILS.customer({ lang, meta, vars, assetBase: ASSET_BASE, pdfUrl });
  const attachments = pdfBuffer
    ? [{ filename: lang === 'en' ? 'Montisoro-absence-report.pdf' : 'Montisoro-verzuimrapport.pdf',
         content: pdfBuffer.toString('base64') }]
    : [];
  const { error } = await resend.emails.send({
    from: FROM, to: meta.email, replyTo: INTERNAL,
    subject: mail.subject, html: mail.html, text: mail.text, attachments
  });
  if (error) throw new Error('Customer mail failed: ' + (error.message || error));
}

/* Internal notification to hello@montisoro.com. */
async function sendInternal({ lang, vars, contact, status, dashboardUrl }) {
  const mail = EMAILS.internal({ lang, vars, contact, status, dashboardUrl, assetBase: ASSET_BASE });
  const { error } = await resend.emails.send({
    from: FROM, to: INTERNAL, replyTo: contact.email,
    subject: mail.subject, html: mail.html, text: mail.text
  });
  if (error) throw new Error('Internal mail failed: ' + (error.message || error));
}

/* Generieke interne notificatie voor contact / fit-check / Casey-formulieren. */
async function sendFormNotify({ lang, subject, title, intro, rows, replyTo }) {
  const mail = EMAILS.formInternal({ lang, title, intro, rows, assetBase: ASSET_BASE });
  const { error } = await resend.emails.send({
    from: FROM, to: INTERNAL, replyTo: replyTo || INTERNAL,
    subject: subject, html: mail.html, text: mail.text
  });
  if (error) throw new Error('Form notify failed: ' + (error.message || error));
}

/* Korte klantbevestiging voor contact / fit-check / Casey (geen PDF). */
async function sendCustomerConfirm({ lang, type, meta, fitcheck }) {
  const mail = EMAILS.customerConfirm({ lang, type, meta, fitcheck, assetBase: ASSET_BASE });
  /* Stap 4 — server-side override: admin-gepubliceerde e-mailteksten (subject) uit Supabase.
     Best-effort + fallback: zonder override blijft de hardcoded tekst staan. */
  try {
    const content = await require('./supabase.js').getSiteContent();
    const ov = content && content.email_templates && content.email_templates[type];
    if (ov) { const L = (lang === 'en' ? 'en' : 'nl'); if (ov['subject_' + L]) mail.subject = ov['subject_' + L]; }
  } catch (e) {}
  const { error } = await resend.emails.send({
    from: FROM, to: meta.email, replyTo: INTERNAL,
    subject: mail.subject, html: mail.html, text: mail.text
  });
  if (error) throw new Error('Customer confirm failed: ' + (error.message || error));
}

/* Afspraakbevestiging naar de bezoeker (booking-flow). */
async function sendBookingConfirm({ lang, meta, booking, icsUrl }) {
  const mail = EMAILS.bookingConfirm({ lang, meta, booking, icsUrl, assetBase: ASSET_BASE });
  const { error } = await resend.emails.send({
    from: FROM, to: meta.email, replyTo: INTERNAL,
    subject: mail.subject, html: mail.html, text: mail.text
  });
  if (error) throw new Error('Booking confirm failed: ' + (error.message || error));
}

module.exports = { sendCustomer, sendInternal, sendFormNotify, sendCustomerConfirm, sendBookingConfirm };
