/* =========================================================
   content.js — CONTENIDOS DE LA EVALUACIÓN (versión corregida por la docente)
   ---------------------------------------------------------
   Contiene TODAS las misiones y desafíos. Se puede modificar consignas,
   opciones y respuestas sin tocar la lógica (app.js / engine.js).

   Cada desafío tiene:
     id     identificador interno (no cambiar una vez que hay alumnos evaluados)
     num    número que figura en el listado de la docente (ej.: "2.4")
     origen desafío de la versión anterior del que proviene
     ok:true marca la opción correcta; ans / cat / pasos marcan las respuestas.

   En la app, el orden de los desafíos de cada misión y el de las opciones
   se mezcla al azar para cada estudiante.

   Tipos: choice (opción única) · multi (marcar todas) · number (numérica)
          classify (clasificar) · select (completar) · order (ordenar pasos)
   ========================================================= */
(function (global) {
  'use strict';
  var F = global.F;
  /** letra con "sombrero" de ángulo: hat('aoc') → aôc */
  function hat(s) { return s.length === 3 ? s[0] + s[1] + '̂' + s[2] : s + '̂'; }
  var U_AREA = ['cm', 'cm²', 'm', 'm²'];
  var U_LONG = ['cm', 'cm²', 'm', 'm²'];

  /* ---------- Figuras reutilizables ---------- */

  // Rectas NQ, UR y PT que se cortan en S (p. 9, act. 16)
  function figS(opts) {
    opts = opts || {};
    var S = [250, 165], R = 150, out = '';
    [[167, 347], [193, 13], [90, 270]].forEach(function (l) {
      out += F.line2(F.P(S[0], S[1], R, l[0]), F.P(S[0], S[1], R, l[1]), 'ln ln-blue');
    });
    out += F.sector(S, 46, 90, 167, 'sect sect-amber') + F.angLabel(S, 64, 90, 167, '77°');
    out += F.sector(S, 56, 167, 193, 'sect sect-green') + F.angLabel(S, 76, 167, 193, 'α');
    out += F.sector(S, 44, 270, 347, 'sect sect-violet') + F.angLabel(S, 64, 270, 347, 'β');
    if (opts.psr) out += F.sector(S, 34, 13, 90, 'sect sect-coral') + F.angLabel(S, 52, 13, 90, '77°');
    var names = { P: 90, R: 13, Q: 347, T: 270, U: 193, N: 167 };
    Object.keys(names).forEach(function (k) {
      var p = F.P(S[0], S[1], 118, names[k]);
      out += F.dot(p, '', 0, 0);
      var lp = F.P(S[0], S[1], 118, names[k] + (names[k] === 90 || names[k] === 270 ? -9 : 9));
      out += F.text(lp[0] + (names[k] === 90 || names[k] === 270 ? 14 : 0), lp[1] - 4, k, 'lbl lbl-b');
    });
    out += F.dot(S, '') + F.text(S[0] + 16, S[1] - 10, 'S', 'lbl lbl-b');
    return F.svg(500, 330, out, 'Tres rectas NQ, UR y PT que se cortan en el punto S. Ángulo NSP de 77 grados; alfa entre N y U; beta entre Q y T.');
  }

  // Ficha "Cazadores de figuras" (p. 36). Coordenadas [columna, fila] de cada cuadradito.
  var FICHA = {
    cols: 19, rows: 13,
    figuras: [
      { id: 'amarilla', nombre: 'amarilla corta', color: '#f2b705', celdas: [[1, 1], [2, 1]] },
      { id: 'gris', nombre: 'gris', color: '#8597b3', celdas: [[4, 1], [5, 1], [6, 1]] },
      { id: 'azul', nombre: 'azul cuadrada', color: '#1d3fd6', celdas: [[9, 1], [10, 1], [9, 2], [10, 2]] },
      { id: 'bordo', nombre: 'bordó', color: '#a8136a', celdas: [[12, 1], [12, 2]] },
      { id: 'violeta', nombre: 'violeta', color: '#9a10d1', celdas: [[14, 1], [14, 2], [14, 3], [15, 2], [15, 3]] },
      { id: 'marron', nombre: 'marrón', color: '#94622f', celdas: [[17, 1], [17, 2], [17, 3], [17, 4]] },
      { id: 'verdeclaro', nombre: 'verde claro (U)', color: '#8fd14f', celdas: [[1, 3], [1, 4], [1, 5], [2, 5], [3, 4], [3, 5]] },
      { id: 'cian', nombre: 'celeste (zigzag)', color: '#29d3e6', celdas: [[5, 3], [6, 3], [6, 4], [7, 4]] },
      { id: 'rojaoscura', nombre: 'roja larga', color: '#b10000', celdas: [[9, 5], [10, 5], [11, 5], [12, 5], [13, 5], [14, 5]] },
      { id: 'azuloscura', nombre: 'azul oscura (U)', color: '#2c4f9e', celdas: [[1, 7], [3, 7], [1, 8], [2, 8], [3, 8]] },
      { id: 'roja', nombre: 'roja (T)', color: '#ff1a1a', celdas: [[5, 6], [5, 7], [5, 8], [6, 7], [7, 7]] },
      { id: 'amarillaL', nombre: 'amarilla (L)', color: '#ffe600', celdas: [[9, 7], [10, 7], [11, 7], [11, 8], [11, 9]] },
      { id: 'rosa', nombre: 'rosa', color: '#ff66cc', celdas: [[13, 7], [14, 7], [15, 7], [16, 7], [13, 8], [14, 8], [15, 8], [16, 8]] },
      { id: 'verde', nombre: 'verde (L)', color: '#00b050', celdas: [[1, 10], [2, 10], [3, 10], [1, 11]] },
      { id: 'naranja', nombre: 'naranja (cruz)', color: '#f07f30', celdas: [[7, 9], [6, 10], [7, 10], [8, 10], [7, 11]] },
      { id: 'rojachica', nombre: 'roja chiquita', color: '#e00000', celdas: [[10, 11]] },
      { id: 'celeste', nombre: 'celeste larga', color: '#5b9bd5', celdas: [[13, 11], [14, 11], [15, 11], [16, 11], [17, 11]] }
    ]
  };

  // Figura "cruz" de 6 cuadrados (p. 37 act. 2 y p. 38 act. 57)
  var CRUZ = [[1, 0], [0, 1], [1, 1], [2, 1], [3, 1], [1, 2]];
  function figCruz(color, s) {
    s = s || 46;
    var out = F.grid(10, 10, 6, 5, s, 'gridl') + F.cells(CRUZ.map(function (c) { return [c[0] + 1, c[1] + 1]; }), 10, 10, s, 'cell ' + (color || 'cell-cyan'));
    return F.svg(10 + 6 * s + 10, 10 + 5 * s + 10, out, 'Figura en forma de cruz formada por 6 cuadrados iguales.');
  }

  // Rombo en rectángulo MKLN (p. 41)
  function figRombo(showTiny) {
    var s = 50, x0 = 40, y0 = 30, out = F.grid(x0, y0, 6, 4, s, 'gridl');
    var M = [x0, y0], K = [x0 + 6 * s, y0], L = [x0 + 6 * s, y0 + 4 * s], N = [x0, y0 + 4 * s];
    var R = [x0 + 3 * s, y0], O = [x0 + 6 * s, y0 + 2 * s], Pp = [x0 + 3 * s, y0 + 4 * s], Q = [x0, y0 + 2 * s];
    out += F.poly([M, K, L, N], 'shape-outline');
    out += F.poly([R, O, Pp, Q], 'shape shape-green');
    out += F.seg(Q, O, 'ln ln-dash') + F.seg(R, Pp, 'ln ln-dash');
    out += F.text(M[0] - 14, M[1] - 10, 'M', 'lbl lbl-b') + F.text(K[0] + 14, K[1] - 10, 'K', 'lbl lbl-b') + F.text(L[0] + 14, L[1] + 12, 'L', 'lbl lbl-b') + F.text(N[0] - 14, N[1] + 12, 'N', 'lbl lbl-b');
    out += F.text(R[0], R[1] - 14, 'R', 'lbl lbl-b') + F.text(O[0] + 16, O[1], 'O', 'lbl lbl-b') + F.text(Pp[0], Pp[1] + 15, 'P', 'lbl lbl-b') + F.text(Q[0] - 16, Q[1], 'Q', 'lbl lbl-b');
    out += F.dim([x0 + 6 * s + 26, y0], [x0 + 6 * s + 26, y0 + s], '1 cm', 0);
    return F.svg(x0 + 6 * s + 70, y0 + 4 * s + 34, out, 'Rombo QROP dibujado dentro del rectángulo MKLN, sobre una cuadrícula de 1 centímetro.');
  }


  /* ---------- Contenidos (para el informe docente) ---------- */
  var CONTENIDOS = {
    angulos: {
      nombre: "Ángulos: elementos, complementarios, suplementarios y posiciones",
      practica: "Revisar en la carpeta las act. 7 a 16 (pp. 5–9)."
    },
    bisectriz: { nombre: "Bisectriz de un ángulo", practica: "Revisar en la carpeta las act. 17 a 21 (pp. 10–12)." },
    triangulos: { nombre: "Triángulos: clasificación y propiedades", practica: "Revisar en la carpeta las pp. 13–15." },
    pitagoras: { nombre: "Teorema de Pitágoras", practica: "Revisar en la carpeta las pp. 18–23." },
    cuadrilateros: {
      nombre: "Cuadriláteros: elementos, clasificación, diagonales y ángulos",
      practica: "Revisar en la carpeta las act. 41 a 49 (pp. 28–33)."
    },
    areas: { nombre: "Área y perímetro", practica: "Revisar en la carpeta las act. 55 a 65 (pp. 37–43)." },
    integracion: {
      nombre: "Integración de contenidos (desafío final)",
      practica: "Revisar los problemas que combinan varios contenidos."
    }
  };

  /* ---------- Insignias (se otorgan al COMPLETAR misiones, no según los aciertos) ---------- */
  var INSIGNIAS = [
    {
      id: "m1",
      nombre: "Explorador de ángulos",
      icono: "angle",
      desc: "Completaste la misión 1.",
      regla: { completadas: ["m1"] }
    },
    {
      id: "m2",
      nombre: "Guardián de las rectas",
      icono: "cross",
      desc: "Completaste la misión 2.",
      regla: { completadas: ["m2"] }
    },
    {
      id: "m3",
      nombre: "Vigía de la bisectriz",
      icono: "bisector",
      desc: "Completaste la misión 3.",
      regla: { completadas: ["m3"] }
    },
    {
      id: "m4",
      nombre: "Guardián de los triángulos",
      icono: "triangle",
      desc: "Completaste la misión 4.",
      regla: { completadas: ["m4"] }
    },
    {
      id: "m5",
      nombre: "Heredero de Pitágoras",
      icono: "pythag",
      desc: "Completaste la misión 5.",
      regla: { completadas: ["m5"] }
    },
    {
      id: "m6",
      nombre: "Experto en cuadriláteros",
      icono: "quad",
      desc: "Completaste la misión 6.",
      regla: { completadas: ["m6"] }
    },
    {
      id: "m7",
      nombre: "Arquitecto de áreas",
      icono: "area",
      desc: "Completaste la misión 7.",
      regla: { completadas: ["m7"] }
    }
  ];

  /* =========================================================
     MISIONES
     ========================================================= */
  var M = [
    {
      id: "m1",
      titulo: "Ángulos",
      icono: "angle",
      contenido: "angulos",
      paginas: "pp. 5–8",
      descripcion: "Elementos del ángulo, su nombre, complementos y suplementos.",
      objetivo: "Reconocer elementos básicos de la geometría, reconocer ángulos, clasificarlos y obtener su medida.",
      puntos: ["Dos <b>semirrectas</b> con el mismo origen forman un <b>ángulo</b>. El origen es el <b>vértice</b>.", "Sistema <b>sexagesimal</b> (Civilización Babilonia): un giro completo mide <b>360°</b>."],
      desafios: [
        {
          id: "m1c1",
          num: "1.1",
          tipo: "choice",
          origen: "m1c1",
          fuente: "p. 5 · act. 7",
          consigna: "Se construyó el siguiente ángulo. ¿Con qué elementos se construye?",
          fig: function () {
              var O = [70, 180], o = F.ray(O, [370, 180], 'ln ln-blue') + F.ray(O, F.P(O[0], O[1], 300, 38), 'ln ln-blue') + F.dot(O, 'O', -14, 10);
              return F.svg(400, 220, o, 'Dos semirrectas que comparten el origen O.');
            },
          ops: [
            {
              t: "Dos semirrectas",
              ok: true,
              fb: "Dos semirrectas con origen común determinan un ángulo. El origen es su vértice."
            },
            {
              t: "Dos segmentos",
              fb: "Un segmento tiene dos extremos y no se prolonga. Mirá las flechas: las semirrectas siguen indefinidamente."
            },
            {
              t: "Dos rectas",
              fb: "Una recta no tiene origen. Aquí hay dos semirrectas que comparten su punto de origen."
            },
            {
              t: "Un segmento y una semirrecta",
              fb: "Una de ambas líneas debería tener fin para que sea un segmento. Aquí solo hay dos semirrectas abiertas."
            }
          ],
          pista: "Fijate si las líneas tienen inicio y fin.",
          explica: "Dos semirrectas con el mismo origen forman un ángulo; el origen es el vértice y las semirrectas son sus lados."
        },
        {
          id: "m1c2",
          num: "1.2",
          tipo: "choice",
          origen: "m1c3",
          fuente: "p. 6 · act. 8",
          consigna: "¿Cuál es la forma correcta de nombrar este ángulo con tres letras?",
          fig: function () {
              var B = [80, 190], o = F.ray(B, [330, 190]) + F.ray(B, F.P(B[0], B[1], 240, 48));
              o += F.arc(B, 40, 0, 48, 'arcl arc-blue') + F.dot(B, 'B', -14, 12) + F.dot([250, 190], 'C', 0, 18) + F.dot(F.P(B[0], B[1], 175, 48), 'A', -16, -6);
              return F.svg(360, 230, o, 'Ángulo con vértice B; el punto A está en un lado y el punto C en el otro.');
            },
          ops: [
            { t: "AB̂C", ok: true, fb: "¡Bien! La letra del vértice (B) siempre va en el medio." },
            { t: "BÂC", fb: "Así nombrarías un ángulo con vértice en A. ¿Dónde está el vértice en este dibujo?" },
            { t: "AĈB", fb: "La letra del medio debe ser el vértice. C es un punto de uno de los lados." },
            { t: "CÂB", fb: "Revisá: el vértice es el punto donde se unen las dos semirrectas." }
          ],
          pista: "Con tres letras, la del medio es la del vértice (donde se unen los lados).",
          explica: "Se escribe AB̂C (o CB̂A): la letra del vértice va en el medio. También puede nombrarse B̂."
        },
        {
          id: "m1c3",
          num: "1.3",
          tipo: "number",
          origen: "m1c4",
          fuente: "p. 7 · act. 10",
          consigna: "Completá la tabla de <b>complementos</b>. Recordá: dos ángulos complementarios suman 90°.",
          campos: [
            {
              et: "Complemento de α = 23°",
              ans: 67,
              suf: "°",
              mal: [
                { v: 157, fb: "Calculaste el suplemento (180° − 23°). El complemento se calcula con 90°." }
              ]
            },
            {
              et: "α, si su complemento mide 19°",
              ans: 71,
              suf: "°",
              mal: [
                { v: 161, fb: "Usá 90°, no 180°: α + 19° = 90°." }
              ]
            }
          ],
          pista: "Complemento de α = 90° − α.",
          explica: "90° − 23° = 67°; 90° − 19° = 71°."
        },
        {
          id: "m1c4",
          num: "1.4",
          tipo: "number",
          origen: "m1c5",
          fuente: "p. 7 · act. 10",
          consigna: "Ahora completá los <b>suplementos</b>. Dos ángulos suplementarios suman 180°.",
          campos: [
            {
              et: "Suplemento de β = 96°",
              ans: 84,
              suf: "°",
              mal: [
                { v: -6, fb: "Usaste 90°. El suplemento se calcula con 180°." }
              ]
            },
            {
              et: "β, si su suplemento mide 147°",
              ans: 33,
              suf: "°",
              mal: [
                { v: 327, fb: "Sumaste en lugar de restar. β + 147° = 180°." }
              ]
            }
          ],
          pista: "Suplemento de β = 180° − β.",
          explica: "180° − 96° = 84°; 180° − 147° = 33°."
        },
        {
          id: "m1c5",
          num: "1.5",
          tipo: "multi",
          origen: "m1c7",
          fuente: "p. 8 · act. 11",
          consigna: "Observá los ángulos. Marcá <b>todas</b> las parejas de ángulos <b>suplementarios</b>.",
          fig: function () {
              var data = [['A', 13], ['B', 77], ['C', 90], ['D', 45], ['E', 90], ['F', 30], ['G', 135], ['H', 60]], o = '';
              var cls = ['sect-amber', 'sect-green', 'sect-amber', 'sect-coral', 'sect-green', 'sect-coral', 'sect-blue', 'sect-amber'];
              data.forEach(function (d, i) { o += F.angleCard(10 + (i % 4) * 135, 10 + Math.floor(i / 4) * 125, d[1], d[0], 'sect ' + cls[i]); });
              return F.svg(550, 260, o, 'Ángulos A 13°, B 77°, C 90°, D 45°, E 90°, F 30°, G 135°, H 60°.');
            },
          ops: [
            { t: "C y E", ok: true },
            { t: "G y H" },
            { t: "D y G", ok: true },
            { t: "A y G" },
            { t: "B y C" }
          ],
          fbMal: "Buscá parejas que sumen exactamente 180°.",
          pista: "G = 135°. ¿Qué ángulo le falta para llegar a 180°?",
          explica: "C + E = 90° + 90° = 180° y D + G = 45° + 135° = 180°."
        }
      ]
    },
    {
      id: "m2",
      titulo: "Encrucijada de rectas",
      icono: "cross",
      contenido: "angulos",
      paginas: "pp. 8–9",
      descripcion: "Ángulos consecutivos, adyacentes y opuestos por el vértice.",
      objetivo: "Identificar ángulos según su posición y usar sus propiedades para calcular amplitudes.",
      puntos: [],
      desafios: [
        {
          id: "m2c1",
          num: "2.1",
          tipo: "choice",
          origen: "m2c1",
          fuente: "p. 8 · act. 12",
          consigna: "¿Cómo se llaman los ángulos de la imagen y cuánto suman?",
          fig: function () {
              var V = [200, 170], o = F.line2([30, 170], [370, 170]) + F.ray(V, F.P(V[0], V[1], 150, 50));
              o += F.sector(V, 48, 50, 180, 'sect sect-green') + F.sector(V, 48, 0, 50, 'sect sect-coral');
              o += F.angLabel(V, 70, 50, 180, hat('C')) + F.angLabel(V, 72, 0, 50, hat('D'));
              return F.svg(400, 210, o, 'Dos ángulos C y D con un lado común; sus otros lados forman una recta.');
            },
          ops: [
            {
              t: "Adyacentes: suman 180°",
              ok: true,
              fb: "¡Muy bien! Comparten vértice y un lado, y juntos forman un ángulo llano."
            },
            {
              t: "Opuestos por el vértice: miden lo mismo",
              fb: "Los opuestos por el vértice solo comparten el vértice, no un lado."
            },
            {
              t: "Consecutivos: pueden sumar cualquier valor",
              fb: "Son consecutivos, sí, pero además forman un ángulo llano: tienen un nombre más preciso."
            },
            {
              t: "Complementarios: suman 90°",
              fb: "Mirá la recta de abajo: juntos forman un ángulo llano, no uno recto."
            }
          ],
          pista: "Cuando los lados no comunes forman una recta, los dos ángulos juntos forman un ángulo llano.",
          explica: "Son adyacentes: tienen el vértice y un lado común y suman 180° (ángulo llano)."
        },
        {
          id: "m2c2",
          num: "2.2",
          tipo: "number",
          origen: "m2c2",
          fuente: "p. 8 · act. 13 (con medida agregada)",
          consigna: "El ángulo verde mide 50°. Calculá la amplitud de su ángulo <b>adyacente</b> y de su ángulo <b>opuesto por el vértice</b>.",
          fig: function () {
              var V = [210, 150], o = '';
              o += F.line2(F.P(V[0], V[1], 170, 180), F.P(V[0], V[1], 170, 0)) + F.line2(F.P(V[0], V[1], 150, 230), F.P(V[0], V[1], 150, 50));
              o += F.sector(V, 46, 0, 50, 'sect sect-green') + F.angLabel(V, 66, 0, 50, '50°');
              o += F.sector(V, 34, 50, 180, 'sect sect-amber') + F.angLabel(V, 56, 50, 180, 'adyacente');
              o += F.sector(V, 46, 180, 230, 'sect sect-blue') + F.angLabel(V, 72, 180, 230, 'opuesto');
              return F.svg(420, 300, o, 'Ángulo de 50 grados con su adyacente y su opuesto por el vértice.');
            },
          campos: [
            {
              et: "Ángulo adyacente",
              ans: 130,
              suf: "°",
              mal: [
                { v: 40, fb: "40° es el complemento. El adyacente completa un ángulo llano: 180° − 50°." },
                { v: 50, fb: "El que mide lo mismo es el opuesto por el vértice. El adyacente completa 180°." }
              ]
            },
            {
              et: "Ángulo opuesto por el vértice",
              ans: 50,
              suf: "°",
              mal: [
                { v: 130, fb: "Los ángulos opuestos por el vértice tienen la misma amplitud." }
              ]
            }
          ],
          pista: "El adyacente completa 180°. El opuesto por el vértice tiene la misma amplitud.",
          explica: "Adyacente: 180° − 50° = 130°. Opuesto por el vértice: 50°, porque los opuestos por el vértice son iguales."
        },
        {
          id: "m2c3",
          num: "2.3",
          tipo: "number",
          origen: "m2c3",
          fuente: "p. 9 · act. 16",
          consigna: "Las rectas NQ, UR y PT se cortan en S. NŜP = 77° y PŜR también mide 77°. Calculá α y β.",
          fig: function () { return figS({ psr: true }); },
          campos: [
            {
              et: "α",
              ans: 26,
              suf: "°",
              mal: [
                { v: 77, fb: "α no es opuesto a NŜP. Primero calculá RŜQ: NŜP + PŜR + RŜQ = 180°." },
                { v: 103, fb: "103° = 180° − 77°, pero α está entre N y U. Buscá el ángulo opuesto a α." }
              ]
            },
            {
              et: "β",
              ans: 77,
              suf: "°",
              mal: [
                { v: 26, fb: "β es opuesto por el vértice a NŜP, no a RŜQ." }
              ]
            }
          ],
          pista: "NŜP + PŜR + RŜQ forman un ángulo llano (180°). Después buscá los ángulos opuestos por el vértice.",
          explica: "RŜQ = 180° − 77° − 77° = 26°. α es opuesto por el vértice a RŜQ → α = 26°. β es opuesto por el vértice a NŜP → β = 77°."
        },
        {
          id: "m2c4",
          num: "2.4",
          tipo: "choice",
          origen: "m2c4",
          fuente: "p. 9 · act. 15 (con la figura de la act. 16)",
          consigna: "¿Qué ángulo es <b>opuesto por el vértice</b> a RŜQ?",
          fig: function () { return figS(); },
          ops: [
            { t: "NŜP" },
            { t: "PŜR" },
            { t: "RŜQ" },
            { t: "NŜU", ok: true }
          ],
          pista: "Prolongá los lados más allá de S. ¿Qué ángulo queda del otro lado?",
          explica: "Los lados de RŜQ son SR y SQ. Sus prolongaciones son SU y SN, que forman NŜU (α = 26°)."
        },
        {
          id: "m2c5",
          num: "2.5",
          tipo: "multi",
          origen: "m2c5",
          fuente: "p. 9 · act. 15 (con la figura de la act. 16)",
          consigna: "Marcá los <b>dos</b> ángulos <b>adyacentes</b> a β (QŜT).",
          fig: function () { return figS(); },
          ops: [
            { t: "QŜP", ok: true },
            { t: "RŜQ" },
            { t: "TŜN", ok: true },
            { t: "TŜU" },
            { t: "NŜP" }
          ],
          fbMal: "Un adyacente a β comparte con él un lado (SQ o ST), y su otro lado es la prolongación del lado restante de β. Juntos suman 180°.",
          pista: "Uno de los adyacentes usa el lado SQ y la recta PT; el otro usa el lado ST y la recta NQ.",
          explica: "QŜP (lado común SQ, ST y SP forman una recta) y TŜN (lado común ST, SQ y SN forman una recta). Cada uno mide 103° y suma 180° con β."
        }
      ]
    },
    {
      id: "m3",
      titulo: "Bisectriz",
      icono: "bisector",
      contenido: "bisectriz",
      paginas: "pp. 10–12",
      descripcion: "Puntos a igual distancia de dos semirrectas y cálculos con la bisectriz.",
      objetivo: "Reconocer la bisectriz de un ángulo, describir su construcción y usarla para calcular amplitudes.",
      puntos: [],
      desafios: [
        {
          id: "m3c1",
          num: "3.1",
          tipo: "choice",
          origen: "m3c1",
          fuente: "p. 10 · act. 17",
          consigna: "Dos vías de tren se cruzan formando un ángulo de 60°. La torre de control debe estar a la <b>misma distancia de ambas vías</b>. ¿Qué punto sirve?",
          fig: function () {
              var V = [60, 260], o = '';
              [0, 60].forEach(function (a) { var E = F.P(V[0], V[1], 330, a); o += F.seg(V, E, 'rail') + F.seg(V, E, 'rail-ties'); });
              o += F.sector(V, 44, 0, 60, 'sect sect-amber') + F.angLabel(V, 62, 0, 60, '60°');
              o += F.dot(F.P(V[0], V[1], 210, 30), 'A', 14, -8) + F.dot(F.P(V[0], V[1], 190, 47), 'B', -14, -8) + F.dot(F.P(V[0], V[1], 235, 12), 'C', 10, -14);
              return F.svg(420, 290, o, 'Dos vías que se cruzan formando 60 grados y tres posibles ubicaciones A, B y C para la torre.');
            },
          ops: [
            {
              t: "El punto A",
              ok: true,
              fb: "¡Excelente! A está sobre la bisectriz: forma 30° con cada vía, así que está a la misma distancia de ambas."
            },
            {
              t: "El punto B",
              fb: "B está más cerca de una vía que de la otra. Los puntos equidistantes están sobre la línea que divide el ángulo en dos partes iguales."
            },
            {
              t: "El punto C",
              fb: "C está muy cerca de la vía de abajo. Buscá el punto que quede justo \"en el medio\" del ángulo."
            }
          ],
          pista: "Los puntos que están a igual distancia de los dos lados de un ángulo están sobre su bisectriz.",
          explica: "La torre debe ubicarse sobre la bisectriz del ángulo de 60°: el punto A forma 30° con cada vía."
        },
        {
          id: "m3c2",
          num: "3.2",
          tipo: "number",
          origen: "m3c2",
          fuente: "p. 11",
          consigna: "Dos vías de tren se cruzan formando un ángulo de 60° y la torre de control se ubica sobre la bisectriz de ese ángulo. ¿Cuántos grados mide cada uno de los ángulos que quedan formados con la bisectriz?",
          campos: [
            {
              et: "Cada ángulo",
              ans: 30,
              suf: "°",
              mal: [
                { v: 120, fb: "La bisectriz divide el ángulo, no lo multiplica: 60° ÷ 2." },
                { v: 60, fb: "60° es el ángulo completo. La bisectriz lo parte en dos partes iguales." }
              ]
            }
          ],
          pista: "La bisectriz divide al ángulo de 60° en dos partes iguales.",
          explica: "60° ÷ 2 = 30°. Cada ángulo formado con la bisectriz mide 30°."
        },
        {
          id: "m3c3",
          num: "3.3",
          tipo: "order",
          origen: "m3c3",
          fuente: "pp. 10–11 · act. 18 (Leemos)",
          consigna: "Ordená los pasos para trazar la bisectriz con compás. Usá las flechas para mover cada paso.",
          pasos: ["Pinchamos el compás en el vértice y trazamos un arco que corta los lados en A y B.", "Pinchamos el compás en A y trazamos un arco.", "Con la misma abertura, trazamos otro arco desde B: los arcos se cortan en un punto.", "Unimos el vértice con el punto de corte de los arcos: esa semirrecta es la bisectriz."],
          inicio: [2, 0, 3, 1],
          pista: "Primero se marcan A y B sobre los lados; el último paso siempre es trazar la semirrecta.",
          explica: "1) Arco desde el vértice (A y B). 2) Arco desde A. 3) Arco igual desde B: se cortan. 4) Se une el vértice con el cruce."
        },
        {
          id: "m3c4",
          num: "3.4",
          tipo: "number",
          origen: "m3c5",
          fuente: "p. 12 · act. 19",
          consigna: "Los puntos a, o y b están alineados y côb = 62°. La semirrecta od es la bisectriz de aôc. Calculá:",
          fig: function () {
              var O = [260, 200], o = F.line2([40, 200], [480, 200]) + F.ray(O, F.P(O[0], O[1], 180, 62));
              o += F.ray(O, F.P(O[0], O[1], 180, 121), 'ln ln-violet ln-dash');
              o += F.sector(O, 40, 0, 62, 'sect sect-amber') + F.angLabel(O, 60, 0, 62, '62°');
              o += F.arc(O, 58, 62, 180, 'arcl arc-blue');
              o += F.dot([80, 200], 'a', 0, 18) + F.dot(O, 'o', 0, 18) + F.dot([440, 200], 'b', 0, 18);
              o += F.text(F.P(O[0], O[1], 192, 62)[0] + 10, F.P(O[0], O[1], 192, 62)[1], 'c', 'lbl lbl-b') + F.text(F.P(O[0], O[1], 192, 121)[0] - 10, F.P(O[0], O[1], 192, 121)[1], 'd', 'lbl lbl-b lbl-violet');
              return F.svg(520, 230, o, 'Recta a o b con la semirrecta oc que forma 62 grados con ob, y la bisectriz od del ángulo aoc.');
            },
          campos: [
            {
              et: "aôc",
              ans: 118,
              suf: "°",
              mal: [
                { v: 62, fb: "62° es côb. aôc y côb son adyacentes: suman 180°." }
              ]
            },
            {
              et: "aôd",
              ans: 59,
              suf: "°",
              mal: [
                { v: 31, fb: "31° es la mitad de 62°. La bisectriz divide a aôc, no a côb." }
              ]
            },
            { et: "côd", ans: 59, suf: "°" }
          ],
          pista: "aôc y côb son adyacentes (suman 180°). La bisectriz divide aôc en dos partes iguales.",
          explica: "aôc = 180° − 62° = 118°. Como od es bisectriz: aôd = côd = 118° ÷ 2 = 59°."
        }
      ]
    },
    {
      id: "m4",
      titulo: "Triángulos",
      icono: "triangle",
      contenido: "triangulos",
      paginas: "pp. 13–15",
      descripcion: "Clasificación de triángulos y cálculo de sus ángulos.",
      objetivo: "Clasificar triángulos según sus lados y sus ángulos, y aplicar sus propiedades para calcular ángulos.",
      puntos: [],
      desafios: [
        {
          id: "m4c1",
          num: "4.1",
          tipo: "classify",
          origen: "m4c1",
          fuente: "p. 13",
          consigna: "Clasificá cada triángulo <b>según sus lados</b>.",
          cats: ["Equilátero", "Isósceles", "Escaleno"],
          items: [
            { t: "A → lados de 6 cm, 6 cm y 6 cm", cat: "Equilátero" },
            { t: "B → lados de 5 cm, 5 cm y 8 cm", cat: "Isósceles" },
            { t: "C → lados de 4 cm, 6 cm y 7 cm", cat: "Escaleno" },
            { t: "Tres lados de 3,5 cm", cat: "Equilátero" },
            {
              t: "Un lado de 8 cm y los otros dos de 5 cm",
              cat: "Isósceles",
              fb: "Tiene dos lados iguales (5 cm y 5 cm): eso alcanza para que sea isósceles."
            }
          ],
          pista: "Contá cuántos lados tienen la misma medida: 3, 2 o ninguno.",
          explica: "3 lados iguales → equilátero; 2 lados iguales → isósceles; todos distintos → escaleno."
        },
        {
          id: "m4c2",
          num: "4.2",
          tipo: "classify",
          origen: "m4c2",
          fuente: "p. 13",
          consigna: "Ahora clasificá <b>según sus ángulos</b>.",
          cats: ["Acutángulo", "Rectángulo", "Obtusángulo"],
          items: [
            { t: "D → ángulos de 90°, 35° y 55°", cat: "Rectángulo" },
            { t: "Dos ángulos de 30° (y un lado de 7 cm)", cat: "Obtusángulo" },
            { t: "F → ángulos de 120°, 30° y 30°", cat: "Obtusángulo" },
            {
              t: "Dos ángulos de 45° (y un lado de 4,5 cm)",
              cat: "Rectángulo",
              fb: "Calculá el tercer ángulo: 180° − 45° − 45° = 90°."
            }
          ],
          pista: "Buscá si hay un ángulo de 90° (recto) o uno mayor que 90° (obtuso). Si todos son menores que 90°, es acutángulo.",
          explica: "D tiene un ángulo recto: es rectángulo. Con dos ángulos de 30°, el tercero mide 180° − 30° − 30° = 120°: es obtusángulo. F tiene un ángulo obtuso (120°). Con dos ángulos de 45°, el tercero mide 90°: es rectángulo."
        },
        {
          id: "m4c3",
          num: "4.3",
          tipo: "number",
          origen: "m4c5",
          fuente: "p. 14",
          consigna: "Las rayitas indican lados de igual longitud. Calculá el ángulo naranja y el azul.",
          fig: function () {
              var B = [120, 210], C = [400, 210], A = F.triApex(B, C, 67, 67), o = F.poly([A, B, C], 'shape shape-paper');
              o += F.ticks(A, B, 2) + F.ticks(A, C, 2);
              o += F.cornerLabel(B, C, A, 48, '67°');
              o += F.corner(C, A, B, 30, 'sect sect-amber').svg + F.cornerLabel(C, A, B, 52, 'naranja');
              o += F.corner(A, B, C, 30, 'sect sect-blue').svg + F.cornerLabel(A, B, C, 50, 'azul');
              return F.svg(520, 240, o, 'Triángulo isósceles con un ángulo de la base de 67 grados; ángulo naranja en la otra base y ángulo azul arriba.');
            },
          campos: [
            {
              et: "Ángulo naranja",
              ans: 67,
              suf: "°",
              mal: [
                { v: 113, fb: "Los ángulos opuestos a lados iguales tienen la misma amplitud." }
              ]
            },
            {
              et: "Ángulo azul",
              ans: 46,
              suf: "°",
              mal: [
                { v: 113, fb: "Restá los dos ángulos de la base: 180° − 67° − 67°." }
              ]
            }
          ],
          pista: "Los ángulos opuestos a lados iguales miden lo mismo. Después usá que la suma es 180°.",
          explica: "Naranja = 67° (opuesto a un lado igual). Azul = 180° − 67° − 67° = 46°. Es isósceles acutángulo."
        },
        {
          id: "m4c4",
          num: "4.4",
          tipo: "number",
          origen: "m4c6",
          fuente: "p. 15",
          consigna: "Calculá la amplitud de los ángulos interiores del triángulo abc.",
          fig: function () {
              var a = [60, 230], c = [250, 230], b = F.triApex(a, c, 55, 64), o = '';
              o += F.line2([20, 230], [420, 230], 'ln ln-thin');
              o += F.seg(a, F.P(b[0], b[1], 60, F.dir(a, b)), 'ln ln-thin') + F.seg(c, F.P(b[0], b[1], 60, F.dir(c, b)), 'ln ln-thin');
              o += F.poly([a, b, c], 'shape shape-violet');
              o += F.sector(c, 30, 0, F.dir(c, b), 'sect sect-paper') + F.angLabel(c, 48, 0, F.dir(c, b), '116°');
              o += F.sector(b, 28, F.dir(a, b), F.dir(c, b), 'sect sect-paper') + F.angLabel(b, 44, F.dir(a, b), F.dir(c, b), '61°');
              o += F.text(a[0] - 4, a[1] + 16, 'a', 'lbl lbl-b') + F.text(c[0], c[1] + 16, 'c', 'lbl lbl-b') + F.text(b[0] - 18, b[1] + 4, 'b', 'lbl lbl-b');
              return F.svg(440, 260, o, 'Triángulo abc. Junto a b, un ángulo opuesto por el vértice de 61 grados. Junto a c, un ángulo exterior de 116 grados.');
            },
          campos: [
            {
              et: "b̂",
              ans: 61,
              suf: "°",
              mal: [
                { v: 119, fb: "El ángulo de 61° es opuesto por el vértice a b̂: miden lo mismo." }
              ]
            },
            {
              et: "ĉ",
              ans: 64,
              suf: "°",
              mal: [
                { v: 116, fb: "116° está afuera del triángulo. ĉ es su adyacente: 180° − 116°." }
              ]
            },
            { et: "â", ans: 55, suf: "°" }
          ],
          pista: "61° es opuesto por el vértice a b̂. 116° es adyacente a ĉ. Al final usá la suma de 180°.",
          explica: "b̂ = 61° (opuestos por el vértice). ĉ = 180° − 116° = 64° (adyacentes). â = 180° − 61° − 64° = 55°."
        }
      ]
    },
    {
      id: "m5",
      titulo: "Teorema de Pitágoras",
      icono: "pythag",
      contenido: "pitagoras",
      paginas: "pp. 18–23",
      descripcion: "Catetos, hipotenusa y el lado que falta.",
      objetivo: "Identificar catetos e hipotenusa y aplicar el Teorema de Pitágoras para calcular el lado que falta.",
      puntos: ["En Egipto, una cuerda con <b>12 nudos</b> formaba un triángulo de <b>3, 4 y 5</b> nudos con un ángulo recto.", "Los lados que forman el ángulo recto son los <b>catetos</b>; el lado opuesto al ángulo recto es la <b>hipotenusa</b>.", "<b>Teorema de Pitágoras</b>: cateto² + cateto² = hipotenusa² → a² + b² = c²."],
      ejemplo: {
        fig: function () {
          var s = 26, C = [124, 214], A = [124, 214 - 3 * s], B = [124 + 4 * s, 214], o = '';
          o += F.rect(C[0] - 3 * s, A[1], 3 * s, 3 * s, 'cell cell-coral') + F.grid(C[0] - 3 * s, A[1], 3, 3, s, 'gridl-dark');
          o += F.rect(C[0], C[1], 4 * s, 4 * s, 'cell cell-amber') + F.grid(C[0], C[1], 4, 4, s, 'gridl-dark');
          var dx = B[0] - A[0], dy = B[1] - A[1], P3 = [B[0] + dy, B[1] - dx], P4 = [A[0] + dy, A[1] - dx];
          o += F.poly([A, B, P3, P4], 'cell cell-lime');
          for (var i = 1; i < 5; i++) {
            o += F.seg([A[0] + i / 5 * (P4[0] - A[0]), A[1] + i / 5 * (P4[1] - A[1])], [B[0] + i / 5 * (P3[0] - B[0]), B[1] + i / 5 * (P3[1] - B[1])], 'gridl-dark');
            o += F.seg([A[0] + i / 5 * (B[0] - A[0]), A[1] + i / 5 * (B[1] - A[1])], [P4[0] + i / 5 * (P3[0] - P4[0]), P4[1] + i / 5 * (P3[1] - P4[1])], 'gridl-dark');
          }
          o += F.poly([A, B, C], 'shape shape-blue') + F.right(C, 0, 10);
          o += F.text(C[0] - 1.5 * s, A[1] + 1.5 * s, '9', 'lbl lbl-b') + F.text(C[0] + 2 * s, C[1] + 2 * s, '16', 'lbl lbl-b') + F.text((A[0] + P3[0]) / 2, (A[1] + P3[1]) / 2, '25', 'lbl lbl-b');
          return F.svg(340, 330, o, 'Triángulo rectángulo de lados 3, 4 y 5 con un cuadrado sobre cada lado: 9 más 16 igual a 25.');
          },
        html: "3² + 4² = 5² → 9 + 16 = 25."
      },
      desafios: [
        {
          id: "m5c1",
          num: "5.1",
          tipo: "choice",
          origen: "m6c1",
          fuente: "pp. 18–19",
          consigna: "Los tensadores de cuerda formaban un triángulo con lados de 3 nudos, 4 nudos y 5 nudos. ¿Qué tipo de triángulo quedaba conformado?",
          fig: function () {
              var s = 50, C = [60, 220], A = [60, 220 - 3 * s], B = [60 + 4 * s, 220], o = F.poly([A, B, C], 'shape shape-amber') + F.right(C, 0, 14);
              for (var i = 0; i <= 3; i++) o += F.dot([60, 220 - i * s], '');
              for (var j = 1; j <= 4; j++) o += F.dot([60 + j * s, 220], '');
              for (var k = 1; k < 5; k++) o += F.dot([A[0] + k / 5 * (B[0] - A[0]), A[1] + k / 5 * (B[1] - A[1])], '');
              o += F.text(36, 145, '3', 'lbl lbl-b') + F.text(160, 244, '4', 'lbl lbl-b') + F.text(180, 120, '5', 'lbl lbl-b');
              return F.svg(320, 260, o, 'Cuerda con 12 nudos formando un triángulo de 3, 4 y 5 nudos con un ángulo recto.');
            },
          ops: [
            {
              t: "Rectángulo (y escaleno)",
              ok: true,
              fb: "¡Exacto! Tiene un ángulo recto y sus tres lados son distintos."
            },
            { t: "Equilátero", fb: "Sus lados miden 3, 4 y 5 nudos: no son iguales." },
            {
              t: "Isósceles acutángulo",
              fb: "No tiene dos lados iguales, y el ángulo entre los lados de 3 y 4 es recto."
            },
            { t: "Obtusángulo", fb: "El texto dice que se formaba un ángulo recto perfecto, no uno obtuso." }
          ],
          pista: "Releé el paso 3: ¿qué ángulo se formaba entre el lado de 3 y el de 4?",
          explica: "Se formaba un ángulo recto entre los lados de 3 y 4 nudos: es un triángulo rectángulo escaleno."
        },
        {
          id: "m5c2",
          num: "5.2",
          tipo: "classify",
          origen: "m6c4",
          fuente: "p. 21",
          consigna: "Indicá cuáles lados son <b>catetos</b> y cuál es la <b>hipotenusa</b>.",
          fig: function () {
              var E = [30, 40], D = [30, 120], Fp = [260, 40], o = F.poly([D, E, Fp], 'shape shape-paper') + F.right(E, 270, 13);
              o += F.text(E[0] - 12, E[1] - 8, 'E', 'lbl lbl-b') + F.text(D[0] - 12, D[1] + 8, 'D', 'lbl lbl-b') + F.text(Fp[0] + 12, Fp[1], 'F', 'lbl lbl-b');
              var G = [130, 160], H = [250, 160], I = [250, 250];
              o += F.poly([G, H, I], 'shape shape-paper') + F.right(H, 180, 13);
              o += F.text(G[0] - 12, G[1] - 6, 'G', 'lbl lbl-b') + F.text(H[0] + 12, H[1] - 8, 'H', 'lbl lbl-b') + F.text(I[0] + 12, I[1] + 6, 'I', 'lbl lbl-b');
              return F.svg(300, 270, o, 'Triángulo DEF con el ángulo recto en E y triángulo GHI con el ángulo recto en H.');
            },
          cats: ["Cateto", "Hipotenusa"],
          items: [
            { t: "Lado DF", cat: "Hipotenusa" },
            { t: "Lado EF", cat: "Cateto" },
            { t: "Lado HI", cat: "Cateto" },
            { t: "Lado GI", cat: "Hipotenusa" }
          ],
          pista: "En DEF el ángulo recto está en E; en GHI, en H. La hipotenusa es el lado que NO toca el ángulo recto.",
          explica: "DEF: catetos DE y EF, hipotenusa DF. GHI: catetos GH y HI, hipotenusa GI."
        },
        {
          id: "m5c3",
          num: "5.3",
          tipo: "number",
          origen: "m6c7",
          fuente: "p. 21 · e y f (valores modificados por la docente)",
          layout: "widefig",
          consigna: "Calculá el lado que falta de los triángulos de la siguiente imagen.",
          fig: function anonymous(
) {
return '<img class="figimg fig-desafio_5-3_triangulos" src="img/desafio_5-3_triangulos.png" width="659" height="143" alt="e) Triángulo rectángulo de catetos 3,6 cm y 4,8 cm; falta la hipotenusa. f) Triángulo rectángulo de hipotenusa 12,5 cm y cateto 7,5 cm; falta el otro cateto." style="--w:659px">';
},
          campos: [
            {
              et: "e) hipotenusa",
              ans: 6,
              unidades: ["cm", "cm²", "m", "m²"],
              unidad: "cm",
              mal: [
                { v: 8.4, fb: "Sumaste 3,6 + 4,8 sin elevar al cuadrado." },
                { v: 36, fb: "36 es la hipotenusa al cuadrado. Calculá √36" }
              ]
            },
            {
              et: "f) cateto que falta",
              ans: 10,
              unidades: ["cm", "cm²", "m", "m²"],
              unidad: "cm",
              mal: [
                { v: 14.58, fb: "Para el cateto se resta: 12,5² − 7,5²." },
                { v: 100, fb: "100 es el cateto al cuadrado. Calculá √100." }
              ]
            }
          ],
          pista: "e) buscás la hipotenusa (sumá). f) buscás un cateto (restá).",
          explica: "e) 3,6² + 4,8² = 12,96 + 23,04 = 36 → √36 = 6 cm. f) 12,5² − 7,5² = 156,25 − 56,25 = 100 → √100 = 10 cm."
        }
      ]
    },
    {
      id: "m6",
      titulo: "Familias de cuadriláteros",
      icono: "quad",
      contenido: "cuadrilateros",
      paginas: "pp. 27–33",
      descripcion: "Elementos, clasificación, diagonales y ángulos de los cuadriláteros.",
      objetivo: "Reconocer los elementos de un cuadrilátero y clasificarlos según sus lados paralelos. Usar las propiedades de las diagonales y de los ángulos de los cuadriláteros para resolver problemas.",
      puntos: ["Elementos: <b>vértices, lados, ángulos, base y altura</b>.", "La <b>altura</b> se mide en línea recta, formando un ángulo recto (90°) con la base. Nunca es un lado inclinado.", "En cualquier cuadrilátero convexo, la <b>suma de los ángulos interiores es 360°</b> (se divide en 2 triángulos)."],
      desafios: [
        {
          id: "m6c1",
          num: "6.1",
          tipo: "select",
          origen: "m9c3",
          fuente: "p. 28 · act. 41 y 42",
          consigna: "Indicá qué elemento del trapecio señala cada número.",
          fig: function () {
              var BL = [70, 220], BR = [390, 220], TR = [300, 70], TL = [70, 70], o = F.poly([BL, BR, TR, TL], 'shape shape-paper');
              o += F.seg(BL, BR, 'ln ln-coral ln-thick') + F.seg(TR, [300, 220], 'ln ln-green ln-dash') + F.right([300, 220], 90, 11);
              o += F.seg(BR, TR, 'ln ln-blue ln-thick') + F.arc(BR, 34, F.dir(BR, TR), 180, 'arcl arc-coral') + F.dot(TL, '');
              o += F.text(52, 52, '①', 'lbl lbl-tag2') + F.text(366, 130, '②', 'lbl lbl-tag2') + F.text(342, 196, '③', 'lbl lbl-tag2') + F.text(200, 242, '④', 'lbl lbl-tag2') + F.text(282, 150, '⑤', 'lbl lbl-tag2');
              return F.svg(440, 260, o, 'Trapecio con cinco elementos numerados del 1 al 5.');
            },
          ops: ["Vértice", "Lado", "Ángulo", "Base", "Altura"],
          filas: [
            { t: "① → ___", ans: ["Vértice"] },
            { t: "② → ___", ans: ["Lado"] },
            { t: "③ → ___", ans: ["Ángulo"] },
            { t: "④ → ___", ans: ["Base"] },
            { t: "⑤ → ___", ans: ["Altura"], fb: "El segmento ⑤ es perpendicular a la base: es la altura." }
          ],
          pista: "La altura es perpendicular a la base; el ángulo se marca con un arco; el vértice es un punto.",
          explica: "① vértice, ② lado, ③ ángulo, ④ base y ⑤ altura."
        },
        {
          id: "m6c2",
          num: "6.2",
          tipo: "select",
          fuente: "p. 30 · act. 44 (adaptada)",
          layout: "nofig",
          consigna: "Completá.",
          ops: ["un par de lados paralelos", "ningún par de lados paralelos", "dos pares de ángulos iguales", "un par de lados iguales", "dos pares de lados iguales", "dos ángulos rectos"],
          filas: [
            { t: "Trapecio: ___", ans: ["un par de lados paralelos"] },
            { t: "Trapecio isósceles: ___", ans: ["un par de lados iguales"] },
            { t: "Trapecio rectángulo: ___", ans: ["dos ángulos rectos"] },
            { t: "Trapezoide: ___", ans: ["ningún par de lados paralelos"] }
          ],
          pista: "Los \"rectos\" siempre son ángulos."
        },
        {
          id: "m6c3",
          num: "6.3",
          tipo: "select",
          origen: "m9c7",
          fuente: "p. 32 · act. 47",
          layout: "nofig",
          consigna: "Leé cada pista y elegí de qué cuadrilátero específico se trata.",
          ops: ["Rombo", "Cuadrado", "Rectángulo", "Romboide", "Trapecio isósceles", "Trapecio rectángulo", "Trapezoide común"],
          filas: [
            {
              t: "1. Tengo 2 pares de lados opuestos paralelos, mis 4 lados son iguales, pero no tengo ángulos rectos. → ___",
              ans: ["Rombo"],
              fb: "Sin ángulos rectos no puede ser un cuadrado."
            },
            {
              t: "2. Tengo solo 1 par de lados paralelos y dos de mis ángulos son rectos. → ___",
              ans: ["Trapecio rectángulo"]
            },
            {
              t: "3. Tengo 2 pares de lados opuestos paralelos e iguales, y mis 4 ángulos son rectos. → ___",
              ans: [
                ["Rectángulo", "Cuadrado"]
              ]
            }
          ],
          pista: "Fijate primero cuántos pares de lados paralelos menciona cada pista: eso indica la familia.",
          explica: "1. Rombo. 2. Trapecio rectángulo. 3. Rectángulo (el cuadrado también cumple, pero la pista no dice que los 4 lados sean iguales). 4. Trapezoide común. 5. Trapecio isósceles."
        },
        {
          id: "m6c4",
          num: "6.4",
          tipo: "select",
          origen: "m10c7",
          fuente: "p. 33 · act. 49",
          layout: "nofig",
          consigna: "¿Quién o quiénes dicen la verdad? ¿Por qué?",
          filas: [
            {
              t: "<b>Maru:</b> \"Dibujé un rombo con ángulos de 54° y 116°\". → ___",
              ops: [
                ["Dice la verdad", "No dice la verdad"]
              ],
              ans: ["No dice la verdad"]
            },
            {
              t: "<b>Maite:</b> \"El trapecio que construí tiene ángulos de 102° y 77° y es isósceles\". → ___",
              ops: [
                ["Dice la verdad", "No dice la verdad"]
              ],
              ans: ["No dice la verdad"]
            }
          ],
          pista: "Sumá los ángulos que menciona cada uno y compará con las propiedades (360°, consecutivos que suman 180°).",
          explica: "Nadie dice la verdad: 54 + 116 = 170 ≠ 180; 102 + 77 = 179 ≠ 180; 99 + 83 + 90 + 90 = 362 ≠ 360."
        },
        {
          id: "m6c5",
          num: "6.5",
          tipo: "number",
          origen: "m15c4",
          fuente: "Integra pp. 31–32",
          layout: "nofig",
          consigna: "En un romboide, el par de ángulos opuestos iguales mide 110° cada uno. Otro de sus ángulos mide 60°. ¿Cuánto mide el cuarto ángulo?",
          campos: [
            {
              et: "Cuarto ángulo",
              ans: 80,
              suf: "°",
              mal: [
                { v: 190, fb: "Restaste un solo ángulo de 110°. Son dos: 360° − 110° − 110° − 60°." },
                { v: 10, fb: "Usaste 180° como suma total. En un cuadrilátero los ángulos suman 360°." },
                { v: 60, fb: "En el romboide, solo un par de ángulos opuestos es igual (los de 110°)." }
              ]
            }
          ],
          pista: "Los cuatro ángulos de un cuadrilátero suman 360°.",
          explica: "360° − 110° − 110° − 60° = 80°."
        }
      ]
    },
    {
      id: "m7",
      titulo: "Área y perímetro",
      icono: "area",
      contenido: "areas",
      paginas: "pp. 37–43",
      descripcion: "Unidades, figuras compuestas, rombo y trapecio.",
      objetivo: "Comparar figuras según su área y su perímetro, y usar las unidades adecuadas para cada medida. Deducir y aplicar fórmulas de área, y descomponer figuras compuestas para calcular su superficie.",
      puntos: [],
      desafios: [
        {
          id: "m7c1",
          num: "7.1",
          tipo: "classify",
          origen: "m12c1",
          fuente: "p. 37 · act. 55",
          layout: "nofig",
          consigna: "Clasificá cada unidad: ¿sirve para medir longitudes (perímetro) o superficies (área)?",
          cats: ["Longitud (perímetro)", "Superficie (área)"],
          items: [
            { t: "metro (m)", cat: "Longitud (perímetro)" },
            { t: "centímetro cuadrado (cm²)", cat: "Superficie (área)" },
            { t: "kilómetro (km)", cat: "Longitud (perímetro)" },
            { t: "metro cuadrado (m²)", cat: "Superficie (área)" }
          ],
          pista: "Las unidades de superficie llevan el \"cuadrado\" (²).",
          explica: "m, km, dm y cm miden longitudes; cm² y m² miden superficies."
        },
        {
          id: "m7c2",
          num: "7.2",
          tipo: "number",
          fuente: "Figura propuesta por la docente",
          layout: "narrowfig",
          consigna: "Calculá el área de la parte sombreada de gris. Realizá todos los cálculos necesarios.",
          fig: function anonymous(
) {
return '<img class="figimg fig-desafio_7-2_rectangulo" src="img/desafio_7-2_rectangulo.png" width="410" height="266" alt="Rectángulo de 11 dm por 8 dm sombreado de gris, con un rectángulo blanco interior de 9 dm por 6 dm." style="--w:410px">';
},
          campos: [
            {
              et: "Área",
              ans: 34,
              unidades: ["cm", "cm²", "dm", "dm²"],
              unidad: "dm²",
              mal: [
                { v: 88, fb: "Calculaste todo el rectángulo completo sin restar la parte que no está pintada." }
              ]
            }
          ]
        },
        {
          id: "m7c3",
          num: "7.3",
          tipo: "number",
          fuente: "Figura propuesta por la docente",
          layout: "narrowfig",
          consigna: "Calculá el área de la figura completa.",
          fig: function anonymous(
) {
return '<img class="figimg fig-desafio_7-3_casa" src="img/desafio_7-3_casa.png" width="366" height="460" alt="Figura con forma de casa: chimenea de 2 cm por 2 cm, techo con forma de trapecio de 10 cm de ancho total, rectángulo inferior de 8 cm de base y 5 cm de altura; altura total 11 cm." style="--w:366px">';
},
          campos: [
            {
              et: "Área",
              ans: 68,
              unidades: ["cm", "cm²", "m", "m²"],
              unidad: "cm²",
              mal: [
                { v: 78, fb: "Usaste el 10 cm (el ancho total con los aleros del techo) como base del rectángulo inferior." },
                { v: 110, fb: "Usaste la altura total para calcular el trapecio." }
              ]
            }
          ],
          pista: "Dividila la figura y calculá el área por partes para luego sumarlas"
        },
        {
          id: "m7c4",
          num: "7.4",
          tipo: "number",
          origen: "m15c6",
          fuente: "Integra pp. 21, 31 y 41–42 (antes en el desafío final)",
          consigna: "Un rombo tiene diagonales de 8 cm y 6 cm. Sus diagonales son perpendiculares y se cortan en su punto medio, así que cada lado es la hipotenusa de un triángulo rectángulo de catetos 4 cm y 3 cm. Calculá:",
          fig: function () {
            var o = F.poly([[180, 20], [330, 150], [180, 280], [30, 150]], 'shape shape-amber') + F.seg([180, 20], [180, 280], 'ln ln-dash') + F.seg([30, 150], [330, 150], 'ln ln-dash');
            o += F.poly([[180, 150], [330, 150], [180, 20]], 'shape shape-coral-soft') + F.right([180, 150], 0, 12);
            return F.svg(360, 300, o, 'Rombo con sus diagonales y un triángulo rectángulo destacado.');
    },
          campos: [
            {
              et: "Área del rombo",
              ans: 24,
              unidades: ["cm", "cm²", "m", "m²"],
              unidad: "cm²",
              mal: [
                { v: 48, fb: "Falta dividir por 2: (8 × 6) ÷ 2." }
              ]
            },
            {
              et: "Medida de cada lado",
              ans: 5,
              unidades: ["cm", "cm²", "m", "m²"],
              unidad: "cm",
              mal: [
                { v: 10, fb: "Usaste las diagonales completas. Los catetos son las mitades: 4 cm y 3 cm." },
                { v: 7, fb: "Sumaste 4 + 3 sin elevar al cuadrado." }
              ]
            },
            {
              et: "Perímetro del rombo",
              ans: 20,
              unidades: ["cm", "cm²", "m", "m²"],
              unidad: "cm",
              mal: [
                { v: 28, fb: "Las diagonales no forman parte del contorno. El perímetro es 4 × lado." }
              ]
            }
          ],
          pista: "Área: (D × d) ÷ 2. Lado: √(4² + 3²). Perímetro: 4 lados iguales.",
          explica: "Área: (8 × 6) ÷ 2 = 24 cm². Lado: √(16 + 9) = √25 = 5 cm. Perímetro: 4 × 5 = 20 cm."
        }
      ]
    }
  ];

  /* ---------- Notas para la docente (se muestran en el Área docente) ---------- */
  var PENDIENTES = ["Tercera corrección: se quitaron 5.4 (escalera), la clasificación de cuadriláteros (6.2), los ángulos azul y rosa (6.5), el rombo abcd (6.6), Tomi (7.4), escudo y cantero (7.5), trapecio (7.6) y los desafíos 8.1 a 8.3. El rombo de diagonales 8 y 6 cm (antes 8.4) pasa a ser el 7.4. La evaluación queda con 7 misiones y 30 desafíos.", "Misión 6: el documento numera los desafíos 6.1, 6.2, 6.4, 6.5 y 6.8; en la app (informe y planilla) se numeran 6.1 a 6.5 en ese mismo orden.", "Desafío 5.3: el error previsto «Sumaste 3,6 + 4,8 sin elevar al cuadrado» no trae valor; se registra 8,4 (esa suma).", "Desafío 6.2: el trapecio isósceles también tiene «dos pares de ángulos iguales» y el trapecio rectángulo también «un par de lados paralelos»; con la clave del documento esas respuestas cuentan como incorrectas.", "Desafío 6.5: la fila de Maite trae un espacio «porque ___» sin opciones; no se incluyó.", "Desafío 6.3 (pista 3): ahora se aceptan «Rectángulo» y «Cuadrado», como indica el documento (antes la app solo aceptaba «Rectángulo»).", "Desafío 7.3: los errores previstos no traen valor; se registran 78 cm² y 110 cm².", "Las imágenes de 5.3, 7.2 y 7.3 son las del documento (la del 7.2, en la versión de mayor resolución enviada por la docente).", "Misiones 1, 3 y 5 no tienen título en el documento; se usan «Ángulos», «Bisectriz» y «Teorema de Pitágoras».", "Las pistas, soluciones y retroalimentaciones no se muestran a los estudiantes en modo evaluación."];

  global.CONTENIDOS = { misiones: M, contenidos: CONTENIDOS, insignias: INSIGNIAS, pendientes: PENDIENTES, ficha: FICHA, hat: hat };
})(typeof window !== 'undefined' ? window : globalThis);
