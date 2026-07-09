/* ═══════════════════════════════════════════════════════════════════
   _lib/graph.js — Microsoft Graph (M365 / Outlook) wrapper
   Leest vrij/bezet uit de agenda van de baas + maakt afspraken aan.
   SERVER-SIDE ONLY — het clientgeheim mag NOOIT in de website-code staan.

   "Klaar maar inert": zolang de 3 sleutels (MS_TENANT_ID / MS_CLIENT_ID /
   MS_CLIENT_SECRET) niet gezet zijn, is isConfigured() false en slaat de
   rest van de code dit netjes over (de site valt terug op het vaste
   weekschema). Zodra de env-vars staan → live, geen codewijziging nodig.

   Vereiste app-rechten (Application permissions, admin-consent):
     • Calendars.ReadWrite     (vrij/bezet lezen + event aanmaken)
     • OnlineMeetings.ReadWrite (Teams-link genereren)
═══════════════════════════════════════════════════════════════════ */
'use strict';

const TENANT   = process.env.MS_TENANT_ID;
const CLIENT   = process.env.MS_CLIENT_ID;
const SECRET   = process.env.MS_CLIENT_SECRET;
const CAL_USER = process.env.MS_CALENDAR_USER || 'laurence@montisoro.com';
const TZ       = process.env.MS_CALENDAR_TZ   || 'Europe/Brussels';

function isConfigured() {
  return !!(TENANT && CLIENT && SECRET && CAL_USER);
}

/* ── token (client-credentials), in-memory gecached tot vlak voor expiry ── */
let _token = null, _exp = 0;
async function getToken() {
  if (_token && Date.now() < _exp - 60000) return _token;
  const body = new URLSearchParams({
    client_id: CLIENT,
    client_secret: SECRET,
    scope: 'https://graph.microsoft.com/.default',
    grant_type: 'client_credentials'
  });
  const r = await fetch('https://login.microsoftonline.com/' + TENANT + '/oauth2/v2.0/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString()
  });
  const j = await r.json().catch(function () { return {}; });
  if (!r.ok) throw new Error('Graph token failed: ' + (j.error_description || j.error || r.status));
  _token = j.access_token;
  _exp = Date.now() + ((j.expires_in || 3600) * 1000);
  return _token;
}

async function graphFetch(path, opts) {
  opts = opts || {};
  const token = await getToken();
  const r = await fetch('https://graph.microsoft.com/v1.0' + path, {
    method: opts.method || 'GET',
    headers: Object.assign({
      Authorization: 'Bearer ' + token,
      'Content-Type': 'application/json',
      Prefer: 'outlook.timezone="' + TZ + '"'
    }, opts.headers || {}),
    body: opts.body
  });
  const txt = await r.text();
  const j = txt ? JSON.parse(txt) : {};
  if (!r.ok) throw new Error('Graph ' + path + ' failed: ' + ((j.error && j.error.message) || r.status));
  return j;
}

/* ── helpers ── */
function pad(n) { return String(n).padStart(2, '0'); }
function dayStr(dateStr) { var p = dateStr.split('-'); return p[0] + '-' + pad(+p[1]) + '-' + pad(+p[2]); }
function hhmm(t) { var p = t.split(':'); return pad(+p[0]) + ':' + pad(+p[1]); }

/* Welke van de gegeven slots ('H:MM') zijn bezet op die dag?
   Gebruikt Graph getSchedule (availabilityView): '0'=vrij, anders bezet. */
async function busyFor(dateStr, slotTimes) {
  if (!slotTimes.length) return new Set();
  var d = dayStr(dateStr);
  var j = await graphFetch('/users/' + encodeURIComponent(CAL_USER) + '/calendar/getSchedule', {
    method: 'POST',
    body: JSON.stringify({
      schedules: [CAL_USER],
      startTime: { dateTime: d + 'T08:00:00', timeZone: TZ },
      endTime:   { dateTime: d + 'T18:00:00', timeZone: TZ },
      availabilityViewInterval: 30
    })
  });
  var view = (j.value && j.value[0] && j.value[0].availabilityView) || '';
  var busy = new Set();
  slotTimes.forEach(function (t) {
    var p = t.split(':'); var idx = (((+p[0]) * 60 + (+p[1])) - 480) / 30; // vanaf 08:00, 30-min stappen
    var ch = view.charAt(idx);
    if (ch && ch !== '0') busy.add(t); // 0=free 1=tentative 2=busy 3=oof 4=workingElsewhere
  });
  return busy;
}

/* Maakt het agenda-item aan in de agenda van de baas.
   online → Teams-vergadering (join-link). onsite → adres als locatie.
   De bezoeker komt als genodigde → krijgt automatisch de Outlook-uitnodiging. */
async function createEvent(o) {
  var d = dayStr(o.dateStr);
  var ev = {
    subject: o.subject || 'Afspraak — Montisoro',
    body: { contentType: 'HTML', content: o.body || '' },
    start: { dateTime: d + 'T' + hhmm(o.time) + ':00', timeZone: TZ },
    end:   { dateTime: d + 'T' + hhmm(o.endTime) + ':00', timeZone: TZ },
    attendees: o.attendee && o.attendee.email
      ? [{ emailAddress: { address: o.attendee.email, name: o.attendee.name || o.attendee.email }, type: 'required' }]
      : []
  };
  if (o.type === 'online') {
    ev.isOnlineMeeting = true;
    ev.onlineMeetingProvider = 'teamsForBusiness';
  } else if (o.location) {
    ev.location = { displayName: o.location };
  }
  var j = await graphFetch('/users/' + encodeURIComponent(CAL_USER) + '/events', {
    method: 'POST',
    body: JSON.stringify(ev)
  });
  return {
    id: j.id || null,
    joinUrl: (j.onlineMeeting && j.onlineMeeting.joinUrl) || null,
    webLink: j.webLink || null
  };
}

module.exports = { isConfigured: isConfigured, busyFor: busyFor, createEvent: createEvent, CAL_USER: CAL_USER, TZ: TZ };
