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
  APPS_SCRIPT_URL: 'https://script.google.com/macros/s/AKfycbxhqaWA29iWxUEH_vEVgxo7wI2AIhsofY9-LzgjyvisK2nU-h2TurE1JsDB9Mbn1skOgw/exec',
  // Clave compartida: debe ser IGUAL a la que figura en Code.gs
  CLAVE_ENVIO: 'guardianes-7mo',
  // Las respuestas se envían UNA sola vez, automáticamente, al completar las 8 misiones.

  /* --- Nota en escala de 1 a 10 (columna "Nota (1-10)" de la planilla) --- */
  // nota = % de logro × 10, con mínimo 1 
  NOTA: { minima: 1, maxima: 10, decimales: 2 },   // decimales: 0 = nota entera; 1 = con un decimal

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
