/* =====================================================================
   Jardín Las Violetas — script.js
   Un solo bucle rAF lee scrollY y escribe progreso en variables CSS.
   Cada módulo va aislado en safe(): si uno falla, el sitio se muestra completo.
   ===================================================================== */
const WHATSAPP_NUMERO = "522461134733"; // Número real. Si se deja vacío, se ocultan botón y envío.
const NEGOCIO = "Jardín Las Violetas";

(function () {
  'use strict';
  window.__vz = 1;

  var root = document.documentElement;
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var clamp = function (v, a, b) { return Math.min(b === undefined ? 1 : b, Math.max(a === undefined ? 0 : a, v)); };
  var ease = function (p) { return p < .5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2; };
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var fine = window.matchMedia('(pointer: fine)').matches;
  var mqDesk = window.matchMedia('(min-width: 1024px)');
  var vh = window.innerHeight, vw = window.innerWidth;

  function safe(name, fn) {
    try { fn(); } catch (e) {
      if (window.console) console.warn('[' + name + ']', e);
      root.classList.add('show-all');
    }
  }

  if (reduce) { root.classList.add('reduce'); }

  /* ---------- WhatsApp ---------- */
  function waLink(msg) { return 'https://wa.me/' + WHATSAPP_NUMERO + '?text=' + encodeURIComponent(msg); }
  safe('whatsapp', function () {
    if (!WHATSAPP_NUMERO) { root.classList.add('no-wa'); return; }
    $$('[data-wa]').forEach(function (a) {
      a.setAttribute('href', waLink(a.getAttribute('data-wa')));
      a.setAttribute('target', '_blank');
      a.setAttribute('rel', 'noopener');
    });
  });

  /* ---------- Cargador ---------- */
  safe('loader', function () {
    var loader = $('#loader'), cnt = $('#cnt');
    var done = false;
    function setCnt(v) { if (cnt) cnt.textContent = String(Math.round(v)).padStart(3, '0'); }
    var dur = reduce ? 400 : 1300;
    if (window.anime) {
      var o = { v: 0 };
      window.anime({ targets: o, v: 100, duration: dur, easing: 'easeInOutQuad', update: function () { setCnt(o.v); } });
    } else {
      var t0 = performance.now();
      (function tick(now) {
        var k = clamp((now - t0) / dur);
        setCnt(k * 100);
        if (k < 1) requestAnimationFrame(tick);
      })(t0);
    }
    function leave() {
      if (done) return; done = true;
      setCnt(100);
      if (!loader) { root.classList.add('is-ready'); return; }
      loader.classList.add('is-leaving');
      setTimeout(function () { root.classList.add('is-ready'); }, 180);
      setTimeout(function () { loader.classList.add('is-done'); }, 900);
    }
    setTimeout(leave, reduce ? 500 : 1400);
    setTimeout(function () { root.classList.add('is-ready'); }, 2600); // respaldo
  });

  /* ---------- Titulares con máscara por palabra ---------- */
  safe('split', function () {
    $$('[data-split]').forEach(function (el) {
      var i = 0;
      var frag = document.createDocumentFragment();
      (function walk(node, parent) {
        Array.prototype.slice.call(node.childNodes).forEach(function (n) {
          if (n.nodeType === 3) {
            n.textContent.split(/(\s+)/).forEach(function (t) {
              if (!t) return;
              if (/^\s+$/.test(t)) { parent.appendChild(document.createTextNode(' ')); return; }
              var wm = document.createElement('span'); wm.className = 'wm';
              var s = document.createElement('span'); s.textContent = t; s.style.setProperty('--i', i++);
              wm.appendChild(s); parent.appendChild(wm);
            });
          } else if (n.nodeType === 1) {
            var c = n.cloneNode(false); parent.appendChild(c); walk(n, c);
          }
        });
      })(el, frag);
      el.textContent = '';
      el.appendChild(frag);
      el.classList.add('split', 'is-split');
    });
  });

  /* ---------- Manifiesto: palabras que se encienden ---------- */
  var manifest = { el: null, items: [], lit: -1 };
  safe('manifiesto', function () {
    var h = $('.manifesto-text');
    if (!h) return;
    manifest.el = h.closest('section');
    Array.prototype.slice.call(h.childNodes).forEach(function (n) {
      if (n.nodeType === 3) {
        var frag = document.createDocumentFragment();
        n.textContent.split(/(\s+)/).forEach(function (t) {
          if (!t) return;
          if (/^\s+$/.test(t)) { frag.appendChild(document.createTextNode(' ')); return; }
          var s = document.createElement('span'); s.className = 'w'; s.textContent = t; frag.appendChild(s);
        });
        h.replaceChild(frag, n);
      }
    });
    manifest.items = $$('.w, .pill', h);
  });

  /* ---------- Revelado: IntersectionObserver + respaldo por geometría ---------- */
  var pending = [];
  safe('reveal', function () {
    var sel = '.rv, .rv-r, [data-split], .panel, .step';
    var els = $$(sel);
    pending = els.slice();
    function show(el) {
      if (el.classList.contains('in')) return;
      el.classList.add('in');
      var k = pending.indexOf(el); if (k > -1) pending.splice(k, 1);
      if (io) io.unobserve(el);
    }
    var io = null;
    if ('IntersectionObserver' in window) {
      io = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) { if (e.isIntersecting) show(e.target); });
      }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
      els.forEach(function (el) { io.observe(el); });
    }
    window.__revealGeom = function () {
      for (var i = pending.length - 1; i >= 0; i--) {
        var r = pending[i].getBoundingClientRect();
        if (r.top < vh * 0.94 && r.bottom > 0) show(pending[i]);
      }
    };
    setTimeout(window.__revealGeom, 2000);
    setTimeout(window.__revealGeom, 4000);
    window.addEventListener('load', function () { setTimeout(window.__revealGeom, 300); });
    if (reduce) { els.forEach(show); }
  });

  /* ---------- Header, menú móvil, sección activa ---------- */
  var hdr = $('#hdr');
  safe('header', function () {
    var burger = $('.burger'), menu = $('#menu');
    function setMenu(open) {
      root.classList.toggle('menu-on', open);
      hdr.classList.toggle('menu-open', open);
      burger.setAttribute('aria-expanded', open ? 'true' : 'false');
      burger.setAttribute('aria-label', open ? 'Cerrar menú' : 'Abrir menú');
      menu.setAttribute('aria-hidden', open ? 'false' : 'true');
    }
    burger.addEventListener('click', function () { setMenu(!root.classList.contains('menu-on')); });
    $$('a', menu).forEach(function (a) { a.addEventListener('click', function () { setMenu(false); }); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') setMenu(false); });
    mqDesk.addEventListener && mqDesk.addEventListener('change', function () { setMenu(false); });

    // sección activa
    var navLinks = $$('.nav a'), railLinks = $$('.sec-rail a'), rail = $('.sec-rail');
    var secs = $$('main > section[id]');
    function setActive(id, dark) {
      navLinks.forEach(function (a) { a.classList.toggle('active', a.getAttribute('href') === '#' + id); });
      railLinks.forEach(function (a) { a.classList.toggle('on', a.getAttribute('data-t') === id); });
      if (rail) rail.classList.toggle('dk', !!dark);
    }
    if ('IntersectionObserver' in window) {
      var so = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting) setActive(e.target.id, e.target.hasAttribute('data-dark'));
        });
      }, { rootMargin: '-45% 0px -50% 0px' });
      secs.forEach(function (s) { so.observe(s); });
    }
    $('#toTop').addEventListener('click', function () { window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' }); });
  });

  /* ---------- Botón flotante ---------- */
  safe('wafloat', function () {
    var f = $('#waFloat');
    setTimeout(function () { f.classList.add('show'); }, 3000);
  });

  /* ---------- Bucle de scroll ---------- */
  var refs = {};
  safe('refs', function () {
    refs.progress = $('.progress');
    refs.marquee = $$('.mq-row');
    refs.rama = $$('[data-draw]');
    refs.esc = $('#escenas'); refs.track = $('#track'); refs.panels = $$('.panel', refs.track || document);
    refs.escBar = $('.esc-ind .bar i'); refs.escCount = $('#escCount');
    refs.ap = $('#apertura'); refs.apText = $('#apText');
    refs.cock = $('#cocteleria');
    refs.res = $('#reservar'); refs.steps = $('#steps'); refs.stepEls = $$('.step');
    refs.det = $$('.det-slot');
    refs.foot = $('#footer'); refs.word = $('#wordmark');
  });

  var lastY = -1, dirty = true, skew = 0, lastCount = '';

  function prog(el) { var r = el.getBoundingClientRect(); return clamp((vh - r.top) / (vh + r.height)); }
  function pinProg(el) { var r = el.getBoundingClientRect(); return clamp(-r.top / Math.max(1, r.height - vh)); }

  function update(y, dy) {
    var doc = document.documentElement;
    var maxScroll = Math.max(1, doc.scrollHeight - vh);
    var sp = clamp(y / maxScroll);
    doc.style.setProperty('--sp', sp.toFixed(4));
    if (hdr) hdr.classList.toggle('is-small', y > 40);

    // marquee: inclinación según la velocidad
    var target = clamp(dy * 0.12, -4, 4);
    skew += (target - skew) * 0.12;
    if (Math.abs(skew) < 0.01) skew = 0;
    refs.marquee.forEach(function (r) { r.style.setProperty('--skew', skew.toFixed(2) + 'deg'); });

    // manifiesto
    if (manifest.el && manifest.items.length && !reduce) {
      var p = prog(manifest.el);
      var t = clamp((p - 0.18) / 0.42);
      var lit = Math.floor(t * (manifest.items.length + 1));
      if (lit !== manifest.lit) {
        manifest.items.forEach(function (w, i) { w.classList.toggle('on', i < lit); });
        manifest.lit = lit;
      }
      var d = clamp((p - 0.12) / 0.5);
      refs.rama.forEach(function (path) { path.style.strokeDashoffset = (1 - d).toFixed(3); });
    } else if (reduce || !manifest.items.length) {
      manifest.items.forEach(function (w) { w.classList.add('on'); });
    }

    // escenas ancladas (solo escritorio con movimiento)
    if (refs.esc && refs.track) {
      if (mqDesk.matches && !reduce) {
        var pe = pinProg(refs.esc);
        var max = Math.max(0, refs.track.scrollWidth - vw);
        refs.track.style.transform = 'translate3d(' + (-pe * max).toFixed(1) + 'px,0,0)';
        if (refs.escBar) refs.escBar.parentNode.style.setProperty('--ep', pe.toFixed(4));
        if (refs.escBar) refs.escBar.style.setProperty('--ep', pe.toFixed(4));
        var idx = Math.min(3, Math.floor(pe * 3) + 1);
        var txt = '0' + idx + ' / 03';
        if (txt !== lastCount && refs.escCount) { refs.escCount.textContent = txt; lastCount = txt; }
        refs.panels.forEach(function (pn) {
          var r = pn.getBoundingClientRect();
          pn.style.setProperty('--pz', clamp((vw - r.left) / (vw * 0.9)).toFixed(3));
        });
      } else {
        refs.track.style.transform = '';
      }
    }

    // apertura: la imagen se abre
    if (refs.ap && !reduce) {
      var pa = pinProg(refs.ap);
      var e = ease(clamp(pa / 0.7));
      var maxX = vw < 700 ? 14 : 30;
      var maxY = vw < 700 ? 22 : 28;
      refs.ap.style.setProperty('--iy', ((1 - e) * maxY).toFixed(2) + 'vh');
      refs.ap.style.setProperty('--ix', ((1 - e) * maxX).toFixed(2) + 'vw');
      refs.ap.style.setProperty('--rr', ((1 - e) * 44).toFixed(1) + 'px');
      refs.ap.style.setProperty('--e', e.toFixed(3));
      if (refs.apText) refs.apText.classList.toggle('show', pa > 0.55);
    } else if (refs.apText) {
      refs.apText.classList.add('show');
    }

    // coctelería: cae la noche
    if (refs.cock && !reduce) {
      var pc = prog(refs.cock);
      var tt = clamp(pc * 2.4);
      refs.cock.style.setProperty('--p', tt.toFixed(3));
      refs.cock.style.setProperty('--co', clamp((tt - 0.45) / 0.4).toFixed(3));
    } else if (refs.cock) {
      refs.cock.style.setProperty('--p', 1); refs.cock.style.setProperty('--co', 1);
    }

    // reservar: riel que se llena
    if (refs.steps) {
      var rr = refs.steps.getBoundingClientRect();
      var pr = reduce ? 1 : clamp((vh * 0.62 - rr.top) / rr.height);
      refs.steps.style.setProperty('--p', pr.toFixed(3));
      refs.stepEls.forEach(function (s) {
        var b = s.getBoundingClientRect();
        s.classList.toggle('on', reduce || b.top < vh * 0.62);
      });
    }

    // detalles: parallax por tarjeta
    if (!reduce) {
      var k = vw < 1024 ? 0.5 : 1;
      refs.det.forEach(function (slot) {
        var sp2 = parseFloat(slot.getAttribute('data-speed')) || 0.1;
        var r = slot.getBoundingClientRect();
        if (r.bottom < -300 || r.top > vh + 300) return;
        var off = (r.top + r.height / 2) - vh / 2;
        var card = slot.firstElementChild;
        if (card) card.style.setProperty('--py', (-off * sp2 * k).toFixed(1) + 'px');
      });
    }

    // footer: wordmark que se rellena
    if (refs.foot && refs.word) {
      var pf = reduce ? 1 : clamp(prog(refs.foot) * 1.6);
      refs.word.style.setProperty('--p', pf.toFixed(3));
    }

    if (window.__revealGeom && dy !== 0) window.__revealGeom();
  }

  function frame() {
    var y = window.pageYOffset;
    var dy = y - lastY; if (lastY < 0) dy = 0;
    if (y !== lastY || dirty || Math.abs(skew) > 0.01) {
      safe('update', function () { update(y, dy); });
      lastY = y; dirty = false;
    }
    requestAnimationFrame(frame);
  }
  window.addEventListener('resize', function () {
    vh = window.innerHeight; vw = window.innerWidth; dirty = true;
    if (window.__revealGeom) requestAnimationFrame(window.__revealGeom);
  }, { passive: true });
  window.addEventListener('scroll', function () { if (window.__revealGeom) requestAnimationFrame(window.__revealGeom); }, { passive: true });
  window.addEventListener('load', function () { dirty = true; });
  requestAnimationFrame(frame);

  /* ---------- Hero: inclinación 3D del arco ---------- */
  safe('tilt-hero', function () {
    var wrap = $('#arcoWrap'), hero = $('#inicio');
    if (!wrap || !fine || reduce) return;
    hero.addEventListener('pointermove', function (e) {
      wrap.style.setProperty('--mx', ((e.clientX / vw - 0.5) * 2).toFixed(3));
      wrap.style.setProperty('--my', ((e.clientY / vh - 0.5) * 2).toFixed(3));
    });
    hero.addEventListener('pointerleave', function () { wrap.style.setProperty('--mx', 0); wrap.style.setProperty('--my', 0); });
  });

  /* ---------- Tarjetas del bento: tilt + foco de luz ---------- */
  safe('tilt-cards', function () {
    if (!fine || reduce) return;
    $$('[data-tilt]').forEach(function (c) {
      c.addEventListener('pointermove', function (e) {
        var r = c.getBoundingClientRect();
        var x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
        c.style.setProperty('--ry', ((x - 0.5) * 2).toFixed(3));
        c.style.setProperty('--rx', ((y - 0.5) * 2).toFixed(3));
        c.style.setProperty('--lx', (x * 100).toFixed(1) + '%');
        c.style.setProperty('--ly', (y * 100).toFixed(1) + '%');
      });
      c.addEventListener('pointerleave', function () { c.style.setProperty('--rx', 0); c.style.setProperty('--ry', 0); });
    });
  });

  /* ---------- Botones magnéticos ---------- */
  safe('magnet', function () {
    if (!fine || reduce) return;
    $$('[data-magnet]').forEach(function (b) {
      b.addEventListener('pointermove', function (e) {
        var r = b.getBoundingClientRect();
        var dx = (e.clientX - (r.left + r.width / 2)) / (r.width / 2);
        var dy = (e.clientY - (r.top + r.height / 2)) / (r.height / 2);
        b.style.setProperty('--tx', (clamp(dx, -1, 1) * 8).toFixed(1) + 'px');
        b.style.setProperty('--ty', (clamp(dy, -1, 1) * 6).toFixed(1) + 'px');
      });
      b.addEventListener('pointerleave', function () { b.style.setProperty('--tx', '0px'); b.style.setProperty('--ty', '0px'); });
    });
  });

  /* ---------- Cursor personalizado ---------- */
  safe('cursor', function () {
    if (!fine || reduce) return;
    var dot = document.createElement('div'); dot.className = 'cur-dot';
    var ring = document.createElement('div'); ring.className = 'cur-ring';
    document.body.appendChild(dot); document.body.appendChild(ring);
    root.classList.add('has-cursor');
    var x = -100, y = -100, rx = -100, ry = -100;
    window.addEventListener('pointermove', function (e) {
      x = e.clientX; y = e.clientY;
      dot.style.transform = 'translate3d(' + x + 'px,' + y + 'px,0)';
      var t = e.target;
      ring.classList.toggle('big', !!(t.closest && t.closest('a, button, summary, label, .arco, .det-card, .card, .pill')));
    }, { passive: true });
    (function loop() {
      rx += (x - rx) * 0.18; ry += (y - ry) * 0.18;
      ring.style.transform = 'translate3d(' + rx.toFixed(1) + 'px,' + ry.toFixed(1) + 'px,0)';
      requestAnimationFrame(loop);
    })();
  });

  /* ---------- Canvas: pétalos (hero cae, contacto sube) ---------- */
  function petalCanvas(canvas, opt) {
    if (!canvas || !canvas.getContext) return;
    var ctx = canvas.getContext('2d');
    var W = 0, H = 0, dpr = Math.min(2, window.devicePixelRatio || 1);
    var colors = opt.colors, count = (vw < 700 ? opt.countM : opt.count);
    var petals = [], visible = true, mouse = { x: -999, y: -999 };
    function size() {
      var r = canvas.getBoundingClientRect();
      W = r.width; H = r.height;
      canvas.width = Math.max(1, W * dpr); canvas.height = Math.max(1, H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    function make(initial) {
      var s = opt.min + Math.random() * (opt.max - opt.min);
      return {
        x: Math.random() * W, y: initial ? Math.random() * H : (opt.dir > 0 ? -30 : H + 30), s: s,
        vy: (0.3 + Math.random() * 0.8) * opt.speed, ph: Math.random() * 6.28, f: 0.006 + Math.random() * 0.012,
        rot: Math.random() * 6.28, vr: (Math.random() - 0.5) * 0.03, flip: Math.random() * 6.28,
        col: colors[Math.floor(Math.random() * colors.length)], a: opt.alpha[0] + Math.random() * (opt.alpha[1] - opt.alpha[0]), vx: 0
      };
    }
    function draw(p) {
      var sx = Math.cos(p.flip);
      ctx.save();
      ctx.translate(p.x, p.y); ctx.rotate(p.rot); ctx.scale(Math.max(0.15, Math.abs(sx)), 1);
      ctx.globalAlpha = p.a; ctx.fillStyle = p.col;
      var s = p.s;
      ctx.beginPath();
      ctx.moveTo(0, -s);
      ctx.bezierCurveTo(s * 0.9, -s * 0.6, s * 0.8, s * 0.5, 0, s);
      ctx.bezierCurveTo(-s * 0.8, s * 0.5, -s * 0.9, -s * 0.6, 0, -s);
      ctx.fill();
      ctx.restore();
    }
    function step() {
      ctx.clearRect(0, 0, W, H);
      petals.forEach(function (p) {
        p.ph += p.f; p.flip += 0.025; p.rot += p.vr;
        p.y += p.vy * opt.dir;
        p.x += Math.sin(p.ph) * 0.6 + p.vx;
        var dx = p.x - mouse.x, dy = p.y - mouse.y, d = Math.sqrt(dx * dx + dy * dy);
        if (d < 120 && d > 0.1) { var f = (120 - d) / 120; p.x += (dx / d) * f * 3; p.y += (dy / d) * f * 3; }
        if ((opt.dir > 0 && p.y > H + 30) || (opt.dir < 0 && p.y < -30) || p.x < -40 || p.x > W + 40) {
          Object.assign(p, make(false));
        }
        draw(p);
      });
    }
    size();
    for (var i = 0; i < count; i++) petals.push(make(true));
    var raf = 0;
    function loop() { step(); raf = requestAnimationFrame(loop); }
    function start() { if (!raf && !reduce && visible && !document.hidden) loop(); }
    function stop() { cancelAnimationFrame(raf); raf = 0; }
    if (reduce) { step(); } else { start(); }
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (en) { visible = en[0].isIntersecting; visible ? start() : stop(); }).observe(canvas);
    }
    document.addEventListener('visibilitychange', function () { document.hidden ? stop() : start(); });
    window.addEventListener('resize', function () { size(); });
    if (fine && opt.interactive) {
      window.addEventListener('pointermove', function (e) {
        var r = canvas.getBoundingClientRect();
        mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top;
      }, { passive: true });
    }
  }
  safe('petales', function () {
    petalCanvas($('#petales'), { count: 28, countM: 16, min: 8, max: 22, speed: 1, dir: 1, alpha: [0.7, 0.9], interactive: true, colors: ['#8A4FD0', '#B99AE0', '#E0526D', '#FFFFFF'] });
    petalCanvas($('#petalosUp'), { count: 22, countM: 12, min: 7, max: 16, speed: 0.8, dir: -1, alpha: [0.25, 0.5], interactive: false, colors: ['#B99AE0', '#8A4FD0', '#C7E58A', '#F5A3B7'] });
  });

  /* ---------- Canvas: luciérnagas ---------- */
  safe('luciernagas', function () {
    var canvas = $('#luciernagas');
    if (!canvas || !canvas.getContext) return;
    var ctx = canvas.getContext('2d');
    var W = 0, H = 0, dpr = Math.min(2, window.devicePixelRatio || 1), visible = false, raf = 0;
    function sprite(c1, c2) {
      var s = document.createElement('canvas'); s.width = s.height = 48;
      var g = s.getContext('2d'), gr = g.createRadialGradient(24, 24, 0, 24, 24, 24);
      gr.addColorStop(0, c1); gr.addColorStop(0.25, c2); gr.addColorStop(1, 'rgba(0,0,0,0)');
      g.fillStyle = gr; g.fillRect(0, 0, 48, 48);
      return s;
    }
    var spr = [sprite('rgba(255,255,255,1)', 'rgba(199,229,138,.7)'), sprite('rgba(255,255,255,1)', 'rgba(242,163,58,.7)')];
    var pts = [];
    function size() {
      var r = canvas.getBoundingClientRect(); W = r.width; H = r.height;
      canvas.width = Math.max(1, W * dpr); canvas.height = Math.max(1, H * dpr); ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    size();
    var n = vw < 700 ? 22 : 40;
    for (var i = 0; i < n; i++) {
      pts.push({ x: Math.random() * W, y: Math.random() * H, vx: (Math.random() - 0.5) * 0.3, vy: (Math.random() - 0.5) * 0.25, ph: Math.random() * 6.28, f: 0.01 + Math.random() * 0.025, r: 6 + Math.random() * 8, s: spr[i % 2] });
    }
    function step() {
      ctx.clearRect(0, 0, W, H);
      pts.forEach(function (p) {
        p.ph += p.f; p.x += p.vx + Math.sin(p.ph * 0.7) * 0.2; p.y += p.vy + Math.cos(p.ph * 0.6) * 0.15;
        if (p.x < -20) p.x = W + 20; if (p.x > W + 20) p.x = -20; if (p.y < -20) p.y = H + 20; if (p.y > H + 20) p.y = -20;
        var a = Math.pow(Math.sin(p.ph) * 0.5 + 0.5, 2);
        ctx.globalAlpha = 0.15 + a * 0.85;
        ctx.drawImage(p.s, p.x - p.r * 2, p.y - p.r * 2, p.r * 4, p.r * 4);
      });
    }
    function loop() { step(); raf = requestAnimationFrame(loop); }
    function start() { if (!raf && !reduce && visible && !document.hidden) loop(); }
    function stop() { cancelAnimationFrame(raf); raf = 0; }
    step();
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (en) { visible = en[0].isIntersecting; visible ? start() : stop(); }).observe(canvas);
    }
    document.addEventListener('visibilitychange', function () { document.hidden ? stop() : start(); });
    window.addEventListener('resize', function () { size(); step(); });
  });

  /* ---------- Plano: ruta dibujada con anime.js (si está) ---------- */
  safe('ruta', function () {
    var route = $('#route');
    if (!route || reduce || !window.anime) return;
    route.style.animation = 'none';
    window.anime({
      targets: route, strokeDashoffset: [1, 0], opacity: [1, 1, 1, 0],
      duration: 4200, easing: 'easeInOutCubic', loop: true, endDelay: 900
    });
  });

  /* ---------- Preguntas: altura animada ---------- */
  safe('faq', function () {
    $$('.faq details').forEach(function (d) {
      var s = $('summary', d), a = $('.ans', d);
      s.addEventListener('click', function (e) {
        e.preventDefault();
        if (reduce || !a.animate) { d.open = !d.open; return; }
        if (!d.open) {
          d.open = true;
          var h = a.scrollHeight;
          a.animate({ height: ['0px', h + 'px'] }, { duration: 380, easing: 'cubic-bezier(.22,1,.36,1)' });
        } else {
          var h0 = a.offsetHeight;
          var an = a.animate({ height: [h0 + 'px', '0px'] }, { duration: 300, easing: 'cubic-bezier(.22,1,.36,1)' });
          an.onfinish = function () { d.open = false; };
        }
      });
    });
  });

  /* ---------- Formulario → WhatsApp ---------- */
  safe('form', function () {
    var form = $('#formContacto');
    if (!form) return;
    var fecha = $('#f-fecha');
    if (fecha) {
      var t = new Date(); t.setMinutes(t.getMinutes() - t.getTimezoneOffset());
      fecha.min = t.toISOString().slice(0, 10);
    }
    var nombre = $('#f-nombre'), inv = $('#f-inv');
    function setErr(input, errId, on) {
      var err = $('#' + errId);
      input.setAttribute('aria-invalid', on ? 'true' : 'false');
      if (err) err.hidden = !on;
    }
    function okNombre() { var ok = nombre.value.trim().length > 0; setErr(nombre, 'e-nombre', !ok); return ok; }
    function okInv() { var v = inv.value.trim(); var ok = v === '' || (Number(v) >= 1 && isFinite(Number(v))); setErr(inv, 'e-inv', !ok); return ok; }
    nombre.addEventListener('blur', okNombre);
    nombre.addEventListener('input', function () { if (nombre.getAttribute('aria-invalid') === 'true') okNombre(); });
    inv.addEventListener('blur', okInv);
    inv.addEventListener('input', function () { if (inv.getAttribute('aria-invalid') === 'true') okInv(); });

    var tipos = { 'Boda': 'una boda', 'Cumpleaños': 'un cumpleaños', 'Bautizo': 'un bautizo', 'Aniversario': 'un aniversario', 'Evento empresarial': 'un evento empresarial', 'Otro': 'un evento' };
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var a = okNombre(), b = okInv();
      if (!a || !b) { (a ? inv : nombre).focus(); return; }
      if (!WHATSAPP_NUMERO) return;
      var msg = 'Hola, soy ' + nombre.value.trim() + '. Quiero información de ' + NEGOCIO;
      var tipo = $('#f-tipo').value;
      if (tipo) msg += ' para ' + (tipos[tipo] || 'un evento');
      if (fecha && fecha.value) {
        var d = new Date(fecha.value + 'T12:00:00');
        msg += ' el ' + d.toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' });
      }
      if (inv.value.trim()) msg += ' con aproximadamente ' + inv.value.trim() + ' invitados';
      msg += '.';
      var int = form.querySelector('input[name="interes"]:checked');
      if (int) msg += ' Me interesa: ' + int.value + '.';
      var extra = $('#f-msg').value.trim();
      if (extra) msg += ' ' + extra;
      var btn = $('#btnEnviar'), lbl = $('span', btn), old = lbl.textContent;
      btn.disabled = true; lbl.textContent = 'Abriendo WhatsApp…';
      window.open(waLink(msg), '_blank', 'noopener');
      setTimeout(function () { btn.disabled = false; lbl.textContent = old; }, 2200);
    });
  });

  /* ---------- Reduced motion: aves quietas ---------- */
  safe('reduced', function () {
    if (!reduce) return;
    $$('svg').forEach(function (s) { if (s.pauseAnimations) s.pauseAnimations(); });
  });
})();
