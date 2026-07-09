/* ═══════════════════════════════════════════════════════════════════
   Montisoro — Fit check · gedeelde content + routing-engine (NL + EN)
   ───────────────────────────────────────────────────────────────────
   Bron van waarheid: "Guided Intake Flow" briefing v1.0 (klant).
   5 routes + Diagnose · resultaat = blokken A–E · 2 CTA-types.
   Toon: "u/uw" (NL) / "you/your" (EN) — consistent met de premium site.
   build(answers, lang) — lang 'nl' (default) of 'en'.
   Wordt geladen door fit-check(-en).html én fitcheck-rapport.html.
═══════════════════════════════════════════════════════════════════ */
(function (root) {
  'use strict';

  /* ═══════════════ NEDERLANDS ═══════════════ */
  var CTA_NL = {
    gesprek: {
      type: 'gesprek',
      label: 'Plan een strategisch gesprek',
      sub: '30 minuten. Geen verplichtingen. Wel een helder beeld.',
      micro: [
        'Wij bellen terug binnen 1 werkdag',
        'U spreekt rechtstreeks met een expert, niet met een salesmedewerker',
        'We nemen uw antwoorden mee in het gesprek'
      ],
      href: 'contact.html#channels'
    },
    deepdive: {
      type: 'deepdive',
      label: 'Boek een Deep Dive gesprek',
      sub: 'Een grondige verkenning van wat er speelt — en wat het vraagt.',
      micro: [
        'Duurt ongeveer 60–90 minuten',
        'We bereiden ons voor op basis van uw antwoorden',
        'U krijgt na het gesprek een beknopt adviesrapport'
      ],
      href: 'contact.html#channels'
    }
  };

  var ROUTES_NL = {
    route1: {
      name: 'Case Management & Expertise op maat',
      headline: 'Capaciteit en expertise wanneer nodig',
      intro: 'Op basis van uw antwoorden lijkt versterking van de opvolging van verzuimdossiers de meest aangewezen volgende stap.',
      A: 'Verzuimdossiers vragen meer dan opvolging alleen. Ze vragen tijd, expertise, afstemming met verschillende partijen en voortdurende aandacht.\n\nWanneer meerdere dossiers tegelijk lopen, ontstaat er vaak druk op de interne werking van de organisatie. Gesprekken worden uitgesteld, opvolging komt onder druk te staan en het risico neemt toe dat kansen op duurzame inzetbaarheid of een succesvolle terugkeer naar werk verloren gaan.\n\nU zoekt geen extra complexiteit. U zoekt een partner die mee verantwoordelijkheid opneemt.',
      B: 'Wij nemen het casebeheer van u over; volledig of aanvullend op uw interne werking.\n\nOnze casemanagers volgen medewerkers actief op, bewaken de voortgang van elk dossier en zorgen ervoor dat alle actoren op het juiste moment worden betrokken. Zo blijft elk dossier in beweging en behoudt u overzicht zonder zelf de dagelijkse opvolging te moeten organiseren.\n\nU behoudt de regie. Wij versterken uw capaciteit waar nodig.',
      C: [
        'Intake en analyse van lopende dossiers',
        'Persoonlijk casemanagement per medewerker',
        'Coördinatie met arbeidsgeneeskunde, leidinggevenden en externe partners',
        'Inzet van gespecialiseerde expertise bij complexe dossiers',
        'Heldere rapportering naar HR en management',
        'Tijdige escalatie bij verhoogde risico\u2019s of langdurige uitval',
        'Begeleiding richting duurzame werkhervatting'
      ],
      R: [
        'Minder operationele druk op interne organisatie',
        'Meer structuur en continuïteit in de opvolging',
        'Snellere interventies bij risicodossiers',
        'Betere kansen op succesvolle re-integratie',
        'Meer grip op verzuim zonder extra interne capaciteit'
      ],
      D: 'Organisaties schakelen Montisoro in wanneer de interne capaciteit onder druk komt te staan, wanneer complexe dossiers extra expertise vragen of wanneer een meer gestructureerde opvolging nodig is.',
      cta: 'gesprek',
      ctaSub: 'In 30 minuten een helder beeld.'
    },
    route2: {
      name: 'Opleiding & Tools',
      headline: 'Kennis, methodiek en tools die blijven werken',
      intro: 'Op basis van uw antwoorden lijkt verdere versterking van uw interne verzuimaanpak de meest aangewezen volgende stap.',
      A: 'Veel organisaties willen verzuim intern opvolgen en beschikken al over mensen, processen of eerste afspraken. Tegelijk vraagt een consequente aanpak meer dan goede intenties alleen.\n\nHR, leidinggevenden en interne casemanagers hebben nood aan gedeelde kennis, heldere gesprekstechnieken, praktische tools en voldoende vertrouwen om dossiers correct en consistent op te volgen.\n\nU zoekt geen externe overname. U zoekt een manier om uw interne werking sterker, consistenter en zelfstandiger te maken.',
      B: 'Wij versterken uw interne werking met opleiding, tools en praktijkgerichte begeleiding.\n\nGeen generieke opleiding, maar een traject dat vertrekt vanuit uw realiteit: uw type verzuim, uw maturiteit, uw organisatie en de situaties waarmee uw team vandaag geconfronteerd wordt.\n\nCentraal staat de Montisoro-methodologie: een combinatie van kennis, bewezen werkwijzen, praktijkervaring en digitale ondersteuning die organisaties helpt om verzuim consequent en professioneel op te volgen.\n\nZo bouwt u interne expertise op die niet afhankelijk is van één persoon, maar duurzaam verankerd wordt in uw organisatie.',
      C: [
        'Analyse van de bestaande interne werking en competenties',
        'Modulair opleidingsprogramma met theorie en casusoefeningen',
        'Praktijkgerichte training op basis van eigen situaties en dossiers',
        'Toegang tot de Montisoro-methodologie voor verzuimmanagement',
        'Digitale ondersteuning via STORM en evoluerende AI-functionaliteiten',
        'Ondersteuning bij analyse, besluitvorming en dossieropvolging',
        'Begeleide toepassing binnen de dagelijkse werking',
        'Tussentijdse checkpoints en bijsturing waar nodig',
        'Nazorg en expertondersteuning bij vragen of complexe situaties'
      ],
      R: [
        'Meer consistentie in de interne verzuimaanpak',
        'Sterkere kennis en vaardigheden bij HR, leidinggevenden en casemanagers',
        'Betere gesprekken met medewerkers',
        'Snellere herkenning van patronen en risico\u2019s',
        'Meer vertrouwen in beslissingen en opvolging',
        'Meer grip op verzuim vanuit de eigen organisatie',
        'Minder afhankelijkheid van externe ondersteuning',
        'Duurzaam verankerde expertise binnen de organisatie'
      ],
      D: 'Organisaties schakelen Montisoro in wanneer ze hun interne verzuimaanpak willen professionaliseren, hun mensen sterker willen maken of een consistente methodiek willen uitbouwen die duurzaam werkt binnen de organisatie.',
      cta: 'deepdive',
      ctaSub: 'Een analyse van uw huidige aanpak, expertise en ontwikkelpunten.'
    },
    route3: {
      name: 'Operationele structuur',
      headline: 'Duidelijke afspraken. Consistente opvolging.',
      intro: 'Op basis van uw antwoorden lijkt verdere afstemming van uw verzuimaanpak de meest aangewezen volgende stap.',
      A: 'Veel organisaties beschikken over de juiste intenties, betrokken medewerkers en bestaande afspraken rond verzuim. Toch blijkt het in de praktijk niet altijd eenvoudig om verzuim op een consistente manier op te volgen.\n\nWerkwijzen verschillen tussen afdelingen, verantwoordelijkheden zijn niet altijd even duidelijk en opvolging gebeurt niet overal volgens dezelfde aanpak. Daardoor ontstaan verschillen in kwaliteit, snelheid en besluitvorming.\n\nU zoekt geen extra complexiteit. U zoekt een duidelijke aanpak die gedragen wordt door de hele organisatie.',
      B: 'Wij vertalen verzuimaanpakken naar heldere processen, duidelijke verantwoordelijkheden en werkbare afspraken.\n\nGeen theoretisch model, maar een praktisch kader dat aansluit bij uw realiteit en eenvoudig toepasbaar is in de dagelijkse werking.\n\nZo ontstaat een uniforme aanpak die zorgt voor meer duidelijkheid, betere samenwerking en een consistente opvolging van verzuimdossiers.',
      C: [
        'Analyse van de huidige verzuimaanpak',
        'Evaluatie van rollen, verantwoordelijkheden en bestaande werkwijzen',
        'Ontwikkeling van een uniforme aanpak van melding tot werkhervatting',
        'Duidelijke afspraken per betrokken rol',
        'Praktische implementatiebegeleiding',
        'Ondersteuning bij interne afstemming en verandering',
        'Meetindicatoren voor opvolging en sturing',
        'Dashboarding en rapportering',
        'Begeleiding bij duurzame verankering in de dagelijkse werking'
      ],
      R: [
        'Meer duidelijkheid over rollen en verantwoordelijkheden',
        'Meer consistentie in de opvolging van verzuim',
        'Betere samenwerking tussen alle betrokken partijen',
        'Minder afhankelijkheid van individuele werkwijzen',
        'Meer grip op processen en besluitvorming',
        'Een aanpak die breed gedragen wordt binnen de organisatie'
      ],
      D: 'Organisaties schakelen Montisoro in wanneer hun aanpak doorheen de jaren is gegroeid, wanneer werkwijzen onvoldoende op elkaar aansluiten of wanneer meer afstemming nodig is om verzuim consequent op te volgen.',
      cta: 'route3',
      ctaSub: 'Een analyse van uw huidige aanpak, verantwoordelijkheden en ontwikkelpunten.'
    },
    route4: {
      name: 'Beleid & Strategie',
      headline: 'Richting geven aan duurzaam verzuimmanagement',
      intro: 'Op basis van uw antwoorden lijkt verdere verankering van verzuim op beleids- en organisatieniveau de meest aangewezen volgende stap.',
      A: 'Verzuim krijgt aandacht binnen de organisatie, maar die aandacht vertaalt zich niet altijd naar duidelijke doelstellingen, meetbare KPI\u2019s of een gedragen beleidskader.\n\nEr worden inspanningen geleverd, maar het ontbreekt soms aan een gemeenschappelijke visie op wat de organisatie wil bereiken, hoe vooruitgang wordt gemeten en welke prioriteiten daarbij horen.\n\nU zoekt geen losse initiatieven. U zoekt een kader dat richting geeft aan beleid, besluitvorming en resultaten.',
      B: 'Wij ontwikkelen verzuimbeleid dat verder gaat dan intenties of losse acties.\n\nVertrekkend vanuit data, organisatiedoelstellingen en de realiteit op de werkvloer vertalen we verzuim naar strategische keuzes, meetbare doelstellingen en duidelijke verantwoordelijkheden.\n\nZo ontstaat een beleidskader dat niet alleen richting geeft aan de organisatie, maar ook een basis vormt voor sturing, opvolging en continue verbetering.',
      C: [
        'Analyse van verzuimdata, bestaande initiatieven en huidige beleidskeuzes',
        'Benchmarking en identificatie van strategische aandachtspunten',
        'Ontwikkeling van een gedragen visie op verzuimmanagement',
        'Vertaling naar duidelijke doelstellingen en meetbare KPI\u2019s',
        'Vastleggen van verantwoordelijkheden, governance en besluitvorming',
        'Uitwerking van een formeel verzuimbeleid',
        'Afstemming met directie, management en relevante stakeholders',
        'Ondersteuning bij overleg met sociale partners indien gewenst',
        'Ontwikkeling van een evaluatie- en sturingskader'
      ],
      R: [
        'Een duidelijke visie op verzuimmanagement',
        'Meetbare doelstellingen en KPI\u2019s',
        'Meer sturing op resultaten in plaats van activiteiten',
        'Duidelijke verantwoordelijkheden en governance',
        'Betere onderbouwing van investeringen en beleidskeuzes',
        'Meer samenhang tussen strategie, uitvoering en opvolging',
        'Een gedragen beleid dat richting geeft aan de hele organisatie'
      ],
      D: 'Organisaties schakelen Montisoro in wanneer verzuim een strategisch thema wordt, wanneer bestaande inspanningen onvoldoende vertaald worden naar resultaten of wanneer er nood is aan een beleidskader dat richting geeft aan de verdere ontwikkeling van verzuimmanagement.',
      cta: 'gesprek',
      ctaSub: 'Een analyse van uw beleidskader, doelstellingen en sturingsmechanismen.'
    },
    route5: {
      name: 'Cultuur & Gedrag',
      headline: 'Care & Capability in balans',
      intro: 'Op basis van uw antwoorden lijkt verdere ontwikkeling van cultuur, leiderschap en gedrag rond verzuim de meest aangewezen volgende stap.',
      A: 'Veel organisaties beschikken vandaag over processen, afspraken en beleid rond verzuim. Toch blijven verzuimcijfers soms hardnekkig hoog of keren dezelfde patronen telkens terug.\n\nDan ligt de uitdaging niet alleen in wat de organisatie doet, maar vooral in hoe mensen met elkaar omgaan. Hoe leidinggevenden signalen herkennen. Hoe teams reageren op werkdruk. Hoe medewerkers zich gesteund voelen wanneer het moeilijk gaat.\n\nOrganisaties die sterk inzetten op zorg, lopen soms vast omdat verwachtingen, eigenaarschap en duurzame inzetbaarheid onvoldoende aandacht krijgen. Organisaties die vooral focussen op prestaties, missen dan weer de verbinding die nodig is om signalen tijdig op te vangen.\n\nDuurzaam verzuimmanagement vraagt beide: Care én Capability.\n\nU zoekt geen bijkomende procedure. U zoekt een cultuur waarin mensen zich gezien voelen én ondersteund worden om inzetbaar te blijven.',
      B: 'Wij ontwikkelen een Culture of Care & Capability (COCC): een organisatiecultuur waarin medewerkers ondersteund worden om inzetbaar te blijven én de organisatie in staat is die ondersteuning duurzaam te bieden.\n\nCare gaat over aandacht, verbinding, vertrouwen en het creëren van een omgeving waarin medewerkers zich gezien voelen.\n\nCapability gaat over het vermogen van de organisatie om werk werkbaar te maken, leidinggevenden te versterken en medewerkers te ondersteunen in hun inzetbaarheid, herstel en werkhervatting.\n\nDoor care toe te passen wordt de capability van medewerkers zichtbaar en versterkt. Door capability te ontwikkelen wordt de organisatie beter in staat om care duurzaam aan te bieden.\n\nZo versterken beide elkaar en ontstaat een cultuur waarin duurzame inzetbaarheid geen initiatief is, maar een vanzelfsprekend onderdeel van de dagelijkse werking.',
      C: [
        'Ontwikkeling van een evaluatie- en sturingskader',
        'Cultuurdiagnose rond gedrag, leiderschap en psychologische veiligheid',
        'Analyse van patronen die verzuim, uitval of terugval beïnvloeden',
        'Meting van Care- en Capability-factoren binnen de organisatie',
        'Analyse van werkbaarheid, verbinding en eigenaarschap',
        'Leiderschapsontwikkeling rond aanwezigheid, signalen en moeilijke gesprekken',
        'Teaminterventies rond vertrouwen, verantwoordelijkheid en samenwerking',
        'Versterking van psychologische veiligheid binnen teams',
        'Begeleiding rond duurzame inzetbaarheid, herstel en werkhervatting',
        'Verankering van gewenst gedrag in dagelijkse interacties',
        'Meting en evaluatie van evolutie in cultuur, leiderschap en verzuim'
      ],
      R: [
        'Meer verbinding tussen medewerkers en leidinggevenden',
        'Meer eigenaarschap rond aanwezigheid en inzetbaarheid',
        'Sterkere leidinggevenden in het herkennen en bespreken van signalen',
        'Meer psychologische veiligheid binnen teams',
        'Meer werkbaarheid en duurzame inzetbaarheid',
        'Meer succesvolle en duurzame werkhervattingen',
        'Een betere balans tussen zorg en verantwoordelijkheid',
        'Een cultuur waarin Care en Capability elkaar versterken'
      ],
      D: 'Organisaties schakelen Montisoro in wanneer verzuim hardnekkig aanwezig blijft ondanks bestaande processen of beleid, wanneer cultuur en leiderschap een grotere rol moeten opnemen in preventie of wanneer duurzame inzetbaarheid meer vraagt dan procedures alleen.',
      cta: 'deepdive',
      ctaSub: 'Een analyse van cultuur, leiderschap en duurzame inzetbaarheid.'
    },
    diagnose: {
      name: 'Diagnose',
      headline: 'Eerst begrijpen, dan pas richting kiezen.',
      A: 'Het is normaal dat u nog niet precies weet waar te beginnen. Dat is geen zwakte — het is het eerlijke startpunt van elke goede aanpak.',
      B: 'We starten met een verkennende diagnose: geen pitch, maar een eerlijk gesprek over wat er écht speelt. Op basis daarvan zeggen we welke richting voor u zinvol is — en als wij niet de juiste partij zijn, zeggen we dat ook.',
      C: [
        'Een open intakegesprek zonder vooraf bepaalde route',
        'Een eerste lezing van uw situatie: type verzuim, maturiteit en schaal',
        'Een eerlijke aanbeveling — gesprek, opleiding, structuur, beleid of cultuur',
        'Geen verplichtingen, vertrouwelijk'
      ],
      D: null,
      cta: 'deepdive'
    }
  };

  var COMBOS_NL = {
    'A+B': { label: 'Case Management + Zelf doen', route: 'route1', cta: 'gesprek',
      intro: 'U wilt dit uiteindelijk zelf in handen nemen — maar nu eerst de operationele druk verlichten.',
      B: 'We starten met case management als overbrugging en bouwen parallel uw interne expertise op via opleiding en tools. Een gefaseerd traject: fase 1 ontzorging, fase 2 overdracht.' },
    'A+C': { label: 'Case Management + Structuur', route: 'route1', cta: 'gesprek',
      intro: 'Terwijl we uw caseload overnemen, leggen we samen de basis voor een aanpak die u daarna zelf volhoudt.',
      B: 'We combineren operationele ontzorging met procesontwerp — een instaptraject dat evolueert naar zelfredzaamheid.' },
    'B+C': { label: 'Opleiding + Structuur', route: 'route2', cta: 'deepdive',
      intro: 'Een sterk team heeft een sterk raamwerk nodig — en een sterk raamwerk heeft mensen nodig die het kunnen dragen.',
      B: 'Een geïntegreerd traject: structuur én competentieontwikkeling als één pakket, geen twee aparte projecten.' },
    'C+D': { label: 'Structuur + Beleid', route: 'route3', cta: 'deepdive',
      intro: 'Een beleid dat niet in de praktijk werkt, is geen beleid.',
      B: 'We combineren top-down beleidsontwikkeling met bottom-up procesontwerp, en zorgen voor coherentie tussen beide lagen.' },
    'D+E': { label: 'Beleid + Cultuur', route: 'route4', cta: 'gesprek',
      intro: 'Een goed beleid zonder cultuurdrager verdwijnt in de la. Een cultuurshift zonder beleid mist de ruggengraat.',
      B: 'Het integrale traject: formeel beleid én cultuurverankering, opgezet als meerjarenprogramma met duidelijke milestones.' },
    'A+D': { label: 'Case Management + Beleid', route: 'route1', cta: 'gesprek',
      intro: 'U wilt vandaag ontzorgd worden — én de aanpak strategisch verankeren zodat het niet bij brandblussen blijft.',
      B: 'We nemen het casebeheer over zodat de druk daalt, en bouwen parallel een gedragen verzuimbeleid uit dat de aanpak op directieniveau verankert.' },
    'A+E': { label: 'Case Management + Cultuur', route: 'route1', cta: 'gesprek',
      intro: 'U wilt de acute caseload uit handen geven — en tegelijk werken aan de cultuur die het verzuim mee veroorzaakt.',
      B: 'We nemen de dossiers over voor directe ontlasting, en starten parallel een cultuurtraject zodat u niet alleen de symptomen behandelt maar ook de oorzaak.' },
    'B+D': { label: 'Opleiding + Beleid', route: 'route2', cta: 'deepdive',
      intro: 'U wilt het zelf leren doen — binnen een beleid dat die ambitie kracht bijzet.',
      B: 'We bouwen de interne capaciteit op via opleiding en tools, en verankeren dat in een formeel verzuimbeleid zodat de aanpak gedragen is van werkvloer tot directie.' },
    'B+E': { label: 'Opleiding + Cultuur', route: 'route2', cta: 'deepdive',
      intro: 'U wilt uw mensen sterker maken — en de cultuur waarin ze werken mee laten groeien.',
      B: 'We versterken de competenties van uw casemanagers en leidinggevenden, en werken tegelijk aan een cultuur van zorg en aanwezigheid — vaardigheden en mindset gaan hand in hand.' },
    'C+E': { label: 'Structuur + Cultuur', route: 'route3', cta: 'deepdive',
      intro: 'U wilt orde in de aanpak — én de cultuur die maakt dat mensen die aanpak ook echt dragen.',
      B: 'We brengen structuur in processen en rollen, en werken parallel aan gedrag en gesprekscultuur zodat het raamwerk niet op papier blijft maar gaat leven.' }
  };

  var LABELS_NL = {
    scale: { small:'< 100 medewerkers', mid:'100 – 500 medewerkers', large:'500 – 1.000 medewerkers', enterprise:'1.000+ medewerkers' },
    absence: { short:'Kort frequent verzuim', long:'Langdurig verzuim', mixed:'Beide types' },
    typePhrase: { short:'voornamelijk kort frequent verzuim', long:'voornamelijk langdurig verzuim', mixed:'beide types verzuim' },
    maturityPhrase: {
      1:'een aanpak die vandaag vooral ad hoc verloopt',
      2:'een aanpak die er is, maar nog niet werkt zoals u wilt',
      3:'een aanpak die bestaat, maar niet overal even consistent landt',
      4:'een aanpak die werkt en die u verder wilt verfijnen'
    },
    fSoftIntro: 'Het is normaal dat u nog niet precies weet waar te beginnen. Op basis van wat u invulde lijkt dit het meest relevant — laten we het samen verifiëren.',
    genericIntro: function(t, m){ return 'Op basis van uw antwoorden — ' + t + ' en ' + m + ' — zien we het volgende.'; },
    dash: '—'
  };

  /* ═══════════════ ENGLISH ═══════════════ */
  var CTA_EN = {
    gesprek: {
      type: 'gesprek',
      label: 'Book a strategic conversation',
      sub: '30 minutes. No obligations. Just a clear picture.',
      micro: [
        'We call back within 1 business day',
        'You speak directly with an expert, not a salesperson',
        'We bring your answers into the conversation'
      ],
      href: 'contact-en.html#channels'
    },
    deepdive: {
      type: 'deepdive',
      label: 'Book a Deep Dive session',
      sub: 'A thorough exploration of what is going on — and what it asks for.',
      micro: [
        'Takes around 60–90 minutes',
        'We prepare based on your answers',
        'You receive a concise advisory report afterwards'
      ],
      href: 'contact-en.html#channels'
    }
  };

  var ROUTES_EN = {
    route1: {
      name: 'Case Management & Tailored Expertise',
      headline: 'Capacity and expertise when you need it',
      intro: 'Based on your answers, strengthening the follow-up of absence cases appears to be the most relevant next step.',
      A: 'Absence cases ask for more than follow-up alone. They ask for time, expertise, alignment with different parties and continuous attention.\n\nWhen several cases run at once, pressure often builds on the internal workings of the organisation. Conversations get postponed, follow-up comes under strain and the risk grows that opportunities for sustainable employability or a successful return to work are lost.\n\nYou are not looking for extra complexity. You are looking for a partner who takes on shared responsibility.',
      B: 'We take case management off your hands; fully, or as a complement to your internal way of working.\n\nOur case managers actively follow up with employees, safeguard the progress of every case and make sure all parties are involved at the right moment. This keeps each case moving, and you keep oversight without having to organise the daily follow-up yourself.\n\nYou stay in control. We strengthen your capacity where needed.',
      C: [
        'Intake and analysis of ongoing cases',
        'Personal case management per employee',
        'Coordination with occupational medicine, managers and external partners',
        'Deployment of specialised expertise on complex cases',
        'Clear reporting to HR and management',
        'Timely escalation on heightened risks or long-term absence',
        'Guidance towards sustainable return to work'
      ],
      R: [
        'Less operational pressure on the internal organisation',
        'More structure and continuity in follow-up',
        'Faster interventions on at-risk cases',
        'Better chances of successful reintegration',
        'More grip on absence without extra internal capacity'
      ],
      D: 'Organisations call on Montisoro when internal capacity comes under pressure, when complex cases require extra expertise or when a more structured follow-up is needed.',
      cta: 'gesprek',
      ctaSub: 'A clear picture in 30 minutes.'
    },
    route2: {
      name: 'Training & Tools',
      headline: 'Knowledge, method and tools that keep working',
      intro: 'Based on your answers, further strengthening of your internal absence approach appears to be the most relevant next step.',
      A: 'Many organisations want to manage absence internally and already have people, processes or first agreements in place. At the same time, a consistent approach asks for more than good intentions alone.\n\nHR, managers and internal case managers need shared knowledge, clear conversation techniques, practical tools and enough confidence to follow up cases correctly and consistently.\n\nYou are not looking to hand it over. You are looking for a way to make your internal practice stronger, more consistent and more self-reliant.',
      B: 'We strengthen your internal practice with training, tools and hands-on guidance.\n\nNot generic training, but a programme that starts from your reality: your type of absence, your maturity, your organisation and the situations your team faces today.\n\nAt its core is the Montisoro methodology: a combination of knowledge, proven practices, field experience and digital support that helps organisations follow up absence consistently and professionally.\n\nThis way you build internal expertise that does not depend on a single person, but becomes durably anchored in your organisation.',
      C: [
        'Analysis of the existing internal practice and competencies',
        'Modular training programme with theory and case exercises',
        'Practice-based training using your own situations and cases',
        'Access to the Montisoro methodology for absence management',
        'Digital support via STORM and evolving AI functionalities',
        'Support with analysis, decision-making and case follow-up',
        'Guided application within daily operations',
        'Interim checkpoints and adjustment where needed',
        'Aftercare and expert support for questions or complex situations'
      ],
      R: [
        'More consistency in the internal absence approach',
        'Stronger knowledge and skills among HR, managers and case managers',
        'Better conversations with employees',
        'Faster recognition of patterns and risks',
        'More confidence in decisions and follow-up',
        'More grip on absence from within your own organisation',
        'Less dependence on external support',
        'Durably anchored expertise within the organisation'
      ],
      D: 'Organisations call on Montisoro when they want to professionalise their internal absence approach, strengthen their people or build a consistent methodology that works sustainably within the organisation.',
      cta: 'deepdive',
      ctaSub: 'An analysis of your current approach, expertise and development points.'
    },
    route3: {
      name: 'Operational Structure',
      headline: 'Clear agreements. Consistent follow-up.',
      intro: 'Based on your answers, further alignment of your absence approach appears to be the most relevant next step.',
      A: 'Many organisations have the right intentions, committed people and existing agreements around absence. Yet in practice it is not always easy to follow up absence in a consistent way.\n\nWays of working differ between departments, responsibilities are not always equally clear and follow-up does not happen everywhere in the same way. This creates differences in quality, speed and decision-making.\n\nYou are not looking for extra complexity. You are looking for a clear approach that the whole organisation supports.',
      B: 'We translate absence approaches into clear processes, clear responsibilities and workable agreements.\n\nNot a theoretical model, but a practical framework that fits your reality and is easy to apply in daily operations.\n\nThis creates a uniform approach that brings more clarity, better collaboration and consistent follow-up of absence cases.',
      C: [
        'Analysis of the current absence approach',
        'Evaluation of roles, responsibilities and existing ways of working',
        'Development of a uniform approach from notification to return to work',
        'Clear agreements per role involved',
        'Practical implementation support',
        'Support with internal alignment and change',
        'Indicators for follow-up and steering',
        'Dashboarding and reporting',
        'Guidance towards durable anchoring in daily operations'
      ],
      R: [
        'More clarity on roles and responsibilities',
        'More consistency in the follow-up of absence',
        'Better collaboration between all parties involved',
        'Less dependence on individual ways of working',
        'More grip on processes and decision-making',
        'An approach that is broadly supported within the organisation'
      ],
      D: 'Organisations call on Montisoro when their approach has grown over the years, when ways of working do not connect well enough or when more alignment is needed to follow up absence consistently.',
      cta: 'route3',
      ctaSub: 'An analysis of your current approach, responsibilities and development points.'
    },
    route4: {
      name: 'Policy & Strategy',
      headline: 'Giving direction to sustainable absence management',
      intro: 'Based on your answers, further anchoring of absence at policy and organisational level appears to be the most relevant next step.',
      A: 'Absence receives attention within the organisation, but that attention does not always translate into clear objectives, measurable KPIs or a supported policy framework.\n\nEfforts are made, but there is sometimes no shared vision on what the organisation wants to achieve, how progress is measured and which priorities belong to it.\n\nYou are not looking for loose initiatives. You are looking for a framework that gives direction to policy, decision-making and results.',
      B: 'We develop absence policy that goes beyond intentions or isolated actions.\n\nStarting from data, organisational objectives and the reality on the work floor, we translate absence into strategic choices, measurable objectives and clear responsibilities.\n\nThis creates a policy framework that not only gives direction to the organisation, but also forms a basis for steering, follow-up and continuous improvement.',
      C: [
        'Analysis of absence data, existing initiatives and current policy choices',
        'Benchmarking and identification of strategic focus points',
        'Development of a supported vision on absence management',
        'Translation into clear objectives and measurable KPIs',
        'Defining responsibilities, governance and decision-making',
        'Development of a formal absence policy',
        'Alignment with leadership, management and relevant stakeholders',
        'Support with consultation of social partners if desired',
        'Development of an evaluation and steering framework'
      ],
      R: [
        'A clear vision on absence management',
        'Measurable objectives and KPIs',
        'More steering on results instead of activities',
        'Clear responsibilities and governance',
        'Better grounding of investments and policy choices',
        'More coherence between strategy, execution and follow-up',
        'A supported policy that gives direction to the whole organisation'
      ],
      D: 'Organisations call on Montisoro when absence becomes a strategic topic, when existing efforts are insufficiently translated into results or when a policy framework is needed to give direction to the further development of absence management.',
      cta: 'gesprek',
      ctaSub: 'An analysis of your policy framework, objectives and steering mechanisms.'
    },
    route5: {
      name: 'Culture & Behaviour',
      headline: 'Care & Capability in balance',
      intro: 'Based on your answers, further development of culture, leadership and behaviour around absence appears to be the most relevant next step.',
      A: 'Many organisations today have processes, agreements and policy around absence in place. Yet absence figures sometimes remain stubbornly high, or the same patterns keep returning.\n\nThen the challenge lies not only in what the organisation does, but above all in how people interact. How managers recognise signals. How teams respond to workload. How employees feel supported when things get difficult.\n\nOrganisations that focus strongly on care sometimes get stuck because expectations, ownership and sustainable employability receive too little attention. Organisations that focus mainly on performance then miss the connection needed to catch signals in time.\n\nSustainable absence management asks for both: Care and Capability.\n\nYou are not looking for another procedure. You are looking for a culture where people feel seen and are supported to stay employable.',
      B: 'We develop a Culture of Care & Capability (COCC): an organisational culture in which employees are supported to stay employable and the organisation is able to offer that support sustainably.\n\nCare is about attention, connection, trust and creating an environment where employees feel seen.\n\nCapability is about the organisation\u2019s ability to make work workable, strengthen managers and support employees in their employability, recovery and return to work.\n\nBy applying care, the capability of employees becomes visible and is strengthened. By developing capability, the organisation becomes better able to offer care sustainably.\n\nThis way both reinforce each other and a culture emerges where sustainable employability is not an initiative, but a natural part of daily operations.',
      C: [
        'Development of an evaluation and steering framework',
        'Culture diagnosis around behaviour, leadership and psychological safety',
        'Analysis of patterns that influence absence, drop-out or relapse',
        'Measurement of Care and Capability factors within the organisation',
        'Analysis of workability, connection and ownership',
        'Leadership development around presence, signals and difficult conversations',
        'Team interventions around trust, responsibility and collaboration',
        'Strengthening psychological safety within teams',
        'Guidance around sustainable employability, recovery and return to work',
        'Anchoring desired behaviour in daily interactions',
        'Measurement and evaluation of evolution in culture, leadership and absence'
      ],
      R: [
        'More connection between employees and managers',
        'More ownership around presence and employability',
        'Stronger managers in recognising and discussing signals',
        'More psychological safety within teams',
        'More workability and sustainable employability',
        'More successful and sustainable returns to work',
        'A better balance between care and responsibility',
        'A culture where Care and Capability reinforce each other'
      ],
      D: 'Organisations call on Montisoro when absence stubbornly persists despite existing processes or policy, when culture and leadership need to take a greater role in prevention or when sustainable employability asks for more than procedures alone.',
      cta: 'deepdive',
      ctaSub: 'An analysis of culture, leadership and sustainable employability.'
    },
    diagnose: {
      name: 'Diagnosis',
      headline: 'First understand, then choose a direction.',
      A: 'It is normal not to know exactly where to begin. That is not a weakness — it is the honest starting point of any good approach.',
      B: 'We start with an exploratory diagnosis: no pitch, but an honest conversation about what is really going on. Based on that we tell you which direction makes sense for you — and if we are not the right party, we say so too.',
      C: [
        'An open intake conversation without a predetermined route',
        'A first reading of your situation: type of absence, maturity and scale',
        'An honest recommendation — conversation, training, structure, policy or culture',
        'No obligations, confidential'
      ],
      D: null,
      cta: 'deepdive'
    }
  };

  var COMBOS_EN = {
    'A+B': { label: 'Case Management + Doing it yourself', route: 'route1', cta: 'gesprek',
      intro: 'You want to take this into your own hands eventually — but first relieve the operational pressure now.',
      B: 'We start with case management as a bridge and build your internal expertise in parallel through training and tools. A phased programme: phase 1 relief, phase 2 handover.' },
    'A+C': { label: 'Case Management + Structure', route: 'route1', cta: 'gesprek',
      intro: 'While we take over your caseload, we lay the foundation together for an approach you can sustain yourself afterwards.',
      B: 'We combine operational relief with process design — an entry programme that evolves towards self-reliance.' },
    'B+C': { label: 'Training + Structure', route: 'route2', cta: 'deepdive',
      intro: 'A strong team needs a strong framework — and a strong framework needs people who can carry it.',
      B: 'An integrated programme: structure and competency development as one package, not two separate projects.' },
    'C+D': { label: 'Structure + Policy', route: 'route3', cta: 'deepdive',
      intro: 'A policy that does not work in practice is not a policy.',
      B: 'We combine top-down policy development with bottom-up process design, and ensure coherence between both layers.' },
    'D+E': { label: 'Policy + Culture', route: 'route4', cta: 'gesprek',
      intro: 'A good policy without a culture carrier disappears in the drawer. A culture shift without policy lacks the backbone.',
      B: 'The integral programme: formal policy and culture anchoring, set up as a multi-year programme with clear milestones.' },
    'A+D': { label: 'Case Management + Policy', route: 'route1', cta: 'gesprek',
      intro: 'You want to be relieved today — and to anchor the approach strategically so it does not stay firefighting.',
      B: 'We take over case management so the pressure drops, and build a supported absence policy in parallel that anchors the approach at leadership level.' },
    'A+E': { label: 'Case Management + Culture', route: 'route1', cta: 'gesprek',
      intro: 'You want to hand over the acute caseload — and at the same time work on the culture that helps cause the absence.',
      B: 'We take over the cases for immediate relief, and start a culture programme in parallel so you address not only the symptoms but also the cause.' },
    'B+D': { label: 'Training + Policy', route: 'route2', cta: 'deepdive',
      intro: 'You want to learn to do it yourself — within a policy that gives that ambition strength.',
      B: 'We build internal capacity through training and tools, and anchor it in a formal absence policy so the approach is supported from work floor to leadership.' },
    'B+E': { label: 'Training + Culture', route: 'route2', cta: 'deepdive',
      intro: 'You want to make your people stronger — and grow the culture they work in along with them.',
      B: 'We strengthen the competencies of your case managers and managers, and work at the same time on a culture of care and presence — skills and mindset go hand in hand.' },
    'C+E': { label: 'Structure + Culture', route: 'route3', cta: 'deepdive',
      intro: 'You want order in the approach — and the culture that makes people truly carry it.',
      B: 'We bring structure to processes and roles, and work in parallel on behaviour and conversation culture so the framework does not stay on paper but comes to life.' }
  };

  var LABELS_EN = {
    scale: { small:'< 100 employees', mid:'100 – 500 employees', large:'500 – 1,000 employees', enterprise:'1,000+ employees' },
    absence: { short:'Short frequent absence', long:'Long-term absence', mixed:'Both types' },
    typePhrase: { short:'mainly short frequent absence', long:'mainly long-term absence', mixed:'both types of absence' },
    maturityPhrase: {
      1:'an approach that is mostly ad hoc today',
      2:'an approach that exists, but does not yet work the way you want',
      3:'an approach that exists, but does not land consistently everywhere',
      4:'an approach that works and that you want to refine further'
    },
    fSoftIntro: 'It is normal not to know exactly where to begin. Based on what you filled in this seems most relevant — let us verify it together.',
    genericIntro: function(t, m){ return 'Based on your answers — ' + t + ' and ' + m + ' — we see the following.'; },
    dash: '—'
  };

  /* ──── Language packs ──── */
  var PACKS = {
    nl: { CTA: CTA_NL, ROUTES: ROUTES_NL, COMBOS: COMBOS_NL, L: LABELS_NL },
    en: { CTA: CTA_EN, ROUTES: ROUTES_EN, COMBOS: COMBOS_EN, L: LABELS_EN }
  };

  var NEED_TO_ROUTE = { A: 'route1', B: 'route2', C: 'route3', D: 'route4', E: 'route5' };

  /* ──── Helpers ──── */
  function getMaturity(q3){ return ({ A:1, B:2, C:3, D:4 })[q3] || 1; }
  function getScaleKey(q4){ return ({ 'lt100':'small','100-500':'mid','500-1000':'large','gt1000':'enterprise' })[q4] || 'mid'; }
  function getAbsenceKey(q1){ return ({ 'short':'short','long':'long','both':'mixed' })[q1] || 'mixed'; }

  function resolveCTA(pack, token, maturity){
    if (token === 'route3') return (maturity <= 2) ? pack.CTA.gesprek : pack.CTA.deepdive;
    return pack.CTA[token] || pack.CTA.gesprek;
  }

  function comboKeyFor(pack, needs){
    if (!needs || needs.length < 2) return null;
    var k = needs.slice().sort().join('+');
    return pack.COMBOS[k] ? k : null;
  }

  /* ──── Master build ──── */
  function build(answers, lang){
    answers = answers || {};
    var pack = PACKS[lang === 'en' ? 'en' : 'nl'];
    var L = pack.L;
    var needs = (answers.q2 || []).slice();
    var maturity = getMaturity(answers.q3);
    var scaleKey = getScaleKey(answers.q4);
    var absKey = getAbsenceKey(answers.q1);

    var routeKey, comboKey = null, comboMeta = null, fSoft = false;

    if (needs.indexOf('F') !== -1){
      if (needs.length === 1){
        routeKey = 'diagnose';
      } else {
        var other = needs.filter(function(n){ return n !== 'F'; })[0];
        routeKey = NEED_TO_ROUTE[other] || 'diagnose';
        fSoft = true;
      }
    } else {
      comboKey = comboKeyFor(pack, needs);
      if (comboKey){
        comboMeta = pack.COMBOS[comboKey];
        routeKey = comboMeta.route;
      } else {
        routeKey = NEED_TO_ROUTE[needs[0]] || 'diagnose';
      }
    }

    var route = pack.ROUTES[routeKey];

    var intro;
    if (comboMeta){
      intro = comboMeta.intro;
    } else if (fSoft){
      intro = L.fSoftIntro;
    } else if (route.intro){
      intro = route.intro;
    } else {
      intro = L.genericIntro(L.typePhrase[absKey] || L.dash, L.maturityPhrase[maturity] || L.dash);
    }

    var ctaToken = comboMeta ? comboMeta.cta : route.cta;
    if (fSoft) ctaToken = 'deepdive';
    var cta = resolveCTA(pack, ctaToken, maturity);
    cta = Object.assign({}, cta);
    if (route.ctaSub && !comboMeta && !fSoft) cta.sub = route.ctaSub;

    return {
      routeKey: routeKey,
      routeName: route.name,
      comboKey: comboKey,
      comboLabel: comboMeta ? comboMeta.label : null,
      headline: route.headline,
      intro: intro,
      blocks: {
        herkenning: route.A,
        oplossing: comboMeta ? comboMeta.B : route.B,
        verdieping: route.C.slice(),
        resultaat: route.R ? route.R.slice() : [],
        bewijs: route.D,
        bewijsRef: true
      },
      cta: cta,
      maturity: maturity,
      scaleKey: scaleKey,
      absenceKey: absKey,
      scaleLabel: (L.scale[scaleKey] || L.dash),
      absenceLabel: (L.absence[absKey] || L.dash),
      needs: needs,
      lang: (lang === 'en' ? 'en' : 'nl')
    };
  }

  root.MontisoroFitCheck = {
    build: build,
    PACKS: PACKS,
    ROUTES: ROUTES_NL,
    COMBOS: COMBOS_NL,
    CTA: CTA_NL
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = root.MontisoroFitCheck;
})(typeof window !== 'undefined' ? window : this);
