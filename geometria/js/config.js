/* =========================================================
   config.js — CONFIGURACIÓN DE LA DOCENTE
   Modificá estos valores para adaptar la evaluación a tu grupo.
   ========================================================= */
window.APP_CONFIG = {
  NOMBRE_AVENTURA: 'La Liga de los Guardianes de la Geometría',
  CURSO: '7.º grado',

  /* --- Registro de respuestas en Google Sheets (ver README, sección "Google Sheets") --- */
  // ID de la planilla: es la parte de la URL entre /d/ y /edit
  GOOGLE_SHEET_ID: '1R3tD3-egtKugMQnStLbYADTOsaXFp0Js2aZjOhgwRbo',
  // URL de la aplicación web de Apps Script (termina en /exec)
  APPS_SCRIPT_URL: 'https://script.google.com/macros/s/AKfycbw1xhNfIIb1lHiP0j3vjiJcCAL2bufeb1N_0TMfEkIzYwCtoDWKxs0A7Q_PuJM54dv71Q/exec',
  // Clave compartida: debe ser IGUAL a la que figura en Code.gs
  CLAVE_ENVIO: 'guardianes-7mo',
  // Enviar automáticamente las respuestas al terminar el desafío final
  ENVIO_AUTOMATICO_AL_FINAL: true,

  /* --- Modo evaluación --- */
  MEZCLAR_DESAFIOS: true,     // orden aleatorio de los desafíos dentro de cada misión
  MEZCLAR_OPCIONES: true,     // orden aleatorio de las opciones, elementos a clasificar y pasos
  MOSTRAR_PISTAS: false,      // true = muestra el botón "Pista" (no cambia el puntaje)
  // Cada desafío se responde UNA sola vez y no se muestra si la respuesta es correcta.

  /* --- Progresión: cada misión se habilita al COMPLETAR la anterior (no depende de los aciertos) --- */

  /* --- Puntos de experiencia: premian la participación, no los aciertos --- */
  XP: { porRespuesta: 10, misionCompleta: 20 },

  /* --- Niveles de desempeño del informe docente (porcentaje de logro por contenido) --- */
  NIVELES: { consolidado: 0.80, enProceso: 0.50 },
  MIN_ACTIVIDADES_COMENTARIO: 3,   // respuestas mínimas de un contenido para asignarle un nivel

  /* --- Clave docente: ver el informe con resultados, habilitar misiones, cambiar de estudiante --- */
  CLAVE_DOCENTE: '7mo-geo'
};
