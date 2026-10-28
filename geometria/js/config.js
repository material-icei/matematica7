/* =========================================================
   config.js — CONFIGURACIÓN DE LA DOCENTE
   Modificá estos valores para adaptar la aventura a tu grupo.
   ========================================================= */
window.APP_CONFIG = {
  NOMBRE_AVENTURA: 'La Liga de los Guardianes de la Geometría',
  CURSO: '7.º grado',

  /* --- Registro de informes en Google Sheets (ver README, sección "Google Sheets") --- */
  // ID de la planilla: es la parte de la URL entre /d/ y /edit
  // https://docs.google.com/spreadsheets/d/ESTE_ES_EL_ID/edit
  GOOGLE_SHEET_ID: '1R3tD3-egtKugMQnStLbYADTOsaXFp0Js2aZjOhgwRbo',
  // URL de la aplicación web de Apps Script (termina en /exec)
  APPS_SCRIPT_URL: 'https://script.google.com/macros/s/AKfycby1jlySY-26A0S8XYCR91scoxgRfTsHNjTJ5tYtOKHF-wv7l_1xBg1WcMTnaVbWjNt3pQ/exec',
  // Clave compartida: debe ser IGUAL a la que figura en Code.gs
  CLAVE_ENVIO: 'guardianes-7mo',

  /* --- Progresión --- */
  UMBRAL_DESBLOQUEO: 0.70,          // logro mínimo de una misión para desbloquear la siguiente (70 %)
  MAX_INTENTOS: 3,                  // intentos por desafío (el 2.º error muestra una pista, el 3.º la solución)

  /* --- Estrellas por misión (según el porcentaje de logro) --- */
  ESTRELLAS: { tres: 0.90, dos: 0.70, una: 0.40, maxPistasParaTres: 1 },

  /* --- Puntos de experiencia (XP) --- */
  XP: {
    primerIntento: 10,      // respuesta correcta en el primer intento
    conReintento: 5,        // correcta después de leer la retroalimentación
    recuperada: 6,          // correcta al primer intento en una misión de repaso
    descuentoPista: 2,      // se descuenta si se usó una pista en ese desafío
    minimoPorAcierto: 2,    // nunca menos que esto por un acierto
    rondaJuego: 3,          // por ronda del juego "Cazadores" resuelta al primer intento (la mitad con reintento)
    misionAprobada: 20,     // bonificación única al aprobar una misión
    tresEstrellas: 15       // bonificación única al lograr 3 estrellas
  },

  /* --- Niveles de desempeño del informe (porcentaje de logro por contenido) --- */
  NIVELES: { consolidado: 0.80, enProceso: 0.50 },
  MIN_ACTIVIDADES_COMENTARIO: 3,   // actividades mínimas de un contenido para generar comentarios

  /* --- Modo docente: permite desbloquear todas las misiones para revisarlas --- */
  CLAVE_DOCENTE: '7mo-geo'
};
