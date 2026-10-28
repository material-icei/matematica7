/* Pruebas automáticas de contenidos y validación (node tests/validar_contenidos.js)
   - Toda respuesta correcta es aceptada.
   - Respuestas incorrectas típicas son rechazadas con un mensaje.
   - Los resultados matemáticos se recalculan de forma independiente.
   - Las figuras se generan sin errores ni valores NaN. */
'use strict';
const fs = require('fs'), path = require('path'), vm = require('vm');
const ctx = { console, Math, JSON, Object, Array, String, Number, isNaN, parseFloat, Date };
ctx.window = ctx; ctx.globalThis = ctx;
vm.createContext(ctx);
['config.js', 'figures.js', 'content.js', 'engine.js'].forEach((f) => vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'js', f), 'utf8'), ctx, { filename: f }));
const { CONTENIDOS: C, Engine: E } = ctx;
let fails = 0, checks = 0;
function ok(cond, msg) { checks++; if (!cond) { fails++; console.log('  ✗ ' + msg); } }

const ids = new Set();
C.misiones.forEach((m, mi) => {
  ok(m.ejemplo && typeof m.ejemplo.fig === 'function', m.id + ': ejemplo con figura');
  if (m.ejemplo && m.ejemplo.fig) { const s = m.ejemplo.fig(); ok(!/NaN|undefined/.test(s), m.id + ': figura de intro sin NaN/undefined'); }
  m.desafios.forEach((ch) => {
    ok(!ids.has(ch.id), 'id único ' + ch.id); ids.add(ch.id);
    ok(ch.fuente, ch.id + ': tiene fuente');
    if (ch.tipo !== 'self' && ch.tipo !== 'hunt') { ok(ch.pista, ch.id + ': tiene pista'); ok(ch.explica, ch.id + ': tiene explicación'); }
    const fig = E.figFor(ch, m, C.misiones);
    if (ch.figDe) ok(!!fig, ch.id + ': figDe resuelve una figura');
    if (fig) { const s = fig(); ok(/^<svg/.test(s) && !/NaN|undefined/.test(s), ch.id + ': figura válida'); }
    if (ch.tipo === 'hunt') return;
    const good = E.correct(ch), r = E.validate(ch, good);
    ok(r.ok, ch.id + ': la respuesta correcta es aceptada (' + (r.msg || '') + ')');
    // respuestas incorrectas
    if (ch.tipo === 'choice') ch.ops.forEach((o, i) => { if (!o.ok) { const w = E.validate(ch, i); ok(!w.ok && w.msg, ch.id + ': opción ' + i + ' rechazada con mensaje'); } });
    if (ch.tipo === 'choice') ok(ch.ops.filter((o) => o.ok).length === 1, ch.id + ': exactamente una opción correcta');
    if (ch.tipo === 'number') {
      ch.campos.forEach((f, i) => {
        const bad = good.map((x) => Object.assign({}, x)); bad[i].v = String(f.ans + 7);
        ok(!E.validate(ch, bad).ok, ch.id + ': valor incorrecto rechazado en campo ' + i);
        (f.mal || []).forEach((w) => { const b2 = good.map((x) => Object.assign({}, x)); b2[i].v = String(w.v).replace('.', ','); const res = E.validate(ch, b2); ok(!res.ok && res.msg.indexOf(w.fb.slice(0, 20)) >= 0, ch.id + ': error típico ' + w.v + ' da su retroalimentación específica'); });
        if (f.unidades) { const b3 = good.map((x) => Object.assign({}, x)); b3[i].u = f.unidades.find((u) => u !== f.unidad); const res = E.validate(ch, b3); ok(!res.ok && /unidad/.test(res.msg), ch.id + ': unidad incorrecta rechazada'); }
      });
      const comma = good.map((x) => ({ v: String(x.v).replace('.', ','), u: x.u }));
      ok(E.validate(ch, comma).ok, ch.id + ': acepta coma decimal');
      ok(E.validate(ch, good.map(() => ({ v: '', u: null }))).empty, ch.id + ': vacío no cuenta como intento');
    }
    if (ch.tipo === 'multi') ok(!E.validate(ch, [good[0]]).ok || good.length === 1, ch.id + ': selección incompleta rechazada');
    if (ch.tipo === 'order') ok(!E.validate(ch, ch.inicio || good.slice().reverse()).ok, ch.id + ': el orden inicial no es la solución');
    if (ch.tipo === 'classify') { const b = good.slice(); b[0] = ch.cats.find((c) => c !== b[0]); ok(!E.validate(ch, b).ok, ch.id + ': clasificación errónea rechazada'); }
    if (ch.tipo === 'select') { ch.filas.forEach((row, i) => { const b = good.map((x) => x.slice()); const ops = row.ops ? (Array.isArray(row.ops[0]) ? row.ops[0] : row.ops) : ch.ops; const acc = Array.isArray(row.ans[0]) ? row.ans[0] : [row.ans[0]]; const wrong = ops.find((o) => acc.indexOf(o) < 0); if (wrong) { b[i][0] = wrong; ok(!E.validate(ch, b).ok, ch.id + ': fila ' + i + ' errónea rechazada'); } }); }
    if (ch.tipo === 'triangle') { ok(!E.validate(ch, ch.meta === 'imposible' ? 4 : 4).ok, ch.id + ': c = 4 no cumple la meta'); }
  });
});

// Recalcular de forma independiente los resultados matemáticos clave
const get = (id) => { for (const m of C.misiones) for (const c of m.desafios) if (c.id === id) return c; };
const ans = (id) => get(id).campos.map((f) => f.ans);
const near = (a, b, t) => Math.abs(a - b) <= (t || 1e-9);
const eqArr = (id, arr, t) => { const a = ans(id); ok(a.length === arr.length && a.every((v, i) => near(v, arr[i], t)), id + ': ' + a.join(', ') + ' = ' + arr.map((x) => Math.round(x * 100) / 100).join(', ')); };
eqArr('m1c4', [90 - 23, 90 - 82, 90 - 19]);
eqArr('m1c5', [180 - 96, 180 - 108, 180 - 147]);
eqArr('m2c2', [180 - 50, 50]);
eqArr('m2c3', [180 - 77 - 77, 77]);
eqArr('m3c5', [180 - 62, (180 - 62) / 2, (180 - 62) / 2]);
eqArr('m3c6', [(120 / 2 - 30) / 3]);
eqArr('m4c4', [180 - 90 - 23, 180 - 52 - 60]);
eqArr('m4c5', [67, 180 - 2 * 67]);
eqArr('m4c6', [61, 180 - 116, 180 - 61 - (180 - 116)]);
eqArr('m4c7', [180 - 75, 42, 180 - (180 - 75) - 42]);
eqArr('m5c5', [180 - 50 - 65]);
eqArr('m6c5', [Math.hypot(3, 4), Math.sqrt(100 - 64)]);
eqArr('m6c6', [Math.sqrt(121 - 81), Math.sqrt(64 - 9)], 0.006);
eqArr('m6c7', [Math.hypot(3.5, 4.5), Math.sqrt(12.5 ** 2 - 9.5 ** 2)], 0.006);
eqArr('m7c2', [Math.sqrt(6.5 ** 2 - 2.5 ** 2)], 1e-9);
eqArr('m7c3', [Math.sqrt(2.5 ** 2 - 0.7 ** 2)], 1e-9);
eqArr('m7c4', [Math.sqrt(17 ** 2 - 15 ** 2)]);
eqArr('m7c5', [Math.sqrt(12.5 ** 2 - 12 ** 2)], 1e-9);
eqArr('m7c6', [Math.hypot(12, 3.5)], 1e-9);
eqArr('m10c3', [360 - 90 - 118 - 122, 360 - 90 - 90 - 134]);
eqArr('m10c4', [180 - 111, 111]);
eqArr('m10c5', [180 - 62, 62, 180 - 62]);
eqArr('m12c3', [14, 6]);
eqArr('m13c3', [1 + 1 + 0.5 + 0.5, 6]);
eqArr('m13c5', [10 * 4]);
eqArr('m13c6', [6 * 3 + 6 * 3 / 2]);
eqArr('m13c7', [14 * 15 + 12 * 12]);
eqArr('m13c8', [23 * 10 - 10 * 11 / 2]);
eqArr('m14c5', [6 * 4, 6 * 4 / 2]);
eqArr('m14c6', [12 * 20 / 2, 6 * 4 / 2]);
eqArr('m14c7', [10 * 6 / 2, 2 * 3 * 6 / 2, 10 * 6 / 2 + 2 * 3 * 6 / 2]);
eqArr('m14c9', [(3 + 1) * 1 / 2]);
eqArr('m15c1', [3 + 4 + 5, 3 * 4 / 2]);
eqArr('m15c2', [Math.hypot(12, 3.5), 2 * 12 + 2 * 3.5, 12 * 3.5], 1e-9);
eqArr('m15c3', [90 - 62, 180 - 62, (180 - 62) / 2]);
eqArr('m15c4', [360 - 110 - 110 - 60]);
eqArr('m15c6', [8 * 6 / 2, Math.hypot(4, 3), 4 * Math.hypot(4, 3)]);
// perímetro de la cruz y de figuras de la ficha
const cross = ['1,0', '0,1', '1,1', '2,1', '3,1', '1,2'];
ok(E.polyomino(cross).perim === 14 && E.polyomino(cross).area === 6, 'cruz: área 6, perímetro 14');
const fx = C.ficha.figuras.map((f) => ({ n: f.id, g: E.polyomino(f.celdas.map((c) => c.join(','))) }));
ok(fx.every((f) => f.g.connected), 'ficha: todas las figuras conectadas');
const violeta = fx.find((f) => f.n === 'violeta').g, celeste = fx.find((f) => f.n === 'celeste').g;
ok(violeta.area === 5 && violeta.perim === 10 && celeste.area === 5 && celeste.perim === 12, 'm11c4: violeta 5/10 y celeste 5/12');
// los dados 1 a 6 tienen al menos una figura posible en alguna opción
for (let d = 1; d <= 6; d++) ok(fx.some((f) => f.g.perim === (d + 1) * 2) || fx.some((f) => f.g.area === d), 'dado ' + d + ': hay figura para alguna opción');
// cuadrilátero de la act. 48a con lados positivos
const q = ctx.F.quadFromAngles([0, 0], [90, 118, 30, 122], 60, 110, 0);
ok(q.L3 > 0 && q.L4 > 0, 'm10c3: el cuadrilátero de ángulos 90/118/30/122 existe');
// cuadrícula: polígonos máximos
ok(E.validate(get('m12c4'), ['0,0', '1,0', '2,0', '3,0', '4,0', '5,0']).ok === false, 'm12c4: fila de 6 (perímetro 14) rechazada');
ok(E.validate(get('m12c4'), ['0,0', '2,0']).ok === false, 'm12c4: figura desconectada rechazada');
// punto equidistante
const pc = get('m8c5'), cc = E.circumcenter(pc.a, pc.b, pc.c);
ok(cc[0] > 0 && cc[0] < pc.tam[0] && cc[1] > 0 && cc[1] < pc.tam[1], 'm8c5: el circuncentro está dentro del plano (' + cc.map((x) => x.toFixed(2)) + ')');
ok(!E.validate(pc, pc.inicial).ok, 'm8c5: la posición inicial no es solución');

const tot = C.misiones.reduce((a, m) => a + m.desafios.length, 0);
console.log(C.misiones.length + ' misiones · ' + tot + ' desafíos · ' + checks + ' comprobaciones · ' + fails + ' fallas');
process.exit(fails ? 1 : 0);
