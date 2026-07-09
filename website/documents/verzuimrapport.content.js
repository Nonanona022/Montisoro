/* ═══════════════════════════════════════════════════════════════════
   Montisoro — Verzuimrapport · CONTENT bank (scenario's + conditionele copy)
   ───────────────────────────────────────────────────────────────────
   Gescheiden van de label-i18n omdat dit de zware, conditionele copy is
   (Casey-scenario's pagina 5 + per-categorie V1/V2/V3 pagina 6–8 + plan).
   Render kiest CONTENT[lang] en valt terug op NL zolang EN nog niet
   vertaald is ("EN later"). Sector-benchmarks komen uit de engine
   (SD Worx 2025: 3,18 / 3,10 / 3,86) — NIET hardcoded hier.
═══════════════════════════════════════════════════════════════════ */
(function (root) {
  'use strict';

  /* gedeelde rekenconstanten (taal-onafhankelijk) */
  var SCENARIOS = {
    // Scenario A — vroege inschatting via Casey AI (focus: duurtijd omlaag)
    A: { redu: [0.25, 0.30, 0.35] },
    // Scenario B — traditionele inschatting (week 8)
    B: { redu: [0.15, 0.20, 0.25] },
    // Scenario C — combinatie preventie + vroege AA (twee hefbomen)
    //   prev = minder ziekmeldingen (instroom) · dur = kortere duurtijd
    //   gecombineerde reductie = 1 − (1−prev)(1−dur)
    C: { prev: [0.15, 0.20, 0.25], dur: [0.30, 0.35, 0.38] }
  };
  // drempel waarbinnen een categorie "gelijk" aan de benchmark is (procentpunt)
  var EQUAL_BAND = 0.3;

  var NL = {
    /* ── pagina 2 · executive summary narratief ── */
    exec_intro: 'Dit rapport brengt de impact van verzuim binnen uw organisatie in kaart op basis van de door u aangeleverde gegevens. Het biedt een onderbouwde analyse van de huidige situatie, de financiële gevolgen en de opportuniteiten om kosten te beheersen en duurzame inzetbaarheid te versterken.',
    exec_intro2: 'Verzuim raakt niet alleen de loonkost, maar ook productiviteit, continuïteit, klantentevredenheid en de werkdruk binnen teams. Door die impact zichtbaar te maken, ondersteunt dit rapport strategische besluitvorming rond welzijn, leiderschap en organisatieontwikkeling.',
    exec_list_h: 'In dit rapport vindt u:',
    exec_list: [
      'Een overzicht van de ingegeven organisatie- en verzuimgegevens.',
      'De directe en totale verzuimkost, per kalenderdag en per werkdag.',
      'Een financiële impact-simulator met de hefboom van vroege inschatting.',
      'Een analyse van kort, middellang en langdurig verzuim t.o.v. de sector.',
      'Strategische inzichten in de belangrijkste drivers en risicozones.',
      'Concrete aanbevelingen en een plan van aanpak om verzuim te beheersen.'
    ],
    exec_close: 'Wat gemeten wordt, kan gestuurd worden. Dit rapport helpt u verzuim niet enkel als kost te zien, maar als een strategische hefboom voor duurzame groei en operationele excellentie.',

    /* ── pagina 5 · Casey AI-simulator intro ── */
    sim_intro: 'Casey AI is ons agentic framework dat het arbeidspotentieel inschat via de Montisoro-reïntegratiescore. Het bepaalt urgentie vanaf het eerste contact en versnelt de doorstroom naar de arbeidsarts. Dit hoofdstuk toont wat dat oplevert.',
    sim_two_h: 'Twee getallen die vaak verward worden',
    sim_two_a: 'Instroom — het aantal medewerkers dat ziek wordt.',
    sim_two_b: 'Duurtijd — hoelang ze gemiddeld ziek blijven.',
    sim_two_note: 'Dezelfde 15 mensen ziek, maar gemiddeld 20 in plaats van 32 dagen, scheelt honderdduizenden euro\u2019s. De instroom blijft gelijk; de duurtijd halveert. Vroege inschatting werkt op duurtijd, niet op instroom.',
    sim_method: 'Besparing = jaarlijkse verzuimkost × duurtijd-reductie. De kost daalt evenredig met het aantal vermeden ziektedagen (kost per dag × vermeden dagen).',
    scen_A_name: 'Vroege inschatting via Casey AI',
    scen_A_sub: 'Focus: duurtijd omlaag. Arbeidspotentieel-inschatting in week 2–4, niet week 8. Taakaanpassingen starten snel.',
    scen_B_name: 'Traditionele inschatting (week 8)',
    scen_B_sub: 'Standaard KB RIT 3.0. Zes weken wachten waarin niets gebeurt — de reïntegratiekans zakt, de duurtijd loopt op.',
    scen_C_name: 'Combinatie — preventie + vroege AA',
    scen_C_sub: 'Twee hefbomen tegelijk: minder ziekmeldingen (COCC, werkdruk-analyse) én kortere duurtijd (Casey AI). Maximale impact.',
    scen_col_est: 'Inschatting',
    scen_col_redu: 'Duurtijd-reductie',
    scen_col_save: 'Jaarlijkse besparing',
    scen_col_rate: 'Verzuim daalt naar',
    scen_levels3: ['Voorzichtig', 'Realistisch', 'Goed'],
    scen_levelsC: ['Realistisch', 'Goed', 'Ambitieus'],
    scen_AB_note: 'Hetzelfde aantal mensen wordt ziek — maar ze zijn korter ziek. Dus minder totale ziektedagen, en minder kosten.',
    scen_C_note: 'Nu bewegen beide getallen: minder mensen ziek (instroom daalt) én korter ziek (duurtijd daalt). Preventie stopt nieuwe meldingen, reïntegratie haalt mensen sneller terug — u hoeft niet te kiezen.',

    /* ── pagina 6–8 · benchmark-intro ── */
    cat_intro: 'De benchmark is gebaseerd op de SD Worx Verzuimbarometer (België). Per verzuimtype tonen we uw positie ten opzichte van het sectorgemiddelde, met een gerichte duiding en aanbevolen acties.',
    cat_you: 'Uw percentage',
    cat_sector: 'Sectorgemiddelde',
    cat_analyse_h: 'Analyse',
    cat_kenmerk_h: 'Wat we vaak zien',
    cat_aandacht_h: 'Aandachtspunt',
    cat_acties_h: 'Aanbevolen acties',
    cat_doel_h: 'Doelstelling',
    catname: { K: 'Kort verzuim', M: 'Middellang verzuim', L: 'Langdurig verzuim' },
    catdef: { K: '≤ 1 maand', M: '1 – 12 maanden', L: '> 1 jaar' },

    /* per-categorie conditionele copy — variant: better | equal | above */
    cat: {
      K: {
        better: {
          tone: 'good', status: 'Beter dan de benchmark',
          analyse: 'Uw kort verzuim ligt onder het sectorgemiddelde. Dit wijst op een sterke operationele basis en een effectieve beheersing van kortdurende afwezigheden.',
          kenmerk: ['Consequente opvolging en een doordacht terugkeerbeleid', 'Leidinggevenden die signalen vroeg detecteren en bespreekbaar maken', 'Voldoende flexibiliteit om tijdelijke uitval op te vangen'],
          aandacht: 'Een gunstig resultaat vandaag biedt geen garantie voor morgen. Lage cijfers behouden vraagt blijvende aandacht voor leiderschap, werkorganisatie en welzijn.',
          acties: ['Borg succesvolle praktijken rond aanwezigheids- en terugkeerbeleid', 'Deel goede aanpakken tussen teams en afdelingen', 'Monitor verschillen tussen afdelingen om afwijkingen tijdig te zien'],
          doel: 'Behoud van de huidige sterke positie met een kort verzuim onder 3,0%.',
          prio: 'Prioriteit 3 · borgen'
        },
        equal: {
          tone: 'equal', status: 'Gelijk met de benchmark',
          analyse: 'Uw kort verzuim bevindt zich op het sectorgemiddelde. U presteert zoals verwacht binnen de marktcontext, maar er is weinig buffer wanneer de verzuimdruk toeneemt.',
          kenmerk: ['Een basisaanpak voor opvolging en terugkeer', 'Verzuimopvolging die niet altijd consistent verloopt', 'Een beperkt aantal preventieve welzijnsinitiatieven'],
          aandacht: 'Benchmarkniveau biedt stabiliteit, maar geen voorsprong. De grootste opportuniteit ligt in een structurele voorsprong opbouwen, niet in een probleem oplossen.',
          acties: ['Versterk leidinggevenden in het vroeg detecteren van signalen', 'Verhoog bewustzijn rond aanwezigheid en terugkeer', 'Analyseer verschillen tussen afdelingen om lokale risico\u2019s zichtbaar te maken'],
          doel: 'Doorgroeien naar een kort verzuim onder het sectorgemiddelde.',
          prio: 'Prioriteit 2 · versterken'
        },
        above: {
          tone: 'warn', status: 'Boven de benchmark',
          analyse: 'Uw kort verzuim ligt boven het sectorgemiddelde. Dat hoeft geen structureel probleem te zijn, maar het is een signaal dat aandacht verdient voor kortdurende afwezigheden niet evolueren naar frequenter of langer verzuim.',
          kenmerk: ['Verhoogde werkdruk of onevenwichtige taakverdeling', 'Uitdagingen in teamdynamiek, leiderschap of werkklimaat', 'Onvoldoende vroege detectie en preventieve opvolging'],
          aandacht: 'Kort verzuim is vaak de eerste zichtbare indicator van bredere welzijnsvraagstukken. Hoe vroeger signalen worden gedetecteerd, hoe groter de kans om escalatie en kosten te voorkomen.',
          acties: ['Analyseer de belangrijkste verzuimdrivers binnen de organisatie', 'Versterk gesprekstechnieken van leidinggevenden rond aanwezigheid', 'Maak verzuim bespreekbaar vanuit ondersteuning, niet vanuit controle'],
          doel: 'Verlaag het kort verzuim stapsgewijs naar het sectorgemiddelde binnen 6 tot 12 maanden.',
          prio: 'Prioriteit 1 · bijsturen'
        }
      },
      M: {
        better: {
          tone: 'good', status: 'Beter dan de benchmark',
          analyse: 'Uw middellang verzuim ligt onder het sectorgemiddelde. Dit wijst op een sterke capaciteit om medewerkers te begeleiden tijdens afwezigheden van één tot zes maanden en hen duurzaam te reïntegreren.',
          kenmerk: ['Gestructureerde verzuim- en reïntegratiebegeleiding', 'Tijdige opvolging tijdens de afwezigheid', 'Nauwe samenwerking tussen leidinggevenden, HR en betrokken actoren'],
          aandacht: 'Sterke prestaties zijn vaak het resultaat van consistente processen. Veranker succesvolle werkwijzen structureel, los van individuele personen.',
          acties: ['Documenteer en standaardiseer verzuim- en reïntegratieprocessen', 'Deel goede praktijken van sterk presterende afdelingen organisatiebreed', 'Veranker Culture of Care & Capability verder in de dagelijkse werking'],
          doel: 'Optimaliseer het middellang verzuim verder richting 1,5% – 1,7%.',
          prio: 'Prioriteit 3 · borgen'
        },
        equal: {
          tone: 'equal', status: 'Gelijk met de benchmark',
          analyse: 'Uw middellang verzuim ligt op het sectorgemiddelde. Net in deze categorie ligt vaak de grootste opportuniteit: hier wordt bepaald of medewerkers terugkeren, dan wel doorstromen naar langdurig verzuim.',
          kenmerk: ['Een gestructureerde, consistente casemanagementaanpak', 'Duidelijk eigenaarschap van verzuimdossiers', 'Tijdige evaluatie van arbeidspotentieel en terugkeerscenario\u2019s'],
          aandacht: 'Kleine optimalisaties in de begeleiding hebben hier een disproportioneel grote impact op zowel verzuimduur als totale kost. De winst zit in consistentie, niet in extra interventies.',
          acties: ['Wijs één duidelijke casemanager toe per dossier', 'Evalueer arbeidspotentieel vanaf de eerste weken', 'Stuur datagedreven op trends, doorlooptijden en risicoprofielen'],
          doel: 'Verlaag het middellang verzuim van het sectorniveau naar circa 1,5%.',
          prio: 'Prioriteit 1 · hoogste ROI'
        },
        above: {
          tone: 'warn', status: 'Boven de benchmark',
          analyse: 'Uw middellang verzuim ligt boven het sectorgemiddelde. Dit is de overgangsfase tussen kort en langdurig verzuim: zonder gerichte interventie stroomt een deel van deze dossiers door naar langdurige afwezigheid.',
          kenmerk: ['Onvoldoende gestructureerd casemanagement', 'Onduidelijk eigenaarschap van dossiers', 'Te late inschatting van arbeidspotentieel', 'Beperkt gebruik van taak- en werkplekaanpassingen'],
          aandacht: 'Dit is de categorie met de grootste impact op toekomstig langdurig verzuim. Elke maand langer afwezig verlaagt de kans op een duurzame terugkeer. Vroege, consistente regie is cruciaal.',
          acties: ['Analyseer waarom medewerkers langer afwezig blijven dan verwacht', 'Structureer casemanagement met vaste contactmomenten', 'Maak taak- en werkplekaanpassingen een vast onderdeel van elk traject', 'Detecteer dossiers met verhoogd escalatierisico vroeg'],
          doel: 'Verlaag het middellang verzuim naar het sectorgemiddelde.',
          prio: 'Prioriteit 1 · kritisch'
        }
      },
      L: {
        better: {
          tone: 'good', status: 'Onder de benchmark',
          analyse: 'Uw langdurig verzuim ligt onder het sectorgemiddelde. Dit wijst op een sterke beheersing van langdurige afwezigheden en een effectieve aanpak om uitval te voorkomen.',
          kenmerk: ['Sterke opvolging van middellange dossiers en reïntegratie', 'Voldoende flexibiliteit in functies en werkorganisatie', 'Tijdige ondersteuning vóór problemen escaleren'],
          aandacht: 'Een laag langdurig verzuim is opgebouwd over jaren. Behoud vraagt blijvende aandacht voor reïntegratie en werkbaar werk. De grootste kans op werkhervatting ligt in het eerste jaar.',
          acties: ['Blijf investeren in de aanpak van middellang verzuim', 'Voorzie individuele reïntegratietrajecten voor bestaande dossiers', 'Onderzoek job crafting, aangepaste taken en gefaseerde werkhervatting'],
          doel: 'Behoud van het langdurig verzuim onder het sectorgemiddelde.',
          prio: 'Prioriteit 3 · consolideren'
        },
        equal: {
          tone: 'equal', status: 'Gelijk met de benchmark',
          analyse: 'Uw langdurig verzuim ligt op het sectorgemiddelde. Deze categorie heeft de grootste impact op kosten en personeelsbeschikbaarheid en verdient daarom bijzondere aandacht.',
          kenmerk: ['Actieve begeleiding van bestaande langdurige dossiers', 'Focus op het voorkomen van nieuwe instroom', 'Realistische terugkeerstrategieën met aangepast werk'],
          aandacht: 'De eerste twaalf maanden zijn cruciaal voor reïntegratie. Tegelijk blijft middellang verzuim de belangrijkste voorspeller van toekomstige uitval — een sterke aanpak daar is de beste preventie.',
          acties: ['Voorzie actieve opvolging met een casemanager per dossier', 'Faciliteer deeltijdse of gefaseerde werkhervatting', 'Versterk de opvolging in de middellange fase om instroom te voorkomen'],
          doel: 'Behoud op of onder het sectorgemiddelde en verhoog de reactivatie van bestaande dossiers.',
          prio: 'Prioriteit 2 · actieve beheersing'
        },
        above: {
          tone: 'warn', status: 'Boven de benchmark',
          analyse: 'Uw langdurig verzuim ligt boven het sectorgemiddelde. Dit heeft doorgaans de grootste impact op kosten, productiviteit en continuïteit. Het ontstaat zelden plots — meestal door onvoldoende onderbreking in eerdere verzuimfases.',
          kenmerk: ['Onvoldoende beheersing van middellang verzuim, met doorstroom naar lang', 'Complexe dossiers met medische of psychosociale factoren'],
          aandacht: 'De sterkste voorspeller van langdurig verzuim is een verhoogd middellang verzuim. De grootste hefboom ligt dus in het voorkomen van nieuwe instroom, naast snelle actie op bestaande dossiers.',
          acties: ['Versterk de aanpak van middellang verzuim — dit is de hoofdprioriteit', 'Activeer bestaande dossiers binnen het eerste jaar van afwezigheid', 'Onderzoek job crafting en alternatieve functies', 'Zet externe expertise en gespecialiseerde begeleiding gericht in'],
          doel: 'Verlaag het langdurig verzuim naar het sectorgemiddelde binnen 6 tot 12 maanden.',
          prio: 'Prioriteit 1 · urgent'
        }
      }
    },

    /* ── pagina 9 · strategische inzichten labels ── */
    si_fte_h: 'FTE-equivalent',
    si_bench_h: 'Benchmark-context',
    si_cascade_h: 'Cascade-risico',
    si_cascade_txt: 'Onaangepakt middellang verzuim stroomt doorgaans binnen 6–12 maanden door naar langdurig verzuim — de duurste categorie. Vroege regie onderbreekt die cascade.',
    si_save_h: 'Besparingsscenario\u2019s',

    /* ── pagina 10 · conclusie + plan ── */
    concl_h: 'Conclusie',
    concl_body: 'De vraag is niet óf deze kost beïnvloedbaar is, maar in welke mate u er actief op stuurt. Organisaties die verzuim succesvol terugdringen, excelleren doorgaans op drie domeinen: inzicht in de werkelijke oorzaken, structuur in begeleiding en preventie, en sturing op basis van realtime data en voorspellende inzichten.',
    concl_close: 'Verzuim is geen onvermijdelijke kost, maar een strategische managementuitdaging. Wie vandaag investeert in een gerichte aanpak, creëert morgen een gezondere organisatie, lagere kosten en hogere duurzame inzetbaarheid.',
    plan_h: 'Plan van aanpak — volgende stap',
    plan_sub: 'In 30 minuten scherp krijgen wat telt. Dit rapport geeft data; de echte waarde zit in een gericht gesprek.',
    plan_steps: [
      'Waar de grootste impact zit en welke ingrepen haalbaar zijn',
      'Integratie van Storm, Casey AI en het COCC-programma',
      'Realistische besparingen en een concreet 30/60/90-dagenplan'
    ]
  };

  var EN = {
    exec_intro: 'This report maps the impact of absence within your organisation based on the data you provided. It offers a substantiated analysis of the current situation, the financial consequences and the opportunities to control costs and strengthen sustainable employability.',
    exec_intro2: 'Absence affects not only wage cost, but also productivity, continuity, customer satisfaction and workload within teams. By making that impact visible, this report supports strategic decision-making on wellbeing, leadership and organisational development.',
    exec_list_h: 'In this report you will find:',
    exec_list: [
      'An overview of the organisation and absence data you entered.',
      'The direct and total absence cost, per calendar day and per working day.',
      'A financial impact simulator showing the leverage of early assessment.',
      'An analysis of short, medium and long-term absence versus the sector.',
      'Strategic insights into the main drivers and risk zones.',
      'Concrete recommendations and an action plan to manage absence.'
    ],
    exec_close: 'What gets measured can be managed. This report helps you see absence not merely as a cost, but as a strategic lever for sustainable growth and operational excellence.',

    sim_intro: 'Casey AI is our agentic framework that assesses work capacity via the Montisoro reintegration score. It determines urgency from the first contact and accelerates the referral to the occupational physician. This chapter shows what that yields.',
    sim_two_h: 'Two figures that are often confused',
    sim_two_a: 'Inflow — the number of employees who fall ill.',
    sim_two_b: 'Duration — how long they remain absent on average.',
    sim_two_note: 'The same 15 people ill, but averaging 20 instead of 32 days, saves hundreds of thousands of euros. The inflow stays the same; the duration halves. Early assessment works on duration, not on inflow.',
    sim_method: 'Saving = annual absence cost × duration reduction. The cost falls proportionally to the number of sick days avoided (cost per day × days avoided).',
    scen_A_name: 'Early assessment via Casey AI',
    scen_A_sub: 'Focus: reduce duration. Work-capacity assessment in week 2–4, not week 8. Task adjustments start quickly.',
    scen_B_name: 'Traditional assessment (week 8)',
    scen_B_sub: 'Standard RD RTW 3.0. Six weeks of waiting in which nothing happens — the reintegration chance drops, duration rises.',
    scen_C_name: 'Combination — prevention + early assessment',
    scen_C_sub: 'Two levers at once: fewer sick reports (COCC, workload analysis) and shorter duration (Casey AI). Maximum impact.',
    scen_col_est: 'Estimate',
    scen_col_redu: 'Duration reduction',
    scen_col_save: 'Annual saving',
    scen_col_rate: 'Absence drops to',
    scen_levels3: ['Cautious', 'Realistic', 'Strong'],
    scen_levelsC: ['Realistic', 'Strong', 'Ambitious'],
    scen_AB_note: 'The same number of people fall ill — but they are ill for shorter. So fewer total sick days, and lower costs.',
    scen_C_note: 'Now both figures move: fewer people ill (inflow drops) and shorter illness (duration drops). Prevention stops new reports, reintegration brings people back faster — you do not have to choose.',

    cat_intro: 'The benchmark is based on the SD Worx Absence Barometer (Belgium). For each absence type we show your position relative to the sector average, with targeted interpretation and recommended actions.',
    cat_you: 'Your percentage',
    cat_sector: 'Sector average',
    cat_analyse_h: 'Analysis',
    cat_kenmerk_h: 'What we often see',
    cat_aandacht_h: 'Point of attention',
    cat_acties_h: 'Recommended actions',
    cat_doel_h: 'Objective',
    catname: { K: 'Short-term absence', M: 'Medium-term absence', L: 'Long-term absence' },
    catdef: { K: '≤ 1 month', M: '1 – 12 months', L: '> 1 year' },

    cat: {
      K: {
        better: {
          tone: 'good', status: 'Better than the benchmark',
          analyse: 'Your short-term absence is below the sector average. This indicates a strong operational foundation and effective control of short-duration absences.',
          kenmerk: ['Consistent follow-up and a deliberate return-to-work policy', 'Managers who detect signals early and make them discussable', 'Enough flexibility to absorb temporary absence'],
          aandacht: 'A favourable result today is no guarantee for tomorrow. Keeping figures low requires continued attention to leadership, work organisation and wellbeing.',
          acties: ['Safeguard successful attendance and return-to-work practices', 'Share good approaches between teams and departments', 'Monitor differences between departments to spot deviations early'],
          doel: 'Maintain the current strong position with short-term absence below 3.0%.',
          prio: 'Priority 3 · safeguard'
        },
        equal: {
          tone: 'equal', status: 'In line with the benchmark',
          analyse: 'Your short-term absence sits at the sector average. You perform as expected within the market context, but there is little buffer should absence pressure increase.',
          kenmerk: ['A basic approach to follow-up and return', 'Absence follow-up that is not always consistent', 'A limited number of preventive wellbeing initiatives'],
          aandacht: 'Benchmark level offers stability, but no advantage. The biggest opportunity lies in building a structural lead, not in solving a problem.',
          acties: ['Strengthen managers in detecting signals early', 'Raise awareness around attendance and return', 'Analyse differences between departments to surface local risks'],
          doel: 'Grow towards short-term absence below the sector average.',
          prio: 'Priority 2 · strengthen'
        },
        above: {
          tone: 'warn', status: 'Above the benchmark',
          analyse: 'Your short-term absence is above the sector average. This need not be a structural problem, but it is a signal worth attention so short absences do not evolve into more frequent or longer absence.',
          kenmerk: ['Increased workload or unbalanced task distribution', 'Challenges in team dynamics, leadership or work climate', 'Insufficient early detection and preventive follow-up'],
          aandacht: 'Short-term absence is often the first visible indicator of broader wellbeing issues. The earlier signals are detected, the greater the chance to prevent escalation and cost.',
          acties: ['Analyse the main absence drivers within the organisation', 'Strengthen managers’ conversation skills around attendance', 'Make absence discussable from support, not control'],
          doel: 'Reduce short-term absence step by step to the sector average within 6 to 12 months.',
          prio: 'Priority 1 · adjust'
        }
      },
      M: {
        better: {
          tone: 'good', status: 'Better than the benchmark',
          analyse: 'Your medium-term absence is below the sector average. This indicates a strong capacity to guide employees through absences of one to six months and to reintegrate them sustainably.',
          kenmerk: ['Structured absence and reintegration guidance', 'Timely follow-up during the absence', 'Close cooperation between managers, HR and stakeholders'],
          aandacht: 'Strong performance is often the result of consistent processes. Anchor successful methods structurally, independent of individuals.',
          acties: ['Document and standardise absence and reintegration processes', 'Share good practices from strong departments organisation-wide', 'Embed Culture of Care & Capability further in daily operations'],
          doel: 'Optimise medium-term absence further towards 1.5% – 1.7%.',
          prio: 'Priority 3 · safeguard'
        },
        equal: {
          tone: 'equal', status: 'In line with the benchmark',
          analyse: 'Your medium-term absence sits at the sector average. This category often holds the biggest opportunity: here it is decided whether employees return, or move on to long-term absence.',
          kenmerk: ['A structured, consistent case-management approach', 'Clear ownership of absence cases', 'Timely assessment of work capacity and return scenarios'],
          aandacht: 'Small improvements in guidance have a disproportionately large impact here on both duration and total cost. The gain lies in consistency, not extra interventions.',
          acties: ['Assign one clear case manager per case', 'Assess work capacity from the first weeks', 'Steer with data on trends, lead times and risk profiles'],
          doel: 'Reduce medium-term absence from sector level to around 1.5%.',
          prio: 'Priority 1 · highest ROI'
        },
        above: {
          tone: 'warn', status: 'Above the benchmark',
          analyse: 'Your medium-term absence is above the sector average. This is the transition phase between short and long-term absence: without targeted intervention, part of these cases flows on to long-term absence.',
          kenmerk: ['Insufficiently structured case management', 'Unclear ownership of cases', 'Late assessment of work capacity', 'Limited use of task and workplace adjustments'],
          aandacht: 'This is the category with the greatest impact on future long-term absence. Every month longer absent lowers the chance of a sustainable return. Early, consistent direction is crucial.',
          acties: ['Analyse why employees stay absent longer than expected', 'Structure case management with fixed contact moments', 'Make task and workplace adjustments a standard part of every track', 'Detect cases with elevated escalation risk early'],
          doel: 'Reduce medium-term absence to the sector average.',
          prio: 'Priority 1 · critical'
        }
      },
      L: {
        better: {
          tone: 'good', status: 'Below the benchmark',
          analyse: 'Your long-term absence is below the sector average. This indicates strong control of long-duration absences and an effective approach to preventing dropout.',
          kenmerk: ['Strong follow-up of medium-term cases and reintegration', 'Enough flexibility in roles and work organisation', 'Timely support before problems escalate'],
          aandacht: 'Low long-term absence is built over years. Maintaining it requires continued attention to reintegration and workable work. The best chance of return lies in the first year.',
          acties: ['Keep investing in the medium-term absence approach', 'Provide individual reintegration tracks for existing cases', 'Explore job crafting, adapted tasks and phased return'],
          doel: 'Keep long-term absence below the sector average.',
          prio: 'Priority 3 · consolidate'
        },
        equal: {
          tone: 'equal', status: 'In line with the benchmark',
          analyse: 'Your long-term absence sits at the sector average. This category has the greatest impact on cost and staff availability and therefore deserves particular attention.',
          kenmerk: ['Active guidance of existing long-term cases', 'Focus on preventing new inflow', 'Realistic return strategies with adapted work'],
          aandacht: 'The first twelve months are crucial for reintegration. At the same time medium-term absence remains the key predictor of future dropout — a strong approach there is the best prevention.',
          acties: ['Provide active follow-up with a case manager per case', 'Facilitate part-time or phased return', 'Strengthen medium-phase follow-up to prevent inflow'],
          doel: 'Stay at or below the sector average and increase reactivation of existing cases.',
          prio: 'Priority 2 · active control'
        },
        above: {
          tone: 'warn', status: 'Above the benchmark',
          analyse: 'Your long-term absence is above the sector average. This usually has the greatest impact on cost, productivity and continuity. It rarely arises suddenly — mostly through insufficient interruption in earlier absence phases.',
          kenmerk: ['Insufficient control of medium-term absence, with flow-through to long', 'Complex cases with medical or psychosocial factors'],
          aandacht: 'The strongest predictor of long-term absence is elevated medium-term absence. The biggest lever therefore lies in preventing new inflow, alongside swift action on existing cases.',
          acties: ['Strengthen the medium-term absence approach — this is the main priority', 'Activate existing cases within the first year of absence', 'Explore job crafting and alternative roles', 'Deploy external expertise and specialised guidance in a targeted way'],
          doel: 'Reduce long-term absence to the sector average within 6 to 12 months.',
          prio: 'Priority 1 · urgent'
        }
      }
    },

    si_fte_h: 'FTE equivalent',
    si_bench_h: 'Benchmark context',
    si_cascade_h: 'Cascade risk',
    si_cascade_txt: 'Unaddressed medium-term absence typically flows on to long-term absence — the costliest category — within 6 to 12 months. Early direction breaks that cascade.',
    si_save_h: 'Savings scenarios',

    concl_h: 'Conclusion',
    concl_body: 'The question is not whether this cost is influenceable, but to what extent you actively manage it. Organisations that successfully reduce absence typically excel in three areas: insight into the real causes, structure in guidance and prevention, and steering based on real-time data and predictive insight.',
    concl_close: 'Absence is not an inevitable cost, but a strategic management challenge. Those who invest in a targeted approach today create a healthier organisation, lower costs and higher sustainable employability tomorrow.',
    plan_h: 'Action plan — next step',
    plan_sub: 'Get clear on what matters in 30 minutes. This report gives data; the real value lies in a focused conversation.',
    plan_steps: [
      'Where the biggest impact lies and which interventions are feasible',
      'Integration of Storm, Casey AI and the COCC programme',
      'Realistic savings and a concrete 30/60/90-day plan'
    ]
  };

  root.MONTISORO_REPORT_CONTENT = { nl: NL, en: EN };
  root.MONTISORO_REPORT_SCENARIOS = SCENARIOS;
  root.MONTISORO_REPORT_EQUALBAND = EQUAL_BAND;
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { content: root.MONTISORO_REPORT_CONTENT, SCENARIOS: SCENARIOS, EQUAL_BAND: EQUAL_BAND };
  }
})(typeof window !== 'undefined' ? window : this);
