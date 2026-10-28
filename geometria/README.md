# La Liga de los Guardianes de la Geometría

Aventura matemática gamificada para **7.º grado**, construida a partir de la planificación de Geometría (pp. 5–43).
Funciona en **Chrome de una Chromebook**, en horizontal (16:9, referencia 1366 × 768), sin instalar nada y sin cuentas de usuario.

---

## 1. Cómo ejecutarla

**Opción A — Abrir el archivo (la más simple)**
1. Copiá la carpeta `guardianes` completa en la Chromebook (o en Google Drive → descargar).
2. Abrí `index.html` con Chrome (en "Archivos", doble clic o "Abrir con → Chrome").

**Opción B — Un solo archivo**
Usá `dist/guardianes_un_archivo.html`: contiene todo (estilos y código). Si cambiás `js/config.js` o `js/content.js`,
regeneralo con `python3 herramientas/armar_un_archivo.py`.

**Opción C — Publicarla con un enlace (Google Apps Script)**
En el mismo proyecto de Apps Script del registro (sección 5), agregá un archivo HTML llamado **`app`** y pegá el contenido
de `dist/guardianes_un_archivo.html`. La URL `/exec` del script abre la aventura para todo el grupo.

> Sin internet la aplicación funciona igual (solo cambia la tipografía); el envío del informe necesita conexión.

## 2. Estructura de carpetas

```
guardianes/
├── index.html                 Estructura de la página
├── css/styles.css             Diseño, animaciones (respetan "reducir movimiento"), impresión
├── js/config.js               ⚙️ Configuración de la docente (planilla, umbrales, XP, clave)
├── js/content.js              📚 Misiones, desafíos, pistas y mensajes (editable)
├── js/figures.js              Dibujo de figuras geométricas en SVG
├── js/engine.js               Tipos de desafío: dibujo y validación de respuestas
├── js/app.js                  Estado, mapa, recompensas, desbloqueos, informe y envío
├── apps-script/Code.gs        Registro de informes en Google Sheets
├── dist/guardianes_un_archivo.html   Versión en un solo archivo
├── herramientas/armar_un_archivo.py  Genera la versión de un solo archivo
└── tests/                     Pruebas automáticas (contenidos, interfaz y recorrido completo)
```

## 3. Secuencia de misiones (15 niveles)

Cada misión tiene: objetivo, recordatorio conceptual con ejemplo y figura, desafíos con retroalimentación, y la referencia
de página/actividad de la planificación en cada consigna ("p. 12 · act. 21").

| # | Misión | Contenido | Planificación | Desafíos y formatos |
|---|---|---|---|---|
| 1 | **El código de Babilonia** | Ángulo, sistema sexagesimal, complementarios y suplementarios | pp. 5–8 (act. 7, 8, 10, 11) | Elegir, cálculo numérico (tablas de complementos y suplementos), marcar parejas en los ángulos A–H |
| 2 | **Encrucijada de rectas** | Consecutivos, adyacentes, opuestos por el vértice | pp. 8–9 (act. 12–16) | Identificar, calcular adyacente y opuesto, α y β en las rectas NQ–UR–PT, verdadero/falso |
| 3 | **La torre de control** | Bisectriz | pp. 10–12 (act. 17–21) | Problema de las vías de tren, ordenar la construcción con compás, cálculos (aôc, aôd, côd; 3x + 30°), analizar el argumento de Damián |
| 4 | **Laboratorio de triángulos** | Clasificación y propiedades | pp. 13–15 | Clasificar por lados y por ángulos, calcular ángulos interiores (con exteriores y opuestos por el vértice) |
| 5 | **Taller del compás** | Construcción de triángulos | pp. 14, 16–18 | Ordenar pasos, ternas posibles, **compás virtual** (desigualdad triangular, isósceles), act. 7, autoevaluación de construcciones |
| 6 | **La cuerda de 12 nudos** | Teorema de Pitágoras | pp. 18–21 | Tensadores de cuerda, áreas 9 + 16 = 25, catetos e hipotenusa (ABC, DEF, GHI), lados que faltan a)–f) |
| 7 | **Ingenieros de la antigüedad** | Pitágoras en problemas | pp. 21–23 | Rampa, escalera, 17/15, árbol y sombra, terreno; identificar un error |
| 8 | **El punto justo** | Mediatriz | pp. 24–26 | Puntos equidistantes, definición, construcción, **ubicar el punto d** equidistante de a, b y c, completar segmentos |
| 9 | **Familias de cuadriláteros** | Elementos y clasificación | pp. 27–30, 32 (act. 39–44, 47) | Cuadriláteros con los mismos lados, altura, elementos, clasificar por lados paralelos, mapa conceptual, pistas |
| 10 | **Secretos de las diagonales** | Diagonales y ángulos | pp. 31–34 (act. 45–51) | Unir diagonales, suma 360°, ángulos desconocidos, trapecio isósceles, rombo, ¿es posible construir?, ¿quién dice la verdad?, autoevaluación |
| 11 | **Cazadores de figuras** | Perímetro vs. área | pp. 35–36 (act. 52–53) | **Juego del dado** (10 tiradas, opción A contorno / B cuadraditos) y reflexión |
| 12 | **Laboratorio de contornos** | Perímetro y área, unidades | pp. 37–38 (act. 55–58) | Unidades, estrategia de Nicolás, **dibujar en la cuadrícula** (igual área y menor perímetro; mayor área y mayor perímetro), cuadrado y triángulo |
| 13 | **Arquitectos de áreas** | Fórmulas y figuras compuestas | pp. 38–40 (act. 59–62) | Deducción del paralelogramo (animación), áreas en cuadrícula, flecha, figuras 1, 2 y 9, identificar un error |
| 14 | **Rombos y trapecios** | Área del rombo y del trapecio | pp. 39, 41–43 (act. 63–65) | Deducción del área del rombo en MKLN, escudo, cantero, barrilete, fórmula del trapecio |
| 15 | **Desafío de los Guardianes** | Integración | pp. 7–43 | Problemas que combinan Pitágoras, perímetro, área, ángulos y propiedades |

## 4. Reglas de juego, recompensas y cálculo de resultados

Todos los valores se pueden cambiar en `js/config.js`.

**Intentos y retroalimentación.** Cada desafío tiene 3 intentos: tras el 1.er error se explica qué revisar (mensajes
específicos para los errores frecuentes, por ejemplo confundir complemento y suplemento, olvidar dividir por 2 o
usar unidades lineales para un área); tras el 2.º aparece una pista; tras el 3.º se muestra la solución con el procedimiento.
Un campo vacío no cuenta como intento. El botón "Pista" puede usarse en cualquier momento.

**Resultado de cada desafío** (se guarda el mejor resultado obtenido):

| Resultado | Puntaje de logro | XP |
|---|---|---|
| Correcto al primer intento | 1 | 10 |
| Correcto después de corregir | 0,5 | 5 |
| Recuperado (primer intento en un repaso) | 0,75 | 6 |
| Incorrecto (se mostró la solución) | 0 | 0 |

Usar pista descuenta 2 XP (mínimo 2 por acierto). Cada ronda del juego del dado vale 1 actividad y 3 XP
(1,5 si se resolvió en el segundo intento). Repetir una misión **no suma XP otra vez**: solo se suma la mejora.
Bonificaciones únicas: +20 XP al aprobar una misión y +15 XP al lograr 3 estrellas.

**Logro de una misión** = suma de puntajes ÷ cantidad de actividades.

**Estrellas:** ★★★ logro ≥ 90 % y como máximo 1 pista · ★★ ≥ 70 % · ★ ≥ 40 % · sin estrellas por debajo.

**Desbloqueo:** la misión 1 empieza disponible; cada misión se desbloquea al **aprobar** la anterior (todos sus desafíos
respondidos y logro ≥ 70 %). El desafío final exige las 14 misiones aprobadas. El desbloqueo depende del logro, nunca de los XP.
"Repasar errores" vuelve a presentar solo los desafíos no resueltos al primer intento.

**Insignias (12):** una por bloque de contenidos aprobados (ángulos, bisectriz, triángulos, Pitágoras, mediatriz,
cuadriláteros, perímetro, áreas, desafío final) y tres de actitud: *Mente perseverante* (5 respuestas corregidas tras la
retroalimentación), *Estratega autónomo* (3 estrellas sin pistas) y *Constelación* (30 estrellas).

**Autoevaluaciones** (construcciones con instrumentos en la carpeta): se registran en el informe, **no se califican**.

## 5. Informe final y Google Sheets

El informe se calcula solo con los datos registrados en el dispositivo:

- **% de respuestas correctas** = actividades correctas (en cualquier intento) ÷ actividades respondidas. Los XP no intervienen.
- **Desempeño por contenido:** actividades realizadas, correctas, % de logro (fórmula de la sección 4) y nivel:
  *Logro consolidado* (≥ 80 %), *En proceso de consolidación* (≥ 50 %), *Requiere acompañamiento* (< 50 %).
  Con menos de 3 actividades aparece **"Sin datos suficientes"** y no se generan comentarios. Son evidencias parciales, no diagnósticos.
- Fortalezas, aspectos para mejorar y recomendaciones de práctica (con las actividades concretas de la carpeta).
- Botones: **Enviar informe**, **Imprimir / PDF**, **Repetir actividades de recuperación** y **Volver al mapa**.

**Configurar la planilla (una sola vez):**
1. Creá una planilla de Google y copiá su ID (la parte de la URL entre `/d/` y `/edit`).
2. En [script.google.com](https://script.google.com) creá un proyecto, pegá `apps-script/Code.gs` y ejecutá `probar` una vez para autorizar.
3. *Implementar → Nueva implementación → Aplicación web*: ejecutar como **Yo**, acceso **Cualquier persona**. Copiá la URL `/exec`.
4. En `js/config.js` completá `GOOGLE_SHEET_ID` y `APPS_SCRIPT_URL`. `CLAVE_ENVIO` debe coincidir con `CLAVE` de `Code.gs`.
5. Se crean automáticamente tres hojas: **Informes** (una fila por envío), **Por contenido** y **Por misión**. Los envíos repetidos se descartan.

## 6. Almacenamiento: alcances y límites

El progreso se guarda con `localStorage`: **solo en esa Chromebook, ese navegador y esa cuenta**. No se sincroniza con otros
equipos; se pierde si se borran los datos de navegación o se usa una ventana de incógnito. Si varios estudiantes comparten
una Chromebook, cada uno debe enviar su informe antes de "Soy otro estudiante" (que borra el progreso anterior).
El tiempo registrado es el de la pestaña visible en ese dispositivo.

## 7. Modo docente y edición de contenidos

- En **¿Cómo se juega? → Área docente**, la clave `CLAVE_DOCENTE` desbloquea todas las misiones para revisarlas (queda indicado en el informe).
- Para cambiar consignas, respuestas, pistas o mensajes, editá `js/content.js` (cada desafío indica su `fuente`, `consigna`, `campos`/`ops`, `pista` y `explica`). Para errores frecuentes, agregá entradas en `mal: [{ v: valor, fb: 'mensaje' }]`.
- Después de editar, corré `node tests/validar_contenidos.js` para comprobar que todas las respuestas correctas se aceptan.

## 8. Accesibilidad

Todo se opera con teclado, panel táctil o mouse (Tab, Enter/Espacio y flechas; el arrastre del punto *d* tiene alternativa con flechas).
Los resultados se indican con ícono y texto (no solo color), el foco es visible, los mensajes se anuncian a lectores de pantalla,
no hay sonido y las animaciones se desactivan con la preferencia del sistema o desde la ayuda. Las pantallas están diseñadas
para no requerir desplazamiento a 1366 × 768 (solo el informe y la ayuda pueden desplazarse dentro de su panel).

## 9. Pendientes de revisión docente

Actividades de la planificación adaptadas o no incluidas (también figuran en el Área docente):

- **p. 5:** actividades de fracciones (b y c): pertenecen a una unidad anterior; no se incluyeron.
- **p. 9, act. 14 y 15:** la figura de ángulos de colores no se interpreta con seguridad; se adaptaron a la figura de la act. 16.
- **p. 12, act. 19:** se interpretó que el arco de 62° marca côb (aôc = 118°).
- **p. 22 a:** el texto indica base 2,5 m y el dibujo 4 m → se usó el texto (altura 6 m).
- **p. 22 b:** la escalera figura en cm (2,50 cm; 0,7 cm) y el dibujo dice 3 m → se usaron metros (2,4 m).
- **p. 23 d y e:** los dibujos (4 m/2,5 m y 50 m/20 m) no coinciden con el texto → se usó el texto.
- **p. 24:** demostración grupal del Teorema de Pitágoras y página web: actividad de aula, fuera de la app.
- **p. 25:** "¿Qué representa el segmento que queda dentro de la circunferencia?" — consigna ambigua, no incluida.
- **p. 26:** los segmentos a y b no tienen medidas; se agregaron 3 cm y 2 cm.
- **p. 31, act. 45:** "diagonales perpendiculares; el corte no es punto medio de ninguna" se asignó al trapezoide común por eliminación (como el dibujado): no vale para cualquier trapezoide común.
- **p. 37, act. 56 (figura W):** no se lee con seguridad; se trabajó con la figura rosa (cruz) de la misma página.
- **p. 40, act. 62 a:** falta la base de la punta triangular de la flecha: solo se pide el cuerpo rectangular (la punta y el total de 10 flechas quedan pendientes).
- **p. 43:** "FALTA AGREGAR ACTIVIDADES" de trapecio: se incluyó la comprensión de la fórmula y una aplicación con datos de la p. 39.

Las consignas marcadas como "Práctica de la app" (identificar errores) usan datos de la planificación pero no figuran textualmente en ella.

## 10. Pruebas realizadas

- `node tests/validar_contenidos.js` — 1185 comprobaciones: todas las respuestas correctas aceptadas (también con coma decimal), errores típicos con su retroalimentación, unidades incorrectas rechazadas, figuras sin errores y **todos los resultados recalculados de forma independiente**.
- `python3 tests/ui_check.py 1366 650` — recorre las 123 pantallas en el área visible real de una Chromebook (1366 × 650) buscando errores y desbordes.
- `python3 tests/recorrido.py` — juega las 15 misiones solo con la interfaz (incluido el juego del dado, la cuadrícula, el compás y el punto), con errores a propósito, y verifica desbloqueos, repaso, XP, estrellas, insignias, informe y persistencia al recargar.
