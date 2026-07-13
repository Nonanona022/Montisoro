/* ═══════════════════════════════════════════════════════════════════
   form-submit.js — Netlify Function (POST)
   Generieke lead-ontvanger voor de site-formulieren (vervangt Web3Forms):
     • contact   — diagnosegesprek-aanvraag
     • fitcheck  — fit check-resultaat
     • casey     — Casey AI waitlist / pilootaanvraag
   Stuurt een interne notificatie via Resend (één bron: email-templates.js).
   E-mail-only (zoals de oude flow) — geen DB nodig voor deze lichte forms.
   Endpoint: /api/form-submit  (alias) of /.netlify/functions/form-submit
═══════════════════════════════════════════════════════════════════ */
'use strict';
const mailer  = require('./_lib/mailer.js');
const store   = require('./_lib/supabase.js');
const graph   = require('./_lib/graph.js');
const rl      = require('./_lib/rateLimit.js');
const alerting = require('./_lib/alerting.js');

const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN || '*';

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
const v = (x) => (x == null || x === '') ? '\u2014' : String(x);

/* Bouwt subject/title/intro/rows per type + taal. */
function build(type, lang, f) {
  const en = lang === 'en';
  if (type === 'contact') {
    return {
      subject: (en ? 'Diagnostic call — ' : 'Diagnosegesprek — ') + v(f.datum) + (f.tijdstip ? ' / ' + f.tijdstip : ''),
      title: en ? 'New diagnostic-call request' : 'Nieuwe afspraakaanvraag',
      intro: en ? 'A visitor requested a diagnostic call via the contact page.' : 'Een bezoeker vroeg een diagnosegesprek aan via de contactpagina.',
      rows: [
        { label: en ? 'Name' : 'Naam', value: f.name },
        { label: en ? 'Email' : 'E-mail', value: f.email },
        { label: en ? 'Organisation' : 'Organisatie', value: f.organisatie },
        { label: en ? 'Date' : 'Datum', value: f.datum },
        { label: en ? 'Time' : 'Tijdstip', value: f.tijdstip },
        { label: en ? 'Location' : 'Locatie', value: f.locatie },
        { label: en ? 'Address' : 'Adres', value: f.adres },
        { label: en ? 'Message' : 'Bericht', value: f.bericht }
      ]
    };
  }
  if (type === 'fitcheck') {
    return {
      subject: (en ? 'Fit check result — ' : 'Fit check resultaat — ') + v(f.route),
      title: en ? 'New fit check result' : 'Nieuw fit check-resultaat',
      intro: en ? 'A visitor completed the fit check.' : 'Een bezoeker voltooide de fit check.',
      rows: [
        { label: en ? 'Name' : 'Naam', value: f.name },
        { label: en ? 'Email' : 'E-mail', value: f.email },
        { label: en ? 'Organisation' : 'Organisatie', value: f.organisatie },
        { label: en ? 'Recommended route' : 'Aanbevolen route', value: f.route },
        { label: en ? 'Combination' : 'Combinatie', value: f.combination },
        { label: en ? 'Headline' : 'Headline', value: f.headline },
        { label: en ? 'Dominant tension' : 'Dominante spanning', value: f.dominante_spanning },
        { label: en ? 'Recommendation' : 'Aanbeveling', value: f.aanbeveling },
        { label: en ? 'Maturity' : 'Maturiteit', value: f.maturiteit },
        { label: en ? 'Scale' : 'Schaal', value: f.schaal },
        { label: en ? 'Absence type' : 'Verzuimtype', value: f.verzuimtype }
      ]
    };
  }
  if (type === 'booking') {
    return {
      subject: (en ? 'New booking — ' : 'Nieuwe afspraak — ') + v(f.datum) + (f.tijdstip ? ' / ' + f.tijdstip : ''),
      title: en ? 'New booking request' : 'Nieuwe afspraakaanvraag',
      intro: en ? 'A visitor booked an appointment via the website.' : 'Een bezoeker boekte een afspraak via de website.',
      rows: [
        { label: 'Type', value: f.afspraaktype_label || f.afspraaktype },
        { label: en ? 'Date' : 'Datum', value: f.datum },
        { label: en ? 'Time' : 'Tijd', value: f.tijdstip ? (f.tijdstip + (f.eindtijd ? ' – ' + f.eindtijd : '') + ' (30 min)') : '' },
        { label: en ? 'Location' : 'Locatie', value: f.locatie },
        { label: en ? 'Address' : 'Adres', value: f.adres },
        { label: en ? 'Name' : 'Naam', value: f.name },
        { label: en ? 'Email' : 'E-mail', value: f.email },
        { label: en ? 'Phone' : 'Telefoon', value: f.telefoon },
        { label: en ? 'Organisation' : 'Organisatie', value: f.organisatie },
        { label: en ? 'Message' : 'Bericht', value: f.bericht }
      ]
    };
  }
  if (type === 'gids') {
    return {
      subject: (en ? 'RIT 3.0 guide \u2014 new download' : 'RIT 3.0-gids \u2014 nieuwe download') + (f.newsletter === 'ja' || f.newsletter === true ? (en ? ' (+ newsletter)' : ' (+ nieuwsbrief)') : ''),
      title: en ? 'New RIT 3.0 guide download' : 'Nieuwe download RIT 3.0-gids',
      intro: en ? 'A visitor downloaded the RIT 3.0 employer guide via the landing page.' : 'Een bezoeker downloadde de RIT 3.0-werkgeversgids via de landingspagina.',
      rows: [
        { label: en ? 'Name' : 'Naam', value: f.name },
        { label: en ? 'Email' : 'E-mail', value: f.email },
        { label: en ? 'Organisation' : 'Organisatie', value: f.organisatie },
        { label: en ? 'Role' : 'Functie', value: f.functie },
        { label: en ? 'Newsletter opt-in' : 'Nieuwsbrief', value: (f.newsletter === 'ja' || f.newsletter === true) ? (en ? 'Yes' : 'Ja') : (en ? 'No' : 'Nee') },
        { label: en ? 'Source' : 'Bron', value: f.source || 'RIT 3.0-gids' }
      ]
    };
  }
  // casey
  return {
    subject: en ? 'Casey AI \u2014 new waitlist signup' : 'Casey AI \u2014 nieuwe waitlist-aanmelding',
    title: en ? 'New Casey AI waitlist signup' : 'Nieuwe Casey AI waitlist-aanmelding',
    intro: en ? 'A visitor signed up for the Casey AI pilot/waitlist.' : 'Een bezoeker schreef zich in voor de Casey AI pilot/wachtlijst.',
    rows: [
      { label: en ? 'Email' : 'E-mail', value: f.email },
      { label: en ? 'Source' : 'Bron', value: f.source || (en ? 'Technology page' : 'Technologie-pagina') }
    ]
  };
}

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return res(204, {});
  if (event.httpMethod !== 'POST') return res(405, { ok: false, error: 'method_not_allowed' });

  let payload;
  try { payload = JSON.parse(event.body || '{}'); }
  catch (e) { return res(400, { ok: false, error: 'bad_json' }); }

  if (payload.botcheck) return res(200, { ok: true });            // honeypot: stil slikken
  // rate-limit per IP (deze flows versturen e-mail) — anti-spam first layer
  const rlHit = rl.hit('form:' + rl.clientIp(event), 8, 60 * 1000);
  if (!rlHit.ok) return res(429, { ok: false, error: 'rate_limited', retry_after: rlHit.retryAfter });
  const type = payload.type;
  if (['contact', 'fitcheck', 'casey', 'booking', 'gids'].indexOf(type) === -1) return res(400, { ok: false, error: 'bad_type' });
  const lang = payload.lang === 'en' ? 'en' : 'nl';
  const f = payload.fields || {};
  if (!isEmail(f.email)) return res(400, { ok: false, error: 'invalid_email' });

  // ── persist FIRST (durable) so a Resend hiccup never loses the lead ──
  // Graceful: if Supabase isn't configured (inert/local), skip — e-mail still runs.
  let submissionId = null;
  if (store.isConfigured()) {
    try {
      const row = await store.insertFormSubmission({
        type: type, lang: lang,
        email: f.email,
        name: f.name || null,
        company: f.organisatie || null,
        fields: f,
        mail_status: 'pending', confirm_status: 'pending', lead_status: 'new'
      });
      submissionId = row.id;
    } catch (e) { console.error('[form-submit] DB insert failed:', e.message); }
  }

  const m = build(type, 'nl', f);   // interne notificatie ALTIJD in het NL (team is NL-talig)
  // de taal van de bezoeker bovenaan tonen zodat het team weet in welke taal te antwoorden
  m.rows.unshift({ label: 'Taal bezoeker', value: lang === 'en' ? 'Engels (EN)' : 'Nederlands (NL)' });

  let mailStatus = 'failed';
  try {
    await mailer.sendFormNotify({ lang: 'nl', subject: m.subject, title: m.title, intro: m.intro, rows: m.rows, replyTo: f.email });
    mailStatus = 'sent';
  } catch (e) {
    console.error('[form-submit] notify failed:', e.message);
    alerting.logFailure({ type: 'email_internal', recipient: 'internal', subject: m.subject, error: e.message, submission_id: submissionId }).catch(()=>{});
  }

  // ── afspraak: maak het echte agenda-item aan in Outlook (klaar maar inert) ──
  // Zolang Graph niet geconfigureerd is, wordt dit netjes overgeslagen.
  if (type === 'booking' && graph.isConfigured()) {
    try {
      await graph.createEvent({
        type: f.afspraaktype, dateStr: f.datum_iso || f.datum,
        time: f.tijdstip, endTime: f.eindtijd,
        subject: 'Kennismaking Montisoro \u2014 ' + (f.name || f.email),
        body: (f.bericht || ''),
        location: f.afspraaktype === 'onsite' ? f.adres : '',
        attendee: { email: f.email, name: f.name || '' }
      });
    } catch (e) { console.error('[form-submit] graph event failed:', e.message); }
  }

  // Klantbevestiging naar de bezoeker — wél in de taal van de bezoeker (contact / fitcheck / casey)
  let confirmStatus = 'failed';
  try {
    if (type === 'booking') {
      await mailer.sendBookingConfirm({ lang, meta: { name: f.name || '', email: f.email },
        booking: { type: f.afspraaktype, date: f.datum, time: f.tijdstip, endTime: f.eindtijd, location: f.locatie } });
    } else if (type === 'fitcheck') {
      await mailer.sendCustomerConfirm({ lang, type, meta: { name: f.name || '', email: f.email },
        fitcheck: {
          route: f.route || '',
          combination: f.combination || '',
          herkenning: f.herkenning || '',
          aanpak: f.aanpak || '',
          traject: f.traject || '',
          maturiteit: f.maturiteit || '',
          schaal: f.schaal || '',
          verzuimtype: f.verzuimtype || '',
          cta_type: f.cta_type || 'gesprek'
        }
      });
    } else {
      await mailer.sendCustomerConfirm({ lang, type, meta: { name: f.name || '', email: f.email } });
    }
    confirmStatus = 'sent';
  } catch (e) {
    console.error('[form-submit] confirm failed:', e.message);
    alerting.logFailure({ type: 'email_confirm', recipient: f.email, subject: 'Customer confirm — ' + type, error: e.message, submission_id: submissionId }).catch(()=>{});
  }

  // ── record delivery outcome on the stored row (so the team can see/retry) ──
  if (submissionId) {
    try { await store.patchFormSubmission(submissionId, { mail_status: mailStatus, confirm_status: confirmStatus }); }
    catch (e) { console.error('[form-submit] status patch failed:', e.message); }
  }

  return res(200, { ok: true, mail_status: mailStatus, confirm_status: confirmStatus });
};
