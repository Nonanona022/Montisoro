/* ═══════════════════════════════════════════════════════════════════
   Calculator flow — DEMO mock (design-decision sandbox, NIET live)
   Toont de calculator-structuur (preview + stappen) in drie flow-varianten
   zodat we kunnen kiezen tussen "live naast stappen" en "stappen → eind-reveal".
   Reageert live zodat elke stap het cijfer zichtbaar beweegt.
═══════════════════════════════════════════════════════════════════ */

// Belgisch euro-formaat: duizendtal met punt, geen decimalen
function cdFmtEuro(n) {
  n = Math.round(n || 0);
  return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}
function cdFmtPct(n) {
  return (Math.round((n || 0) * 10) / 10).toString().replace('.', ',');
}

// Één representatief stappenschema (spiegelt de echte calculator)
const CD_STEPS = [
  { key: 'org',     n: '01', title: 'Organisatie',            lead: 'Hoe groot is uw organisatie?' },
  { key: 'salary',  n: '02', title: 'Gemiddeld brutoloon',    lead: 'Wat kost een medewerker gemiddeld per jaar.' },
  { key: 'ongoing', n: '03', title: 'Doorlopende kosten',     lead: 'Vaste doorlopende kosten naast het gewaarborgd loon.' },
  { key: 'replace', n: '04', title: 'Vervangingskosten',      lead: 'Interim, tijdelijke vervanging of overuren.' },
  { key: 'impact',  n: '05', title: 'Organisatorische impact', lead: 'Productiviteitsverlies, managementtijd, kennisverlies.' },
  { key: 'verz',    n: '06', title: 'Verzuimprofiel',          lead: 'Start op het Belgisch sectorgemiddelde — pas aan naar úw cijfers.' },
];

function CDField({ label, value, onChange, prefix, suffix, placeholder }) {
  return (
    <label className="cd-field">
      <span className="cd-field-lbl">{label}</span>
      <span className="cd-field-box">
        {prefix && <span className="cd-affix">{prefix}</span>}
        <input
          type="text" inputMode="numeric" value={value} placeholder={placeholder || '0'}
          onChange={(e) => onChange(e.target.value.replace(/[^\d]/g, ''))}
        />
        {suffix && <span className="cd-affix cd-affix-r">{suffix}</span>}
      </span>
    </label>
  );
}

function CDSlider({ label, value, onChange, min, max, step, suffix }) {
  return (
    <label className="cd-slider">
      <span className="cd-slider-top">
        <span className="cd-field-lbl">{label}</span>
        <span className="cd-slider-val">{cdFmtPct(value)}{suffix}</span>
      </span>
      <input type="range" min={min} max={max} step={step} value={value}
             onChange={(e) => onChange(parseFloat(e.target.value))} />
    </label>
  );
}

// ── Het donkere PREVIEW-paneel ──────────────────────────────────────
function CDPreview({ calc, compact, final }) {
  const { total, perFte, verz, empty, rows, base } = calc;
  return (
    <div className={'cd-preview' + (empty && !final ? ' is-empty' : '') + (compact ? ' cd-c' : '')}>
      <div className="cd-pv-head">
        <span className="cd-eyebrow">{final ? 'Uw resultaat' : 'Live berekening'}</span>
        <span className="cd-chip">per jaar</span>
      </div>

      <div className="cd-result">
        <span className="cur">€</span>
        <span className="num">{cdFmtEuro(total)}</span>
      </div>

      {empty && !final ? (
        <div className="cd-empty-hint">
          <i className="cd-dot" />
          Vul stap 1 & 2 in (medewerkers + brutoloon) — dan rekent alles live mee.
        </div>
      ) : (
        <div className="cd-verzpct">
          <span className="vp-val">{cdFmtPct(verz)}<span className="pct">%</span></span>
          <span className="vp-lbl">totaal verzuim</span>
        </div>
      )}

      {/* CFO-breakdown */}
      <div className="cd-cfo">
        {rows.map((r) => (
          <div key={r.k} className={'cd-cfo-row' + (r.core ? ' is-core' : '')}>
            <span className="lbl">{r.k}</span>
            <span className="val">€ {cdFmtEuro(r.v)}</span>
          </div>
        ))}
        <div className="cd-cfo-row is-total">
          <span className="lbl">Totale verzuimkost</span>
          <span className="val">€ {cdFmtEuro(total)}</span>
        </div>
      </div>

      {/* gestapelde balk */}
      <div className="cd-bar">
        {rows.map((r, i) => (
          <span key={r.k} className={'cd-seg cd-seg-' + i}
                style={{ width: (base > 0 ? (r.v / (total || 1)) * 100 : 0) + '%' }} />
        ))}
      </div>

      <div className="cd-kpis">
        <div className="cd-kpi">
          <div className="k-lbl">Per medewerker</div>
          <div className="k-val"><span className="cur">€</span>{cdFmtEuro(perFte)}</div>
        </div>
        <div className="cd-kpi">
          <div className="k-lbl">Verzuimgraad</div>
          <div className="k-val">{cdFmtPct(verz)}<small>%</small></div>
        </div>
      </div>

      {final && (
        <a className="cd-btn cd-btn-primary cd-report-cta" href="#" onClick={(e) => e.preventDefault()}>
          Ontvang het volledige rapport →
        </a>
      )}
    </div>
  );
}

// ── Het lichte WIZARD-paneel ────────────────────────────────────────
function CDWizard({ step, setStep, calc, setField, mode, onReveal, compact }) {
  const cur = CD_STEPS[step];
  const isLast = step === CD_STEPS.length - 1;

  function renderControl() {
    switch (cur.key) {
      case 'org':
        return <CDField label="Aantal medewerkers (FTE)" value={calc.fteRaw}
                        onChange={(v) => setField('fte', v)} suffix="FTE" placeholder="bv. 100" />;
      case 'salary':
        return <CDField label="Gemiddeld brutoloon / jaar" value={calc.salaryRaw}
                        onChange={(v) => setField('salary', v)} prefix="€" placeholder="bv. 45.000" />;
      case 'ongoing':
        return <CDField label="Doorlopende kosten / medewerker / jaar" value={calc.ongoingRaw}
                        onChange={(v) => setField('ongoing', v)} prefix="€" placeholder="bv. 2.000" />;
      case 'replace':
        return <CDField label="Vervangingskosten / medewerker / jaar" value={calc.replaceRaw}
                        onChange={(v) => setField('replace', v)} prefix="€" placeholder="bv. 3.500" />;
      case 'impact':
        return <CDField label="Organisatorische impact / medewerker / jaar" value={calc.impactRaw}
                        onChange={(v) => setField('impact', v)} prefix="€" placeholder="bv. 1.800" />;
      case 'verz':
        return <CDSlider label="Totaal verzuim" value={calc.verz}
                         onChange={(v) => setField('verz', v)} min={0} max={20} step={0.1} suffix="%" />;
      default: return null;
    }
  }

  return (
    <div className={'cd-wizard' + (compact ? ' cd-c' : '')}>
      {/* stepper */}
      <div className="cd-stepper">
        {CD_STEPS.map((s, i) => (
          <button key={s.key} type="button"
                  className={'cd-step-dot' + (i === step ? ' is-active' : '') + (i < step ? ' is-done' : '')}
                  onClick={() => setStep(i)} aria-label={'Stap ' + s.n}>
            {s.n}
          </button>
        ))}
      </div>

      <div className="cd-panel">
        <h3 className="cd-panel-title">{cur.title}</h3>
        <p className="cd-panel-lead">{cur.lead}</p>
        <div className="cd-controls">{renderControl()}</div>
      </div>

      <div className="cd-nav">
        <button type="button" className="cd-btn cd-btn-ghost"
                disabled={step === 0}
                onClick={() => setStep(Math.max(0, step - 1))}>Vorige</button>
        {isLast && mode === 'wizard' ? (
          <button type="button" className="cd-btn cd-btn-primary cd-next" onClick={onReveal}>
            Bekijk resultaat →
          </button>
        ) : isLast ? (
          <span className="cd-done-note">Alles ingevuld — het cijfer staat links.</span>
        ) : (
          <button type="button" className="cd-btn cd-btn-primary cd-next"
                  onClick={() => setStep(Math.min(CD_STEPS.length - 1, step + 1))}>
            Volgende →
          </button>
        )}
      </div>
    </div>
  );
}

// ── PDF-formulier (reveal-variant D): gegevens invullen → rapport per mail ──
function CDPdfForm({ onBack }) {
  const [sent, setSent] = React.useState(false);
  const [name, setName] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [consent, setConsent] = React.useState(false);
  const valid = name.trim() && /.+@.+\..+/.test(email) && consent;

  if (sent) {
    return (
      <div className="cd-pdf">
        <div className="cd-pdf-sent">
          <div className="cd-check">✓</div>
          <h4>Rapport onderweg</h4>
          <p>We sturen uw persoonlijke PDF-rapport naar <b>{email}</b>. Check uw mailbox.</p>
          <button type="button" className="cd-pf-back" onClick={onBack}>← Pas de gegevens aan</button>
        </div>
      </div>
    );
  }
  return (
    <div className="cd-pdf">
      <span className="cd-eyebrow on-light">Ontvang uw rapport</span>
      <h3 className="cd-pdf-title">Uw persoonlijke PDF-rapport</h3>
      <p className="cd-pdf-lead">Vul uw gegevens in — u ontvangt het volledige rapport met alle cijfers en de sectorvergelijking in uw mailbox.</p>
      <div className="cd-pf-grid">
        <div className="cd-pf-field"><label>Naam</label>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Uw naam" /></div>
        <div className="cd-pf-field"><label>Bedrijf</label>
          <input placeholder="Uw organisatie" /></div>
        <div className="cd-pf-field"><label>E-mail</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="naam@bedrijf.be" /></div>
        <div className="cd-pf-field"><label>Telefoon <span className="cd-opt-tag">optioneel</span></label>
          <input placeholder="+32 …" /></div>
        <label className="cd-pf-consent">
          <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} />
          <span>Ik ga akkoord dat Montisoro mij het rapport bezorgt en contact mag opnemen. <a href="#" onClick={(e) => e.preventDefault()}>Privacybeleid</a></span>
        </label>
      </div>
      <button type="button" className="cd-btn cd-btn-primary cd-pf-submit" disabled={!valid}
              onClick={() => setSent(true)}>Stuur mij het rapport →</button>
      <button type="button" className="cd-pf-back" onClick={onBack}>← Pas de gegevens aan</button>
    </div>
  );
}

// ── De volledige mock (kiest layout op basis van mode) ──────────────
function CalcMock({ mode, compact, revealKind = 'report' }) {
  const [step, setStep] = React.useState(0);
  const [revealed, setRevealed] = React.useState(false);
  const [fte, setFte] = React.useState('');
  const [salary, setSalary] = React.useState('');
  const [ongoing, setOngoing] = React.useState('');
  const [replace, setReplace] = React.useState('');
  const [impact, setImpact] = React.useState('');
  const [verz, setVerz] = React.useState(10.1); // Belgisch sectorgemiddelde (seed)

  // reset de reveal-status wanneer de flow-modus wisselt
  React.useEffect(() => { setRevealed(false); }, [mode]);

  function setField(k, v) {
    if (k === 'fte') setFte(v);
    else if (k === 'salary') setSalary(v);
    else if (k === 'ongoing') setOngoing(v);
    else if (k === 'replace') setReplace(v);
    else if (k === 'impact') setImpact(v);
    else if (k === 'verz') setVerz(v);
  }

  const nFte = parseFloat(fte) || 0;
  const nSal = parseFloat(salary) || 0;
  const nOng = parseFloat(ongoing) || 0;
  const nRep = parseFloat(replace) || 0;
  const nImp = parseFloat(impact) || 0;
  const m = verz / 100;

  const cLoon = nFte * nSal * m;
  const cOng = nFte * nOng * m;
  const cRep = nFte * nRep * m;
  const cImp = nFte * nImp * m;
  const total = Math.round(cLoon + cOng + cRep + cImp);
  const base = nFte * nSal + nFte * (nOng + nRep + nImp);
  const empty = !(nFte > 0 && nSal > 0);
  const perFte = nFte ? Math.round(total / nFte) : 0;

  const rows = [
    { k: 'Loondoorbetaling', v: Math.round(cLoon), core: true },
    { k: 'Doorlopende kosten', v: Math.round(cOng) },
    { k: 'Vervanging', v: Math.round(cRep) },
    { k: 'Organisatorische impact', v: Math.round(cImp) },
  ];

  const calc = {
    total, perFte, verz, empty, rows, base,
    fteRaw: fte, salaryRaw: salary, ongoingRaw: ongoing, replaceRaw: replace, impactRaw: impact,
  };

  const wizard = (
    <CDWizard step={step} setStep={setStep} calc={calc} setField={setField}
              mode={mode} onReveal={() => setRevealed(true)} compact={compact} />
  );

  // ── LIVE MODE: preview + stappen samen ──
  if (mode === 'live') {
    return (
      <div className={'cd-stage cd-live' + (compact ? ' cd-c' : '')}>
        <div className="cd-col-preview"><CDPreview calc={calc} compact={compact} /></div>
        <div className="cd-col-wizard">{wizard}</div>
      </div>
    );
  }

  // ── WIZARD MODE: eerst stappen, dan eind-reveal ──
  if (!revealed) {
    return (
      <div className={'cd-stage cd-wizardonly' + (compact ? ' cd-c' : '')}>
        <div className="cd-col-wizard">{wizard}</div>
      </div>
    );
  }
  return (
    <div className={'cd-stage cd-reveal' + (compact ? ' cd-c' : '')}>
      <div className="cd-col-preview"><CDPreview calc={calc} compact={compact} final /></div>
      <div className="cd-col-report">
        {revealKind === 'form' ? (
          <CDPdfForm onBack={() => setRevealed(false)} />
        ) : (
          <div className="cd-report">
            <span className="cd-eyebrow on-light">Volledig rapport</span>
            <h3 className="cd-report-title">Wat verzuim uw organisatie écht kost</h3>
            <div className="cd-report-rows">
              {rows.map((r) => (
                <div key={r.k} className="cd-rep-row"><span>{r.k}</span><b>€ {cdFmtEuro(r.v)}</b></div>
              ))}
              <div className="cd-rep-row is-total"><span>Totale verzuimkost / jaar</span><b>€ {cdFmtEuro(total)}</b></div>
              <div className="cd-rep-row"><span>Per medewerker</span><b>€ {cdFmtEuro(perFte)}</b></div>
              <div className="cd-rep-row"><span>Verzuimgraad</span><b>{cdFmtPct(verz)}%</b></div>
            </div>
            <button type="button" className="cd-btn cd-btn-ghost cd-again"
                    onClick={() => setRevealed(false)}>← Pas de gegevens aan</button>
          </div>
        )}
      </div>
    </div>
  );
}

Object.assign(window, { CalcMock });
