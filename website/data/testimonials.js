/* Montisoro, referenties (Home: sectie "Referenties" → "Resultaten die spreken").
   De sectie verbergt zich automatisch zolang deze lijst leeg is.
   Vorm per klant: { id, company(=logo-tekst), logo(=afbeelding, optioneel),
                     role_nl/role_en(=sector · omvang, context), title_nl/title_en(=titel),
                     quote_nl/quote_en(=uitleg), link_nl/link_en(=case-pagina),
                     pdf(optioneel), order, active }
   ⚠️ Sector + omvang (role_*) spiegelen exact window.MONTISORO_CASES (cases.js) =
      dé bron van waarheid voor klantfeiten. Wijzig feiten dáár, niet enkel hier.
   → logo leeg? Dan toont de kaart de sectornaam (company) als serif-merkmerk. */
window.MONTISORO_TESTIMONIALS_SECTION = { enabled: true };
window.MONTISORO_TESTIMONIALS = [
  {
    id: 't1',
    company: 'Volvo Group',
    company_en: 'Volvo Group',
    logo: '../assets/logos/volvo.svg',
    role_nl: 'Productie & industrie · meerdere sites',
    role_en: 'Manufacturing & industry · multiple sites',
    title_nl: 'Van versnipperde opvolging naar één aanpak',
    title_en: 'From fragmented follow-up to one approach',
    quote_nl: 'We brachten structuur, maakten de kosten zichtbaar en grepen sneller in waar het telde.',
    quote_en: 'We brought structure, made the costs visible and intervened sooner where it counted.',
    link_nl: 'referentie-case.html',
    link_en: 'referentie-case-en.html',
    pdf: '',
    order: 1,
    active: true
  },
  {
    id: 't2',
    company: 'Alcon',
    company_en: 'Alcon',
    logo: '../assets/logos/alcon.svg',
    role_nl: 'Oogzorg & medische technologie · 430 medewerkers',
    role_en: 'Eye care & medical technology · 430 employees',
    title_nl: 'Mens én data in één beweging',
    title_en: 'People and data in one motion',
    quote_nl: 'Re-integratie voelt niet langer als losse dossiers, maar als één traject met een duidelijke richting.',
    quote_en: 'Return-to-work no longer feels like scattered files, but one journey with a clear direction.',
    link_nl: 'referentie-case-alcon.html',
    link_en: 'referentie-case-alcon-en.html',
    pdf: '',
    order: 2,
    active: true
  },
  {
    id: 't3',
    company: 'Lonza',
    company_en: 'Lonza',
    logo: '../assets/logos/lonza.svg',
    role_nl: 'Life sciences · meerdere sites',
    role_en: 'Life sciences · multiple sites',
    title_nl: 'Rust en onderbouwing als basis',
    title_en: 'Calm and evidence as the foundation',
    quote_nl: 'Elke stap uitlegbaar, naar de leiding én naar de medewerker, met een meetbaar resultaat.',
    quote_en: 'Every step explainable, to management and to the employee alike, with a measurable result.',
    link_nl: 'referentie-case-lonza.html',
    link_en: 'referentie-case-lonza-en.html',
    pdf: '',
    order: 3,
    active: true
  },
  {
    id: 't4',
    company: 'FenekO',
    company_en: 'FenekO',
    logo: '../assets/logos/feneko.png',
    role_nl: 'Aluminiumbewerking · 125 medewerkers',
    role_en: 'Aluminium processing · 125 employees',
    title_nl: 'Gezond werken, stap voor stap',
    title_en: 'Healthy work, step by step',
    quote_nl: 'Een gezondheidsbeleid op maat, ergonomische coaching op de werkvloer en gerichte re-integratie.',
    quote_en: 'A tailored health policy, ergonomic coaching on the floor and targeted re-integration.',
    link_nl: 'referentie-case-feneko.html',
    link_en: 'referentie-case-feneko-en.html',
    pdf: '',
    order: 4,
    active: true
  }
];
