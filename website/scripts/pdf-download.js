/* ═══════════════════════════════════════════════════════════════════
   pdf-download.js — echte client-side PDF-download (Blob + download-anchor).
   ───────────────────────────────────────────────────────────────────
   Waarom: de "Download PDF"-CTA in Calculator + Fit Check opende vroeger
   het rapport in een NIEUW TABBLAD met ?print=1, wat window.print() (de
   print/opslaan-dialoog) triggerde. Dat is hier volledig vervangen.

   Deze helper:
     • rendert het bestaande rapport-template in een VERBORGEN, offscreen
       <iframe> (géén window.open, géén nieuw tabblad, géén print-param);
     • zet het via html2pdf.js (html2canvas + jsPDF) om naar een A4-PDF-Blob;
     • start een ECHTE download via een tijdelijke <a download>-anchor;
     • ruimt de object-URL (revokeObjectURL) + iframe weer op.

   Werkt op desktop, tablet én mobile. Gebruikt NOOIT window.print(),
   iframe.print(), een printdialoog of window.open().

   API:  window.montisoroDownloadReport({
           url,               // rapport-template (ZONDER ?print=1)
           filename,          // bv. 'montisoro-calculator-rapport.pdf'
           pagebreakBefore,   // optioneel CSS-selector(s) voor pagina-einden
           onstart, ondone, onerror   // optionele callbacks
         }) → Promise
═══════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var HTML2PDF_SRC = 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.2/html2pdf.bundle.min.js';
  var _libPromise = null;

  function loadHtml2Pdf() {
    if (window.html2pdf) return Promise.resolve(window.html2pdf);
    if (_libPromise) return _libPromise;
    _libPromise = new Promise(function (resolve, reject) {
      var s = document.createElement('script');
      s.src = HTML2PDF_SRC;
      s.async = true;
      s.onload = function () { window.html2pdf ? resolve(window.html2pdf) : reject(new Error('html2pdf niet beschikbaar')); };
      s.onerror = function () { reject(new Error('kon html2pdf niet laden')); };
      document.head.appendChild(s);
    });
    return _libPromise;
  }

  /* Verborgen, offscreen iframe met vaste A4-breedte (210mm ≈ 794px). */
  function makeFrame() {
    var f = document.createElement('iframe');
    f.setAttribute('aria-hidden', 'true');
    f.setAttribute('tabindex', '-1');
    f.style.cssText = 'position:fixed;left:-10000px;top:0;width:820px;height:1160px;border:0;opacity:0;pointer-events:none;';
    document.body.appendChild(f);
    return f;
  }

  function whenFrameReady(frame, url) {
    return new Promise(function (resolve, reject) {
      var done = false;
      var to = setTimeout(function () { if (!done) { done = true; reject(new Error('rapport laadde niet op tijd')); } }, 15000);
      frame.addEventListener('load', function () {
        if (done) return;
        var doc = frame.contentDocument;
        var win = frame.contentWindow;
        if (!doc || !win) { done = true; clearTimeout(to); reject(new Error('geen toegang tot rapport')); return; }
        // verberg alle scherm-only chrome (printbalk e.d.) zodat het niet in de PDF komt
        try {
          var st = doc.createElement('style');
          st.textContent = '.noprint,.printbar,#pbPrint,#fctabtn{display:none !important;}';
          doc.head.appendChild(st);
        } catch (e) {}
        var fontsReady = (doc.fonts && doc.fonts.ready) ? doc.fonts.ready : Promise.resolve();
        Promise.resolve(fontsReady).then(function () {
          // extra beat zodat afbeeldingen + layout zeker klaar zijn
          setTimeout(function () { if (!done) { done = true; clearTimeout(to); resolve(doc); } }, 500);
        });
      });
      frame.src = url;
    });
  }

  window.montisoroDownloadReport = function (opts) {
    opts = opts || {};
    var url = opts.url;
    var filename = opts.filename || 'montisoro-rapport.pdf';
    if (!url) return Promise.reject(new Error('geen rapport-url'));
    if (typeof opts.onstart === 'function') { try { opts.onstart(); } catch (e) {} }

    var frame = null, blobUrl = null;
    function cleanup() {
      if (frame && frame.parentNode) frame.parentNode.removeChild(frame);
      if (blobUrl) { setTimeout(function () { try { URL.revokeObjectURL(blobUrl); } catch (e) {} }, 4000); }
    }

    return loadHtml2Pdf().then(function (html2pdf) {
      frame = makeFrame();
      return whenFrameReady(frame, url).then(function (doc) {
        var source = (opts.selector && doc.querySelector(opts.selector)) || doc.body;
        var pb = { mode: ['css', 'legacy'] };
        if (opts.pagebreakBefore) pb.before = opts.pagebreakBefore;
        var worker = html2pdf().set({
          margin: 0,
          filename: filename,
          image: { type: 'jpeg', quality: 0.98 },
          html2canvas: { scale: 2, useCORS: true, backgroundColor: '#ffffff', logging: false, windowWidth: 820 },
          jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
          pagebreak: pb
        }).from(source);
        return worker.outputPdf('blob');
      });
    }).then(function (blob) {
      blobUrl = URL.createObjectURL(blob);
      var link = document.createElement('a');
      link.href = blobUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      cleanup();
      if (typeof opts.ondone === 'function') { try { opts.ondone(); } catch (e) {} }
    }).catch(function (err) {
      cleanup();
      if (typeof opts.onerror === 'function') { try { opts.onerror(err); } catch (e) {} }
      else { throw err; }
    });
  };
})();
