/* ═══════════════════════════════════════════════════════════════════
   Montisoro — E-mailtemplates (FASE 2)
   Branded, responsive (table-based, inline styles) HTML e-mails.
   ───────────────────────────────────────────────────────────────────
   Used by:  netlify/functions/_lib/mailer.js  (server-side)
   Preview:  website/documents/emails/emails-preview.html
   Works in Browser (window.MONTISORO_EMAILS) and Node (module.exports).

   API
     MONTISORO_EMAILS.customer({ lang, meta, vars, assetBase, ctaUrl })
        -> { subject, html, text }
     MONTISORO_EMAILS.internal({ lang, meta, vars, contact, assetBase, dashboardUrl, status })
        -> { subject, html, text }

   assetBase : URL-prefix for images, e.g. 'https://montisoro.com'
               (preview passes '../..' so the logo loads locally)
═══════════════════════════════════════════════════════════════════ */
(function (root, factory) {
  var api = factory();
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (root) root.MONTISORO_EMAILS = api;
})(typeof window !== 'undefined' ? window : null, function () {
  'use strict';

  var C = {
    bg:'#13100D', deep:'#0C0905', ink:'#1a1512', soft:'#5c534b', mute:'#8a8078',
    page:'#FBFAF8', card:'#ffffff', line:'#e7e2db',
    orange:'#E8592B', orangeSoft:'#FAE8E1', off:'#F0EDE8', offMute:'rgba(240,237,232,0.62)',
    serif:"'Playfair Display', Georgia, serif",
    sans:"-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif"
  };

  var T = {
    nl: {
      preheader_customer: 'Uw persoonlijk verzuimrapport zit in bijlage.',
      subject_customer: 'Uw verzuimrapport van Montisoro',
      greeting: function (n) { return 'Beste' + (n ? ' ' + n : '') + ','; },
      c_intro: 'Bedankt voor het invullen van de Montisoro verzuimcalculator. Uw persoonlijk rapport zit als PDF in bijlage bij deze e-mail.',
      c_intro_nopdf: 'Bedankt voor het invullen van de Montisoro verzuimcalculator. Uw aanvraag is ontvangen \u2014 uw persoonlijk verzuimrapport ontvangt u zo snel mogelijk per e-mail.',
      c_contains: 'Het rapport bevat:',
      c_b1: 'De geschatte jaarlijkse kost van verzuim',
      c_b2: 'De verborgen en indirecte impact',
      c_b3: 'Een benchmark met het sectorgemiddelde en uw risiconiveau',
      c_b4: 'Concrete besparingsscenario\u2019s en prioriteiten',
      c_snapshot: 'Uw kerncijfer',
      c_snapshot_lbl: 'Geschatte jaarlijkse verzuimkost',
      c_risk_lbl: 'Risiconiveau',
      c_indicative: 'Dit is een indicatieve analyse op basis van de door u ingevoerde gegevens — geen bindend advies.',
      c_cta_intro: 'Wilt u weten wat deze cijfers concreet voor uw organisatie betekenen?',
      c_cta_btn: 'Plan een gesprek',
      c_signoff: 'Met vriendelijke groet,',
      c_team: 'Het Montisoro-team',
      foot_tagline: 'Re-integrate What Matters',
      foot_rights: 'Dit bericht is verstuurd omdat u de verzuimcalculator invulde op montisoro.com.',
      foot_rights_booking: 'Dit bericht is verstuurd omdat u een afspraak boekte op montisoro.com.',
      // internal
      subject_internal: function (co, cost) { return 'Nieuwe calculator-aanvraag \u2014 ' + (co || 'onbekend bedrijf') + ' (' + cost + ')'; },
      i_title: 'Nieuwe calculator-aanvraag',
      i_sub: 'Een bezoeker heeft de verzuimcalculator volledig ingevuld en een rapport aangevraagd.',
      i_contact: 'Contactgegevens',
      i_results: 'Berekende resultaten',
      i_status: 'Status',
      l_name:'Naam', l_company:'Bedrijf', l_email:'E-mail', l_phone:'Telefoon', l_lang:'Taal bezoeker', l_consent:'Toestemming',
      l_annual:'Jaarlijkse verzuimkost', l_lost:'Verloren werkdagen', l_peremp:'Kost per medewerker',
      l_perday:'Kost per verloren dag', l_rate:'Verzuimpercentage', l_risk:'Risiconiveau',
      l_pdf:'PDF-status', l_lead:'Leadstatus', l_dash:'Open in dashboard',
      yes:'Ja', no:'Nee', dash_btn:'Bekijk aanvraag in dashboard',
      pdf_generated:'gegenereerd', pdf_failed:'mislukt', pdf_pending:'in behandeling',
      lead_new:'nieuw',
      c_dl_pre:'Opent de bijlage niet?', c_dl_link:'Download het rapport hier.',
      cc_greeting: function (n) { return 'Beste' + (n ? ' ' + n : '') + ','; },
      cc_signoff:'Met vriendelijke groet,', cc_team:'Het Montisoro-team',
      cc:{
        contact:{ subject:'We hebben uw bericht goed ontvangen', pre:'Uw bericht is bij ons binnen.', title:'Bericht ontvangen',
          intro:'Bedankt voor uw bericht. We nemen binnen één werkdag contact met u op.',
          note:'Heeft u in tussentijd een vraag? U mag gerust op deze e-mail antwoorden.', cta_url:'https://montisoro.com/aanpak.html', cta_btn:'Ontdek onze aanpak' },
        fitcheck:{ subject:'Bedankt — uw fit check is ontvangen', pre:'Uw fit check-resultaat is bij ons binnen.', title:'Fit check ontvangen',
          intro:'Bedankt voor het invullen van de fit check. Een Montisoro-adviseur bekijkt uw profiel en we nemen binnen één werkdag contact met u op met concrete vervolgstappen.',
          note:'Wilt u sneller schakelen? Plan gerust een vrijblijvend gesprek.', cta_url:'https://montisoro.com/contact.html#channels', cta_btn:'Plan een gesprek' },
        casey:{ subject:'U staat op de Casey-wachtlijst', pre:'U staat op de wachtlijst voor Casey AI.', title:'Welkom op de wachtlijst',
          intro:'Bedankt voor uw interesse in Casey AI. U staat op de wachtlijst — we houden u op de hoogte zodra de pilot opengaat (najaar 2026).',
          note:'We delen enkel relevante updates over Casey. Geen spam.', cta_url:'https://montisoro.com/technologie.html', cta_btn:'Meer over Casey' },
        gids:{ subject:'Uw RIT 3.0-werkgeversgids staat klaar', pre:'Uw download staat klaar — en komt ook per e-mail.', title:'Gids ontvangen',
          intro:'Bedankt voor uw interesse. Uw RIT 3.0-werkgeversgids is gedownload; bewaar deze e-mail zodat u de gids later opnieuw vindt.',
          note:'Vragen over re-integratie in uw organisatie? U mag gerust op deze e-mail antwoorden.', cta_url:'https://montisoro.com/calculator', cta_btn:'Bereken uw verzuimkost' }
      },
      bk:{
        subject: function(d){ return 'Uw afspraak is bevestigd \u2014 ' + d; },
        pre:'Uw afspraak is bevestigd.',
        title:'Afspraak bevestigd',
        intro:'Bedankt voor uw boeking. Hieronder vindt u de details van uw afspraak met Montisoro.',
        l_when:'Wanneer', l_type:'Type', l_where:'Locatie', l_duration:'Duur',
        duration_val:'30 minuten',
        online_type:'Online via Teams', onsite_type:'Bij u ter plaatse',
        online_loc:'Online via Microsoft Teams',
        online_note:'U ontvangt een aparte agenda-uitnodiging met de Teams-link.',
        onsite_note:'We komen naar het opgegeven adres. Zorg dat een rustige ruimte beschikbaar is.',
        add_cal:'Aan agenda toevoegen',
        reschedule:'Moet u verzetten of annuleren? Antwoord gerust op deze e-mail, dan plannen we samen een nieuw moment.'
      }
    },
    en: {
      preheader_customer: 'Your personal absence report is attached.',
      subject_customer: 'Your absence report from Montisoro',
      greeting: function (n) { return 'Dear' + (n ? ' ' + n : '') + ','; },
      c_intro: 'Thank you for completing the Montisoro absence calculator. Your personal report is attached to this email as a PDF.',
      c_intro_nopdf: 'Thank you for completing the Montisoro absence calculator. Your request has been received \u2014 you will receive your personal absence report by email as soon as possible.',
      c_contains: 'The report contains:',
      c_b1: 'The estimated annual cost of absence',
      c_b2: 'The hidden and indirect impact',
      c_b3: 'A benchmark against the sector average and your risk level',
      c_b4: 'Concrete savings scenarios and priorities',
      c_snapshot: 'Your headline figure',
      c_snapshot_lbl: 'Estimated annual absence cost',
      c_risk_lbl: 'Risk level',
      c_indicative: 'This is an indicative analysis based on the data you entered — not binding advice.',
      c_cta_intro: 'Want to know what these figures mean concretely for your organisation?',
      c_cta_btn: 'Schedule a call',
      c_signoff: 'Kind regards,',
      c_team: 'The Montisoro team',
      foot_tagline: 'Re-integrate What Matters',
      foot_rights: 'You received this message because you completed the absence calculator on montisoro.com.',
      foot_rights_booking: 'You received this message because you booked an appointment on montisoro.com.',
      // internal
      subject_internal: function (co, cost) { return 'New calculator request \u2014 ' + (co || 'unknown company') + ' (' + cost + ')'; },
      i_title: 'New calculator request',
      i_sub: 'A visitor completed the absence calculator and requested a report.',
      i_contact: 'Contact details',
      i_results: 'Calculated results',
      i_status: 'Status',
      l_name:'Name', l_company:'Company', l_email:'Email', l_phone:'Phone', l_lang:'Language', l_consent:'Consent',
      l_annual:'Annual absence cost', l_lost:'Lost working days', l_peremp:'Cost per employee',
      l_perday:'Cost per lost day', l_rate:'Absence rate', l_risk:'Risk level',
      l_pdf:'PDF status', l_lead:'Lead status', l_dash:'Open in dashboard',
      yes:'Yes', no:'No', dash_btn:'View request in dashboard',
      pdf_generated:'generated', pdf_failed:'failed', pdf_pending:'pending',
      lead_new:'new',
      c_dl_pre:'Can’t open the attachment?', c_dl_link:'Download the report here.',
      cc_greeting: function (n) { return 'Dear' + (n ? ' ' + n : '') + ','; },
      cc_signoff:'Kind regards,', cc_team:'The Montisoro team',
      cc:{
        contact:{ subject:'We’ve received your message', pre:'Your message has reached us.', title:'Message received',
          intro:'Thank you for your message. We’ll be in touch within one business day.',
          note:'Have a question in the meantime? Feel free to reply to this email.', cta_url:'https://montisoro.com/aanpak-en.html', cta_btn:'Discover our approach' },
        fitcheck:{ subject:'Thank you — your fit check was received', pre:'Your fit check result has reached us.', title:'Fit check received',
          intro:'Thank you for completing the fit check. A Montisoro advisor will review your profile and we’ll be in touch within one business day with concrete next steps.',
          note:'Want to move faster? Feel free to schedule a no-obligation call.', cta_url:'https://montisoro.com/contact-en.html#channels', cta_btn:'Schedule a call' },
        casey:{ subject:'You’re on the Casey waitlist', pre:'You’re on the Casey AI waitlist.', title:'Welcome to the waitlist',
          intro:'Thank you for your interest in Casey AI. You’re on the waitlist — we’ll let you know as soon as the pilot opens (autumn 2026).',
          note:'We only share relevant Casey updates. No spam.', cta_url:'https://montisoro.com/technologie-en.html', cta_btn:'More about Casey' },
        gids:{ subject:'Your RIT 3.0 employer guide is ready', pre:'Your download is ready — and is on its way by email too.', title:'Guide received',
          intro:'Thank you for your interest. Your RIT 3.0 employer guide has been downloaded; keep this email so you can find the guide again later.',
          note:'Questions about reintegration in your organisation? Feel free to reply to this email.', cta_url:'https://montisoro.com/calculator', cta_btn:'Calculate your absence cost' }
      },
      bk:{
        subject: function(d){ return 'Your appointment is confirmed \u2014 ' + d; },
        pre:'Your appointment is confirmed.',
        title:'Appointment confirmed',
        intro:'Thank you for your booking. Below are the details of your appointment with Montisoro.',
        l_when:'When', l_type:'Type', l_where:'Location', l_duration:'Duration',
        duration_val:'30 minutes',
        online_type:'Online via Teams', onsite_type:'On-site visit',
        online_loc:'Online via Microsoft Teams',
        online_note:'You’ll receive a separate calendar invite with the Teams link.',
        onsite_note:'We’ll come to the address provided. Please have a quiet room available.',
        add_cal:'Add to calendar',
        reschedule:'Need to reschedule or cancel? Just reply to this email and we’ll find a new moment together.'
      }
    }
  };

  function esc(s){ return String(s == null ? '' : s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

  function shell(opts){
    // opts: { lang, preheader, assetBase, bodyHtml }
    var banner = (opts.assetBase || '') + '/assets/email-banner-fit.jpg';
    return '' +
'<!DOCTYPE html><html lang="' + opts.lang + '" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office"><head><meta charset="utf-8">' +
'<meta name="viewport" content="width=device-width,initial-scale=1.0">' +
'<meta name="x-apple-disable-message-reformatting">' +
'<meta name="color-scheme" content="light dark">' +
'<meta name="supported-color-schemes" content="light dark">' +
'<title>Montisoro</title>' +
'<!--[if mso]><style>body,table,td,a,div,p,span{font-family:Helvetica,Arial,sans-serif !important;}</style><![endif]-->' +
'<style>:root{color-scheme:light dark;supported-color-schemes:light dark;}' +
'@media (prefers-color-scheme: dark){.m-body{background:#e9e5df !important;}.m-card{background:#ffffff !important;}}</style>' +
'</head>' +
'<body class="m-body" style="margin:0;padding:0;background:#e9e5df;font-family:' + C.sans + ';-webkit-text-size-adjust:100%;">' +
'<div style="display:none;max-height:0;overflow:hidden;opacity:0;mso-hide:all;">' + esc(opts.preheader) + '&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;</div>' +
'<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#e9e5df;padding:28px 12px;">' +
'<tr><td align="center">' +
'<!--[if mso]><table role="presentation" width="600" cellpadding="0" cellspacing="0"><tr><td><![endif]-->' +
'<table role="presentation" class="m-card" width="600" cellpadding="0" cellspacing="0" style="width:600px;max-width:600px;background:' + C.card + ';border-radius:14px;overflow:hidden;box-shadow:0 8px 28px rgba(0,0,0,0.10);">' +
  // header banner (branded — ReIntegrate What Matters), fills full height like footer
'<tr><td style="font-size:0;line-height:0;background:#000000;">' +
  '<img src="' + banner + '" alt="Montisoro — ReIntegrate What Matters" width="600" style="display:block;width:100%;max-width:600px;height:auto;border:0;">' +
'</td></tr>' +
  opts.bodyHtml +
'</table>' +
'<!--[if mso]></td></tr></table><![endif]-->' +
'</td></tr></table></body></html>';
  }

  /* Bulletproof CTA-knop (werkt in Outlook via bgcolor + mso-padding). */
  function button(url, label, bg, margin){
    bg = bg || C.orange; margin = margin || '0 0 30px';
    return '<table role="presentation" cellpadding="0" cellspacing="0" style="margin:' + margin + ';"><tr>' +
      '<td align="center" bgcolor="' + bg + '" style="border-radius:9px;background:' + bg + ';mso-padding-alt:0;">' +
      '<!--[if mso]>&nbsp;&nbsp;&nbsp;&nbsp;<![endif]-->' +
      '<a href="' + url + '" target="_blank" style="display:inline-block;padding:14px 26px;font-family:' + C.sans + ';font-size:13px;font-weight:700;color:#ffffff;text-decoration:none;letter-spacing:.02em;border-radius:9px;">' + label + ' \u2192</a>' +
      '<!--[if mso]>&nbsp;&nbsp;&nbsp;&nbsp;<![endif]-->' +
      '</td></tr></table>';
  }

  function footer(L, lang, assetBase, rights){
    var waves = (assetBase || '') + '/assets/email-footer-bg.png';
    rights = rights || L.foot_rights;
    return '' +
'<tr><td>' +
'<!--[if gte mso 9]><v:rect xmlns:v="urn:schemas-microsoft-com:vml" fill="true" stroke="false" style="width:600px;height:134px;"><v:fill type="frame" src="' + waves + '" color="' + C.deep + '" /><v:textbox inset="0,0,0,0"><![endif]-->' +
'<table role="presentation" width="100%" cellpadding="0" cellspacing="0" background="' + waves + '" bgcolor="' + C.deep + '" style="background-color:' + C.deep + ';background-image:url(' + waves + ');background-repeat:no-repeat;background-position:center;background-size:cover;"><tr><td height="134" style="height:134px;padding:0 36px;vertical-align:middle;">' +
  '<div style="font-family:' + C.sans + ';font-weight:500;font-size:14px;color:' + C.off + ';letter-spacing:.3em;text-transform:uppercase;">MONTISORO</div>' +
  '<div style="font-size:12px;color:' + C.offMute + ';margin-top:4px;font-style:italic;">' + L.foot_tagline + '</div>' +
  '<div style="height:16px;"></div>' +
  '<div style="font-size:12px;color:' + C.off + ';">' +
    '<a href="mailto:hello@montisoro.com" style="color:' + C.off + ';text-decoration:none;">hello@montisoro.com</a>' +
    '&nbsp;&nbsp;\u00b7&nbsp;&nbsp;' +
    '<a href="https://montisoro.com" style="color:' + C.off + ';text-decoration:none;">montisoro.com</a>' +
  '</div>' +
  '<div style="font-size:10.5px;color:' + C.offMute + ';margin-top:14px;line-height:1.5;">' + rights + '</div>' +
'</td></tr></table>' +
'<!--[if gte mso 9]></v:textbox></v:rect><![endif]-->' +
'</td></tr>';
  }

  /* ── CUSTOMER EMAIL ───────────────────────────────────────────── */
  function customer(o){
    var lang = (o.lang === 'en') ? 'en' : 'nl';
    var L = T[lang]; var v = o.vars || {}; var m = o.meta || {};
    var hasPdf = !!o.pdfUrl; /* true = PDF in bijlage/download link beschikbaar */
    var ctaUrl = o.ctaUrl || (lang === 'en' ? 'https://montisoro.com/contact-en.html#channels' : 'https://montisoro.com/contact.html#channels');
    var bullets = [L.c_b1, L.c_b2, L.c_b3, L.c_b4].map(function(b){
      return '<tr><td valign="top" style="padding:4px 10px 4px 0;color:' + C.orange + ';font-weight:700;">\u2022</td>' +
             '<td valign="top" style="padding:4px 0;font-size:14px;color:' + C.soft + ';line-height:1.55;">' + b + '</td></tr>';
    }).join('');

    var dl = o.pdfUrl
      ? '<p style="margin:0 0 18px;font-size:13px;line-height:1.6;color:' + C.soft + ';">' + L.c_dl_pre +
        ' <a href="' + o.pdfUrl + '" style="color:' + C.orange + ';font-weight:600;text-decoration:none;">' + L.c_dl_link + '</a></p>'
      : '';

    /* Extra metrics row when no PDF — bezoeker krijgt toch volledige data */
    var extraMetrics = !hasPdf
      ? '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 20px;">' +
        (v.lost_workdays ? '<tr><td style="font-size:13px;color:' + C.soft + ';padding:4px 0;">Verloren werkdagen</td><td style="font-size:13px;color:' + C.ink + ';font-weight:600;text-align:right;">' + esc(v.lost_workdays) + '</td></tr>' : '') +
        (v.cost_per_employee ? '<tr><td style="font-size:13px;color:' + C.soft + ';padding:4px 0;">Kost per medewerker</td><td style="font-size:13px;color:' + C.ink + ';font-weight:600;text-align:right;">' + esc(v.cost_per_employee) + '</td></tr>' : '') +
        (v.cost_per_lost_day ? '<tr><td style="font-size:13px;color:' + C.soft + ';padding:4px 0;">Kost per verloren dag</td><td style="font-size:13px;color:' + C.ink + ';font-weight:600;text-align:right;">' + esc(v.cost_per_lost_day) + '</td></tr>' : '') +
        '</table>'
      : '';

    var intro = hasPdf ? L.c_intro : (L.c_intro_nopdf || L.c_intro);

    var body =
'<tr><td style="padding:34px 36px 8px;">' +
  '<p style="margin:0 0 16px;font-size:15px;color:' + C.ink + ';font-weight:600;">' + esc(L.greeting(m.name)) + '</p>' +
  '<p style="margin:0 0 18px;font-size:14px;line-height:1.7;color:' + C.soft + ';">' + intro + '</p>' +
  dl +
  extraMetrics +
  '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:' + C.bg + ';border-radius:12px;margin:6px 0 22px;">' +
    '<tr><td style="padding:22px 24px;">' +
      '<div style="font-size:10.5px;letter-spacing:.12em;text-transform:uppercase;color:' + C.orange + ';font-weight:700;">' + L.c_snapshot_lbl + '</div>' +
      '<div style="font-family:' + C.serif + ';font-weight:700;font-size:34px;color:#ffffff;margin-top:8px;letter-spacing:-.02em;">' + esc(v.annual_absence_cost || '') + '</div>' +
      '<div style="font-size:12.5px;color:' + C.offMute + ';margin-top:10px;">' + L.c_risk_lbl + ': <span style="color:' + C.off + ';font-weight:600;">' + esc(v.risk_level || '') + '</span></div>' +
    '</td></tr>' +
  '</table>' +
  '<p style="margin:0 0 8px;font-size:14px;color:' + C.ink + ';font-weight:600;">' + L.c_contains + '</p>' +
  '<table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 0 22px;">' + bullets + '</table>' +
  '<p style="margin:0 0 24px;font-size:12.5px;line-height:1.6;color:' + C.mute + ';font-style:italic;">' + L.c_indicative + '</p>' +
  // CTA
  '<p style="margin:0 0 16px;font-size:14px;line-height:1.7;color:' + C.soft + ';">' + L.c_cta_intro + '</p>' +
  button(ctaUrl, L.c_cta_btn) +
  '<p style="margin:0;font-size:14px;color:' + C.soft + ';">' + L.c_signoff + '<br><span style="color:' + C.ink + ';font-weight:600;">' + L.c_team + '</span></p>' +
'</td></tr>' +
'<tr><td style="height:30px;"></td></tr>' +
footer(L, lang, o.assetBase);

    var text = L.greeting(m.name) + '\n\n' + L.c_intro + '\n\n' +
      L.c_snapshot_lbl + ': ' + (v.annual_absence_cost || '') + '\n' +
      L.c_risk_lbl + ': ' + (v.risk_level || '') + '\n\n' +
      L.c_cta_intro + '\n' + ctaUrl + '\n\n' + L.c_signoff + ' ' + L.c_team +
      '\n\nhello@montisoro.com · montisoro.com';

    return { subject: L.subject_customer, html: shell({ lang:lang, preheader:L.preheader_customer, assetBase:o.assetBase, bodyHtml:body }), text:text };
  }

  /* ── INTERNAL EMAIL ───────────────────────────────────────────── */
  function internal(o){
    // Internal notification is ALWAYS Dutch (the team is Dutch-speaking); the
    // visitor's own language is surfaced in the "Taal bezoeker" row below.
    var viewerLang = (o.lang === 'en') ? 'en' : 'nl';
    var lang = 'nl';
    var L = T[lang]; var v = o.vars || {}; var m = o.meta || {}; var ct = o.contact || {};
    var st = o.status || {};
    var pdfTxt = st.pdf === 'generated' ? L.pdf_generated : (st.pdf === 'failed' ? L.pdf_failed : L.pdf_pending);
    var pdfColor = st.pdf === 'generated' ? C.orange : (st.pdf === 'failed' ? '#c0392b' : C.mute);

    function row(lbl, val, strong){
      return '<tr>' +
        '<td style="padding:9px 0;border-bottom:1px solid ' + C.line + ';font-size:12px;color:' + C.mute + ';width:42%;">' + lbl + '</td>' +
        '<td style="padding:9px 0;border-bottom:1px solid ' + C.line + ';font-size:13px;color:' + C.ink + ';font-weight:' + (strong ? '700' : '500') + ';">' + esc(val || '\u2014') + '</td>' +
      '</tr>';
    }
    function sectionHead(t){
      return '<tr><td colspan="2" style="padding:20px 0 6px;font-size:10.5px;letter-spacing:.12em;text-transform:uppercase;color:' + C.orange + ';font-weight:700;">' + t + '</td></tr>';
    }

    var dashBtn = o.dashboardUrl
      ? button(o.dashboardUrl, L.dash_btn, C.bg, '24px 0 0')
      : '';

    var body =
'<tr><td style="padding:30px 36px 8px;">' +
  '<div style="font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:' + C.orange + ';font-weight:700;">' + L.i_title + '</div>' +
  '<p style="margin:8px 0 6px;font-size:14px;line-height:1.6;color:' + C.soft + ';">' + L.i_sub + '</p>' +
  '<table role="presentation" width="100%" cellpadding="0" cellspacing="0">' +
    sectionHead(L.i_contact) +
    row(L.l_name, ct.name) + row(L.l_company, ct.company) + row(L.l_email, ct.email) +
    row(L.l_phone, ct.phone) + row(L.l_lang, viewerLang === 'en' ? 'Engels (EN)' : 'Nederlands (NL)') + row(L.l_consent, ct.consent ? L.yes : L.no) +
    sectionHead(L.i_results) +
    row(L.l_annual, v.annual_absence_cost, true) + row(L.l_lost, v.lost_workdays) +
    row(L.l_peremp, v.cost_per_employee) + row(L.l_perday, v.cost_per_lost_day) +
    row(L.l_rate, v.absence_rate) + row(L.l_risk, v.risk_level, true) +
    sectionHead(L.i_status) +
    '<tr><td style="padding:9px 0;border-bottom:1px solid ' + C.line + ';font-size:12px;color:' + C.mute + ';">' + L.l_pdf + '</td>' +
    '<td style="padding:9px 0;border-bottom:1px solid ' + C.line + ';font-size:13px;color:' + pdfColor + ';font-weight:700;text-transform:capitalize;">' + pdfTxt + '</td></tr>' +
    row(L.l_lead, st.lead || L.lead_new) +
  '</table>' +
  dashBtn +
'</td></tr>' +
'<tr><td style="height:30px;"></td></tr>' +
footer(L, lang, o.assetBase);

    var subj = L.subject_internal(ct.company, v.annual_absence_cost || '');
    var text = L.i_title + '\n' +
      L.l_name + ': ' + (ct.name||'') + '\n' + L.l_company + ': ' + (ct.company||'') + '\n' +
      L.l_email + ': ' + (ct.email||'') + '\n' + L.l_phone + ': ' + (ct.phone||'') + '\n' +
      L.l_annual + ': ' + (v.annual_absence_cost||'') + '\n' + L.l_risk + ': ' + (v.risk_level||'') + '\n' +
      L.l_pdf + ': ' + pdfTxt + (o.dashboardUrl ? '\n' + o.dashboardUrl : '');

    return { subject: subj, html: shell({ lang:lang, preheader:L.i_title, assetBase:o.assetBase, bodyHtml:body }), text:text };
  }

  /* ── GENERIC FORM NOTIFICATION (intern) ───────────────────────
     Voor contact-, fit-check- en Casey-formulieren. Caller levert
     title + rows ([{label,value}]); rendert in de merk-shell. */
  function formInternal(o){
    // Internal notification is always Dutch — the team is Dutch-speaking.
    var lang = 'nl';
    var L = T[lang];
    var rows = (o.rows || []).map(function(r){
      return '<tr>' +
        '<td style="padding:9px 0;border-bottom:1px solid ' + C.line + ';font-size:12px;color:' + C.mute + ';width:38%;vertical-align:top;">' + esc(r.label) + '</td>' +
        '<td style="padding:9px 0;border-bottom:1px solid ' + C.line + ';font-size:13px;color:' + C.ink + ';font-weight:500;">' + esc(r.value || '\u2014') + '</td>' +
      '</tr>';
    }).join('');
    var body =
'<tr><td style="padding:30px 36px 8px;">' +
  '<div style="font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:' + C.orange + ';font-weight:700;">' + esc(o.title || '') + '</div>' +
  (o.intro ? '<p style="margin:8px 0 6px;font-size:14px;line-height:1.6;color:' + C.soft + ';">' + esc(o.intro) + '</p>' : '') +
  '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:8px;">' + rows + '</table>' +
'</td></tr>' +
'<tr><td style="height:30px;"></td></tr>' +
footer(L, lang, o.assetBase);
    var text = (o.title || '') + '\n\n' + (o.rows || []).map(function(r){ return r.label + ': ' + (r.value || '\u2014'); }).join('\n');
    return { html: shell({ lang:lang, preheader:o.title || '', assetBase:o.assetBase, bodyHtml:body }), text:text };
  }

  /* ── CUSTOMER CONFIRMATION (contact / fit-check / casey) ───────
     Korte, merkvaste bevestiging náar de bezoeker. Fit check krijgt rijke inhoud. */
  function customerConfirm(o){
    var lang = (o.lang === 'en') ? 'en' : 'nl';
    var L = T[lang]; var m = o.meta || {};
    var type = (['contact','fitcheck','casey','gids'].indexOf(o.type) >= 0) ? o.type : 'contact';
    var t = L.cc[type];
    var fc = o.fitcheck || null;

    /* Rich fit check block when full data available */
    var fitcheckBlock = '';
    if (type === 'fitcheck' && fc && fc.route) {
      var routeCard =
        '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:' + C.bg + ';border-radius:12px;margin:12px 0 20px;">'+
          '<tr><td style="padding:20px 24px;">'+
            '<div style="font-size:10px;letter-spacing:.12em;text-transform:uppercase;color:' + C.orange + ';font-weight:700;margin-bottom:8px;">' + (lang==='en'?'Your recommended route':'Uw aanbevolen route') + '</div>'+
            '<div style="font-family:' + C.serif + ';font-size:20px;color:#fff;font-weight:700;margin-bottom:6px;">' + esc(fc.route) + '</div>'+
            (fc.maturiteit ? '<div style="font-size:12px;color:' + C.offMute + ';">' + esc(fc.maturiteit) + (fc.schaal ? ' · ' + esc(fc.schaal) : '') + '</div>' : '')+
          '</td></tr>'+
        '</table>';
      var blocks = '';
      if (fc.herkenning) blocks +=
        '<div style="font-size:11px;letter-spacing:.10em;text-transform:uppercase;color:' + C.orange + ';font-weight:700;margin:16px 0 6px;">' + (lang==='en'?'Recognition':'Herkenning') + '</div>'+
        '<p style="margin:0 0 14px;font-size:13px;line-height:1.65;color:' + C.soft + ';">' + esc(fc.herkenning) + '</p>';
      if (fc.aanpak) blocks +=
        '<div style="font-size:11px;letter-spacing:.10em;text-transform:uppercase;color:' + C.orange + ';font-weight:700;margin:16px 0 6px;">' + (lang==='en'?'Approach':'Aanpak') + '</div>'+
        '<p style="margin:0 0 14px;font-size:13px;line-height:1.65;color:' + C.soft + ';">' + esc(fc.aanpak) + '</p>';
      fitcheckBlock = routeCard + blocks;
    }

    var ctaUrl = (type === 'fitcheck' && fc && fc.cta_type === 'deepdive')
      ? (lang === 'en' ? 'https://montisoro.com/contact-en.html#channels' : 'https://montisoro.com/contact.html#channels')
      : t.cta_url;

    var body =
'<tr><td style="padding:34px 36px 8px;">'+
  '<p style="margin:0 0 16px;font-size:15px;color:' + C.ink + ';font-weight:600;">' + esc(L.cc_greeting(m.name)) + '</p>'+
  '<div style="font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:' + C.orange + ';font-weight:700;">' + t.title + '</div>'+
  '<p style="margin:8px 0 18px;font-size:14px;line-height:1.7;color:' + C.soft + ';">' + t.intro + '</p>'+
  fitcheckBlock +
  '<p style="margin:0 0 24px;font-size:12.5px;line-height:1.6;color:' + C.mute + ';font-style:italic;">' + t.note + '</p>'+
  button(ctaUrl, t.cta_btn) +
  '<p style="margin:0;font-size:14px;color:' + C.soft + ';">' + L.cc_signoff + '<br><span style="color:' + C.ink + ';font-weight:600;">' + L.cc_team + '</span></p>'+
'</td></tr>'+
'<tr><td style="height:30px;"></td></tr>'+
footer(L, lang, o.assetBase);
    var text = L.cc_greeting(m.name) + '\n\n' + t.intro +
      (fc && fc.route ? '\n\nUw route: ' + fc.route : '') +
      (fc && fc.herkenning ? '\n\nHerkenning: ' + fc.herkenning : '') +
      '\n\n' + t.note + '\n\n' + t.cta_btn + ': ' + ctaUrl +
      '\n\n' + L.cc_signoff + ' ' + L.cc_team + '\n\nhello@montisoro.com · montisoro.com';
    return { subject: t.subject, html: shell({ lang:lang, preheader:t.pre, assetBase:o.assetBase, bodyHtml:body }), text:text };
  }

  /* ── BOOKING CONFIRMATION (afspraak — naar de bezoeker) ────────
     o: { lang, meta:{name}, booking:{ type:'online'|'onsite', date, time, endTime, location }, assetBase, icsUrl } */
  function bookingConfirm(o){
    var lang = (o.lang === 'en') ? 'en' : 'nl';
    var L = T[lang]; var m = o.meta || {}; var b = o.booking || {}; var B = L.bk;
    var isOnline = b.type !== 'onsite';
    var typeLabel = isOnline ? B.online_type : B.onsite_type;
    var whenStr = (b.date || '') + (b.time ? ' \u00b7 ' + b.time + (b.endTime ? '\u2013' + b.endTime : '') : '');
    var loc = isOnline ? B.online_loc : (b.location || '');
    var note = isOnline ? B.online_note : B.onsite_note;
    function drow(lbl, val){ return '<tr><td style="padding:7px 0;font-size:12px;color:' + C.offMute + ';width:34%;vertical-align:top;">' + lbl + '</td>' +
      '<td style="padding:7px 0;font-size:13px;color:' + C.off + ';font-weight:600;">' + esc(val || '\u2014') + '</td></tr>'; }
    var card =
      '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:' + C.bg + ';border-radius:12px;margin:6px 0 20px;">' +
        '<tr><td style="padding:22px 24px;">' +
          '<div style="font-size:10.5px;letter-spacing:.12em;text-transform:uppercase;color:' + C.orange + ';font-weight:700;">' + B.l_when + '</div>' +
          '<div style="font-family:' + C.serif + ';font-weight:700;font-size:26px;color:#ffffff;margin:8px 0 14px;letter-spacing:-.02em;">' + esc(whenStr) + '</div>' +
          '<table role="presentation" width="100%" cellpadding="0" cellspacing="0">' +
            drow(B.l_type, typeLabel) + drow(B.l_where, loc) + drow(B.l_duration, B.duration_val) +
          '</table>' +
        '</td></tr>' +
      '</table>';
    var addCal = o.icsUrl ? button(o.icsUrl, B.add_cal) : '';
    var body =
'<tr><td style="padding:34px 36px 8px;">' +
  '<p style="margin:0 0 16px;font-size:15px;color:' + C.ink + ';font-weight:600;">' + esc(L.cc_greeting(m.name)) + '</p>' +
  '<div style="font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:' + C.orange + ';font-weight:700;">' + B.title + '</div>' +
  '<p style="margin:8px 0 18px;font-size:14px;line-height:1.7;color:' + C.soft + ';">' + B.intro + '</p>' +
  card +
  '<p style="margin:0 0 22px;font-size:12.5px;line-height:1.6;color:' + C.mute + ';">' + note + '</p>' +
  addCal +
  '<p style="margin:0 0 22px;font-size:12.5px;line-height:1.6;color:' + C.mute + ';font-style:italic;">' + B.reschedule + '</p>' +
  '<p style="margin:0;font-size:14px;color:' + C.soft + ';">' + L.cc_signoff + '<br><span style="color:' + C.ink + ';font-weight:600;">' + L.cc_team + '</span></p>' +
'</td></tr>' +
'<tr><td style="height:30px;"></td></tr>' +
footer(L, lang, o.assetBase, L.foot_rights_booking);
    var text = L.cc_greeting(m.name) + '\n\n' + B.intro + '\n\n' +
      B.l_when + ': ' + whenStr + '\n' + B.l_type + ': ' + typeLabel + '\n' + B.l_where + ': ' + loc + '\n' + B.l_duration + ': ' + B.duration_val +
      '\n\n' + note + '\n\n' + L.cc_signoff + ' ' + L.cc_team + '\n\nhello@montisoro.com · montisoro.com';
    return { subject: B.subject(b.date || ''), html: shell({ lang:lang, preheader:B.pre, assetBase:o.assetBase, bodyHtml:body }), text:text };
  }

  return { customer: customer, internal: internal, formInternal: formInternal, customerConfirm: customerConfirm, bookingConfirm: bookingConfirm };
});
