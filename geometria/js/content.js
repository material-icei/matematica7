/* =========================================================
   content.js — CONTENIDOS DE LA AVENTURA
   ---------------------------------------------------------
   Este archivo contiene TODAS las misiones y desafíos.
   La docente puede modificar consignas, respuestas, pistas y
   mensajes sin tocar la lógica de la aplicación (app.js / engine.js).

   Cada desafío indica en "fuente" la página y actividad de la
   planificación de la que surge. Las adaptaciones están señaladas.

   Tipos de desafío disponibles:
     choice   → elegir una opción
     multi    → marcar todas las opciones correctas
     number   → ingresar resultados numéricos (con unidad opcional)
     classify → ubicar cada elemento en una categoría
     select   → completar espacios (___) eligiendo de una lista
     order    → ordenar los pasos de un procedimiento
     grid     → dibujar figuras en la cuadrícula (área / perímetro)
     triangle → compás virtual para construir triángulos
     point    → ubicar un punto en el plano (equidistancia)
     hunt     → juego "Cazadores de figuras" (dado)
     self     → autoevaluación (NO se califica)
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

  /* ---------- Contenidos (para el informe) ---------- */
  var CONTENIDOS = {
    angulos: { nombre: 'Ángulos: sistema sexagesimal, complementarios, suplementarios y posiciones',
      fuerte: 'Reconoce y calcula ángulos complementarios, suplementarios, adyacentes y opuestos por el vértice con seguridad.',
      debil: 'Necesita seguir practicando el cálculo de complementos y suplementos y la identificación de ángulos adyacentes y opuestos por el vértice.',
      practica: 'Repasar las misiones 1 y 2. En la carpeta: act. 10, 11 y 16 (pp. 7–9).' },
    bisectriz: { nombre: 'Bisectriz de un ángulo',
      fuerte: 'Comprende que la bisectriz divide el ángulo en dos partes iguales y la usa para resolver problemas.',
      debil: 'Conviene revisar que la bisectriz divide el ángulo en dos partes iguales y cómo usar ese dato en los cálculos.',
      practica: 'Repasar la misión 3. En la carpeta: act. 17, 19 y 21 (pp. 10–12), trazando la bisectriz con compás.' },
    triangulos: { nombre: 'Triángulos: clasificación, propiedades y construcción',
      fuerte: 'Clasifica triángulos y aplica la suma de los ángulos interiores (180°) y la propiedad de los lados.',
      debil: 'Necesita seguir practicando la clasificación de triángulos y el uso de la suma de ángulos interiores.',
      practica: 'Repasar las misiones 4 y 5. En la carpeta: pp. 13–15 y construcciones de las pp. 16–18.' },
    pitagoras: { nombre: 'Teorema de Pitágoras',
      fuerte: 'Identifica catetos e hipotenusa y aplica el Teorema de Pitágoras en problemas.',
      debil: 'Conviene revisar cuándo se suman y cuándo se restan los cuadrados al aplicar el Teorema de Pitágoras.',
      practica: 'Repasar las misiones 6 y 7. En la carpeta: pp. 21–23, señalando primero cuál es la hipotenusa.' },
    mediatriz: { nombre: 'Mediatriz de un segmento',
      fuerte: 'Reconoce la mediatriz como el conjunto de puntos que equidistan de los extremos de un segmento.',
      debil: 'Necesita seguir practicando la construcción de la mediatriz y su propiedad de equidistancia.',
      practica: 'Repasar la misión 8. En la carpeta: pp. 24–26, construyendo la mediatriz con compás.' },
    cuadrilateros: { nombre: 'Cuadriláteros: elementos, clasificación, diagonales y ángulos',
      fuerte: 'Reconoce las propiedades de los cuadriláteros (lados, diagonales y ángulos) y las usa para resolver problemas.',
      debil: 'Conviene revisar la clasificación de los cuadriláteros y las propiedades de sus ángulos y diagonales.',
      practica: 'Repasar las misiones 9 y 10. En la carpeta: act. 43 a 49 (pp. 29–33).' },
    perimetro: { nombre: 'Perímetro y área: diferencias y relaciones',
      fuerte: 'Diferencia perímetro y área, y reconoce que figuras de igual área pueden tener distinto perímetro.',
      debil: 'Necesita seguir practicando la diferencia entre medir el contorno (perímetro) y medir la superficie (área).',
      practica: 'Repasar las misiones 11 y 12. En la carpeta: act. 53, 56 y 57 (pp. 36–38), contando sobre cuadrícula.' },
    areas: { nombre: 'Fórmulas de área y figuras compuestas',
      fuerte: 'Selecciona y aplica fórmulas de área, y descompone figuras compuestas con seguridad.',
      debil: 'Necesita seguir practicando la selección de la fórmula de área y la descomposición de figuras.',
      practica: 'Repasar las misiones 13 y 14. En la carpeta: act. 60, 62, 64 y 65 (pp. 39–42).' },
    integracion: { nombre: 'Integración de contenidos (desafío final)',
      fuerte: 'Integra distintos contenidos de geometría para resolver problemas.',
      debil: 'Conviene revisar los problemas que combinan varios contenidos, resolviéndolos paso a paso.',
      practica: 'Repetir el desafío final, anotando en la carpeta qué propiedad usa en cada paso.' }
  };

  /* ---------- Insignias ---------- */
  var INSIGNIAS = [
    { id: 'angulos', nombre: 'Explorador de ángulos', icono: 'angle', desc: 'Aprobaste las misiones 1 y 2.', regla: { aprobadas: ['m1', 'm2'] } },
    { id: 'bisectriz', nombre: 'Vigía de la bisectriz', icono: 'bisector', desc: 'Aprobaste la misión 3.', regla: { aprobadas: ['m3'] } },
    { id: 'triangulos', nombre: 'Guardián de los triángulos', icono: 'triangle', desc: 'Aprobaste las misiones 4 y 5.', regla: { aprobadas: ['m4', 'm5'] } },
    { id: 'pitagoras', nombre: 'Heredero de Pitágoras', icono: 'pythag', desc: 'Aprobaste las misiones 6 y 7.', regla: { aprobadas: ['m6', 'm7'] } },
    { id: 'mediatriz', nombre: 'Rastreador de la mediatriz', icono: 'perp', desc: 'Aprobaste la misión 8.', regla: { aprobadas: ['m8'] } },
    { id: 'cuadrilateros', nombre: 'Experto en cuadriláteros', icono: 'quad', desc: 'Aprobaste las misiones 9 y 10.', regla: { aprobadas: ['m9', 'm10'] } },
    { id: 'perimetro', nombre: 'Guardián del perímetro', icono: 'grid', desc: 'Aprobaste las misiones 11 y 12.', regla: { aprobadas: ['m11', 'm12'] } },
    { id: 'areas', nombre: 'Arquitecto de áreas', icono: 'area', desc: 'Aprobaste las misiones 13 y 14.', regla: { aprobadas: ['m13', 'm14'] } },
    { id: 'maestro', nombre: 'Maestro de la geometría', icono: 'crown', desc: 'Superaste el desafío final.', regla: { aprobadas: ['m15'] } },
    { id: 'perseverante', nombre: 'Mente perseverante', icono: 'persist', desc: 'Corregiste 5 respuestas después de leer la retroalimentación.', regla: { corregidas: 5 } },
    { id: 'autonomo', nombre: 'Estratega autónomo', icono: 'flag', desc: 'Lograste 3 estrellas en una misión sin pedir pistas.', regla: { tresSinPistas: 1 } },
    { id: 'constelacion', nombre: 'Constelación', icono: 'star', desc: 'Juntaste 30 estrellas.', regla: { estrellas: 30 } }
  ];

  /* =========================================================
     MISIONES
     ========================================================= */
  var M = [];

  /* ---------------- MISIÓN 1 ---------------- */
  M.push({
    id: 'm1', titulo: 'El código de Babilonia', icono: 'angle', contenido: 'angulos', paginas: 'pp. 5–7',
    descripcion: 'Descubrí cómo medimos los ángulos y calculá complementos y suplementos.',
    objetivo: 'Reconocer el ángulo, medirlo en el sistema sexagesimal y calcular ángulos complementarios y suplementarios.',
    puntos: [
      'Dos <b>semirrectas</b> con el mismo origen forman un <b>ángulo</b>. El origen es el <b>vértice</b>.',
      'Sistema <b>sexagesimal</b> (Babilonia): un giro completo mide <b>360°</b>; 1° = 60′ y 1′ = 60″.',
      '<b>Complementarios</b>: suman 90°. <b>Suplementarios</b>: suman 180°.'
    ],
    ejemplo: {
      html: '36° + 54° = 90° → complementarios.<br>123° + 57° = 180° → suplementarios.',
      fig: function () {
        var V = [40, 170], W = [380, 170], o = '';
        o += F.ray(V, [230, 170]) + F.ray(V, [40, 22]) + F.ray(V, F.P(V[0], V[1], 150, 54));
        o += F.sector(V, 42, 0, 54, 'sect sect-blue') + F.sector(V, 42, 54, 90, 'sect sect-green') + F.right(V, 0, 12);
        o += F.angLabel(V, 62, 0, 54, '54°') + F.angLabel(V, 62, 54, 90, '36°');
        o += F.line2([270, 170], [505, 170]) + F.ray(W, F.P(W[0], W[1], 120, 57));
        o += F.sector(W, 34, 0, 57, 'sect sect-violet') + F.sector(W, 34, 57, 180, 'sect sect-amber');
        o += F.angLabel(W, 54, 0, 57, '57°') + F.angLabel(W, 54, 57, 180, '123°');
        return F.svg(520, 200, o, 'Ángulos complementarios de 54 y 36 grados formando un recto, y suplementarios de 57 y 123 grados formando un llano.');
      }
    },
    enlaces: [{ t: 'Video para reforzar (planificación, p. 6)', url: 'https://www.youtube.com/watch?v=XFriekYNaco' }],
    desafios: [
      { id: 'm1c1', tipo: 'choice', fuente: 'p. 5 · act. 7',
        consigna: 'Se construyeron dos semirrectas que tienen el mismo punto de origen. ¿Qué elemento geométrico se formó?',
        fig: function () {
          var O = [70, 180], o = F.ray(O, [370, 180], 'ln ln-blue') + F.ray(O, F.P(O[0], O[1], 300, 38), 'ln ln-blue') + F.dot(O, 'O', -14, 10);
          return F.svg(400, 220, o, 'Dos semirrectas que comparten el origen O.');
        },
        ops: [
          { t: 'Un ángulo', ok: true, fb: '¡Exacto! Dos semirrectas con origen común determinan un ángulo. El origen es su vértice.' },
          { t: 'Un segmento', fb: 'Un segmento tiene dos extremos y no se prolonga. Mirá las flechas: las semirrectas siguen indefinidamente.' },
          { t: 'Una recta', fb: 'Una recta no tiene origen. Aquí hay dos semirrectas que comparten su punto de origen.' },
          { t: 'Un triángulo', fb: 'Un triángulo necesita tres lados que se cierran. Aquí solo hay dos semirrectas abiertas.' }
        ],
        pista: 'Fijate en el punto que comparten las dos semirrectas: ¿qué figura tiene un vértice y dos lados?',
        explica: 'Dos semirrectas con el mismo origen forman un ángulo; el origen es el vértice y las semirrectas son sus lados.' },

      { id: 'm1c2', tipo: 'number', fuente: 'p. 6 · sistema sexagesimal',
        consigna: 'Los babilonios agrupaban de a 60. Una vuelta completa mide 360°. Completá:',
        campos: [
          { et: '¿Cuántas veces entra 60 en 360?', ans: 6, suf: 'veces' },
          { et: '1° equivale a', ans: 60, suf: 'minutos (′)' }
        ],
        pista: 'Pensá en el reloj: 1 hora tiene 60 minutos. Con los ángulos pasa lo mismo con los grados.',
        explica: '360 = 6 × 60, por eso un giro completo son 6 grupos de 60. Cada grado se divide en 60 minutos (′) y cada minuto en 60 segundos (″).' },

      { id: 'm1c3', tipo: 'choice', fuente: 'p. 6 · act. 8',
        consigna: '¿Cuál es la forma correcta de nombrar este ángulo con tres letras?',
        fig: function () {
          var B = [80, 190], o = F.ray(B, [330, 190]) + F.ray(B, F.P(B[0], B[1], 240, 48));
          o += F.arc(B, 40, 0, 48, 'arcl arc-blue') + F.dot(B, 'B', -14, 12) + F.dot([250, 190], 'C', 0, 18) + F.dot(F.P(B[0], B[1], 175, 48), 'A', -16, -6);
          return F.svg(360, 230, o, 'Ángulo con vértice B; el punto A está en un lado y el punto C en el otro.');
        },
        ops: [
          { t: 'A' + hat('B') + 'C', ok: true, fb: '¡Bien! La letra del vértice (B) siempre va en el medio.' },
          { t: 'B' + hat('A') + 'C', fb: 'Así nombrarías un ángulo con vértice en A. ¿Dónde está el vértice en este dibujo?' },
          { t: 'A' + hat('C') + 'B', fb: 'La letra del medio debe ser el vértice. C es un punto de uno de los lados.' },
          { t: 'C' + hat('A') + 'B', fb: 'Revisá: el vértice es el punto donde se unen las dos semirrectas.' }
        ],
        pista: 'Con tres letras, la del medio es la del vértice (donde se unen los lados).',
        explica: 'Se escribe A' + hat('B') + 'C (o C' + hat('B') + 'A): la letra del vértice va en el medio. También puede nombrarse ' + hat('B') + '.' },

      { id: 'm1c4', tipo: 'number', fuente: 'p. 7 · act. 10',
        consigna: 'Completá la tabla de <b>complementos</b>. Recordá: dos ángulos complementarios suman 90°.',
        campos: [
          { et: 'Complemento de α = 23°', ans: 67, suf: '°', mal: [{ v: 157, fb: 'Calculaste el suplemento (180° − 23°). El complemento se calcula con 90°.' }] },
          { et: 'Complemento de α = 82°', ans: 8, suf: '°', mal: [{ v: 98, fb: '98° es el suplemento de 82°. Para el complemento: 90° − 82°.' }] },
          { et: 'α, si su complemento mide 19°', ans: 71, suf: '°', mal: [{ v: 161, fb: 'Usá 90°, no 180°: α + 19° = 90°.' }] }
        ],
        pista: 'Complemento de α = 90° − α.',
        explica: '90° − 23° = 67°; 90° − 82° = 8°; 90° − 19° = 71°.' },

      { id: 'm1c5', tipo: 'number', fuente: 'p. 7 · act. 10',
        consigna: 'Ahora completá los <b>suplementos</b>. Dos ángulos suplementarios suman 180°.',
        campos: [
          { et: 'Suplemento de β = 96°', ans: 84, suf: '°', mal: [{ v: -6, fb: 'Usaste 90°. El suplemento se calcula con 180°.' }] },
          { et: 'Suplemento de β = 108°', ans: 72, suf: '°' },
          { et: 'β, si su suplemento mide 147°', ans: 33, suf: '°', mal: [{ v: 327, fb: 'Sumaste en lugar de restar. β + 147° = 180°.' }] }
        ],
        pista: 'Suplemento de β = 180° − β.',
        explica: '180° − 96° = 84°; 180° − 108° = 72°; 180° − 147° = 33°.' },

      { id: 'm1c6', tipo: 'multi', fuente: 'p. 8 · act. 11',
        consigna: 'Observá los ángulos. Marcá <b>todas</b> las parejas de ángulos <b>complementarios</b>.',
        fig: function () {
          var data = [['A', 13], ['B', 77], ['C', 90], ['D', 45], ['E', 90], ['F', 30], ['G', 135], ['H', 60]], o = '';
          var cls = ['sect-amber', 'sect-green', 'sect-amber', 'sect-coral', 'sect-green', 'sect-coral', 'sect-blue', 'sect-amber'];
          data.forEach(function (d, i) { o += F.angleCard(10 + (i % 4) * 135, 10 + Math.floor(i / 4) * 125, d[1], d[0], 'sect ' + cls[i]); });
          return F.svg(550, 260, o, 'Ángulos A 13°, B 77°, C 90°, D 45°, E 90°, F 30°, G 135°, H 60°.');
        },
        ops: [{ t: 'A y B', ok: true }, { t: 'D y H' }, { t: 'F y H', ok: true }, { t: 'B y F' }, { t: 'C y E' }],
        fbMal: 'Sumá las amplitudes de cada pareja: solo son complementarias las que dan exactamente 90°.',
        pista: 'A = 13° y B = 77°: ¿cuánto suman? Probá lo mismo con las demás parejas.',
        explica: 'A + B = 13° + 77° = 90° y F + H = 30° + 60° = 90°. Las demás no suman 90° (D + H = 105°, B + F = 107°, C + E = 180°).' },

      { id: 'm1c7', tipo: 'multi', fuente: 'p. 8 · act. 11',
        consigna: 'Con los mismos ángulos, marcá <b>todas</b> las parejas de ángulos <b>suplementarios</b>.',
        figDe: 'm1c6',
        ops: [{ t: 'C y E', ok: true }, { t: 'G y H' }, { t: 'D y G', ok: true }, { t: 'A y G' }, { t: 'B y C' }],
        fbMal: 'Buscá parejas que sumen exactamente 180°.',
        pista: 'G = 135°. ¿Qué ángulo le falta para llegar a 180°?',
        explica: 'C + E = 90° + 90° = 180° y D + G = 45° + 135° = 180°.' }
    ]
  });

  /* ---------------- MISIÓN 2 ---------------- */
  M.push({
    id: 'm2', titulo: 'Encrucijada de rectas', icono: 'cross', contenido: 'angulos', paginas: 'pp. 8–9',
    descripcion: 'Ángulos consecutivos, adyacentes y opuestos por el vértice.',
    objetivo: 'Identificar ángulos según su posición y usar sus propiedades para calcular amplitudes.',
    puntos: [
      '<b>Consecutivos</b>: tienen el vértice y un lado en común. Pueden sumar cualquier amplitud.',
      '<b>Adyacentes</b>: tienen el vértice y un lado en común, y los otros lados forman una recta. <b>Suman 180°</b>.',
      '<b>Opuestos por el vértice</b>: solo comparten el vértice. <b>Tienen la misma amplitud</b>.'
    ],
    ejemplo: {
      html: 'Si un ángulo mide 40°, su adyacente mide 180° − 40° = 140° y su opuesto por el vértice mide 40°.',
      fig: function () {
        var o = '', V1 = [30, 160], V2 = [300, 160], V3 = [520, 110];
        o += F.ray(V1, [180, 160]) + F.ray(V1, F.P(V1[0], V1[1], 150, 32)) + F.ray(V1, F.P(V1[0], V1[1], 140, 72));
        o += F.sector(V1, 50, 0, 32, 'sect sect-coral') + F.sector(V1, 50, 32, 72, 'sect sect-blue');
        o += F.text(105, 190, 'Consecutivos', 'lbl lbl-s');
        o += F.line2([215, 160], [395, 160]) + F.ray(V2, F.P(V2[0], V2[1], 120, 45));
        o += F.sector(V2, 34, 0, 45, 'sect sect-coral') + F.sector(V2, 34, 45, 180, 'sect sect-green');
        o += F.text(305, 190, 'Adyacentes', 'lbl lbl-s');
        o += F.line2(F.P(V3[0], V3[1], 95, 200), F.P(V3[0], V3[1], 95, 20)) + F.line2(F.P(V3[0], V3[1], 95, 160), F.P(V3[0], V3[1], 95, 340));
        o += F.sector(V3, 46, 160, 200, 'sect sect-green') + F.sector(V3, 46, 340, 20, 'sect sect-amber');
        o += F.text(520, 190, 'Opuestos por el vértice', 'lbl lbl-s');
        return F.svg(620, 205, o, 'Ejemplos de ángulos consecutivos, adyacentes y opuestos por el vértice.');
      }
    },
    desafios: [
      { id: 'm2c1', tipo: 'choice', fuente: 'p. 8 · act. 12',
        consigna: 'Los ángulos ' + hat('C') + ' y ' + hat('D') + ' tienen el vértice y un lado en común, y sus otros lados forman una recta. ¿Cómo se llaman y cuánto suman?',
        fig: function () {
          var V = [200, 170], o = F.line2([30, 170], [370, 170]) + F.ray(V, F.P(V[0], V[1], 150, 50));
          o += F.sector(V, 48, 50, 180, 'sect sect-green') + F.sector(V, 48, 0, 50, 'sect sect-coral');
          o += F.angLabel(V, 70, 50, 180, hat('C')) + F.angLabel(V, 72, 0, 50, hat('D'));
          return F.svg(400, 210, o, 'Dos ángulos C y D con un lado común; sus otros lados forman una recta.');
        },
        ops: [
          { t: 'Adyacentes: suman 180°', ok: true, fb: '¡Muy bien! Comparten vértice y un lado, y juntos forman un ángulo llano.' },
          { t: 'Opuestos por el vértice: miden lo mismo', fb: 'Los opuestos por el vértice solo comparten el vértice, no un lado.' },
          { t: 'Consecutivos: pueden sumar cualquier valor', fb: 'Son consecutivos, sí, pero además forman un ángulo llano: tienen un nombre más preciso.' },
          { t: 'Complementarios: suman 90°', fb: 'Mirá la recta de abajo: juntos forman un ángulo llano, no uno recto.' }
        ],
        pista: 'Cuando los lados no comunes forman una recta, los dos ángulos juntos forman un ángulo llano.',
        explica: 'Son adyacentes: tienen el vértice y un lado común y suman 180° (ángulo llano).' },

      { id: 'm2c2', tipo: 'number', fuente: 'p. 8 · act. 13 (con medida agregada)',
        consigna: 'El ángulo verde mide 50°. Calculá la amplitud de su ángulo <b>adyacente</b> y de su ángulo <b>opuesto por el vértice</b>.',
        fig: function () {
          var V = [210, 150], o = '';
          o += F.line2(F.P(V[0], V[1], 170, 180), F.P(V[0], V[1], 170, 0)) + F.line2(F.P(V[0], V[1], 150, 230), F.P(V[0], V[1], 150, 50));
          o += F.sector(V, 46, 0, 50, 'sect sect-green') + F.angLabel(V, 66, 0, 50, '50°');
          o += F.sector(V, 34, 50, 180, 'sect sect-amber') + F.angLabel(V, 56, 50, 180, 'adyacente');
          o += F.sector(V, 46, 180, 230, 'sect sect-blue') + F.angLabel(V, 72, 180, 230, 'opuesto');
          return F.svg(420, 300, o, 'Ángulo de 50 grados con su adyacente y su opuesto por el vértice.');
        },
        campos: [
          { et: 'Ángulo adyacente', ans: 130, suf: '°', mal: [{ v: 40, fb: '40° es el complemento. El adyacente completa un ángulo llano: 180° − 50°.' }, { v: 50, fb: 'El que mide lo mismo es el opuesto por el vértice. El adyacente completa 180°.' }] },
          { et: 'Ángulo opuesto por el vértice', ans: 50, suf: '°', mal: [{ v: 130, fb: 'Los ángulos opuestos por el vértice tienen la misma amplitud.' }] }
        ],
        pista: 'El adyacente completa 180°. El opuesto por el vértice tiene la misma amplitud.',
        explica: 'Adyacente: 180° − 50° = 130°. Opuesto por el vértice: 50°, porque los opuestos por el vértice son iguales.' },

      { id: 'm2c3', tipo: 'number', fuente: 'p. 9 · act. 16',
        consigna: 'Las rectas NQ, UR y PT se cortan en S. N' + hat('S') + 'P = 77° y P' + hat('S') + 'R también mide 77°. Calculá α y β.',
        fig: function () { return figS({ psr: true }); },
        campos: [
          { et: 'α', ans: 26, suf: '°', mal: [{ v: 77, fb: 'α no es opuesto a N' + hat('S') + 'P. Primero calculá R' + hat('S') + 'Q: N' + hat('S') + 'P + P' + hat('S') + 'R + R' + hat('S') + 'Q = 180°.' }, { v: 103, fb: '103° = 180° − 77°, pero α está entre N y U. Buscá el ángulo opuesto a α.' }] },
          { et: 'β', ans: 77, suf: '°', mal: [{ v: 26, fb: 'β es opuesto por el vértice a N' + hat('S') + 'P, no a R' + hat('S') + 'Q.' }] }
        ],
        pista: 'N' + hat('S') + 'P + P' + hat('S') + 'R + R' + hat('S') + 'Q forman un ángulo llano (180°). Después buscá los ángulos opuestos por el vértice.',
        explica: 'R' + hat('S') + 'Q = 180° − 77° − 77° = 26°. α es opuesto por el vértice a R' + hat('S') + 'Q → α = 26°. β es opuesto por el vértice a N' + hat('S') + 'P → β = 77°.' },

      { id: 'm2c4', tipo: 'choice', fuente: 'p. 9 · act. 15 (con la figura de la act. 16)',
        consigna: '¿Qué ángulo es <b>opuesto por el vértice</b> a β (Q' + hat('S') + 'T)?',
        fig: function () { return figS(); },
        ops: [
          { t: 'N' + hat('S') + 'P', ok: true, fb: '¡Correcto! SN es la prolongación de SQ y SP es la prolongación de ST.' },
          { t: 'P' + hat('S') + 'R', fb: 'P' + hat('S') + 'R comparte el vértice con β, pero sus lados no son prolongaciones de los lados de β.' },
          { t: 'R' + hat('S') + 'Q', fb: 'R' + hat('S') + 'Q y β comparten el lado SQ: son consecutivos, no opuestos.' },
          { t: 'N' + hat('S') + 'U', fb: 'N' + hat('S') + 'U es α. Sus lados (SN y SU) no son prolongaciones de SQ y ST a la vez.' }
        ],
        pista: 'Prolongá los lados de β (SQ y ST) más allá de S. ¿Qué ángulo queda del otro lado?',
        explica: 'Los lados de β son SQ y ST. Sus prolongaciones son SN y SP, que forman N' + hat('S') + 'P (77°).' },

      { id: 'm2c5', tipo: 'multi', fuente: 'p. 9 · act. 15 (con la figura de la act. 16)',
        consigna: 'Marcá los <b>dos</b> ángulos <b>adyacentes</b> a β (Q' + hat('S') + 'T).',
        figDe: 'm2c4',
        ops: [{ t: 'Q' + hat('S') + 'P', ok: true }, { t: 'R' + hat('S') + 'Q' }, { t: 'T' + hat('S') + 'N', ok: true }, { t: 'T' + hat('S') + 'U' }, { t: 'N' + hat('S') + 'P' }],
        fbMal: 'Un adyacente a β comparte con él un lado (SQ o ST), y su otro lado es la prolongación del lado restante de β. Juntos suman 180°.',
        pista: 'Uno de los adyacentes usa el lado SQ y la recta PT; el otro usa el lado ST y la recta NQ.',
        explica: 'Q' + hat('S') + 'P (lado común SQ, ST y SP forman una recta) y T' + hat('S') + 'N (lado común ST, SQ y SN forman una recta). Cada uno mide 103° y suma 180° con β.' },

      { id: 'm2c6', tipo: 'select', fuente: 'p. 9 · act. 14 (adaptada a la figura de la act. 16)',
        consigna: 'Indicá si cada afirmación es verdadera o falsa.',
        figDe: 'm2c4',
        ops: ['Verdadera', 'Falsa'],
        filas: [
          { t: 'α y R' + hat('S') + 'Q son opuestos por el vértice. → ___', ans: ['Verdadera'] },
          { t: 'N' + hat('S') + 'P y P' + hat('S') + 'R son consecutivos. → ___', ans: ['Verdadera'] },
          { t: 'β y T' + hat('S') + 'U son adyacentes. → ___', ans: ['Falsa'], fb: 'β y T' + hat('S') + 'U comparten el lado ST, pero SQ y SU no forman una recta: son consecutivos, no adyacentes.' },
          { t: 'N' + hat('S') + 'P y β tienen la misma amplitud. → ___', ans: ['Verdadera'] }
        ],
        pista: 'Para que sean adyacentes, los lados que NO comparten tienen que formar una recta.',
        explica: 'Verdadera, verdadera, falsa (β y T' + hat('S') + 'U son consecutivos) y verdadera (son opuestos por el vértice).' }
    ]
  });

  /* ---------------- MISIÓN 3 ---------------- */
  M.push({
    id: 'm3', titulo: 'La torre de control', icono: 'bisector', contenido: 'bisectriz', paginas: 'pp. 10–12',
    descripcion: 'Ubicá puntos a igual distancia de dos semirrectas usando la bisectriz.',
    objetivo: 'Reconocer la bisectriz de un ángulo, describir su construcción y usarla para calcular amplitudes.',
    puntos: [
      'La <b>bisectriz</b> es la semirrecta que sale del vértice y divide al ángulo en <b>dos partes iguales</b>.',
      'Cada punto de la bisectriz está a la <b>misma distancia</b> de los dos lados del ángulo.',
      'Se traza con <b>compás</b>: un arco desde el vértice, dos arcos iguales desde los puntos de corte y se une el vértice con el cruce.'
    ],
    ejemplo: {
      html: 'Si un ángulo mide 80°, su bisectriz lo divide en dos ángulos de 40°.',
      fig: function () {
        var V = [50, 210], o = F.ray(V, [340, 210]) + F.ray(V, F.P(V[0], V[1], 300, 56));
        var A = F.P(V[0], V[1], 120, 0), B = F.P(V[0], V[1], 120, 56), X = F.P(V[0], V[1], 176, 28);
        o += F.arc(V, 120, -6, 62, 'arcl arc-dot') + F.arc(A, 90, F.dir(A, X) - 14, F.dir(A, X) + 14, 'arcl arc-dot') + F.arc(B, 90, F.dir(B, X) - 14, F.dir(B, X) + 14, 'arcl arc-dot');
        o += F.ray(V, F.P(V[0], V[1], 300, 28), 'ln ln-violet');
        o += F.dot(A, 'A', 8, 16) + F.dot(B, 'B', -14, -4) + F.dot(X, '', 0, 0);
        o += F.sector(V, 50, 0, 28, 'sect sect-coral') + F.sector(V, 50, 28, 56, 'sect sect-amber');
        o += F.text(300, 120, 'bisectriz', 'lbl lbl-s lbl-violet');
        return F.svg(360, 240, o, 'Construcción de la bisectriz con compás: arco desde el vértice y dos arcos desde A y B.');
      }
    },
    desafios: [
      { id: 'm3c1', tipo: 'choice', fuente: 'p. 10 · act. 17',
        consigna: 'Dos vías de tren se cruzan formando un ángulo de 60°. La torre de control debe estar a la <b>misma distancia de ambas vías</b>. ¿Qué punto sirve?',
        fig: function () {
          var V = [60, 260], o = '';
          [0, 60].forEach(function (a) { var E = F.P(V[0], V[1], 330, a); o += F.seg(V, E, 'rail') + F.seg(V, E, 'rail-ties'); });
          o += F.sector(V, 44, 0, 60, 'sect sect-amber') + F.angLabel(V, 62, 0, 60, '60°');
          o += F.dot(F.P(V[0], V[1], 210, 30), 'A', 14, -8) + F.dot(F.P(V[0], V[1], 190, 47), 'B', -14, -8) + F.dot(F.P(V[0], V[1], 235, 12), 'C', 10, -14);
          return F.svg(420, 290, o, 'Dos vías que se cruzan formando 60 grados y tres posibles ubicaciones A, B y C para la torre.');
        },
        ops: [
          { t: 'El punto A', ok: true, fb: '¡Excelente! A está sobre la bisectriz: forma 30° con cada vía, así que está a la misma distancia de ambas.' },
          { t: 'El punto B', fb: 'B está más cerca de una vía que de la otra. Los puntos equidistantes están sobre la línea que divide el ángulo en dos partes iguales.' },
          { t: 'El punto C', fb: 'C está muy cerca de la vía de abajo. Buscá el punto que quede justo "en el medio" del ángulo.' }
        ],
        pista: 'Los puntos que están a igual distancia de los dos lados de un ángulo están sobre su bisectriz.',
        explica: 'La torre debe ubicarse sobre la bisectriz del ángulo de 60°: el punto A forma 30° con cada vía.' },

      { id: 'm3c2', tipo: 'number', fuente: 'p. 11',
        consigna: 'En el problema de la torre de control, ¿cuántos grados mide cada uno de los ángulos que quedan formados con la bisectriz?',
        campos: [{ et: 'Cada ángulo', ans: 30, suf: '°', mal: [{ v: 120, fb: 'La bisectriz divide el ángulo, no lo multiplica: 60° ÷ 2.' }, { v: 60, fb: '60° es el ángulo completo. La bisectriz lo parte en dos partes iguales.' }] }],
        pista: 'La bisectriz divide al ángulo de 60° en dos partes iguales.',
        explica: '60° ÷ 2 = 30°. Cada ángulo formado con la bisectriz mide 30°.' },

      { id: 'm3c3', tipo: 'order', fuente: 'pp. 10–11 · act. 18 (Leemos)',
        consigna: 'Ordená los pasos para trazar la bisectriz con compás. Usá las flechas para mover cada paso.',
        pasos: [
          'Pinchamos el compás en el vértice y trazamos un arco que corta los lados en A y B.',
          'Pinchamos el compás en A y trazamos un arco.',
          'Con la misma abertura, trazamos otro arco desde B: los arcos se cortan en un punto.',
          'Unimos el vértice con el punto de corte de los arcos: esa semirrecta es la bisectriz.'
        ],
        inicio: [2, 0, 3, 1],
        figDe: null,
        pista: 'Primero se marcan A y B sobre los lados; el último paso siempre es trazar la semirrecta.',
        explica: '1) Arco desde el vértice (A y B). 2) Arco desde A. 3) Arco igual desde B: se cortan. 4) Se une el vértice con el cruce.' },

      { id: 'm3c4', tipo: 'number', fuente: 'p. 11 · act. 18 (ángulo a)',
        consigna: 'El ángulo <b>a</b> de la actividad 18 es un ángulo recto. Si trazás su bisectriz, ¿cuánto mide cada parte?',
        fig: function () {
          var V = [80, 230], o = F.ray(V, [320, 230]) + F.ray(V, [80, 20]) + F.right(V, 0, 16) + F.ray(V, F.P(V[0], V[1], 230, 45), 'ln ln-violet ln-dash');
          o += F.angLabel(V, 70, 0, 45, '?') + F.angLabel(V, 70, 45, 90, '?');
          return F.svg(340, 250, o, 'Ángulo recto con su bisectriz punteada.');
        },
        campos: [{ et: 'Cada parte', ans: 45, suf: '°' }],
        pista: 'Un ángulo recto mide 90°.',
        explica: '90° ÷ 2 = 45°.' },

      { id: 'm3c5', tipo: 'number', fuente: 'p. 12 · act. 19',
        consigna: 'Los puntos a, o y b están alineados y c' + hat('o') + 'b = 62°. La semirrecta od es la bisectriz de ' + hat('aoc') + '. Calculá:',
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
          { et: hat('aoc'), ans: 118, suf: '°', mal: [{ v: 62, fb: '62° es c' + hat('o') + 'b. ' + hat('aoc') + ' y c' + hat('o') + 'b son adyacentes: suman 180°.' }] },
          { et: hat('aod'), ans: 59, suf: '°', mal: [{ v: 31, fb: '31° es la mitad de 62°. La bisectriz divide a ' + hat('aoc') + ', no a c' + hat('o') + 'b.' }] },
          { et: hat('cod'), ans: 59, suf: '°' }
        ],
        pista: hat('aoc') + ' y c' + hat('o') + 'b son adyacentes (suman 180°). La bisectriz divide ' + hat('aoc') + ' en dos partes iguales.',
        explica: hat('aoc') + ' = 180° − 62° = 118°. Como od es bisectriz: ' + hat('aod') + ' = ' + hat('cod') + ' = 118° ÷ 2 = 59°.' },

      { id: 'm3c6', tipo: 'number', fuente: 'p. 12 · act. 21 (a)',
        consigna: 'Datos: ob es bisectriz de ' + hat('aoc') + '; ' + hat('aoc') + ' = 120° y ' + hat('aob') + ' = 3x + 30°. Calculá el valor de x.',
        fig: function () {
          var O = [90, 190], o = F.ray(O, [380, 190]) + F.ray(O, F.P(O[0], O[1], 190, 60)) + F.ray(O, F.P(O[0], O[1], 190, -60));
          o += F.sector(O, 46, 300, 360, 'sect sect-amber') + F.angLabel(O, 92, 300, 360, '3x + 30°');
          o += F.arc(O, 30, 300, 60, 'arcl arc-blue');
          o += F.text(388, 175, 'b', 'lbl lbl-b') + F.text(F.P(O[0], O[1], 205, 60)[0] + 12, F.P(O[0], O[1], 205, 60)[1], 'c', 'lbl lbl-b') + F.text(F.P(O[0], O[1], 205, -60)[0] + 12, F.P(O[0], O[1], 205, -60)[1], 'a', 'lbl lbl-b') + F.text(O[0] - 16, O[1], 'o', 'lbl lbl-b');
          return F.svg(420, 380, o, 'Ángulo aoc de 120 grados con la bisectriz ob; el ángulo aob mide 3x más 30 grados.');
        },
        campos: [{ et: 'x =', ans: 10, suf: '', mal: [{ v: 30, fb: 'Ojo: ' + hat('aob') + ' es la MITAD de ' + hat('aoc') + ', porque ob es bisectriz. Entonces 3x + 30° = 60°.' }] }],
        pista: 'Primero calculá ' + hat('aob') + ' = 120° ÷ 2. Después resolvé 3x + 30 = ese valor.',
        explica: hat('aob') + ' = 120° ÷ 2 = 60°. Entonces 3x + 30 = 60 → 3x = 30 → x = 10.' },

      { id: 'm3c7', tipo: 'choice', fuente: 'p. 12 · act. 20 y 21',
        consigna: 'α y β son <b>adyacentes</b> y se traza la bisectriz de α. Damián dice que cada uno de los ángulos que quedan representa la <b>cuarta parte</b> del suplemento de β. ¿Tiene razón?',
        fig: function () {
          var V = [210, 190], o = F.line2([30, 190], [390, 190]) + F.ray(V, F.P(V[0], V[1], 160, 70));
          o += F.ray(V, F.P(V[0], V[1], 160, 125), 'ln ln-violet ln-dash');
          o += F.sector(V, 40, 70, 180, 'sect sect-green') + F.sector(V, 40, 0, 70, 'sect sect-amber');
          o += F.angLabel(V, 62, 70, 180, 'α') + F.angLabel(V, 62, 0, 70, 'β');
          return F.svg(420, 220, o, 'Ángulos adyacentes alfa y beta, con la bisectriz de alfa punteada.');
        },
        ops: [
          { t: 'No: el suplemento de β es α, así que cada parte es la mitad del suplemento de β.', ok: true, fb: '¡Muy buen razonamiento! Como α + β = 180°, el suplemento de β es α, y la bisectriz divide α en 2 (no en 4).' },
          { t: 'Sí: la bisectriz divide en cuatro partes iguales.', fb: 'La bisectriz divide un ángulo en DOS partes iguales.' },
          { t: 'Sí, porque α + β = 90°.', fb: 'α y β son adyacentes: suman 180°, no 90°.' },
          { t: 'No: cada parte es igual a β.', fb: 'Solo pasaría si α fuera el doble de β; no siempre se cumple.' }
        ],
        pista: 'Si α y β son adyacentes, ¿cuál es el suplemento de β?',
        explica: 'α + β = 180°, entonces el suplemento de β es α. La bisectriz divide α en dos partes: cada una es la mitad del suplemento de β.' }
    ]
  });

  /* ---------------- MISIÓN 4 ---------------- */
  M.push({
    id: 'm4', titulo: 'Laboratorio de triángulos', icono: 'triangle', contenido: 'triangulos', paginas: 'pp. 13–15',
    descripcion: 'Clasificá triángulos y calculá sus ángulos sin transportador.',
    objetivo: 'Clasificar triángulos según sus lados y sus ángulos, y aplicar sus propiedades para calcular ángulos.',
    puntos: [
      'Según sus lados: <b>equilátero</b> (3 iguales), <b>isósceles</b> (2 iguales), <b>escaleno</b> (3 distintos).',
      'Según sus ángulos: <b>acutángulo</b> (3 agudos), <b>rectángulo</b> (1 recto), <b>obtusángulo</b> (1 obtuso).',
      'La <b>suma de los ángulos interiores es 180°</b>. Los ángulos opuestos a lados iguales miden lo mismo.'
    ],
    ejemplo: {
      html: 'Si dos ángulos miden 50° y 70°, el tercero mide 180° − 50° − 70° = 60°.',
      fig: function () {
        var B = [40, 190], C = [300, 190], A = F.triApex(B, C, 50, 70), o = F.poly([A, B, C], 'shape shape-lime');
        o += F.corner(B, C, A, 34, 'sect sect-violet').svg + F.corner(C, A, B, 34, 'sect sect-amber').svg + F.corner(A, B, C, 30, 'sect sect-blue').svg;
        o += F.cornerLabel(B, C, A, 52, '50°') + F.cornerLabel(C, A, B, 52, '70°') + F.cornerLabel(A, B, C, 48, '60°');
        o += F.text(360, 120, '50° + 70° + 60°', 'lbl lbl-s', 'middle') + F.text(360, 145, '= 180°', 'lbl lbl-b', 'middle');
        return F.svg(440, 220, o, 'Triángulo con ángulos de 50, 70 y 60 grados que suman 180.');
      }
    },
    desafios: [
      { id: 'm4c1', tipo: 'classify', fuente: 'p. 13',
        consigna: 'Clasificá cada triángulo <b>según sus lados</b>.',
        cats: ['Equilátero', 'Isósceles', 'Escaleno'],
        items: [
          { t: 'A → lados de 6 cm, 6 cm y 6 cm', cat: 'Equilátero' },
          { t: 'B → lados de 5 cm, 5 cm y 8 cm', cat: 'Isósceles' },
          { t: 'C → lados de 4 cm, 6 cm y 7 cm', cat: 'Escaleno' },
          { t: 'Tres lados de 3,5 cm', cat: 'Equilátero' },
          { t: 'Un lado de 8 cm y los otros dos de 5 cm', cat: 'Isósceles', fb: 'Tiene dos lados iguales (5 cm y 5 cm): eso alcanza para que sea isósceles.' }
        ],
        pista: 'Contá cuántos lados tienen la misma medida: 3, 2 o ninguno.',
        explica: '3 lados iguales → equilátero; 2 lados iguales → isósceles; todos distintos → escaleno.' },

      { id: 'm4c2', tipo: 'classify', fuente: 'p. 13',
        consigna: 'Ahora clasificá <b>según sus ángulos</b>.',
        cats: ['Acutángulo', 'Rectángulo', 'Obtusángulo'],
        items: [
          { t: 'D → ángulos de 90°, 35° y 55°', cat: 'Rectángulo' },
          { t: 'E → ángulos de 60°, 60° y 60°', cat: 'Acutángulo' },
          { t: 'F → ángulos de 120°, 30° y 30°', cat: 'Obtusángulo' },
          { t: 'Dos ángulos de 45° (y un lado de 4,5 cm)', cat: 'Rectángulo', fb: 'Calculá el tercer ángulo: 180° − 45° − 45° = 90°.' }
        ],
        pista: 'Buscá si hay un ángulo de 90° (recto) o uno mayor que 90° (obtuso). Si todos son menores que 90°, es acutángulo.',
        explica: 'D tiene un ángulo recto; E tiene tres agudos; F tiene uno obtuso (120°). Con dos ángulos de 45°, el tercero mide 90°: es rectángulo.' },

      { id: 'm4c3', tipo: 'choice', fuente: 'p. 13 · c',
        consigna: 'Un triángulo tiene un lado de 4,5 cm y dos ángulos de 45°. Según sus <b>lados</b>, ¿cómo es?',
        ops: [
          { t: 'Isósceles', ok: true, fb: '¡Bien! Los lados opuestos a ángulos iguales miden lo mismo: tiene dos lados iguales.' },
          { t: 'Equilátero', fb: 'Un equilátero tiene tres ángulos de 60°. Este tiene 45°, 45° y 90°.' },
          { t: 'Escaleno', fb: 'Tiene dos ángulos iguales, y a ángulos iguales se oponen lados iguales.' }
        ],
        pista: 'Propiedad: los ángulos opuestos a lados iguales tienen la misma amplitud (y al revés).',
        explica: 'Tiene dos ángulos iguales (45°), entonces los lados opuestos a ellos son iguales: es isósceles (y rectángulo).' },

      { id: 'm4c4', tipo: 'number', fuente: 'p. 14',
        consigna: 'Sin usar transportador, calculá la amplitud de los ángulos coloreados.',
        fig: function () {
          var o = '', B = [30, 205], A = [30, 95], C = [30 + 110 / Math.tan(23 * Math.PI / 180), 205];
          o += F.poly([A, B, C], 'shape shape-paper') + F.right(B, 0, 13);
          o += F.corner(A, B, C, 26, 'sect sect-green').svg + F.cornerLabel(A, B, C, 42, 'verde');
          o += F.cornerLabel(C, A, B, 52, '23°');
          var B2 = [320, 205], C2 = [560, 205], A2 = F.triApex(B2, C2, 52, 60);
          o += F.poly([A2, B2, C2], 'shape shape-paper');
          o += F.corner(B2, C2, A2, 26, 'sect sect-paper').svg + F.cornerLabel(B2, C2, A2, 42, '52°') + F.cornerLabel(C2, A2, B2, 42, '60°');
          o += F.corner(A2, B2, C2, 30, 'sect sect-violet').svg + F.cornerLabel(A2, B2, C2, 46, 'lila');
          return F.svg(580, 230, o, 'Triángulo rectángulo con un ángulo de 23 grados y ángulo verde desconocido; triángulo con ángulos de 52 y 60 grados y ángulo lila desconocido.');
        },
        campos: [
          { et: 'Ángulo verde', ans: 67, suf: '°', mal: [{ v: 157, fb: 'Olvidaste restar el ángulo recto: 180° − 90° − 23°.' }] },
          { et: 'Ángulo lila', ans: 68, suf: '°' }
        ],
        pista: 'La suma de los tres ángulos interiores es 180°. El cuadradito indica un ángulo recto (90°).',
        explica: 'Verde: 180° − 90° − 23° = 67°. Lila: 180° − 52° − 60° = 68°.' },

      { id: 'm4c5', tipo: 'number', fuente: 'p. 14',
        consigna: 'Las rayitas indican lados de igual longitud. Calculá el ángulo naranja y el azul.',
        fig: function () {
          var B = [120, 210], C = [400, 210], A = F.triApex(B, C, 67, 67), o = F.poly([A, B, C], 'shape shape-paper');
          o += F.ticks(A, B, 2) + F.ticks(A, C, 2);
          o += F.cornerLabel(B, C, A, 48, '67°');
          o += F.corner(C, A, B, 30, 'sect sect-amber').svg + F.cornerLabel(C, A, B, 52, 'naranja');
          o += F.corner(A, B, C, 30, 'sect sect-blue').svg + F.cornerLabel(A, B, C, 50, 'azul');
          return F.svg(520, 240, o, 'Triángulo isósceles con un ángulo de la base de 67 grados; ángulo naranja en la otra base y ángulo azul arriba.');
        },
        campos: [
          { et: 'Ángulo naranja', ans: 67, suf: '°', mal: [{ v: 113, fb: 'Los ángulos opuestos a lados iguales tienen la misma amplitud.' }] },
          { et: 'Ángulo azul', ans: 46, suf: '°', mal: [{ v: 113, fb: 'Restá los dos ángulos de la base: 180° − 67° − 67°.' }] }
        ],
        pista: 'Los ángulos opuestos a lados iguales miden lo mismo. Después usá que la suma es 180°.',
        explica: 'Naranja = 67° (opuesto a un lado igual). Azul = 180° − 67° − 67° = 46°. Es isósceles acutángulo.' },

      { id: 'm4c6', tipo: 'number', fuente: 'p. 15',
        consigna: 'Calculá la amplitud de los ángulos interiores del triángulo abc.',
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
          { et: hat('b'), ans: 61, suf: '°', mal: [{ v: 119, fb: 'El ángulo de 61° es opuesto por el vértice a ' + hat('b') + ': miden lo mismo.' }] },
          { et: hat('c'), ans: 64, suf: '°', mal: [{ v: 116, fb: '116° está afuera del triángulo. ' + hat('c') + ' es su adyacente: 180° − 116°.' }] },
          { et: hat('a'), ans: 55, suf: '°' }
        ],
        pista: '61° es opuesto por el vértice a ' + hat('b') + '. 116° es adyacente a ' + hat('c') + '. Al final usá la suma de 180°.',
        explica: hat('b') + ' = 61° (opuestos por el vértice). ' + hat('c') + ' = 180° − 116° = 64° (adyacentes). ' + hat('a') + ' = 180° − 61° − 64° = 55°.' },

      { id: 'm4c7', tipo: 'number', fuente: 'p. 15',
        consigna: 'Calculá la amplitud de los ángulos interiores del triángulo pqo.',
        fig: function () {
          var p = [200, 200], oo = [380, 200], q = F.triApex(p, oo, 105, 42), o = '';
          o += F.line2([30, 200], [470, 200], 'ln ln-thin') + F.seg(q, F.P(oo[0], oo[1], 70, F.dir(q, oo)), 'ln ln-thin');
          o += F.poly([q, p, oo], 'shape shape-green');
          o += F.sector(p, 30, F.dir(p, q), 180, 'sect sect-paper') + F.angLabel(p, 50, F.dir(p, q), 180, '75°');
          o += F.sector(oo, 30, F.norm(F.dir(oo, q) + 180), 360, 'sect sect-paper') + F.angLabel(oo, 50, F.norm(F.dir(oo, q) + 180), 360, '42°');
          o += F.text(q[0] - 12, q[1] - 6, 'q', 'lbl lbl-b') + F.text(p[0] + 4, p[1] + 18, 'p', 'lbl lbl-b') + F.text(oo[0] - 6, oo[1] - 18, 'o', 'lbl lbl-b');
          return F.svg(500, 250, o, 'Triángulo pqo. Junto a p, un ángulo exterior de 75 grados. Junto a o, un ángulo opuesto por el vértice de 42 grados.');
        },
        campos: [
          { et: hat('p'), ans: 105, suf: '°', mal: [{ v: 75, fb: '75° está afuera del triángulo: es adyacente a ' + hat('p') + '.' }] },
          { et: hat('o'), ans: 42, suf: '°', mal: [{ v: 138, fb: 'El ángulo de 42° es opuesto por el vértice a ' + hat('o') + ', no adyacente.' }] },
          { et: hat('q'), ans: 33, suf: '°' }
        ],
        pista: '75° y ' + hat('p') + ' son adyacentes. 42° y ' + hat('o') + ' son opuestos por el vértice.',
        explica: hat('p') + ' = 180° − 75° = 105°. ' + hat('o') + ' = 42°. ' + hat('q') + ' = 180° − 105° − 42° = 33°. Es un triángulo obtusángulo.' }
    ]
  });

  /* ---------------- MISIÓN 5 ---------------- */
  M.push({
    id: 'm5', titulo: 'Taller del compás', icono: 'compass', contenido: 'triangulos', paginas: 'pp. 14, 16–18',
    descripcion: 'Construí triángulos con compás y descubrí cuándo es posible hacerlo.',
    objetivo: 'Describir la construcción de triángulos y reconocer qué datos permiten construirlos.',
    puntos: [
      'Con los <b>tres lados</b>: se traza un lado y, con el compás, dos arcos desde sus extremos. Donde se cortan está el tercer vértice.',
      'Propiedad: <b>cada lado es menor que la suma de los otros dos</b>. Si no, los arcos no se cortan.',
      'Con los ángulos: se usa el transportador. Los tres ángulos siempre suman 180°.'
    ],
    ejemplo: {
      html: 'Lados de 5 cm, 4 cm y 3 cm: 5 &lt; 4 + 3, así que el triángulo se puede construir.',
      fig: function () {
        var s = 46, L = [60, 200], R = [60 + 5 * s, 200], o = F.seg(L, R, 'ln ln-coral');
        var X = F.circleX(L, 3 * s, R, 4 * s)[0];
        o += F.arc(L, 3 * s, 30, 110, 'arcl arc-dot') + F.arc(R, 4 * s, 110, 170, 'arcl arc-dot');
        o += F.seg(L, X, 'ln ln-green') + F.seg(R, X, 'ln ln-violet') + F.dot(X, '', 0, 0);
        o += F.text(L[0] + 2.5 * s, 220, 'a = 5 cm', 'lbl lbl-s') + F.sideLabel(L, X, 'c = 3', 1, 18) + F.sideLabel(X, R, 'b = 4', 1, 18);
        return F.svg(380, 240, o, 'Construcción de un triángulo de lados 5, 4 y 3 centímetros con arcos de compás.');
      }
    },
    desafios: [
      { id: 'm5c1', tipo: 'order', fuente: 'p. 16',
        consigna: 'Ordená los pasos para construir un triángulo conociendo sus tres lados a, b y c.',
        pasos: [
          'Se traza un segmento de longitud a.',
          'Con el compás se toma la medida c y se traza un arco haciendo centro en un extremo del segmento a.',
          'Con el compás se toma la medida b y se traza un arco desde el otro extremo del segmento a.',
          'Se trazan segmentos desde el punto donde se cortan los arcos hasta los extremos del segmento inicial.'
        ],
        inicio: [3, 1, 0, 2],
        pista: 'Siempre se empieza trazando uno de los lados; los segmentos finales salen del cruce de los arcos.',
        explica: '1) Segmento a. 2) Arco de radio c desde un extremo. 3) Arco de radio b desde el otro extremo. 4) Unir el cruce de los arcos con los extremos.' },

      { id: 'm5c2', tipo: 'multi', fuente: 'pp. 14 y 16',
        consigna: '¿Con cuáles de estas medidas <b>se puede</b> construir un triángulo? Marcá todas.',
        ops: [{ t: '5 cm, 3 cm y 3 cm', ok: true }, { t: '7 cm, 3 cm y 3 cm' }, { t: '4 cm, 4 cm y 4 cm', ok: true }, { t: '2 cm, 2 cm y 5 cm' }, { t: '4 cm, 6 cm y 3 cm', ok: true }],
        fbMal: 'Probá la propiedad: cada lado debe ser menor que la suma de los otros dos. Por ejemplo, 3 + 3 = 6 no alcanza para un lado de 7.',
        pista: 'Compará el lado más largo con la suma de los otros dos.',
        explica: '5 < 3 + 3 ✓; 4 < 4 + 4 ✓; 6 < 4 + 3 ✓. En cambio 7 > 3 + 3 y 5 > 2 + 2: los arcos no se cortan.' },

      { id: 'm5c3', tipo: 'triangle', fuente: 'p. 16 (compás virtual)',
        consigna: 'Compás virtual: los lados a = 5 cm y b = 3 cm están fijos. Elegí una medida para el lado <b>c</b> con la que <b>NO se pueda</b> construir el triángulo.',
        a: 5, b: 3, min: 0.5, max: 10, paso: 0.5, inicial: 4, meta: 'imposible',
        pista: 'Probá con un lado c muy largo o muy corto y mirá si los arcos se cortan.',
        explica: 'Con a = 5 y b = 3, el lado c tiene que ser mayor que 2 (5 − 3) y menor que 8 (5 + 3). Con c ≤ 2 o c ≥ 8 los arcos no se cortan.' },

      { id: 'm5c4', tipo: 'triangle', fuente: 'pp. 13 y 16 (compás virtual)',
        consigna: 'Con los mismos lados a = 5 cm y b = 3 cm, elegí una medida para <b>c</b> que forme un triángulo <b>isósceles</b>.',
        a: 5, b: 3, min: 0.5, max: 10, paso: 0.5, inicial: 6.5, meta: 'isosceles',
        pista: 'Un triángulo isósceles tiene dos lados iguales. ¿Qué valores de c repiten una medida que ya tenés?',
        explica: 'c = 5 cm (lados 5, 5, 3) o c = 3 cm (lados 5, 3, 3). En ambos casos los arcos se cortan.' },

      { id: 'm5c5', tipo: 'number', fuente: 'p. 18 · act. 7 b',
        consigna: 'Triángulo def: de = 4,5 cm; ' + hat('d') + ' = 50°; ' + hat('e') + ' = 65°. Antes de construirlo, calculá ' + hat('f') + '.',
        fig: function () {
          var d = [70, 210], e = [70 + 4.5 * 52, 210], f = F.triApex(d, e, 50, 65), o = F.poly([d, e, f], 'shape shape-paper');
          o += F.corner(d, e, f, 30, 'sect sect-coral').svg + F.cornerLabel(d, e, f, 48, '50°');
          o += F.corner(e, f, d, 30, 'sect sect-blue').svg + F.cornerLabel(e, f, d, 48, '65°');
          o += F.cornerLabel(f, d, e, 40, '?') + F.text(d[0] - 12, d[1] + 10, 'd', 'lbl lbl-b') + F.text(e[0] + 12, e[1] + 10, 'e', 'lbl lbl-b') + F.text(f[0], f[1] - 14, 'f', 'lbl lbl-b');
          o += F.dim(d, e, '4,5 cm', -24);
          return F.svg(380, 260, o, 'Triángulo def con lado de de 4,5 centímetros y ángulos de 50 y 65 grados.');
        },
        campos: [{ et: hat('f'), ans: 65, suf: '°' }],
        pista: 'Los tres ángulos interiores suman 180°.',
        explica: hat('f') + ' = 180° − 50° − 65° = 65°.' },

      { id: 'm5c6', tipo: 'choice', fuente: 'p. 18 · act. 7 b',
        consigna: 'El triángulo def tiene ángulos de 50°, 65° y 65°. Según sus <b>lados</b>, ¿cómo será?',
        ops: [
          { t: 'Isósceles', ok: true, fb: '¡Bien! Tiene dos ángulos iguales, entonces los lados opuestos a ellos también son iguales.' },
          { t: 'Equilátero', fb: 'Para ser equilátero, sus tres ángulos deberían medir 60°.' },
          { t: 'Escaleno', fb: 'Tiene dos ángulos iguales (65°): los lados opuestos a esos ángulos miden lo mismo.' }
        ],
        pista: 'Los ángulos opuestos a lados iguales tienen la misma amplitud (y viceversa).',
        explica: 'Como ' + hat('e') + ' = ' + hat('f') + ' = 65°, los lados opuestos a esos ángulos son iguales: es isósceles.' },

      { id: 'm5c7', tipo: 'choice', fuente: 'p. 17 · Observa y responde',
        consigna: 'Se construyó un triángulo con ángulos de 60°, 40° y 80°. ¿Se puede construir <b>otro</b> triángulo con las mismas medidas de ángulos pero con <b>lados de diferentes medidas</b>?',
        ops: [
          { t: 'Sí: hay infinitos triángulos con esos ángulos; cambia el tamaño, no la forma.', ok: true, fb: '¡Exacto! Si cambiás la longitud del lado CA, obtenés otro triángulo más grande o más chico con los mismos ángulos.' },
          { t: 'No: los ángulos determinan las medidas de los lados.', fb: 'Probá imaginar el mismo dibujo empezando con un segmento CA de 8 cm en lugar de 5 cm: los ángulos serían iguales.' },
          { t: 'Solo si el triángulo es equilátero.', fb: 'Este triángulo no es equilátero (sus ángulos no miden 60° cada uno) y aun así se puede agrandar o achicar.' },
          { t: 'No, porque 60° + 40° + 80° no suma 180°.', fb: 'Sumá de nuevo: 60° + 40° + 80° = 180°.' }
        ],
        pista: '¿Qué pasaría si en la construcción empezaras con un segmento CA más largo?',
        explica: 'Los ángulos no fijan el tamaño: con un segmento inicial más largo o más corto se obtienen triángulos con los mismos ángulos y lados distintos (proporcionales).' },

      { id: 'm5c8', tipo: 'choice', fuente: 'p. 17 · act. 7 c',
        consigna: 'Triángulo ghi: gh = 3,5 cm; gi = 5 cm; ' + hat('g') + ' = 95°. Según sus <b>ángulos</b>, ¿cómo será?',
        ops: [
          { t: 'Obtusángulo', ok: true, fb: '¡Correcto! Un ángulo de 95° es obtuso (mayor que 90°).' },
          { t: 'Rectángulo', fb: 'Un rectángulo tiene un ángulo de 90° exactos. 95° es mayor.' },
          { t: 'Acutángulo', fb: 'Para ser acutángulo, los tres ángulos deben ser menores que 90°.' }
        ],
        pista: '¿95° es menor, igual o mayor que 90°?',
        explica: 'Como ' + hat('g') + ' = 95° > 90°, el triángulo es obtusángulo.' },

      { id: 'm5c9', tipo: 'self', fuente: 'pp. 16–18 · act. 7',
        consigna: 'Construí en tu carpeta los triángulos de la actividad 7 (a, b, c y d) con regla, compás y transportador. Después marcá lo que hiciste:',
        items: [
          'Medí cada segmento con la regla, empezando desde el 0.',
          'Usé el compás con la abertura exacta de cada lado.',
          'Ubiqué el centro del transportador en el vértice para medir los ángulos.',
          'Verifiqué que los ángulos de cada triángulo sumaran 180°.',
          'Nombré los vértices con las letras pedidas.'
        ] }
    ]
  });

  /* ---------------- MISIÓN 6 ---------------- */
  M.push({
    id: 'm6', titulo: 'La cuerda de 12 nudos', icono: 'pythag', contenido: 'pitagoras', paginas: 'pp. 18–21',
    descripcion: 'El secreto de los tensadores de cuerda de Egipto y el Teorema de Pitágoras.',
    objetivo: 'Identificar catetos e hipotenusa y aplicar el Teorema de Pitágoras para calcular el lado que falta.',
    puntos: [
      'En Egipto, una cuerda con <b>12 nudos</b> formaba un triángulo de <b>3, 4 y 5</b> nudos con un ángulo recto.',
      'Los lados que forman el ángulo recto son los <b>catetos</b>; el lado opuesto al ángulo recto es la <b>hipotenusa</b>.',
      '<b>Teorema de Pitágoras</b>: cateto² + cateto² = hipotenusa² → a² + b² = c².'
    ],
    ejemplo: {
      html: '3² + 4² = 5² → 9 + 16 = 25.',
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
      }
    },
    enlaces: [{ t: 'Video para reforzar (planificación, p. 20 · hasta los 5 minutos)', url: 'https://www.youtube.com/watch?v=EtpBriFADEs' }],
    desafios: [
      { id: 'm6c1', tipo: 'choice', fuente: 'pp. 18–19',
        consigna: 'Los tensadores de cuerda formaban un triángulo con lados de 3 nudos, 4 nudos y 5 nudos. ¿Qué tipo de triángulo quedaba conformado?',
        fig: function () {
          var s = 50, C = [60, 220], A = [60, 220 - 3 * s], B = [60 + 4 * s, 220], o = F.poly([A, B, C], 'shape shape-amber') + F.right(C, 0, 14);
          for (var i = 0; i <= 3; i++) o += F.dot([60, 220 - i * s], '');
          for (var j = 1; j <= 4; j++) o += F.dot([60 + j * s, 220], '');
          for (var k = 1; k < 5; k++) o += F.dot([A[0] + k / 5 * (B[0] - A[0]), A[1] + k / 5 * (B[1] - A[1])], '');
          o += F.text(36, 145, '3', 'lbl lbl-b') + F.text(160, 244, '4', 'lbl lbl-b') + F.text(180, 120, '5', 'lbl lbl-b');
          return F.svg(320, 260, o, 'Cuerda con 12 nudos formando un triángulo de 3, 4 y 5 nudos con un ángulo recto.');
        },
        ops: [
          { t: 'Rectángulo (y escaleno)', ok: true, fb: '¡Exacto! Tiene un ángulo recto y sus tres lados son distintos.' },
          { t: 'Equilátero', fb: 'Sus lados miden 3, 4 y 5 nudos: no son iguales.' },
          { t: 'Isósceles acutángulo', fb: 'No tiene dos lados iguales, y el ángulo entre los lados de 3 y 4 es recto.' },
          { t: 'Obtusángulo', fb: 'El texto dice que se formaba un ángulo recto perfecto, no uno obtuso.' }
        ],
        pista: 'Releé el paso 3: ¿qué ángulo se formaba entre el lado de 3 y el de 4?',
        explica: 'Se formaba un ángulo recto entre los lados de 3 y 4 nudos: es un triángulo rectángulo escaleno.' },

      { id: 'm6c2', tipo: 'number', fuente: 'p. 19',
        consigna: 'Pitágoras dibujó un cuadrado sobre cada lado del triángulo de 3, 4 y 5. Calculá el área de cada cuadrado (en cuadraditos).',
        figDe: 'intro',
        campos: [
          { et: 'Cuadrado sobre el lado 3 (3²)', ans: 9, suf: 'cuadraditos', mal: [{ v: 6, fb: '3² no es 3 × 2. Es 3 × 3.' }] },
          { et: 'Cuadrado sobre el lado 4 (4²)', ans: 16, suf: 'cuadraditos', mal: [{ v: 8, fb: '4² es 4 × 4, no 4 × 2.' }] },
          { et: 'Cuadrado sobre el lado 5 (5²)', ans: 25, suf: 'cuadraditos', mal: [{ v: 10, fb: '5² es 5 × 5.' }] }
        ],
        pista: 'El área de un cuadrado es lado × lado. Por ejemplo, 3² = 3 × 3.',
        explica: '3² = 9, 4² = 16 y 5² = 25. ¡9 + 16 = 25! Las áreas de los cuadrados de los catetos suman el área del cuadrado de la hipotenusa.' },

      { id: 'm6c3', tipo: 'classify', fuente: 'p. 21',
        consigna: 'En el triángulo ABC, indicá cuáles lados son <b>catetos</b> y cuál es la <b>hipotenusa</b>.',
        fig: function () {
          var A = [90, 30], B = [90, 210], C = [230, 210], o = F.poly([A, B, C], 'shape shape-paper') + F.right(B, 0, 14);
          o += F.text(A[0] - 14, A[1], 'A', 'lbl lbl-b') + F.text(B[0] - 14, B[1] + 10, 'B', 'lbl lbl-b') + F.text(C[0] + 14, C[1] + 6, 'C', 'lbl lbl-b');
          return F.svg(320, 240, o, 'Triángulo rectángulo ABC con el ángulo recto en B.');
        },
        cats: ['Cateto', 'Hipotenusa'],
        items: [{ t: 'Lado AB', cat: 'Cateto' }, { t: 'Lado BC', cat: 'Cateto' }, { t: 'Lado CA', cat: 'Hipotenusa', fb: 'CA es el lado opuesto al ángulo recto (en B): es la hipotenusa.' }],
        pista: 'Buscá el ángulo recto. Los dos lados que lo forman son catetos.',
        explica: 'El ángulo recto está en B: AB y BC lo forman (catetos) y CA está enfrente (hipotenusa).' },

      { id: 'm6c4', tipo: 'classify', fuente: 'p. 21',
        consigna: 'Ahora, en los triángulos DEF y GHI.',
        fig: function () {
          var E = [30, 40], D = [30, 120], Fp = [260, 40], o = F.poly([D, E, Fp], 'shape shape-paper') + F.right(E, 270, 13);
          o += F.text(E[0] - 12, E[1] - 8, 'E', 'lbl lbl-b') + F.text(D[0] - 12, D[1] + 8, 'D', 'lbl lbl-b') + F.text(Fp[0] + 12, Fp[1], 'F', 'lbl lbl-b');
          var G = [130, 160], H = [250, 160], I = [250, 250];
          o += F.poly([G, H, I], 'shape shape-paper') + F.right(H, 180, 13);
          o += F.text(G[0] - 12, G[1] - 6, 'G', 'lbl lbl-b') + F.text(H[0] + 12, H[1] - 8, 'H', 'lbl lbl-b') + F.text(I[0] + 12, I[1] + 6, 'I', 'lbl lbl-b');
          return F.svg(300, 270, o, 'Triángulo DEF con el ángulo recto en E y triángulo GHI con el ángulo recto en H.');
        },
        cats: ['Cateto', 'Hipotenusa'],
        items: [
          { t: 'Lado DF', cat: 'Hipotenusa' }, { t: 'Lado EF', cat: 'Cateto' }, { t: 'Lado DE', cat: 'Cateto' },
          { t: 'Lado GH', cat: 'Cateto' }, { t: 'Lado HI', cat: 'Cateto' }, { t: 'Lado GI', cat: 'Hipotenusa' }
        ],
        pista: 'En DEF el ángulo recto está en E; en GHI, en H. La hipotenusa es el lado que NO toca el ángulo recto.',
        explica: 'DEF: catetos DE y EF, hipotenusa DF. GHI: catetos GH y HI, hipotenusa GI.' },

      { id: 'm6c5', tipo: 'number', fuente: 'p. 21 · a y b',
        consigna: 'Usando el Teorema de Pitágoras, calculá la medida del lado que falta.',
        fig: function () {
          var o = F.rtri(50, 190, 4 * 34, 3 * 34, { v: '3 cm', h: '4 cm', c: '?' });
          o += F.text(30, 30, 'a)', 'lbl lbl-b', 'start');
          o += F.rtri(270, 190, 8 * 20, 6 * 20, { v: '?', h: '8 cm', c: '10 cm' });
          o += F.text(250, 30, 'b)', 'lbl lbl-b', 'start');
          return F.svg(480, 220, o, 'a) Triángulo rectángulo de catetos 3 y 4 centímetros. b) Triángulo rectángulo de hipotenusa 10 y cateto 8 centímetros.');
        },
        campos: [
          { et: 'a) hipotenusa', ans: 5, unidades: U_LONG, unidad: 'cm', mal: [{ v: 7, fb: 'Sumaste las medidas sin elevarlas al cuadrado. Calculá 3² + 4² y después la raíz.' }, { v: 25, fb: '25 es la hipotenusa al cuadrado. Falta calcular la raíz cuadrada.' }] },
          { et: 'b) cateto que falta', ans: 6, unidades: U_LONG, unidad: 'cm', mal: [{ v: 12.81, fb: 'Sumaste los cuadrados, pero 10 cm es la hipotenusa. Para un cateto se resta: 10² − 8².' }, { v: 2, fb: 'Restaste las medidas sin elevarlas al cuadrado: 10² − 8² = 100 − 64.' }] }
        ],
        pista: 'Si buscás la hipotenusa: sumá los cuadrados de los catetos. Si buscás un cateto: restá (hipotenusa² − cateto²). Al final, calculá la raíz cuadrada.',
        explica: 'a) 3² + 4² = 9 + 16 = 25 → √25 = 5 cm. b) 10² − 8² = 100 − 64 = 36 → √36 = 6 cm.' },

      { id: 'm6c6', tipo: 'number', fuente: 'p. 21 · c y d',
        consigna: 'Calculá el lado que falta. Redondeá a los <b>centésimos</b> (podés usar la calculadora).',
        fig: function () {
          var o = F.rtri(150, 200, 6.32 * 15, 9 * 15, { v: '9 cm', h: '?', c: '11 cm' }, true);
          o += F.text(20, 30, 'c)', 'lbl lbl-b', 'start');
          o += F.rtri(300, 200, 3 * 18, 7.42 * 18, { v: '?', h: '3 cm', c: '8 cm' });
          o += F.text(260, 30, 'd)', 'lbl lbl-b', 'start');
          return F.svg(440, 230, o, 'c) Triángulo rectángulo de hipotenusa 11 y cateto 9 centímetros. d) Triángulo rectángulo de hipotenusa 8 y cateto 3 centímetros.');
        },
        campos: [
          { et: 'c) cateto que falta', ans: 6.32, tol: 0.02, unidades: U_LONG, unidad: 'cm', mal: [{ v: 14.21, fb: '11 cm es la hipotenusa (está enfrente del ángulo recto). Para el cateto se resta: 11² − 9².' }, { v: 40, fb: '40 es el cateto al cuadrado. Calculá √40.' }] },
          { et: 'd) cateto que falta', ans: 7.42, tol: 0.02, unidades: U_LONG, unidad: 'cm', mal: [{ v: 8.54, fb: '8 cm es la hipotenusa: restá 8² − 3².' }, { v: 55, fb: '55 es el cateto al cuadrado. Calculá √55.' }] }
        ],
        pista: 'En los dos casos el dato más largo es la hipotenusa: hipotenusa² − cateto² y después la raíz.',
        explica: 'c) 11² − 9² = 121 − 81 = 40 → √40 ≈ 6,32 cm. d) 8² − 3² = 64 − 9 = 55 → √55 ≈ 7,42 cm.' },

      { id: 'm6c7', tipo: 'number', fuente: 'p. 21 · e y f',
        consigna: 'Calculá el lado que falta. Redondeá a los <b>centésimos</b>.',
        fig: function () {
          var o = F.rtri(40, 190, 4.5 * 26, 3.5 * 26, { v: '3,5 cm', h: '4,5 cm', c: '?' });
          o += F.text(20, 30, 'e)', 'lbl lbl-b', 'start');
          o += F.rtri(270, 190, 9.5 * 14, 8.12 * 14, { v: '?', h: '9,5 cm', c: '12,5 cm' });
          o += F.text(250, 30, 'f)', 'lbl lbl-b', 'start');
          return F.svg(460, 220, o, 'e) Triángulo rectángulo de catetos 3,5 y 4,5 centímetros. f) Triángulo rectángulo de hipotenusa 12,5 y cateto 9,5 centímetros.');
        },
        campos: [
          { et: 'e) hipotenusa', ans: 5.70, tol: 0.02, unidades: U_LONG, unidad: 'cm', mal: [{ v: 8, fb: 'Sumaste 3,5 + 4,5 sin elevar al cuadrado.' }, { v: 32.5, fb: '32,5 es la hipotenusa al cuadrado. Calculá √32,5.' }] },
          { et: 'f) cateto que falta', ans: 8.12, tol: 0.02, unidades: U_LONG, unidad: 'cm', mal: [{ v: 15.70, fb: '12,5 cm es la hipotenusa. Para el cateto se resta: 12,5² − 9,5².' }, { v: 66, fb: '66 es el cateto al cuadrado. Calculá √66.' }] }
        ],
        pista: 'e) buscás la hipotenusa (sumá). f) buscás un cateto (restá). 12,5² = 156,25.',
        explica: 'e) 3,5² + 4,5² = 12,25 + 20,25 = 32,5 → √32,5 ≈ 5,70 cm. f) 12,5² − 9,5² = 156,25 − 90,25 = 66 → √66 ≈ 8,12 cm.' }
    ]
  });

  /* ---------------- MISIÓN 7 ---------------- */
  M.push({
    id: 'm7', titulo: 'Ingenieros de la antigüedad', icono: 'ramp', contenido: 'pitagoras', paginas: 'pp. 21–23',
    descripcion: 'Rampas, escaleras, sombras y terrenos: Pitágoras en acción.',
    objetivo: 'Resolver situaciones problemáticas aplicando el Teorema de Pitágoras.',
    puntos: [
      '1) Buscá el <b>triángulo rectángulo</b> en la situación.',
      '2) Identificá la <b>hipotenusa</b> (el lado opuesto al ángulo recto, el más largo).',
      '3) Si falta la hipotenusa: <b>sumá</b> los cuadrados. Si falta un cateto: <b>restá</b>. Al final, la <b>raíz cuadrada</b>.'
    ],
    ejemplo: {
      html: 'Hipotenusa 17 cm y cateto 15 cm: 17² − 15² = 289 − 225 = 64 → √64 = 8 cm.',
      fig: function () {
        var o = F.rtri(70, 200, 230, 150, {});
        o += F.text(46, 125, 'cateto', 'lbl lbl-s lbl-coral', 'end') + F.text(185, 222, 'cateto', 'lbl lbl-s lbl-coral') + F.sideLabel([70, 50], [300, 200], 'hipotenusa', 1, 20, 'lbl lbl-s lbl-violet');
        return F.svg(340, 240, o, 'Triángulo rectángulo con los catetos y la hipotenusa señalados.');
      }
    },
    desafios: [
      { id: 'm7c1', tipo: 'choice', fuente: 'pp. 20–23',
        consigna: 'En un problema conocés la <b>hipotenusa</b> y un <b>cateto</b>. ¿Qué cálculo hacés para encontrar el otro cateto?',
        ops: [
          { t: 'cateto² = hipotenusa² − cateto² (y después la raíz)', ok: true, fb: '¡Bien! Como hipotenusa² = cateto² + cateto², para un cateto se resta.' },
          { t: 'cateto² = hipotenusa² + cateto²', fb: 'Si sumás, obtendrías algo más largo que la hipotenusa. Un cateto siempre es más corto.' },
          { t: 'cateto = hipotenusa − cateto', fb: 'Hay que trabajar con los cuadrados de las medidas, no con las medidas directamente.' },
          { t: 'cateto = hipotenusa ÷ 2', fb: 'Eso no surge del Teorema de Pitágoras.' }
        ],
        pista: 'Partí de a² + b² = c². Si conocés c y a, ¿cómo despejás b²?',
        explica: 'De a² + b² = c² se obtiene b² = c² − a². Después se calcula la raíz cuadrada.' },

      { id: 'm7c2', tipo: 'number', fuente: 'p. 22 · a (datos del texto)',
        consigna: 'Los constructores egipcios transportaban bloques por una rampa de <b>6,5 m</b> de longitud. La base de la rampa mide <b>2,5 m</b>. ¿A qué altura llega la rampa (la distancia vertical)?',
        fig: function () {
          var s = 34, A = [70, 240], C = [70 + 2.5 * s, 240], T = [C[0], 240 - 6 * s], o = '';
          o += F.seg([30, 240], [260, 240], 'ln') + F.seg(A, T, 'ln ln-amber ln-thick') + F.seg(C, T, 'ln ln-dash') + F.right(C, 90, 12) + F.dot(T, '');
          o += F.text(C[0] + 14, 140, '¿altura?', 'lbl lbl-s', 'start') + F.text((A[0] + C[0]) / 2, 258, '2,5 m', 'lbl lbl-s') + F.text((A[0] + T[0]) / 2 - 16, (A[1] + T[1]) / 2, 'rampa 6,5 m', 'lbl lbl-s', 'end');
          return F.svg(300, 270, o, 'Rampa de 6,5 metros con una base de 2,5 metros; la altura es desconocida.');
        },
        campos: [{ et: 'Altura', ans: 6, unidades: U_LONG, unidad: 'm', mal: [{ v: 6.96, fb: 'La rampa (6,5 m) es la hipotenusa: para la altura se resta 6,5² − 2,5².' }, { v: 4, fb: 'Restaste las medidas sin elevar al cuadrado.' }] }],
        pista: 'La rampa es la hipotenusa: 6,5² = 42,25 y 2,5² = 6,25.',
        explica: '6,5² − 2,5² = 42,25 − 6,25 = 36 → √36 = 6 m.' },

      { id: 'm7c3', tipo: 'number', fuente: 'p. 22 · b (unidades en metros)',
        consigna: 'Los ingenieros romanos apoyaron en una pared una escalera de <b>2,5 m</b>. Su base está a <b>0,7 m</b> de la pared. ¿Hasta qué altura de la pared llega la escalera?',
        fig: function () {
          var s = 80, W = [220, 240], B = [220 - 0.7 * s, 240], T = [220, 240 - 2.4 * s], o = '';
          o += F.rect(220, 30, 30, 210, 'wall') + F.seg([60, 240], [270, 240], 'ln');
          o += F.seg(B, T, 'ln ln-amber ln-thick') + F.right(W, 180, 11);
          o += F.text(258, 140, '¿?', 'lbl lbl-b', 'start') + F.text((B[0] + W[0]) / 2, 258, '0,7 m', 'lbl lbl-s') + F.text((B[0] + T[0]) / 2 - 14, (B[1] + T[1]) / 2, 'escalera 2,5 m', 'lbl lbl-s', 'end');
          return F.svg(290, 270, o, 'Escalera de 2,5 metros apoyada en una pared, con la base a 0,7 metros de la pared.');
        },
        campos: [{ et: 'Altura', ans: 2.4, unidades: U_LONG, unidad: 'm', mal: [{ v: 2.6, fb: 'La escalera es la hipotenusa: restá 2,5² − 0,7².' }, { v: 1.8, fb: 'Restaste las medidas sin elevar al cuadrado.' }] }],
        pista: '2,5² = 6,25 y 0,7² = 0,49.',
        explica: '2,5² − 0,7² = 6,25 − 0,49 = 5,76 → √5,76 = 2,4 m.' },

      { id: 'm7c4', tipo: 'number', fuente: 'p. 23 · c',
        consigna: 'La hipotenusa de un triángulo rectángulo mide <b>17 cm</b> y uno de sus lados mide <b>15 cm</b>. ¿Cuánto mide el otro lado?',
        figDe: 'intro',
        campos: [{ et: 'Otro lado', ans: 8, unidades: U_LONG, unidad: 'cm', mal: [{ v: 22.67, fb: 'Sumaste los cuadrados, pero 17 cm es la hipotenusa: restá.' }, { v: 2, fb: 'Restaste las medidas sin elevar al cuadrado.' }] }],
        pista: '17² = 289 y 15² = 225.',
        explica: '17² − 15² = 289 − 225 = 64 → √64 = 8 cm.' },

      { id: 'm7c5', tipo: 'number', fuente: 'p. 23 · d (datos del texto)',
        consigna: 'Al atardecer, un árbol proyecta una sombra de <b>12 m</b>. La distancia desde la parte más alta del árbol hasta el extremo de la sombra es <b>12,5 m</b>. ¿Cuál es la altura del árbol?',
        fig: function () {
          var s = 18, base = [80, 230], tip = [80 + 12 * s, 230], top = [80, 230 - 3.5 * s * 2.2], o = '';
          o += F.poly([[60, 230], [100, 230], [80, top[1] - 6]], 'tree') + F.rect(76, 210, 8, 20, 'trunk');
          o += F.seg(base, tip, 'ln ln-shadow') + F.seg(top, tip, 'ln ln-dash') + F.right(base, 0, 11);
          o += F.text(base[0] + 6 * s, 250, 'sombra 12 m', 'lbl lbl-s') + F.sideLabel(top, tip, '12,5 m', 1, 18) + F.text(48, (top[1] + 230) / 2, '¿?', 'lbl lbl-s', 'end');
          return F.svg(340, 270, o, 'Árbol con una sombra de 12 metros; de la punta del árbol al extremo de la sombra hay 12,5 metros.');
        },
        campos: [{ et: 'Altura del árbol', ans: 3.5, unidades: U_LONG, unidad: 'm', mal: [{ v: 17.33, fb: 'La distancia de 12,5 m es la hipotenusa: restá.' }, { v: 0.5, fb: 'Restaste las medidas sin elevar al cuadrado.' }] }],
        pista: '12,5² = 156,25 y 12² = 144.',
        explica: '12,5² − 12² = 156,25 − 144 = 12,25 → √12,25 = 3,5 m.' },

      { id: 'm7c6', tipo: 'number', fuente: 'p. 23 · e (datos del texto)',
        consigna: 'Se quiere dividir un terreno rectangular por su diagonal. El terreno tiene <b>12 m</b> de largo y <b>3,5 m</b> de ancho. ¿Qué longitud de alambre se necesita para la división?',
        fig: function () {
          var s = 24, x = 30, y = 70, o = F.rect(x, y, 12 * s, 3.5 * s, 'shape shape-amber') + F.seg([x, y + 3.5 * s], [x + 12 * s, y], 'ln ln-coral ln-thick');
          o += F.text(x + 6 * s, y + 3.5 * s + 18, '12 m', 'lbl lbl-s') + F.text(x + 12 * s + 8, y + 1.75 * s, '3,5 m', 'lbl lbl-s', 'start') + F.text(x + 6 * s, y + 1.75 * s - 18, '¿?', 'lbl lbl-b');
          return F.svg(380, 200, o, 'Terreno rectangular de 12 por 3,5 metros con su diagonal.');
        },
        campos: [{ et: 'Alambre (diagonal)', ans: 12.5, unidades: U_LONG, unidad: 'm', mal: [{ v: 15.5, fb: 'Sumaste las medidas sin elevar al cuadrado.' }, { v: 11.48, fb: 'La diagonal es la hipotenusa: hay que sumar los cuadrados de los lados.' }] }],
        pista: 'La diagonal es la hipotenusa del triángulo formado por el largo y el ancho: 12² + 3,5².',
        explica: '12² + 3,5² = 144 + 12,25 = 156,25 → √156,25 = 12,5 m.' },

      { id: 'm7c7', tipo: 'choice', fuente: 'Práctica de la app (identificar el error) · p. 21',
        consigna: 'Para un triángulo rectángulo de catetos 3 cm y 4 cm, Juli escribió: <i>"3 + 4 = 7, entonces la hipotenusa mide 7 cm"</i>. ¿Dónde está el error?',
        ops: [
          { t: 'Sumó las medidas sin elevarlas al cuadrado: 3² + 4² = 25 y √25 = 5 cm.', ok: true, fb: '¡Muy bien detectado! El teorema relaciona los cuadrados de los lados.' },
          { t: 'Tendría que haber restado: 4 − 3 = 1 cm.', fb: 'Se busca la hipotenusa, así que se suman los cuadrados (no se resta).' },
          { t: 'No hay error: la hipotenusa mide 7 cm.', fb: 'Si fuera así, 3² + 4² debería dar 7² = 49, pero da 25.' },
          { t: 'Debía multiplicar: 3 × 4 = 12 cm.', fb: 'Multiplicar los catetos no da la hipotenusa.' }
        ],
        pista: 'Revisá la fórmula: a² + b² = c².',
        explica: '3² + 4² = 9 + 16 = 25 → c = √25 = 5 cm. Sumar las medidas directamente no sirve.' }
    ]
  });

  /* ---------------- MISIÓN 8 ---------------- */
  M.push({
    id: 'm8', titulo: 'El punto justo', icono: 'perp', contenido: 'mediatriz', paginas: 'pp. 24–26',
    descripcion: 'Encontrá puntos a la misma distancia de otros: la mediatriz.',
    objetivo: 'Reconocer la mediatriz de un segmento, su construcción y su propiedad de equidistancia.',
    puntos: [
      'La <b>mediatriz</b> de un segmento es la recta cuyos puntos están a la <b>misma distancia de los extremos</b> del segmento.',
      'Es <b>perpendicular</b> al segmento (forma ángulos rectos) y pasa por su <b>punto medio</b>.',
      'Con compás: dos arcos con la misma abertura (más de la mitad del segmento) desde cada extremo; se unen los dos cruces.'
    ],
    ejemplo: {
      html: 'Todos los puntos de la recta punteada están a igual distancia de A y de B.',
      fig: function () {
        var A = [70, 150], B = [300, 150], M0 = [185, 150], o = F.seg(A, B, 'ln ln-coral ln-thick');
        var X = F.circleX(A, 150, B, 150);
        o += F.arc(A, 150, -48, 48, 'arcl arc-dot') + F.arc(B, 150, 132, 228, 'arcl arc-dot');
        o += F.line2([185, 20], [185, 280], 'ln ln-violet') + F.right(M0, 0, 12);
        o += F.dot(A, 'A', -12, 16) + F.dot(B, 'B', 12, 16) + F.dot(X[0], '') + F.dot(X[1], '') + F.text(200, 165, 'punto medio', 'lbl lbl-s', 'start');
        return F.svg(370, 300, o, 'Construcción de la mediatriz del segmento AB con dos arcos desde cada extremo.');
      }
    },
    desafios: [
      { id: 'm8c1', tipo: 'choice', fuente: 'p. 24',
        consigna: 'Dos personas están en los puntos a y b. ¿Cuántos puntos c hay donde ambas personas estén <b>exactamente a la misma distancia</b>?',
        fig: function () {
          var a = [70, 160], b = [330, 160], o = F.seg(a, b, 'ln') + F.dot(a, 'a', 0, 18) + F.dot(b, 'b', 0, 18);
          [40, 90, 160, 230, 280].forEach(function (y) { o += F.dot([200, y], '', 0, 0, 'dot dot-violet'); });
          o += F.seg([200, 30], [200, 290], 'ln ln-dash ln-violet ln-thin');
          return F.svg(400, 310, o, 'Segmento ab con varios puntos ubicados sobre una recta perpendicular que pasa por su medio.');
        },
        ops: [
          { t: 'Infinitos: forman una recta (la mediatriz).', ok: true, fb: '¡Exacto! Todos esos puntos forman una recta: la mediatriz de ab.' },
          { t: 'Uno solo: el punto medio del segmento.', fb: 'El punto medio cumple, ¡pero no es el único! Probá con un punto más arriba, sobre la misma línea perpendicular.' },
          { t: 'Dos: uno arriba y otro abajo del segmento.', fb: 'Hay muchos más: cualquier punto de la recta punteada sirve.' },
          { t: 'Ninguno.', fb: 'El punto medio, por ejemplo, está a la misma distancia de a y de b.' }
        ],
        pista: 'Mirá los puntos violetas del dibujo: ¿podrías marcar otro más entre ellos?',
        explica: 'Hay infinitos puntos equidistantes de a y b. Al unirlos se forma una recta: la mediatriz del segmento ab.' },

      { id: 'm8c2', tipo: 'select', fuente: 'p. 24',
        consigna: 'Completá la definición de mediatriz.',
        filas: [
          { t: 'La mediatriz de un segmento es una recta cuyos puntos ___', ops: ['equidistan de los extremos del segmento', 'están sobre el segmento', 'están más cerca de uno de los extremos'], ans: ['equidistan de los extremos del segmento'] },
          { t: 'y forma ángulos ___ con el segmento.', ops: ['rectos', 'agudos', 'llanos', 'obtusos'], ans: ['rectos'] }
        ],
        pista: '"Equidistar" significa estar a la misma distancia. ¿Qué ángulo forma la mediatriz con el segmento?',
        explica: 'La mediatriz es una recta cuyos puntos equidistan de los extremos del segmento y forma ángulos rectos con él.' },

      { id: 'm8c3', tipo: 'order', fuente: 'p. 25',
        consigna: 'Ordená los pasos para trazar la mediatriz de un segmento AB con compás.',
        pasos: [
          'Abrimos el compás un poco más de la mitad del segmento, lo clavamos en un extremo y trazamos un arco.',
          'Con la misma abertura, trazamos otro arco desde el otro extremo del segmento.',
          'Con la regla trazamos la recta que pasa por los dos puntos donde se cortan los arcos.',
          'El punto donde se cortan el segmento y la mediatriz es el punto medio del segmento.'
        ],
        inicio: [2, 3, 0, 1],
        pista: 'Los dos arcos se trazan antes de usar la regla.',
        explica: '1) Arco desde un extremo (abertura mayor que la mitad). 2) Arco igual desde el otro extremo. 3) Recta por los dos cruces. 4) El corte con el segmento es el punto medio.' },

      { id: 'm8c4', tipo: 'choice', fuente: 'p. 25 · paso 1',
        consigna: '¿Por qué hay que abrir el compás <b>un poco más de la mitad</b> del segmento?',
        ops: [
          { t: 'Porque, si no, los arcos no se cortan.', ok: true, fb: '¡Bien pensado! Con una abertura menor que la mitad, los arcos quedan separados.' },
          { t: 'Porque así el segmento queda más largo.', fb: 'El compás no cambia la longitud del segmento.' },
          { t: 'Porque el compás no se puede abrir menos.', fb: 'El compás se puede abrir de cualquier medida; el motivo es otro.' },
          { t: 'No hace falta: cualquier abertura sirve.', fb: 'Probá imaginar arcos muy pequeños desde cada extremo: ¿se tocarían?' }
        ],
        pista: 'Imaginá dos arcos muy chiquitos, uno en cada punta del segmento.',
        explica: 'Si la abertura es menor o igual que la mitad del segmento, los arcos no se cortan en dos puntos y no se puede trazar la recta.' },

      { id: 'm8c5', tipo: 'point', fuente: 'p. 26',
        consigna: 'Mové el punto <b>d</b> hasta que quede a la <b>misma distancia de a, b y c</b>. Arrastralo con el mouse o seleccionalo y usá las flechas del teclado.',
        tam: [13, 8], a: [2.5, 6.5], b: [6, 1.5], c: [11, 5.5], inicial: [11, 1.5], tol: 0.2,
        pista: 'El punto d tiene que estar en la mediatriz de ab y también en la mediatriz de bc: buscá donde se cruzan.',
        explica: 'El punto d está en la intersección de las mediatrices de ab y bc: allí las tres distancias son iguales.' },

      { id: 'm8c6', tipo: 'choice', fuente: 'p. 26',
        consigna: '¿Qué asegura que el punto d esté a igual distancia de a, b y c?',
        ops: [
          { t: 'Que está en la intersección de las mediatrices de ab y de bc.', ok: true, fb: '¡Excelente! En la mediatriz de ab, d está a igual distancia de a y b; en la de bc, a igual distancia de b y c.' },
          { t: 'Que está en el punto medio del segmento ac.', fb: 'El punto medio de ac está a igual distancia de a y c, pero no necesariamente de b.' },
          { t: 'Que está sobre el segmento ab.', fb: 'Si d estuviera sobre ab, no podría estar a la misma distancia de c en general.' },
          { t: 'Que está sobre la bisectriz de un ángulo.', fb: 'La bisectriz equidista de los lados de un ángulo, no de puntos.' }
        ],
        pista: 'Cada mediatriz garantiza la equidistancia a DOS puntos.',
        explica: 'La mediatriz de ab reúne los puntos equidistantes de a y b; la de bc, los equidistantes de b y c. Su intersección está a igual distancia de los tres.' },

      { id: 'm8c7', tipo: 'number', fuente: 'p. 26 · a y b (con medidas agregadas)',
        consigna: 'Completá los segmentos ab: <br>a. La recta R es mediatriz de ab y la distancia de a hasta R es 3 cm. <br>b. La recta S es mediatriz de la <b>mitad</b> de ab y la distancia de a hasta S es 2 cm.',
        fig: function () {
          var o = F.seg([30, 120], [150, 120], 'ln ln-blue ln-thick') + F.seg([150, 120], [270, 120], 'ln ln-dash ln-blue') + F.line2([150, 30], [150, 210], 'ln');
          o += F.dot([30, 120], 'a', 0, 18) + F.text(165, 40, 'R', 'lbl lbl-b') + F.text(90, 102, '3 cm', 'lbl lbl-s') + F.text(270, 102, '¿b?', 'lbl lbl-s');
          o += F.seg([330, 120], [410, 120], 'ln ln-blue ln-thick') + F.seg([410, 120], [650, 120], 'ln ln-dash ln-blue') + F.line2([410, 30], [410, 210], 'ln');
          o += F.dot([330, 120], 'a', 0, 18) + F.text(425, 40, 'S', 'lbl lbl-b') + F.text(370, 102, '2 cm', 'lbl lbl-s') + F.text(650, 102, '¿b?', 'lbl lbl-s');
          return F.svg(680, 230, o, 'a. Segmento desde a hasta la recta R, de 3 centímetros. b. Segmento desde a hasta la recta S, de 2 centímetros.');
        },
        campos: [
          { et: 'a. ab mide', ans: 6, unidades: U_LONG, unidad: 'cm', mal: [{ v: 3, fb: 'La mediatriz pasa por el punto medio: de a hasta R es solo la mitad de ab.' }] },
          { et: 'b. ab mide', ans: 8, unidades: U_LONG, unidad: 'cm', mal: [{ v: 4, fb: 'S es la mediatriz de la MITAD de ab: de a hasta S hay un cuarto de ab.' }] }
        ],
        pista: 'a. La mediatriz corta al segmento en su punto medio. b. S corta a la mitad de ab en su punto medio: ¿qué parte de ab es "de a hasta S"?',
        explica: 'a. 3 cm es la mitad de ab → ab = 6 cm. b. 2 cm es la mitad de la mitad (un cuarto) → la mitad mide 4 cm y ab = 8 cm.' }
    ]
  });

  /* ---------------- MISIÓN 9 ---------------- */
  M.push({
    id: 'm9', titulo: 'Familias de cuadriláteros', icono: 'quad', contenido: 'cuadrilateros', paginas: 'pp. 27–30, 32',
    descripcion: 'Elementos y clasificación de los polígonos de cuatro lados.',
    objetivo: 'Reconocer los elementos de un cuadrilátero y clasificarlos según sus lados paralelos.',
    puntos: [
      'Elementos: <b>vértices, lados, ángulos, base y altura</b>.',
      'La <b>altura</b> se mide en línea recta, formando un ángulo recto (90°) con la base. Nunca es un lado inclinado.',
      'Según sus lados paralelos: <b>trapezoides</b> (ningún par), <b>trapecios</b> (un par) y <b>paralelogramos</b> (dos pares).'
    ],
    ejemplo: {
      html: 'El rectángulo tiene dos pares de lados paralelos: es un paralelogramo.',
      fig: function () {
        var o = F.rect(80, 40, 240, 140, 'shape shape-lemon') + F.seg([80, 180], [320, 180], 'ln ln-coral ln-thick') + F.seg([80, 40], [80, 180], 'ln ln-green ln-thick');
        o += F.dot([80, 40], '') + F.text(60, 22, 'vértice', 'lbl lbl-s') + F.text(40, 110, 'altura', 'lbl lbl-s lbl-green') + F.text(200, 200, 'base', 'lbl lbl-s lbl-coral') + F.text(345, 110, 'lado', 'lbl lbl-s');
        o += F.arc([320, 180], 26, 90, 180, 'arcl arc-coral') + F.text(282, 150, 'ángulo', 'lbl lbl-s');
        return F.svg(400, 215, o, 'Rectángulo con vértice, lado, ángulo, base y altura señalados.');
      }
    },
    desafios: [
      { id: 'm9c1', tipo: 'choice', fuente: 'p. 27 · act. 39',
        consigna: 'Dos estudiantes construyeron un cuadrilátero ABCD con los <b>mismos cuatro segmentos</b> (AB, BC, CD y DA). ¿Obtuvieron exactamente la misma figura?',
        fig: function () {
          var o = '', s = 26;
          [[60, 20], [95, 290]].forEach(function (cfg) {
            var ang = cfg[0], ox = cfg[1], A = [0, 0], D = [7, 0], B = [3.5 * Math.cos(ang * Math.PI / 180), 3.5 * Math.sin(ang * Math.PI / 180)];
            var X = F.circleX([B[0], -B[1]], 4.5, [7, 0], 5);
            var C = X.filter(function (p) { return p[1] < 0; })[0] || X[0];
            var pts = [A, [B[0], -B[1]], C, D].map(function (p) { return [ox + 30 + p[0] * s, 200 + p[1] * s]; });
            o += F.poly(pts, 'shape shape-paper');
            ['A', 'B', 'C', 'D'].forEach(function (L, i) { var p = pts[i]; o += F.text(p[0] + (i === 2 || i === 3 ? 12 : -12), p[1] + (i === 0 || i === 3 ? 12 : -8), L, 'lbl lbl-b'); });
          });
          return F.svg(560, 230, o, 'Dos cuadriláteros ABCD distintos construidos con los mismos cuatro lados.');
        },
        ops: [
          { t: 'No: con los mismos lados se forman cuadriláteros distintos, porque los ángulos pueden cambiar.', ok: true, fb: '¡Muy bien! Los lados no fijan los ángulos: la figura se puede "abrir" o "cerrar".' },
          { t: 'Sí: si los lados son iguales, la figura siempre es la misma.', fb: 'Mirá el dibujo: los dos tienen los mismos lados pero distintos ángulos.' },
          { t: 'Sí, siempre se obtiene un rectángulo.', fb: 'Para que sea rectángulo los ángulos deberían ser rectos y los lados opuestos iguales.' }
        ],
        pista: 'Compará los ángulos de los dos cuadriláteros del dibujo.',
        explica: 'Con los mismos cuatro lados se pueden formar distintos cuadriláteros: cambian los ángulos. Todos tienen en común 4 lados, 4 vértices y 4 ángulos.' },

      { id: 'm9c2', tipo: 'choice', fuente: 'p. 28 · act. 41 (aclaración)',
        consigna: '¿Qué segmento representa la <b>altura</b> del paralelogramo respecto de la base marcada?',
        fig: function () {
          var BL = [50, 220], BR = [320, 220], TR = [400, 80], TL = [130, 80], o = F.poly([BL, BR, TR, TL], 'shape shape-paper');
          o += F.seg(BL, BR, 'ln ln-coral ln-thick') + F.text(185, 240, 'base', 'lbl lbl-s lbl-coral');
          o += F.seg(BL, TL, 'ln ln-blue ln-thick') + F.text(76, 140, '1', 'lbl lbl-tag');
          o += F.seg(TL, [130, 220], 'ln ln-violet ln-dash') + F.right([130, 220], 0, 11) + F.text(146, 150, '2', 'lbl lbl-tag');
          o += F.seg(BL, TR, 'ln ln-green ln-thin') + F.text(290, 125, '3', 'lbl lbl-tag');
          return F.svg(440, 255, o, 'Paralelogramo con tres segmentos numerados: 1 lado inclinado, 2 segmento perpendicular a la base, 3 diagonal.');
        },
        ops: [
          { t: 'El segmento 1', fb: 'El 1 es un lado inclinado: no forma un ángulo recto con la base.' },
          { t: 'El segmento 2', ok: true, fb: '¡Correcto! La altura es perpendicular a la base (forma 90°).' },
          { t: 'El segmento 3', fb: 'El 3 es una diagonal: une vértices opuestos.' }
        ],
        pista: 'La altura siempre forma un ángulo recto (90°) con la base. Nunca es un lado inclinado.',
        explica: 'La altura es el segmento 2: perpendicular a la base. El 1 es un lado y el 3 una diagonal.' },

      { id: 'm9c3', tipo: 'select', fuente: 'p. 28 · act. 41 y 42',
        consigna: 'Indicá qué elemento del trapecio señala cada número.',
        fig: function () {
          var BL = [70, 220], BR = [390, 220], TR = [300, 70], TL = [70, 70], o = F.poly([BL, BR, TR, TL], 'shape shape-paper');
          o += F.seg(BL, BR, 'ln ln-coral ln-thick') + F.seg(TR, [300, 220], 'ln ln-green ln-dash') + F.right([300, 220], 90, 11);
          o += F.seg(BR, TR, 'ln ln-blue ln-thick') + F.arc(BR, 34, F.dir(BR, TR), 180, 'arcl arc-coral') + F.dot(TL, '');
          o += F.text(52, 52, '①', 'lbl lbl-tag2') + F.text(366, 130, '②', 'lbl lbl-tag2') + F.text(342, 196, '③', 'lbl lbl-tag2') + F.text(200, 242, '④', 'lbl lbl-tag2') + F.text(282, 150, '⑤', 'lbl lbl-tag2');
          return F.svg(440, 260, o, 'Trapecio con cinco elementos numerados del 1 al 5.');
        },
        ops: ['Vértice', 'Lado', 'Ángulo', 'Base', 'Altura'],
        filas: [
          { t: '① → ___', ans: ['Vértice'] }, { t: '② → ___', ans: ['Lado'] }, { t: '③ → ___', ans: ['Ángulo'] },
          { t: '④ → ___', ans: ['Base'] }, { t: '⑤ → ___', ans: ['Altura'], fb: 'El segmento ⑤ es perpendicular a la base: es la altura.' }
        ],
        pista: 'La altura es perpendicular a la base; el ángulo se marca con un arco; el vértice es un punto.',
        explica: '① vértice, ② lado, ③ ángulo, ④ base y ⑤ altura.' },

      { id: 'm9c4', tipo: 'classify', fuente: 'p. 29 · act. 43 y p. 30 · act. 44',
        consigna: 'Clasificá cada cuadrilátero <b>según sus lados paralelos</b>: trapezoide (ningún par), trapecio (un par) o paralelogramo (dos pares).',
        layout: 'nofig',
        cats: ['Trapezoide', 'Trapecio', 'Paralelogramo'],
        items: ['Romboide', 'Rectángulo', 'Trapecio isósceles', 'Cuadrado', 'Trapecio rectángulo', 'Rombo', 'Paralelogramo común', 'Trapezoide común'].map(function (n) {
          var cat = /^Trapecio/.test(n) ? 'Trapecio' : (n === 'Romboide' || n === 'Trapezoide común') ? 'Trapezoide' : 'Paralelogramo';
          return { t: n, cat: cat, mini: n, fb: n === 'Romboide' ? 'El romboide no tiene lados paralelos: tiene dos pares de lados consecutivos iguales. Es un trapezoide.' : null };
        }),
        pista: 'Mirá cada figura y contá cuántos pares de lados paralelos tiene. ¡Cuidado con el romboide!',
        explica: 'Trapezoides: romboide y trapezoide común. Trapecios: isósceles y rectángulo. Paralelogramos: rectángulo, cuadrado, rombo y paralelogramo común.' },

      { id: 'm9c5', tipo: 'select', fuente: 'p. 30 · act. 44 (mapa de paralelogramos)',
        consigna: 'Completá la parte del mapa de los <b>paralelogramos</b>.',
        fig: function () {
          var o = '', names = ['Rombo', 'Cuadrado', 'Rectángulo', 'Paralelogramo común'];
          names.forEach(function (n, i) { o += F.quadMini(n, 20 + i * 110, 20, 90, 64, false, 'shape shape-sky'); o += F.text(65 + i * 110, 104, '?', 'lbl lbl-b'); });
          return F.svg(460, 120, o, 'Cuatro paralelogramos: rombo, cuadrado, rectángulo y paralelogramo común.');
        },
        filas: [
          { t: 'Tiene cuatro lados iguales y cuatro ángulos rectos: ___', ops: ['Cuadrado', 'Rombo', 'Rectángulo', 'Paralelogramo común'], ans: ['Cuadrado'] },
          { t: 'Rectángulo: cuatro ___ rectos.', ops: ['ángulos', 'lados', 'vértices'], ans: ['ángulos'] },
          { t: 'Tiene dos pares de ___ iguales (los opuestos).', ops: ['lados', 'ángulos rectos', 'diagonales perpendiculares'], ans: ['lados'] },
          { t: 'Con dos pares de lados iguales y sin ángulos rectos ni cuatro lados iguales: ___', ops: ['Paralelogramo común', 'Romboide', 'Trapecio', 'Cuadrado'], ans: ['Paralelogramo común'], fb: 'El romboide NO es paralelogramo (no tiene lados paralelos). Aquí se trata del paralelogramo común.' }
        ],
        pista: 'El cuadrado está unido a "cuatro lados iguales" y a "cuatro ángulos rectos".',
        explica: 'Cuadrado (4 lados iguales y 4 ángulos rectos), rectángulo (4 ángulos rectos), paralelogramo común (2 pares de lados iguales).' },

      { id: 'm9c6', tipo: 'select', fuente: 'p. 30 · act. 44 (mapa de no paralelogramos)',
        consigna: 'Completá la parte del mapa de los <b>no paralelogramos</b>.',
        layout: 'nofig',
        ops: ['lados', 'ángulos', 'iguales', 'distintos'],
        filas: [
          { t: 'Trapecio: un par de ___ paralelos.', ans: ['lados'] },
          { t: 'Trapecio isósceles: un par de lados ___', ans: ['iguales'] },
          { t: 'Trapecio rectángulo: dos ___ rectos.', ans: ['ángulos'] },
          { t: 'Trapecio escaleno: todos sus lados ___', ans: ['distintos'] },
          { t: 'Trapezoide: ningún par de ___ paralelos.', ans: ['lados'] },
          { t: 'Romboide: dos pares de ___ consecutivos iguales.', ans: ['lados'] },
          { t: 'Trapezoide común: todos sus lados ___', ans: ['distintos'] }
        ],
        pista: 'Los "rectos" siempre son ángulos. Escaleno y común significan que no hay lados iguales.',
        explica: 'lados · iguales · ángulos · distintos · lados · lados · distintos.' },

      { id: 'm9c7', tipo: 'select', fuente: 'p. 32 · act. 47',
        consigna: 'Leé cada pista y elegí de qué cuadrilátero específico se trata.',
        layout: 'nofig',
        ops: ['Rombo', 'Cuadrado', 'Rectángulo', 'Romboide', 'Trapecio isósceles', 'Trapecio rectángulo', 'Trapezoide común'],
        filas: [
          { t: '1. Tengo 2 pares de lados opuestos paralelos, mis 4 lados son iguales, pero no tengo ángulos rectos. → ___', ans: ['Rombo'], fb: 'Sin ángulos rectos no puede ser un cuadrado.' },
          { t: '2. Tengo solo 1 par de lados paralelos y dos de mis ángulos son rectos. → ___', ans: ['Trapecio rectángulo'] },
          { t: '3. Tengo 2 pares de lados opuestos paralelos e iguales, y mis 4 ángulos son rectos. → ___', ans: ['Rectángulo', 'Cuadrado'] },
          { t: '4. Ninguno de mis lados es paralelo a otro y todos tienen distintas medidas. → ___', ans: ['Trapezoide común'], fb: 'El romboide tiene lados iguales (consecutivos). Si todos son distintos, es un trapezoide común.' },
          { t: '5. Tengo 1 par de lados paralelos y mis lados no paralelos miden lo mismo. → ___', ans: ['Trapecio isósceles'] }
        ],
        pista: 'Fijate primero cuántos pares de lados paralelos menciona cada pista: eso indica la familia.',
        explica: '1. Rombo. 2. Trapecio rectángulo. 3. Rectángulo (el cuadrado también cumple, pero la pista no dice que los 4 lados sean iguales). 4. Trapezoide común. 5. Trapecio isósceles.' }
    ]
  });

  /* ---------------- MISIÓN 10 ---------------- */
  M.push({
    id: 'm10', titulo: 'Secretos de las diagonales', icono: 'diag', contenido: 'cuadrilateros', paginas: 'pp. 31–34',
    descripcion: 'Diagonales, suma de ángulos y propiedades de los cuadriláteros.',
    objetivo: 'Usar las propiedades de las diagonales y de los ángulos de los cuadriláteros para resolver problemas.',
    puntos: [
      'En cualquier cuadrilátero convexo, la <b>suma de los ángulos interiores es 360°</b> (se divide en 2 triángulos).',
      '<b>Paralelogramos</b>: ángulos opuestos iguales; dos ángulos consecutivos suman 180°.',
      '<b>Trapecio isósceles</b>: agudos iguales, obtusos iguales; cada agudo + cada obtuso = 180°. <b>Romboide</b>: un par de ángulos opuestos iguales.'
    ],
    ejemplo: {
      html: 'Una diagonal divide al cuadrilátero en 2 triángulos: 2 × 180° = 360°.',
      fig: function () {
        var A = [70, 60], B = [240, 30], C = [300, 200], D = [60, 200], o = F.poly([A, B, C, D], 'shape shape-paper') + F.seg(B, D, 'ln ln-dash');
        o += F.corner(A, D, B, 24, 'sect sect-blue').svg + F.corner(B, A, D, 28, 'sect sect-blue').svg + F.corner(D, B, A, 28, 'sect sect-blue').svg;
        o += F.corner(B, D, C, 22, 'sect sect-amber').svg + F.corner(C, B, D, 28, 'sect sect-amber').svg + F.corner(D, C, B, 22, 'sect sect-amber').svg;
        o += F.text(110, 110, '180°', 'lbl lbl-s') + F.text(220, 155, '180°', 'lbl lbl-s');
        return F.svg(360, 230, o, 'Cuadrilátero dividido por una diagonal en dos triángulos de 180 grados cada uno.');
      }
    },
    desafios: [
      { id: 'm10c1', tipo: 'select', fuente: 'p. 31 · act. 45',
        consigna: 'Observá las diagonales y uní cada descripción con el cuadrilátero que corresponde.',
        layout: 'narrowfig',
        fig: function () {
          var o = '', names = ['Trapezoide común', 'Rectángulo', 'Rombo', 'Trapecio isósceles', 'Romboide'];
          names.forEach(function (n, i) {
            var x = 10 + (i % 3) * 150, y = 10 + Math.floor(i / 3) * 120;
            o += F.quadMini(n, x + 20, y, 110, 78, true, 'shape shape-sky') + F.text(x + 75, y + 96, n, 'lbl lbl-s');
          });
          return F.svg(460, 245, o, 'Trapezoide común, rectángulo, rombo, trapecio isósceles y romboide con sus diagonales punteadas.');
        },
        ops: ['Trapezoide común', 'Rectángulo', 'Rombo', 'Trapecio isósceles', 'Romboide'],
        filas: [
          { t: 'Perpendiculares; se cortan en su punto medio. → ___', ans: ['Rombo'] },
          { t: 'Perpendiculares; se cortan en el punto medio de una sola de ellas. → ___', ans: ['Romboide'] },
          { t: 'Perpendiculares; el corte no es punto medio de ninguna. → ___', ans: ['Trapezoide común'] },
          { t: 'Iguales, no perpendiculares, se cortan en su punto medio. → ___', ans: ['Rectángulo'] },
          { t: 'Iguales, no perpendiculares, no se cortan en el punto medio de ninguna. → ___', ans: ['Trapecio isósceles'] }
        ],
        pista: 'Empezá por las diagonales iguales: ¿cuál de las dos figuras las corta justo por la mitad?',
        explica: 'Rombo, romboide, trapezoide común (como el del dibujo), rectángulo y trapecio isósceles.' },

      { id: 'm10c2', tipo: 'choice', fuente: 'p. 31 · act. 46',
        consigna: '¿Por qué los ángulos interiores de un cuadrilátero convexo suman 360°?',
        figDe: 'intro',
        ops: [
          { t: 'Porque una diagonal lo divide en 2 triángulos, y 2 × 180° = 360°.', ok: true, fb: '¡Exacto! Los ángulos de los dos triángulos forman los ángulos del cuadrilátero.' },
          { t: 'Porque tiene 4 ángulos rectos.', fb: 'Solo el rectángulo y el cuadrado tienen 4 ángulos rectos, pero la suma es 360° en todos.' },
          { t: 'Porque tiene 4 lados y 4 × 90° = 360°.', fb: 'No todos los ángulos miden 90°. La explicación viene de los triángulos.' },
          { t: 'Porque sus diagonales son perpendiculares.', fb: 'Muchos cuadriláteros no tienen diagonales perpendiculares, y aun así suman 360°.' }
        ],
        pista: 'Mirá el dibujo: ¿en cuántos triángulos queda dividido el cuadrilátero?',
        explica: 'Una diagonal divide al cuadrilátero en dos triángulos. Cada uno suma 180°, así que el cuadrilátero suma 360°.' },

      { id: 'm10c3', tipo: 'number', fuente: 'p. 32 · act. 48 a',
        consigna: 'Indicá la amplitud de los ángulos desconocidos (el azul y el rosa).',
        fig: function () {
          var q = F.quadFromAngles([0, 0], [90, 118, 30, 122], 60, 110, 0).pts;
          q = F.fit(q, 20, 20, 200, 210);
          var o = F.poly(q, 'shape shape-paper') + F.rightAt(q[0], q[3], q[1], 13);
          o += F.cornerLabel(q[1], q[0], q[2], 30, '118°') + F.cornerLabel(q[3], q[2], q[0], 30, '122°');
          o += F.corner(q[2], q[1], q[3], 34, 'sect sect-blue').svg + F.cornerLabel(q[2], q[1], q[3], 58, 'azul');
          var TL = [370, 50], TR = [480, 50], BR = [480, 160], BL = [370 - 110 / Math.tan(46 * Math.PI / 180), 160];
          o += F.poly([TL, TR, BR, BL], 'shape shape-paper') + F.rightAt(TR, TL, BR, 12) + F.rightAt(BR, TR, BL, 12);
          o += F.cornerLabel(TL, TR, BL, 26, '134°');
          o += F.corner(BL, BR, TL, 32, 'sect sect-pink').svg + F.cornerLabel(BL, BR, TL, 52, 'rosa');
          return F.svg(500, 250, o, 'Cuadrilátero con ángulos de 90, 118 y 122 grados y el ángulo azul desconocido; trapecio rectángulo con un ángulo de 134 grados y el ángulo rosa desconocido.');
        },
        campos: [
          { et: 'Ángulo azul', ans: 30, suf: '°', mal: [{ v: 120, fb: 'Olvidaste restar el ángulo recto: 360° − 90° − 118° − 122°.' }, { v: 210, fb: 'La suma de los ángulos de un cuadrilátero es 360°, no 180°… y hay que restar los tres conocidos.' }] },
          { et: 'Ángulo rosa', ans: 46, suf: '°', mal: [{ v: 136, fb: 'Hay dos ángulos rectos en la figura: restá los dos.' }] }
        ],
        pista: 'Los cuatro ángulos suman 360°. Cada cuadradito indica un ángulo recto (90°).',
        explica: 'Azul: 360° − 90° − 118° − 122° = 30°. Rosa: 360° − 90° − 90° − 134° = 46°.' },

      { id: 'm10c4', tipo: 'number', fuente: 'p. 32 · act. 48 b',
        consigna: 'Indicá la medida de los ángulos de este <b>trapecio isósceles</b>.',
        fig: function () {
          var BL = [70, 190], BR = [350, 190], hgt = 120, off = hgt / Math.tan(69 * Math.PI / 180), TL = [70 + off, 70], TR = [350 - off, 70], o = '';
          o += F.line2([10, 190], [400, 190], 'ln ln-thin') + F.poly([BL, BR, TR, TL], 'shape shape-paper');
          o += F.sector(BL, 26, 69, 180, 'sect sect-paper') + F.angLabel(BL, 46, 69, 180, '111°');
          o += F.corner(BL, BR, TL, 30, 'sect sect-violet').svg + F.corner(BR, TR, BL, 30, 'sect sect-violet').svg;
          o += F.corner(TL, BL, TR, 26, 'sect sect-coral').svg + F.corner(TR, TL, BR, 26, 'sect sect-coral').svg;
          return F.svg(410, 220, o, 'Trapecio isósceles con un ángulo exterior de 111 grados junto a la base; ángulos violetas en la base mayor y rojos en la base menor.');
        },
        campos: [
          { et: 'Cada ángulo violeta', ans: 69, suf: '°', mal: [{ v: 111, fb: 'El ángulo de 111° está afuera del trapecio: es adyacente al ángulo violeta.' }] },
          { et: 'Cada ángulo rojo', ans: 111, suf: '°', mal: [{ v: 69, fb: 'En un trapecio isósceles, cada agudo y cada obtuso son suplementarios (suman 180°).' }] }
        ],
        pista: '111° y el ángulo violeta de la izquierda son adyacentes. Después recordá: agudo + obtuso = 180°.',
        explica: 'Violeta: 180° − 111° = 69° (los dos violetas son iguales). Rojo: 180° − 69° = 111° (los dos rojos son iguales). 69 + 69 + 111 + 111 = 360°.' },

      { id: 'm10c5', tipo: 'number', fuente: 'p. 32 · act. 48 c',
        consigna: 'Calculá la medida de los ángulos interiores del rombo abcd sabiendo que ' + hat('a') + ' mide 62°.',
        fig: function () {
          var a = [50, 140], s = 150, b = F.P(a[0], a[1], s, 31), d = F.P(a[0], a[1], s, -31), c = [b[0] + d[0] - a[0], b[1] + d[1] - a[1]], o = F.poly([a, b, c, d], 'shape shape-sky');
          o += F.ticks(a, b, 1) + F.ticks(b, c, 1) + F.ticks(c, d, 1) + F.ticks(d, a, 1);
          o += F.corner(a, d, b, 30, 'sect sect-amber').svg + F.cornerLabel(a, d, b, 54, '62°');
          o += F.text(a[0] - 14, a[1], 'a', 'lbl lbl-b') + F.text(b[0], b[1] - 14, 'b', 'lbl lbl-b') + F.text(c[0] + 14, c[1], 'c', 'lbl lbl-b') + F.text(d[0], d[1] + 15, 'd', 'lbl lbl-b');
          return F.svg(360, 280, o, 'Rombo abcd con el ángulo a de 62 grados.');
        },
        campos: [
          { et: hat('b'), ans: 118, suf: '°', mal: [{ v: 62, fb: hat('b') + ' es consecutivo de ' + hat('a') + ': suman 180°.' }] },
          { et: hat('c'), ans: 62, suf: '°', mal: [{ v: 118, fb: hat('c') + ' es opuesto a ' + hat('a') + ': en los paralelogramos, los ángulos opuestos son iguales.' }] },
          { et: hat('d'), ans: 118, suf: '°' }
        ],
        pista: 'El rombo es un paralelogramo: ángulos opuestos iguales y consecutivos que suman 180°.',
        explica: hat('c') + ' = ' + hat('a') + ' = 62° (opuestos). ' + hat('b') + ' = ' + hat('d') + ' = 180° − 62° = 118° (consecutivos).' },

      { id: 'm10c6', tipo: 'select', fuente: 'p. 33 · act. 48 d',
        consigna: '¿Es posible construir estos cuadriláteros? Elegí la respuesta y el motivo.',
        layout: 'nofig',
        filas: [
          { t: 'Uno con cuatro ángulos obtusos: ___ porque ___', ops: [['Se puede', 'No se puede'], ['sumarían más de 360°', 'sumarían menos de 360°', 'sumarían exactamente 360°']], ans: ['No se puede', 'sumarían más de 360°'] },
          { t: 'Uno con dos ángulos rectos y dos agudos: ___ porque ___', ops: [['Se puede', 'No se puede'], ['sumarían más de 360°', 'sumarían menos de 360°', 'sumarían exactamente 360°']], ans: ['No se puede', 'sumarían menos de 360°'], fb: '90° + 90° = 180°, y dos agudos suman menos de 180°: en total, menos de 360°.' },
          { t: 'Uno con los cuatro ángulos agudos: ___ porque ___', ops: [['Se puede', 'No se puede'], ['sumarían más de 360°', 'sumarían menos de 360°', 'sumarían exactamente 360°']], ans: ['No se puede', 'sumarían menos de 360°'] }
        ],
        pista: 'Un obtuso es mayor que 90°, un agudo es menor que 90°. ¿Cuánto tienen que sumar los cuatro?',
        explica: 'Ninguno se puede: 4 obtusos suman más de 360°; 2 rectos + 2 agudos y 4 agudos suman menos de 360°.' },

      { id: 'm10c7', tipo: 'select', fuente: 'p. 33 · act. 49',
        consigna: '¿Quién o quiénes dicen la verdad? ¿Por qué?',
        layout: 'nofig',
        filas: [
          { t: '<b>Maru:</b> "Dibujé un rombo con ángulos de 54° y 116°". → ___ porque ___',
            ops: [['Dice la verdad', 'No dice la verdad'], ['54° + 116° = 170°, y en un rombo dos ángulos consecutivos suman 180°', 'los ángulos del rombo siempre son rectos', 'es correcto']], ans: ['No dice la verdad', '54° + 116° = 170°, y en un rombo dos ángulos consecutivos suman 180°'] },
          { t: '<b>Maite:</b> "El trapecio que construí tiene ángulos de 102° y 77° y es isósceles". → ___ porque ___',
            ops: [['Dice la verdad', 'No dice la verdad'], ['102° + 77° = 179°, y en un trapecio isósceles cada agudo y cada obtuso suman 180°', 'un trapecio no puede tener ángulos obtusos', 'es correcto']], ans: ['No dice la verdad', '102° + 77° = 179°, y en un trapecio isósceles cada agudo y cada obtuso suman 180°'] },
          { t: '<b>Facu:</b> "Hice un romboide con un ángulo de 99° opuesto a otro de 83°. Los otros dos ángulos son rectos". → ___ porque ___',
            ops: [['Dice la verdad', 'No dice la verdad'], ['99° + 83° + 90° + 90° = 362°, y deberían sumar 360°', 'un romboide no puede tener ángulos rectos', 'es correcto']], ans: ['No dice la verdad', '99° + 83° + 90° + 90° = 362°, y deberían sumar 360°'] }
        ],
        pista: 'Sumá los ángulos que menciona cada uno y compará con las propiedades (360°, consecutivos que suman 180°).',
        explica: 'Nadie dice la verdad: 54 + 116 = 170 ≠ 180; 102 + 77 = 179 ≠ 180; 99 + 83 + 90 + 90 = 362 ≠ 360.' },

      { id: 'm10c8', tipo: 'self', fuente: 'pp. 33–34 · act. 50 y 51',
        consigna: 'Pegá una hoja cuadriculada en la carpeta y construí los cuadriláteros de la actividad 51 (a–e). Después marcá lo que hiciste:',
        items: [
          'a) Rectángulo de 5 cm de base y 2 cm de altura, con ángulos rectos (usé la escuadra).',
          'b) Rombo de 3 cm de lado con un ángulo de 35° (usé el transportador).',
          'c) Paralelogramo común de 4 cm de base y 2,5 cm de altura.',
          'd) Trapecio rectángulo con bases de 2,5 cm y 4 cm, y altura de 2 cm.',
          'e) Romboide con lados de 1,5 cm y 2,5 cm que forman un ángulo de 105°.',
          'Comprobé con la regla las medidas de cada lado al terminar.'
        ] }
    ]
  });

  /* ---------------- MISIÓN 11 ---------------- */
  M.push({
    id: 'm11', titulo: 'Cazadores de figuras', icono: 'dice', contenido: 'perimetro', paginas: 'pp. 35–36',
    descripcion: 'El juego del dado: ¿contorno o cuadraditos?',
    objetivo: 'Diferenciar el perímetro (contorno) del área (cantidad de cuadraditos) de figuras en la cuadrícula.',
    puntos: [
      'Tirá el dado y elegí una opción. <b>Opción A</b> (2 puntos): buscar una figura cuyo <b>contorno</b> tenga (número + 1) × 2 lados de cuadradito.',
      '<b>Opción B</b> (1 punto): buscar una figura formada por <b>tantos cuadraditos</b> como el número del dado.',
      'Cada figura encontrada se tacha. Si no queda ninguna figura que cumpla, elegí "No hay figura disponible". Son <b>10 tiradas</b>.'
    ],
    ejemplo: {
      html: 'Sale 6. Opción A: (6 + 1) × 2 = 14 lados de contorno. Opción B: una figura de 6 cuadraditos.',
      fig: function () { return F.svg(140, 140, F.die(6, 10, 10, 120), 'Dado con el número 6.'); }
    },
    desafios: [
      { id: 'm11c1', tipo: 'hunt', fuente: 'pp. 35–36 · act. 52 (adaptado para jugar de a uno)',
        consigna: 'Cazadores de figuras: 10 tiradas.',
        rondas: 10, ficha: FICHA,
        pista: 'Para contar el contorno, recorré el borde de la figura y contá cada lado de cuadradito, también los "escalones".',
        explica: 'Opción A mide el contorno (perímetro). Opción B mide cuántos cuadraditos cubren la figura (área).' },

      { id: 'm11c2', tipo: 'choice', fuente: 'p. 36 · act. 53',
        consigna: 'Cuando elegían la Opción A y contaban los bordes de los cuadraditos, ¿qué estaban midiendo de la figura?',
        ops: [
          { t: 'El perímetro (la medida del contorno).', ok: true, fb: '¡Exacto! Recorrer el borde es medir el contorno: el perímetro.' },
          { t: 'El área (la superficie).', fb: 'El área se mide con los cuadraditos que cubren la figura por dentro (Opción B).' },
          { t: 'La altura.', fb: 'La altura es un solo segmento perpendicular a la base; aquí se recorría todo el borde.' }
        ],
        pista: 'Contar los lados del borde es recorrer el contorno de la figura.',
        explica: 'Contar los lados del borde de los cuadraditos es medir el perímetro.' },

      { id: 'm11c3', tipo: 'choice', fuente: 'p. 36 · act. 53',
        consigna: 'Cuando elegían la Opción B y contaban cuántos cuadraditos enteros cubrían la figura por dentro, ¿qué estaban midiendo?',
        ops: [
          { t: 'El área (la superficie).', ok: true, fb: '¡Muy bien! Los cuadraditos que cubren la figura miden su superficie: el área.' },
          { t: 'El perímetro.', fb: 'El perímetro se mide por el borde. Aquí se contaba lo que hay adentro.' },
          { t: 'La cantidad de lados de la figura.', fb: 'No se contaban lados, sino cuadraditos interiores.' }
        ],
        pista: '¿Qué parte de la figura cubren los cuadraditos?',
        explica: 'Contar los cuadraditos que cubren la figura es medir su área.' },

      { id: 'm11c4', tipo: 'choice', fuente: 'p. 36 · act. 53',
        consigna: 'La figura violeta y la celeste larga tienen 5 cuadraditos cada una (misma área). ¿Tienen sí o sí el mismo contorno?',
        fig: function () {
          var s = 38, o = F.grid(10, 10, 9, 4, s, 'gridl');
          o += F.cells([[1, 0], [1, 1], [1, 2], [2, 1], [2, 2]], 10, 10, s, 'cell cell-violet');
          o += F.cells([[4, 2], [5, 2], [6, 2], [7, 2], [8, 2]], 10, 10, s, 'cell cell-sky');
          return F.svg(10 + 9 * s + 10, 10 + 4 * s + 10, o, 'Figura violeta de 5 cuadraditos y figura celeste en línea de 5 cuadraditos.');
        },
        ops: [
          { t: 'No: la violeta tiene 10 lados de contorno y la celeste, 12.', ok: true, fb: '¡Excelente! Igual área no significa igual perímetro.' },
          { t: 'Sí: si tienen la misma área, tienen el mismo contorno.', fb: 'Contá el contorno de cada una recorriendo su borde: ¿dan lo mismo?' },
          { t: 'No: la violeta tiene más contorno que la celeste.', fb: 'Volvé a contar: la violeta es más "compacta", entonces su borde es más corto.' }
        ],
        pista: 'Contá los lados de cuadradito del borde de cada figura.',
        explica: 'Violeta: 10 lados de contorno; celeste: 12. Dos figuras con la misma área pueden tener distinto perímetro.' },

      { id: 'm11c5', tipo: 'choice', fuente: 'p. 36 · act. 53',
        consigna: 'La Opción A daba 2 puntos y la Opción B, 1 punto. ¿Convenía jugar siempre a la Opción A?',
        ops: [
          { t: 'No: a veces no quedaba ninguna figura con ese contorno y convenía la B.', ok: true, fb: '¡Bien pensado! Elegir bien depende de qué figuras quedan en la ficha.' },
          { t: 'Sí: siempre conviene la que da más puntos.', fb: 'Si no hay ninguna figura con ese contorno, no se gana nada.' },
          { t: 'No: la B siempre daba más puntos.', fb: 'La B daba 1 punto y la A, 2. El problema era si había figuras disponibles.' }
        ],
        pista: 'Pensá en una tirada donde no quedaba ninguna figura con el contorno pedido.',
        explica: 'No siempre: si no quedaba ninguna figura con el contorno pedido, convenía la Opción B aunque diera menos puntos.' }
    ]
  });

  /* ---------------- MISIÓN 12 ---------------- */
  M.push({
    id: 'm12', titulo: 'Laboratorio de contornos', icono: 'grid', contenido: 'perimetro', paginas: 'pp. 37–38',
    descripcion: 'Modificá figuras en la cuadrícula: ¿qué pasa con el área y el perímetro?',
    objetivo: 'Comparar figuras según su área y su perímetro, y usar las unidades adecuadas para cada medida.',
    puntos: [
      'El <b>perímetro</b> es la medida del contorno. Se mide con unidades de <b>longitud</b>: m, dm, cm, km.',
      'El <b>área</b> mide la superficie. Se usan unidades de <b>superficie</b>: <b>cm²</b>, <b>m²</b>. 1 cm² es el área de un cuadrado de 1 cm de lado.',
      'Figuras con la <b>misma área</b> pueden tener <b>distinto perímetro</b>.'
    ],
    ejemplo: {
      html: 'Este rectángulo tiene área = 12 cuadraditos y perímetro = 4 + 3 + 4 + 3 = 14 lados de cuadradito.',
      fig: function () {
        var s = 44, o = F.grid(20, 20, 6, 5, s, 'gridl') + F.rect(20 + s, 20 + s, 4 * s, 3 * s, 'cell cell-sky') + F.grid(20 + s, 20 + s, 4, 3, s, 'gridl-dark');
        o += F.rect(20 + s, 20 + s, 4 * s, 3 * s, 'contour');
        o += F.text(20 + 3 * s, 20 + 4 * s + 20, '4', 'lbl lbl-b') + F.text(20 + 5 * s + 16, 20 + 2.5 * s, '3', 'lbl lbl-b');
        return F.svg(20 + 6 * s + 20, 20 + 5 * s + 30, o, 'Rectángulo de 4 por 3 cuadraditos con su contorno resaltado.');
      }
    },
    desafios: [
      { id: 'm12c1', tipo: 'classify', fuente: 'p. 37 · act. 55',
        consigna: 'Clasificá cada unidad: ¿sirve para medir longitudes (perímetro) o superficies (área)?',
        layout: 'nofig',
        cats: ['Longitud (perímetro)', 'Superficie (área)'],
        items: [{ t: 'metro (m)', cat: 'Longitud (perímetro)' }, { t: 'centímetro cuadrado (cm²)', cat: 'Superficie (área)' }, { t: 'kilómetro (km)', cat: 'Longitud (perímetro)' },
          { t: 'metro cuadrado (m²)', cat: 'Superficie (área)' }, { t: 'decímetro (dm)', cat: 'Longitud (perímetro)' }, { t: 'centímetro (cm)', cat: 'Longitud (perímetro)' }],
        pista: 'Las unidades de superficie llevan el "cuadrado" (²).',
        explica: 'm, km, dm y cm miden longitudes; cm² y m² miden superficies.' },

      { id: 'm12c2', tipo: 'choice', fuente: 'p. 38 · act. 57',
        consigna: 'Nicolás dice que para calcular más rápido el perímetro de la figura celeste puede hacer 6 × 4, porque hay 6 cuadrados de 4 lados cada uno. ¿Es correcta su estrategia?',
        fig: function () { return figCruz('cell-cyan'); },
        ops: [
          { t: 'No: así cuenta también los lados interiores que comparten los cuadrados, y esos no forman parte del contorno.', ok: true, fb: '¡Muy bien! Los lados compartidos quedan adentro de la figura.' },
          { t: 'Sí: 6 × 4 = 24 es el perímetro.', fb: 'Recorré el borde de la figura con el dedo: ¿cuántos lados de cuadradito contás?' },
          { t: 'No: tendría que hacer 6 × 2.', fb: 'No hay una multiplicación tan simple: depende de cuántos lados quedan en el borde.' }
        ],
        pista: 'Mirá dos cuadrados pegados: el lado que comparten, ¿está en el borde de la figura?',
        explica: 'La estrategia de Nicolás cuenta los lados interiores compartidos. Solo los lados del borde forman el perímetro.' },

      { id: 'm12c3', tipo: 'number', fuente: 'p. 38 · act. 57',
        consigna: 'Entonces, ¿cuál es el perímetro real de la figura celeste? ¿Y su área?',
        figDe: 'm12c2',
        campos: [
          { et: 'Perímetro', ans: 14, suf: 'lados de cuadradito', mal: [{ v: 24, fb: '24 es el resultado de Nicolás: incluye los lados interiores. Contá solo el borde.' }, { v: 6, fb: '6 es la cantidad de cuadraditos (el área). El perímetro se cuenta por el borde.' }] },
          { et: 'Área', ans: 6, suf: 'cuadraditos', mal: [{ v: 14, fb: '14 es el perímetro. El área es la cantidad de cuadraditos.' }] }
        ],
        pista: 'Hay 5 lugares donde dos cuadrados comparten un lado. Cada uno "esconde" 2 lados: 24 − 10 = …',
        explica: 'Perímetro: 14 lados de cuadradito (24 − 2 × 5 lados compartidos). Área: 6 cuadraditos.' },

      { id: 'm12c4', tipo: 'grid', fuente: 'p. 37 · act. 2 a',
        consigna: 'Dibujá una figura que tenga <b>igual área</b> (6 cuadraditos) y <b>menor perímetro</b> que la figura rosa (14). Tocá los cuadraditos para pintarlos; los cuadraditos deben estar unidos por sus lados.',
        cols: 10, rows: 7, ref: CRUZ, cond: { area: ['eq', 6], perim: ['lt', 14] },
        pista: 'Cuanto más "apretada" o compacta es la figura, más lados quedan adentro y menor es el perímetro. Probá con un rectángulo.',
        explica: 'Por ejemplo, un rectángulo de 2 × 3 tiene área 6 y perímetro 10, menor que 14.' },

      { id: 'm12c5', tipo: 'grid', fuente: 'p. 37 · act. 2 b',
        consigna: 'Dibujá una figura que tenga <b>mayor área</b> (más de 6 cuadraditos) y <b>mayor perímetro</b> (más de 14) que la figura rosa.',
        cols: 10, rows: 7, ref: CRUZ, cond: { area: ['gt', 6], perim: ['gt', 14] },
        pista: 'Una figura larga y finita tiene mucho contorno. Probá con una fila de 8 cuadraditos.',
        explica: 'Por ejemplo, una fila de 8 cuadraditos tiene área 8 y perímetro 18.' },

      { id: 'm12c6', tipo: 'choice', fuente: 'p. 37 · act. 56.3 (con la figura rosa)',
        consigna: '¿Es posible obtener una figura de <b>6 cuadraditos</b> (unidos por sus lados) con un perímetro <b>mayor que 14</b>?',
        figDe: 'm12c2',
        ops: [
          { t: 'No: cada cuadradito que se agrega comparte al menos un lado, así que el perímetro sube como máximo 2. Lo máximo es 4 + 5 × 2 = 14.', ok: true, fb: '¡Excelente razonamiento! La figura rosa ya tiene el mayor perímetro posible para 6 cuadraditos.' },
          { t: 'Sí: alcanza con separar los cuadraditos.', fb: 'Si se separan, ya no forman una sola figura. Deben estar unidos por sus lados.' },
          { t: 'Sí: con una fila de 6 cuadraditos el perímetro es 24.', fb: 'Contá de nuevo: una fila de 6 tiene 6 + 6 + 1 + 1 = 14 lados de contorno.' }
        ],
        pista: 'Empezá con un cuadradito (perímetro 4). ¿Cuánto puede aumentar el perímetro cada vez que pegás otro?',
        explica: 'Un cuadradito tiene perímetro 4. Cada cuadradito nuevo agrega 4 lados pero esconde al menos 2: suma como máximo 2. Con 6: 4 + 5 × 2 = 14 como máximo.' },

      { id: 'm12c7', tipo: 'choice', fuente: 'p. 38 · act. 58',
        consigna: 'Analizá las dos figuras y compará sus áreas. ¿Qué relación existe entre ellas?',
        fig: function () {
          var s = 15, o = F.grid(10, 10, 22, 11, s, 'gridl');
          o += F.rect(10 + s, 10 + s, 10 * s, 10 * s, 'cell cell-coral-soft') + F.poly([[10 + 12 * s, 10 + s], [10 + 12 * s, 10 + 11 * s], [10 + 22 * s, 10 + 11 * s]], 'cell cell-sky');
          return F.svg(10 + 22 * s + 10, 10 + 11 * s + 10, o, 'Un cuadrado de 10 por 10 cuadraditos y un triángulo rectángulo con la misma base y la misma altura.');
        },
        ops: [
          { t: 'El área del triángulo es la mitad del área del cuadrado.', ok: true, fb: '¡Muy bien! Con la misma base y altura, el triángulo ocupa la mitad.' },
          { t: 'Tienen la misma área.', fb: 'Imaginá el triángulo dentro del cuadrado: ¿lo cubre todo?' },
          { t: 'El área del triángulo es el doble.', fb: 'El triángulo cabe dentro del cuadrado, así que no puede tener el doble de área.' },
          { t: 'No se puede comparar.', fb: 'Se puede: tienen la misma base y la misma altura.' }
        ],
        pista: 'Si cortás el cuadrado por su diagonal, ¿qué figuras obtenés?',
        explica: 'El cuadrado tiene 10 × 10 = 100 cuadraditos y el triángulo, 100 ÷ 2 = 50. El área del triángulo se calcula a partir del área del cuadrado.' }
    ]
  });

  /* ---------------- MISIÓN 13 ---------------- */
  M.push({
    id: 'm13', titulo: 'Arquitectos de áreas', icono: 'area', contenido: 'areas', paginas: 'pp. 38–40',
    descripcion: 'Fórmulas de área y figuras compuestas.',
    objetivo: 'Deducir y aplicar fórmulas de área, y descomponer figuras compuestas para calcular su superficie.',
    puntos: [
      '<b>Cuadrado y rectángulo</b>: A = b × a (base × altura).',
      '<b>Triángulo</b>: A = (b × a) ÷ 2, porque es la mitad de un rectángulo con la misma base y altura.',
      '<b>Paralelogramo</b>: si recortás un triángulo y lo movés, se forma un rectángulo → A = b × h.'
    ],
    ejemplo: {
      html: 'Mirá la animación: el triángulo se traslada y el paralelogramo se convierte en un rectángulo de la misma base y altura.',
      fig: function () {
        var o = F.poly([[60, 190], [260, 190], [320, 70], [120, 70]], 'shape-outline');
        o += F.poly([[120, 70], [120, 190], [260, 190], [320, 70]], 'shape shape-sky');
        o += '<g class="anim-shift">' + F.poly([[60, 190], [120, 190], [120, 70]], 'shape shape-amber') + '</g>';
        o += F.seg([120, 70], [120, 190], 'ln ln-dash') + F.right([120, 190], 0, 10);
        o += F.text(160, 210, 'b', 'lbl lbl-b') + F.text(108, 130, 'h', 'lbl lbl-b');
        return F.svg(360, 225, o, 'Paralelogramo al que se le recorta un triángulo que se traslada para formar un rectángulo.');
      }
    },
    desafios: [
      { id: 'm13c1', tipo: 'choice', fuente: 'p. 39 · Deducir el área del paralelogramo',
        consigna: 'A partir del rectángulo que se forma al trasladar el triángulo, ¿cuál es la fórmula del área del <b>paralelogramo</b>?',
        figDe: 'intro',
        ops: [
          { t: 'A = base × altura', ok: true, fb: '¡Exacto! El rectángulo formado tiene la misma base y la misma altura.' },
          { t: 'A = base × lado inclinado', fb: 'El lado inclinado no es la altura: la altura es perpendicular a la base.' },
          { t: 'A = (base × altura) ÷ 2', fb: 'Esa es la fórmula del triángulo. Aquí no se pierde ninguna parte: solo se traslada.' },
          { t: 'A = base + altura + base + altura', fb: 'Eso sería el perímetro de un rectángulo, no el área.' }
        ],
        pista: 'Al trasladar el triángulo no se agrega ni se quita superficie.',
        explica: 'El paralelogramo y el rectángulo formado tienen la misma superficie, la misma base y la misma altura: A = b × h.' },

      { id: 'm13c2', tipo: 'choice', fuente: 'p. 38 · act. 59',
        consigna: '¿Cómo podés usar la fórmula del área del rectángulo para deducir la del <b>triángulo</b>?',
        ops: [
          { t: 'Un triángulo con la misma base y altura ocupa la mitad del rectángulo: A = (b × a) ÷ 2.', ok: true, fb: '¡Muy bien! La diagonal divide al rectángulo en dos triángulos iguales.' },
          { t: 'Hay que restarle 2 al área del rectángulo.', fb: 'No se resta un número fijo: el triángulo es la mitad del rectángulo.' },
          { t: 'Es la misma fórmula: A = b × a.', fb: 'El triángulo no cubre todo el rectángulo; cubre solo una parte.' },
          { t: 'Se multiplica por 3 porque tiene 3 lados.', fb: 'La cantidad de lados no indica la fórmula del área.' }
        ],
        pista: 'Recordá la actividad 58: el triángulo y el cuadrado.',
        explica: 'Un rectángulo se divide en dos triángulos iguales por su diagonal: el área del triángulo es (b × a) ÷ 2.' },

      { id: 'm13c3', tipo: 'number', fuente: 'p. 39 · act. 60',
        consigna: 'Cada cuadradito mide 1 cm de lado. Calculá el área de cada figura e indicá la unidad.',
        fig: function () {
          var s = 50, o = F.grid(20, 30, 3, 2, s, 'gridl') + F.poly([[20 + s, 30], [20 + 2 * s, 30], [20 + 2 * s, 30 + s], [20 + 3 * s, 30 + 2 * s], [20, 30 + 2 * s], [20 + s, 30 + s]], 'shape shape-sky');
          o += F.text(20, 15, 'a.', 'lbl lbl-b', 'start') + F.dim([20 + 2 * s + 12, 30], [20 + 2 * s + 12, 30 + s], '1 cm', 0);
          var x2 = 260, o2 = F.grid(x2, 30, 3, 3, s, 'gridl') + F.poly([[x2 + s, 30], [x2 + 3 * s, 30], [x2 + 3 * s, 30 + s], [x2 + 2 * s, 30 + s], [x2 + 2 * s, 30 + 2 * s], [x2 + 3 * s, 30 + 2 * s], [x2 + 3 * s, 30 + 3 * s], [x2 + s, 30 + 3 * s], [x2 + s, 30 + 2 * s], [x2, 30 + 2 * s], [x2, 30 + s], [x2 + s, 30 + s]], 'shape shape-sky');
          o2 += F.text(x2, 15, 'b.', 'lbl lbl-b', 'start');
          return F.svg(440, 210, o + o2, 'Figura a: un cuadrado de 1 centímetro sobre un trapecio de base 3. Figura b: figura escalonada sobre una cuadrícula de 3 por 3.');
        },
        campos: [
          { et: 'a. Área', ans: 3, unidades: U_AREA, unidad: 'cm²', mal: [{ v: 2, fb: 'No te olvides del cuadradito de arriba (1 cm²).' }, { v: 6, fb: 'Contaste el rectángulo completo de 3 × 2, pero hay partes vacías (los triángulos de los costados son mitades).' }] },
          { et: 'b. Área', ans: 6, unidades: U_AREA, unidad: 'cm²' }
        ],
        pista: 'En la figura a, cada triángulo de los costados es la mitad de un cuadradito. En la b, contá los cuadraditos enteros.',
        explica: 'a. 1 cm² (arriba) + 1 cm² (centro) + 2 mitades (1 cm²) = 3 cm². b. 6 cuadraditos enteros = 6 cm².' },

      { id: 'm13c4', tipo: 'choice', fuente: 'p. 39 · act. 61',
        consigna: 'Para explicar el paso a paso del cálculo del área de la figura <b>a</b>, ¿qué estrategia es correcta?',
        figDe: 'm13c3',
        ops: [
          { t: 'Descomponerla: un cuadrado de 1 cm² arriba y, abajo, un cuadrado de 1 cm² con dos medios cuadrados.', ok: true, fb: '¡Muy bien explicado! Descomponer en figuras conocidas es una gran estrategia.' },
          { t: 'Multiplicar el ancho total por el alto total: 3 × 2 = 6 cm².', fb: 'Así contarías también los espacios vacíos alrededor de la figura.' },
          { t: 'Contar los lados del contorno.', fb: 'Contar el contorno da el perímetro, no el área.' }
        ],
        pista: '¿En qué figuras más simples se puede partir la figura a?',
        explica: 'Se descompone en figuras conocidas: 1 + 1 + ½ + ½ = 3 cm². En la carpeta, escribí tu explicación con tus palabras (act. 61).' },

      { id: 'm13c5', tipo: 'number', fuente: 'p. 40 · act. 62 a',
        consigna: 'Para señalizar la muestra de matemática recortaron flechas de cartulina. ¿Cuál es la superficie del <b>cuerpo rectangular</b> de la flecha?',
        fig: function () {
          var s = 24, x = 30, y = 70, o = F.grid(10, 20, 17, 8, s, 'gridl');
          o += F.rect(x, y, 10 * s, 4 * s, 'shape shape-paper') + F.poly([[x + 10 * s, y - s], [x + 10 * s, y + 5 * s], [x + 14 * s, y + 2 * s]], 'shape shape-paper');
          o += F.dim([x, y], [x + 10 * s, y], '10 cm', 16) + F.dim([x - 10, y], [x - 10, y + 4 * s], '4 cm', 0);
          return F.svg(430, 220, o, 'Flecha formada por un rectángulo de 10 por 4 centímetros y una punta triangular.');
        },
        campos: [{ et: 'Cuerpo rectangular', ans: 40, unidades: U_AREA, unidad: 'cm²', mal: [{ v: 28, fb: '28 cm es el perímetro del rectángulo (10 + 4 + 10 + 4). El área es base × altura.' }, { v: 14, fb: 'Sumaste base + altura. El área se calcula multiplicando.' }] }],
        pista: 'Área del rectángulo = base × altura.',
        explica: '10 cm × 4 cm = 40 cm².' },

      { id: 'm13c6', tipo: 'number', fuente: 'p. 40 · act. 62 b (figura 1)',
        consigna: 'Calculá el área de la figura 1. Realizá todos los cálculos necesarios.',
        fig: function () {
          var s = 26, x = 60, y = 220, o = F.poly([[x, y], [x + 6 * s, y], [x + 6 * s, y - 3 * s], [x, y - 6 * s]], 'shape shape-gray') + F.seg([x, y - 3 * s], [x + 6 * s, y - 3 * s], 'ln ln-dash ln-thin');
          o += F.text(x + 3 * s, y + 16, '6 m', 'lbl lbl-s') + F.text(x - 10, y - 3 * s, '6 m', 'lbl lbl-s', 'end') + F.text(x + 6 * s + 10, y - 1.5 * s, '3 m', 'lbl lbl-s', 'start');
          return F.svg(300, 250, o, 'Figura 1: trapecio rectángulo con lados verticales de 6 y 3 metros y base de 6 metros.');
        },
        campos: [{ et: 'Área', ans: 27, unidades: U_AREA, unidad: 'm²', mal: [{ v: 36, fb: 'Calculaste un cuadrado de 6 × 6, pero la parte de arriba es un triángulo.' }, { v: 18, fb: 'Calculaste solo el rectángulo de abajo (6 × 3). Falta el triángulo de arriba.' }, { v: 45, fb: 'El triángulo de arriba mide (6 × 3) ÷ 2. No te olvides de dividir por 2.' }] }],
        pista: 'Podés partirla en un rectángulo de 6 m × 3 m y un triángulo de base 6 m y altura 3 m.',
        explica: 'Rectángulo: 6 × 3 = 18 m². Triángulo: (6 × 3) ÷ 2 = 9 m². Total: 27 m².' },

      { id: 'm13c7', tipo: 'number', fuente: 'p. 40 · act. 62 b (figura 2)',
        consigna: 'Calculá el área de la figura 2.',
        fig: function () {
          var s = 8.5, x = 50, y = 30, o = F.poly([[x, y], [x + 14 * s, y], [x + 14 * s, y + 3 * s], [x + 26 * s, y + 3 * s], [x + 26 * s, y + 15 * s], [x, y + 15 * s]], 'shape shape-gray');
          o += F.seg([x + 14 * s, y + 3 * s], [x + 14 * s, y + 15 * s], 'ln ln-dash ln-thin');
          o += F.text(x + 7 * s, y - 12, '14 m', 'lbl lbl-s') + F.text(x + 20 * s, y + 3 * s - 12, '12 m', 'lbl lbl-s') + F.text(x - 10, y + 7.5 * s, '15 m', 'lbl lbl-s', 'end') + F.text(x + 26 * s + 10, y + 9 * s, '12 m', 'lbl lbl-s', 'start');
          return F.svg(340, 170, o, 'Figura 2: figura con forma de escalón. Arriba 14 metros, escalón de 12 metros, alto izquierdo 15 metros y alto derecho 12 metros.');
        },
        campos: [{ et: 'Área', ans: 354, unidades: U_AREA, unidad: 'm²', mal: [{ v: 390, fb: 'Usaste 15 m como altura de la parte derecha, pero mide 12 m.' }, { v: 336, fb: 'Revisá las medidas de cada parte: izquierda 14 × 15 y derecha 12 × 12.' }] }],
        pista: 'Dividila en dos rectángulos: el de la izquierda (14 × 15) y el de la derecha (12 × 12).',
        explica: '14 × 15 = 210 m² y 12 × 12 = 144 m². Total: 354 m². (También: 26 × 15 − 12 × 3 = 390 − 36 = 354 m².)' },

      { id: 'm13c8', tipo: 'number', fuente: 'p. 40 · act. 62 b (figura 9)',
        consigna: 'Calculá el área de la figura 9.',
        fig: function () {
          var s = 11, x = 30, y = 50, o = F.poly([[x, y], [x + 23 * s, y], [x + 12 * s, y + 5 * s], [x + 23 * s, y + 10 * s], [x, y + 10 * s]], 'shape shape-gray');
          o += F.seg([x + 23 * s, y], [x + 23 * s, y + 10 * s], 'ln ln-dash ln-thin');
          o += F.dim([x + 12 * s, y - 14], [x + 23 * s, y - 14], '11 cm', 0) + F.text(x + 11.5 * s, y + 10 * s + 16, '23 cm', 'lbl lbl-s') + F.text(x - 8, y + 5 * s, '10 cm', 'lbl lbl-s', 'end');
          return F.svg(320, 190, o, 'Figura 9: rectángulo de 23 por 10 centímetros con un recorte triangular de 11 centímetros de profundidad.');
        },
        campos: [{ et: 'Área', ans: 175, unidades: U_AREA, unidad: 'cm²', mal: [{ v: 230, fb: '230 cm² es el rectángulo completo. Falta restar el triángulo recortado.' }, { v: 120, fb: 'El triángulo recortado mide (10 × 11) ÷ 2 = 55 cm². ¡No te olvides de dividir por 2!' }, { v: 285, fb: 'El triángulo está recortado: hay que restarlo, no sumarlo.' }] }],
        pista: 'Al rectángulo de 23 × 10 restale el triángulo recortado (base 10 cm, altura 11 cm).',
        explica: 'Rectángulo: 23 × 10 = 230 cm². Triángulo recortado: (10 × 11) ÷ 2 = 55 cm². Área: 230 − 55 = 175 cm².' },

      { id: 'm13c9', tipo: 'choice', fuente: 'Práctica de la app (identificar el error) · p. 40',
        consigna: 'Para la figura 2, Tomi calculó: 14 × 15 + 12 × 15 = 390 m². ¿Cuál fue su error?',
        figDe: 'm13c7',
        ops: [
          { t: 'Usó 15 m como altura del rectángulo de la derecha, pero mide 12 m.', ok: true, fb: '¡Bien detectado! La parte derecha es un rectángulo de 12 × 12.' },
          { t: 'Tenía que sumar las medidas en lugar de multiplicarlas.', fb: 'Para el área de cada rectángulo sí se multiplica base por altura.' },
          { t: 'No hay error.', fb: 'Mirá la altura de la parte derecha: ¿mide 15 m?' },
          { t: 'Debía dividir todo por 2.', fb: 'Solo se divide por 2 en el área de los triángulos. Aquí hay rectángulos.' }
        ],
        pista: 'Revisá las medidas de la parte derecha de la figura.',
        explica: 'La parte derecha mide 12 m × 12 m = 144 m², no 12 × 15. El área correcta es 354 m².' }
    ]
  });

  /* ---------------- MISIÓN 14 ---------------- */
  M.push({
    id: 'm14', titulo: 'Rombos y trapecios', icono: 'rhombus', contenido: 'areas', paginas: 'pp. 39, 41–43',
    descripcion: 'Deducí y usá las fórmulas del área del rombo y del trapecio.',
    objetivo: 'Deducir la fórmula del área del rombo, comprender la del trapecio y aplicarlas en problemas.',
    puntos: [
      'El rombo se puede dibujar dentro de un rectángulo cuya base y altura miden lo mismo que sus <b>diagonales</b>.',
      'El rombo ocupa la <b>mitad</b> de ese rectángulo → <b>A = (D × d) ÷ 2</b>.',
      'Dos trapecios iguales, uno dado vuelta, forman un paralelogramo de base B + b y altura h → <b>A = (B + b) × h ÷ 2</b>.'
    ],
    ejemplo: {
      html: 'Rombo de diagonales 6 cm y 4 cm: A = (6 × 4) ÷ 2 = 12 cm².',
      fig: function () {
        var o = F.poly([[40, 170], [240, 170], [180, 80], [100, 80]], 'shape shape-pink');
        o += '<g class="anim-fade">' + F.poly([[240, 170], [180, 80], [380, 80], [320, 170]], 'shape-outline shape-dashed') + '</g>';
        o += F.seg([100, 80], [100, 170], 'ln ln-thin') + F.text(140, 66, 'b', 'lbl lbl-b') + F.text(140, 188, 'B', 'lbl lbl-b') + F.text(90, 125, 'h', 'lbl lbl-b');
        o += F.text(280, 66, 'B', 'lbl lbl-s lbl-blue') + F.text(280, 188, 'b', 'lbl lbl-s lbl-blue');
        return F.svg(420, 205, o, 'Trapecio de bases B y b con un trapecio igual dado vuelta: juntos forman un paralelogramo de base B más b.');
      }
    },
    desafios: [
      { id: 'm14c1', tipo: 'choice', fuente: 'p. 41 · act. 63.1',
        consigna: 'Observá la figura de color. ¿Qué nombre recibe y cuáles son sus características?',
        fig: function () { return figRombo(); },
        ops: [
          { t: 'Rombo: 4 lados iguales y 2 pares de lados paralelos.', ok: true, fb: '¡Correcto! Además, sus diagonales son perpendiculares y se cortan en su punto medio.' },
          { t: 'Cuadrado: 4 lados iguales y 4 ángulos rectos.', fb: 'Tiene 4 lados iguales, pero sus ángulos no son rectos.' },
          { t: 'Romboide: dos pares de lados consecutivos iguales.', fb: 'El romboide no tiene lados paralelos. Esta figura sí tiene dos pares.' },
          { t: 'Trapecio: un solo par de lados paralelos.', fb: 'Mirá bien: tiene dos pares de lados paralelos.' }
        ],
        pista: 'Compará la medida de sus cuatro lados y fijate si tiene ángulos rectos.',
        explica: 'Es un rombo: 4 lados iguales, 2 pares de lados paralelos y ningún ángulo recto.' },

      { id: 'm14c2', tipo: 'choice', fuente: 'p. 41 · act. 63.2 y 63.3',
        consigna: '¿Qué elementos del rombo miden lo mismo que la base y la altura del rectángulo MKLN?',
        figDe: 'm14c1',
        ops: [
          { t: 'Sus diagonales QO y RP.', ok: true, fb: '¡Bien! QO mide lo mismo que la base y RP lo mismo que la altura.' },
          { t: 'Sus lados.', fb: 'Los lados del rombo son inclinados; mirá las líneas punteadas.' },
          { t: 'Sus ángulos.', fb: 'Los ángulos no se miden en centímetros.' }
        ],
        pista: 'Mirá las líneas punteadas que cruzan el rombo.',
        explica: 'La diagonal QO mide igual que la base del rectángulo (6 cm) y la diagonal RP igual que su altura (4 cm).' },

      { id: 'm14c3', tipo: 'choice', fuente: 'p. 41 · act. 63.4 a 63.6',
        consigna: 'Las diagonales forman 4 rectángulos pequeños. En cada uno, la parte verde es exactamente la <b>mitad</b>. ¿Qué parte del rectángulo grande MKLN ocupa el rombo?',
        figDe: 'm14c1',
        ops: [
          { t: 'La mitad.', ok: true, fb: '¡Exacto! Si en cada rectángulo pequeño ocupa la mitad, en el grande también.' },
          { t: 'Un cuarto.', fb: 'Un cuarto sería uno de los rectángulos pequeños. Pero el rombo ocupa la mitad de cada uno.' },
          { t: 'Todo el rectángulo.', fb: 'Mirá las esquinas blancas: el rombo no ocupa todo.' },
          { t: 'El doble.', fb: 'El rombo está dentro del rectángulo: no puede ocupar el doble.' }
        ],
        pista: 'La mitad de cada parte… ¿es qué parte del total?',
        explica: 'El rombo ocupa la mitad de cada rectángulo pequeño, así que ocupa la mitad del rectángulo MKLN.' },

      { id: 'm14c4', tipo: 'select', fuente: 'p. 41 · conclusión',
        consigna: 'Entonces podemos deducir que el <b>área del rombo</b> es:',
        figDe: 'm14c1',
        filas: [{ t: 'A = ( ___ ) ÷ ___', ops: [['D × d', 'D + d', 'lado × lado', 'D × lado'], ['2', '4', '1']], ans: ['D × d', '2'] }],
        pista: 'El rectángulo tiene área D × d (diagonal mayor × diagonal menor). El rombo ocupa la mitad.',
        explica: 'A = (D × d) ÷ 2, donde D es la diagonal mayor y d la diagonal menor.' },

      { id: 'm14c5', tipo: 'number', fuente: 'p. 41 · act. 63',
        consigna: 'Cada cuadradito mide 1 cm de lado. Calculá el área del rectángulo MKLN y la del rombo.',
        figDe: 'm14c1',
        campos: [
          { et: 'Rectángulo MKLN', ans: 24, unidades: U_AREA, unidad: 'cm²', mal: [{ v: 20, fb: '20 cm es el perímetro del rectángulo. El área es 6 × 4.' }] },
          { et: 'Rombo', ans: 12, unidades: U_AREA, unidad: 'cm²', mal: [{ v: 24, fb: 'El rombo ocupa la mitad del rectángulo.' }, { v: 6, fb: 'Dividiste por 4. El rombo ocupa la mitad, no un cuarto.' }] }
        ],
        pista: 'El rectángulo mide 6 cm × 4 cm. El rombo es la mitad.',
        explica: 'Rectángulo: 6 × 4 = 24 cm². Rombo: (6 × 4) ÷ 2 = 12 cm².' },

      { id: 'm14c6', tipo: 'number', fuente: 'p. 42 · act. 64',
        consigna: 'a) El escudo con forma de rombo tiene una diagonal horizontal de 12 cm y una vertical de 20 cm. ¿Cuánta tela se necesita? <br>b) Un cantero con forma de rombo tiene diagonales de 6 m y 4 m. ¿Cuál es su superficie?',
        layout: 'nofig',
        campos: [
          { et: 'a) Tela verde', ans: 120, unidades: U_AREA, unidad: 'cm²', mal: [{ v: 240, fb: 'Falta dividir por 2: el rombo es la mitad del rectángulo.' }, { v: 16, fb: 'Sumaste y dividiste. En la fórmula se multiplican las diagonales: (12 × 20) ÷ 2.' }] },
          { et: 'b) Superficie del cantero', ans: 12, unidades: U_AREA, unidad: 'm²', mal: [{ v: 24, fb: 'Falta dividir por 2.' }, { v: 5, fb: 'Las diagonales se multiplican, no se suman: (6 × 4) ÷ 2.' }] }
        ],
        pista: 'A = (D × d) ÷ 2. Cuidado con las unidades: en a) son cm y en b) son m.',
        explica: 'a) (12 × 20) ÷ 2 = 240 ÷ 2 = 120 cm². b) (6 × 4) ÷ 2 = 24 ÷ 2 = 12 m².' },

      { id: 'm14c7', tipo: 'number', fuente: 'p. 42 · act. 65',
        consigna: 'Un barrilete está formado por un rombo central (diagonales de 10 cm y 6 cm) y dos triángulos iguales pegados a los costados. Cada triángulo tiene base de 3 cm y altura de 6 cm.',
        fig: function () {
          var s = 20, C = [230, 130], o = '';
          o += F.poly([[C[0], C[1] - 5 * s], [C[0] + 3 * s, C[1]], [C[0], C[1] + 5 * s], [C[0] - 3 * s, C[1]]], 'shape shape-lime');
          o += F.seg([C[0], C[1] - 5 * s], [C[0], C[1] + 5 * s], 'ln ln-thin') + F.seg([C[0] - 3 * s, C[1]], [C[0] + 3 * s, C[1]], 'ln ln-thin');
          o += F.poly([[C[0] - 6 * s, C[1] - 3 * s], [C[0] - 6 * s, C[1] + 1.2 * s], [C[0] - 3 * s, C[1] + 1.2 * s]], 'shape shape-blue');
          o += F.poly([[C[0] + 6 * s, C[1] - 3 * s], [C[0] + 6 * s, C[1] + 1.2 * s], [C[0] + 3 * s, C[1] + 1.2 * s]], 'shape shape-blue');
          o += F.text(C[0] + 12, C[1] - 60, '10 cm', 'lbl lbl-s', 'start') + F.text(C[0] + 28, C[1] - 10, '6 cm', 'lbl lbl-s');
          o += F.text(C[0] - 6 * s - 8, C[1] - 0.9 * s, '6 cm', 'lbl lbl-s', 'end') + F.text(C[0] - 4.5 * s, C[1] + 1.2 * s + 14, '3 cm', 'lbl lbl-s');
          o += F.text(C[0] + 6 * s + 8, C[1] - 0.9 * s, '6 cm', 'lbl lbl-s', 'start') + F.text(C[0] + 4.5 * s, C[1] + 1.2 * s + 14, '3 cm', 'lbl lbl-s');
          return F.svg(460, 260, o, 'Barrilete: rombo de diagonales 10 y 6 centímetros con dos triángulos de base 3 y altura 6 centímetros a los costados.');
        },
        campos: [
          { et: '1. Área del rombo central', ans: 30, unidades: U_AREA, unidad: 'cm²', mal: [{ v: 60, fb: 'Falta dividir por 2: (10 × 6) ÷ 2.' }] },
          { et: '2. Área de los dos triángulos', ans: 18, unidades: U_AREA, unidad: 'cm²', mal: [{ v: 9, fb: 'Ese es el área de UN triángulo. Son dos.' }, { v: 36, fb: 'Cada triángulo mide (3 × 6) ÷ 2 = 9 cm². ¡No te olvides de dividir por 2!' }] },
          { et: '3. Superficie total', ans: 48, unidades: U_AREA, unidad: 'cm²', mal: [{ v: 39, fb: 'Sumaste un solo triángulo. Son dos: 30 + 18.' }] }
        ],
        pista: 'Rombo: (D × d) ÷ 2. Triángulo: (b × h) ÷ 2. Al final, sumá todo.',
        explica: 'Rombo: (10 × 6) ÷ 2 = 30 cm². Cada triángulo: (3 × 6) ÷ 2 = 9 cm²; los dos: 18 cm². Total: 48 cm².' },

      { id: 'm14c8', tipo: 'choice', fuente: 'p. 43',
        consigna: '¿Por qué el área del trapecio se calcula con A = (B + b) × h ÷ 2?',
        figDe: 'intro',
        ops: [
          { t: 'Porque dos trapecios iguales, uno dado vuelta, forman un paralelogramo de base B + b y altura h; el trapecio es la mitad.', ok: true, fb: '¡Excelente! Así se deduce la fórmula a partir del paralelogramo.' },
          { t: 'Porque el trapecio tiene dos bases y se dividen por 2.', fb: 'Se divide por 2 porque el trapecio es la mitad de un paralelogramo, no por tener dos bases.' },
          { t: 'Porque es la misma fórmula del rombo.', fb: 'El rombo usa las diagonales; el trapecio usa las bases y la altura.' },
          { t: 'Porque B + b es el perímetro.', fb: 'B + b es la base del paralelogramo que se forma, no el perímetro.' }
        ],
        pista: 'Mirá la animación de la introducción: ¿qué figura forman los dos trapecios?',
        explica: 'Dos trapecios iguales forman un paralelogramo de base B + b y altura h, cuya área es (B + b) × h. El trapecio es la mitad.' },

      { id: 'm14c9', tipo: 'number', fuente: 'p. 43 (con la figura a de la act. 60, p. 39)',
        consigna: 'La parte de abajo de la figura <b>a</b> (actividad 60) es un trapecio con B = 3 cm, b = 1 cm y h = 1 cm. Usá la fórmula para calcular su área.',
        figDe: 'm13c3',
        campos: [{ et: 'Área del trapecio', ans: 2, unidades: U_AREA, unidad: 'cm²', mal: [{ v: 4, fb: 'Falta dividir por 2: (3 + 1) × 1 ÷ 2.' }, { v: 3, fb: 'Multiplicaste B × b. En la fórmula, las bases se suman: (B + b) × h ÷ 2.' }] }],
        pista: 'A = (B + b) × h ÷ 2 = (3 + 1) × 1 ÷ 2.',
        explica: '(3 + 1) × 1 ÷ 2 = 4 ÷ 2 = 2 cm². ¡Coincide con lo que obtuviste descomponiendo la figura!' }
    ]
  });

  /* ---------------- MISIÓN 15 (FINAL) ---------------- */
  M.push({
    id: 'm15', titulo: 'Desafío de los Guardianes', icono: 'crown', contenido: 'integracion', paginas: 'integra pp. 7–43', final: true,
    descripcion: 'El desafío final: problemas que combinan todo lo aprendido.',
    objetivo: 'Integrar ángulos, triángulos, Pitágoras, cuadriláteros, perímetro y área para resolver problemas.',
    puntos: [
      'Leé con atención y <b>dibujá</b> la situación si te ayuda.',
      'Pensá qué <b>propiedad o fórmula</b> necesitás en cada paso.',
      'Revisá las <b>unidades</b>: lineales para longitudes y perímetros, cuadradas para áreas.'
    ],
    ejemplo: { html: 'En este desafío no hay pistas automáticas en el primer intento: ¡demostrá todo lo que sabés!', fig: function () {
      var o = F.poly([[180, 20], [330, 150], [180, 280], [30, 150]], 'shape shape-amber') + F.seg([180, 20], [180, 280], 'ln ln-dash') + F.seg([30, 150], [330, 150], 'ln ln-dash');
      o += F.poly([[180, 150], [330, 150], [180, 20]], 'shape shape-coral-soft') + F.right([180, 150], 0, 12);
      return F.svg(360, 300, o, 'Rombo con sus diagonales y un triángulo rectángulo destacado.');
    } },
    desafios: [
      { id: 'm15c1', tipo: 'number', fuente: 'Integra pp. 18–19, 37 y 38',
        consigna: 'La cuerda de 12 nudos forma un triángulo rectángulo de 3, 4 y 5 nudos. Si entre nudo y nudo hay 1 m, calculá su perímetro y su área.',
        figDe: 'm6c1',
        campos: [
          { et: 'Perímetro', ans: 12, unidades: U_LONG, unidad: 'm', mal: [{ v: 60, fb: '3 × 4 × 5 no es el perímetro. El perímetro es la suma de los lados.' }] },
          { et: 'Área', ans: 6, unidades: U_AREA, unidad: 'm²', mal: [{ v: 12, fb: 'Falta dividir por 2: el área del triángulo es (b × h) ÷ 2, con los catetos como base y altura.' }, { v: 7.5, fb: 'La base y la altura son los catetos (3 y 4), no la hipotenusa.' }, { v: 10, fb: 'La base y la altura son los catetos (3 y 4).' }] }
        ],
        pista: 'Perímetro: suma de los lados. Área del triángulo rectángulo: (cateto × cateto) ÷ 2.',
        explica: 'Perímetro: 3 + 4 + 5 = 12 m. Área: (3 × 4) ÷ 2 = 6 m².' },

      { id: 'm15c2', tipo: 'number', fuente: 'Integra pp. 23, 37 y 38',
        consigna: 'El terreno rectangular de 12 m de largo y 3,5 m de ancho se divide por su diagonal. Calculá la diagonal, el perímetro y el área del terreno.',
        figDe: 'm7c6',
        campos: [
          { et: 'Diagonal', ans: 12.5, unidades: U_LONG, unidad: 'm' },
          { et: 'Perímetro del terreno', ans: 31, unidades: U_LONG, unidad: 'm', mal: [{ v: 15.5, fb: 'Sumaste solo dos lados. El rectángulo tiene cuatro: 12 + 3,5 + 12 + 3,5.' }, { v: 42, fb: '42 es el área. El perímetro es la suma de los cuatro lados.' }] },
          { et: 'Área del terreno', ans: 42, unidades: U_AREA, unidad: 'm²', mal: [{ v: 31, fb: '31 es el perímetro. El área es largo × ancho.' }, { v: 21, fb: 'Ese es el área de uno de los triángulos. Se pide el terreno completo.' }] }
        ],
        pista: 'Diagonal con Pitágoras (12² + 3,5²). Perímetro: suma de los 4 lados. Área: largo × ancho.',
        explica: 'Diagonal: √(144 + 12,25) = √156,25 = 12,5 m. Perímetro: 2 × 12 + 2 × 3,5 = 31 m. Área: 12 × 3,5 = 42 m².' },

      { id: 'm15c3', tipo: 'number', fuente: 'Integra pp. 7, 11 y 12',
        consigna: 'Un ángulo mide 62°. Calculá su complemento, su suplemento y la amplitud de cada parte si se traza la bisectriz de su suplemento.',
        layout: 'nofig',
        campos: [
          { et: 'Complemento', ans: 28, suf: '°', mal: [{ v: 118, fb: '118° es el suplemento. El complemento se calcula con 90°.' }] },
          { et: 'Suplemento', ans: 118, suf: '°', mal: [{ v: 28, fb: '28° es el complemento. El suplemento se calcula con 180°.' }] },
          { et: 'Cada parte del suplemento', ans: 59, suf: '°', mal: [{ v: 31, fb: 'Se pide la bisectriz del suplemento (118°), no del ángulo de 62°.' }] }
        ],
        pista: 'Complemento: 90° − 62°. Suplemento: 180° − 62°. La bisectriz divide en dos partes iguales.',
        explica: 'Complemento: 28°. Suplemento: 118°. Cada parte: 118° ÷ 2 = 59°.' },

      { id: 'm15c4', tipo: 'number', fuente: 'Integra pp. 31–32',
        consigna: 'En un romboide, el par de ángulos opuestos iguales mide 110° cada uno. Otro de sus ángulos mide 60°. ¿Cuánto mide el cuarto ángulo?',
        layout: 'nofig',
        campos: [{ et: 'Cuarto ángulo', ans: 80, suf: '°', mal: [{ v: 190, fb: 'Restaste un solo ángulo de 110°. Son dos: 360° − 110° − 110° − 60°.' }, { v: 10, fb: 'Usaste 180° como suma total. En un cuadrilátero los ángulos suman 360°.' }, { v: 60, fb: 'En el romboide, solo un par de ángulos opuestos es igual (los de 110°).' }] }],
        pista: 'Los cuatro ángulos de un cuadrilátero suman 360°.',
        explica: '360° − 110° − 110° − 60° = 80°.' },

      { id: 'm15c5', tipo: 'select', fuente: 'Integra pp. 8, 14, 24, 28, 31 y 36',
        consigna: 'Indicá si cada afirmación es verdadera o falsa.',
        layout: 'nofig',
        ops: ['Verdadera', 'Falsa'],
        filas: [
          { t: 'Si dos figuras tienen la misma área, tienen el mismo perímetro. → ___', ans: ['Falsa'], fb: 'Recordá la figura violeta y la celeste larga: igual área, distinto perímetro.' },
          { t: 'La altura de un paralelogramo es perpendicular a la base. → ___', ans: ['Verdadera'] },
          { t: 'En un triángulo rectángulo, la hipotenusa es el lado más largo. → ___', ans: ['Verdadera'], fb: 'La hipotenusa se opone al ángulo mayor (90°), y el ángulo mayor se opone al lado mayor.' },
          { t: 'Los ángulos opuestos por el vértice son suplementarios. → ___', ans: ['Falsa'], fb: 'Los opuestos por el vértice tienen la misma amplitud. Los adyacentes son los suplementarios.' },
          { t: 'Las diagonales del rombo son perpendiculares y se cortan en su punto medio. → ___', ans: ['Verdadera'] },
          { t: 'Todo punto de la mediatriz está a igual distancia de los extremos del segmento. → ___', ans: ['Verdadera'] }
        ],
        pista: 'Pensá en un ejemplo de cada afirmación antes de decidir.',
        explica: 'F, V, V, F, V, V.' },

      { id: 'm15c6', tipo: 'number', fuente: 'Integra pp. 21, 31 y 41–42',
        consigna: 'Un rombo tiene diagonales de 8 cm y 6 cm. Sus diagonales son perpendiculares y se cortan en su punto medio, así que cada lado es la hipotenusa de un triángulo rectángulo de catetos 4 cm y 3 cm. Calculá:',
        figDe: 'intro',
        campos: [
          { et: 'Área del rombo', ans: 24, unidades: U_AREA, unidad: 'cm²', mal: [{ v: 48, fb: 'Falta dividir por 2: (8 × 6) ÷ 2.' }] },
          { et: 'Medida de cada lado', ans: 5, unidades: U_LONG, unidad: 'cm', mal: [{ v: 10, fb: 'Usaste las diagonales completas. Los catetos son las mitades: 4 cm y 3 cm.' }, { v: 7, fb: 'Sumaste 4 + 3 sin elevar al cuadrado.' }] },
          { et: 'Perímetro del rombo', ans: 20, unidades: U_LONG, unidad: 'cm', mal: [{ v: 28, fb: 'Las diagonales no forman parte del contorno. El perímetro es 4 × lado.' }] }
        ],
        pista: 'Área: (D × d) ÷ 2. Lado: √(4² + 3²). Perímetro: 4 lados iguales.',
        explica: 'Área: (8 × 6) ÷ 2 = 24 cm². Lado: √(16 + 9) = √25 = 5 cm. Perímetro: 4 × 5 = 20 cm.' }
    ]
  });

  /* ---------- Ítems pendientes de revisión (se muestran en el modo docente y en el README) ---------- */
  var PENDIENTES = [
    'p. 5: actividades de fracciones (b y c) — corresponden a una unidad anterior; no se incluyeron en la aventura de geometría.',
    'p. 9, act. 14 y 15: la figura con ángulos de colores no se interpreta con seguridad; se adaptaron a la figura de la act. 16.',
    'p. 12, act. 19: el arco de 62° podría marcar c' + hat('o') + 'b o a' + hat('o') + 'c; se interpretó c' + hat('o') + 'b = 62°.',
    'p. 22, act. a: el texto indica base 2,5 m y el dibujo 4 m; se usaron los datos del texto.',
    'p. 22, act. b: la escalera figura en cm (2,50 cm y 0,7 cm) y el dibujo indica 3 m; se usaron metros.',
    'p. 23, act. d y e: los dibujos (4 m y 2,5 m; 50 m y 20 m) no coinciden con el texto; se usaron los datos del texto.',
    'p. 24: demostración grupal del Teorema de Pitágoras y página web — actividad de aula, fuera de la app.',
    'p. 25: "¿Qué representa el segmento que queda dentro de la circunferencia?" — consigna ambigua, no incluida.',
    'p. 26: los segmentos de la act. a y b no tienen medidas; se agregaron 3 cm y 2 cm.',
    'p. 31, act. 45: la descripción "diagonales perpendiculares, el corte no es punto medio de ninguna" se asignó al trapezoide común por eliminación (como el dibujado); no vale para cualquier trapezoide común.',
    'p. 37, act. 56 (figura W): la figura no se lee con seguridad; se trabajó con la figura rosa (cruz) de la misma página.',
    'p. 40, act. 62 a: falta la medida de la base de la punta triangular; solo se pide el cuerpo rectangular (punta y total de 10 flechas pendientes).',
    'p. 43: la planificación indica "FALTA AGREGAR ACTIVIDADES" de trapecio; se incluyó solo la comprensión de la fórmula y una aplicación con datos de la p. 39.'
  ];

  global.CONTENIDOS = { misiones: M, contenidos: CONTENIDOS, insignias: INSIGNIAS, pendientes: PENDIENTES, ficha: FICHA, hat: hat };
})(typeof window !== 'undefined' ? window : globalThis);
