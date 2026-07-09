/* ═══════════════════════════════════════════════════════════════════
   admin-emaillog.js — Email log + PDF management + Testmail (FIX 3/4/5)
   Handles:
   - view-emaillog: delivery failures list + testmail sender
   - view-pdfmanagement: calculator PDF status + signed URL download
═══════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';
  if (window.__emaillogLoaded) return;
  var mtT = (window.MONTISORO_ADMIN_I18N ? window.MONTISORO_ADMIN_I18N.t : function(k){return k;});
  window.__emaillogLoaded = true;

  function sess() {
    try { return JSON.parse(sessionStorage.getItem('admin.session') || '{}'); } catch(e) { return {}; }
  }

  function esc(s) {
    var d = document.createElement('div'); d.textContent = String(s == null ? '' : s); return d.innerHTML;
  }

  function fmt(iso) {
    return iso ? String(iso).replace('T', ' ').slice(0, 16) : '—';
  }

  /* ─── EMAIL LOG (FIX 4) ─── */
  function loadFailures() {
    var s = sess();
    if (!s.token) return;
    var tbody = document.getElementById('ef-tbody');
    if (!tbody) return;
    tbody.innerHTML = '<tr><td class="el-empty" colspan="5">Laden…</td></tr>';

    fetch('/api/admin-failures', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: s.token, limit: 50 })
    })
      .then(function(r) { return r.ok ? r.json() : null; })
      .then(function(out) {
        if (!out || !out.ok) {
          tbody.innerHTML = '<tr><td colspan="5" class="a-td-empty">Backend niet geconfigureerd \u2014 verbind Supabase (K1).</td></tr>';
          return;
        }
        if (!out.failures.length) {
          tbody.innerHTML = '<tr><td class="el-empty-ok" colspan="5">\u2713 Geen bezorgingsfouten gevonden.</td></tr>';
          return;
        }
        tbody.innerHTML = out.failures.map(function(f) {
          return '<tr>' +
            '<td><span class="el-errtag">' + esc(f.type) + '</span></td>' +
            '<td>' + esc(f.recipient) + '</td>' +
            '<td class="el-trunc" title="' + esc(f.error) + '">' + esc(f.error) + '</td>' +
            '<td><span class="sub">' + fmt(f.created_at) + '</span></td>' +
            '<td><button class="btn btn-ghost a-btn-xs" data-resolve="' + esc(f.id) + '">Opgelost</button></td>' +
          '</tr>';
        }).join('');

        tbody.querySelectorAll('[data-resolve]').forEach(function(btn) {
          btn.onclick = function() {
            var fid = btn.dataset.resolve;
            btn.disabled = true; btn.textContent = '…';
            fetch('/api/admin-failures', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ token: s.token, action: 'resolve', failure_id: fid })
            }).then(function() { loadFailures(); });
          };
        });
      })
      .catch(function() {
        tbody.innerHTML = '<tr><td colspan="5" class="a-td-empty">Netwerk fout \u2014 probeer opnieuw.</td></tr>';
      });
  }

  /* ─── TESTMAIL (FIX 5) ─── */
  function initTestmail() {
    var btn = document.getElementById('tm-send');
    var result = document.getElementById('tm-result');
    if (!btn) return;
    btn.onclick = function() {
      var s = sess();
      if (!s.token) { result.innerHTML = '<span class="u-c-warnred">Niet ingelogd.</span>'; return; }
      var type = document.getElementById('tm-type').value;
      var lang = document.getElementById('tm-lang').value;
      var to   = document.getElementById('tm-to').value || s.email || '';
      if (!to) { result.innerHTML = '<span class="u-c-warnred">Vul een ontvanger-e-mail in.</span>'; return; }

      btn.disabled = true; btn.textContent = 'Versturen…';
      result.innerHTML = '';

      fetch('/api/admin-testmail', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: s.token, type: type, lang: lang, to: to })
      })
        .then(function(r) { return r.json().then(function(d) { return { status: r.status, d: d }; }); })
        .then(function(x) {
          btn.disabled = false; btn.innerHTML = '<i class="ti ti-send"></i> Stuur testmail';
          if (x.status === 200 && x.d.ok) {
            result.innerHTML = '<span class="u-c-good2">\u2713 Testmail verstuurd naar ' + esc(x.d.to) + '</span>';
          } else if (x.status === 503) {
            result.innerHTML = '<span class="el-amber">\u26a0 Backend niet geconfigureerd (Resend K1 ontbreekt).</span>';
          } else if (x.status === 403) {
            result.innerHTML = '<span class="u-c-warnred">Alleen Admin-rol kan testmails versturen.</span>';
          } else {
            result.innerHTML = '<span class="u-c-warnred">Fout: ' + esc((x.d && x.d.error) || x.status) + '</span>';
          }
        })
        .catch(function() {
          btn.disabled = false; btn.innerHTML = '<i class="ti ti-send"></i> Stuur testmail';
          result.innerHTML = '<span class="u-c-warnred">Netwerk fout \u2014 probeer opnieuw.</span>';
        });
    };

    /* Pre-fill recipient with logged-in email */
    var s = sess();
    var toInput = document.getElementById('tm-to');
    if (toInput && s.email) toInput.placeholder = s.email;
  }

  /* ─── PDF MANAGEMENT (FIX 3) ─── */
  function loadPdfs() {
    var DATA = window.AdminData ? window.AdminData.load() : {};
    var subs = (DATA.submissions && DATA.submissions.calculator) || [];
    var tbody = document.getElementById('pdf-tbody');
    if (!tbody) return;

    if (!subs.length) {
      tbody.innerHTML = '<tr><td colspan="6" class="a-td-empty">Geen calculator submissions \u2014 verbind Supabase (K1) om echte data te laden.</td></tr>';
      return;
    }

    tbody.innerHTML = subs.map(function(c) {
      var statusColor = c.pdf_status === 'generated' ? 'var(--a-good,#22c55e)' : c.pdf_status === 'failed' ? '#d8654f' : 'var(--a-muted-2)';
      return '<tr>' +
        '<td><span class="name">' + esc(c.name || '—') + '</span></td>' +
        '<td>' + esc(c.company || '—') + '</td>' +
        '<td>' + esc(c.cost || '—') + '</td>' +
        '<td><span style="font-size:11px;color:' + statusColor + ';font-weight:600;">' + esc(c.pdf_status || 'pending') + '</span></td>' +
        '<td><span class="sub">' + esc(c.ts || '—') + '</span></td>' +
        '<td>' + (c.id ? '<button class="btn btn-ghost a-btn-xs" data-pdf-id="' + esc(c.id) + '"><i class="ti ti-download"></i> Download</button>' : '—') + '</td>' +
      '</tr>';
    }).join('');

    tbody.querySelectorAll('[data-pdf-id]').forEach(function(btn) {
      btn.onclick = function() {
        var s = sess();
        if (!s.token) return;
        btn.disabled = true; btn.textContent = 'Laden…';
        fetch('/api/admin-pdf', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token: s.token, submission_id: btn.dataset.pdfId })
        })
          .then(function(r) { return r.json(); })
          .then(function(d) {
            btn.disabled = false; btn.innerHTML = '<i class="ti ti-download"></i> Download';
            if (d.ok && d.url) {
              window.open(d.url, '_blank', 'noopener');
            } else {
              alert(mtT('alert_pdf_not_found') + (d.error || mtT('err_unknown')));
            }
          })
          .catch(function() {
            btn.disabled = false; btn.innerHTML = '<i class="ti ti-download"></i> Download';
            alert(mtT('alert_pdf_network'));
          });
      };
    });
  }

  /* ─── Init hooks ─── */
  window.init_emaillog      = function() { initTestmail(); loadFailures(); };
  window.init_pdfmanagement = function() { loadPdfs(); };

  document.addEventListener('DOMContentLoaded', function() {
    var refresh = document.getElementById('ef-refresh');
    if (refresh) refresh.onclick = loadFailures;
  });
})();
