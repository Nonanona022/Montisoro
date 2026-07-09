/* ═══════════════════════════════════════════════════════════════════
   Montisoro Admin — mock data layer (v3 — block-based content editor)
═══════════════════════════════════════════════════════════════════ */
(function(){
  var KEY = 'montisoro.admin.data.v13';   // v13: verse reseed → demo onboardings/gdpr/activity uit oude cache wissen (overzicht toont alleen echte data)

  // Helper to build a text field
  function t(label, nl, en){ return { type:'text', label:label, nl:nl, en:en }; }
  function ta(label, nl, en){ return { type:'textarea', label:label, nl:nl, en:en }; }

  // Helper to build a page
  function page(slug, nl_file, en_file, updated, meta, hero, blocks){
    return {
      slug:slug, nl:nl_file, en:en_file, status:'live', updated:updated,
      meta: meta,
      hero: hero,
      blocks: blocks || []
    };
  }

  var DEFAULT = {
    leads: [],  /* ⚠️ Live data komt uit Supabase via /api/admin-form-submissions */
    submissions: {
      calculator: [],  /* Live uit Supabase: /api/admin-submissions */
      fitcheck:   [],  /* Live uit Supabase: /api/admin-form-submissions */
      casey:      [],  /* Live uit Supabase: /api/admin-form-submissions */
      contact:    [],  /* Live uit Supabase: /api/admin-form-submissions */
      booking:    []   /* Live uit Supabase: /api/admin-form-submissions */
    },
    notifications_inbox: [], /* Automatisch gevuld vanuit echte leads */
    activity_log: [
      { id:'a-seed', who:'Systeem', what:'Admin panel opgezet', ts:'2026-06-23 00:00', icon:'rocket' }
    ],
    profile: { ui_lang:'nl' },
    team: [
      { id:'u-001', name:'Laurence Van den Bergh', role:'Admin',  email:'laurence@montisoro.com', initial:'L', lastSeen:'nu actief' }
    ],
    integrations: {
      analytics: { connected:false, id:'' },
      linkedin:  { connected:false, id:'' },
      mailchimp: { connected:false, apiKey:'', listId:'' }
    },
    notif_config: {
      email: 'hello@montisoro.com',
      cc: '',
      reply_to: 'hello@montisoro.com',
      flags: {
        diagnose: true,
        casey: true,
        report: true,
        report_customer: true,
        fitcheck: true,
        daily: false,
        weekly: false
      },
      templates: {
        diagnose: { subject: 'Nieuwe aanvraag diagnosegesprek — {{name}}',
          body: 'Beste Laurence,\n\n{{name}} ({{email}}) van {{org}} wil een diagnosegesprek inplannen.\n\n— Datum: {{date}}\n— Tijdstip: {{time}}\n— Locatie: {{loc}}\n{{#address}}— Adres: {{address}}\n{{/address}}\n{{#note}}\nBericht:\n{{note}}\n{{/note}}\n\nVriendelijke groet,\nMontisoro website' },
        casey: { subject: 'Nieuwe Casey AI waitlist inschrijving',
          body: 'Beste Laurence,\n\n{{email}} heeft zich ingeschreven op de Casey AI wachtlijst.\n\nVriendelijke groet,\nMontisoro website' },
        report: { subject: 'Nieuwe calculator-aanvraag — {{company}} ({{annual_absence_cost}})',
          body: 'Beste Laurence,\n\nEen bezoeker heeft de verzuimcalculator volledig ingevuld en een rapport aangevraagd.\n\nContact:\n— Naam: {{name}}\n— Bedrijf: {{company}}\n— E-mail: {{email}}\n— Telefoon: {{phone}}\n\nResultaten:\n— Jaarlijkse verzuimkost: {{annual_absence_cost}}\n— Verloren werkdagen: {{lost_workdays}}\n— Kost per medewerker: {{cost_per_employee}}\n— Verzuimpercentage: {{absence_rate}}\n— Risiconiveau: {{risk_level}}\n\nStatus:\n— PDF: {{pdf_status}}\n— Lead: {{lead_status}}\n\nVriendelijke groet,\nMontisoro website' },
        report_customer: { subject: 'Uw verzuimrapport van Montisoro',
          body: 'Beste {{name}},\n\nBedankt voor het invullen van de Montisoro verzuimcalculator. Uw persoonlijk rapport zit als PDF in bijlage bij deze e-mail.\n\nUw kerncijfer:\n— Geschatte jaarlijkse verzuimkost: {{annual_absence_cost}}\n— Risiconiveau: {{risk_level}}\n\nHet rapport bevat: de geschatte jaarlijkse kost van verzuim, de verborgen en indirecte impact, een benchmark met het sectorgemiddelde en uw risiconiveau, en concrete besparingsscenario’s en prioriteiten.\n\nDit is een indicatieve analyse op basis van de door u ingevoerde gegevens — geen bindend advies.\n\nWilt u weten wat deze cijfers concreet voor uw organisatie betekenen?\nPlan een vrijblijvend diagnosegesprek: https://www.montisoro.com/contact.html#channels\n\nMet vriendelijke groet,\nHet Montisoro-team' },
        fitcheck: { subject: 'Fit check voltooid — {{route}}',
          body: 'Beste Laurence,\n\n{{name}} ({{email}}) van {{org}} heeft de fit check voltooid.\n\n— Aanbevolen route: {{route}}\n— Dominante spanning: {{tension}}\n— Maturity: {{maturity}}\n— Schaal: {{scale}}\n— Verzuimtype: {{absence_type}}\n\nAanbevelingen:\n{{recommendation}}\n\nVriendelijke groet,\nMontisoro website' }
      }
    },
    siteTeam: [
      { id:'st-001', name:'Laurence Van den Bergh', role_nl:'Founder & CEO',         role_en:'Founder & CEO',         bio_nl:'Care als capability is geen wens. Het is een ontwerpvraag.', bio_en:'Care as capability is not a wish. It is a design question.', photo:'/assets/team/laurence.jpg', initial:'L', status:'active', order:1 },
      { id:'st-002', name:'Jeroen',                 role_nl:'Co-founder & CTO',      role_en:'Co-founder & CTO',      bio_nl:'Technologie die het denkwerk lichter maakt, niet zwaarder.', bio_en:'Technology that makes thinking lighter, not heavier.', photo:'/assets/team/jeroen.jpg', initial:'J', status:'active', order:2 },
      { id:'st-004', name:'Reza',                   role_nl:'Senior Strategy Lead',  role_en:'Senior Strategy Lead',  bio_nl:'Verzuim raakt elk team, elke directie. Daarom werken we strategisch.', bio_en:'Absence touches every team, every executive. That\'s why we work strategically.', photo:'/assets/team/reza.jpg', initial:'R', status:'active', order:4 },
      { id:'st-005', name:'Els',                    role_nl:'Senior HR Architect',   role_en:'Senior HR Architect',   bio_nl:'Mensen zijn niet het probleem. Systemen die hen niet zien, wel.', bio_en:'People are not the problem. Systems that fail to see them are.', photo:'/assets/team/els.jpg', initial:'E', status:'active', order:5 },
      { id:'st-006', name:'Edith',                  role_nl:'Senior Coach',          role_en:'Senior Coach',          bio_nl:'Care begint waar het script eindigt.', bio_en:'Care begins where the script ends.', photo:'/assets/team/edith.jpg', initial:'E', status:'active', order:6 },
      { id:'st-007', name:'Rico',                   role_nl:'Senior Data Analyst',   role_en:'Senior Data Analyst',   bio_nl:'Cijfers zijn alleen interessant als ze handelen mogelijk maken.', bio_en:'Numbers are only interesting when they enable action.', photo:'/assets/team/rico.jpg', initial:'R', status:'active', order:7 },
      { id:'st-008', name:'Astrid',                 role_nl:'Senior Compliance Lead',role_en:'Senior Compliance Lead',bio_nl:'KB RIT 3.0 is geen vakje. Het is een ontwerpkader.', bio_en:'KB RIT 3.0 is not a checkbox. It\'s a design framework.', photo:'/assets/team/astrid.jpg', initial:'A', status:'active', order:8 },
      { id:'st-009', name:'Stefi', role_nl:'Non-clinical Casemanager', role_en:'Non-clinical Case Manager', bio_nl:'Ervaren ergotherapeut en trainer die organisaties ondersteunt bij het implementeren van Culture of Care, met een sterke focus op praktische toepasbaarheid en duurzame gedragsverandering.', bio_en:'Experienced occupational therapist and trainer who helps organisations implement a Culture of Care, with a strong focus on practical applicability and lasting behavioural change.', photo:'/assets/team/stefi.jpg', initial:'S', status:'active', order:9 },
      { id:'st-010', name:'Amr', role_nl:'Lead AI Architect', role_en:'Lead AI Architect', bio_nl:'Ontwerpt en ontwikkelt de intelligentie achter Casey AI. Hij vertaalt de visie, expertise en praktijkkennis van de CEO naar geavanceerde Agentic AI-frameworks en zorgt voor de technische architectuur die Casey laat leren, redeneren en handelen.', bio_en:'Designs and builds the intelligence behind Casey AI. He translates the CEO’s vision, expertise and field knowledge into advanced Agentic AI frameworks and owns the technical architecture that lets Casey learn, reason and act.', photo:'/assets/team/amr.jpg', initial:'A', status:'active', order:10 },
      { id:'st-011', name:'Ahmed', role_nl:'Senior Platform Engineer', role_en:'Senior Platform Engineer', bio_nl:'Verantwoordelijk voor de opbouw, beveiliging, monitoring en schaalbaarheid van de AWS-cloudinfrastructuur van Storm en Casey AI.', bio_en:'Responsible for building, securing, monitoring and scaling the AWS cloud infrastructure behind Storm and Casey AI.', photo:'/assets/team/ahmed.jpg', initial:'A', status:'active', order:11 }
    ],
    trustedBy: [
      { id:'tb-001', name:'Volvo Group',                logo:'/assets/logos/volvo.png', order:1,  active:true },
      { id:'tb-002', name:'Novartis Manufacturing',     logo:'/assets/logos/novartis.png', order:2,  active:true },
      { id:'tb-003', name:'Lonza',                      logo:'/assets/logos/lonza.svg', order:3,  active:true },
      { id:'tb-004', name:'LyondellBasell',             logo:'/assets/logos/lyondellbasell.png', order:4,  active:true },
      { id:'tb-005', name:'Rockwool',                   logo:'/assets/logos/rockwool.png', order:5,  active:true },
      { id:'tb-006', name:'Alcon Laboratories Belgium', logo:'/assets/logos/alcon.png', order:6,  active:true },
      { id:'tb-007', name:'Emeis',                      logo:'/assets/logos/emeis.png', order:7,  active:true },
      { id:'tb-008', name:'HB Accountants',             logo:'/assets/logos/hb.png', order:8,  active:true },
      { id:'tb-009', name:'Legend Biotech',             logo:'/assets/logos/legend.png', order:9,  active:true },
      { id:'tb-010', name:'AXA Belgium',                logo:'/assets/logos/axa.png', order:10, active:true },
      { id:'tb-011', name:'Vaillant',                   logo:'/assets/logos/vaillant.png', order:11, active:true },
      { id:'tb-012', name:'Howden',                     logo:'/assets/logos/howden.png', order:12, active:true },
      { id:'tb-013', name:'AMS', logo:'/assets/logos/ams.png', order:13, active:true },
      { id:'tb-014', name:'Feneko', logo:'/assets/logos/feneko.png', order:14, active:true },
      { id:'tb-015', name:'Securitas', logo:'/assets/logos/securitas.png', order:15, active:true },
      { id:'tb-016', name:'Sortimo', logo:'/assets/logos/sortimo.png', order:16, active:true },
      { id:'tb-017', name:'Van Breda Risk & Benefits', logo:'/assets/logos/vanbreda.png', order:17, active:true },
      { id:'tb-018', name:'Rockfon', logo:'/assets/logos/rockfon.png', order:5.5, active:true }
    ],
    pages: [

      // ─── HOME ─────────────────────────────────────────────
      page('Home','Home.html','Home-en.html','2026-05-15',
        { title:t('Browser-tab titel','Montisoro · Care wordt systeem','Montisoro · Care becomes system'),
          desc: ta('Meta-beschrijving','Verzuim als capability behandelen. Externe regie, Storm en Casey AI.','Treating absence as capability. External direction, Storm and Casey AI.') },
        { eyebrow: t('Eyebrow','Care wordt systeem','Care becomes system'),
          title:   ta('Hero titel','Wanneer iemand uitvalt, valt er meer uit dan één persoon.','When someone drops out, more than one person falls.'),
          body:    ta('Hero body','Montisoro maakt verzuim werkbaar voor wie het opvangt. Externe regie. Operationeel ritme. Strategische capaciteit.','Montisoro makes absence workable for those who carry it. External direction. Operational rhythm. Strategic capacity.'),
          cta_primary: t('Primaire CTA','Plan een gesprek →','Schedule a call →'),
          cta_secondary: t('Secundaire CTA','Ontdek onze aanpak','Discover our approach') },
        [
          { label:'KPI Stat 1', fields:{ value:t('Cijfer','€250','€250'), label:t('Label','per dag · per medewerker','per day · per employee') } },
          { label:'KPI Stat 2', fields:{ value:t('Cijfer','3-in-1','3-in-1'), label:t('Label','care, capability, operating system','care, capability, operating system') } },
          { label:'KPI Stat 3', fields:{ value:t('Cijfer','2026','2026'), label:t('Label','Casey AI lancering','Casey AI launch') } },
          { label:'Strengths · Card 1', fields:{ title:t('Titel','Care','Care'), body:ta('Body','Externe regie van re-integratie. We nemen het over, structureel.','External direction of reintegration. We take it over, structurally.') } },
          { label:'Strengths · Card 2', fields:{ title:t('Titel','Capability','Capability'), body:ta('Body','We bouwen interne capaciteit zodat care zelfdragend wordt.','We build internal capacity so care becomes self-sustaining.') } },
          { label:'Strengths · Card 3', fields:{ title:t('Titel','Operating System','Operating System'), body:ta('Body','Storm en Casey: het besturingssysteem voor verzuim als capability.','Storm and Casey: the operating system for absence as capability.') } },
          { label:'Casey banner', fields:{ tag:t('Tag','Casey AI · Najaar 2026','Casey AI · Fall 2026'), title:ta('Titel','Casey ziet wat mensen overzien.','Casey sees what people miss.'), body:ta('Body','AI-augmented case management. Patroonherkenning, vroegsignalen, beleidsadvies.','AI-augmented case management. Pattern recognition, early signals, policy advice.') } },
          { label:'Founder section', fields:{ name:t('Naam','Laurence Van den Bergh','Laurence Van den Bergh'), role:t('Rol','Founder & CEO','Founder & CEO'), quote:ta('Quote','"Verzuim mag geen kostenpost zijn. Het is een signaal — en een kans om systeem te bouwen."','"Absence should not be a cost item. It is a signal — and a chance to build system."') } }
        ]
      ),

      // ─── ABOUT ────────────────────────────────────────────
      page('About','about.html','about-en.html','2026-05-14',
        { title:t('Browser-tab titel','About · Montisoro','About · Montisoro'),
          desc:ta('Meta-beschrijving','Wie we zijn, waarom we bestaan, wat we doen.','Who we are, why we exist, what we do.') },
        { eyebrow:t('Eyebrow','About','About'),
          title:ta('Hero titel','We zijn geen externe partij. We zijn uw verlengstuk.','We are not an external party. We are your extension.'),
          body:ta('Hero body','Een team van seniors die elke dag care herontwerpen tot capability.','A team of seniors redesigning care into capability every day.'),
          cta_primary:t('Primaire CTA','Ontmoet het team →','Meet the team →'),
          cta_secondary:t('Secundaire CTA','Plan een gesprek','Schedule a call') },
        [
          { label:'Mission statement', fields:{ title:ta('Titel','Care is not a feeling. It is a Capability.','Care is not a feeling. It is a Capability.'), body:ta('Body','Wij ontwerpen organisaties waar zorg geen extra is, maar systeem.','We design organizations where care is not extra, but system.') } },
          { label:'Origin · 1 Stilte', fields:{ num:t('Nummer','01','01'), title:t('Titel','Stilte','Silence'), body:ta('Body','Niemand zag wat speelde, totdat het te laat was.','No one saw what was happening, until it was too late.') } },
          { label:'Origin · 2 Onmacht', fields:{ num:t('Nummer','02','02'), title:t('Titel','Onmacht','Helplessness'), body:ta('Body','Iedereen deed iets. Niemand zag alles. Care viel tussen de stoelen.','Everyone did something. No one saw everything. Care fell between chairs.') } },
          { label:'Origin · 3 Inzicht', fields:{ num:t('Nummer','03','03'), title:t('Titel','Inzicht','Insight'), body:ta('Body','Care is geen functie. Het is een capability — verspreid, ondersteund, schaalbaar.','Care is not a function. It is a capability — distributed, supported, scalable.') } },
          { label:'Origin · 4 Montisoro', fields:{ num:t('Nummer','04','04'), title:t('Titel','Montisoro','Montisoro'), body:ta('Body','We bouwen het systeem dat care draagt. Voor wie verzuim opvangt.','We build the system that carries care. For those who absorb absence.') } },
          { label:'Principle 1', fields:{ num:t('Nummer','01','01'), title:t('Titel','We werken met seniors','We work with seniors'), body:ta('Body','Geen juniors. Geen tussenlaag. Direct met mensen die het al deden.','No juniors. No middle layer. Direct with people who have done it before.') } },
          { label:'Principle 2', fields:{ num:t('Nummer','02','02'), title:t('Titel','We installeren, we vervangen niet','We install, we do not replace'), body:ta('Body','We bouwen capability ín de organisatie. Wat blijft is van u.','We build capability into the organization. What stays is yours.') } },
          { label:'Principle 3', fields:{ num:t('Nummer','03','03'), title:t('Titel','Care is een systeem, geen functie','Care is a system, not a function'), body:ta('Body','We ontwerpen flows, niet rollen. Iedereen draagt. Niemand draagt alles.','We design flows, not roles. Everyone carries. No one carries everything.') } },
          { label:'Principle 4', fields:{ num:t('Nummer','04','04'), title:t('Titel','We schalen capability, niet effort','We scale capability, not effort'), body:ta('Body','Meer mensen = meer bezetting. Meer capability = meer organisatie.','More people = more headcount. More capability = more organization.') } },
          { label:'Principle 5', fields:{ num:t('Nummer','05','05'), title:t('Titel','Care zonder data is anekdote','Care without data is anecdote'), body:ta('Body','Storm levert het inzicht. Casey levert het patroon. Care wordt navigeerbaar.','Storm provides the insight. Casey provides the pattern. Care becomes navigable.') } }
        ]
      ),

      // ─── AANPAK ───────────────────────────────────────────
      page('Onze aanpak','aanpak.html','aanpak-en.html','2026-05-18',
        { title:t('Browser-tab titel','Onze aanpak · Montisoro','Our approach · Montisoro'),
          desc:ta('Meta-beschrijving','Het signaal vraagt om iets anders. Geen consultancy. Capability.','The signal asks for something different. Not consultancy. Capability.') },
        { eyebrow:t('Eyebrow','Onze aanpak','Our approach'),
          title:ta('Hero titel','Het is geen verzuimprobleem. Het is een capability-vraag.','It is not an absence problem. It is a capability question.'),
          body:ta('Hero body','Een aanpak die ziet, handelt en installeert wat blijft.','An approach that sees, acts and installs what stays.'),
          cta_primary:t('Primaire CTA','Start de ROI-calculator →','Start the ROI calculator →'),
          cta_secondary:t('Secundaire CTA','Doe de fit check','Take the fit check') },
        [
          { label:'Problem · Lead', fields:{ lead:ta('Lead pull-quote','"Iedereen doet iets. Maar niemand ziet alles."','"Everyone does something. But no one sees everything."'), punch:ta('Punch pull-quote','"Niet door gebrek aan inzet. Door gebrek aan systeem."','"Not by lack of effort. By lack of system."') } },
          { label:'Snelle check item 1', fields:{ text:t('Statement','Hetzelfde dossier zit bij 3 mensen — niemand heeft het overzicht.','The same case sits with 3 people — no one has the overview.') } },
          { label:'Snelle check item 2', fields:{ text:t('Statement','HR vraagt cijfers, krijgt verhalen.','HR asks for numbers, gets stories.') } },
          { label:'Snelle check item 3', fields:{ text:t('Statement','Een terugkeer wordt gevierd, en faalt 6 maanden later opnieuw.','A return is celebrated, and fails again 6 months later.') } },
          { label:'Snelle check item 4', fields:{ text:t('Statement','De preventiedienst signaleert wat niemand opvolgt.','Prevention signals what no one follows up.') } },
          { label:'Snelle check item 5', fields:{ text:t('Statement','Leidinggevenden weten wat er speelt — maar niet wat te doen.','Managers know what is happening — but not what to do.') } },
          { label:'Snelle check item 6', fields:{ text:t('Statement','Beleid bestaat op papier, niet in praktijk.','Policy exists on paper, not in practice.') } },
          { label:'Snelle check item 7', fields:{ text:t('Statement','Verzuimcijfers komen pas op tafel als ze al pijn doen.','Absence numbers only surface when they already hurt.') } },
          { label:'Snelle check item 8', fields:{ text:t('Statement','Niemand heeft tijd om patronen te zien.','No one has time to see patterns.') } },
          { label:'Contrast pair 1', fields:{ no:ta('Geen…','Geen losse begeleiding','No standalone coaching'), yes:ta('Maar…','Maar care als systeem','But care as system') } },
          { label:'Contrast pair 2', fields:{ no:ta('Geen…','Geen consultancy','No consultancy'), yes:ta('Maar…','Maar capability die blijft','But capability that stays') } },
          { label:'Contrast pair 3', fields:{ no:ta('Geen…','Geen dashboard','No dashboard'), yes:ta('Maar…','Maar technologie die handelt','But technology that acts') } },
          { label:'ROI bridge', fields:{ title:ta('Titel','Ook benieuwd wat verzuim écht kost?','Curious what absence really costs?'), question_no:ta('Niet langer','"Hoe volgen we dossiers beter op?"','"How do we track cases better?"'), question_yes:ta('Maar','"Hoe bouwen we een organisatie die vroeger ziet, beter handelt en minder verliest?"','"How do we build an organization that sees earlier, acts better and loses less?"'), tagline:t('Tagline','Daar begint de Montisoro-aanpak.','That\'s where the Montisoro approach begins.') } }
        ]
      ),

      // ─── TECHNOLOGIE ──────────────────────────────────────
      page('Technologie','technologie.html','technologie-en.html','2026-05-12',
        { title:t('Browser-tab titel','Technologie · Storm + Casey · Montisoro','Technology · Storm + Casey · Montisoro'),
          desc:ta('Meta-beschrijving','Operationele intelligentie voor verzuim. Storm vandaag. Casey AI in 2026.','Operational intelligence for absence. Storm today. Casey AI in 2026.') },
        { eyebrow:t('Eyebrow','Technologie','Technology'),
          title:ta('Hero titel','Human systems. Operational intelligence.','Human systems. Operational intelligence.'),
          body:ta('Hero body','Storm draait vandaag in productie. Casey AI volgt in najaar 2026.','Storm is in production today. Casey AI follows fall 2026.'),
          cta_primary:t('Primaire CTA','Vraag een Storm-demo →','Request a Storm demo →'),
          cta_secondary:t('Secundaire CTA','Casey waitlist','Casey waitlist') },
        [
          { label:'Storm · Feature 1', fields:{ title:t('Titel','Signaaldetectie','Signal detection'), body:ta('Body','Patronen zichtbaar maken voordat ze problemen worden.','Make patterns visible before they become problems.') } },
          { label:'Storm · Feature 2', fields:{ title:t('Titel','Dossierregie','Case orchestration'), body:ta('Body','Eén plek waar elk dossier loopt — geen excel, geen mailketens.','One place where every case runs — no excel, no email chains.') } },
          { label:'Storm · Feature 3', fields:{ title:t('Titel','Capability tracking','Capability tracking'), body:ta('Body','Volg hoe care-skills zich verspreiden in uw organisatie.','Track how care-skills spread in your organization.') } },
          { label:'Storm · Feature 4', fields:{ title:t('Titel','Beleidsmotor','Policy engine'), body:ta('Body','Beleid wordt regel, regel wordt actie. Automatisch.','Policy becomes rule, rule becomes action. Automatically.') } },
          { label:'Storm · Feature 5', fields:{ title:t('Titel','Compliance audit','Compliance audit'), body:ta('Body','KB RIT 3.0, GDPR en interne governance in één overzicht.','KB RIT 3.0, GDPR and internal governance in one overview.') } },
          { label:'Storm · Feature 6', fields:{ title:t('Titel','Inzicht voor directie','Insight for executives'), body:ta('Body','Strategische cijfers — niet voor managers, voor besluitvormers.','Strategic numbers — not for managers, for decision-makers.') } },
          { label:'Casey role · Case managers', fields:{ title:t('Titel','Voor case managers','For case managers'), body:ta('Body','Vroegsignalen, patroondetectie, advies voor het volgende gesprek.','Early signals, pattern detection, advice for the next conversation.') } },
          { label:'Casey role · HR', fields:{ title:t('Titel','Voor HR','For HR'), body:ta('Body','Bezetting, capability-spreiding, risico-zones in één view.','Headcount, capability distribution, risk zones in one view.') } },
          { label:'Casey role · Leidinggevenden', fields:{ title:t('Titel','Voor leidinggevenden','For managers'), body:ta('Body','Wat moet u nu doen met deze persoon, dit dossier, dit team.','What you should do now with this person, this case, this team.') } },
          { label:'Casey role · Preventie', fields:{ title:t('Titel','Voor preventiediensten','For prevention'), body:ta('Body','Aggregaat-inzichten — wat speelt er in welke afdeling, welk type werk.','Aggregate insights — what is happening in which department, what type of work.') } },
          { label:'Casey role · Directie', fields:{ title:t('Titel','Voor directie','For executives'), body:ta('Body','Strategisch overzicht. Hoe schaalbaar is uw care vandaag?','Strategic overview. How scalable is your care today?') } }
        ]
      ),

      // ─── INZICHTEN / CALCULATOR ───────────────────────────
      page('Inzichten','calculator.html','calculator-en.html','2026-05-10',
        { title:t('Browser-tab titel','ROI-calculator · Montisoro','ROI calculator · Montisoro'),
          desc:ta('Meta-beschrijving','Wat kost verzuim uw organisatie? Een eerste indicatie in 2 minuten.','What does absence cost your organization? A first indication in 2 minutes.') },
        { eyebrow:t('Eyebrow','ROI-calculator','ROI calculator'),
          title:ta('Hero titel','Wat kost verzuim u écht?','What does absence really cost you?'),
          body:ta('Hero body','Een eerste indicatie. Vaak genoeg om het juiste gesprek te starten.','A first indication. Often enough to start the right conversation.'),
          cta_primary:t('Primaire CTA','Start de berekening →','Start the calculation →'),
          cta_secondary:t('Secundaire CTA','','') },
        [
          { label:'Step 1 label', fields:{ name:t('Naam','Organisatie-grootte','Organization size') } },
          { label:'Step 2 label', fields:{ name:t('Naam','Loonkost','Salary cost') } },
          { label:'Step 3 label', fields:{ name:t('Naam','Bijkomende kosten','Additional costs') } },
          { label:'Step 4 label', fields:{ name:t('Naam','Werkdagen','Working days') } },
          { label:'Step 5 label', fields:{ name:t('Naam','Verzuimprofiel','Absence profile') } },
          { label:'Premium rapport CTA', fields:{ title:ta('Titel','Wilt u een premium rapport?','Want a premium report?'), body:ta('Body','Volledige analyse, sector-benchmarks, aanbevelingen voor uw context.','Full analysis, sector benchmarks, recommendations for your context.') } },
          { label:'Methodology disclaimer', fields:{ text:ta('Disclaimer','Indicatief, niet boekhoudkundig. Gebaseerd op SD Worx 2025 + interne data.','Indicative, not accounting. Based on SD Worx 2025 + internal data.') } }
        ]
      ),

      // ─── FIT CHECK ────────────────────────────────────────
      page('Fit check','fit-check.html','fit-check-en.html','2026-05-08',
        { title:t('Browser-tab titel','Fit check · Past Montisoro bij uw organisatie?','Fit check · Does Montisoro fit your organization?'),
          desc:ta('Meta-beschrijving','4 vragen. Persoonlijk advies. Geen verkoopgesprek.','4 questions. Personal advice. No sales pitch.') },
        { eyebrow:t('Eyebrow','Fit check','Fit check'),
          title:ta('Hero titel','Past Montisoro bij uw organisatie?','Does Montisoro fit your organization?'),
          body:ta('Hero body','Vier vragen. Twee minuten. Eerlijk advies — ook als we geen match zijn.','Four questions. Two minutes. Honest advice — even if we are not a match.'),
          cta_primary:t('Primaire CTA','Start de fit check →','Take the fit check →'),
          cta_secondary:t('Secundaire CTA','','') },
        [
          { label:'Dimensie 1', fields:{ title:t('Titel','Verzuimtype','Absence type'), body:ta('Body','Wat is het dominante patroon: kort, middellang of langdurig?','What is the dominant pattern: short, medium or long-term?') } },
          { label:'Dimensie 2', fields:{ title:t('Titel','Strategische focus','Strategic focus'), body:ta('Body','Waar wilt u uw care-capaciteit het meest versterken?','Where do you want to strengthen your care capacity most?') } },
          { label:'Dimensie 3', fields:{ title:t('Titel','Maturity','Maturity'), body:ta('Body','Hoe ontwikkeld is uw aanpak vandaag — van reactief tot transformatief?','How developed is your approach today — from reactive to transformative?') } },
          { label:'Dimensie 4', fields:{ title:t('Titel','Schaal','Scale'), body:ta('Body','Hoe groot is uw organisatie en welk volume vraagt dat?','How large is your organization and what volume does that require?') } },
          { label:'Receive 1', fields:{ text:t('Tekst','Een eerlijk antwoord — ook als we geen match zijn','An honest answer — even if we are not a match') } },
          { label:'Receive 2', fields:{ text:t('Tekst','Een aanbevolen route op basis van uw context','A recommended route based on your context') } },
          { label:'Receive 3', fields:{ text:t('Tekst','De dominante spanning waar u vandaag op botst','The dominant tension you bump into today') } },
          { label:'Receive 4', fields:{ text:t('Tekst','Een uitnodiging — als het past — voor een diagnosegesprek','An invitation — if it fits — for a diagnostic call') } }
        ]
      ),

      // ─── CONTACT ──────────────────────────────────────────
      page('Contact','contact.html','contact-en.html','2026-05-19',
        { title:t('Browser-tab titel','Contact · Montisoro','Contact · Montisoro'),
          desc:ta('Meta-beschrijving','Plan een diagnosegesprek. Online of bij u op kantoor.','Schedule a diagnostic call. Online or at your office.') },
        { eyebrow:t('Eyebrow','Contact','Contact'),
          title:ta('Hero titel','Laten we elkaar leren kennen.','Let\'s get to know each other.'),
          body:ta('Hero body','Drie manieren om in gesprek te gaan. Kies wat u uitkomt.','Three ways to start a conversation. Whichever suits you.'),
          cta_primary:t('Primaire CTA','Plan een gesprek →','Schedule a call →'),
          cta_secondary:t('Secundaire CTA','Stuur een e-mail','Send an email') },
        [
          { label:'Kanaal · Plan gesprek', fields:{ title:t('Titel','Plan een diagnosegesprek','Schedule a diagnostic call'), body:ta('Body','30-45 minuten. Online of bij u op kantoor.','30-45 minutes. Online or at your office.') } },
          { label:'Kanaal · E-mail', fields:{ title:t('Titel','Stuur een e-mail','Send an email'), body:ta('Body','Reactie binnen 24 uur tijdens werkdagen.','Reply within 24 hours on business days.') } },
          { label:'Kanaal · Telefoon', fields:{ title:t('Titel','Bel ons','Call us'), body:ta('Body','+32 477 89 91 86 — direct of laat een bericht achter.','+32 477 89 91 86 — direct or leave a message.') } },
          { label:'Office address', fields:{ name:t('Naam','Montisoro BV','Montisoro BV'), addr:ta('Adres','Tisseltstraat 25\n1880 Ramsdonk\nBelgië','Tisseltstraat 25\n1880 Ramsdonk\nBelgium'), btw:t('BTW','BE0733840137','BE0733840137') } },
          { label:'Reassurance · 1', fields:{ text:t('Tekst','Vertrouwelijk · gebruikt voor het gesprek','Confidential · used for the conversation') } },
          { label:'Reassurance · 2', fields:{ text:t('Tekst','Geen verkoopdruk · ook als we geen match zijn','No sales pressure · even if we are not a match') } },
          { label:'Reassurance · 3', fields:{ text:t('Tekst','Reactie binnen 24 uur · op werkdagen','Reply within 24 hours · on business days') } }
        ]
      ),

      // ─── PRIVACY ──────────────────────────────────────────
      page('Privacy','privacy.html','privacy-en.html','2026-04-30',
        { title:t('Browser-tab titel','Privacy statement · Montisoro','Privacy statement · Montisoro'),
          desc:ta('Meta-beschrijving','Hoe wij omgaan met uw gegevens. GDPR-conform.','How we handle your data. GDPR-compliant.') },
        { eyebrow:t('Eyebrow','Privacy statement','Privacy statement'),
          title:ta('Hero titel','Privacy statement','Privacy statement'),
          body:ta('Hero body','Laatst bijgewerkt: mei 2026','Last updated: May 2026'),
          cta_primary:t('Primaire CTA','','') ,
          cta_secondary:t('Secundaire CTA','','') },
        [
          { label:'Chapter 1 · Wie zijn we', fields:{ title:t('Titel','Wie zijn we?','Who are we?'), body:ta('Body','Montisoro BV, Tisseltstraat 25, 1880 Ramsdonk, België. BTW BE0733840137.','Montisoro BV, Tisseltstraat 25, 1880 Ramsdonk, Belgium. VAT BE0733840137.') } },
          { label:'Chapter 2 · Welke gegevens', fields:{ title:t('Titel','Welke gegevens verzamelen we?','What data do we collect?'), body:ta('Body','Naam, e-mail, organisatie. Alleen wat u zelf opgeeft via onze formulieren.','Name, email, organization. Only what you provide through our forms.') } },
          { label:'Chapter 3 · Doel & verwerking', fields:{ title:t('Titel','Doel & verwerking','Purpose & processing'), body:ta('Body','Uw gegevens dienen alleen om met u in gesprek te gaan. Geen marketing automation, geen verkoop.','Your data is only used to engage in conversation with you. No marketing automation, no sales.') } },
          { label:'Chapter 4 · Jouw rechten', fields:{ title:t('Titel','Jouw rechten','Your rights'), body:ta('Body','Inzage, rectificatie, verwijdering. Stuur een mail naar hello@montisoro.com.','Access, rectification, deletion. Email hello@montisoro.com.') } },
          { label:'Chapter 5 · Use cases', fields:{ title:t('Titel','Hoe we uw gegevens gebruiken','How we use your data'), body:ta('Body','Community, Scans, Gesprekken, Strategische partners.','Community, Scans, Conversations, Strategic partners.') } }
        ]
      ),

      // ─── DISCLAIMER ───────────────────────────────────────
      page('Disclaimer','disclaimer.html','disclaimer-en.html','2026-04-30',
        { title:t('Browser-tab titel','Disclaimer · Montisoro','Disclaimer · Montisoro'),
          desc:ta('Meta-beschrijving','Aansprakelijkheid, IP-rechten en derden.','Liability, IP rights and third parties.') },
        { eyebrow:t('Eyebrow','Disclaimer','Disclaimer'),
          title:ta('Hero titel','Disclaimer','Disclaimer'),
          body:ta('Hero body','Laatst bijgewerkt: mei 2026','Last updated: May 2026'),
          cta_primary:t('Primaire CTA','','') ,
          cta_secondary:t('Secundaire CTA','','') },
        [
          { label:'Chapter 1 · Algemeen', fields:{ title:t('Titel','Algemeen','General'), body:ta('Body','Deze disclaimer is van toepassing op de volledige Montisoro-website.','This disclaimer applies to the entire Montisoro website.') } },
          { label:'Chapter 2 · Aansprakelijkheid', fields:{ title:t('Titel','Aansprakelijkheid','Liability'), body:ta('Body','Montisoro is niet aansprakelijk voor schade door gebruik van de inhoud.','Montisoro is not liable for damages resulting from use of the content.') } },
          { label:'Chapter 3 · IP-rechten', fields:{ title:t('Titel','IP-rechten','IP rights'), body:ta('Body','Alle inhoud, design en code zijn intellectueel eigendom van Montisoro BV.','All content, design and code are intellectual property of Montisoro BV.') } },
          { label:'Chapter 4 · Derden', fields:{ title:t('Titel','Verwijzingen naar derden','References to third parties'), body:ta('Body','Externe links worden zonder garantie aangeboden.','External links are provided without warranty.') } },
          { label:'Chapter 5 · Toepasselijk recht', fields:{ title:t('Titel','Toepasselijk recht','Applicable law'), body:ta('Body','Belgisch recht is van toepassing. Rechtbank van Antwerpen, afdeling Mechelen.','Belgian law applies. Court of Antwerp, Mechelen division.') } }
        ]
      )

    ]
  };

  function kpi(d){
    var totalLeads = d.leads.length;
    var newLeads = d.leads.filter(function(l){return l.stage==='new';}).length;
    var qualLeads = d.leads.filter(function(l){return l.stage==='qualified'||l.stage==='diagnostic';}).length;
    var won = d.leads.filter(function(l){return l.stage==='won';}).length;
    var pipelineValue = d.leads
      .filter(function(l){return l.stage!=='won'&&l.stage!=='cold';})
      .reduce(function(s,l){return s + parseInt(String(l.value).replace(/\D/g,''),10);},0);
    var totalSubs = d.submissions.calculator.length + d.submissions.fitcheck.length + d.submissions.casey.length + d.submissions.contact.length;
    return {
      totalLeads:totalLeads, newLeads:newLeads, qualLeads:qualLeads, won:won,
      pipelineValue:pipelineValue, totalSubs:totalSubs,
      caseyWaitlist:d.submissions.casey.length,
      calcSubs:d.submissions.calculator.length,
      fitSubs:d.submissions.fitcheck.length,
      meetings:d.submissions.contact.length
    };
  }

  /* ── STAP 3 · staatslaag: migratie-veilige cache + source-besef ──
     localStorage is vanaf nu een CACHE, geen wegwerpbak:
     - load() verliest NOOIT data bij een versie-bump (carry-forward nieuwste oudere
       sleutel + merge op DEFAULT zodat nieuwe velden verschijnen);
     - reset() bewaart eerst een backup (herstelbaar i.p.v. definitief weg);
     - source() geeft aan of de admin op live (Supabase) of lokale data draait.
     Inert-safe: zonder oudere sleutel en zonder Supabase = exact het oude gedrag. */
  var KEY_PREFIX = 'montisoro.admin.data.';
  var BACKUP_KEY = KEY + '.backup';
  var _source = 'local';

  function deepMerge(base, over){
    if (over === undefined || over === null) return base;
    if (Array.isArray(base)) return Array.isArray(over) ? over : base;
    if (base && typeof base === 'object'){
      var out = {};
      Object.keys(base).forEach(function(k){ out[k] = deepMerge(base[k], over[k]); });
      Object.keys(over).forEach(function(k){ if (!(k in out)) out[k] = over[k]; });
      return out;
    }
    return over;
  }

  // Huidige sleutel eerst; anders de nieuwste OUDERE versie-sleutel → nooit stil dataverlies bij een bump.
  function priorRaw(){
    try { var cur = localStorage.getItem(KEY); if (cur) return cur; } catch(e){}
    try {
      var best=null, bestN=-1;
      for (var i=0;i<localStorage.length;i++){
        var k = localStorage.key(i);
        if (k && k.indexOf(KEY_PREFIX)===0 && k!==KEY && k!==BACKUP_KEY){
          var m = k.match(/\.v(\d+)$/); var n = m?parseInt(m[1],10):0;
          if (n>bestN){ bestN=n; best=k; }
        }
      }
      if (best) return localStorage.getItem(best);
    } catch(e){}
    return null;
  }

  function load(){
    try {
      var raw = priorRaw();
      if (!raw) return DEFAULT;
      return deepMerge(DEFAULT, JSON.parse(raw));
    } catch(e){ return DEFAULT; }
  }
  function save(d){
    try { localStorage.setItem(KEY, JSON.stringify(d)); return true; }
    catch(e){
      try {
        var I = window.MONTISORO_ADMIN_I18N;
        var msg = I ? I.t('save_failed') : 'Opslaan mislukt — uw wijziging is niet bewaard.';
        if (window.Admin && window.Admin.showToast) window.Admin.showToast(msg, 'alert-triangle');
      } catch(_){}
      return false;
    }
  }
  function reset(){
    try {
      var cur = localStorage.getItem(KEY);
      if (cur) localStorage.setItem(BACKUP_KEY, cur);   // herstelbaar i.p.v. definitief weg
      localStorage.removeItem(KEY);
    } catch(e){}
  }
  function source(){ return _source; }
  function setSource(s){ _source = (s==='live') ? 'live' : 'local'; }

  window.AdminData = {
    load:load, save:save, reset:reset, kpi:kpi,
    source:source, setSource:setSource, KEY:KEY
  };
})();
