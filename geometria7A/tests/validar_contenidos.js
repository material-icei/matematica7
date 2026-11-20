/* Pruebas de contenidos (node tests/validar_contenidos.js)
   - Toda respuesta correcta es aceptada (también con opciones mezcladas).
   - Respuestas incorrectas típicas son rechazadas.
   - Los resultados se recalculan de forma independiente. */
'use strict';
const fs = require('fs'), path = require('path'), vm = require('vm');
const ctx = { console, Math, JSON, Object, Array, String, Number, isNaN, parseFloat, Date };
ctx.window = ctx; ctx.globalThis = ctx; vm.createContext(ctx);
['config.js', 'figures.js', 'content.js', 'engine.js'].forEach((f) => vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'js', f), 'utf8'), ctx, { filename: f }));
const { CONTENIDOS: C, Engine: E } = ctx;
let fails = 0, checks = 0;
const ok = (c, m) => { checks++; if (!c) { fails++; console.log('  ✗ ' + m); } };
const ids = new Set();
C.misiones.forEach((m) => m.desafios.forEach((ch) => {
  ok(!ids.has(ch.id), 'id único ' + ch.id); ids.add(ch.id);
  if (ch.fig) { const s = ch.fig(); ok((/^<svg/.test(s) || (/^<img/.test(s) && fs.existsSync(path.join(__dirname, '..', s.match(/src="([^"]+)"/)[1])))) && !/NaN|undefined/.test(s), ch.id + ': figura válida'); }
  ok(E.validate(ch, E.correct(ch)).ok, ch.id + ' (' + ch.num + '): respuesta correcta aceptada');
  if (ch.tipo === 'choice') { ok(ch.ops.filter((o) => o.ok).length === 1, ch.id + ': una sola correcta'); ch.ops.forEach((o, i) => { if (!o.ok) ok(!E.validate(ch, i).ok, ch.id + ': opción ' + i + ' rechazada'); }); }
  if (ch.tipo === 'number') ch.campos.forEach((f, i) => {
    const g = E.correct(ch), b = g.map((x) => Object.assign({}, x)); b[i].v = String(f.ans + 7); ok(!E.validate(ch, b).ok, ch.id + ': valor incorrecto rechazado');
    (f.mal || []).forEach((w) => { const b2 = g.map((x) => Object.assign({}, x)); b2[i].v = String(w.v); ok(!E.validate(ch, b2).ok, ch.id + ': error previsto ' + w.v + ' rechazado'); });
    if (f.unidades) { const b3 = g.map((x) => Object.assign({}, x)); b3[i].u = f.unidades.find((u) => u !== f.unidad); ok(!E.validate(ch, b3).ok, ch.id + ': unidad incorrecta rechazada'); }
  });
}));
const get = (num) => { for (const m of C.misiones) for (const c of m.desafios) if (c.num === num) return c; };
const eq = (num, arr, t) => { const a = get(num).campos.map((f) => f.ans); ok(a.every((v, i) => Math.abs(v - arr[i]) <= (t || 1e-9)), num + ': ' + a.join(', ') + ' = ' + arr.map((x) => +x.toFixed(2)).join(', ')); };
eq('1.3', [90 - 23, 90 - 19]); eq('1.4', [180 - 96, 180 - 147]);
eq('2.2', [130, 50]); eq('2.3', [180 - 154, 77]);
eq('3.2', [30]); eq('3.4', [118, 59, 59]);
eq('4.3', [67, 46]); eq('4.4', [61, 64, 55]);
eq('5.3', [Math.hypot(3.6, 4.8), Math.sqrt(12.5 ** 2 - 7.5 ** 2)], 1e-9); eq('5.4', [Math.sqrt(2.5 ** 2 - 0.7 ** 2)], 1e-9);
eq('6.5', [30, 46]); eq('6.6', [118, 62, 118]); eq('6.8', [80]);
eq('7.2', [11 * 8 - 9 * 6]); eq('7.3', [2 * 2 + (10 + 2) * (11 - 2 - 5) / 2 + 8 * 5]); eq('7.5', [15 * 25 - 12 * 20 / 2, 12 * 2 / 4]); eq('7.6', [2]);
eq('8.1', [12, 6]); eq('8.2', [12.5, 31, 42], 1e-9); eq('8.4', [24, 5, 20]);
const tot = C.misiones.reduce((a, m) => a + m.desafios.length, 0);
console.log(C.misiones.length + ' misiones · ' + tot + ' desafíos · ' + checks + ' comprobaciones · ' + fails + ' fallas');
process.exit(fails ? 1 : 0);
