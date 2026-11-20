/* =========================================================
   engine.js — Motor de desafíos
   - validate(ch, resp): validación pura (sin DOM), testeable.
   - correct(ch): devuelve una respuesta correcta (para pruebas).
   - render(ch, ctx): dibuja el desafío y devuelve un controlador.
   ========================================================= */
(function (global) {
  'use strict';
  var F = global.F;

  /* ---------------- utilidades ---------------- */
  function parseNum(s) {
    if (s == null) return null;
    s = String(s).trim().replace(/\s+/g, '');
    if (s === '') return null;
    s = s.replace(',', '.');
    if (!/^-?(\d+\.?\d*|\.\d+)$/.test(s)) return NaN;
    return parseFloat(s);
  }
  function fmt(n) { return String(Math.round(n * 100) / 100).replace('.', ','); }
  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;'); }
  function el(tag, cls, html) { var e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; }
  function accepted(a) { return Array.isArray(a) ? a : [a]; }
  function rowOps(ch, row, k) {
    if (row.ops) return Array.isArray(row.ops[0]) ? row.ops[k] : row.ops;
    return ch.ops;
  }
  function blanks(row) { return (row.t.match(/___/g) || []).length; }

  /** Área, perímetro y conexión de un conjunto de cuadraditos ["c,r", ...] */
  function polyomino(cells) {
    var set = {}; cells.forEach(function (k) { set[k] = true; });
    var n = cells.length, shared = 0;
    cells.forEach(function (k) {
      var p = k.split(',').map(Number);
      if (set[(p[0] + 1) + ',' + p[1]]) shared++;
      if (set[p[0] + ',' + (p[1] + 1)]) shared++;
    });
    var seen = {}, stack = n ? [cells[0]] : [];
    while (stack.length) {
      var k = stack.pop(); if (seen[k]) continue; seen[k] = true;
      var p = k.split(',').map(Number);
      [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(function (d) { var q = (p[0] + d[0]) + ',' + (p[1] + d[1]); if (set[q] && !seen[q]) stack.push(q); });
    }
    return { area: n, perim: 4 * n - 2 * shared, connected: n > 0 && Object.keys(seen).length === n };
  }
  function cmp(op, a, b) { return op === 'eq' ? a === b : op === 'lt' ? a < b : op === 'gt' ? a > b : op === 'le' ? a <= b : a >= b; }
  var OPTXT = { eq: 'igual a', lt: 'menor que', gt: 'mayor que', le: 'menor o igual que', ge: 'mayor o igual que' };

  function circumcenter(a, b, c) {
    var d = 2 * (a[0] * (b[1] - c[1]) + b[0] * (c[1] - a[1]) + c[0] * (a[1] - b[1]));
    var ux = ((a[0] * a[0] + a[1] * a[1]) * (b[1] - c[1]) + (b[0] * b[0] + b[1] * b[1]) * (c[1] - a[1]) + (c[0] * c[0] + c[1] * c[1]) * (a[1] - b[1])) / d;
    var uy = ((a[0] * a[0] + a[1] * a[1]) * (c[0] - b[0]) + (b[0] * b[0] + b[1] * b[1]) * (a[0] - c[0]) + (c[0] * c[0] + c[1] * c[1]) * (b[0] - a[0])) / d;
    return [ux, uy];
  }
  function d2(p, q) { return Math.hypot(p[0] - q[0], p[1] - q[1]); }
  function triPossible(a, b, c) { return c < a + b && a < b + c && b < a + c; }

  /* ---------------- VALIDACIÓN ---------------- */
  var EMPTY = { empty: true, msg: 'Completá todas las respuestas antes de comprobar.' };

  var V = {
    choice: function (ch, r) {
      if (r == null) return { empty: true, msg: 'Elegí una opción antes de comprobar.' };
      var o = ch.ops[r];
      return { ok: !!o.ok, msg: o.ok ? (o.fb || ch.fbOk || '¡Correcto!') : (o.fb || ch.fbMal || 'Revisá tu elección.'), parts: ch.ops.map(function (x, i) { return i === r ? !!o.ok : null; }) };
    },
    multi: function (ch, r) {
      r = r || [];
      if (!r.length) return { empty: true, msg: 'Marcá al menos una opción.' };
      var want = 0, missing = 0, extra = 0;
      ch.ops.forEach(function (o, i) { var sel = r.indexOf(i) >= 0; if (o.ok) { want++; if (!sel) missing++; } else if (sel) extra++; });
      var ok = !missing && !extra, msg;
      if (ok) msg = ch.fbOk || '¡Muy bien! Encontraste todas las correctas.';
      else {
        var p = [];
        if (extra) p.push(extra === 1 ? 'Marcaste una opción que no corresponde.' : 'Marcaste ' + extra + ' opciones que no corresponden.');
        if (missing) p.push(missing === 1 ? 'Te falta encontrar una opción correcta.' : 'Te faltan ' + missing + ' opciones correctas.');
        msg = p.join(' ') + (ch.fbMal ? ' ' + ch.fbMal : '');
      }
      return { ok: ok, msg: msg, parts: ch.ops.map(function (o, i) { return r.indexOf(i) >= 0 ? !!o.ok : null; }) };
    },
    number: function (ch, r) {
      r = r || [];
      var parts = [], first = null, okCount = 0;
      for (var i = 0; i < ch.campos.length; i++) {
        var f = ch.campos[i], x = r[i] || {}, v = parseNum(x.v);
        if (v == null) return EMPTY;
        if (isNaN(v)) return { empty: true, msg: 'En "' + f.et.replace(/<[^>]+>/g, '') + '" escribí solo números (podés usar coma decimal, por ejemplo 6,5).' };
        if (f.unidades && !x.u) return { empty: true, msg: 'Elegí la unidad de medida en "' + f.et.replace(/<[^>]+>/g, '') + '".' };
        var tol = f.tol != null ? f.tol : 0.001, numOk = Math.abs(v - f.ans) <= tol, unitOk = !f.unidades || x.u === f.unidad;
        var good = numOk && unitOk;
        parts.push(good);
        if (good) okCount++;
        else if (!first) {
          if (numOk && !unitOk) {
            var area = /²/.test(f.unidad);
            first = 'El número de "' + f.et.replace(/<[^>]+>/g, '') + '" es correcto, pero revisá la unidad: ' +
              (area ? 'el área se mide en unidades cuadradas (' + f.unidad + ').' : 'las longitudes se miden en unidades lineales (' + f.unidad + '), no cuadradas.');
          } else {
            var m = (f.mal || []).filter(function (w) { return Math.abs(w.v - v) <= Math.max(0.011, tol); })[0];
            first = m ? m.fb : 'Revisá "' + f.et.replace(/<[^>]+>/g, '') + '". ' + (ch.fbMal || '');
          }
        }
      }
      var ok = okCount === ch.campos.length;
      var msg = ok ? (ch.fbOk || '¡Excelente! Todos los resultados son correctos.') :
        (ch.campos.length > 1 ? 'Tenés ' + okCount + ' de ' + ch.campos.length + ' correctos. ' : '') + first;
      return { ok: ok, msg: msg.trim(), parts: parts };
    },
    classify: function (ch, r) {
      r = r || [];
      if (r.length < ch.items.length || r.some(function (x) { return x == null; })) return { empty: true, msg: 'Ubicá todos los elementos en una categoría.' };
      var parts = ch.items.map(function (it, i) { return r[i] === it.cat; }), good = parts.filter(Boolean).length;
      var ok = good === ch.items.length, firstBad = ch.items.filter(function (it, i) { return !parts[i]; })[0];
      return { ok: ok, parts: parts, msg: ok ? (ch.fbOk || '¡Perfecto! Clasificaste todo correctamente.') :
        'Tenés ' + good + ' de ' + ch.items.length + ' bien ubicados. ' + ((firstBad && firstBad.fb) || ch.fbMal || 'Revisá los marcados con ✗.') };
    },
    select: function (ch, r) {
      r = r || [];
      var parts = [], good = 0, firstFb = null;
      for (var i = 0; i < ch.filas.length; i++) {
        var row = ch.filas[i], nb = blanks(row), vals = r[i] || [];
        for (var k = 0; k < nb; k++) if (!vals[k]) return EMPTY;
        var rowOk = true;
        for (k = 0; k < nb; k++) if (accepted(row.ans[k]).indexOf(vals[k]) < 0) rowOk = false;
        parts.push(rowOk);
        if (rowOk) good++; else if (!firstFb && row.fb) firstFb = row.fb;
      }
      var ok = good === ch.filas.length;
      return { ok: ok, parts: parts, msg: ok ? (ch.fbOk || '¡Muy bien! Todo es correcto.') :
        (ch.filas.length > 1 ? 'Tenés ' + good + ' de ' + ch.filas.length + ' correctas. ' : '') + (firstFb || ch.fbMal || 'Revisá las marcadas con ✗.') };
    },
    order: function (ch, r) {
      r = r || [];
      var parts = r.map(function (v, i) { return v === i; }), good = parts.filter(Boolean).length, ok = good === ch.pasos.length;
      return { ok: ok, parts: parts, msg: ok ? (ch.fbOk || '¡Exacto! Ese es el orden correcto.') : 'Hay ' + good + ' de ' + ch.pasos.length + ' pasos en su lugar. ' + (ch.fbMal || 'Pensá qué se necesita tener hecho antes de cada paso.') };
    },
    grid: function (ch, r) {
      r = r || [];
      if (!r.length) return { empty: true, msg: 'Pintá al menos un cuadradito.' };
      var g = polyomino(r);
      if (!g.connected) return { ok: false, msg: 'Tu figura tiene partes separadas. Los cuadraditos tienen que estar unidos por sus lados (no solo por una esquina).', info: g };
      var probs = [];
      if (ch.cond.area && !cmp(ch.cond.area[0], g.area, ch.cond.area[1])) probs.push('el área tiene que ser ' + OPTXT[ch.cond.area[0]] + ' ' + ch.cond.area[1] + ' cuadraditos (tu figura tiene ' + g.area + ')');
      if (ch.cond.perim && !cmp(ch.cond.perim[0], g.perim, ch.cond.perim[1])) probs.push('el perímetro tiene que ser ' + OPTXT[ch.cond.perim[0]] + ' ' + ch.cond.perim[1] + ' (tu figura tiene ' + g.perim + ' lados de cuadradito)');
      if (!probs.length) return { ok: true, info: g, msg: '¡Lo lograste! Tu figura tiene área ' + g.area + ' y perímetro ' + g.perim + '.' };
      return { ok: false, info: g, msg: 'Casi: ' + probs.join(' y ') + '.' };
    },
    triangle: function (ch, r) {
      if (r == null) return EMPTY;
      var c = Number(r), can = triPossible(ch.a, ch.b, c), ok;
      if (ch.meta === 'imposible') {
        ok = !can;
        return { ok: ok, msg: ok ? '¡Muy bien! Con c = ' + fmt(c) + ' cm los arcos no se cortan: ' + (c >= ch.a + ch.b ? fmt(c) + ' ≥ ' + ch.a + ' + ' + ch.b : ch.a + ' ≥ ' + ch.b + ' + ' + fmt(c)) + '.' :
          'Con c = ' + fmt(c) + ' cm los arcos sí se cortan y se forma un triángulo. Buscá una medida con la que no se puedan cortar.' };
      }
      ok = can && (Math.abs(c - ch.a) < 1e-9 || Math.abs(c - ch.b) < 1e-9);
      return { ok: ok, msg: ok ? '¡Excelente! Lados ' + ch.a + ', ' + ch.b + ' y ' + fmt(c) + ' cm: dos lados iguales, es isósceles.' :
        (!can ? 'Con c = ' + fmt(c) + ' cm no se puede construir el triángulo.' : 'Con c = ' + fmt(c) + ' cm los tres lados son distintos: es escaleno.') };
    },
    point: function (ch, r) {
      if (!r) return EMPTY;
      var da = d2(r, ch.a), db = d2(r, ch.b), dc = d2(r, ch.c), mx = Math.max(da, db, dc), mn = Math.min(da, db, dc);
      var ok = mx - mn <= ch.tol;
      return { ok: ok, msg: ok ? '¡Lo encontraste! d está a ' + fmt((da + db + dc) / 3) + ' cm de a, b y c.' :
        'Todavía no: las distancias son ' + fmt(da) + ', ' + fmt(db) + ' y ' + fmt(dc) + ' cm. Acercá d al punto que quede en el medio de los tres.' };
    },
    self: function () { return { ok: true, graded: false, msg: '¡Autoevaluación registrada!' }; }
  };

  function validate(ch, resp) { var fn = V[ch.tipo]; if (!fn) throw new Error('Tipo desconocido: ' + ch.tipo); return fn(ch, resp); }

  /** respuesta correcta (para las pruebas automáticas) */
  function correct(ch) {
    switch (ch.tipo) {
      case 'choice': return ch.ops.findIndex(function (o) { return o.ok; });
      case 'multi': return ch.ops.map(function (o, i) { return o.ok ? i : -1; }).filter(function (i) { return i >= 0; });
      case 'number': return ch.campos.map(function (f) { return { v: fmt(f.ans), u: f.unidad || null }; });
      case 'classify': return ch.items.map(function (it) { return it.cat; });
      case 'select': return ch.filas.map(function (row) { return row.ans.map(function (a) { return accepted(a)[0]; }); });
      case 'order': return ch.pasos.map(function (_, i) { return i; });
      case 'grid': return ch.cond.perim && ch.cond.perim[0] === 'lt' ? ['0,0', '1,0', '2,0', '0,1', '1,1', '2,1'] : ['0,0', '1,0', '2,0', '3,0', '4,0', '5,0', '6,0', '7,0'];
      case 'triangle': return ch.meta === 'imposible' ? ch.a + ch.b : ch.a;
      case 'point': return circumcenter(ch.a, ch.b, ch.c);
      case 'self': return [];
    }
    return null;
  }

  /* ---------------- RENDER ---------------- */
  function markEl(host, state) {
    host.classList.remove('is-ok', 'is-bad');
    var m = host.querySelector('.mk');
    if (!m) { m = el('span', 'mk'); host.appendChild(m); }
    if (state === true) { host.classList.add('is-ok'); m.innerHTML = F.icon('check') + '<span class="sr">correcto</span>'; }
    else if (state === false) { host.classList.add('is-bad'); m.innerHTML = F.icon('x') + '<span class="sr">incorrecto</span>'; }
    else m.innerHTML = '';
  }

  var R = {};

  R.choice = function (ch, ctx) {
    var sel = null, box = el('div', 'opts'), btns = [];
    box.setAttribute('role', 'radiogroup'); box.setAttribute('aria-label', 'Opciones de respuesta');
    ch.ops.forEach(function (o, i) {
      var b = el('button', 'opt', '<span class="opt-l">' + 'ABCDEFG'[i] + '</span><span class="opt-t">' + o.t + '</span>');
      b.type = 'button'; b.setAttribute('role', 'radio'); b.setAttribute('aria-checked', 'false'); b.tabIndex = i === 0 ? 0 : -1;
      b.addEventListener('click', function () { pick(i); });
      b.addEventListener('keydown', function (e) {
        var k = e.key, j = null;
        if (k === 'ArrowDown' || k === 'ArrowRight') j = (i + 1) % btns.length;
        if (k === 'ArrowUp' || k === 'ArrowLeft') j = (i - 1 + btns.length) % btns.length;
        if (j != null) { e.preventDefault(); pick(j); btns[j].focus(); }
      });
      btns.push(b); box.appendChild(b);
    });
    function pick(i) {
      if (box.classList.contains('locked')) return;
      sel = i; btns.forEach(function (b, j) { b.setAttribute('aria-checked', j === i ? 'true' : 'false'); b.tabIndex = j === i ? 0 : -1; markEl(b, null); });
      ctx.changed();
    }
    ctx.ans.appendChild(box);
    return {
      get: function () { return sel; },
      lock: function (v) { box.classList.toggle('locked', v); btns.forEach(function (b) { b.disabled = v; }); },
      mark: function (res) { (res.parts || []).forEach(function (p, i) { markEl(btns[i], p); }); },
      reveal: function () { ch.ops.forEach(function (o, i) { if (o.ok) btns[i].classList.add('is-reveal'); }); },
      clearMarks: function () { btns.forEach(function (b) { markEl(b, null); }); },
      focus: function () { btns[0].focus(); }
    };
  };

  R.multi = function (ch, ctx) {
    var sel = [], box = el('div', 'opts opts-multi'), btns = [];
    box.setAttribute('role', 'group'); box.setAttribute('aria-label', 'Marcá todas las opciones correctas');
    ch.ops.forEach(function (o, i) {
      var b = el('button', 'opt', '<span class="opt-box" aria-hidden="true"></span><span class="opt-t">' + o.t + '</span>');
      b.type = 'button'; b.setAttribute('aria-pressed', 'false');
      b.addEventListener('click', function () {
        var k = sel.indexOf(i); if (k >= 0) sel.splice(k, 1); else sel.push(i);
        b.setAttribute('aria-pressed', k >= 0 ? 'false' : 'true'); markEl(b, null); ctx.changed();
      });
      btns.push(b); box.appendChild(b);
    });
    ctx.ans.appendChild(box);
    return {
      get: function () { return sel.slice().sort(); },
      lock: function (v) { btns.forEach(function (b) { b.disabled = v; }); },
      mark: function (res) { (res.parts || []).forEach(function (p, i) { markEl(btns[i], p); }); },
      reveal: function () { ch.ops.forEach(function (o, i) { if (o.ok) btns[i].classList.add('is-reveal'); }); },
      clearMarks: function () { btns.forEach(function (b) { markEl(b, null); }); },
      focus: function () { btns[0].focus(); }
    };
  };

  R.number = function (ch, ctx) {
    var box = el('div', 'nfields'), rows = [];
    ch.campos.forEach(function (f, i) {
      var id = 'nf-' + ch.id + '-' + i, row = el('div', 'nf');
      var unit = f.unidades ? '<select class="unit" aria-label="Unidad de ' + esc(f.et.replace(/<[^>]+>/g, '')) + '"><option value="">unidad…</option>' +
        f.unidades.map(function (u) { return '<option>' + u + '</option>'; }).join('') + '</select>' : (f.suf ? '<span class="nf-suf">' + f.suf + '</span>' : '');
      row.innerHTML = '<label class="nf-et" for="' + id + '">' + f.et + '</label><span class="nf-in"><input id="' + id + '" type="text" inputmode="decimal" autocomplete="off" spellcheck="false">' + unit + '</span>';
      var inp = row.querySelector('input'), us = row.querySelector('select');
      inp.addEventListener('input', function () { markEl(row, null); ctx.changed(); });
      inp.addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); ctx.submit(); } });
      if (us) us.addEventListener('change', function () { markEl(row, null); ctx.changed(); });
      rows.push({ row: row, inp: inp, us: us }); box.appendChild(row);
    });
    ctx.ans.appendChild(box);
    return {
      get: function () { return rows.map(function (r) { return { v: r.inp.value, u: r.us ? r.us.value : null }; }); },
      lock: function (v) { rows.forEach(function (r) { r.inp.readOnly = v; if (r.us) r.us.disabled = v; }); },
      mark: function (res) { (res.parts || []).forEach(function (p, i) { markEl(rows[i].row, p); }); },
      reveal: function () { ch.campos.forEach(function (f, i) { rows[i].inp.value = fmt(f.ans); if (rows[i].us) rows[i].us.value = f.unidad; rows[i].row.classList.add('is-reveal'); }); },
      clearMarks: function () { rows.forEach(function (r) { markEl(r.row, null); }); },
      focus: function () { rows[0].inp.focus(); }
    };
  };

  R.classify = function (ch, ctx) {
    var vals = ch.items.map(function () { return null; }), rows = [];
    var two = ch.items.length > 5 && ctx.wide;
    var box = el('div', 'cl-list' + (two ? ' two-col' : ''));
    ch.items.forEach(function (it, i) {
      var row = el('div', 'cl-row'), label = it.mini ? F.svg(64, 48, F.quadMini(it.mini, 2, 2, 60, 44, false, 'shape shape-sky'), it.mini, 'mini') : '';
      row.innerHTML = '<div class="cl-t">' + label + '<span>' + it.t + '</span></div>';
      var seg = el('div', 'seg'); seg.setAttribute('role', 'group'); seg.setAttribute('aria-label', it.t.replace(/<[^>]+>/g, ''));
      ch.cats.forEach(function (c) {
        var b = el('button', 'seg-b', c); b.type = 'button'; b.setAttribute('aria-pressed', 'false');
        b.addEventListener('click', function () {
          vals[i] = c; seg.querySelectorAll('button').forEach(function (x) { x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); });
          markEl(row, null); ctx.changed();
        });
        seg.appendChild(b);
      });
      row.appendChild(seg); rows.push(row); box.appendChild(row);
    });
    ctx.ans.appendChild(box);
    return {
      get: function () { return vals.slice(); },
      lock: function (v) { box.querySelectorAll('button').forEach(function (b) { b.disabled = v; }); },
      mark: function (res) { (res.parts || []).forEach(function (p, i) { markEl(rows[i], p); }); },
      reveal: function () { ch.items.forEach(function (it, i) { rows[i].querySelectorAll('button').forEach(function (b) { if (b.textContent === it.cat) b.classList.add('is-reveal'); }); }); },
      clearMarks: function () { rows.forEach(function (r) { markEl(r, null); }); },
      focus: function () { var b = box.querySelector('button'); if (b) b.focus(); }
    };
  };

  R.select = function (ch, ctx) {
    var box = el('div', 'sel-list' + (ctx.wide && ch.filas.length > 6 ? ' two-col' : '')), rows = [];
    ch.filas.forEach(function (row, i) {
      var parts = row.t.split('___'), d = el('div', 'sel-row'), html = '';
      parts.forEach(function (p, k) {
        html += '<span>' + p + '</span>';
        if (k < parts.length - 1) {
          html += '<select data-k="' + k + '" aria-label="Respuesta ' + (k + 1) + ' de la fila ' + (i + 1) + '"><option value="">elegí…</option>' +
            rowOps(ch, row, k).map(function (o) { return '<option>' + esc(o) + '</option>'; }).join('') + '</select>';
        }
      });
      d.innerHTML = '<div class="sel-t">' + html + '</div>';
      d.querySelectorAll('select').forEach(function (s) { s.addEventListener('change', function () { markEl(d, null); ctx.changed(); }); });
      rows.push(d); box.appendChild(d);
    });
    ctx.ans.appendChild(box);
    return {
      get: function () { return rows.map(function (d) { return Array.prototype.map.call(d.querySelectorAll('select'), function (s) { return s.value; }); }); },
      lock: function (v) { box.querySelectorAll('select').forEach(function (s) { s.disabled = v; }); },
      mark: function (res) { (res.parts || []).forEach(function (p, i) { markEl(rows[i], p); }); },
      reveal: function () { ch.filas.forEach(function (row, i) { rows[i].querySelectorAll('select').forEach(function (s, k) { s.value = accepted(row.ans[k])[0]; }); rows[i].classList.add('is-reveal'); }); },
      clearMarks: function () { rows.forEach(function (r) { markEl(r, null); }); },
      focus: function () { var s = box.querySelector('select'); if (s) s.focus(); }
    };
  };

  R.order = function (ch, ctx) {
    var order = (ch.inicio || ch.pasos.map(function (_, i) { return ch.pasos.length - 1 - i; })).slice();
    var box = el('ol', 'order'), locked = false;
    function draw(focusIdx, dirn) {
      box.innerHTML = '';
      order.forEach(function (stepIdx, pos) {
        var li = el('li', 'order-i');
        li.innerHTML = '<span class="order-n">' + (pos + 1) + '</span><span class="order-t">' + ch.pasos[stepIdx] + '</span>' +
          '<span class="order-btns"><button type="button" class="ib up" aria-label="Subir este paso"' + (pos === 0 || locked ? ' disabled' : '') + '>▲</button>' +
          '<button type="button" class="ib dn" aria-label="Bajar este paso"' + (pos === order.length - 1 || locked ? ' disabled' : '') + '>▼</button></span>';
        li.querySelector('.up').addEventListener('click', function () { move(pos, -1); });
        li.querySelector('.dn').addEventListener('click', function () { move(pos, 1); });
        box.appendChild(li);
      });
      if (focusIdx != null) {
        var li = box.children[focusIdx], b = li && li.querySelector(dirn < 0 ? '.up' : '.dn');
        if (b && b.disabled) b = li.querySelector(dirn < 0 ? '.dn' : '.up');
        if (b) b.focus();
      }
    }
    function move(pos, d) {
      var j = pos + d; if (j < 0 || j >= order.length || locked) return;
      var t = order[pos]; order[pos] = order[j]; order[j] = t; draw(j, d); ctx.changed();
    }
    draw();
    ctx.ans.appendChild(box);
    return {
      get: function () { return order.slice(); },
      lock: function (v) { locked = v; draw(); },
      mark: function (res) { (res.parts || []).forEach(function (p, i) { markEl(box.children[i], p); }); },
      reveal: function () { order = ch.pasos.map(function (_, i) { return i; }); draw(); Array.prototype.forEach.call(box.children, function (li) { li.classList.add('is-reveal'); }); },
      clearMarks: function () { Array.prototype.forEach.call(box.children, function (li) { markEl(li, null); }); },
      focus: function () { var b = box.querySelector('button:not([disabled])'); if (b) b.focus(); }
    };
  };

  R.grid = function (ch, ctx) {
    var cells = {}, focus = [0, 0], locked = false;
    var wrap = el('div', 'gridwrap'), board = el('div', 'gridboard');
    board.style.gridTemplateColumns = 'repeat(' + ch.cols + ', 1fr)';
    board.style.aspectRatio = ch.cols + ' / ' + ch.rows;
    board.setAttribute('role', 'grid'); board.setAttribute('aria-label', 'Cuadrícula de ' + ch.cols + ' columnas y ' + ch.rows + ' filas. Usá las flechas para moverte y la barra espaciadora para pintar.');
    var btn = {};
    for (var r = 0; r < ch.rows; r++) for (var c = 0; c < ch.cols; c++) (function (c, r) {
      var b = el('button', 'gcell'); b.type = 'button'; b.tabIndex = (c === 0 && r === 0) ? 0 : -1;
      b.setAttribute('aria-pressed', 'false'); b.setAttribute('aria-label', 'Fila ' + (r + 1) + ', columna ' + (c + 1));
      b.addEventListener('click', function () { toggle(c, r); });
      b.addEventListener('keydown', function (e) {
        var m = { ArrowRight: [1, 0], ArrowLeft: [-1, 0], ArrowDown: [0, 1], ArrowUp: [0, -1] }[e.key];
        if (m) { e.preventDefault(); var nc = Math.min(ch.cols - 1, Math.max(0, c + m[0])), nr = Math.min(ch.rows - 1, Math.max(0, r + m[1])); btn[c + ',' + r].tabIndex = -1; var nb = btn[nc + ',' + nr]; nb.tabIndex = 0; nb.focus(); }
      });
      btn[c + ',' + r] = b; board.appendChild(b);
    })(c, r);
    function toggle(c, r) {
      if (locked) return;
      var k = c + ',' + r; if (cells[k]) delete cells[k]; else cells[k] = true;
      btn[k].setAttribute('aria-pressed', cells[k] ? 'true' : 'false'); live(); ctx.changed();
    }
    var bar = el('div', 'gridbar');
    bar.innerHTML = '<span class="chip chip-paper" aria-live="polite">Área de tu figura: <b class="g-area">0</b> cuadraditos</span><button type="button" class="btn btn-small btn-ghost-dark g-clear">Borrar todo</button>';
    bar.querySelector('.g-clear').addEventListener('click', function () { if (locked) return; cells = {}; Object.keys(btn).forEach(function (k) { btn[k].setAttribute('aria-pressed', 'false'); }); live(); ctx.changed(); });
    function live() { bar.querySelector('.g-area').textContent = Object.keys(cells).length; }
    wrap.appendChild(board); wrap.appendChild(bar);
    ctx.fig.appendChild(wrap);
    // referencia
    var refs = ch.ref ? '<div class="refbox"><div class="ref-t">Figura rosa (referencia)</div>' +
      F.svg(4 * 30 + 8, 3 * 30 + 8, F.cells(ch.ref, 4, 4, 30, 'cell cell-pink'), 'Figura rosa de referencia: cruz de 6 cuadraditos.') +
      '<div class="ref-d">Área: <b>6</b> cuadraditos<br>Perímetro: <b>14</b> lados</div></div>' : '';
    ctx.ans.insertAdjacentHTML('beforeend', refs);
    return {
      get: function () { return Object.keys(cells); },
      lock: function (v) { locked = v; board.classList.toggle('locked', v); },
      mark: function (res) { board.classList.toggle('is-ok', !!res.ok); board.classList.toggle('is-bad', !res.ok); },
      reveal: function () {
        cells = {}; correct(ch).forEach(function (k) { cells[k] = true; });
        Object.keys(btn).forEach(function (k) { btn[k].setAttribute('aria-pressed', cells[k] ? 'true' : 'false'); }); live(); board.classList.add('is-reveal');
      },
      clearMarks: function () { board.classList.remove('is-ok', 'is-bad'); },
      focus: function () { btn['0,0'].focus(); }
    };
  };

  R.triangle = function (ch, ctx) {
    var c = ch.inicial, s = 30, L = [70, 250], Rr = [70 + ch.a * s, 250];
    var fig = el('div', 'tri-fig'); ctx.fig.appendChild(fig);
    var panel = el('div', 'tri-panel');
    var sid = 'tri-' + ch.id;
    panel.innerHTML = '<div class="tri-fixed"><span class="chip chip-coral">a = ' + ch.a + ' cm (fijo)</span> <span class="chip chip-violet">b = ' + ch.b + ' cm (fijo)</span></div>' +
      '<label class="tri-lab" for="' + sid + '">Lado <b>c</b> = <output class="tri-out">' + fmt(c) + '</output> cm</label>' +
      '<div class="tri-range"><button type="button" class="ib tri-m" aria-label="Disminuir c">−</button><input id="' + sid + '" type="range" min="' + ch.min + '" max="' + ch.max + '" step="' + ch.paso + '" value="' + c + '"><button type="button" class="ib tri-p" aria-label="Aumentar c">+</button></div>' +
      '<p class="tri-st" aria-live="polite"></p>';
    ctx.ans.appendChild(panel);
    var inp = panel.querySelector('input'), out = panel.querySelector('.tri-out'), st = panel.querySelector('.tri-st');
    function draw() {
      var X = F.circleX(L, c * s, Rr, ch.b * s), o = '';
      o += '<defs><clipPath id="clip-' + ch.id + '"><rect x="0" y="0" width="460" height="290"/></clipPath></defs><g clip-path="url(#clip-' + ch.id + ')">';
      o += F.circle(L, c * s, 'arcl arc-green') + F.circle(Rr, ch.b * s, 'arcl arc-violet') + '</g>';
      o += F.seg(L, Rr, 'ln ln-coral ln-thick') + F.text((L[0] + Rr[0]) / 2, 270, 'a = ' + ch.a + ' cm', 'lbl lbl-s lbl-coral');
      o += F.dot(L, '', 0, 0) + F.dot(Rr, '', 0, 0);
      if (X.length && triPossible(ch.a, ch.b, c)) {
        var T = X[0][1] < X[1][1] ? X[0] : X[1];
        o += F.poly([L, Rr, T], 'shape shape-amber-soft') + F.seg(L, T, 'ln ln-green ln-thick') + F.seg(Rr, T, 'ln ln-violet ln-thick') + F.dot(T, '', 0, 0);
        st.textContent = 'Los arcos se cortan: se puede construir el triángulo.';
      } else st.textContent = 'Los arcos no se cortan en un punto fuera del segmento: no se forma un triángulo.';
      fig.innerHTML = F.svg(460, 290, o, 'Compás virtual: segmento a de ' + ch.a + ' cm, arco de radio c = ' + fmt(c) + ' cm y arco de radio b = ' + ch.b + ' cm.');
      out.textContent = fmt(c);
    }
    function set(v) { c = Math.min(ch.max, Math.max(ch.min, Math.round(v / ch.paso) * ch.paso)); inp.value = c; draw(); ctx.changed(); }
    inp.addEventListener('input', function () { set(parseFloat(inp.value)); });
    panel.querySelector('.tri-m').addEventListener('click', function () { set(c - ch.paso); });
    panel.querySelector('.tri-p').addEventListener('click', function () { set(c + ch.paso); });
    draw();
    return {
      get: function () { return c; },
      lock: function (v) { inp.disabled = v; panel.querySelectorAll('button').forEach(function (b) { b.disabled = v; }); },
      mark: function () { }, clearMarks: function () { },
      reveal: function () { set(correct(ch)); },
      focus: function () { inp.focus(); }
    };
  };

  R.point = function (ch, ctx) {
    var s = 40, pad = 20, W = ch.tam[0] * s + 2 * pad, H = ch.tam[1] * s + 2 * pad, p = ch.inicial.slice(), locked = false, showMed = false;
    function px(q) { return [pad + q[0] * s, pad + q[1] * s]; }
    var fig = el('div', 'pt-fig'); ctx.fig.appendChild(fig);
    var panel = el('div', 'pt-panel');
    panel.innerHTML = '<table class="pt-tab"><caption class="sr">Distancias del punto d</caption><tbody>' +
      '<tr><th>d → a</th><td class="pa"></td></tr><tr><th>d → b</th><td class="pb"></td></tr><tr><th>d → c</th><td class="pc"></td></tr></tbody></table>' +
      '<p class="pt-help">Las distancias se miden como con una regla. Buscá que las tres sean iguales.</p>';
    ctx.ans.appendChild(panel);
    function draw() {
      var o = F.grid(pad, pad, ch.tam[0], ch.tam[1], s, 'gridl');
      if (showMed) {
        [[ch.a, ch.b], [ch.b, ch.c]].forEach(function (pr) {
          var m = [(pr[0][0] + pr[1][0]) / 2, (pr[0][1] + pr[1][1]) / 2], dx = pr[1][0] - pr[0][0], dy = pr[1][1] - pr[0][1], k = 12 / Math.hypot(dx, dy);
          o += F.seg(px([m[0] - dy * k, m[1] + dx * k]), px([m[0] + dy * k, m[1] - dx * k]), 'ln ln-violet ln-dash');
        });
      }
      var P = px(p);
      [['a', ch.a], ['b', ch.b], ['c', ch.c]].forEach(function (q) { var Q = px(q[1]); o += F.seg(P, Q, 'ln ln-thin ln-gray') + F.dot(Q, q[0], 0, -14, 'dot dot-amber'); });
      o += '<g class="pt-d" tabindex="0" role="button" aria-label="Punto d. Usá las flechas del teclado para moverlo."><circle class="pt-halo" cx="' + P[0] + '" cy="' + P[1] + '" r="16"/><circle class="dot dot-violet" cx="' + P[0] + '" cy="' + P[1] + '" r="7"/></g>' + F.text(P[0] + 14, P[1] + 14, 'd', 'lbl lbl-b lbl-violet');
      var hadFocus = document.activeElement && document.activeElement.classList && document.activeElement.classList.contains('pt-d');
      fig.innerHTML = F.svg(W, H, o, 'Plano cuadriculado con los puntos a, b y c y el punto móvil d.');
      var svg = fig.querySelector('svg'), g = svg.querySelector('.pt-d');
      g.addEventListener('keydown', key);
      svg.addEventListener('pointerdown', down);
      if (hadFocus) g.focus();
      var da = d2(p, ch.a), db = d2(p, ch.b), dc = d2(p, ch.c);
      panel.querySelector('.pa').textContent = fmt(da) + ' cm'; panel.querySelector('.pb').textContent = fmt(db) + ' cm'; panel.querySelector('.pc').textContent = fmt(dc) + ' cm';
    }
    function toCm(e) {
      var svg = fig.querySelector('svg'), pt = svg.createSVGPoint(); pt.x = e.clientX; pt.y = e.clientY;
      var q = pt.matrixTransform(svg.getScreenCTM().inverse());
      return [Math.min(ch.tam[0], Math.max(0, (q.x - pad) / s)), Math.min(ch.tam[1], Math.max(0, (q.y - pad) / s))];
    }
    function down(e) {
      if (locked) return; e.preventDefault();
      p = toCm(e); draw(); ctx.changed();
      var svg = fig.querySelector('svg');
      function mv(ev) { p = toCm(ev); draw(); }
      function up() { window.removeEventListener('pointermove', mv); window.removeEventListener('pointerup', up); ctx.changed(); }
      window.addEventListener('pointermove', mv); window.addEventListener('pointerup', up);
    }
    function key(e) {
      if (locked) return;
      var st = e.shiftKey ? 0.5 : 0.1, m = { ArrowRight: [st, 0], ArrowLeft: [-st, 0], ArrowDown: [0, st], ArrowUp: [0, -st] }[e.key];
      if (m) { e.preventDefault(); p = [Math.min(ch.tam[0], Math.max(0, p[0] + m[0])), Math.min(ch.tam[1], Math.max(0, p[1] + m[1]))]; draw(); ctx.changed(); }
    }
    draw();
    return {
      get: function () { return p.slice(); },
      lock: function (v) { locked = v; },
      mark: function () { }, clearMarks: function () { },
      onHint: function () { showMed = true; draw(); },
      reveal: function () { p = correct(ch); showMed = true; draw(); },
      focus: function () { var g = fig.querySelector('.pt-d'); if (g) g.focus(); }
    };
  };

  /** Juego "Cazadores de figuras" */
  R.hunt = function (ch, ctx) {
    var fx = ch.ficha, s = 30, pad = 6, used = {}, round = 0, phase = 'roll', die = null, opt = null, tries = 0, pts = 0;
    var res = { n: 0, s1: 0, s2: 0, w: 0 };
    var geo = fx.figuras.map(function (f) { return polyomino(f.celdas.map(function (c) { return c[0] + ',' + c[1]; })); });
    var fig = el('div', 'hunt-fig'); ctx.fig.appendChild(fig);
    var panel = el('div', 'hunt-panel'); ctx.ans.appendChild(panel);
    function target() { return opt === 'A' ? (die + 1) * 2 : die; }
    function fits(i) { return opt === 'A' ? geo[i].perim === target() : geo[i].area === target(); }
    function avail() { return fx.figuras.map(function (_, i) { return i; }).filter(function (i) { return !used[i] && fits(i); }); }
    function drawBoard(hl) {
      var o = F.grid(pad, pad, fx.cols, fx.rows, s, 'gridl');
      fx.figuras.forEach(function (f, i) {
        var cls = 'hshape' + (used[i] ? ' used' : '') + (hl === i ? ' hl' : '');
        o += '<g class="' + cls + '" data-i="' + i + '" ' + (used[i] || phase !== 'find' ? '' : 'tabindex="0" role="button" ') + 'aria-label="Figura ' + f.nombre + (used[i] ? ' (tachada)' : '') + '">';
        f.celdas.forEach(function (c) { o += '<rect x="' + (pad + c[0] * s) + '" y="' + (pad + c[1] * s) + '" width="' + s + '" height="' + s + '" fill="' + f.color + '"/>'; });
        if (used[i]) { var c0 = f.celdas[0], c1 = f.celdas[f.celdas.length - 1]; o += '<line class="xline" x1="' + (pad + c0[0] * s + 4) + '" y1="' + (pad + c0[1] * s + 4) + '" x2="' + (pad + (c1[0] + 1) * s - 4) + '" y2="' + (pad + (c1[1] + 1) * s - 4) + '"/>'; }
        o += '</g>';
      });
      fig.innerHTML = F.svg(fx.cols * s + 2 * pad, fx.rows * s + 2 * pad, o, 'Ficha Cazadores de figuras con ' + fx.figuras.length + ' figuras de colores sobre cuadrícula.', 'hunt-svg' + (phase === 'find' ? ' finding' : ''));
      fig.querySelectorAll('g.hshape[role=button]').forEach(function (g) {
        var i = +g.getAttribute('data-i');
        g.addEventListener('click', function () { choose(i); });
        g.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); choose(i); } });
      });
    }
    function say(html, kind) { var m = panel.querySelector('.hunt-msg'); m.className = 'hunt-msg ' + (kind || ''); m.innerHTML = html; }
    function drawPanel() {
      var h = '<div class="hunt-top"><span class="chip chip-paper">Tirada <b>' + Math.min(round + (phase === 'roll' ? 1 : 0) || 1, ch.rondas) + '</b> de ' + ch.rondas + '</span><span class="chip chip-amber">Puntos del juego: <b>' + pts + '</b></span></div>';
      h += '<div class="hunt-die">' + (die ? F.svg(70, 70, F.die(die, 5, 5, 60), 'Dado: salió ' + die) : F.svg(70, 70, '<rect class="die die-empty" x="5" y="5" width="60" height="60" rx="11"/>', 'Dado sin tirar')) + '<div class="hunt-dtxt">' + (die ? 'Salió <b>' + die + '</b>' : 'Tirá el dado') + '</div></div>';
      if (phase === 'roll') h += '<button type="button" class="btn btn-primary h-roll">' + F.icon('dice') + ' Tirar el dado</button>';
      if (phase === 'choose') h += '<div class="hunt-opts"><button type="button" class="opt h-a"><span class="opt-l">A</span><span class="opt-t"><b>Contorno</b> de (' + die + ' + 1) × 2 = <b>' + (die + 1) * 2 + '</b> lados · 2 puntos</span></button>' +
        '<button type="button" class="opt h-b"><span class="opt-l">B</span><span class="opt-t">Figura de <b>' + die + '</b> cuadradito' + (die > 1 ? 's' : '') + ' · 1 punto</span></button></div>';
      if (phase === 'find') h += '<p class="hunt-goal">' + (opt === 'A' ? 'Buscá una figura con <b>' + target() + ' lados</b> de cuadradito en su contorno.' : 'Buscá una figura formada por <b>' + target() + ' cuadradito' + (target() > 1 ? 's' : '') + '</b>.') + ' Tocala en la ficha.</p>' +
        '<button type="button" class="btn btn-ghost-dark h-none">No hay figura disponible</button>';
      if (phase === 'next') h += '<button type="button" class="btn btn-primary h-next">' + (round >= ch.rondas ? 'Ver resultado del juego' : 'Siguiente tirada') + '</button>';
      h += '<div class="hunt-msg" aria-live="polite"></div>';
      panel.innerHTML = h;
      var q = function (c) { return panel.querySelector(c); };
      if (q('.h-roll')) q('.h-roll').addEventListener('click', roll);
      if (q('.h-a')) q('.h-a').addEventListener('click', function () { opt = 'A'; phase = 'find'; tries = 0; drawBoard(); drawPanel(); });
      if (q('.h-b')) q('.h-b').addEventListener('click', function () { opt = 'B'; phase = 'find'; tries = 0; drawBoard(); drawPanel(); });
      if (q('.h-none')) q('.h-none').addEventListener('click', function () { choose(null); });
      if (q('.h-next')) q('.h-next').addEventListener('click', next);
    }
    function roll() { die = 1 + Math.floor(Math.random() * 6); round++; phase = 'choose'; drawPanel(); var b = panel.querySelector('.h-a'); if (b) b.focus(); }
    function choose(i) {
      if (phase !== 'find') return;
      var av = avail(), ok = i == null ? av.length === 0 : fits(i), msg;
      tries++;
      if (ok) {
        if (tries === 1) res.s1++; else res.s2++;
        res.n++;
        if (i != null) { used[i] = true; pts += opt === 'A' ? 2 : 1; msg = '¡Bien cazada! La figura ' + fx.figuras[i].nombre + ' tiene ' + (opt === 'A' ? geo[i].perim + ' lados de contorno' : geo[i].area + ' cuadraditos') + '. +' + (opt === 'A' ? 2 : 1) + (opt === 'A' ? ' puntos' : ' punto') + '.'; }
        else msg = '¡Correcto! Ya no queda ninguna figura con esa medida. No sumás puntos, pero tu respuesta es correcta.';
        phase = 'next'; drawBoard(); drawPanel(); say(msg, 'ok');
      } else if (tries < 2) {
        var m = i == null ? 'Todavía queda al menos una figura que cumple. ¡Seguí buscando!' :
          'La figura ' + fx.figuras[i].nombre + ' tiene ' + (opt === 'A' ? geo[i].perim + ' lados de contorno' : geo[i].area + ' cuadradito' + (geo[i].area > 1 ? 's' : '')) + ', y buscás ' + target() + '. ' + (opt === 'A' ? 'Recorré el borde y contá cada lado, también los escalones.' : 'Contá los cuadraditos que la forman.');
        drawPanel(); say('Intentá de nuevo. ' + m, 'bad');
      } else {
        res.n++; res.w++;
        var hl = av.length ? av[0] : null;
        phase = 'next'; drawBoard(hl); drawPanel();
        say(hl != null ? 'Esta vez no. Una figura que cumplía era la ' + fx.figuras[hl].nombre + ' (resaltada).' : 'Esta vez no: no quedaba ninguna figura con esa medida, había que elegir "No hay figura disponible".', 'bad');
      }
    }
    function next() {
      if (round >= ch.rondas) { phase = 'done'; finish(); return; }
      die = null; opt = null; phase = 'roll'; drawBoard(); drawPanel(); var b = panel.querySelector('.h-roll'); if (b) b.focus();
    }
    function finish() {
      panel.innerHTML = '<div class="hunt-end"><h3>¡Fin del juego!</h3><p>Puntos del juego: <b>' + pts + '</b></p><p>Rondas resueltas al primer intento: <b>' + res.s1 + '</b> de ' + ch.rondas + '<br>Con un segundo intento: <b>' + res.s2 + '</b></p></div>';
      ctx.customDone(res);
    }
    drawBoard(); drawPanel();
    return { custom: true, get: function () { return res; }, lock: function () { }, mark: function () { }, clearMarks: function () { }, reveal: function () { }, focus: function () { var b = panel.querySelector('button'); if (b) b.focus(); } };
  };

  R.self = function (ch, ctx) {
    var box = el('div', 'self-list');
    ch.items.forEach(function (t, i) {
      var id = 'sf-' + ch.id + '-' + i, d = el('div', 'self-i');
      d.innerHTML = '<input type="checkbox" id="' + id + '"><label for="' + id + '">' + t + '</label>';
      box.appendChild(d);
    });
    ctx.ans.appendChild(box);
    return {
      get: function () { return Array.prototype.map.call(box.querySelectorAll('input'), function (i) { return i.checked; }); },
      lock: function (v) { box.querySelectorAll('input').forEach(function (i) { i.disabled = v; }); },
      mark: function () { }, clearMarks: function () { }, reveal: function () { },
      focus: function () { box.querySelector('input').focus(); }
    };
  };

  function render(ch, ctx) { return R[ch.tipo](ch, ctx); }

  /** figura asociada a un desafío (propia, de la intro o de otro desafío) */
  function figFor(ch, mission, all) {
    if (ch.fig) return ch.fig;
    if (ch.figDe === 'intro') return mission.ejemplo && mission.ejemplo.fig;
    if (ch.figDe) {
      for (var i = 0; i < all.length; i++) {
        var m = all[i];
        for (var j = 0; j < m.desafios.length; j++) if (m.desafios[j].id === ch.figDe) return figFor(m.desafios[j], m, all);
      }
    }
    return null;
  }

  global.Engine = { validate: validate, correct: correct, render: render, parseNum: parseNum, fmt: fmt, polyomino: polyomino, circumcenter: circumcenter, figFor: figFor };
})(typeof window !== 'undefined' ? window : globalThis);
