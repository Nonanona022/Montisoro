/* ═══════════════════════════════════════════════════════════════════
   Montisoro Admin — "Vertrouwd door" module (Home logo strip CRUD)
   Same data shape as /website/data/trusted-by.js:
     { id, name, logo, order, active }
   Export regenerates that file (until a live backend writes it directly).
═══════════════════════════════════════════════════════════════════ */
window.initTrustedBy = function(DATA, $, $$, esc, openDrawer, closeDrawer, drawer, drawerBackdrop, showToast){
  var grid = $('#trustedby-grid');
  var mtT = (window.MONTISORO_ADMIN_I18N ? window.MONTISORO_ADMIN_I18N.t : function(k){return k;});
  if (!grid) return;
  DATA.trustedBy = DATA.trustedBy || [];
  function byOrder(a,b){ return (a.order||0)-(b.order||0); }
  var list = DATA.trustedBy.slice().sort(byOrder);

  grid.innerHTML = list.map(function(c, i){
    var logoHtml = c.logo
      ? '<div class="tb-logo-slot"><img src="' + esc(c.logo) + '" alt="' + esc(c.name) + '" style="max-height:40px;max-width:120px;object-fit:contain;' + (c.mono===false?'opacity:.95;':'filter:brightness(0) invert(1);opacity:.85;') + '"></div>'
      : '<div class="tb-logo-ph">geen logo</div>';
    var badge = c.active !== false
      ? '<span class="tag new"><i class="ti ti-circle-filled a-ico8"></i>Actief</span>'
      : '<span class="tag wait"><i class="ti ti-eye-off a-ico11"></i>Verborgen</span>';
    return '<div class="panel cs-case-card' + (c.active!==false?'':' is-off') + '">' +
      '<div class="cs-badge-pos">' + badge + '</div>' +
      logoHtml +
      '<div class="tb-name">' + esc(c.name || mtT('ui_unnamed')) + '</div>' +
      '<div class="cs-cardfoot">' +
        '<button class="btn btn-ghost btn-sm" data-tb-up="' + esc(c.id) + '"' + (i===0?' disabled':'') + ' title="Omhoog"><i class="ti ti-arrow-up"></i></button>' +
        '<button class="btn btn-ghost btn-sm" data-tb-down="' + esc(c.id) + '"' + (i===list.length-1?' disabled':'') + ' title="Omlaag"><i class="ti ti-arrow-down"></i></button>' +
        '<button class="btn btn-ghost btn-md is-grow" data-tb-edit="' + esc(c.id) + '"><i class="ti ti-edit"></i>' + mtT('act_edit') + '</button>' +
      '</div>' +
    '</div>';
  }).join('');

  $$('[data-tb-edit]').forEach(function(b){ b.onclick = function(){ openEditor(b.dataset.tbEdit); }; });
  $$('[data-tb-up]').forEach(function(b){ b.onclick = function(){ move(b.dataset.tbUp, -1); }; });
  $$('[data-tb-down]').forEach(function(b){ b.onclick = function(){ move(b.dataset.tbDown, 1); }; });

  var addBtn = $('#trustedby-add-btn'); if (addBtn) addBtn.onclick = function(){ openEditor(null); };
  var prev = $('#trustedby-preview'); if (prev) prev.onclick = function(){ window.open(((window.SITE_URL||'../../website/pages').replace(/\/$/,'')) + '/Home.html', '_blank', 'noopener'); };
  var exp = $('#trustedby-export'); if (exp) exp.onclick = exportFile;
  /* KRITIEK #1 — write-bridge: publiceer direct naar Supabase */
  var pub = $('#trustedby-publish');
  if (pub) pub.onclick = function(){
    reindex();
    if (window.publishToSite) {
      pub.disabled = true; pub.textContent = mtT('btn_publishing');
      window.publishToSite('trusted_by', DATA.trustedBy.slice().sort(byOrder), function(ok){
        pub.disabled = false; pub.innerHTML = '<i class="ti ti-cloud-upload"></i> ' + mtT('btn_publish');
      });
    }
  };

  function reindex(){ DATA.trustedBy.sort(byOrder).forEach(function(c,i){ c.order = i+1; }); }
  function move(id, dir){
    DATA.trustedBy.sort(byOrder);
    var idx = DATA.trustedBy.findIndex(function(x){ return x.id===id; });
    var j = idx + dir; if (idx<0 || j<0 || j>=DATA.trustedBy.length) return;
    var t = DATA.trustedBy[idx]; DATA.trustedBy[idx] = DATA.trustedBy[j]; DATA.trustedBy[j] = t;
    reindex(); window.AdminData.save(DATA); window.init_trustedby();
  }

  function exportFile(){
    reindex();
    var rows = DATA.trustedBy.slice().sort(byOrder).map(function(c){
      return '  { name:' + JSON.stringify(c.name||'') + ', logo:' + JSON.stringify(c.logo||'') + ', order:' + (c.order||0) + ', active:' + (c.active!==false) + (c.mono===false?', mono:false':'') + ' }';
    }).join(',\n');
    var file = '/* Montisoro — Vertrouwd door · single source of truth.\n' +
      '   Gegenereerd door het admin panel op ' + new Date().toISOString() + '.\n' +
      '   Plaats dit bestand in /website/data/trusted-by.js */\n' +
      'window.MONTISORO_TRUSTED = [\n' + rows + '\n];\n';
    var blob = new Blob([file], { type:'application/javascript' });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = 'trusted-by.js';
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    setTimeout(function(){ URL.revokeObjectURL(a.href); }, 1000);
    showToast(mtT('toast_exported_trustedby'), 'download');
  }

  function openEditor(id){
    var isNew = (id === null);
    var c = isNew ? { id:'tb-new', name:'', logo:'', order:99, active:true }
                  : DATA.trustedBy.find(function(x){ return x.id===id; });
    if (!c) return;

    function logoBlock(){
      return c.logo
        ? '<div class="tb-preview-card">' +
            '<div class="tb-preview-logo"><img class="tb-preview-img" src="' + esc(c.logo) + '" alt=""></div>' +
            '<div class="a-flex1-note"><b class="u-c-off">' + mtT('ui_logo_set') + '</b><br>' + mtT('ui_logo_replace') + '</div>' +
            '<button class="btn btn-ghost lf-b2" data-logo-clear><i class="ti ti-trash"></i></button>' +
          '</div>'
        : '<div class="tb-empty"><b class="u-c-off">Geen logo ingesteld</b><br>Zonder logo tonen we enkel de bedrijfsnaam op de site.</div>';
    }
    function html(){
      return '<div class="drawer-head"><div><div class="eyebrow">' + (isNew?mtT('tb_add'):mtT('tb_edit')) + '</div><h3>' + esc(isNew?mtT('tb_new'):c.name) + '</h3></div><button class="drawer-close" data-close><i class="ti ti-x"></i></button></div>' +
        '<div class="drawer-body">' +
          '<div class="drawer-section-label is-first"><i class="ti ti-photo u-mr-6"></i>' + mtT('ui_logo') + '</div>' +
          logoBlock() +
          '<div class="field"><label>Upload logo</label><input class="a-select10" type="file" id="tb-logo" accept="image/svg+xml,image/png,image/webp"><div class="hint">Transparante SVG of PNG werkt best. Wordt monochroom-wit getoond. Max 1 MB.</div></div>' +
          '<div class="drawer-section-label"><i class="ti ti-building u-mr-6"></i>Gegevens</div>' +
          '<div class="field"><label>' + mtT('tb_companyname') + '</label><input id="tb-name" value="' + esc(c.name) + '" placeholder="'+mtT('ui_ph_company')+'"></div>' +
          '<div class="drawer-section-label"><i class="ti ti-toggle-right u-mr-6"></i>' + mtT('ui_visibility') + '</div>' +
          '<label class="cs-check-card"><input class="cs-check-lg" type="checkbox" id="tb-active" ' + (c.active!==false?'checked':'') + '><div><div class="a-val-b">Actief tonen</div><div class="a-caption">Uitvinken verbergt het bedrijf zonder data te verliezen.</div></div></label>' +
          '<label class="cs-check-card u-mt-10"><input class="a-check-org" type="checkbox" id="tb-mono" ' + (c.mono===false?'checked':'') + '><div><div class="a-val-b">Logo in originele kleur tonen</div><div class="a-caption">Aanvinken voor logo’s met een eigen achtergrond of kleur (bv. AXA). Anders tonen we het logo monochroom-wit.</div></div></label>' +
          '<div class="help-banner u-mt-22"><i class="ti ti-info-circle"></i><p>Na wijzigingen: klik op het overzicht op <b>Exporteer trusted-by.js</b> en plaats het bestand in <code>/website/data/</code>.</p></div>' +
        '</div>' +
        '<div class="drawer-foot">' +
          '<button class="btn btn-primary" data-save><i class="ti ti-check"></i>' + (isNew?mtT('act_add'):mtT('act_save')) + '</button>' +
          '<button class="btn btn-ghost" data-close><i class="ti ti-x"></i>Annuleer</button>' +
          (isNew ? '' : '<button class="btn btn-ghost is-danger u-ml-auto" data-delete><i class="ti ti-trash"></i>Verwijder</button>') +
        '</div>';
    }
    function sync(){
      var n = drawer.querySelector('#tb-name'), a = drawer.querySelector('#tb-active');
      if (n) c.name = n.value;
      if (a) c.active = a.checked;
      var mo = drawer.querySelector('#tb-mono'); if (mo) c.mono = mo.checked ? false : true;
    }
    function wire(){
      drawer.querySelectorAll('[data-close]').forEach(function(b){ b.addEventListener('click', closeDrawer); });
      var li = drawer.querySelector('#tb-logo');
      if (li) li.addEventListener('change', function(e){
        var file = e.target.files[0]; if (!file) return;
        if (file.size > 1024*1024){ showToast(mtT('toast_file_too_big_1'), 'alert-triangle'); return; }
        var r = new FileReader();
        r.onload = function(ev){ c.logo = ev.target.result; sync(); drawer.innerHTML = html(); wire(); showToast(mtT('toast_logo_updated'), 'photo'); };
        r.readAsDataURL(file);
      });
      var clr = drawer.querySelector('[data-logo-clear]');
      if (clr) clr.addEventListener('click', function(){ if (!confirm(mtT('confirm_logo_delete'))) return; c.logo=''; sync(); drawer.innerHTML = html(); wire(); });
      drawer.querySelector('[data-save]').addEventListener('click', function(){
        sync();
        if (!c.name){ showToast(mtT('toast_company_required'), 'alert-triangle'); return; }
        if (isNew){ c.id = 'tb-' + Date.now(); c.order = (DATA.trustedBy.length + 1); DATA.trustedBy.push(c); }
        window.AdminData.save(DATA); closeDrawer(); showToast(isNew ? c.name + mtT('toast_added') : mtT('toast_changes_saved')); window.init_trustedby();
      });
      var del = drawer.querySelector('[data-delete]');
      if (del) del.addEventListener('click', function(){
        window.Admin.confirmDelete({ name:c.name }).then(function(ok){
          if (!ok) return;
          var i = DATA.trustedBy.findIndex(function(x){ return x.id===c.id; });
          var removed = DATA.trustedBy[i];
          DATA.trustedBy = DATA.trustedBy.filter(function(x){ return x.id!==c.id; });
          window.AdminData.save(DATA); closeDrawer(); window.init_trustedby();
          window.Admin.undoToast(c.name + mtT('ui_deleted_suffix'), function(){
            DATA.trustedBy.splice(i<0?0:i, 0, removed); window.AdminData.save(DATA); window.init_trustedby(); window.Admin.showToast(c.name + mtT('toast_restored'));
          });
        });
      });
    }
    drawer.innerHTML = html();
    drawer.classList.add('is-open');
    drawerBackdrop.classList.add('is-open');
    wire();
  }
};
