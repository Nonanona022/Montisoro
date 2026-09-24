import fs from 'node:fs';
import path from 'node:path';

const pages = [
  {
    lang:'nl', file:'rit-3-0.html', slug:'rit-3-0', pair:'rit-3-0-en', pairLabel:'English',
    title:'RIT 3.0: re-integratie na ziekte | Montisoro',
    description:'Wat RIT 3.0 sinds 1 januari 2026 betekent voor Belgische werkgevers, werknemers en re-integratie. Praktische uitleg en heldere stappen.',
    kicker:'Belgische re-integratiewetgeving', h1:'RIT 3.0: van verplichting naar <em>werkbare re-integratie</em>',
    lead:'Sinds 1 januari 2026 gelden nieuwe regels voor re-integratie na arbeidsongeschiktheid. Montisoro vertaalt het formele kader naar een menselijk en uitvoerbaar proces.',
    introTitle:'Wat verandert er door RIT 3.0?',
    intro:[
      'RIT 3.0 is de gangbare naam voor de aangepaste Belgische regels rond de re-integratie van arbeidsongeschikte werknemers. De wijzigingen volgen uit het Koninklijk Besluit van 17 december 2025 en traden in werking op 1 januari 2026.',
      'Een werknemer kan een formeel traject op elk moment vragen. Een werkgever kan dat doen met toestemming van de werknemer of nadat de arbeidsarts het arbeidspotentieel heeft beoordeeld. Voor werkgevers met minstens twintig werknemers geldt bovendien een startplicht binnen zes maanden wanneer arbeidspotentieel is vastgesteld bij een afwezigheid die vanaf 1 januari 2026 begon.',
      'De arbeidsarts blijft verantwoordelijk voor de medische beoordeling. HR, leidinggevenden en een non-clinical casemanager organiseren de niet-medische opvolging: contact, werkmogelijkheden, afspraken en een haalbaar plan.'
    ],
    cards:[
      ['01','Start en triage','Maak snel duidelijk wie initiatief neemt, welke route passend is en welke informatie medisch vertrouwelijk blijft.'],
      ['02','Werkmogelijkheden','Onderzoek aangepast of ander werk op basis van mogelijkheden, functie-eisen en de concrete werkcontext.'],
      ['03','Opvolging','Leg acties, eigenaars en termijnen vast. Zo wordt een formeel plan ook werkelijk uitgevoerd en geëvalueerd.']
    ],
    secondTitle:'Een praktisch proces naast het formele traject',
    second:[
      'Het wettelijke traject alleen voorkomt geen stilstand. Een werkbaar proces verbindt de formele stappen met de dagelijkse realiteit op de werkvloer. Dat begint met voorspelbaar contact en eindigt pas wanneer de terugkeer duurzaam is.',
      'Montisoro ondersteunt organisaties bij de regie rond verzuim en re-integratie. De medische inhoud blijft bij de bevoegde medische actoren; de casemanager bewaakt de samenwerking, voortgang en uitvoerbaarheid.'
    ],
    bullets:['Eén dossierbeeld met rollen, acties en termijnen','Duidelijke afstemming tussen werknemer, werkgever en arbeidsarts','Aandacht voor aangepast werk en redelijke, concrete mogelijkheden','Opvolging na de werkhervatting om terugval te voorkomen'],
    calloutTitle:'Geen juridisch of medisch advies',
    callout:'Deze pagina geeft algemene procesinformatie. De officiële regelgeving, de arbeidsarts en uw juridisch adviseur blijven bepalend voor een individueel dossier.',
    source:'Officiële bron en actuele uitleg: <a href="https://werk.belgie.be/nl/themas/welzijn-op-het-werk/re-integratie-van-arbeidsongeschikte-werknemers-en-preventie-van-6" rel="noopener">FOD Werkgelegenheid — formeel re-integratietraject</a>. Inhoud gecontroleerd op 24 september 2026.',
    faqs:[
      ['Wanneer kan een werknemer RIT 3.0 starten?','Een werknemer kan het formele re-integratietraject op elk moment aanvragen. De arbeidsarts beoordeelt vervolgens de werkmogelijkheden binnen het officiële proces.'],
      ['Mag de werkgever het traject zelf starten?','Ja, maar alleen binnen de voorwaarden van het officiële kader: met toestemming van de werknemer of nadat arbeidspotentieel werd vastgesteld. Voor bepaalde werkgevers geldt sinds 2026 ook een startplicht binnen een vastgelegde termijn.'],
      ['Ziet een casemanager medische diagnoses?','Niet automatisch. Medische informatie hoort bij de bevoegde medische actoren. De niet-klinische begeleiding werkt met functionele mogelijkheden, afspraken en de werkcontext.']
    ],
    related:[['/langdurig-verzuim','Langdurig verzuim'],['/non-clinical-casemanager','Non-clinical casemanager'],['/verzuimbeleid','Verzuimbeleid']]
  },
  {
    lang:'en', file:'rit-3-0-en.html', slug:'rit-3-0-en', pair:'rit-3-0', pairLabel:'Nederlands',
    title:'RTW 3.0 in Belgium: practical guide | Montisoro',
    description:'A practical explanation of Belgium’s RTW 3.0 rules since 1 January 2026 for employers, employees and sustainable return to work.',
    kicker:'Belgian return-to-work rules', h1:'RTW 3.0: turn compliance into a <em>workable return</em>',
    lead:'New Belgian return-to-work rules have applied since 1 January 2026. Montisoro translates the formal framework into a human, practical process.',
    introTitle:'What changed under RTW 3.0?',
    intro:[
      'RTW 3.0 is the common name for Belgium’s updated rules on reintegrating employees who are unable to work. The changes follow the Royal Decree of 17 December 2025 and entered into force on 1 January 2026.',
      'An employee may request a formal trajectory at any time. An employer can initiate it with the employee’s consent or after the occupational physician has assessed work potential. Employers with at least twenty workers also face a six-month initiation duty when work potential is established for an absence that began on or after 1 January 2026.',
      'The occupational physician remains responsible for the medical assessment. HR, managers and a non-clinical case manager organize non-medical follow-up: communication, work options, agreements and an achievable plan.'
    ],
    cards:[['01','Start and triage','Clarify who initiates the route, which process applies and which information remains medically confidential.'],['02','Work options','Explore adapted or alternative work using functional capabilities, role demands and the real workplace context.'],['03','Follow-up','Record actions, owners and dates so a formal plan is implemented, monitored and adjusted.']],
    secondTitle:'A practical process alongside the formal route',
    second:['The legal trajectory alone does not prevent delay. A workable process connects each formal step to day-to-day reality, from predictable contact through to a sustainable return.','Montisoro supports organizations in coordinating absence and return to work. Medical content remains with authorized medical professionals; the case manager safeguards collaboration, progress and feasibility.'],
    bullets:['One shared overview of roles, actions and deadlines','Clear coordination between employee, employer and occupational physician','Concrete attention to adapted work and realistic options','Follow-up after return to reduce the risk of relapse'],
    calloutTitle:'Not legal or medical advice', callout:'This page provides general process information. Official rules, the occupational physician and your legal adviser remain decisive for an individual case.',
    source:'Official source: <a href="https://werk.belgie.be/nl/themas/welzijn-op-het-werk/re-integratie-van-arbeidsongeschikte-werknemers-en-preventie-van-6" rel="noopener">Belgian Federal Public Service Employment — formal reintegration trajectory</a>. Content checked on 24 September 2026.',
    faqs:[['When can an employee start RTW 3.0?','An employee may request the formal trajectory at any time. The occupational physician then assesses work options within the official process.'],['Can an employer initiate the trajectory?','Yes, within the official conditions: with the employee’s consent or after work potential has been established. Since 2026, certain employers also have a duty to initiate within a defined period.'],['Does a case manager see medical diagnoses?','Not by default. Medical information belongs with authorized medical professionals. Non-clinical coordination works with functional capabilities, agreements and workplace context.']],
    related:[['/long-term-absence-en','Long-term absence'],['/non-clinical-case-manager-en','Non-clinical case manager'],['/absence-policy-en','Absence policy']]
  },
  {
    lang:'nl', file:'langdurig-verzuim.html', slug:'langdurig-verzuim', pair:'long-term-absence-en', pairLabel:'English',
    title:'Langdurig verzuim begeleiden | Montisoro',
    description:'Een praktische aanpak voor langdurig verzuim: vroeg contact, heldere regie, werkmogelijkheden en duurzame re-integratie in Belgische organisaties.',
    kicker:'Van uitval naar duurzame terugkeer', h1:'Langdurig verzuim vraagt <em>vroegere regie</em>',
    lead:'Wachten tot iemand volledig hersteld is, maakt de afstand tot werk vaak groter. Een menselijk, gestructureerd proces houdt contact en mogelijkheden zichtbaar.',
    introTitle:'Wat is langdurig verzuim?',
    intro:['Langdurig verzuim is afwezigheid die meerdere weken of maanden duurt en waarbij terugkeer complexer wordt door gezondheid, werkcontext, samenwerking of onzekerheid. Het is geen diagnose en vraagt zelden één standaardoplossing.','De beste aanpak begint niet met druk om terug te keren, maar met veilig en voorspelbaar contact. Vervolgens worden functionele mogelijkheden, werkeisen en organisatorische opties naast elkaar gelegd. Zo ontstaat een route die medisch verantwoord én operationeel haalbaar is.'],
    cards:[['01','Contact houden','Spreek af wie contact opneemt, met welk doel en in welk ritme. Contact is ondersteuning, geen controle.'],['02','Mogelijkheden onderzoeken','Vertaal wat iemand wél kan naar taken, werkuren, omgeving en tijdelijke aanpassingen.'],['03','Duurzaam hervatten','Bouw werk stapsgewijs op, evalueer vroeg en stuur bij voordat spanning opnieuw tot uitval leidt.']],
    secondTitle:'Van losse acties naar één dossierlijn',
    second:['Langdurige afwezigheid raakt werknemer, leidinggevende, HR, arbeidsarts en soms verzekeraar of mutualiteit. Zonder duidelijke regie ontstaat vertraging: iedereen doet iets, maar niemand ziet het geheel.','Een non-clinical casemanager bewaakt de proceslijn zonder de medische rol over te nemen. Afspraken, verantwoordelijkheden en obstakels worden zichtbaar, terwijl gevoelige medische informatie beschermd blijft.'],
    bullets:['Een vaste contactpersoon en afgesproken communicatieritme','Acties en termijnen die voor alle betrokken rollen duidelijk zijn','Een concreet plan voor aangepast of ander werk','Evaluatiemomenten vóór, tijdens en na de werkhervatting'],
    calloutTitle:'Begin vóór het dossier vastloopt', callout:'Vroege, passende begeleiding vergroot de ruimte om oplossingen te vinden. Dat betekent niet dat herstel wordt versneld, maar dat onnodige stilstand wordt voorkomen.',
    source:'Lees ook het actuele Belgische kader op onze pagina over <a href="/rit-3-0">RIT 3.0</a>. De medische beoordeling blijft altijd bij de bevoegde medische professional.',
    faqs:[['Wanneer wordt verzuim langdurig?','Er bestaat geen enkele praktische grens die voor ieder dossier hetzelfde betekent. Belangrijker is wanneer terugkeer onzeker of complex wordt en meerdere rollen gecoördineerd moeten worden.'],['Hoe vaak mag een werkgever contact opnemen?','Er is geen universeel ideaal ritme. Maak samen een voorspelbare afspraak die ondersteuning biedt en rekening houdt met herstel, privacy en de arbeidsrelatie.'],['Wat is duurzame werkhervatting?','Een terugkeer die past bij de actuele belastbaarheid en werkcontext, met opvolging en ruimte om het plan tijdig bij te sturen.']],
    related:[['/rit-3-0','RIT 3.0'],['/non-clinical-casemanager','Non-clinical casemanager'],['/calculator','Bereken verzuimkosten']]
  },
  {
    lang:'en', file:'long-term-absence-en.html', slug:'long-term-absence-en', pair:'langdurig-verzuim', pairLabel:'Nederlands',
    title:'Managing long-term absence | Montisoro',
    description:'A practical approach to long-term absence: early contact, clear coordination, work options and sustainable return to work in Belgian organizations.',
    kicker:'From absence to sustainable return', h1:'Long-term absence needs <em>earlier coordination</em>',
    lead:'Waiting until someone is fully recovered can increase the distance from work. A human, structured process keeps contact and options visible.',
    introTitle:'What is long-term absence?',
    intro:['Long-term absence lasts for weeks or months and becomes more complex because of health, work context, collaboration or uncertainty. It is not a diagnosis and rarely has one standard solution.','A sound approach starts with safe, predictable contact rather than pressure to return. Functional capabilities, job demands and organizational options are then considered together. The resulting route should be medically responsible and operationally feasible.'],
    cards:[['01','Maintain contact','Agree who makes contact, why and how often. Contact should provide support, not control.'],['02','Explore options','Translate current capabilities into tasks, hours, environment and temporary adaptations.'],['03','Return sustainably','Build work gradually, review early and adjust before strain leads to renewed absence.']],
    secondTitle:'From separate actions to one case line',
    second:['Long-term absence affects the employee, manager, HR, occupational physician and sometimes an insurer or mutual health fund. Without clear coordination, activity increases while progress stalls.','A non-clinical case manager safeguards the process without taking over medical responsibilities. Agreements, ownership and obstacles become visible while sensitive medical information remains protected.'],
    bullets:['A fixed contact person and agreed communication rhythm','Actions and deadlines understood by every involved role','A concrete plan for adapted or alternative work','Review points before, during and after return'],
    calloutTitle:'Act before the case gets stuck', callout:'Early, appropriate guidance creates more room for solutions. It does not rush recovery; it prevents avoidable delay.',
    source:'See the current Belgian framework on our <a href="/rit-3-0-en">RTW 3.0 page</a>. Medical assessment always remains with an authorized medical professional.',
    faqs:[['When does absence become long term?','No single practical threshold has the same meaning in every case. What matters is when return becomes uncertain or complex and multiple roles require coordination.'],['How often should an employer make contact?','There is no universal ideal rhythm. Agree a predictable approach that offers support and respects recovery, privacy and the employment relationship.'],['What is a sustainable return?','A return that matches current functional capacity and workplace context, with follow-up and room to adjust the plan in time.']],
    related:[['/rit-3-0-en','RTW 3.0'],['/non-clinical-case-manager-en','Non-clinical case manager'],['/calculator-en','Calculate absence costs']]
  },
  {
    lang:'nl', file:'non-clinical-casemanager.html', slug:'non-clinical-casemanager', pair:'non-clinical-case-manager-en', pairLabel:'English',
    title:'Non-clinical casemanager verzuim | Montisoro',
    description:'Wat een non-clinical casemanager doet bij verzuim en re-integratie: procesregie, contact, werkmogelijkheden en samenwerking zonder medische rol.',
    kicker:'Procesregie zonder medische rol', h1:'De non-clinical casemanager houdt <em>beweging in het dossier</em>',
    lead:'Eén aanspreekpunt bewaakt afspraken, samenwerking en voortgang. De medische beoordeling blijft waar ze hoort: bij de bevoegde medische professional.',
    introTitle:'Wat doet een non-clinical casemanager?',
    intro:['Een non-clinical casemanager coördineert het niet-medische deel van verzuim en re-integratie. Die persoon zorgt dat werknemer, leidinggevende, HR en arbeidsarts weten wat de volgende stap is en wie daarvoor verantwoordelijk is.','De rol verzamelt geen diagnoses en vervangt geen arbeidsarts. Ze werkt met functionele mogelijkheden, werkcontext, procesafspraken en concrete belemmeringen. Daardoor kan een organisatie menselijk handelen zonder privacy en rolgrenzen uit het oog te verliezen.'],
    cards:[['01','Regie','Bewaakt de dossierlijn, termijnen, beslismomenten en overdrachten tussen betrokken rollen.'],['02','Dialoog','Ondersteunt heldere gesprekken over contact, mogelijkheden en verwachtingen zonder medische interpretatie.'],['03','Uitvoering','Zet afspraken om in acties rond aangepast werk, opbouw, evaluatie en duurzame opvolging.']],
    secondTitle:'Wanneer levert de rol waarde?',
    second:['De rol is vooral waardevol wanneer een dossier meerdere betrokkenen, parallelle routes of terugkerende obstakels heeft. Ook bij preventieve opvolging kan één procesregisseur voorkomen dat kleine signalen pas laat zichtbaar worden.','Goede casemanagerbegeleiding is transparant. De werknemer weet welke informatie wordt vastgelegd, de werkgever weet wat hij moet organiseren en de arbeidsarts behoudt de medische autonomie.'],
    bullets:['Eén herkenbaar aanspreekpunt voor de procesvragen','Minder vertraging door onduidelijk eigenaarschap','Heldere scheiding tussen medische en organisatorische informatie','Consistente opvolging over teams, locaties en dossiers heen'],
    calloutTitle:'Menselijke regie, ondersteund door technologie', callout:'Technologie kan afspraken, signalen en voortgang zichtbaar maken. De casemanager blijft verantwoordelijk voor context, dialoog en proportionele keuzes.',
    source:'Meer over de wettelijke context leest u bij <a href="/rit-3-0">RIT 3.0</a>; de bredere werkwijze staat op <a href="/aanpak">onze aanpak</a>.',
    faqs:[['Is een non-clinical casemanager een arts?','Nee. De rol coördineert het proces en doet geen medische beoordeling of diagnose.'],['Welke informatie heeft de casemanager nodig?','Vooral procesinformatie en functionele mogelijkheden die relevant zijn voor werk. Medische details worden alleen verwerkt wanneer daarvoor een duidelijke rechtsgrond en bevoegdheid bestaat.'],['Kan de eigen HR-afdeling deze rol opnemen?','Dat kan, mits de rol, competenties, privacygrenzen en beschikbare tijd duidelijk zijn. Externe ondersteuning kan helpen bij capaciteit, neutraliteit of complexe dossiers.']],
    related:[['/langdurig-verzuim','Langdurig verzuim'],['/rit-3-0','RIT 3.0'],['/technologie','Technologie']]
  },
  {
    lang:'en', file:'non-clinical-case-manager-en.html', slug:'non-clinical-case-manager-en', pair:'non-clinical-casemanager', pairLabel:'Nederlands',
    title:'Non-clinical absence case manager | Montisoro',
    description:'What a non-clinical case manager does in absence and return to work: process coordination, communication and work options without a medical role.',
    kicker:'Process coordination without a medical role', h1:'A non-clinical case manager keeps the <em>case moving</em>',
    lead:'One point of contact safeguards agreements, collaboration and progress. Medical assessment remains with the authorized medical professional.',
    introTitle:'What does a non-clinical case manager do?',
    intro:['A non-clinical case manager coordinates the non-medical side of absence and return to work. They ensure the employee, manager, HR and occupational physician understand the next step and who owns it.','The role does not collect diagnoses or replace an occupational physician. It works with functional capabilities, workplace context, process agreements and practical barriers, enabling a human approach while respecting privacy and role boundaries.'],
    cards:[['01','Coordination','Safeguards the case line, deadlines, decision points and handovers between involved roles.'],['02','Dialogue','Supports clear conversations about contact, capabilities and expectations without medical interpretation.'],['03','Execution','Turns agreements into actions on adapted work, gradual return, review and sustainable follow-up.']],
    secondTitle:'When does the role add value?',
    second:['The role is particularly valuable when a case includes several stakeholders, parallel routes or recurring barriers. In preventive follow-up, one coordinator can also stop small signals from becoming visible too late.','Good case management is transparent. The employee understands what is recorded, the employer knows what to organize and the occupational physician retains medical autonomy.'],
    bullets:['One recognizable contact for process questions','Less delay caused by unclear ownership','A clear boundary between medical and organizational information','Consistent follow-up across teams, sites and cases'],
    calloutTitle:'Human coordination, supported by technology', callout:'Technology can make agreements, signals and progress visible. The case manager remains responsible for context, dialogue and proportionate choices.',
    source:'Read more about the regulatory context on <a href="/rit-3-0-en">RTW 3.0</a> and our broader method on <a href="/approach-en">the approach page</a>.',
    faqs:[['Is a non-clinical case manager a doctor?','No. The role coordinates the process and does not provide medical assessment or diagnosis.'],['What information does the case manager need?','Mainly process information and functional capabilities relevant to work. Medical details are only processed when there is a clear legal basis and authorization.'],['Can an internal HR team perform this role?','Yes, if responsibilities, skills, privacy boundaries and available time are clear. External support may help with capacity, neutrality or complex cases.']],
    related:[['/long-term-absence-en','Long-term absence'],['/rit-3-0-en','RTW 3.0'],['/technology-en','Technology']]
  },
  {
    lang:'nl', file:'verzuimbeleid.html', slug:'verzuimbeleid', pair:'absence-policy-en', pairLabel:'English',
    title:'Verzuimbeleid opstellen en verbeteren | Montisoro',
    description:'Bouw een werkbaar verzuimbeleid met duidelijke rollen, vroege signalering, privacy, re-integratie en meetbare opvolging voor Belgische werkgevers.',
    kicker:'Van document naar dagelijkse praktijk', h1:'Een verzuimbeleid dat <em>werkbaar blijft</em>',
    lead:'Goed beleid beschrijft niet alleen regels. Het maakt duidelijk wat mensen doen, wanneer ze handelen en hoe de organisatie leert van terugkerende patronen.',
    introTitle:'Wat hoort in een goed verzuimbeleid?',
    intro:['Een verzuimbeleid verbindt preventie, ziekmelding, contact, re-integratie en duurzame werkhervatting. Het beschrijft verantwoordelijkheden zonder de menselijke maat te verliezen en sluit aan op het Belgische wettelijke kader.','De kwaliteit blijkt niet uit de lengte van het document, maar uit de voorspelbaarheid van de uitvoering. Medewerkers moeten weten wat zij mogen verwachten; leidinggevenden moeten weten wat zij wel en niet vragen; HR moet zien wanneer een dossier ondersteuning nodig heeft.'],
    cards:[['01','Rollen en grenzen','Leg vast wie contact houdt, wie beslist en welke informatie medisch vertrouwelijk blijft.'],['02','Proces en termijnen','Maak de route van melding tot duurzame terugkeer concreet, inclusief escalatie en evaluatie.'],['03','Leren en verbeteren','Volg patronen en proceskwaliteit zonder individuele gezondheidsgegevens onnodig te verspreiden.']],
    secondTitle:'Zeven bouwstenen voor uitvoering',
    second:['Beleid werkt wanneer het zichtbaar is in gesprekken, systemen en beslissingen. Daarom moeten opleiding, dossierregistratie en managementinformatie aansluiten op dezelfde principes.','Gebruik cijfers als richtingaanwijzer, niet als doel op zich. Een dalend verzuimpercentage kan positief zijn, maar zegt zonder context weinig over duurzame terugkeer, werkbaarheid en preventie.'],
    bullets:['Preventie en vroegsignalering','Een heldere ziekmeldings- en contactprocedure','Privacy en scheiding van medische informatie','Rollen voor werknemer, leidinggevende, HR en arbeidsarts','Proces voor aangepast werk en re-integratie','Dossierkwaliteit, evaluatie en escalatie','Proportionele stuurinformatie en periodieke bijsturing'],
    calloutTitle:'Beleid is pas af wanneer het wordt toegepast', callout:'Test het beleid met echte scenario’s: weet een leidinggevende wat morgen te doen, begrijpt een werknemer het contactproces en is duidelijk wanneer de arbeidsarts wordt betrokken?',
    source:'Verdiep via <a href="/rit-3-0">RIT 3.0</a>, <a href="/langdurig-verzuim">langdurig verzuim</a> en onze <a href="/calculator-methodologie">meetmethodologie</a>.',
    faqs:[['Hoe vaak moet een verzuimbeleid worden herzien?','Minstens wanneer regelgeving, organisatie, systemen of verantwoordelijkheden veranderen. Een jaarlijkse praktijkreview helpt om knelpunten tijdig te zien.'],['Moet een leidinggevende medische vragen stellen?','Nee. De leidinggevende focust op contact, werk en functionele mogelijkheden. Medische beoordeling en diagnoses horen bij bevoegde medische professionals.'],['Welke cijfers zijn nuttig?','Combineer verzuimfrequentie en duur met procesindicatoren, zoals tijdig contact, doorlooptijd, duurzame hervatting en terugval. Definieer elke maatstaf vooraf.']],
    related:[['/rit-3-0','RIT 3.0'],['/calculator-methodologie','Hoe we meten'],['/fit-check','Doe de fit check']]
  },
  {
    lang:'en', file:'absence-policy-en.html', slug:'absence-policy-en', pair:'verzuimbeleid', pairLabel:'Nederlands',
    title:'Build a practical absence policy | Montisoro',
    description:'Build a workable absence policy with clear roles, early signals, privacy, return to work and measurable follow-up for Belgian employers.',
    kicker:'From policy document to daily practice', h1:'An absence policy that <em>works in practice</em>',
    lead:'Good policy does more than state rules. It tells people what to do, when to act and how the organization learns from recurring patterns.',
    introTitle:'What belongs in a sound absence policy?',
    intro:['An absence policy connects prevention, reporting, contact, reintegration and sustainable return. It defines responsibilities without losing the human dimension and aligns with the Belgian regulatory framework.','Quality is not measured by document length but by predictable execution. Employees should know what to expect, managers should know what they may ask, and HR should see when a case needs support.'],
    cards:[['01','Roles and boundaries','Define who maintains contact, who decides and which information remains medically confidential.'],['02','Process and timing','Make the route from reporting to sustainable return concrete, including escalation and review.'],['03','Learn and improve','Track patterns and process quality without unnecessarily distributing personal health information.']],
    secondTitle:'Seven building blocks for execution',
    second:['Policy works when it is visible in conversations, systems and decisions. Training, case records and management information should therefore follow the same principles.','Use figures as direction, not as a target in isolation. A lower absence rate can be positive, but without context says little about sustainable return, workability and prevention.'],
    bullets:['Prevention and early signals','A clear reporting and contact procedure','Privacy and separation of medical information','Roles for employee, manager, HR and occupational physician','A route for adapted work and return to work','Case quality, review and escalation','Proportionate management information and periodic improvement'],
    calloutTitle:'Policy is only complete when people can use it', callout:'Test it with real scenarios: does a manager know what to do tomorrow, does an employee understand the contact process and is it clear when the occupational physician becomes involved?',
    source:'Continue with <a href="/rit-3-0-en">RTW 3.0</a>, <a href="/long-term-absence-en">long-term absence</a> and our <a href="/calculator-methodology-en">measurement methodology</a>.',
    faqs:[['How often should an absence policy be reviewed?','At least whenever legislation, the organization, systems or responsibilities change. An annual practical review helps identify friction early.'],['Should a manager ask medical questions?','No. Managers focus on contact, work and functional options. Medical assessment and diagnosis belong with authorized medical professionals.'],['Which measures are useful?','Combine frequency and duration with process indicators such as timely contact, lead time, sustainable return and relapse. Define every measure before using it.']],
    related:[['/rit-3-0-en','RTW 3.0'],['/calculator-methodology-en','How we measure'],['/fit-check-en','Take the fit check']]
  },
  {
    lang:'nl', file:'calculator-methodologie.html', slug:'calculator-methodologie', pair:'calculator-methodology-en', pairLabel:'English',
    title:'Methodologie verzuimcalculator | Montisoro',
    description:'Bekijk hoe de Montisoro verzuimcalculator directe en indirecte verzuimkosten berekent, welke aannames gelden en hoe u de uitkomst verantwoord gebruikt.',
    kicker:'Transparante berekening', h1:'Zo berekent Montisoro uw <em>verzuimkosten</em>',
    lead:'Een calculator is alleen bruikbaar als de formule, invoer en beperkingen zichtbaar zijn. Daarom leggen we uit wat de uitkomst wel en niet betekent.',
    introTitle:'De kern van de berekening',
    intro:['De calculator combineert uw eigen personeels- en loongegevens met uw verzuimpercentages. Voor de loonkost gebruiken we verloren werkdagen × (jaarloon ÷ werkdagen) × 1,30 voor sociale lasten. Voordelen en verzekeringen worden pro rata toegewezen en apart getoond.','Indirecte kosten, zoals productiviteitsverlies, managementtijd, kennisverlies, kwaliteitsverlies en vertraging, worden als afzonderlijke aannames verwerkt. De calculator toont dus een scenario op basis van de gekozen invoer, geen boekhoudkundige of actuariële waarheid.'],
    cards:[['01','Uw invoer','Aantal medewerkers, loonkost, werkregime en verzuimpercentages vormen de primaire basis.'],['02','Expliciete aannames','Opslagen en indirecte kosten blijven zichtbaar, zodat u weet welke keuzes de uitkomst beïnvloeden.'],['03','Scenario, geen belofte','De uitkomst ondersteunt gesprek en prioritering; ze voorspelt geen gegarandeerde besparing.']],
    secondTitle:'Zo gebruikt u de uitkomst verantwoord',
    second:['Gebruik waar mogelijk de actuele gegevens van uw eigen organisatie en noteer de rapportageperiode. Vergelijk alleen cijfers die dezelfde definitie, populatie en tijdsperiode gebruiken.','Een goede nulmeting combineert kosten met context: frequentie, duur, functieprofiel, proceskwaliteit en duurzame terugkeer. Bekijk veranderingen over tijd en vermijd conclusies op basis van één momentopname.'],
    bullets:['Controleer aantal medewerkers, loonkost en werkdagen','Gebruik dezelfde definitie voor kort, middellang en langdurig verzuim','Leg vast welke indirecte kostfactoren u activeert','Bewaar de datum, bron en versie van de invoer','Laat financiële of juridische beslissingen onafhankelijk valideren'],
    calloutTitle:'Wat de calculator niet doet', callout:'De calculator stelt geen diagnose, beoordeelt geen individueel dossier en vervangt geen financiële, medische of juridische expertise. Het resultaat is een transparant beslissingsscenario.',
    source:'De sectorniveaus in de tool verwijzen naar de SD Worx Verzuimbarometer 2025. Controleer voor formele rapportering steeds de oorspronkelijke bron, uw eigen payrollgegevens en de gekozen definities.',
    faqs:[['Waarom gebruikt de formule een factor 1,30?','De factor is een algemene opslag voor sociale lasten in het scenario. Uw werkelijke werkgeverskost kan afwijken; daarom moet de uitkomst als indicatie worden gelezen.'],['Zijn indirecte kosten objectief?','Niet volledig. Ze hangen af van context en aannames. Daarom worden ze afzonderlijk benoemd en moet u ze aanpassen of buiten beschouwing laten wanneer ze niet onderbouwd zijn.'],['Kan ik het resultaat als businesscase gebruiken?','Als eerste scenario wel. Voor een investeringsbeslissing gebruikt u best gecontroleerde eigen data, expliciete definities en een sensitiviteitsanalyse met meerdere aannames.']],
    related:[['/calculator','Open de calculator'],['/verzuimbeleid','Verzuimbeleid'],['/contact','Bespreek uw cijfers']]
  },
  {
    lang:'en', file:'calculator-methodology-en.html', slug:'calculator-methodology-en', pair:'calculator-methodologie', pairLabel:'Nederlands',
    title:'Absence calculator methodology | Montisoro',
    description:'See how the Montisoro calculator estimates direct and indirect absence costs, which assumptions apply and how to use the result responsibly.',
    kicker:'Transparent calculation', h1:'How Montisoro calculates your <em>absence costs</em>',
    lead:'A calculator is only useful when its formula, inputs and limitations are visible. This page explains what the result does and does not mean.',
    introTitle:'The core calculation',
    intro:['The calculator combines your workforce and salary data with your absence percentages. Wage cost is calculated as lost working days × (annual salary ÷ working days) × 1.30 for social charges. Benefits and insurance are allocated pro rata and shown separately.','Indirect costs such as productivity loss, management time, knowledge loss, quality loss and delay are handled as separate assumptions. The result is therefore a scenario based on selected inputs, not an accounting or actuarial truth.'],
    cards:[['01','Your inputs','Employee count, salary cost, work regime and absence percentages form the primary basis.'],['02','Explicit assumptions','Mark-ups and indirect costs remain visible, so you know which choices influence the result.'],['03','Scenario, not promise','The outcome supports discussion and prioritization; it does not predict guaranteed savings.']],
    secondTitle:'Use the outcome responsibly',
    second:['Use current data from your own organization where possible and record the reporting period. Only compare figures that use the same definition, population and time frame.','A useful baseline combines cost with context: frequency, duration, role profile, process quality and sustainable return. Review changes over time rather than drawing conclusions from one snapshot.'],
    bullets:['Check employee count, salary cost and working days','Use consistent definitions for short, medium and long-term absence','Record which indirect cost factors are enabled','Store the date, source and version of the input','Validate financial or legal decisions independently'],
    calloutTitle:'What the calculator does not do', callout:'The calculator does not diagnose, assess an individual case or replace financial, medical or legal expertise. It provides a transparent decision scenario.',
    source:'Sector levels in the tool refer to the SD Worx Absence Barometer 2025. For formal reporting, always verify the original source, your payroll data and the definitions used.',
    faqs:[['Why does the formula use a factor of 1.30?','It is a general scenario mark-up for social charges. Your actual employer cost may differ, so the result must be read as an indication.'],['Are indirect costs objective?','Not entirely. They depend on context and assumptions. They are therefore named separately and should be adjusted or excluded when unsupported.'],['Can I use the result as a business case?','As a first scenario, yes. For an investment decision, use validated internal data, explicit definitions and a sensitivity analysis with several assumptions.']],
    related:[['/calculator-en','Open the calculator'],['/absence-policy-en','Absence policy'],['/contact-en','Discuss your figures']]
  }
];

const esc = value => String(value).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');

function nav(p){
  const en = p.lang === 'en';
  return `<nav class="m-nav" id="mNav">
  <a href="${en?'/home-en':'/'}" class="m-nav-logo" aria-label="Montisoro home"><img decoding="async" src="../assets/montisoro-logo.png" alt="Montisoro" width="617" height="456"></a>
  <ul class="m-nav-links">
    <li><a href="${en?'/approach-en':'/aanpak'}">${en?'Approach':'Aanpak'}</a></li><li><a href="${en?'/technology-en':'/technologie'}">${en?'Technology':'Technologie'}</a></li><li><a href="${en?'/calculator-en':'/calculator'}">Calculator</a></li><li><a href="${en?'/about-en':'/about'}">About</a></li><li><a href="${en?'/references-en':'/referentie'}">${en?'References':'Referenties'}</a></li><li><a href="${en?'/faq-en':'/faq'}">FAQ</a></li><li><a class="m-cta" href="${en?'/contact-en#channels':'/contact#channels'}">${en?'Book a call':'Plan een gesprek'} →</a></li>
  </ul><button class="m-hamburger" aria-label="Menu"><i class="ph ph-list"></i></button>
</nav>`;
}

function footer(p){
  const en = p.lang === 'en';
  return `<footer class="ms-footer"><div class="ms-fveil"></div><div class="ms-foot-in"><div class="ms-foot-grid">
    <div class="ms-foot-brand"><img loading="lazy" decoding="async" src="../assets/montisoro-logo.png" alt="Montisoro" width="617" height="456"><p><em>Re</em>integrate <em>What</em> Matters.</p></div>
    <div class="ms-foot-col"><h3>${en?'Navigation':'Navigatie'}</h3><ul><li><a href="${en?'/home-en':'/'}">Home</a></li><li><a href="${en?'/approach-en':'/aanpak'}">${en?'Approach':'Aanpak'}</a></li><li><a href="${en?'/technology-en':'/technologie'}">${en?'Technology':'Technologie'}</a></li><li><a href="${en?'/contact-en':'/contact'}">Contact</a></li></ul></div>
    <div class="ms-foot-col"><h3>${en?'Knowledge':'Kennis'}</h3><ul><li><a href="${en?'/rit-3-0-en':'/rit-3-0'}">${en?'RTW 3.0':'RIT 3.0'}</a></li><li><a href="${en?'/long-term-absence-en':'/langdurig-verzuim'}">${en?'Long-term absence':'Langdurig verzuim'}</a></li><li><a href="${en?'/absence-policy-en':'/verzuimbeleid'}">${en?'Absence policy':'Verzuimbeleid'}</a></li><li><a href="${en?'/calculator-methodology-en':'/calculator-methodologie'}">${en?'Methodology':'Methodologie'}</a></li></ul></div>
    <div class="ms-foot-col ms-foot-contact"><h3>Contact</h3><div class="ms-wordmark">Montisoro</div><a href="mailto:hello@montisoro.com">hello@montisoro.com</a><a href="tel:+32477899186">+32 477 89 91 86</a><span class="ms-vat">VAT BE0733.840.137</span></div>
  </div><div class="ms-foot-bottom"><span class="ms-copy">© 2026 Montisoro</span><div class="ms-foot-legal"><a href="${en?'/privacy-en':'/privacy'}">Privacy</a><a href="${en?'/disclaimer-en':'/disclaimer'}">${en?'Terms':'Algemene voorwaarden'}</a></div></div></div></footer>`;
}

function render(p){
  const base = 'https://montisoro.com/';
  const canonical = base + p.slug;
  const nl = p.lang === 'nl' ? canonical : base + p.pair;
  const en = p.lang === 'en' ? canonical : base + p.pair;
  const isEn = p.lang === 'en';
  const structured = {
    '@context':'https://schema.org','@graph':[
      {'@type':'Article','@id':`${canonical}#article`,headline:p.title.replace(' | Montisoro',''),description:p.description,inLanguage:p.lang,datePublished:'2026-09-24',dateModified:'2026-09-24',author:{'@type':'Organization',name:'Montisoro'},publisher:{'@type':'Organization',name:'Montisoro',url:base},mainEntityOfPage:canonical},
      {'@type':'BreadcrumbList',itemListElement:[{'@type':'ListItem',position:1,name:'Home',item:isEn?base+'home-en':base},{'@type':'ListItem',position:2,name:p.title.replace(' | Montisoro',''),item:canonical}]},
      {'@type':'FAQPage',mainEntity:p.faqs.map(([q,a])=>({'@type':'Question',name:q,acceptedAnswer:{'@type':'Answer',text:a}}))}
    ]
  };
  return `<!DOCTYPE html>
<html lang="${p.lang}"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(p.title)}</title><meta name="description" content="${esc(p.description)}"><link rel="canonical" href="${canonical}">
<link rel="alternate" hreflang="nl" href="${nl}"><link rel="alternate" hreflang="en" href="${en}"><link rel="alternate" hreflang="x-default" href="${nl}">
<meta property="og:type" content="article"><meta property="og:title" content="${esc(p.title)}"><meta property="og:description" content="${esc(p.description)}"><meta property="og:url" content="${canonical}"><meta property="og:image" content="https://montisoro.com/assets/og-image.jpg">
<meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="${esc(p.title)}"><meta name="twitter:description" content="${esc(p.description)}"><meta name="twitter:image" content="https://montisoro.com/assets/og-image.jpg"><meta name="theme-color" content="#0D0905">
<link rel="icon" type="image/png" sizes="16x16" href="/montisoro-tab-v6-16.png"><link rel="icon" type="image/png" sizes="32x32" href="/montisoro-tab-v6-32.png"><link rel="icon" type="image/png" sizes="48x48" href="/montisoro-search-v6-48.png"><link rel="icon" type="image/png" sizes="128x128" href="/montisoro-icon-v6-128.png"><link rel="apple-touch-icon" sizes="128x128" href="/montisoro-icon-v6-128.png">
<link rel="preload" href="../assets/fonts/dmsans-400.woff2" as="font" type="font/woff2" crossorigin><link rel="preload" href="../assets/fonts/playfair-700.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="../stylesheets/fonts.css"><link rel="stylesheet" href="../assets/icons/phosphor-regular.css"><link rel="stylesheet" href="../stylesheets/site.css"><link rel="stylesheet" href="../stylesheets/montisoro-v2.css"><link rel="stylesheet" href="../stylesheets/seo-content.css"><link rel="stylesheet" href="../stylesheets/shell.css">
<script type="application/ld+json">${JSON.stringify(structured)}</script><script src="../scripts/ga4.js?v=20260901-1"></script><script src="../scripts/clarity.js"></script></head>
<body class="nav-boxed2 ms-dark-hero"><a id="ms-skip" class="ms-skip" href="#main">${isEn?'Skip to content':'Ga naar inhoud'}</a>${nav(p)}
<header class="seo-hero"><div class="seo-hero-in"><p class="seo-kicker">${p.kicker}</p><h1>${p.h1}</h1><p class="seo-lead">${p.lead}</p><div class="seo-hero-actions"><a class="seo-button primary" href="${isEn?'/contact-en#channels':'/contact#channels'}">${isEn?'Discuss your situation':'Bespreek uw situatie'} →</a><a class="seo-button" href="/${p.pair}">${p.pairLabel}</a></div></div></header>
<main id="main" class="seo-main" tabindex="-1"><section class="seo-section white"><div class="seo-wrap seo-intro"><p class="seo-label">${isEn?'Explanation':'Uitleg'}</p><div class="seo-copy"><h2>${p.introTitle}</h2>${p.intro.map(x=>`<p>${x}</p>`).join('')}</div></div></section>
<section class="seo-section"><div class="seo-wrap"><p class="seo-label">${isEn?'In practice':'In de praktijk'}</p><div class="seo-grid">${p.cards.map(([n,h,c])=>`<article class="seo-card"><span class="seo-card-num">${n}</span><h3>${h}</h3><p>${c}</p></article>`).join('')}</div></div></section>
<section class="seo-section white"><div class="seo-wrap seo-intro"><p class="seo-label">${isEn?'Method':'Werkwijze'}</p><div class="seo-copy"><h2>${p.secondTitle}</h2>${p.second.map(x=>`<p>${x}</p>`).join('')}<ul class="seo-list">${p.bullets.map(x=>`<li>${x}</li>`).join('')}</ul><div class="seo-source">${p.source}</div></div></div></section>
<section class="seo-section"><div class="seo-wrap"><div class="seo-callout"><h2>${p.calloutTitle}</h2><p>${p.callout}</p></div></div></section>
<section class="seo-section white"><div class="seo-wrap"><p class="seo-label">FAQ</p><h2>${isEn?'Frequently asked questions':'Veelgestelde vragen'}</h2><div class="seo-faq">${p.faqs.map(([q,a])=>`<details><summary>${q}</summary><p>${a}</p></details>`).join('')}</div></div></section>
<section class="seo-section"><div class="seo-wrap"><p class="seo-label">${isEn?'Continue reading':'Lees verder'}</p><h2>${isEn?'Related guidance and tools':'Gerelateerde uitleg en tools'}</h2><div class="seo-related">${p.related.map(([url,label])=>`<a href="${url}">${label}<span>→</span></a>`).join('')}</div><p class="seo-updated">${isEn?'Last content review: 24 September 2026':'Laatste inhoudelijke controle: 24 september 2026'}</p></div></section></main>
${footer(p)}<script src="../scripts/montisoro-v2.js"></script><script src="../scripts/shell.js" defer></script><script src="../scripts/site-content.js" defer></script><script src="../scripts/analytics.js?v=20260901-1" defer></script><script src="../scripts/events.js?v=20260901-1" defer></script></body></html>`;
}

const outDir = path.join('website','pages');
for (const page of pages) fs.writeFileSync(path.join(outDir,page.file),render(page));
console.log(`Generated ${pages.length} bilingual SEO content pages.`);
