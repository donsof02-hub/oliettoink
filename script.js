/* ============================================================================
   OLIETTO INK
   ========================================================================= */
(function () {
  'use strict';

  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var lento = window.matchMedia('(prefers-reduced-motion: reduce)');

  // pagina unica: la posizione dello scroll la decidiamo noi, non il ripristino
  // automatico del browser (che altrimenti riapre la sezione a meta' pagina)
  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';

  var body = document.body;
  var menu = $('#menu');
  var voci = $$('.mi', menu);
  var stage = $('#stage');
  var sezioni = {};
  voci.forEach(function (v) { sezioni[v.dataset.sec] = $('#sec-' + v.dataset.sec); });

  var attiva = null;

  /* ───────────────────────── BOOT ───────────────────────── */

  var boot = $('#boot');
  function chiudiBoot() {
    if (!boot || boot.hasAttribute('data-done')) return;
    boot.setAttribute('data-done', '');
    try { sessionStorage.setItem('oi-boot', '1'); } catch (e) {}
    setTimeout(function () { boot.remove(); }, 500);
  }
  var giaVisto = false;
  try { giaVisto = sessionStorage.getItem('oi-boot') === '1'; } catch (e) {}
  if (giaVisto || lento.matches) {
    boot.setAttribute('data-done', '');
    setTimeout(function () { boot.remove(); }, 0);
  } else {
    setTimeout(chiudiBoot, 1150);
    addEventListener('pointerdown', chiudiBoot, { once: true });
    addEventListener('keydown', chiudiBoot, { once: true });
  }

  /* ───────────────── ASCII (geco del logo) ───────────────── */

  fetch('data/ascii.json')
    .then(function (r) { return r.ok ? r.json() : null; })
    .then(function (a) {
      if (!a) return;
      var bootArt = $('#bootArt'), brandArt = $('#brandArt');
      if (bootArt && a.lg) bootArt.textContent = a.lg.join('\n');
      if (brandArt && a.sm) brandArt.textContent = a.sm.join('\n');
    })
    .catch(function () {});

  /* ───────────────────────── TICKER ───────────────────────── */

  var voci_ticker = ['OLIETTO INK', 'SAD SAKURA TATTOO', 'ROMA — VIA TRIPOLI 10',
                     'LUN–SAB 11–18', 'DM PER PRENOTARE'];
  var tick = $('#tickerIn');
  if (tick) {
    var riga = voci_ticker.map(function (t) { return '<span>' + t + ' ◢</span>'; }).join('');
    tick.innerHTML = riga + riga;      // doppia, per far tornare il ciclo
  }

  /* ─────────── altezza del menu agganciato (telefono) ─────────── */

  function misuraDock() {
    if (body.dataset.state !== 'section') return;
    var r = menu.getBoundingClientRect();
    document.documentElement.style.setProperty('--dock-h', Math.ceil(r.bottom + 26) + 'px');
    // altezza vera della barra: serve al marchio per centrarsi dentro
    document.documentElement.style.setProperty('--bar-h', Math.round(r.height) + 'px');
  }

  /* ───────────────── MENU: centro → alto a sinistra ─────────────────
     Tecnica FLIP: misuro dove stanno le voci ADESSO, cambio stato (il CSS
     le sposta di colpo in alto a sinistra), misuro dove sono FINITE, poi le
     rimetto visivamente al punto di partenza con una transform e lascio che
     l'animazione le riporti a zero. Si anima solo transform, quindi gira
     sulla GPU: nessun ricalcolo di layout a ogni fotogramma.                */

  function vaiA(nome, animato) {
    var sez = sezioni[nome];
    if (!sez || nome === attiva) return;

    var partenza = (body.dataset.state === 'home' && animato && !lento.matches)
      ? voci.map(function (v) { return v.getBoundingClientRect(); })
      : null;

    Object.keys(sezioni).forEach(function (k) { sezioni[k].hidden = k !== nome; });
    voci.forEach(function (v) { v.classList.toggle('is-on', v.dataset.sec === nome); });
    body.dataset.state = 'section';
    attiva = nome;

    if (partenza) {
      voci.forEach(function (v, i) {
        var a = partenza[i], b = v.getBoundingClientRect();
        if (!b.width) return;
        v.getAnimations().forEach(function (an) { an.cancel(); });   // niente code di animazioni
        v.animate([
          { transform: 'translate(' + (a.left - b.left) + 'px,' + (a.top - b.top) + 'px) scale(' +
                       (a.width / b.width) + ',' + (a.height / b.height) + ')' },
          { transform: 'none' }
        ], {
          duration: 680, delay: i * 26,
          easing: 'cubic-bezier(.72,0,.18,1)',
          fill: 'both', composite: 'replace'
        });
      });
    }

    requestAnimationFrame(misuraDock);
    scrollTo(0, 0);
    sez.focus && sez.focus({ preventScroll: true });
  }

  function tornaHome(animato) {
    if (body.dataset.state === 'home') return;

    var partenza = (animato && !lento.matches)
      ? voci.map(function (v) { return v.getBoundingClientRect(); })
      : null;

    Object.keys(sezioni).forEach(function (k) { sezioni[k].hidden = true; });
    voci.forEach(function (v) { v.classList.remove('is-on'); });
    body.dataset.state = 'home';
    attiva = null;

    if (partenza) {
      voci.forEach(function (v, i) {
        var a = partenza[i], b = v.getBoundingClientRect();
        if (!b.width) return;
        v.getAnimations().forEach(function (an) { an.cancel(); });   // niente code di animazioni
        v.animate([
          { transform: 'translate(' + (a.left - b.left) + 'px,' + (a.top - b.top) + 'px) scale(' +
                       (a.width / b.width) + ',' + (a.height / b.height) + ')' },
          { transform: 'none' }
        ], {
          duration: 620, delay: (voci.length - 1 - i) * 22,
          easing: 'cubic-bezier(.72,0,.18,1)',
          fill: 'both', composite: 'replace'
        });
      });
    }
  }

  voci.forEach(function (v) {
    v.addEventListener('click', function (e) {
      e.preventDefault();
      var nome = v.dataset.sec;
      if (nome === attiva) { history.pushState({}, '', '#'); tornaHome(true); return; }
      history.pushState({ sec: nome }, '', '#' + nome);
      vaiA(nome, true);
    });
  });

  $('#brand').addEventListener('click', function (e) {
    e.preventDefault();
    history.pushState({}, '', location.pathname);
    tornaHome(true);
  });

  addEventListener('popstate', function () {
    var nome = location.hash.replace('#', '');
    if (sezioni[nome]) vaiA(nome, false); else tornaHome(false);
  });

  addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && !lightboxAperto() && body.dataset.state === 'section') {
      history.pushState({}, '', location.pathname);
      tornaHome(true);
    }
  });

  addEventListener('resize', misuraDock, { passive: true });

  /* ─────────────── PORTFOLIO e FLASH ─────────────── */

  var gallerie = {};     // nome -> [ {web,w,h}, ... ] per il carosello

  function cella(foto, descrizione) {
    var a = document.createElement('button');
    a.type = 'button';
    a.className = 'cell';
    a.setAttribute('aria-label', descrizione || 'Apri la galleria');
    var img = document.createElement('img');
    img.src = foto.thumb; img.alt = '';
    img.loading = 'lazy'; img.decoding = 'async';
    // proporzioni dichiarate: il browser riserva lo spazio giusto e la
    // pagina non salta mentre le foto arrivano una a una
    if (foto.w && foto.h) { img.width = foto.w; img.height = foto.h; }
    a.appendChild(img);
    return a;
  }

  fetch('data/portfolio.json')
    .then(function (r) { return r.ok ? r.json() : null; })
    .then(function (d) {
      if (!d || !d.sessioni || !d.sessioni.length) return;
      var griglia = $('#pfGrid');
      d.sessioni.forEach(function (s, i) {
        gallerie['pf' + i] = s.foto;
        var c = cella(s.foto[0], s.quante > 1
                      ? 'Sessione, ' + s.quante + ' foto' : 'Apri la foto');
        c.addEventListener('click', function () { apri('pf' + i, 0); });
        griglia.appendChild(c);
      });
    })
    .catch(function () {});

  fetch('data/flash.json')
    .then(function (r) { return r.ok ? r.json() : null; })
    .then(function (d) {
      if (!d || !d.disegni || !d.disegni.length) return;
      var griglia = $('#flashGrid');
      gallerie.flash = d.disegni;
      d.disegni.forEach(function (f, i) {
        var c = cella(f, 'Flash ' + (i + 1));
        c.addEventListener('click', function () { apri('flash', i); });
        griglia.appendChild(c);
      });
    })
    .catch(function () {});

  /* ─────────────── CAROSELLO ─────────────── */

  var lb = $('#lb'), lbImg = $('#lbImg'), lbMeta = $('#lbMeta'), lbDots = $('#lbDots');
  var serie = [], idx = 0;

  function lightboxAperto() { return !lb.hasAttribute('hidden'); }

  function apri(chiave, i) {
    serie = gallerie[chiave] || [];
    if (!serie.length) return;
    lb.hidden = false;
    body.style.overflow = 'hidden';
    mostra(i);
    $('#lbX').focus();
  }

  function chiudi() {
    lb.hidden = true;
    body.style.overflow = '';
    lbImg.removeAttribute('src');
  }

  function mostra(i) {
    idx = (i + serie.length) % serie.length;
    var f = serie[idx];
    lbImg.src = f.web;
    lbImg.alt = 'Foto ' + (idx + 1) + ' di ' + serie.length;
    lbMeta.textContent = String(idx + 1).padStart(2, '0') + ' / ' +
                         String(serie.length).padStart(2, '0');

    lbDots.innerHTML = '';
    if (serie.length > 1 && serie.length <= 14) {
      serie.forEach(function (_, n) {
        var d = document.createElement('i');
        if (n === idx) d.className = 'on';
        lbDots.appendChild(d);
      });
    }
    // precarico la successiva, cosi' lo scorrimento non attende la rete
    if (serie.length > 1) new Image().src = serie[(idx + 1) % serie.length].web;

    var soloUna = serie.length < 2;
    $('#lbPrev').hidden = soloUna;
    $('#lbNext').hidden = soloUna;
  }

  $('#lbX').addEventListener('click', chiudi);
  $('#lbPrev').addEventListener('click', function () { mostra(idx - 1); });
  $('#lbNext').addEventListener('click', function () { mostra(idx + 1); });
  lb.addEventListener('click', function (e) { if (e.target === lb) chiudi(); });

  addEventListener('keydown', function (e) {
    if (!lightboxAperto()) return;
    if (e.key === 'Escape') chiudi();
    else if (e.key === 'ArrowLeft') mostra(idx - 1);
    else if (e.key === 'ArrowRight') mostra(idx + 1);
  });

  var x0 = null;
  lb.addEventListener('touchstart', function (e) { x0 = e.changedTouches[0].clientX; }, { passive: true });
  lb.addEventListener('touchend', function (e) {
    if (x0 === null) return;
    var d = e.changedTouches[0].clientX - x0;
    x0 = null;
    if (Math.abs(d) > 45) mostra(idx + (d < 0 ? 1 : -1));
  }, { passive: true });

  /* ─────────────── AVVIO ─────────────── */

  var iniziale = location.hash.replace('#', '');
  if (sezioni[iniziale]) vaiA(iniziale, false);

  // niente video in movimento se il sistema chiede meno animazioni
  if (lento.matches) { var v = $('#bgv'); if (v) v.pause(); }
})();
