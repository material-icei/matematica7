/* =========================================================
   figures.js — Ayudantes para dibujar figuras geométricas en SVG
   Todas las figuras se generan como texto SVG (sin dependencias).
   Convención de ángulos: grados, sentido antihorario, 0° = derecha.
   ========================================================= */
(function (global) {
  'use strict';
  var D2R = Math.PI / 180;

  function r(n) { return Math.round(n * 100) / 100; }
  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;'); }
  function norm(a) { a = a % 360; return a < 0 ? a + 360 : a; }
  /** punto a distancia d desde (x,y) en dirección a (grados) */
  function P(x, y, d, a) { return [x + d * Math.cos(a * D2R), y - d * Math.sin(a * D2R)]; }
  /** dirección (grados) desde V hacia Q */
  function dir(V, Q) { return norm(Math.atan2(-(Q[1] - V[1]), Q[0] - V[0]) / D2R); }
  function dist(A, B) { return Math.hypot(B[0] - A[0], B[1] - A[1]); }
  function mid(A, B) { return [(A[0] + B[0]) / 2, (A[1] + B[1]) / 2]; }
  function pts(list) { return list.map(function (p) { return r(p[0]) + ',' + r(p[1]); }).join(' '); }

  var F = {
    P: P, dir: dir, dist: dist, mid: mid, norm: norm,

    svg: function (w, h, inner, label, cls) {
      return '<svg class="fig ' + (cls || '') + '" viewBox="0 0 ' + w + ' ' + h + '" role="img" aria-label="' +
        esc(label || 'Figura geométrica') + '" preserveAspectRatio="xMidYMid meet">' + inner + '</svg>';
    },
    grid: function (x, y, cols, rows, s, cls) {
      var d = '';
      for (var i = 0; i <= cols; i++) d += 'M' + r(x + i * s) + ' ' + r(y) + 'V' + r(y + rows * s);
      for (var j = 0; j <= rows; j++) d += 'M' + r(x) + ' ' + r(y + j * s) + 'H' + r(x + cols * s);
      return '<path class="' + (cls || 'gridl') + '" d="' + d + '"/>';
    },
    seg: function (A, B, cls) {
      return '<line class="' + (cls || 'ln') + '" x1="' + r(A[0]) + '" y1="' + r(A[1]) + '" x2="' + r(B[0]) + '" y2="' + r(B[1]) + '"/>';
    },
    /** semirrecta con flecha en B */
    ray: function (A, B, cls) {
      return '<line class="' + (cls || 'ln') + '" x1="' + r(A[0]) + '" y1="' + r(A[1]) + '" x2="' + r(B[0]) + '" y2="' + r(B[1]) + '" marker-end="url(#gg-arrow)"/>';
    },
    /** recta con flechas en ambos extremos */
    line2: function (A, B, cls) {
      return '<line class="' + (cls || 'ln') + '" x1="' + r(A[0]) + '" y1="' + r(A[1]) + '" x2="' + r(B[0]) + '" y2="' + r(B[1]) + '" marker-start="url(#gg-arrow)" marker-end="url(#gg-arrow)"/>';
    },
    poly: function (list, cls, extra) {
      return '<polygon class="' + (cls || 'shape') + '" points="' + pts(list) + '"' + (extra || '') + '/>';
    },
    pline: function (list, cls) { return '<polyline class="' + (cls || 'ln') + '" points="' + pts(list) + '"/>'; },
    path: function (d, cls) { return '<path class="' + (cls || 'ln') + '" d="' + d + '"/>'; },
    text: function (x, y, t, cls, anchor) {
      return '<text class="' + (cls || 'lbl') + '" x="' + r(x) + '" y="' + r(y) + '" text-anchor="' + (anchor || 'middle') + '" dominant-baseline="central">' + t + '</text>';
    },
    rect: function (x, y, w, h, cls) { return '<rect class="' + (cls || 'shape') + '" x="' + r(x) + '" y="' + r(y) + '" width="' + r(w) + '" height="' + r(h) + '"/>'; },
    circle: function (c, rad, cls) { return '<circle class="' + (cls || 'ln') + '" cx="' + r(c[0]) + '" cy="' + r(c[1]) + '" r="' + r(rad) + '"/>'; },
    /** sector circular (ángulo coloreado) de a1 a a2 en sentido antihorario */
    sector: function (V, rad, a1, a2, cls) {
      var s = P(V[0], V[1], rad, a1), e = P(V[0], V[1], rad, a2);
      var sw = norm(a2 - a1), large = sw > 180 ? 1 : 0;
      return '<path class="' + (cls || 'sect') + '" d="M' + r(V[0]) + ' ' + r(V[1]) + 'L' + r(s[0]) + ' ' + r(s[1]) +
        'A' + rad + ' ' + rad + ' 0 ' + large + ' 0 ' + r(e[0]) + ' ' + r(e[1]) + 'Z"/>';
    },
    arc: function (V, rad, a1, a2, cls) {
      var s = P(V[0], V[1], rad, a1), e = P(V[0], V[1], rad, a2);
      var sw = norm(a2 - a1), large = sw > 180 ? 1 : 0;
      return '<path class="' + (cls || 'arcl') + '" d="M' + r(s[0]) + ' ' + r(s[1]) + 'A' + rad + ' ' + rad + ' 0 ' + large + ' 0 ' + r(e[0]) + ' ' + r(e[1]) + '"/>';
    },
    /** etiqueta ubicada en la bisectriz de un ángulo */
    angLabel: function (V, rad, a1, a2, t, cls) {
      var m = a1 + norm(a2 - a1) / 2, p = P(V[0], V[1], rad, m);
      return F.text(p[0], p[1], t, cls || 'lbl lbl-s');
    },
    /** marca de ángulo recto en V entre la dirección a y a+90 */
    right: function (V, a, s, cls) {
      s = s || 14;
      var p1 = P(V[0], V[1], s, a), p3 = P(V[0], V[1], s, a + 90);
      var p2 = [p1[0] + p3[0] - V[0], p1[1] + p3[1] - V[1]];
      return '<path class="' + (cls || 'rmark') + '" d="M' + r(p1[0]) + ' ' + r(p1[1]) + 'L' + r(p2[0]) + ' ' + r(p2[1]) + 'L' + r(p3[0]) + ' ' + r(p3[1]) + '"/>';
    },
    /** marca de ángulo recto en V, entre los lados que van hacia A y hacia B */
    rightAt: function (V, A, B, s) {
      var a1 = dir(V, A), a2 = dir(V, B);
      var a = norm(a2 - a1) <= 180 ? a1 : a2;
      return F.right(V, a, s);
    },
    /** marcas de igualdad (rayitas) en el medio de un segmento */
    ticks: function (A, B, n, cls) {
      n = n || 1;
      var m = mid(A, B), a = dir(A, B), out = '';
      for (var i = 0; i < n; i++) {
        var off = (i - (n - 1) / 2) * 6;
        var c = P(m[0], m[1], off, a);
        out += F.seg(P(c[0], c[1], 7, a + 90), P(c[0], c[1], 7, a - 90), cls || 'tick');
      }
      return out;
    },
    dot: function (p, label, dx, dy, cls) {
      return '<circle class="' + (cls || 'dot') + '" cx="' + r(p[0]) + '" cy="' + r(p[1]) + '" r="4.5"/>' +
        (label ? F.text(p[0] + (dx || 0), p[1] + (dy == null ? -14 : dy), label, 'lbl') : '');
    },
    /** línea de cota con flechas y texto, desplazada "off" px del segmento AB */
    dim: function (A, B, label, off, cls) {
      var a = dir(A, B), o = off || 0;
      var A2 = P(A[0], A[1], o, a + 90), B2 = P(B[0], B[1], o, a + 90);
      var m = mid(A2, B2), lp = P(m[0], m[1], o >= 0 ? 13 : -13, a + 90);
      return F.line2(A2, B2, cls || 'dimln') + F.text(lp[0], lp[1], label, 'lbl lbl-s dimtx');
    },
    /** etiqueta junto al medio de un segmento, del lado indicado (+1 izquierda del sentido A→B, -1 derecha) */
    sideLabel: function (A, B, t, side, d, cls) {
      var a = dir(A, B), m = mid(A, B), p = P(m[0], m[1], (d || 16) * (side || 1), a + 90);
      return F.text(p[0], p[1], t, cls || 'lbl lbl-s');
    },
    /** celdas de cuadrícula */
    cells: function (list, x0, y0, s, cls) {
      return list.map(function (c) { return F.rect(x0 + c[0] * s, y0 + c[1] * s, s, s, cls || 'cell'); }).join('');
    },
    /** vértice superior de un triángulo con base B→C y ángulos dados en B y C */
    triApex: function (B, C, angB, angC) {
      var L = dist(B, C), A = 180 - angB - angC;
      var AB = L * Math.sin(angC * D2R) / Math.sin(A * D2R);
      return P(B[0], B[1], AB, dir(B, C) + angB);
    },
    /** cuadrilátero con ángulos interiores dados (en orden) y dos primeros lados */
    quadFromAngles: function (start, angles, L1, L2, heading) {
      var h0 = heading || 0;
      var h1 = h0 + 180 - angles[1], h2 = h1 + 180 - angles[2], h3 = h2 + 180 - angles[3];
      function u(h) { return [Math.cos(h * D2R), Math.sin(h * D2R)]; }
      var u0 = u(h0), u1 = u(h1), u2 = u(h2), u3 = u(h3);
      var rx = -(L1 * u0[0] + L2 * u1[0]), ry = -(L1 * u0[1] + L2 * u1[1]);
      var det = u2[0] * u3[1] - u3[0] * u2[1];
      var L3 = (rx * u3[1] - u3[0] * ry) / det, L4 = (u2[0] * ry - rx * u2[1]) / det;
      var V0 = start, V1 = P(V0[0], V0[1], L1, h0), V2 = P(V1[0], V1[1], L2, h1), V3 = P(V2[0], V2[1], L3, h2);
      return { pts: [V0, V1, V2, V3], L3: L3, L4: L4 };
    },
    /** escala y centra una lista de puntos dentro de un rectángulo */
    fit: function (list, x, y, w, h) {
      var xs = list.map(function (p) { return p[0]; }), ys = list.map(function (p) { return p[1]; });
      var minx = Math.min.apply(null, xs), maxx = Math.max.apply(null, xs), miny = Math.min.apply(null, ys), maxy = Math.max.apply(null, ys);
      var k = Math.min(w / (maxx - minx || 1), h / (maxy - miny || 1));
      var ox = x + (w - (maxx - minx) * k) / 2, oy = y + (h - (maxy - miny) * k) / 2;
      return list.map(function (p) { return [ox + (p[0] - minx) * k, oy + (p[1] - miny) * k]; });
    },
    /** sector del ángulo interior en el vértice V de un polígono convexo */
    corner: function (V, Prev, Next, rad, cls) {
      var a1 = dir(V, Prev), a2 = dir(V, Next);
      if (norm(a2 - a1) > 180) { var t = a1; a1 = a2; a2 = t; }
      return { svg: F.sector(V, rad, a1, a2, cls), a1: a1, a2: a2 };
    },
    cornerLabel: function (V, Prev, Next, rad, t, cls) {
      var c = F.corner(V, Prev, Next, 0);
      return F.angLabel(V, rad, c.a1, c.a2, t, cls);
    },
    /** intersección de dos circunferencias (devuelve 0 o 2 puntos) */
    circleX: function (A, ra, B, rb) {
      var d = dist(A, B);
      if (d > ra + rb || d < Math.abs(ra - rb) || d === 0) return [];
      var a = (ra * ra - rb * rb + d * d) / (2 * d), h = Math.sqrt(Math.max(0, ra * ra - a * a));
      var mx = A[0] + a * (B[0] - A[0]) / d, my = A[1] + a * (B[1] - A[1]) / d;
      return [[mx + h * (B[1] - A[1]) / d, my - h * (B[0] - A[0]) / d], [mx - h * (B[1] - A[1]) / d, my + h * (B[0] - A[0]) / d]];
    },
    /** tarjeta de ángulo: vértice, dos lados, sector y medida */
    angleCard: function (x, y, deg, letter, cls) {
      var obt = deg > 90, V = [x + (obt ? 72 : 26), y + 96], L = obt ? 50 : 86, L2 = obt ? 60 : 72;
      var out = F.ray(V, [V[0] + L, V[1]], 'ln ln-thin') + F.ray(V, P(V[0], V[1], L2, deg), 'ln ln-thin');
      out += F.sector(V, 24, 0, deg, cls) + F.text(x + 10, y + 14, letter, 'lbl lbl-b', 'start');
      var lp = P(V[0], V[1], 44, deg / 2 + (deg < 20 ? 8 : 0));
      out += F.text(lp[0] + (deg < 20 ? 12 : 0), lp[1], deg + '°', 'lbl lbl-s');
      return out;
    },
    /** triángulo rectángulo con ángulo recto abajo-izquierda (o abajo-derecha si flip) */
    rtri: function (x, y, w, h, labs, flip, cls) {
      var C = [x, y], A = [x, y - h], B = [flip ? x - w : x + w, y];
      var out = F.poly([A, B, C], cls || 'shape');
      out += F.right(C, flip ? 90 : 0, 13);
      labs = labs || {};
      if (labs.v) out += F.text(flip ? x + 10 : x - 10, y - h / 2, labs.v, 'lbl lbl-s', flip ? 'start' : 'end');
      if (labs.h) out += F.text(flip ? x - w / 2 : x + w / 2, y + 16, labs.h, 'lbl lbl-s');
      if (labs.c) out += F.sideLabel(A, B, labs.c, flip ? -1 : 1, 18) ;
      return out;
    },
    /** dado con n puntos */
    die: function (n, x, y, s) {
      var o = s * 0.27, c = [x + s / 2, y + s / 2], m = {
        1: [[0, 0]], 2: [[-1, -1], [1, 1]], 3: [[-1, -1], [0, 0], [1, 1]], 4: [[-1, -1], [1, -1], [-1, 1], [1, 1]],
        5: [[-1, -1], [1, -1], [0, 0], [-1, 1], [1, 1]], 6: [[-1, -1], [1, -1], [-1, 0], [1, 0], [-1, 1], [1, 1]]
      }[n] || [];
      return '<rect class="die" x="' + x + '" y="' + y + '" width="' + s + '" height="' + s + '" rx="' + (s * 0.18) + '"/>' +
        m.map(function (q) { return '<circle class="pip" cx="' + r(c[0] + q[0] * o) + '" cy="' + r(c[1] + q[1] * o) + '" r="' + r(s * 0.085) + '"/>'; }).join('');
    }
  };

  /** Formas de cuadriláteros para tarjetas pequeñas (caja 64 × 48) */
  F.QUADS = {
    'Cuadrado': [[12, 4], [52, 4], [52, 44], [12, 44]],
    'Rectángulo': [[2, 10], [62, 10], [62, 40], [2, 40]],
    'Rombo': [[32, 2], [58, 24], [32, 46], [6, 24]],
    'Paralelogramo común': [[14, 8], [62, 8], [50, 42], [2, 42]],
    'Trapecio isósceles': [[16, 8], [48, 8], [62, 42], [2, 42]],
    'Trapecio rectángulo': [[4, 8], [40, 8], [62, 42], [4, 42]],
    'Trapecio escaleno': [[12, 8], [44, 8], [62, 42], [2, 42]],
    'Romboide': [[32, 2], [52, 18], [32, 46], [12, 18]],
    'Trapezoide común': [[22, 13], [53.2, 26], [22, 59.8], [3.8, 26]]
  };
  F.quadMini = function (name, x, y, w, h, diag, cls) {
    var q = F.fit(F.QUADS[name], x, y, w, h), out = F.poly(q, cls || 'shape');
    if (diag) out += F.seg(q[0], q[2], 'ln ln-dash ln-thin') + F.seg(q[1], q[3], 'ln ln-dash ln-thin');
    return out;
  };

  /** Íconos (24 × 24, trazo) */
  var IC = {
    angle: '<path d="M4 19h16M4 19L15 5"/><path d="M10.5 19a6.5 6.5 0 0 0-2.6-5.2"/>',
    cross: '<path d="M3 7l18 10M3 17L21 7M12 3v18"/>',
    bisector: '<path d="M4 19h16M4 19L13 4"/><path d="M4 19l15-8" stroke-dasharray="2.5 2.5"/>',
    triangle: '<path d="M12 4l9 15H3z"/><path d="M8 19a4 4 0 0 0-2-3.4"/>',
    compass: '<circle cx="12" cy="5" r="1.8"/><path d="M11 6.6L6 20M13 6.6L18 20M8.3 14h7.4"/>',
    pythag: '<path d="M7 17V9l10 8z"/><path d="M7 9H3v8h4M7 17v4h10v-4"/>',
    ramp: '<path d="M3 20h18M5 20L18 6v14"/><path d="M15 20v-3h3"/>',
    perp: '<path d="M3 15h18M12 3v18"/><path d="M12 12h3v3"/><circle cx="5" cy="15" r="1.4"/><circle cx="19" cy="15" r="1.4"/>',
    quad: '<path d="M5 6h14l2 12H3z"/>',
    diag: '<path d="M12 3l8 9-8 9-8-9z"/><path d="M12 3v18M4 12h16" stroke-dasharray="2 2"/>',
    dice: '<rect x="4" y="4" width="16" height="16" rx="3.5"/><circle cx="9" cy="9" r="1.3"/><circle cx="15" cy="15" r="1.3"/><circle cx="15" cy="9" r="1.3"/><circle cx="9" cy="15" r="1.3"/>',
    grid: '<path d="M4 4h16v16H4zM4 9.3h16M4 14.6h16M9.3 4v16M14.6 4v16"/>',
    area: '<path d="M4 19V5h9v6h7v8z"/><path d="M4 12h9M8.5 5v14M13 11v8M16.5 11v8M13 15h7" stroke-width="1"/>',
    rhombus: '<path d="M12 3l9 9-9 9-9-9z"/><path d="M3 12h18" stroke-dasharray="2 2"/>',
    crown: '<path d="M3 18l2-11 5 5 2-7 2 7 5-5 2 11z"/><path d="M3 21h18"/>',
    star: '<path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z"/>',
    lock: '<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>',
    check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
    x: '<path d="M6 6l12 12M18 6L6 18"/>',
    back: '<path d="M15 5l-7 7 7 7"/>',
    help: '<circle cx="12" cy="12" r="9"/><path d="M9.5 9.3a2.6 2.6 0 0 1 5 .9c0 1.8-2.5 2.2-2.5 3.8"/><circle cx="12" cy="17.2" r=".6"/>',
    trophy: '<path d="M8 4h8v5a4 4 0 0 1-8 0zM8 6H4.5a3 3 0 0 0 3.5 4M16 6h3.5a3 3 0 0 1-3.5 4M12 13v4M8 20h8M9.5 17h5v3h-5z"/>',
    report: '<path d="M6 3h9l4 4v14H6z"/><path d="M15 3v4h4M9 12h7M9 16h7M9 8h3"/>',
    bulb: '<path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-3.6 10.8c.6.5 1 1.3 1 2.2h5.2c0-.9.4-1.7 1-2.2A6 6 0 0 0 12 3z"/>',
    send: '<path d="M3 11l18-8-8 18-2-8z"/><path d="M11 13l10-10"/>',
    print: '<path d="M7 9V3h10v6M7 17H4v-7h16v7h-3M7 14h10v7H7z"/>',
    refresh: '<path d="M4 12a8 8 0 0 1 14-5.3L20 9M20 4v5h-5M20 12a8 8 0 0 1-14 5.3L4 15M4 20v-5h5"/>',
    play: '<path d="M8 5l11 7-11 7z"/>',
    medal: '<circle cx="12" cy="15" r="5.5"/><path d="M9 3l3 6 3-6M7 3h4M13 3h4"/><path d="M12 12.5l.9 1.8 2 .3-1.4 1.4.3 2-1.8-1-1.8 1 .3-2-1.4-1.4 2-.3z"/>',
    persist: '<path d="M4 18c3-8 6-11 8-11s3 3 2 5-4 3-4 1 4-6 10-6"/>',
    flag: '<path d="M5 21V4M5 4h11l-2 4 2 4H5"/>',
    map: '<path d="M3 6l6-2 6 2 6-2v14l-6 2-6-2-6 2z"/><path d="M9 4v14M15 6v14"/>',
    eye: '<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>'
  };
  F.icon = function (name, cls) {
    return '<svg class="ic ' + (cls || '') + '" viewBox="0 0 24 24" aria-hidden="true" focusable="false">' + (IC[name] || IC.star) + '</svg>';
  };

  global.F = F;
})(typeof window !== 'undefined' ? window : globalThis);
