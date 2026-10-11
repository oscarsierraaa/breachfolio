/* Breachfolio — homepage hero background effect (decorative only).
   Self-contained: creates and manages its own <canvas>, touches nothing
   else on the page. Safe to remove entirely (delete this file + the
   <script> tag that loads it) with zero effect on the rest of the site.
   Only runs on the homepage hero (marked with the .sf-hero-fx class). */
(function () {
  'use strict';

  var hero = document.querySelector('.sf-hero-fx');
  if (!hero || !window.requestAnimationFrame || window.innerWidth < 1024) return;

  var canvas = document.createElement('canvas');
  canvas.id = 'sf-hero-canvas';
  canvas.setAttribute('aria-hidden', 'true');
  hero.insertBefore(canvas, hero.firstChild);

  var ctx = canvas.getContext('2d');
  if (!ctx) return;

  var reduceMotion = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);

  var DPR = Math.min(window.devicePixelRatio || 1, 2);
  var W = 0, H = 0;
  var NODE_COUNT = 80;
  var LINK_DIST = 165;
  var nodes = [];
  var mouse = { x: -9999, y: -9999 };
  var rafId = null;

  function readColor(varName, fallback) {
    var v = getComputedStyle(document.documentElement).getPropertyValue(varName).trim();
    return v ? 'hsl(' + v + ')' : fallback;
  }

  function isLightTheme() {
    return document.documentElement.getAttribute('data-theme') === 'light';
  }

  function resize() {
    var rect = hero.getBoundingClientRect();
    W = rect.width; H = rect.height;
    if (W <= 0 || H <= 0) return;
    canvas.width = Math.round(W * DPR);
    canvas.height = Math.round(H * DPR);
    canvas.style.width = W + 'px';
    canvas.style.height = H + 'px';
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  }

  function makeNodes() {
    nodes = [];
    for (var i = 0; i < NODE_COUNT; i++) {
      nodes.push({
        x: Math.random() * W,
        y: Math.random() * H,
        vx: (Math.random() - 0.5) * 0.18,
        vy: (Math.random() - 0.5) * 0.18,
        r: 1.5 + Math.random() * 2.1,
        hub: Math.random() < 0.12
      });
    }
  }

  function draw() {
    var accent = readColor('--accent', '#22c55e');
    var accent2 = readColor('--accent-2', '#14b8a6');
    var light = isLightTheme();
    ctx.clearRect(0, 0, W, H);

    if (!reduceMotion) {
      for (var i = 0; i < nodes.length; i++) {
        var n = nodes[i];
        n.x += n.vx; n.y += n.vy;
        if (n.x < 0 || n.x > W) n.vx *= -1;
        if (n.y < 0 || n.y > H) n.vy *= -1;
      }
    }

    ctx.shadowBlur = 0;
    for (var a = 0; a < nodes.length; a++) {
      for (var b = a + 1; b < nodes.length; b++) {
        var na = nodes[a], nb = nodes[b];
        var dx = na.x - nb.x, dy = na.y - nb.y;
        var dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < LINK_DIST) {
          var mdx = (na.x + nb.x) / 2 - mouse.x;
          var mdy = (na.y + nb.y) / 2 - mouse.y;
          var mDist = Math.sqrt(mdx * mdx + mdy * mdy);
          var near = Math.max(0, 1 - mDist / 260);
          ctx.strokeStyle = near > 0.5 ? accent : accent2;
          ctx.globalAlpha = light
            ? (1 - dist / LINK_DIST) * (0.42 + near * 0.4)
            : (1 - dist / LINK_DIST) * (0.34 + near * 0.55);
          ctx.lineWidth = (near > 0.5 ? 1.4 : 1.1) + (light ? 0.15 : 0);
          ctx.beginPath();
          ctx.moveTo(na.x, na.y);
          ctx.lineTo(nb.x, nb.y);
          ctx.stroke();
        }
      }
    }

    for (var j = 0; j < nodes.length; j++) {
      var nd = nodes[j];
      var mdx2 = nd.x - mouse.x, mdy2 = nd.y - mouse.y;
      var mDist2 = Math.sqrt(mdx2 * mdx2 + mdy2 * mdy2);
      var near2 = Math.max(0, 1 - mDist2 / 220);
      var color = near2 > 0.4 ? accent : (nd.hub ? accent : accent2);
      var radius = (nd.hub ? nd.r + 1.3 : nd.r) + near2 * 1.8;
      ctx.globalAlpha = light ? (0.72 + near2 * 0.28) : (0.65 + near2 * 0.35);
      ctx.shadowBlur = light ? (nd.hub ? 4 : 2) + near2 * 5 : (nd.hub ? 10 : 5) + near2 * 10;
      ctx.shadowColor = color;
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(nd.x, nd.y, radius, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.shadowBlur = 0;
    ctx.globalAlpha = 1;

    if (!reduceMotion) rafId = requestAnimationFrame(draw);
  }

  function start() {
    if (rafId || W <= 0) return;
    if (reduceMotion) { draw(); return; }
    rafId = requestAnimationFrame(draw);
  }
  function stop() {
    if (rafId) { cancelAnimationFrame(rafId); rafId = null; }
  }

  hero.addEventListener('mousemove', function (e) {
    var rect = hero.getBoundingClientRect();
    mouse.x = e.clientX - rect.left;
    mouse.y = e.clientY - rect.top;
  });
  hero.addEventListener('mouseleave', function () {
    mouse.x = -9999; mouse.y = -9999;
  });

  document.addEventListener('visibilitychange', function () {
    if (document.hidden) stop(); else start();
  });

  if (window.ResizeObserver) {
    var ro = new ResizeObserver(function () { resize(); makeNodes(); });
    ro.observe(hero);
  } else {
    window.addEventListener('resize', function () { resize(); makeNodes(); });
  }

  resize();
  makeNodes();
  start();
})();
