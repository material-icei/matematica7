/**
 * Guardianes de la Geometría — Registro de informes en Google Sheets
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
  informes: ['Recibido', 'Envío', 'Estudiante', 'Curso', 'Fecha (dispositivo)', 'Tiempo (min)', 'Misiones completadas', 'Misiones aprobadas',
    'Niveles desbloqueados', 'XP', 'Estrellas', 'Insignias', 'Actividades', 'Correctas', 'Incorrectas', 'Correctas 1.er intento', 'Intentos',
    '% correctas', 'Fortalezas', 'Aspectos para mejorar', 'Sin datos suficientes', 'Recomendaciones', 'Autoevaluaciones', 'Modo docente'],
  contenido: ['Recibido', 'Envío', 'Estudiante', 'Contenido', 'Actividades', 'Correctas', '% logro', 'Nivel', 'Recomendación'],
  mision: ['Recibido', 'Envío', 'Estudiante', 'Misión', 'Completa', 'Aprobada', '% logro', 'Estrellas', 'Correctas', 'Actividades', 'Pistas']
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
    const hInf = hoja(ss, 'Informes', HOJAS.informes), hCon = hoja(ss, 'Por contenido', HOJAS.contenido), hMis = hoja(ss, 'Por misión', HOJAS.mision);
    // evitar duplicados si el mismo envío llega dos veces
    const ult = hInf.getLastRow();
    if (ult > 1) {
      const ids = hInf.getRange(Math.max(2, ult - 200), 2, Math.min(200, ult - 1), 1).getValues().map(function (r) { return r[0]; });
      if (ids.indexOf(d.envioId) >= 0) return salida({ ok: true, duplicado: true });
    }
    const ahora = new Date(), alias = String(d.alias || '').slice(0, 40);
    hInf.appendRow([ahora, d.envioId, alias, d.curso, d.fecha, d.tiempoMin, d.misionesCompletadas, d.misionesAprobadas, d.nivelesDesbloqueados,
      d.xp, d.estrellas, d.insignias, d.actividades, d.correctas, d.incorrectas, d.primerIntento, d.intentos, d.pctCorrectas,
      d.fortalezas, d.mejoras, d.sinDatos, d.recomendaciones, d.autoevaluaciones, d.modoDocente ? 'Sí' : 'No']);
    const rc = (d.porContenido || []).map(function (c) { return [ahora, d.envioId, alias, c.contenido, c.actividades, c.correctas, c.logro, c.nivel, c.recomendacion]; });
    if (rc.length) hCon.getRange(hCon.getLastRow() + 1, 1, rc.length, rc[0].length).setValues(rc);
    const rm = (d.porMision || []).map(function (m) { return [ahora, d.envioId, alias, m.mision, m.completa ? 'Sí' : 'No', m.aprobada ? 'Sí' : 'No', m.logro, m.estrellas, m.correctas, m.actividades, m.pistas]; });
    if (rm.length) hMis.getRange(hMis.getLastRow() + 1, 1, rm.length, rm[0].length).setValues(rm);
    return salida({ ok: true });
  } catch (err) {
    return salida({ ok: false, error: String(err && err.message || err) });
  } finally {
    try { lock.releaseLock(); } catch (e2) { }
  }
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
  if (!h) {
    h = ss.insertSheet(nombre);
    h.getRange(1, 1, 1, encabezados.length).setValues([encabezados]).setFontWeight('bold').setBackground('#fff2cc');
    h.setFrozenRows(1);
  }
  return h;
}

function salida(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

/** Ejecutá esta función una vez desde el editor para autorizar el acceso a la planilla y probarla. */
function probar() {
  const id = SHEET_ID_FIJO || 'PEGAR_ID_PARA_PROBAR';
  const r = doPost({ postData: { contents: JSON.stringify({ clave: CLAVE, sheetId: id, envioId: 'prueba-' + Date.now(), alias: 'Prueba', curso: '7.º grado', porContenido: [], porMision: [] }) } });
  Logger.log(r.getContent());
}
