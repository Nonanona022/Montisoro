/* Montisoro, Referentie-cases · single source of truth.
   Wordt gelezen door de case-detailpagina's (via case-render.js) én kan
   uit het admin panel (module "Referenties") geëxporteerd/overschreven worden.
   Titelvelden gebruiken *sterretjes* voor het oranje serif-accent: "in *één* beweging". */
window.MONTISORO_CASES = [
  {
    slug: 'referentie-case', company: 'Volvo Group', logo: '../assets/logos/volvo.svg',
    eyebrow_nl: 'Productie & industrie', eyebrow_en: 'Manufacturing & industry',
    hero_title_nl: 'Van versnipperde opvolging naar één *onderbouwde* aanpak.',
    hero_title_en: 'From fragmented follow-up to one *evidence-based* approach.',
    hero_sum_nl: 'In een industriële omgeving met meerdere ploegen bracht Montisoro verzuim opnieuw onder controle, niet met méér overleg, maar met één systeem dat inzicht, structuur en opvolging samenbrengt.',
    hero_sum_en: 'In an industrial, multi-shift environment, Montisoro brought absence back under control, not with more meetings, but with one system that unites insight, structure and follow-through.',
    about_title_nl: 'Wereldwijd sterk in *transport en industrie.*',
    about_title_en: 'A global force in *transport and industry.*',
    fact_sector_nl: 'Productie & industrie', fact_sector_en: 'Manufacturing & industry',
    foot_loc: '', foot_mdw: '', foot_txt_nl: 'Meerdere sites · ploegenarbeid', foot_txt_en: 'Multiple sites · shift work',
    fact_scope_nl: 'Kort- en langdurig verzuim, re-integratie en inzetbaarheid.', fact_scope_en: 'Short- and long-term absence, return-to-work and employability.',
    tech: 'Storm',
    photo_about: '', photo_approach: '', quote_photo: '',
    chal_title_nl: 'Stijgend verzuim, steeds *minder grip*.', chal_title_en: 'Rising absence, less and less *grip*.',
    chal_nl: ['Stijgend ziekteverzuim en complexe dossiers','Gebrek aan een uniforme en duidelijke aanpak','Beperkte interne capaciteit en expertise','Nood aan meer betrokkenheid van leidinggevenden','Vraag naar duurzame en mensgerichte re-integratie'],
    chal_en: ['Rising absence and complex cases','No uniform, clear approach','Limited internal capacity and expertise','A need for more manager involvement','Demand for sustainable, people-centred return-to-work'],
    appr_title_nl: 'Eén traject in *zes* stappen.', appr_title_en: 'One journey in *six* steps.',
    appr_nl: ['Analyse van de bestaande situatie','Workshops met sleutelstakeholders','Ontwikkeling van een duidelijke re-integratieaanpak','Coaching en training van leidinggevenden','Implementatie en begeleiding op de werkvloer','Opvolging, bijsturing en evaluatie'],
    appr_en: ['Analysis of the current situation','Workshops with key stakeholders','Development of a clear return-to-work approach','Coaching and training for managers','Implementation and guidance on the floor','Follow-up, adjustment and evaluation'],
    res_title_nl: 'Wat de samenwerking *opleverde.*', res_title_en: 'What the collaboration *delivered.*',
    results: [
      { t_nl:'Meer duidelijkheid', t_en:'More clarity', d_nl:'Duidelijke rollen en processen voor alle betrokkenen.', d_en:'Clear roles and processes for everyone involved.' },
      { t_nl:'Betere samenwerking', t_en:'Better collaboration', d_nl:'Sterkere samenwerking tussen HR, leidinggevenden en medewerkers.', d_en:'Stronger collaboration between HR, managers and employees.' },
      { t_nl:'Snellere opvolging', t_en:'Faster follow-up', d_nl:'Kortere doorlooptijden in re-integratietrajecten.', d_en:'Shorter lead times in return-to-work journeys.' },
      { t_nl:'Hogere betrokkenheid', t_en:'Higher engagement', d_nl:'Meer begrip en engagement bij medewerkers en leidinggevenden.', d_en:'More understanding and engagement among employees and managers.' },
      { t_nl:'Duurzame verankering', t_en:'Lasting embedding', d_nl:'Re-integratie is een vast onderdeel geworden van het HR-beleid.', d_en:'Return-to-work has become a fixed part of HR policy.' }
    ],
    glance_sub_nl: 'De hele case in *vier* punten.', glance_sub_en: 'The whole case in *four* points.',
    glance: [
      { t_nl:'Uitdaging', t_en:'Challenge', d_nl:'Stijgend verzuim, complexe dossiers en gebrek aan uniforme aanpak.', d_en:'Rising absence, complex cases and no uniform approach.' },
      { t_nl:'Aanpak', t_en:'Approach', d_nl:'Analyse, workshops, aanpak op maat, coaching en begeleiding.', d_en:'Analysis, workshops, tailored approach, coaching and guidance.' },
      { t_nl:'Resultaat', t_en:'Result', d_nl:'Meer grip, snellere opvolging en duurzame verankering in de organisatie.', d_en:'More grip, faster follow-up and lasting embedding in the organisation.' },
      { t_nl:'Duur', t_en:'Duration', d_nl:'Het traject liep over 6 maanden met een blijvende impact.', d_en:'The programme ran over 6 months with lasting impact.' }
    ],
    quote_nl: 'Montisoro bracht rust en structuur in complexe dossiers. We hebben nu een aanpak die uitlegbaar is, naar onze mensen én naar de organisatie.',
    quote_en: 'Montisoro brought calm and structure to complex cases. We now have an approach that is explainable, to our people and to the organisation.',
    quote_role_nl: 'HR-directeur', quote_role_en: 'HR Director'
  },
  {
    slug: 'referentie-case-alcon', company: 'Alcon', logo: '../assets/logos/alcon.svg',
    eyebrow_nl: 'Oogzorg & medische technologie', eyebrow_en: 'Eye care & medical technology',
    hero_title_nl: 'Elke medewerker weer *aan boord*.', hero_title_en: 'Every employee back *on board*.',
    hero_sum_nl: 'Op een veeleisende productievloer in Puurs en Bornem volgt Montisoro uitgevallen medewerkers persoonlijk op met het Re-boarding-programma. Vertrouwelijke begeleiding, afstemming met de arbeidsarts en maandelijkse data-analyse brengen mens en beleid samen, met een sterk gedaald langdurig verzuim als resultaat.',
    hero_sum_en: 'On a demanding production floor in Puurs and Bornem, Montisoro personally follows up absent employees through its Re-boarding programme. Confidential guidance, coordination with the occupational physician and monthly data analysis bring people and policy together, with a sharp drop in long-term absence as the result.',
    about_title_nl: 'Wereldleider in *oogzorg.*', about_title_en: 'World leader in *eye care.*',
    fact_sector_nl: 'Oogzorg & medische technologie', fact_sector_en: 'Eye care & medical technology',
    foot_loc: '2', foot_mdw: '430', foot_txt_nl: '', foot_txt_en: '',
    fact_scope_nl: 'Opvolging tijdens arbeidsongeschiktheid, aangepast werk en re-integratie.', fact_scope_en: 'Follow-up during incapacity, adapted work and return-to-work.',
    tech: 'Storm',
    photo_about: '../assets/cases/alcon-about.png', photo_approach: 'none', quote_photo: '',
    chal_title_nl: 'Opvolgen én *aangepast werk*.', chal_title_en: 'Follow-up and *adapted work*.',
    chal_nl: ['Medewerkers opvolgen tijdens arbeidsongeschiktheid','Op een hectische werkvloer de juiste zorg en aandacht geven','Aangepast werk omzetten naar de dagelijkse praktijk','Duidelijke spelregels en transparantie rond aangepast werk','Een duurzame, mensgerichte relatie met medewerkers behouden'],
    chal_en: ['Following up employees during incapacity for work','Giving the right care and attention on a hectic shop floor','Turning adapted work into everyday practice','Clear rules and transparency around adapted work','Sustaining a durable, people-centred relationship with employees'],
    appr_title_nl: 'Eén traject in *zes* stappen.', appr_title_en: 'One journey in *six* steps.',
    appr_nl: ['Re-boarding: vertrouwelijke gesprekken en persoonlijke coaching tijdens uitval','(Progressieve) werkhervatting in overleg met de arbeidsarts','Opvolging tot een duurzame werkhervatting, conform het vooropgestelde doel','Maandelijks multidisciplinair overleg op basis van data-analyse','Aangepast werk en werkhervatting verankerd in het vitaliteitsbeleid','Doorlopende ondersteuning van HR, management, leidinggevenden en arbeidsarts'],
    appr_en: ['Re-boarding: confidential conversations and personal coaching during absence','(Gradual) return to work in consultation with the occupational physician','Follow-up until a lasting return to work, in line with the agreed goal','Monthly multidisciplinary consultation based on data analysis','Adapted work and return-to-work embedded in the vitality policy','Ongoing support for HR, management, supervisors and the occupational physician'],
    res_title_nl: 'Wat de samenwerking *opleverde.*', res_title_en: 'What the collaboration *delivered.*',
    results: [
      { t_nl:'Langdurig verzuim daalt sterk', t_en:'Long-term absence down sharply', d_nl:'Het langdurig ziekteverzuim is sterk gedaald.', d_en:'Long-term sickness absence has fallen sharply.' },
      { t_nl:'Middellang stabiliseert', t_en:'Medium-term stabilised', d_nl:'Gestabiliseerd, met de eerste dalende trends zichtbaar.', d_en:'Stabilised, with the first downward trends visible.' },
      { t_nl:'Kort verzuim geminimaliseerd', t_en:'Short-term minimised', d_nl:'Kortdurend ziekteverzuim is herleid tot een minimum.', d_en:'Short-term sickness absence reduced to a minimum.' },
      { t_nl:'Controles zijn de uitzondering', t_en:'Controls the exception', d_nl:'Controles tijdens ziekte behoren tot de uitzonderingen.', d_en:'Illness controls have become the exception.' },
      { t_nl:'Zorg die gevoeld wordt', t_en:'Care that is felt', d_nl:'Medewerkers waarderen de persoonlijke begeleiding tijdens uitval.', d_en:'Employees value the personal guidance during absence.' }
    ],
    glance_sub_nl: 'De hele case in *vier* punten.', glance_sub_en: 'The whole case in *four* points.',
    glance: [
      { t_nl:'Uitdaging', t_en:'Challenge', d_nl:'Medewerkers opvolgen tijdens arbeidsongeschiktheid en een kader voor aangepast werk.', d_en:'Following up employees during incapacity and a framework for adapted work.' },
      { t_nl:'Aanpak', t_en:'Approach', d_nl:'Het Re-boarding-programma: persoonlijke coaching, multidisciplinair overleg en beleid.', d_en:'The Re-boarding programme: personal coaching, multidisciplinary consultation and policy.' },
      { t_nl:'Resultaat', t_en:'Result', d_nl:'Langdurig verzuim sterk gedaald; kort verzuim herleid tot een minimum.', d_en:'Long-term absence down sharply; short-term reduced to a minimum.' },
      { t_nl:'Duur', t_en:'Duration', d_nl:'Een langlopende samenwerking met blijvende impact.', d_en:'A long-running partnership with lasting impact.' }
    ],
    quote_nl: 'Ik zou Montisoro als externe partner voor ziektebeleid zeer zeker aanraden. Ze bieden input en ondersteuning voor een modern, mensgericht ziektebeleid, met bijzonder sterke support voor HR, leidinggevenden én medewerkers. De opvolging van wie ziek thuis zit is bijzonder belangrijk, en Montisoro weet dat als geen ander op zich te nemen, tot grote tevredenheid van bedrijf én medewerker.',
    quote_en: 'I would certainly recommend Montisoro as an external partner for absence policy. They provide input and support for a modern, people-centred absence policy, with exceptionally strong support for HR, managers and employees alike. Following up those who are off sick matters enormously, and Montisoro takes that on like no other, to the great satisfaction of both company and employee.',
    quote_name: 'William De Plecker',
    quote_role_nl: 'HR Manager', quote_role_en: 'HR Manager'
  },
  {
    slug: 'referentie-case-lonza', company: 'Lonza', logo: '../assets/logos/lonza.svg',
    eyebrow_nl: 'Life sciences', eyebrow_en: 'Life sciences',
    hero_title_nl: 'Rust en onderbouwing als *basis*.', hero_title_en: 'Calm and evidence as the *foundation*.',
    hero_sum_nl: 'In een complexe, veeleisende productieomgeving koos Montisoro voor rust en bewijs, elke stap uitlegbaar, naar de leiding én naar de medewerker, met een meetbaar resultaat.',
    hero_sum_en: 'In a complex, demanding production environment, Montisoro led with calm and evidence, every step explainable, to management and to the employee alike, with a measurable result.',
    about_title_nl: 'Toonaangevend in *life sciences.*', about_title_en: 'A leader in *life sciences.*',
    fact_sector_nl: 'Life sciences', fact_sector_en: 'Life sciences',
    foot_loc: '', foot_mdw: '', foot_txt_nl: 'Meerdere sites', foot_txt_en: 'Multiple sites',
    fact_scope_nl: 'Kort- en langdurig verzuim, re-integratie en inzetbaarheid.', fact_scope_en: 'Short- and long-term absence, return-to-work and employability.',
    tech: 'Storm',
    photo_about: '', photo_approach: '', quote_photo: '',
    chal_title_nl: 'Stijgend verzuim, steeds *minder grip*.', chal_title_en: 'Rising absence, less and less *grip*.',
    chal_nl: ['Stijgend ziekteverzuim en complexe dossiers','Gebrek aan een uniforme en duidelijke aanpak','Beperkte interne capaciteit en expertise','Nood aan meer betrokkenheid van leidinggevenden','Vraag naar duurzame en mensgerichte re-integratie'],
    chal_en: ['Rising absence and complex cases','No uniform, clear approach','Limited internal capacity and expertise','A need for more manager involvement','Demand for sustainable, people-centred return-to-work'],
    appr_title_nl: 'Eén traject in *zes* stappen.', appr_title_en: 'One journey in *six* steps.',
    appr_nl: ['Analyse van de bestaande situatie','Workshops met sleutelstakeholders','Ontwikkeling van een duidelijke re-integratieaanpak','Coaching en training van leidinggevenden','Implementatie en begeleiding op de werkvloer','Opvolging, bijsturing en evaluatie'],
    appr_en: ['Analysis of the current situation','Workshops with key stakeholders','Development of a clear return-to-work approach','Coaching and training for managers','Implementation and guidance on the floor','Follow-up, adjustment and evaluation'],
    res_title_nl: 'Wat de samenwerking *opleverde.*', res_title_en: 'What the collaboration *delivered.*',
    results: [
      { t_nl:'Meer duidelijkheid', t_en:'More clarity', d_nl:'Duidelijke rollen en processen voor alle betrokkenen.', d_en:'Clear roles and processes for everyone involved.' },
      { t_nl:'Betere samenwerking', t_en:'Better collaboration', d_nl:'Sterkere samenwerking tussen HR, leidinggevenden en medewerkers.', d_en:'Stronger collaboration between HR, managers and employees.' },
      { t_nl:'Snellere opvolging', t_en:'Faster follow-up', d_nl:'Kortere doorlooptijden in re-integratietrajecten.', d_en:'Shorter lead times in return-to-work journeys.' },
      { t_nl:'Hogere betrokkenheid', t_en:'Higher engagement', d_nl:'Meer begrip en engagement bij medewerkers en leidinggevenden.', d_en:'More understanding and engagement among employees and managers.' },
      { t_nl:'Duurzame verankering', t_en:'Lasting embedding', d_nl:'Re-integratie is een vast onderdeel geworden van het HR-beleid.', d_en:'Return-to-work has become a fixed part of HR policy.' }
    ],
    glance_sub_nl: 'De hele case in *vier* punten.', glance_sub_en: 'The whole case in *four* points.',
    glance: [
      { t_nl:'Uitdaging', t_en:'Challenge', d_nl:'Stijgend verzuim, complexe dossiers en gebrek aan uniforme aanpak.', d_en:'Rising absence, complex cases and no uniform approach.' },
      { t_nl:'Aanpak', t_en:'Approach', d_nl:'Analyse, workshops, aanpak op maat, coaching en begeleiding.', d_en:'Analysis, workshops, tailored approach, coaching and guidance.' },
      { t_nl:'Resultaat', t_en:'Result', d_nl:'Meer grip, snellere opvolging en duurzame verankering in de organisatie.', d_en:'More grip, faster follow-up and lasting embedding in the organisation.' },
      { t_nl:'Duur', t_en:'Duration', d_nl:'Het traject liep over 6 maanden met een blijvende impact.', d_en:'The programme ran over 6 months with lasting impact.' }
    ],
    quote_nl: 'Montisoro gaf ons onderbouwing waar eerder aannames waren. Elke stap is vandaag helder en gedragen, door leiding én medewerker.',
    quote_en: 'Montisoro gave us evidence where there used to be assumptions. Every step today is clear and supported, by management and employee alike.',
    quote_role_nl: 'HR-directeur', quote_role_en: 'HR Director'
  },
  {
    slug: 'referentie-case-feneko', company: 'FenekO', logo: '../assets/logos/feneko.png',
    eyebrow_nl: 'Aluminiumbewerking', eyebrow_en: 'Aluminium processing',
    hero_title_nl: 'Gezond werken, *stap voor stap*.', hero_title_en: 'Healthy work, *step by step*.',
    hero_sum_nl: 'In een sterk geautomatiseerde aluminiumproductie over vier vestigingen namen de fysieke klachten op de werkvloer toe. Montisoro bouwde een gezondheidsbeleid op maat, bracht ergonomische coaching tot op de werkvloer en nam de re-integratie op zich, zodat elke medewerker mee aan boord blijft en duurzaam hervat.',
    hero_sum_en: 'In a highly automated aluminium operation across four sites, physical complaints on the shop floor were on the rise. Montisoro built a tailored health policy, brought ergonomic coaching onto the floor and took on re-integration, so every employee stays on board and returns to work sustainably.',
    about_title_nl: 'Dé referentie in *aluminiumbewerking.*', about_title_en: 'The benchmark in *aluminium processing.*',
    fact_sector_nl: 'Aluminiumbewerking', fact_sector_en: 'Aluminium processing',
    foot_loc: '4', foot_mdw: '125', foot_txt_nl: '', foot_txt_en: '',
    fact_scope_nl: 'Gezondheidsbeleid, ergonomie, absenteïsme en re-integratie.', fact_scope_en: 'Health policy, ergonomics, absenteeism and return-to-work.',
    tech: 'Storm',
    photo_about: '../assets/cases/feneko-about.png', photo_approach: 'none', quote_photo: '',
    chal_title_nl: 'Fysieke klachten en *ziekteverzuim*.', chal_title_en: 'Physical strain and *sickness absence*.',
    chal_nl: ['Een gezondheidsbeleid ontwikkelen, gesteund op visie en missie','Stijgende fysieke klachten op de werkvloer reduceren','Een oplossing zoeken die gericht is op het individu','Medewerkers begeleiden tijdens ziekte','Ziekteverzuim en misbruik gericht opvolgen'],
    chal_en: ['Developing a health policy rooted in the company vision and mission','Reducing rising physical complaints on the shop floor','Finding a solution focused on the individual','Guiding employees during illness','Following up on sickness absence and misuse'],
    appr_title_nl: 'Eén traject in *zes* stappen.', appr_title_en: 'One journey in *six* steps.',
    appr_nl: ['Een gezondheidsbeleid op maat, met preventieve én curatieve acties','Risicoanalyse van de werkvloer met concrete verbeterpunten','Ergonomische coaching op de werkvloer door kinesiste Karen','Persoonlijke info-fiche per medewerker, met maandelijkse opvolging','Een re-integratiecoach die het volledige proces verzorgt','Doorlopende ondersteuning van de HR Manager'],
    appr_en: ['A tailored health policy, with preventive and curative actions','A risk analysis of the shop floor with concrete improvement points','Ergonomic coaching on the floor by physiotherapist Karen','A personal info sheet per employee, with monthly follow-up','A re-integration coach who runs the entire process','Ongoing support for the HR Manager'],
    res_title_nl: 'Wat de samenwerking *opleverde.*', res_title_en: 'What the collaboration *delivered.*',
    results: [
      { t_nl:'Betere ergonomie', t_en:'Better ergonomics', d_nl:'Duidelijke verbetering in ergonomie en werkhouding na één jaar.', d_en:'A clear improvement in ergonomics and posture after one year.' },
      { t_nl:'Bevestigd door de arbeidsarts', t_en:'Confirmed by the physician', d_nl:'De vooruitgang wordt bevestigd door de betrokken arbeidsarts.', d_en:'The progress is confirmed by the occupational physician.' },
      { t_nl:'Iedereen mee aan boord', t_en:'Everyone on board', d_nl:'Het beleid groeit in stappen, zodat elke medewerker mee blijft.', d_en:'The policy grows step by step, keeping every employee involved.' },
      { t_nl:'Duurzame werkhervatting', t_en:'Lasting return to work', d_nl:'Langdurig zieken krijgen gerichte steun naar duurzaam herstel.', d_en:'Long-term absentees get targeted support toward lasting recovery.' }
    ],
    glance_sub_nl: 'De hele case in *vier* punten.', glance_sub_en: 'The whole case in *four* points.',
    glance: [
      { t_nl:'Uitdaging', t_en:'Challenge', d_nl:'Een gezondheidsbeleid, minder fysieke klachten en begeleiding tijdens ziekte.', d_en:'A health policy, fewer physical complaints and guidance during illness.' },
      { t_nl:'Aanpak', t_en:'Approach', d_nl:'Beleid op maat, ergonomische coaching op de werkvloer en re-integratie.', d_en:'A tailored policy, ergonomic coaching on the floor and re-integration.' },
      { t_nl:'Resultaat', t_en:'Result', d_nl:'Betere ergonomie, bevestigd door de arbeidsarts, en duurzame werkhervatting.', d_en:'Better ergonomics, confirmed by the physician, and lasting return to work.' },
      { t_nl:'Duur', t_en:'Duration', d_nl:'Zichtbaar resultaat na iets meer dan één jaar.', d_en:'Visible results after just over a year.' }
    ],
    quote_nl: 'Ik zou Montisoro zeker aanraden voor hulp bij een gezondheidsbeleid, absenteïsme en re-integratie. Het is een zeer pragmatische en flexibele partner: waar een sociaal secretariaat vaak aan de oppervlakte blijft en naar de wet verwijst, vind je met Montisoro een praktische én correcte oplossing. Dat is net hun sterkte.',
    quote_en: 'I would certainly recommend Montisoro for help with a health policy, absenteeism and return-to-work. They are a very pragmatic and flexible partner: where a payroll office often stays at the surface and points to the law, with Montisoro you find a practical and correct solution. That is exactly their strength.',
    quote_name: 'Hilde Hermans',
    quote_role_nl: 'HR Manager', quote_role_en: 'HR Manager'
  }
];
