/* ═══════════════════════════════════════════════════════════════════
   Montisoro Admin — Site Team module (About page team CRUD)
═══════════════════════════════════════════════════════════════════ */
window.initSiteTeam = function(DATA, $, $$, esc, openDrawer, closeDrawer, drawer, drawerBackdrop, showToast){

  var grid = $('#siteteam-grid');
  var mtT = (window.MONTISORO_ADMIN_I18N ? window.MONTISORO_ADMIN_I18N.t : function(k){return k;});
  if (!grid) return;
  var team = (DATA.siteTeam || []).slice().sort(function(a,b){return (a.order||0)-(b.order||0);});

  grid.innerHTML = team.map(function(p){
    var photoHtml = p.photo
      ? '<div style="width:96px;height:96px;border-radius:50%;background-image:url(' + esc(p.photo) + ');background-size:cover;background-position:center;border:2px solid var(--a-div-2);"></div>'
      : '<div class="st-avatar-lg">' + esc(p.initial) + '</div>';
    var statusBadge = p.status === 'paused'
      ? '<span class="tag wait"><i class="ti ti-pause a-ico11"></i>Op pauze</span>'
      : '<span class="tag new"><i class="ti ti-circle-filled a-ico8"></i>Actief</span>';
    var opacity = p.status === 'paused' ? '0.55' : '1';
    return '<div class="panel" style="padding:24px;display:flex;flex-direction:column;align-items:center;text-align:center;gap:14px;position:relative;cursor:pointer;transition:border-color .25s var(--a-ease), transform .25s var(--a-ease);opacity:' + opacity + ';" data-st-edit="' + esc(p.id) + '">' +
      '<div class="st-badge-pos">' + statusBadge + '</div>' +
      photoHtml +
      '<div>' +
        '<div class="st-name">' + esc(p.name || mtT('ui_unnamed')) + '</div>' +
        '<div class="st-role">' + esc(p.role_nl || '—') + '</div>' +
      '</div>' +
      '<div class="st-bio">' + esc(p.bio_nl || '') + '</div>' +
      '<button class="btn btn-ghost st-editbtn"><i class="ti ti-edit"></i>' + mtT('act_edit') + '</button>' +
    '</div>';
  }).join('');

  $$('[data-st-edit]').forEach(function(card){
    card.addEventListener('mouseenter', function(){ card.style.borderColor = 'rgba(232,89,43,0.30)'; card.style.transform = 'translateY(-2px)'; });
    card.addEventListener('mouseleave', function(){ card.style.borderColor = ''; card.style.transform = ''; });
    card.addEventListener('click', function(){ openSiteTeamEditor(card.dataset.stEdit); });
  });

  $('#siteteam-add-btn').onclick = function(){ openSiteTeamEditor(null); };
  $('#siteteam-preview').onclick = function(){ window.open(((window.SITE_URL||'../../website/pages').replace(/\/$/,'')) + '/about.html', '_blank', 'noopener'); };

  function openSiteTeamEditor(id){
    var isNew = (id === null);
    var p = isNew
      ? { id:'st-new', name:'', role_nl:'', role_en:'', bio_nl:'', bio_en:'', photo:'', initial:'?', status:'active', order:99 }
      : DATA.siteTeam.find(function(x){return x.id===id;});
    if (!p) return;
    var activeLang = 'nl';

    function html(){
      var photoBlock = p.photo
        ? '<div class="st-listrow">' +
            '<div style="width:64px;height:64px;border-radius:50%;background-image:url(' + esc(p.photo) + ');background-size:cover;background-position:center;border:2px solid var(--a-div-2);flex-shrink:0;"></div>' +
            '<div class="a-flex1-note"><b class="u-c-off">' + mtT('st_photo_set') + '</b><br>' + mtT('st_photo_replace') + '</div>' +
            '<button class="btn btn-ghost lf-b2" data-photo-clear><i class="ti ti-trash"></i></button>' +
          '</div>'
        : '<div class="st-emptyrow">' +
            '<div class="st-avatar-md">' + esc(p.initial || '?') + '</div>' +
            '<div class="a-flex1-note"><b class="u-c-off">Geen foto ingesteld</b><br>Tot er een foto is, tonen we de initiaal in een oranje cirkel.</div>' +
          '</div>';
      var roleField = activeLang === 'nl' ? p.role_nl : p.role_en;
      var bioField = activeLang === 'nl' ? p.bio_nl : p.bio_en;

      return '<div class="drawer-head"><div><div class="eyebrow">' + (isNew ? mtT('st_add') : mtT('st_edit')) + '</div><h3>' + esc(isNew ? mtT('st_new') : p.name) + '</h3></div><button class="drawer-close" data-close><i class="ti ti-x"></i></button></div>' +
        '<div class="st-drawerhead">' +
          '<div class="tabs st-plainbtn">' +
            '<button class="tab' + (activeLang==='nl'?' is-active':'') + ' st-minw96" data-lang="nl">Nederlands</button>' +
            '<button class="tab' + (activeLang==='en'?' is-active':'') + ' st-minw96" data-lang="en">English</button>' +
          '</div>' +
        '</div>' +
        '<div class="drawer-body">' +
          '<div class="drawer-section-label is-first"><i class="ti ti-photo u-mr-6"></i>' + mtT('st_photo') + '</div>' +
          photoBlock +
          '<div class="field"><label>Upload nieuwe foto</label><input class="st-select" type="file" id="st-photo" accept="image/jpeg,image/png,image/webp"><div class="hint">Vierkante foto werkt best. Max 2 MB. JPG, PNG of WebP.</div></div>' +
          '<div class="drawer-section-label"><i class="ti ti-user u-mr-6"></i>Gegevens</div>' +
          '<div class="field"><label>Volledige naam</label><input id="st-name" value="' + esc(p.name) + '" placeholder="Bijv. Sofie Vandenberg"></div>' +
          '<div class="field"><label>Functie (' + activeLang.toUpperCase() + ')</label><input id="st-role" value="' + esc(roleField) + '" placeholder="Bijv. Senior Case Manager"></div>' +
          '<div class="field"><label>Bio / Beschrijving (' + activeLang.toUpperCase() + ')</label><textarea id="st-bio" rows="3">' + esc(bioField) + '</textarea><div class="hint">Eén à twee zinnen. Verschijnt bij hover (desktop) of tap (mobiel) op de team-card.</div></div>' +
          '<div class="drawer-section-label"><i class="ti ti-toggle-right u-mr-6"></i>Status</div>' +
          '<div class="st-col10">' +
            '<label style="display:flex;align-items:flex-start;gap:12px;padding:14px;background:' + (p.status==='active'?'rgba(90,191,126,0.06)':'rgba(29,29,31,0.03)') + ';border:1px solid ' + (p.status==='active'?'rgba(90,191,126,0.30)':'var(--a-div)') + ';border-radius:10px;cursor:pointer;">' +
              '<input class="st-check-g" type="radio" name="st-status" value="active" ' + (p.status==='active'?'checked':'') + '>' +
              '<div><div class="a-val-b">' + mtT('ui_active') + '</div><div class="a-caption">' + mtT('st_active_desc') + '</div></div>' +
            '</label>' +
            '<label style="display:flex;align-items:flex-start;gap:12px;padding:14px;background:' + (p.status==='paused'?'rgba(232,180,92,0.06)':'rgba(29,29,31,0.03)') + ';border:1px solid ' + (p.status==='paused'?'rgba(232,180,92,0.30)':'var(--a-div)') + ';border-radius:10px;cursor:pointer;">' +
              '<input class="st-check-a" type="radio" name="st-status" value="paused" ' + (p.status==='paused'?'checked':'') + '>' +
              '<div><div class="a-val-b">' + mtT('st_paused') + '</div><div class="a-caption">' + mtT('st_paused_desc') + '</div></div>' +
            '</label>' +
          '</div>' +
          (isNew ? '' :
            '<div class="help-banner st-danger"><i class="ti ti-alert-triangle u-c-red"></i><p class="st-ink85"><b>Persoon verwijderen?</b> Permanent. Bio + foto worden definitief verwijderd. Voor tijdelijk afwezig: gebruik "Op pauze".</p></div>') +
        '</div>' +
        '<div class="drawer-foot">' +
          '<button class="btn btn-primary" data-save><i class="ti ti-check"></i>' + (isNew ? mtT('act_add') : mtT('act_save')) + '</button>' +
          '<button class="btn btn-ghost" data-close><i class="ti ti-x"></i>Annuleer</button>' +
          (isNew ? '' : '<button class="btn btn-ghost is-danger u-ml-auto" data-delete><i class="ti ti-trash"></i>Verwijder</button>') +
        '</div>';
    }

    function saveCurrent(){
      var name = drawer.querySelector('#st-name');
      var role = drawer.querySelector('#st-role');
      var bio  = drawer.querySelector('#st-bio');
      var status = drawer.querySelector('input[name="st-status"]:checked');
      if (name) p.name = name.value;
      if (role) { if (activeLang==='nl') p.role_nl = role.value; else p.role_en = role.value; }
      if (bio)  { if (activeLang==='nl') p.bio_nl  = bio.value;  else p.bio_en  = bio.value; }
      if (status) p.status = status.value;
      if (p.name) p.initial = p.name.charAt(0).toUpperCase();
    }

    function wireUp(){
      drawer.querySelectorAll('[data-lang]').forEach(function(t){
        t.addEventListener('click', function(){ saveCurrent(); activeLang = t.dataset.lang; drawer.innerHTML = html(); wireUp(); });
      });
      drawer.querySelectorAll('[data-close]').forEach(function(b){ b.addEventListener('click', closeDrawer); });

      var photoInput = drawer.querySelector('#st-photo');
      if (photoInput){
        photoInput.addEventListener('change', function(e){
          var file = e.target.files[0]; if (!file) return;
          if (file.size > 2*1024*1024){ showToast(mtT('toast_file_too_big_2'), 'alert-triangle'); return; }
          var reader = new FileReader();
          reader.onload = function(ev){
            p.photo = ev.target.result;
            saveCurrent();
            drawer.innerHTML = html();
            wireUp();
            showToast(mtT('toast_photo_updated'), 'photo');
          };
          reader.readAsDataURL(file);
        });
      }
      var clearBtn = drawer.querySelector('[data-photo-clear]');
      if (clearBtn) clearBtn.addEventListener('click', function(){
        if (!confirm(mtT('confirm_photo_delete'))) return;
        p.photo = ''; saveCurrent(); drawer.innerHTML = html(); wireUp();
      });

      drawer.querySelector('[data-save]').addEventListener('click', function(){
        saveCurrent();
        if (!p.name){ showToast(mtT('toast_name_required'), 'alert-triangle'); return; }
        if (isNew){
          p.id = 'st-' + Date.now();
          p.order = (DATA.siteTeam || []).length + 1;
          DATA.siteTeam = DATA.siteTeam || [];
          DATA.siteTeam.push(p);
        }
        window.AdminData.save(DATA);
        closeDrawer();
        showToast(isNew ? p.name + mtT('toast_added') : mtT('toast_changes_saved'));
        window.init_siteteam();
      });

      var delBtn = drawer.querySelector('[data-delete]');
      if (delBtn) delBtn.addEventListener('click', function(){
        window.Admin.confirmDelete({ name:p.name, message:(window.MONTISORO_ADMIN_I18N&&window.MONTISORO_ADMIN_I18N.getLang()==='en')?'Permanently remove this person? For temporary absence, use \u201cPause\u201d instead.':'Deze persoon permanent verwijderen? Voor tijdelijk afwezig: gebruik \u201cOp pauze\u201d.' }).then(function(ok){
          if (!ok) return;
          var i = DATA.siteTeam.findIndex(function(x){ return x.id===p.id; });
          var removed = DATA.siteTeam[i];
          DATA.siteTeam = DATA.siteTeam.filter(function(x){return x.id!==p.id;});
          window.AdminData.save(DATA);
          closeDrawer();
          window.init_siteteam();
          window.Admin.undoToast(p.name + mtT('ui_deleted_suffix'), function(){
            DATA.siteTeam.splice(i<0?0:i, 0, removed); window.AdminData.save(DATA); window.init_siteteam(); window.Admin.showToast(p.name + mtT('toast_restored'));
          });
        });
      });
    }

    drawer.innerHTML = html();
    drawer.classList.add('is-open');
    drawerBackdrop.classList.add('is-open');
    wireUp();
  }
};
