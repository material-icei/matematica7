# La Liga de los Guardianes de la Geometría — versión evaluación

Evaluación gamificada de geometría para **7.º grado**, construida a partir de la planificación de Geometría (pp. 5–43) y del listado de consignas corregido por la docente.
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
de `dist/guardianes_un_archivo.html`. La URL `/exec` del script abre la evaluación para todo el grupo.

> Sin internet la aplicación funciona igual (solo cambia la tipografía); el envío del informe necesita conexión.

## 2. Estructura de carpetas

```
guardianes/
├── index.html                 Estructura de la página
├── css/styles.css             Diseño, animaciones (respetan "reducir movimiento"), impresión
├── js/config.js               ⚙️ Configuración de la docente (planilla, umbrales, XP, clave)
├── js/content.js              📚 Misiones, desafíos y respuestas correctas (editable)
├── js/figures.js              Dibujo de figuras geométricas en SVG
├── js/engine.js               Tipos de desafío: dibujo y validación de respuestas
├── js/app.js                  Modo evaluación: mezcla, registro de respuestas, informe docente y envío
├── apps-script/Code.gs        Registro de respuestas en Google Sheets
├── dist/guardianes_un_archivo.html   Versión en un solo archivo
├── herramientas/armar_un_archivo.py  Genera la versión de un solo archivo
└── tests/                     Pruebas automáticas (contenidos, interfaz y recorrido completo)
```

## 3. Modo evaluación

Esta versión se usa como **herramienta de evaluación de conocimientos**:

- **Orden aleatorio:** los desafíos de cada misión aparecen en un orden distinto para cada estudiante (el orden se guarda, así que si sale y vuelve, sigue donde estaba). También se mezclan las opciones de respuesta, los elementos a clasificar, las opciones de los desplegables y los pasos a ordenar.
- **Una sola respuesta:** cada desafío se confirma una vez y no se puede cambiar ni repetir. Hay que completar todos los campos antes de confirmar (un campo vacío no se registra), y en los de ordenar hay que mover al menos un paso.
- **Sin corrección visible:** el estudiante no ve si acertó, ni pistas, ni soluciones. Tampoco hay estrellas, porque revelarían el resultado. Los XP y las insignias premian la **participación** (10 XP por respuesta, 20 XP por misión completa, una insignia por misión).
- **Avance:** cada misión se habilita al **completar** la anterior, sin importar los aciertos. El desafío final, al completar las siete.
- Las pistas se pueden volver a mostrar con `MOSTRAR_PISTAS: true` en `js/config.js` (no afectan el puntaje), y la mezcla se puede desactivar con `MEZCLAR_DESAFIOS` / `MEZCLAR_OPCIONES`.

## 4. Secuencia (7 misiones, 30 desafíos)

Corresponde al último listado corregido por la docente. El número de cada desafío (1.1, 1.2…) es el que figura en el informe y en la planilla.

| # | Misión | Desafíos |
|---|---|---|
| 1 | Ángulos | 5 · elementos del ángulo, nombre con tres letras, complementos, suplementos, parejas suplementarias |
| 2 | Encrucijada de rectas | 5 · adyacentes, opuestos por el vértice, α y β, opuesto a RŜQ, adyacentes a β |
| 3 | Bisectriz | 4 · torre de control, ángulos con la bisectriz, construcción, aôc / aôd / côd |
| 4 | Triángulos | 4 · clasificación por lados y por ángulos, isósceles, triángulo abc |
| 5 | Teorema de Pitágoras | 3 · cuerda de 12 nudos, catetos e hipotenusa, lados e) y f) |
| 6 | Familias de cuadriláteros | 5 · elementos del trapecio, características, pistas, ¿quién dice la verdad?, romboide |
| 7 | Área y perímetro | 4 · unidades, rectángulo sombreado (dm²), casa, rombo de diagonales 8 y 6 cm |

En la misión 6 el documento numera los desafíos 6.1, 6.2, 6.4, 6.5 y 6.8; en la app se numeran 6.1 a 6.5 en el mismo orden.

## 5. Resultados: informe docente y Google Sheets

**Informe docente:** en *¿Cómo funciona? → Área docente*, con la clave `CLAVE_DOCENTE`, la docente puede:
- ver el informe con resultados: resumen, por contenido, por misión y **cada respuesta del estudiante junto a la correcta**, con opción de imprimir o guardar en PDF;
- habilitar todas las misiones en ese equipo;
- borrar las respuestas de ese estudiante.

**Cálculos:**
- **% correctas** = desafíos totalmente correctos ÷ respondidos.
- **% de logro** = promedio del puntaje de cada desafío. Opción única y opción múltiple valen 1 o 0. Los de varias partes (cálculos con varios campos, clasificar, completar, ordenar) valen la fracción de partes correctas; en un cálculo, el número y la unidad deben estar bien.
- **Niveles por contenido:** consolidado ≥ 80 %, en proceso ≥ 50 %, requiere acompañamiento < 50 %; con menos de 3 respuestas, «Sin datos suficientes».

El estudiante solo ve su **progreso**: misiones completas, desafíos respondidos y XP, sin resultados.

**Nota (1 a 10):** nota = % de logro sobre los 30 desafíos × 10, con mínimo 1 y redondeada a entero (por ejemplo, 60 % → 6; 85 % → 9). Se calcula al completar todas las misiones. El mínimo y los decimales se cambian en `NOTA` de `js/config.js`. La planilla también registra el puntaje (sobre 30).

**Envío único:** las respuestas se envían **una sola vez**, automáticamente, al completar la última misión. No hay botón de envío en «Mi progreso» ni en el informe docente. Si el envío falla (por ejemplo, sin internet), en la pantalla final y en «Mi progreso» aparece «Reintentar envío», que desaparece cuando el envío queda registrado. Cada estudiante tiene un identificador de envío fijo, y la planilla descarta cualquier envío repetido con el mismo identificador.

**Configurar la planilla (una sola vez):**
1. Creá una planilla de Google y copiá su ID (la parte de la URL entre `/d/` y `/edit`).
2. En [script.google.com](https://script.google.com) creá un proyecto, pegá `apps-script/Code.gs` y ejecutá `probar` una vez para autorizar.
3. *Implementar → Nueva implementación → Aplicación web*: ejecutar como **Yo**, acceso **Cualquier persona**. Copiá la URL `/exec`.
4. En `js/config.js` completá `GOOGLE_SHEET_ID` y `APPS_SCRIPT_URL`.

Se crean cuatro hojas: **Informes** (una fila por estudiante, con las columnas **Puntaje** (sobre el total de desafíos) y **Nota (1-10)**), **Por contenido**, **Por misión** y **Respuestas** (una fila por desafío, con la respuesta dada, la correcta y el resultado). Si ya tenías publicada la versión anterior de `Code.gs`, reemplazala por esta y creá una nueva implementación.

**Cambio de estudiante en la misma computadora:** «Soy otro estudiante» borra las respuestas solo si ya fueron enviadas; si no, pide la clave docente.

## 6. Almacenamiento: alcances y límites

Las respuestas se guardan con `localStorage`: **solo en esa Chromebook, ese navegador y esa cuenta**. No se sincronizan con otros
equipos y se pierden si se borran los datos de navegación o se usa una ventana de incógnito; por eso conviene enviarlas al terminar.
Un estudiante que borra a propósito los datos del navegador podría empezar de nuevo: la planilla registra la fecha de cada envío,
lo que permite detectar envíos repetidos de un mismo nombre. El tiempo registrado es el de la pestaña visible en ese dispositivo.

## 7. Edición de contenidos

- Para cambiar consignas, opciones o respuestas, editá `js/content.js`. Cada desafío indica `num` (número del listado), `consigna`, `ops` / `campos` / `items` / `filas`, y la respuesta correcta (`ok: true`, `ans`, `cat` o el orden de `pasos`).
- No cambies el `id` de un desafío una vez que hay estudiantes evaluados.
- Después de editar, corré `node tests/validar_contenidos.js` y regenerá la versión de un solo archivo.

## 8. Accesibilidad

Todo se opera con teclado, panel táctil o mouse (Tab, Enter/Espacio y flechas). El foco es visible, los mensajes se anuncian a lectores
de pantalla, no hay sonido y las animaciones se desactivan con la preferencia del sistema o desde la ayuda. Los desafíos no requieren
desplazamiento a 1366 × 768 (solo el informe docente y la ayuda pueden desplazarse dentro de su panel).

## 9. Notas sobre las correcciones aplicadas

Estas notas también figuran en el Área docente.

**Tercera corrección:**
- Se quitaron 5.4 (escalera), la clasificación de cuadriláteros, los ángulos azul y rosa, el rombo abcd, Tomi, escudo y cantero, el trapecio y los desafíos 8.1 a 8.3. El rombo de diagonales 8 y 6 cm pasa a ser el **7.4**. Quedan **7 misiones y 30 desafíos**, y el puntaje máximo es 30.
- **5.2, 6.2, 6.3, 6.4 y 7.1:** quedan solo las filas que figuran en el documento.
- **5.3:** el error previsto «Sumaste 3,6 + 4,8» no trae valor; se registra 8,4.
- **6.2:** el trapecio isósceles también tiene «dos pares de ángulos iguales» y el trapecio rectángulo también tiene «un par de lados paralelos». Con la clave del documento, esas respuestas cuentan como incorrectas.
- **6.3, pista 3:** ahora se aceptan «Rectángulo» y «Cuadrado», como indica el documento. Antes, por un error de la app, solo se aceptaba «Rectángulo».
- **6.4:** la fila de Maite trae un espacio «porque ___» sin opciones; no se incluyó.
- Como cambiaron los desafíos, el progreso guardado con versiones anteriores en cada computadora se reinicia.

**Segunda corrección (imágenes y valores del documento):**
- **5.3, 7.2 y 7.3:** se usan las **imágenes originales** del documento (carpeta `img/`) con sus valores: 6 cm y 10 cm; 34 dm²; 68 cm².
- **5.3, solución explicada:** dice «12,96 + 23,04 = 32,5 → √36», pero la suma da 36. Se dejó como está, porque no la ven los estudiantes.
- **5.3, errores previstos:** el error «8» corresponde a sumar 3,6 + 4,8, que en realidad da 8,4; se dejó el valor del documento. Para el error «se resta 12,5² − 7,5²» el documento no trae valor y se registra 14,58.
- **7.3, errores previstos:** no traen valor; se registran 78 cm² y 110 cm².
- **7.5:** se respetaron los valores y nombres del documento (error previsto «20», campo «Superficie del cantero»).
- Se quitó el desafío del rectángulo MKLN: la evaluación tiene **30 desafíos**.
- Como cambiaron los desafíos, el progreso guardado con la versión anterior en cada computadora se reinicia.

**Primera corrección:**
- **Títulos:** las misiones 1, 3 y 5 no tenían título; se usaron «Ángulos», «Bisectriz» y «Teorema de Pitágoras».
- **1.5 y 3.2:** se reescribieron para que se entiendan solos con el orden aleatorio.
- **6.3:** se agregó «Usá cada opción una sola vez».
- **6.7:** se quitaron los espacios «porque ___», que no tenían opciones.

## 10. Pruebas realizadas

- `node tests/validar_contenidos.js`: las respuestas correctas de los 30 desafíos se aceptan, los errores previstos y las unidades incorrectas se rechazan, y los resultados se recalculan por separado.
- `python3 tests/ui_check.py 1366 650`: recorre todas las pantallas al tamaño visible de una Chromebook buscando errores y desbordes.
- `python3 tests/envio_unico.py`: simula la planilla y verifica que el resultado se registre una sola vez (también si el primer envío falla y se reintenta) y que la nota sea correcta.
- `python3 tests/recorrido.py`: completa todas las misiones usando solo la interfaz, con errores a propósito. Verifica:
  - el orden aleatorio;
  - que cada respuesta se registre una sola vez;
  - que no se muestre ninguna corrección;
  - los desbloqueos;
  - el informe docente y los datos que se envían;
  - la persistencia;
  - la protección del cambio de estudiante.
