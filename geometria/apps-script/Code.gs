/**
 * Guardianes de la Geometría — Registro de respuestas de la evaluación en Google Sheets
 * (versión evaluación: crea las hojas Informes, Por contenido, Por misión y Respuestas)
 * -------------------------------------------------------------------
 * 1. Abrí script.google.com → Nuevo proyecto y pegá este código.
 * 2. Revisá CLAVE (debe coincidir con CLAVE_ENVIO de js/config.js).
 * 3. Implementar → Nueva implementación → Tipo: Aplicación web
 *      · Ejecutar como: Yo
 *      · Quién tiene acceso: Cualquier persona
 * 4. Copiá la URL que termina en /exec y pegala en APPS_SCRIPT_URL (js/config.js).
 *
 * La planilla se elige con GOOGLE_SHEET_ID de js/config.js. Si preferís fijarla
 * acá (más seguro: así nadie puede escribir en otra planilla tuya), completá
 * SHEET_ID_FIJO con el mismo ID.
 */
const CLAVE = 'guardianes-7mo';
const SHEET_ID_FIJO = '';   // opcional: 'ID_DE_TU_PLANILLA'

const HOJAS = {
  informes: ['Recibido', 'Envío', 'Estudiante', 'Curso', 'Fecha (dispositivo)', 'Tiempo (min)', 'Misiones completas', 'Respondidas', 'Total',
    'Correctas', 'No correctas', '% correctas', '% logro', 'Puntaje', 'Nota (1-10)', 'XP', 'Insignias', 'Modo docente'],
  contenido: ['Recibido', 'Envío', 'Estudiante', 'Contenido', 'Respondidas', 'Correctas', '% logro', 'Nivel'],
  mision: ['Recibido', 'Envío', 'Estudiante', 'Misión', 'Completa', 'Respondidas', 'Correctas', '% logro'],
  respuestas: ['Recibido', 'Envío', 'Estudiante', 'N.º', 'Misión', 'Contenido', 'Consigna', 'Respuesta del estudiante', 'Respuesta correcta', 'Resultado', 'Puntaje (0 a 1)']
};

function doPost(e) {
  const lock = LockService.getScriptLock();
  try {
    const d = JSON.parse(e.postData.contents);
    if (d.clave !== CLAVE) return salida({ ok: false, error: 'clave incorrecta' });
    const id = SHEET_ID_FIJO || d.sheetId;
    if (!id) return salida({ ok: false, error: 'falta el ID de la planilla' });
    lock.waitLock(20000);
    const ss = SpreadsheetApp.openById(id);
    const hInf = hoja(ss, 'Informes', HOJAS.informes), hCon = hoja(ss, 'Por contenido', HOJAS.contenido),
      hMis = hoja(ss, 'Por misión', HOJAS.mision), hRes = hoja(ss, 'Respuestas', HOJAS.respuestas);
    const ult = hInf.getLastRow();
    if (ult > 1) {
      const ids = hInf.getRange(Math.max(2, ult - 200), 2, Math.min(200, ult - 1), 1).getValues().map(function (r) { return r[0]; });
      if (ids.indexOf(d.envioId) >= 0) return salida({ ok: true, duplicado: true });
    }
    const ahora = new Date(), alias = String(d.alias || '').slice(0, 60);
    hInf.appendRow([ahora, d.envioId, alias, d.curso, d.fecha, d.tiempoMin, d.misionesCompletadas, d.respondidas, d.total,
      d.correctas, d.incorrectas, d.pctCorrectas, d.logro, d.puntos, d.nota, d.xp, d.insignias, d.modoDocente ? 'Sí' : 'No']);
    agregar(hCon, (d.porContenido || []).map(function (c) { return [ahora, d.envioId, alias, c.contenido, c.respondidas, c.correctas, c.logro, c.nivel]; }));
    agregar(hMis, (d.porMision || []).map(function (m) { return [ahora, d.envioId, alias, m.mision, m.completa ? 'Sí' : 'No', m.respondidas, m.correctas, m.logro]; }));
    agregar(hRes, (d.respuestas || []).map(function (r) { return [ahora, d.envioId, alias, "'" + r.num, r.mision, r.contenido, r.consigna, r.respuesta, r.correcta, r.resultado, r.puntaje]; }));
    return salida({ ok: true });
  } catch (err) {
    return salida({ ok: false, error: String(err && err.message || err) });
  } finally {
    try { lock.releaseLock(); } catch (e2) { }
  }
}

function agregar(h, filas) {
  if (filas.length) h.getRange(h.getLastRow() + 1, 1, filas.length, filas[0].length).setValues(filas);
}

/** Si agregaste el archivo HTML "app" (versión de un solo archivo), la aplicación se publica en esta misma URL. */
function doGet() {
  try {
    return HtmlService.createHtmlOutputFromFile('app')
      .setTitle('Guardianes de la Geometría')
      .addMetaTag('viewport', 'width=device-width, initial-scale=1')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
  } catch (e) {
    return ContentService.createTextOutput('El registro de informes está funcionando.');
  }
}

function hoja(ss, nombre, encabezados) {
  let h = ss.getSheetByName(nombre);
  if (!h) { h = ss.insertSheet(nombre); h.setFrozenRows(1); }
  // escribe (o actualiza) la fila de encabezados, por si la hoja venía de una versión anterior
  const actual = h.getRange(1, 1, 1, encabezados.length).getValues()[0];
  if (actual.join('|') !== encabezados.join('|')) h.getRange(1, 1, 1, encabezados.length).setValues([encabezados]).setFontWeight('bold').setBackground('#fff2cc');
  return h;
}

function salida(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

/** Ejecutá esta función una vez desde el editor para autorizar el acceso a la planilla y probarla. */
function probar() {
  const id = SHEET_ID_FIJO || 'PEGAR_ID_PARA_PROBAR';
  const r = doPost({ postData: { contents: JSON.stringify({ clave: CLAVE, sheetId: id, envioId: 'prueba-' + Date.now(), alias: 'Prueba', curso: '7.º grado', porContenido: [], porMision: [], respuestas: [] }) } });
  Logger.log(r.getContent());
}
