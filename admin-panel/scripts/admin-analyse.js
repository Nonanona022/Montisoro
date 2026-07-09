/* ═══════════════════════════════════════════════════════════════════
   admin-analyse.js — Analyse-module (lichte Apple-variant)
   ───────────────────────────────────────────────────────────────────
   Eén sidebar-ingang "Analyse" → sub-tab-balk met 12 views. Globale
   periodefilter (9 presets + custom). Leest /api/admin-metrics (HMAC).
   Lichte inline-SVG-grafieken: lijn, staaf, donut, funnel. Geen externe
   chart-bibliotheek. window.init_analyse() wordt door admin.js aangeroepen.
═══════════════════════════════════════════════════════════════════ */
(function () {
  var mtT = (window.MONTISORO_ADMIN_I18N ? window.MONTISORO_ADMIN_I18N.t : function(k){return k;});
  'use strict';
  var C = { orange:'#E8592B', ink:'#1D1D1F', good:'#2A9D5C', bad:'#D64545', warn:'#C98A1E',
            grid:'rgba(29,29,31,.08)', muted:'rgba(29,29,31,.62)' };

  function esc(s){ return String(s==null?'':s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];}); }
  function fmt(n){ n=Math.round(+n||0); return n.toLocaleString('nl-BE'); }
  function ms2dur(ms){ ms=+ms||0; var s=Math.round(ms/1000); if(s<60) return s+'s'; var m=Math.floor(s/60); var r=s%60; return m+'m '+(r<10?'0':'')+r+'s'; }
  function pathLabel(p){ if(!p) return '—'; p=String(p).split('?')[0]; var f=p.split('/').pop()||p; return f.replace(/\.html$/,'')||'Home'; }

  /* ── Periode-presets → {days, offsetDays} ── */
  function daysInMonth(y,m){ return new Date(y,m+1,0).getDate(); }
  function dayOfYear(d){ var s=new Date(d.getFullYear(),0,0); return Math.floor((d-s)/86400000); }
  function periodWindow(key){
    var now=new Date();
    var today = now.getDate();
    switch(key){
      case 'today':      return {days:1, offset:0};
      case 'yesterday':  return {days:1, offset:1};
      case '7d':         return {days:7, offset:0};
      case '30d':        return {days:30, offset:0};
      case 'this_month': return {days:today, offset:0};
      case 'last_month': { var pm=new Date(now.getFullYear(), now.getMonth()-1, 1); return {days:daysInMonth(pm.getFullYear(),pm.getMonth()), offset:today}; }
      case 'this_year':  return {days:dayOfYear(now), offset:0};
      case 'last_year':  { var ly=now.getFullYear()-1; var isLeap=(ly%4===0&&ly%100!==0)||ly%400===0; return {days:isLeap?366:365, offset:dayOfYear(now)}; }
      default:           return {days:30, offset:0};
    }
  }
  var PRESETS=[['today','Vandaag','an_p_today'],['yesterday','Gisteren','an_p_yesterday'],['7d','Laatste 7 dagen','an_p_7d'],['30d','Laatste 30 dagen','an_p_30d'],
    ['this_month','Deze maand','an_p_this_month'],['last_month','Vorige maand','an_p_last_month'],['this_year','Dit jaar','an_p_this_year'],['last_year','Vorig jaar','an_p_last_year'],['custom','Aangepast','an_p_custom']];
  var TABS=[['overzicht','Overzicht','an_t_overzicht'],['bezoekers','Bezoekers','an_t_bezoekers'],['bronnen','Bronnen','an_t_bronnen'],['paginas','Pagina\u2019s','an_t_paginas'],
    ['cta','CTA','an_t_cta'],['funnel','Funnel','an_t_funnel'],['fitcheck','Fit Check','an_t_fitcheck'],['calculator','Calculator','an_t_calculator'],
    ['formulieren','Formulieren','an_t_formulieren'],['techniek','Techniek','an_t_techniek'],['seo','SEO','an_t_seo'],['conversies','Conversies','an_t_conversies']];

  var state = { period:'30d', customStart:null, customEnd:null, tab:'overzicht', data:null, loading:false, err:null,
    gsc:{ fetchedStatus:false, loadingStatus:false, status:null, loadingData:false, data:null, loadingSites:false, sites:null } };

  /* ══════════════ SVG-grafieken ══════════════ */
  function svgLine(series, w, h){
    w=w||640; h=h||150; var pad=6;
    var max=Math.max.apply(null, series.map(function(p){return p.v;}).concat([1]));
    var n=series.length; if(n<2){ return '<svg viewBox="0 0 '+w+' '+h+'" style="width:100%;height:'+h+'px"></svg>'; }
    var pts=series.map(function(p,i){ var x=pad+i*((w-2*pad)/(n-1)); var y=h-pad-(p.v/max)*(h-2*pad); return [x,y]; });
    var line=pts.map(function(p,i){return (i?'L':'M')+p[0].toFixed(1)+' '+p[1].toFixed(1);}).join(' ');
    var area=line+' L'+pts[n-1][0].toFixed(1)+' '+(h-pad)+' L'+pts[0][0].toFixed(1)+' '+(h-pad)+' Z';
    return '<svg viewBox="0 0 '+w+' '+h+'" preserveAspectRatio="none" style="width:100%;height:'+h+'px;display:block">'+
      '<defs><linearGradient id="anLg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="'+C.orange+'" stop-opacity="0.16"/><stop offset="1" stop-color="'+C.orange+'" stop-opacity="0"/></linearGradient></defs>'+
      '<path d="'+area+'" fill="url(#anLg)"/>'+
      '<path d="'+line+'" fill="none" stroke="'+C.orange+'" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>'+
      '</svg>';
  }
  /* Nette datum-as helpers + gelabelde lijn-grafiek (assen: waarde links, datum onder) */
  function niceMax(m){ if(m<=0) return 1; var pow=Math.pow(10, Math.floor(Math.log10(m))); var f=m/pow, nf=f<=1?1:f<=1.5?1.5:f<=2?2:f<=3?3:f<=5?5:10; return nf*pow; }
  function fmtDay(iso){ if(!iso) return ''; var d=new Date(String(iso).slice(0,10)+'T00:00:00'); if(isNaN(d)) return String(iso); var mm=['jan','feb','mrt','apr','mei','jun','jul','aug','sep','okt','nov','dec']; return d.getDate()+' '+mm[d.getMonth()]; }
  function fmtDate2(d){ var mm=['jan','feb','mrt','apr','mei','jun','jul','aug','sep','okt','nov','dec']; return d.getDate()+' '+mm[d.getMonth()]+' '+d.getFullYear(); }
  function rangeDates(){ var win=state.period==='custom'?customWindow():periodWindow(state.period); if(!win) return null; var end=new Date(Date.now()-win.offset*86400000); var start=new Date(end.getTime()-(win.days-1)*86400000); var pend=new Date(start.getTime()-86400000); var pstart=new Date(pend.getTime()-(win.days-1)*86400000); return {start:start,end:end,pstart:pstart,pend:pend}; }
  function lineChart(series, h){
    h=h||168; var pad=8, w=640, n=series.length;
    if(n<2) return '<div style="color:'+C.muted+';font-size:12.5px;padding:16px 0">Nog te weinig data voor een grafiek.</div>';
    var max=niceMax(Math.max.apply(null, series.map(function(p){return p.v;}).concat([1])));
    var pts=series.map(function(p,i){ var x=pad+i*((w-2*pad)/(n-1)); var y=h-pad-(p.v/max)*(h-2*pad); return [x,y]; });
    var line=pts.map(function(p,i){return (i?'L':'M')+p[0].toFixed(1)+' '+p[1].toFixed(1);}).join(' ');
    var area=line+' L'+pts[n-1][0].toFixed(1)+' '+(h-pad)+' L'+pts[0][0].toFixed(1)+' '+(h-pad)+' Z';
    var grid=[0,0.5,1].map(function(f){ var y=(h-pad-f*(h-2*pad)).toFixed(1); return '<line x1="'+pad+'" y1="'+y+'" x2="'+(w-pad)+'" y2="'+y+'" stroke="'+C.grid+'" stroke-width="1" vector-effect="non-scaling-stroke"/>'; }).join('');
    var dots=series.map(function(p,i){ return '<circle cx="'+pts[i][0].toFixed(1)+'" cy="'+pts[i][1].toFixed(1)+'" r="9" fill="transparent"><title>'+esc(fmtDay(p.k))+': '+fmt(p.v)+'</title></circle>'; }).join('');
    var svg='<svg viewBox="0 0 '+w+' '+h+'" preserveAspectRatio="none" style="width:100%;height:'+h+'px;display:block">'+
      '<defs><linearGradient id="anLg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="'+C.orange+'" stop-opacity="0.16"/><stop offset="1" stop-color="'+C.orange+'" stop-opacity="0"/></linearGradient></defs>'+
      grid+'<path d="'+area+'" fill="url(#anLg)"/>'+
      '<path d="'+line+'" fill="none" stroke="'+C.orange+'" stroke-width="2" stroke-linejoin="round" stroke-linecap="round" vector-effect="non-scaling-stroke"/>'+dots+'</svg>';
    var yax='<div style="display:flex;flex-direction:column;justify-content:space-between;padding:'+pad+'px 0;width:42px;flex:none;text-align:right;font-size:10.5px;color:'+C.muted+'"><span>'+fmt(max)+'</span><span>'+fmt(max/2)+'</span><span>0</span></div>';
    var mid=Math.floor((n-1)/2);
    var xax='<div style="display:flex;gap:10px;margin-top:6px"><div style="width:42px;flex:none"></div><div style="flex:1;min-width:0;display:flex;justify-content:space-between;font-size:10.5px;color:'+C.muted+'"><span>'+esc(fmtDay(series[0].k))+'</span><span>'+esc(fmtDay(series[mid].k))+'</span><span>'+esc(fmtDay(series[n-1].k))+'</span></div></div>';
    return '<div><div style="display:flex;gap:10px;align-items:stretch">'+yax+'<div style="flex:1;min-width:0">'+svg+'</div></div>'+xax+'</div>';
  }
  function svgBars(series, h){
    h=h||150; var max=Math.max.apply(null, series.map(function(p){return p.v;}).concat([1]));
    var bars=series.map(function(p){ var ht=Math.max(Math.round((p.v/max)*(h-24)),2);
      return '<div title="'+esc(p.k)+': '+fmt(p.v)+'" style="flex:1;display:flex;flex-direction:column;justify-content:flex-end;align-items:center;gap:6px;min-width:0;">'+
        '<div style="width:100%;max-width:22px;height:'+ht+'px;background:'+C.orange+';border-radius:4px 4px 0 0;opacity:'+(p.v?0.92:0.18)+'"></div>'+
        '<span style="font-size:9px;color:'+C.muted+';white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:100%">'+esc(p.k)+'</span></div>';
    }).join('');
    return '<div style="display:flex;align-items:flex-end;gap:5px;height:'+h+'px">'+bars+'</div>';
  }
  function svgDonut(parts){
    var total=parts.reduce(function(a,p){return a+p.v;},0)||1;
    var palette=[C.orange,'#E8894F','#C98A1E','#2A9D5C','#7C8DB0','#B0645A','#9A9A9A'];
    var acc=0, segs=parts.map(function(p,i){ var frac=p.v/total; var a0=acc, a1=acc+frac; acc=a1;
      return {c:palette[i%palette.length], a0:a0, a1:a1, p:p, pct:Math.round(frac*100)}; });
    var R=54, r=34, cx=60, cy=60;
    function arc(a0,a1,rad){ var x0=cx+rad*Math.cos(2*Math.PI*a0-Math.PI/2), y0=cy+rad*Math.sin(2*Math.PI*a0-Math.PI/2);
      var x1=cx+rad*Math.cos(2*Math.PI*a1-Math.PI/2), y1=cy+rad*Math.sin(2*Math.PI*a1-Math.PI/2); return [x0,y0,x1,y1]; }
    var paths=segs.map(function(s){ if(s.a1-s.a0<=0) return '';
      var o=arc(s.a0,s.a1,R), inr=arc(s.a1,s.a0,r); var large=(s.a1-s.a0)>0.5?1:0;
      return '<path d="M'+o[0].toFixed(1)+' '+o[1].toFixed(1)+' A'+R+' '+R+' 0 '+large+' 1 '+o[2].toFixed(1)+' '+o[3].toFixed(1)+
        ' L'+inr[0].toFixed(1)+' '+inr[1].toFixed(1)+' A'+r+' '+r+' 0 '+large+' 0 '+inr[2].toFixed(1)+' '+inr[3].toFixed(1)+' Z" fill="'+s.c+'"/>';
    }).join('');
    var legend=segs.map(function(s){ return '<div style="display:flex;align-items:center;gap:8px;font-size:12px;color:'+C.ink+';padding:3px 0"><span style="width:10px;height:10px;border-radius:3px;background:'+s.c+';flex:none"></span><span style="flex:1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">'+esc(s.p.k)+'</span><b style="color:'+C.muted+';font-weight:600">'+s.pct+'%</b></div>'; }).join('');
    return '<div style="display:flex;gap:18px;align-items:center;flex-wrap:wrap"><svg viewBox="0 0 120 120" style="width:120px;height:120px;flex:none">'+paths+'</svg><div style="flex:1;min-width:140px">'+(legend||'<span style="color:'+C.muted+'">Geen data</span>')+'</div></div>';
  }
  function dist(parts){ if(!parts||parts.length<=4) return svgDonut(parts); return barRows(parts.slice().sort(function(a,b){return b.v-a.v;}), function(x){return x.k;}, function(x){return x.v;}); }
  function barRows(arr, keyFn, valFn, subFn){
    var max=Math.max.apply(null, arr.map(valFn).concat([1]));
    if(!arr.length) return '<div style="color:'+C.muted+';font-size:12.5px;padding:10px 0">Geen data in deze periode.</div>';
    return arr.map(function(it){ var v=valFn(it), pct=Math.round((v/max)*100);
      return '<div style="display:flex;align-items:center;gap:12px;margin-bottom:9px">'+
        '<div style="flex:0 0 200px;font-size:12.5px;font-weight:600;color:'+C.ink+';white-space:nowrap;overflow:hidden;text-overflow:ellipsis" title="'+esc(keyFn(it))+'">'+esc(keyFn(it))+'</div>'+
        '<div style="flex:1;height:8px;background:'+C.grid+';border-radius:4px;overflow:hidden"><div style="height:100%;width:'+pct+'%;background:'+C.orange+';border-radius:4px"></div></div>'+
        '<div style="flex:0 0 96px;text-align:right;font-size:12px;color:'+C.muted+'">'+fmt(v)+(subFn?' <span class="u-op7">'+subFn(it)+'</span>':'')+'</div></div>';
    }).join('');
  }
  function funnelChart(steps){
    var max=Math.max.apply(null, steps.map(function(s){return s.sessions;}).concat([1]));
    return '<div style="display:flex;flex-direction:column;gap:6px">'+steps.map(function(s,i){
      var pct=Math.round((s.sessions/max)*100); var prev=i>0?steps[i-1].sessions:s.sessions;
      var drop=(i>0 && prev>0)?Math.round((1-s.sessions/prev)*100):0;
      var bg=s.complete?C.good:C.orange;
      return '<div style="display:flex;align-items:center;gap:12px">'+
        '<div style="flex:0 0 92px;font-size:12px;color:'+C.ink+';font-weight:600">'+esc(s.step)+'</div>'+
        '<div style="flex:1;background:'+C.grid+';border-radius:6px;overflow:hidden;height:30px;position:relative">'+
          '<div style="height:100%;width:'+Math.max(pct,3)+'%;background:'+bg+';border-radius:6px;display:flex;align-items:center;justify-content:flex-end;padding:0 10px;color:#fff;font-size:11.5px;font-weight:700">'+fmt(s.sessions)+'</div></div>'+
        '<div style="flex:0 0 60px;text-align:right;font-size:11px;color:'+(drop>0?C.bad:C.muted)+'">'+(i>0?(drop>0?'\u2212'+drop+'%':'0%'):'')+'</div></div>';
    }).join('')+'</div>';
  }

  /* ══════════════ KPI-kaart met ± chip ══════════════ */
  function delta(cur, prev, invert){
    if(prev==null || prev===0){ return {txt:'—', dir:'flat'}; }
    var d=Math.round((cur-prev)/Math.abs(prev)*100);
    var good = invert ? d<0 : d>0;
    return {txt:(d>0?'+':'')+d+'%', dir: d===0?'flat':(good?'up':'down')};
  }
  function kpi(label, value, small, dCur, dPrev, invert){
    var chip='';
    if(dCur!=null){ var t=delta(dCur,dPrev,invert);
      var col = t.dir==='up'?C.good:(t.dir==='down'?C.bad:C.muted);
      var ar = t.dir==='up'?'\u25B2':(t.dir==='down'?'\u25BC':'\u2192');
      chip='<div style="margin-top:8px;font-size:11.5px;color:'+col+';display:flex;align-items:center;gap:5px"><span>'+ar+'</span> '+t.txt+' <span style="color:'+C.muted+'">vs. vorige</span></div>';
    }
    return '<div class="kpi-card"><div class="kpi-label">'+esc(label)+'</div>'+
      '<div class="kpi-value">'+value+(small?'<small>'+small+'</small>':'')+'</div>'+chip+'</div>';
  }

  function autoInsight(c,p){
    var metrics=[
      {k:'Bezoekers', cur:c.visitors, prev:p.visitors, invert:false},
      {k:'Conversie', cur:c.conversionRate, prev:p.conversionRate, invert:false},
      {k:'Bouncepercentage', cur:c.bounceRate, prev:p.bounceRate, invert:true},
      {k:'Sessies', cur:c.sessions, prev:p.sessions, invert:false},
      {k:'Engagement', cur:c.engagementRate, prev:p.engagementRate, invert:false}
    ];
    var best=null;
    metrics.forEach(function(m){ if(m.prev==null||m.prev===0) return; var d=Math.round((m.cur-m.prev)/Math.abs(m.prev)*100); var mag=Math.abs(d); if(!best||mag>best.mag) best={m:m,d:d,mag:mag}; });
    if(!best||best.mag<3) return '';
    var good = best.m.invert ? best.d<0 : best.d>0;
    var col = good?C.good:C.bad;
    var txt = best.m.k+' '+(best.d>0?'steeg':'daalde')+' '+(best.d>0?'+':'')+best.d+'% t.o.v. de vorige periode';
    var advies = good ? 'Uw sterkste beweging deze periode.' : 'Grootste aandachtspunt deze periode.';
    return '<div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap;padding:13px 18px;border-radius:12px;background:'+(good?'rgba(42,157,92,.08)':'rgba(214,69,69,.07)')+';border:1px solid '+(good?'rgba(42,157,92,.22)':'rgba(214,69,69,.22)')+';margin-bottom:18px"><span style="font-weight:700;color:'+col+';font-size:13px">'+esc(txt)+'</span><span style="color:'+C.muted+';font-size:12.5px">'+advies+'</span></div>';
  }
  function panel(title, sub, bodyHtml, actions){
    return '<div class="panel"><div class="panel-head"><div><h3>'+title+'</h3>'+(sub?'<div class="panel-sub">'+esc(sub)+'</div>':'')+'</div>'+(actions||'')+'</div><div class="panel-body">'+bodyHtml+'</div></div>';
  }

  /* ══════════════ VIEW-RENDERERS ══════════════ */
  var V = {};
  V.overzicht = function(d){
    var c=d.current, p=d.previous;
    var kpis='<div class="kpi-row">'+
      kpi(mtT('an_visitors'), fmt(c.visitors), null, c.visitors, p.visitors)+
      kpi(mtT('an_sessions'), fmt(c.sessions), null, c.sessions, p.sessions)+
      kpi(mtT('an_pageviews'), fmt(c.pageviews), null, c.pageviews, p.pageviews)+
      kpi(mtT('an_conversion'), String(c.conversionRate).replace('.',','), '%', c.conversionRate, p.conversionRate)+
      '</div>'+
      '<div class="kpi-row">'+
      kpi(mtT('an_bounce'), c.bounceRate, '%', c.bounceRate, p.bounceRate, true)+
      kpi(mtT('an_avgdur'), ms2dur(c.avgSessionMs), null, c.avgSessionMs, p.avgSessionMs)+
      kpi(mtT('an_pps'), String(c.pagesPerSession).replace('.',','), null, c.pagesPerSession, p.pagesPerSession)+
      kpi(mtT('an_conversions'), fmt(c.conversions), null, c.conversions, p.conversions)+
      '</div>';
    var trend=panel(mtT('an_pt_traffic'),mtT('an_pd_pvperday'), lineChart(d.byDay.map(function(x){return {k:x.day, v:x.pageviews};})));
    var don=panel(mtT('an_pt_sources'), null, dist(d.sources.map(function(s){return {k:s.key,v:s.sessions};})));
    var mini=panel(mtT('an_pt_keyconv'), mtT('an_pd_inperiod'),
      barRows(d.cta.slice(0,5), function(x){return x.key;}, function(x){return x.count;}));
    return autoInsight(c,p)+kpis+'<div class="grid-2">'+trend+don+'</div>'+mini;
  };
  V.bezoekers = function(d){
    var c=d.current,p=d.previous;
    var kpis='<div class="kpi-row">'+
      kpi(mtT('an_uniquevis'), fmt(c.visitors), null, c.visitors, p.visitors)+
      kpi(mtT('an_sessions'), fmt(c.sessions), null, c.sessions, p.sessions)+
      kpi(mtT('an_engagement'), c.engagementRate!=null?c.engagementRate:'\u2014', '%', c.engagementRate, p.engagementRate)+
      kpi(mtT('an_avgdur'), ms2dur(c.avgSessionMs), null, c.avgSessionMs, p.avgSessionMs)+
      kpi(mtT('an_pps'), String(c.pagesPerSession).replace('.',','), null, c.pagesPerSession, p.pagesPerSession)+
      '</div>';
    var trend=panel(mtT('an_pt_visperday'), null, svgBars(d.byDay.map(function(x){return {k:x.day.slice(5),v:x.sessions};}), 170));
    var dev=panel(mtT('an_pt_devices'), null, dist(d.devices.map(function(x){return {k:x.key,v:x.count};})));
    return kpis+'<div class="grid-2">'+trend+dev+'</div>'+
      '<div style="margin-top:16px;font-size:12px;color:'+C.muted+';line-height:1.6">Nieuw vs. terugkerend wordt bewust niet getoond: de meting is cookieloos met een dagelijks-roterende bezoeker-hash, waardoor terugkeer over dagen heen niet te volgen is. \u201cEngagement\u201d = sessies met &gt;1 pagina, &gt;10s of een conversie.</div>';
  };
  V.bronnen = function(d){
    var rows=d.sources.map(function(s){ return '<tr><td class="name">'+esc(s.key)+'</td><td>'+fmt(s.sessions)+'</td><td>'+fmt(s.conversions)+'</td><td>'+(s.sessions?(Math.round(s.conversions/s.sessions*1000)/10).toString().replace('.',','):'0')+'%</td></tr>'; }).join('');
    var tbl='<table class="tbl"><thead><tr><th scope="col">'+mtT('an_h_source')+'</th><th scope="col">'+mtT('an_sessions')+'</th><th scope="col">'+mtT('an_conversions')+'</th><th scope="col">'+mtT('an_h_convpct')+'</th></tr></thead><tbody>'+(rows||'<tr><td colspan="4" style="color:'+C.muted+'"'+'>'+mtT('an_nodata')+'</td></tr>')+'</tbody></table>';
    return '<div class="grid-2">'+panel(mtT('an_pt_channels'),mtT('an_pd_sesspersource'), dist(d.sources.map(function(s){return {k:s.key,v:s.sessions};})))+
      panel(mtT('an_pt_convpersource'), null, barRows(d.sources, function(x){return x.key;}, function(x){return x.conversions;}))+'</div>'+
      '<div class="u-mt-20">'+panel(mtT('an_pt_allsources'), null, tbl, exportBtn('bronnen'))+'</div>';
  };
  V.paginas = function(d){
    var rows=d.topPaths.map(function(p){ return '<tr><td class="name">'+esc(pathLabel(p.key))+'</td><td>'+fmt(p.count)+'</td><td>'+(p.avgDwellMs!=null?ms2dur(p.avgDwellMs):'—')+'</td><td>'+(p.avgScroll!=null?p.avgScroll+'%':'—')+'</td><td>'+(p.exitRate!=null?p.exitRate+'%':'—')+'</td><td>'+fmt(p.conversions||0)+(p.convRate?' <span style="color:'+C.muted+'">('+String(p.convRate).replace('.',',')+'%)</span>':'')+'</td></tr>'; }).join('');
    var tbl='<table class="tbl"><thead><tr><th scope="col">'+mtT('an_h_page')+'</th><th scope="col">'+mtT('an_h_views')+'</th><th scope="col">'+mtT('an_h_avgtime')+'</th><th scope="col">'+mtT('an_h_scroll')+'</th><th scope="col">'+mtT('an_h_exit')+'</th><th scope="col">'+mtT('an_conversions')+'</th></tr></thead><tbody>'+(rows||'<tr><td colspan="6" style="color:'+C.muted+'"'+'>'+mtT('an_nodata')+'</td></tr>')+'</tbody></table>';
    return panel(mtT('an_pt_mostvisited'),mtT('an_pd_pages'), tbl, exportBtn('paginas'));
  };
  V.cta = function(d){
    var rows=(d.cta||[]).map(function(c){ var views=c.views||0; var ctr=(c.ctr!=null)?String(c.ctr).replace('.',',')+'%':'\u2014'; return '<tr><td class="name">'+esc(c.key)+'</td><td>'+fmt(views)+'</td><td>'+fmt(c.count)+'</td><td>'+ctr+'</td></tr>'; }).join('');
    var tbl='<table class="tbl"><thead><tr><th scope="col">'+mtT('an_h_button')+'</th><th scope="col">'+mtT('an_h_views')+'</th><th scope="col">'+mtT('an_clicks')+'</th><th scope="col">'+mtT('an_ctr')+'</th></tr></thead><tbody>'+(rows||'<tr><td colspan="4" style="color:'+C.muted+'">Nog geen CTA-events.</td></tr>')+'</tbody></table>';
    return panel(mtT('an_pt_ctaperf'),mtT('an_pd_cta'), tbl, exportBtn('cta'))+
      '<div style="margin-top:10px;font-size:12px;color:'+C.muted+';line-height:1.6">CTR = kliks ÷ weergaven. Weergaven tellen wanneer een knop voor minstens de helft in beeld komt (é\u00e9n keer per bezoek).</div>';
  };
  V.funnel = function(d){
    var steps=[
      {step:'Bezoek', sessions:d.current.sessions},
      {step:'Tool-stap', sessions:(d.funnelCalculator[0]?d.funnelCalculator[0].sessions:0)+(d.funnelFitcheck[0]?d.funnelFitcheck[0].sessions:0)},
      {step:'Afgerond', sessions:(lastComplete(d.funnelCalculator)+lastComplete(d.funnelFitcheck))},
      {step:'Conversie', sessions:d.current.conversions, complete:true}
    ];
    return panel(mtT('an_pt_journey'),mtT('an_pd_visit2conv'), funnelChart(steps));
  };
  function lastComplete(f){ var x=f&&f.filter(function(s){return s.complete;})[0]; return x?x.sessions:0; }
  V.fitcheck = function(d){
    return panel(mtT('an_pt_fitfunnel'),mtT('an_pd_stepdone'), funnelChart(d.funnelFitcheck));
  };
  V.calculator = function(d){
    var reports=(d.counts&&d.counts.report_generated)||0, sent=(d.counts&&d.counts.report_sent)||0;
    var extra='<div class="kpi-row u-mt-20">'+
      kpi(mtT('an_reports_req'), fmt(reports))+
      kpi(mtT('an_emails_sent'), fmt(sent))+'</div>';
    return panel(mtT('an_pt_calcfunnel'),mtT('an_pd_stepdone'), funnelChart(d.funnelCalculator))+extra;
  };
  V.formulieren = function(d){
    var rows=(d.forms||[]).map(function(f){ var ab=f.abandon||0, st=f.start||0, sub=f.submit||0; var rate=st?Math.round(ab/st*100):0; var fill=(f.avgFillMs!=null)?ms2dur(f.avgFillMs):'\u2014'; var err=(f.errors||0)+(f.topErrorField?' <span style="color:'+C.muted+'">('+esc(f.topErrorField)+')</span>':'');
      return '<tr><td class="name">'+esc(f.form)+'</td><td>'+fmt(st)+'</td><td>'+fmt(sub)+'</td><td>'+fmt(ab)+'</td><td>'+rate+'%</td><td>'+fill+'</td><td>'+err+'</td></tr>'; }).join('');
    var tbl='<table class="tbl"><thead><tr><th scope="col">'+mtT('an_h_form')+'</th><th scope="col">'+mtT('an_h_started')+'</th><th scope="col">'+mtT('an_h_submitted')+'</th><th scope="col">'+mtT('an_h_abandoned')+'</th><th scope="col">'+mtT('an_h_dropout')+'</th><th scope="col">'+mtT('an_h_filltime')+'</th><th scope="col">'+mtT('an_h_errors')+'</th></tr></thead><tbody>'+(rows||'<tr><td colspan="7" style="color:'+C.muted+'">Nog geen formulier-events.</td></tr>')+'</tbody></table>';
    return panel(mtT('an_pt_forms'),mtT('an_pd_forms'), tbl, exportBtn('formulieren'));
  };
  V.techniek = function(d){
    var browsers=panel(mtT('an_pt_browsers'), null, dist(d.browsers.map(function(x){return {k:x.key,v:x.count};})));
    var devConvRows=(d.devices||[]).map(function(x){ var r=x.count?Math.round((x.conversions||0)/x.count*1000)/10:0; return '<tr><td class="name">'+esc(x.key)+'</td><td>'+fmt(x.count)+'</td><td>'+fmt(x.conversions||0)+'</td><td>'+String(r).replace('.',',')+'%</td></tr>'; }).join('');
    var devConv='<table class="tbl"><thead><tr><th scope="col">'+mtT('an_h_device')+'</th><th scope="col">'+mtT('an_sessions')+'</th><th scope="col">'+mtT('an_conversions')+'</th><th scope="col">'+mtT('an_h_convpct')+'</th></tr></thead><tbody>'+(devConvRows||'<tr><td colspan="4" style="color:'+C.muted+'"'+'>'+mtT('an_nodata')+'</td></tr>')+'</tbody></table>';
    var vitalsRows=(d.vitals||[]).map(function(v){ var col=v.goodPct>=75?C.good:(v.goodPct>=50?C.warn:C.bad);
      return '<tr><td class="name">'+esc(v.metric)+'</td><td>'+(v.metric==='CLS'?v.median:Math.round(v.median)+' ms')+'</td><td><span style="color:'+col+';font-weight:600">'+v.goodPct+'% goed</span></td><td>'+fmt(v.samples)+'</td></tr>'; }).join('');
    var vt='<table class="tbl"><thead><tr><th scope="col">'+mtT('an_h_metric')+'</th><th scope="col">'+mtT('an_h_median')+'</th><th scope="col">'+mtT('an_h_quality')+'</th><th scope="col">'+mtT('an_h_measurements')+'</th></tr></thead><tbody>'+(vitalsRows||'<tr><td colspan="4" style="color:'+C.muted+'">Nog geen prestatie-metingen.</td></tr>')+'</tbody></table>';
    return '<div class="grid-2">'+browsers+panel(mtT('an_pt_devices'), null, dist(d.devices.map(function(x){return {k:x.key,v:x.count};})))+'</div>'+
      '<div class="u-mt-20">'+panel(mtT('an_pt_convperdevice'), mtT('an_pd_devices'), devConv)+'</div>'+
      '<div class="u-mt-20">'+panel(mtT('an_pt_webvitals'),mtT('an_pd_vitals'), vt)+'</div>'+
      '<div class="u-mt-20">'+panel(mtT('an_pt_heatmap'),mtT('an_pd_heatmap'),
        '<div style="text-align:center;padding:24px 16px;color:'+C.muted+'"><div style="font-size:13px;margin-bottom:10px">Architectuur voorzien — nog niet gekoppeld.</div><button class="btn btn-ghost" id="an-heatmap-connect"><i class="ti ti-flame"></i> Heatmap-tool koppelen</button><div style="font-size:11.5px;margin-top:10px;max-width:440px;margin-left:auto;margin-right:auto">Let op: Clarity/Hotjar plaatsen wél cookies → dit vergt een consent-laag. Daarom bewust als los, later-activeerbaar slot.</div></div>')+'</div>';
  };
  V.seo = function(d){
    var langs=panel(mtT('an_pt_langs'), null, dist(d.langs.map(function(x){return {k:(x.key||'?').toUpperCase(),v:x.count};})));
    var countries=panel(mtT('an_pt_countries'), mtT('an_pd_countries'), barRows(d.countries, function(x){return x.key||'?';}, function(x){return x.count;}, function(x){return x.count&&x.conversions?Math.round(x.conversions/x.count*100)+'% conv':'';}));
    var g=state.gsc, actions='';
    if(g.status && g.status.connected && g.status.siteUrl){
      actions='<div class="panel-head-actions"><button class="btn btn-ghost a-btn-t12" id="an-gsc-disconnect"><i class="ti ti-plug-off"></i> '+mtT('an_gsc_disconnect')+'</button></div>';
    }
    var sub=(g.status && g.status.siteUrl) ? ('Organische zoekprestaties \u00b7 '+esc(g.status.siteUrl)) : mtT('an_gsc_sub');
    var gsc=panel(mtT('an_gsc_title'), sub, gscBody(), actions);
    return '<div class="grid-2">'+langs+countries+'</div><div class="u-mt-20">'+gsc+'</div>';
  };
  /* GSC-paneel — rendert op basis van state.gsc (5 staten). */
  function gscBody(){
    var g=state.gsc;
    var box=function(inner){ return '<div style="text-align:center;padding:26px 16px;color:'+C.muted+'">'+inner+'</div>'; };
    if(!g.fetchedStatus || g.loadingStatus) return '<div class="an-msg">'+mtT('an_gsc_checking')+'</div>';
    var s=g.status||{};
    if(s.configured===false){
      return box('<div style="font-size:13px;margin-bottom:8px;color:'+C.ink+'"'+'>'+mtT('an_gsc_notset')+'</div>'+
        '<div style="font-size:11.5px;max-width:470px;margin:0 auto;line-height:1.6">De koppeling wordt \u00e9\u00e9nmalig door de beheerder geactiveerd (Google Cloud-credentials). Zodra dat gebeurd is, koppelt u hier met \u00e9\u00e9n klik en verschijnen de organische zoekprestaties.</div>');
    }
    if(!s.connected){
      return box('<div style="font-size:13px;margin-bottom:10px;color:'+C.ink+'"'+'>'+mtT('an_gsc_notlinked')+'</div>'+
        '<button class="btn" id="an-gsc-connect"><i class="ti ti-plug"></i> '+mtT('an_gsc_connect')+'</button>'+
        '<div style="font-size:11.5px;margin-top:10px;max-width:440px;margin-left:auto;margin-right:auto">U logt \u00e9\u00e9nmalig in met Google. Daarna verschijnen hier de organische zoekwoorden, impressies, gemiddelde positie en klikken.</div>');
    }
    if(!s.siteUrl){
      if(g.loadingSites) return '<div class="an-msg">'+mtT('an_gsc_loadingsites')+'</div>';
      var opts=(g.sites||[]).map(function(si){ return '<option value="'+esc(si.url)+'">'+esc(si.url)+'</option>'; }).join('');
      if(!opts) return box('<div style="font-size:13px;color:'+C.ink+'"'+'>'+mtT('an_gsc_noprop')+'</div><div style="font-size:11.5px;margin-top:8px"'+'>'+mtT('an_gsc_noprop_desc')+'</div>');
      return box('<div style="font-size:13px;margin-bottom:10px;color:'+C.ink+'"'+'>'+mtT('an_gsc_pickprop')+'</div>'+
        '<select id="an-gsc-pick" class="an-period" style="min-width:280px"><option value="">\u2014 Kies property \u2014</option>'+opts+'</select>');
    }
    if(g.loadingData || !g.data) return '<div class="an-msg">'+mtT('an_gsc_loadingdata')+'</div>';
    var data=g.data;
    if(data.error){
      return box('<div style="font-size:13px;margin-bottom:10px;color:'+C.bad+'"'+'>'+mtT('an_gsc_loadfail')+'</div>'+
        '<button class="btn btn-ghost" id="an-gsc-retry"><i class="ti ti-refresh"></i> '+mtT('an_gsc_retry')+'</button>'+
        '<div style="font-size:11px;margin-top:8px;opacity:.7">'+esc(String(data.error).slice(0,140))+'</div>');
    }
    var t=data.totals||{clicks:0,impressions:0,ctr:0,position:0};
    var kpis='<div class="kpi-row">'+
      kpi(mtT('an_clicks'), fmt(t.clicks))+
      kpi(mtT('an_impressions'), fmt(t.impressions))+
      kpi(mtT('an_ctr'), (t.ctr!=null?(t.ctr*100).toFixed(1).replace('.',','):'0'), '%')+
      kpi(mtT('an_avgpos'), (t.position!=null?t.position.toFixed(1).replace('.',','):'\u2014'))+'</div>';
    var series=(data.byDate||[]).map(function(r){return {k:r.date, v:r.clicks};});
    var chart=series.length>1 ? '<div style="margin:8px 0 2px;font-size:12px;color:'+C.muted+'"'+'>'+mtT('an_clicks_perday')+'</div>'+lineChart(series) : '';
    var qRows=(data.queries||[]).slice(0,15).map(function(q){ return '<tr><td class="name">'+esc(q.key)+'</td><td>'+fmt(q.clicks)+'</td><td>'+fmt(q.impressions)+'</td><td>'+(q.ctr!=null?(q.ctr*100).toFixed(1).replace('.',',')+'%':'\u2014')+'</td><td>'+(q.position!=null?q.position.toFixed(1).replace('.',','):'\u2014')+'</td></tr>'; }).join('');
    var qTbl='<table class="tbl"><thead><tr><th scope="col">'+mtT('an_h_keyword')+'</th><th scope="col">'+mtT('an_clicks')+'</th><th scope="col">'+mtT('an_impressions')+'</th><th scope="col">'+mtT('an_ctr')+'</th><th scope="col">'+mtT('an_h_position')+'</th></tr></thead><tbody>'+(qRows||'<tr><td colspan="5" style="color:'+C.muted+'"'+'>'+mtT('an_gsc_nodata')+'</td></tr>')+'</tbody></table>';
    var pRows=(data.pages||[]).slice(0,10).map(function(p){ return '<tr><td class="name">'+esc(pathLabel(p.key))+'</td><td>'+fmt(p.clicks)+'</td><td>'+fmt(p.impressions)+'</td><td>'+(p.position!=null?p.position.toFixed(1).replace('.',','):'\u2014')+'</td></tr>'; }).join('');
    var pTbl='<table class="tbl"><thead><tr><th scope="col">'+mtT('an_h_landing')+'</th><th scope="col">'+mtT('an_clicks')+'</th><th scope="col">'+mtT('an_impressions')+'</th><th scope="col">'+mtT('an_h_position')+'</th></tr></thead><tbody>'+(pRows||'<tr><td colspan="4" style="color:'+C.muted+'"'+'>'+mtT('an_nodata')+'</td></tr>')+'</tbody></table>';
    return kpis+chart+'<div class="u-mt-16">'+qTbl+'</div>'+
      '<div class="u-mt-18"><div class="panel-sub u-mb-6">Belangrijkste landingspagina\u2019s</div>'+pTbl+'</div>';
  }
  V.conversies = function(d){
    var c=d.current,p=d.previous, cn=d.counts||{};
    var kpis='<div class="kpi-row">'+
      kpi(mtT('an_totalconv'), fmt(c.conversions), null, c.conversions, p.conversions)+
      kpi(mtT('an_convrate'), String(c.conversionRate).replace('.',','), '%', c.conversionRate, p.conversionRate)+
      kpi(mtT('an_sessions'), fmt(c.sessions), null, c.sessions, p.sessions)+
      kpi(mtT('an_visitors'), fmt(c.visitors), null, c.visitors, p.visitors)+'</div>';
    var breakdown=[
      {k:mtT('an_contactreq'), v:cn.contact_sent||0},
      {k:mtT('an_demos'), v:cn.demo_requested||0},
      {k:mtT('an_fitdone'), v:cn.fitcheck_completed||0},
      {k:mtT('an_calcdone'), v:cn.calculator_completed||0},
      {k:mtT('an_reports_sent2'), v:cn.report_sent||0}
    ];
    var bd=panel(mtT('an_pt_convpertype'),mtT('an_pd_inperiod'), barRows(breakdown, function(x){return x.k;}, function(x){return x.v;}));
    var note='<div style="color:'+C.muted+';font-size:12.5px;line-height:1.6">Elke conversie telt één keer: contactaanvraag, demo/afspraak, afgeronde Fit Check, afgeronde Calculator of verzonden rapport.</div>';
    return kpis+bd+'<div class="u-mt-20">'+panel(mtT('an_pt_whatcounts'), null, note)+'</div>';
  };

  function exportBtn(kind){
    return '<div class="panel-head-actions"><button class="btn btn-ghost a-btn-t12" data-an-export="'+kind+'"><i class="ti ti-download"></i> CSV</button></div>';
  }

  /* ══════════════ SHELL + FETCH ══════════════ */
  function periodLabel(){
    if(state.period==='custom' && state.customStart && state.customEnd) return state.customStart+' → '+state.customEnd;
    var f=PRESETS.filter(function(x){return x[0]===state.period;})[0]; return f?f[1]:'Laatste 30 dagen';
  }
  function buildShell(){
    var tabs=TABS.map(function(t){ return '<button class="an-tab'+(t[0]===state.tab?' is-on':'')+'" data-an-tab="'+t[0]+'">'+esc(mtT(t[2]))+'</button>'; }).join('');
    var opts=PRESETS.map(function(p){ return '<option value="'+p[0]+'"'+(p[0]===state.period?' selected':'')+'>'+esc(mtT(p[2]))+'</option>'; }).join('');
    var custom = state.period==='custom'
      ? '<span class="an-custom"><input type="date" id="an-cs" value="'+(state.customStart||'')+'"><span style="color:'+C.muted+'">→</span><input type="date" id="an-ce" value="'+(state.customEnd||'')+'"><button class="btn btn-ghost a-btn-t12" id="an-apply">Toon</button></span>'
      : '';
    var rd=rangeDates();
    var rangeLine = rd ? '<div style="font-size:12px;color:'+C.muted+';margin-top:6px">'+fmtDate2(rd.start)+' – '+fmtDate2(rd.end)+' <span class="u-op7">· vs '+fmtDate2(rd.pstart)+' – '+fmtDate2(rd.pend)+'</span></div>' : '';
    var freshLine = '<div id="an-fresh" style="font-size:11px;color:'+C.muted+';margin-top:3px">'+(state.loadedAt?'Laatst bijgewerkt: '+esc(state.loadedAt):'')+'</div>';
    return ''+
      '<div class="page-head">'+
        '<div><span class="eyebrow">Analyse</span><h1>Hoe presteert de <em>site?</em></h1>'+
        '<p>Privacy-vriendelijke meting — geen cookies, geen IP, geen fingerprint.</p>'+rangeLine+freshLine+'</div>'+
        '<div class="page-head-actions"><select id="an-period" class="an-period">'+opts+'</select>'+custom+
        '<button class="btn btn-ghost a-btn-t12" id="an-print"><i class="ti ti-file-type-pdf"></i> PDF</button>'+
        '<button class="btn btn-ghost a-btn-t12" id="an-xls"><i class="ti ti-file-spreadsheet"></i> Excel</button></div>'+
      '</div>'+
      '<div class="an-tabs">'+tabs+'</div>'+
      '<div id="an-body" class="an-body"></div>';
  }
  function renderBody(){
    var host=document.getElementById('an-body'); if(!host) return;
    if(state.loading){ host.innerHTML='<div class="an-msg">'+mtT('an_loading')+'</div>'; return; }
    if(state.err){ host.innerHTML='<div class="an-msg"><b>'+esc(state.err)+'</b><br><span class="a-t125">Controleer of de meting actief is en of migraties 0018–0021 gedraaid zijn.</span></div>'; return; }
    var d=state.data; if(!d){ host.innerHTML='<div class="an-msg">'+mtT('an_nodata')+'</div>'; return; }
    if(!d.current || (!d.current.pageviews && !d.current.sessions && state.tab==='overzicht')){
      // toon toch de KPI's (0), maar met hint
    }
    var fn=V[state.tab]||V.overzicht;
    try { host.innerHTML=fn(d); } catch(e){ host.innerHTML='<div class="an-msg">'+mtT('an_renderfault')+esc(e.message)+'</div>'; }
    // export-knoppen
    host.querySelectorAll('[data-an-export]').forEach(function(b){ b.addEventListener('click', function(){ doExport(b.getAttribute('data-an-export')); }); });
    // SEO-tab: Search Console laden + knoppen koppelen
    if(state.tab==='seo'){
      var g=state.gsc;
      if(!g.fetchedStatus && !g.loadingStatus) fetchGscStatus();
      else if(g.status && g.status.connected && g.status.siteUrl && !g.data && !g.loadingData && !g.loadingSites) fetchGscData();
      attachSeo(host);
    }
  }
  function fetchData(){
    state.gsc.data=null;
    var sess; try{ sess=JSON.parse(sessionStorage.getItem('admin.session')||'{}'); }catch(e){ sess={}; }
    if(!sess || !sess.token){ state.err=mtT('an_login'); renderBody(); return; }
    var win = state.period==='custom' ? customWindow() : periodWindow(state.period);
    if(!win){ state.err=mtT('an_pickperiod'); renderBody(); return; }
    state.loading=true; state.err=null; renderBody();
    fetch('/api/admin-metrics',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({token:sess.token, days:win.days, offsetDays:win.offset})})
      .then(function(r){ return r.ok?r.json():r.json().catch(function(){return null;}); })
      .then(function(d){
        state.loading=false;
        if(!d || !d.ok){ state.err=(d&&d.error==='db_not_configured')?mtT('an_notconfigured'):(d&&d.error==='unauthorized'?mtT('an_noaccess'):mtT('an_notactive')); renderBody(); return; }
        state.loadedAt=new Date().toLocaleTimeString('nl-BE',{hour:'2-digit',minute:'2-digit'}); var fe=document.getElementById('an-fresh'); if(fe) fe.textContent='Laatst bijgewerkt: '+state.loadedAt;
        state.data=d; renderBody();
      })
      .catch(function(){ state.loading=false; state.err=mtT('an_loadfail'); renderBody(); });
  }
  function customWindow(){
    if(!state.customStart || !state.customEnd) return null;
    var s=new Date(state.customStart), e=new Date(state.customEnd);
    if(isNaN(s)||isNaN(e)||e<s) return null;
    var days=Math.round((e-s)/86400000)+1;
    var offset=Math.max(0, Math.round((Date.now()-e.getTime())/86400000));
    return {days:days, offset:offset};
  }
  function doExport(kind){
    var d=state.data; if(!d) return;
    var rows=[];
    if(kind==='bronnen') rows=d.sources.map(function(s){return {bron:s.key,sessies:s.sessions,conversies:s.conversions};});
    else if(kind==='paginas') rows=d.topPaths.map(function(p){return {pagina:pathLabel(p.key),weergaven:p.count,gem_tijd_ms:p.avgDwellMs||'',scroll_pct:p.avgScroll||''};});
    else if(kind==='cta') rows=d.cta.map(function(c){return {cta:c.key,kliks:c.count};});
    else if(kind==='formulieren') rows=(d.forms||[]).map(function(f){return {formulier:f.form,gestart:f.start,verzonden:f.submit,verlaten:f.abandon};});
    if(window.exportCsv) window.exportCsv(rows, 'analyse-'+kind+'.csv');
    else fallbackCsv(rows, 'analyse-'+kind+'.csv');
  }
  function fallbackCsv(rows, name){
    if(!rows.length) return;
    var head=Object.keys(rows[0]); var csv=head.join(',')+'\n'+rows.map(function(r){return head.map(function(h){return '"'+String(r[h]==null?'':r[h]).replace(/"/g,'""')+'"';}).join(',');}).join('\n');
    var a=document.createElement('a'); a.href='data:text/csv;charset=utf-8,'+encodeURIComponent(csv); a.download=name; a.click();
  }
  /* Excel-export van de huidige view (HTML-tabel .xls — opent in Excel, geen dependency) */
  /* #15 PDF: render alle tabs tijdelijk in de body zodat print het hele rapport pakt. */
  function printAll(){
    var host=document.getElementById('an-body'); if(!host || !state.data){ window.print(); return; }
    var saved=host.innerHTML;
    var all=TABS.map(function(t){ var fn=V[t[0]]; var body=''; try{ body=fn?fn(state.data):''; }catch(e){ body=''; }
      return '<section style="break-inside:avoid;margin-bottom:26px"><h2 style="font:700 15px var(--a-serif,Georgia,serif);margin:0 0 12px;color:'+C.ink+'">'+esc(t[1])+'</h2>'+body+'</section>'; }).join('');
    host.innerHTML=all;
    var restore=function(){ host.innerHTML=saved; window.removeEventListener('afterprint',restore); };
    window.addEventListener('afterprint',restore);
    window.print();
  }
  function exportExcel(){
    var d=state.data; if(!d) return;
    var rows=datasetFor(state.tab, d);
    if(!rows.length){ return; }
    var head=Object.keys(rows[0]);
    var thead='<tr>'+head.map(function(h){return '<th scope="col">'+esc(h)+'</th>';}).join('')+'</tr>';
    var tbody=rows.map(function(r){return '<tr>'+head.map(function(h){return '<td>'+esc(r[h]==null?'':r[h])+'</td>';}).join('')+'</tr>';}).join('');
    var html='<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel"><head><meta charset="utf-8"></head><body><table border="1">'+thead+tbody+'</table></body></html>';
    var a=document.createElement('a'); a.href='data:application/vnd.ms-excel;charset=utf-8,'+encodeURIComponent(html); a.download='analyse-'+state.tab+'.xls'; a.click();
  }
  function datasetFor(tab, d){
    if(tab==='bronnen') return d.sources.map(function(s){return {Bron:s.key,Sessies:s.sessions,Conversies:s.conversions};});
    if(tab==='paginas') return d.topPaths.map(function(p){return {Pagina:pathLabel(p.key),Weergaven:p.count,Gem_tijd:p.avgDwellMs?ms2dur(p.avgDwellMs):'',Scroll_pct:p.avgScroll||''};});
    if(tab==='cta') return d.cta.map(function(c){return {CTA:c.key,Kliks:c.count};});
    if(tab==='formulieren') return (d.forms||[]).map(function(f){return {Formulier:f.form,Gestart:f.start,Verzonden:f.submit,Verlaten:f.abandon};});
    if(tab==='techniek') return (d.vitals||[]).map(function(v){return {Metric:v.metric,Mediaan:v.median,Goed_pct:v.goodPct,Metingen:v.samples};});
    if(tab==='fitcheck') return d.funnelFitcheck.map(function(s){return {Stap:s.step,Sessies:s.sessions};});
    if(tab==='calculator') return d.funnelCalculator.map(function(s){return {Stap:s.step,Sessies:s.sessions};});
    if(tab==='seo') return ((state.gsc.data&&state.gsc.data.queries)||[]).map(function(q){return {Zoekwoord:q.key,Klikken:q.clicks,Impressies:q.impressions,CTR_pct:(q.ctr!=null?(q.ctr*100).toFixed(1):''),Positie:(q.position!=null?q.position.toFixed(1):'')};});
    // default: KPI-overzicht
    var c=d.current; return [{Metric:'Bezoekers',Waarde:c.visitors},{Metric:'Sessies',Waarde:c.sessions},{Metric:'Paginaweergaven',Waarde:c.pageviews},{Metric:'Bounce_pct',Waarde:c.bounceRate},{Metric:'Conversie_pct',Waarde:c.conversionRate},{Metric:'Conversies',Waarde:c.conversions}];
  }

  /* ══════════════ GSC (Search Console) fetch + handlers ══════════════ */
  function gscToken(){ var s; try{ s=JSON.parse(sessionStorage.getItem('admin.session')||'{}'); }catch(e){ s={}; } return s&&s.token; }
  function gscFetch(payload){ var tok=gscToken(); if(!tok) return Promise.reject('noauth'); return fetch('/api/admin-gsc',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(Object.assign({token:tok},payload))}).then(function(r){ return r.json().catch(function(){return null;}); }); }
  function renderBodyIfSeo(){ if(state.tab==='seo') renderBody(); }
  function fetchGscStatus(){
    var g=state.gsc; if(g.loadingStatus) return;
    g.loadingStatus=true; g.fetchedStatus=true; renderBodyIfSeo();
    gscFetch({action:'status'}).then(function(d){
      g.loadingStatus=false; g.status=d||{configured:false,connected:false};
      if(g.status.connected && g.status.siteUrl) fetchGscData();
      else if(g.status.connected && !g.status.siteUrl) fetchGscSites();
      else renderBodyIfSeo();
    }).catch(function(){ g.loadingStatus=false; g.status={configured:true,connected:false}; renderBodyIfSeo(); });
  }
  function fetchGscData(){
    var g=state.gsc; if(g.loadingData) return;
    g.loadingData=true; g.data=null; renderBodyIfSeo();
    var win=state.period==='custom' ? customWindow() : periodWindow(state.period); win=win||{days:28,offset:0};
    gscFetch({action:'data', days:win.days, offsetDays:win.offset}).then(function(d){
      g.loadingData=false;
      if(d && d.needsSite){ if(g.status) g.status.siteUrl=null; fetchGscSites(); return; }
      g.data=d||{error:'geen antwoord'}; renderBodyIfSeo();
    }).catch(function(){ g.loadingData=false; g.data={error:'netwerkfout'}; renderBodyIfSeo(); });
  }
  function fetchGscSites(){
    var g=state.gsc; if(g.loadingSites) return;
    g.loadingSites=true; renderBodyIfSeo();
    gscFetch({action:'sites'}).then(function(d){
      g.loadingSites=false; g.sites=(d&&d.sites)||[];
      if(d && d.siteUrl){ if(g.status) g.status.siteUrl=d.siteUrl; fetchGscData(); return; }
      renderBodyIfSeo();
    }).catch(function(){ g.loadingSites=false; g.sites=[]; renderBodyIfSeo(); });
  }
  function attachSeo(host){
    var g=state.gsc;
    var cb=host.querySelector('#an-gsc-connect');
    if(cb) cb.addEventListener('click', function(){ cb.disabled=true; cb.innerHTML='Doorsturen\u2026'; gscFetch({action:'auth-url'}).then(function(d){ if(d&&d.url){ window.location.href=d.url; } else { cb.disabled=false; cb.innerHTML='<i class="ti ti-plug"></i> Search Console koppelen'; if(window.showToast) window.showToast(mtT('toast_gsc_unavailable'),'warn'); } }).catch(function(){ cb.disabled=false; cb.innerHTML='<i class="ti ti-plug"></i> Search Console koppelen'; }); });
    var db=host.querySelector('#an-gsc-disconnect');
    if(db) db.addEventListener('click', function(){ if(!confirm(mtT('toast_gsc_disconnect_confirm'))) return; gscFetch({action:'disconnect'}).then(function(){ state.gsc={fetchedStatus:false,loadingStatus:false,status:null,loadingData:false,data:null,loadingSites:false,sites:null}; if(window.showToast) window.showToast(mtT('toast_gsc_disconnected'),'ok'); fetchGscStatus(); }); });
    var pk=host.querySelector('#an-gsc-pick');
    if(pk) pk.addEventListener('change', function(){ var url=pk.value; if(!url) return; gscFetch({action:'select-site', siteUrl:url}).then(function(){ if(g.status) g.status.siteUrl=url; fetchGscData(); }); });
    var rt=host.querySelector('#an-gsc-retry');
    if(rt) rt.addEventListener('click', function(){ fetchGscData(); });
  }

  function wire(){
    var root=document.getElementById('view-analyse'); if(!root) return;
    root.innerHTML=buildShell();
    attach();
    if(state.period!=='custom') fetchData(); else renderBody();
  }
  function attach(){
    var root=document.getElementById('view-analyse'); if(!root) return;
    // sub-tabs
    root.querySelectorAll('[data-an-tab]').forEach(function(b){ b.addEventListener('click', function(){ state.tab=b.getAttribute('data-an-tab'); root.querySelectorAll('[data-an-tab]').forEach(function(x){x.classList.toggle('is-on',x===b);}); renderBody(); }); });
    // periode-select
    var psel=document.getElementById('an-period');
    if(psel) psel.addEventListener('change', function(){ state.period=psel.value; root.innerHTML=buildShell(); attach(); if(state.period!=='custom') fetchData(); else renderBody(); });
    // custom bereik
    var ap=document.getElementById('an-apply'); if(ap) ap.addEventListener('click', function(){ var cs=document.getElementById('an-cs'), ce=document.getElementById('an-ce'); state.customStart=cs?cs.value:null; state.customEnd=ce?ce.value:null; fetchData(); });
    // pdf
    var pr=document.getElementById('an-print'); if(pr) pr.addEventListener('click', function(){ printAll(); });
    // excel (huidige view-dataset)
    var xl=document.getElementById('an-xls'); if(xl) xl.addEventListener('click', function(){ exportExcel(); });
    renderBody();
  }

  window.init_analyse = function(){
    /* OAuth-terugkeer (#analyse?gsc=connected|denied|error|badstate) */
    var m=(location.hash||'').match(/[?&]gsc=([a-z]+)/i);
    if(m){
      var st=m[1].toLowerCase();
      var msg = st==='connected' ? mtT('an_gsc_linked') : (st==='denied' ? mtT('an_gsc_cancelled') : 'Koppeling mislukt \u2014 probeer opnieuw.');
      if(window.showToast) window.showToast(msg, st==='connected'?'ok':'warn');
      try{ history.replaceState(null,'','#analyse'); }catch(e){}
      state.tab='seo';
      if(st==='connected') state.gsc={fetchedStatus:false,loadingStatus:false,status:null,loadingData:false,data:null,loadingSites:false,sites:null};
    }
    wire();
  };
})();
