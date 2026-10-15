# QA - Verificación responsive del Sprint 5: Resultados, Estadísticas, Ranking y Logros

Este documento valida el comportamiento responsive de las pantallas del Sprint 5 de LearnFex: Resultados (`Results.jsx`), Estadísticas (`Statistics.jsx`), Ranking (`Ranking.jsx`) y Logros (`Achievements.jsx`).

- Estado del documento: plantilla de ejecución. Ningún caso fue ejecutado todavía; todas las casillas de resultado están vacías a propósito.
- Verificado contra el código de `main` en el commit `f17a14c`. Si `main` cambió desde entonces, revisar los casos antes de ejecutarlos.
- Autoría original del borrador: Juliana Martínez (PR #64). Corregido contra el código real: el borrador cubría Retroalimentación, Estadísticas y Ranking, y no cubría Resultados ni Logros.
- Requisito que cubre (ERS): diseño adaptable a distintos tamaños de pantalla (RNF-010). El contenido funcional de estas pantallas (ranking, estadísticas) se verifica en `docs/qa/integracion-end-to-end.md`.

---

## Precondición de código

- El PR #23 (reconexión del backend a Firestore real) ya está mergeado en `main` (estado MERGED al verificar este documento). Las estadísticas, el ranking y los logros leen datos reales de Firestore.

## Cómo está armada cada pantalla (resumen verificado en el código)

- **Estadísticas (`/estadisticas`), Ranking (`/ranking`) y Logros (`/logros`)** están dentro de `StudentLayout`: tienen la barra superior y la inferior. Menos de 768 px: la barra superior muestra solo la marca y la barra inferior fija (70 px) tiene 5 elementos (Inicio, Práctica, Estadísticas, Ranking, Perfil). Desde 768 px: la barra superior muestra los 5 enlaces y no hay barra inferior. Logros no figura en esa navegación: se llega desde Perfil, botón "Logros".
- **Resultados (`/resultados/:id`)** está fuera de `StudentLayout` (`src/routes/AppRoutes.jsx`, flujo de resolución de pruebas): no tiene barra superior ni inferior en ningún ancho.
- Cortes de CSS de cada pantalla:
  - Resultados: 768 px (la tarjeta principal pasa a columna, las 3 tarjetas de datos a 1 columna y los botones a columna de ancho completo) y 480 px (círculo de puntaje más chico).
  - Estadísticas: 950 px (las tarjetas pasan a 2 columnas) y 650 px (1 columna, encabezado en columna y botones de ancho completo).
  - Ranking: 850 px (el podio pasa a 1 columna, se oculta la fila de títulos de la tabla y se reduce la grilla de la fila) y 550 px (avatar y textos más chicos).
  - Logros: no tiene cortes propios; es una lista vertical centrada de ancho máximo 500 px.
- Las barras de progreso de Estadísticas no son CSS propio de la pantalla: usan el componente compartido `ProgressBar` (`src/components/ProgressBar/ProgressBar.jsx`): nombre del área a la izquierda, porcentaje a la derecha y una pista de 10 px de alto con relleno proporcional. El color del relleno depende del valor (80% o más "success", 60% o más "primary", menos de 60% "danger").

## Anchos a probar

| Dispositivo | Ancho | Qué se verifica |
| ----------- | ----- | --------------- |
| Mobile | 375 px | Vista principal móvil |
| Mobile pequeño | 320 px | Que no haya desbordes horizontales (opcional) |
| Tablet | 768 px | Primer ancho con barra superior con enlaces |
| Desktop | 1280 px | Vista de escritorio |
| Anchos de corte | 767, 650, 651, 550, 480, 850 y 951 px | Cambios de layout, según el caso |

## Precondiciones generales

- Aplicación corriendo con `npm run dev`, con datos del seed cargados y la función `calificarPrueba` desplegada.
- Sesión iniciada como estudiante, con varios resultados guardados en distintas áreas (al menos 3 pruebas con puntajes distintos, para ver barras de colores diferentes). Ver `docs/qa/casos-prueba-simulacros.md` para completar pruebas.
- Para Ranking: idealmente 4 o más estudiantes con pruebas completadas (podio completo) y, para el caso de la posición propia, más de 20.
- Navegador con DevTools: "Toggle Device Toolbar" en "Responsive", escribiendo el ancho exacto; repetir con el redimensionado manual. Anotar siempre el ancho exacto donde algo falla.

## Datos de la ejecución

| Campo | Valor |
| ----- | ----- |
| Fecha | |
| Tester | |
| Entorno (navegador y versión, sistema, dispositivo real o emulado) | |
| Commit o rama probada | |
| Proyecto de Firebase | |

## Cómo registrar el resultado

- En cada caso hay una línea de resultado por ancho: marcar `[x]` Pasa o Falla. Un ancho que no se probó se deja sin marcar y se explica en Observaciones.
- Si algo falla, anotar el ancho exacto, la descripción y adjuntar captura.
- Un caso con "Comportamiento actual conocido" que falla exactamente como allí se describe se registra como Falla con la observación "falla conocida". Solo se abre un defecto nuevo si falla de otra manera.

---

## Caso 1: Navegación según la pantalla y el ancho

**Pantallas:** `/estadisticas`, `/ranking`, `/logros` y `/resultados/{id}`.

**Pasos:**

1. Abrir cada pantalla en 375, 767, 768 y 1280 px y observar las barras de navegación.
2. En 375 px, desplazarse hasta el final de cada pantalla.

**Resultado esperado:**

- Estadísticas, Ranking y Logros: hasta 767 px, barra superior con la marca y barra inferior fija; desde 768 px, barra superior con enlaces y sin barra inferior. En Estadísticas y Ranking el elemento correspondiente figura como activo. En Logros ninguno figura como activo (no está en la navegación).
- Resultados: sin barra superior ni inferior en todos los anchos (es lo diseñado).
- En 375 px, el contenido final de las pantallas con barra inferior no queda tapado por ella.

**Resultado:**

- 375 px: [ ] Pasa  [ ] Falla
- 767 px: [ ] Pasa  [ ] Falla
- 768 px: [ ] Pasa  [ ] Falla
- 1280 px: [ ] Pasa  [ ] Falla
- Fecha / Tester / Entorno:
- Evidencia (captura, log o enlace):
- Observaciones:

---

## Caso 2: Resultados - tarjeta principal y puntaje

**Pantalla:** `/resultados/{cuestionarioId}_{uid}`, tras completar una prueba o abriendo un resultado propio.

**Pasos:**

1. Abrir el resultado en 1280, 769, 768, 480 y 375 px.
2. Observar el círculo del puntaje, el estado (Aprobado o No aprobado) y la fecha.

**Resultado esperado:**

- En 769 px o más, el círculo del puntaje y la información van en fila; hasta 768 px, en columna y centrados.
- El círculo se mantiene redondo (160 px; 135 px desde 480 px hacia abajo) y el texto "{puntaje}%" y "Puntaje" quedan dentro, sin cortarse.
- El estado y la fecha son legibles y no se salen de la tarjeta.
- No hay desplazamiento horizontal de la página.

**Resultado:**

- 375 px: [ ] Pasa  [ ] Falla
- 768 px: [ ] Pasa  [ ] Falla
- 1280 px: [ ] Pasa  [ ] Falla
- Fecha / Tester / Entorno:
- Evidencia (captura, log o enlace):
- Observaciones:

---

## Caso 3: Resultados - tarjetas de datos y botones

**Pantalla:** `/resultados/{id}`.

**Pasos:**

1. Observar las tarjetas "Preguntas", "Correctas" e "Incorrectas" y los botones "Volver al inicio", "Ver retroalimentación" y "Nuevo cuestionario" en 1280, 769, 768 y 375 px.
2. Tocar cada botón en 375 px y verificar que quedan accesibles.

**Resultado esperado:**

- En 769 px o más, las 3 tarjetas van en una fila de 3 columnas y los 3 botones en una fila alineada a la derecha, sin cortarse ni apilarse de forma irregular.
- Hasta 768 px, las tarjetas van una debajo de otra y los botones ocupan todo el ancho, uno debajo del otro.
- Los números y etiquetas se leen completos. Los botones navegan a `/inicio`, a la retroalimentación y a `/practica`.

**Resultado:**

- 375 px: [ ] Pasa  [ ] Falla
- 768 px: [ ] Pasa  [ ] Falla
- 1280 px: [ ] Pasa  [ ] Falla
- Fecha / Tester / Entorno:
- Evidencia (captura, log o enlace):
- Observaciones:

---

## Caso 4: Resultados - estados de carga y de error

**Pantalla:** `/resultados/{id}`.

**Pasos:**

1. Como estudiante, abrir `/resultados/inexistente` (un ID que no existe) en 375 y 1280 px.
2. Como estudiante, abrir el resultado de otra cuenta (ver `docs/qa/verificacion-rbac.md`, caso 13) en 375 y 1280 px.
3. Como administrador, abrir `/resultados/inexistente` en 375 y 1280 px.

**Resultado esperado:**

- Pasos 1 y 2: se ve el estado de error ("Ocurrió un error" y el mensaje "No se pudo cargar el resultado.") con el botón "Intentar nuevamente", centrado y legible. Según las reglas actuales, un estudiante no puede leer un documento inexistente (no se puede comprobar su `usuarioId`), así que el paso 1 también termina en el estado de error. Si en cambio se ve el estado vacío, anotarlo en Observaciones.
- Paso 3: el administrador sí puede leer documentos inexistentes, por lo que se ve el estado vacío ("Aún no tienes resultados") con el botón "Realizar cuestionario", centrado y sin cortes.

**Resultado:**

- 375 px: [ ] Pasa  [ ] Falla
- 1280 px: [ ] Pasa  [ ] Falla
- Fecha / Tester / Entorno:
- Evidencia (captura, log o enlace):
- Observaciones:

---

## Caso 5: Estadísticas - encabezado y tarjetas generales

**Pantalla:** `/estadisticas`.

**Pasos:**

1. Observar el encabezado ("MI PROGRESO", "Estadísticas", botón "Practicar") y las tarjetas "Promedio general" y "Pruebas" en 1280, 951, 950, 651, 650 y 375 px.

**Resultado esperado:**

- Hasta 650 px, el encabezado pasa a columna y el botón "Practicar" ocupa todo el ancho; las tarjetas van una por fila.
- Entre 651 y 950 px, las tarjetas van en 2 columnas.
- Los valores ("{promedio}%" y el número de pruebas) se leen completos y no se cortan. En ningún ancho hay desplazamiento horizontal.

**Resultado:**

- 375 px: [ ] Pasa  [ ] Falla
- 768 px: [ ] Pasa  [ ] Falla
- 1280 px: [ ] Pasa  [ ] Falla
- Fecha / Tester / Entorno:
- Evidencia (captura, log o enlace):
- Observaciones:

---

## Caso 6: Estadísticas - barras de progreso por área (componente `ProgressBar`)

**Pantalla:** `/estadisticas`, sección "Progreso por área".

**Pasos:**

1. Observar las barras de las 5 áreas en 375, 768 y 1280 px. Tener áreas con porcentajes en los tres rangos (80% o más, de 60% a 79%, menos de 60%) y alguna en 0%.
2. Comparar el porcentaje escrito con el largo del relleno.

**Resultado esperado:**

- Cada barra muestra el nombre del área a la izquierda y el porcentaje a la derecha; ambos se leen completos aunque el nombre del área sea largo (por ejemplo "Ciencias Sociales y Ciudadanas").
- La pista ocupa todo el ancho disponible, no se deforma en 375 px y el relleno es proporcional al porcentaje. Una barra en 0% muestra solo la pista vacía; en 100% la llena.
- El color del relleno es distinto según el rango (80% o más, 60% o más, menos de 60%) y se distingue del fondo con contraste suficiente.

**Resultado:**

- 375 px: [ ] Pasa  [ ] Falla
- 768 px: [ ] Pasa  [ ] Falla
- 1280 px: [ ] Pasa  [ ] Falla
- Fecha / Tester / Entorno:
- Evidencia (captura, log o enlace):
- Observaciones:

---

## Caso 7: Estadísticas - temas recomendados y consejo

**Pantalla:** `/estadisticas`, secciones "Temas recomendados" y "Sigue practicando".

**Pasos:**

1. Observar las tarjetas de temas recomendados (áreas con menos de 60%) y el bloque final con el botón "Empezar" en 1280, 768, 651, 650 y 375 px.

**Resultado esperado:**

- Cada tema recomendado muestra nombre, la leyenda "Refuerza esta área" y la etiqueta "Recomendado" sin cortarse; hasta 650 px la etiqueta se ajusta alineada a la derecha.
- Hasta 650 px, el bloque final pasa a columna y el botón "Empezar" ocupa todo el ancho.

**Resultado:**

- 375 px: [ ] Pasa  [ ] Falla
- 768 px: [ ] Pasa  [ ] Falla
- 1280 px: [ ] Pasa  [ ] Falla
- Fecha / Tester / Entorno:
- Evidencia (captura, log o enlace):
- Observaciones:

---

## Caso 8: Ranking - podio y tabla de clasificación

**Pantalla:** `/ranking`.

**Pasos:**

1. Observar el podio y la tabla en 1280, 851, 850, 551, 550 y 375 px.
2. En cada ancho, ubicar en la tabla: la posición, el avatar con iniciales, el nombre, el nivel y los puntos de cada fila.

**Resultado esperado:**

- Desde 851 px el podio muestra los 3 primeros lado a lado y la tabla tiene su fila de títulos (Pos., Estudiante, Nivel, Puntos) con las 4 columnas alineadas.
- Hasta 850 px el podio pasa a una columna y la fila de títulos se oculta.
- En todos los anchos cada fila del ranking muestra la posición, el estudiante y sus puntos ("{n} pts"), sin cortes ni superposiciones. A 550 px o menos el avatar y los textos son más chicos pero legibles.

**Comportamiento actual conocido (posible defecto, por lectura del CSS):** hasta 850 px el CSS oculta el tercer y el cuarto elemento de cada fila (`.ranking-row > div:nth-child(3)` y `:nth-child(4)`), que corresponden al nivel y a los puntos (`Ranking.jsx` renderiza 4 elementos por fila). Por eso en pantallas de hasta 850 px puede no verse el puntaje de cada fila, y la grilla de la fila (3 columnas) queda con una columna vacía. Si al ejecutar no se ven los puntos, registrar la falla con el ancho exacto: es un hallazgo real. Además la grilla de escritorio declara 5 columnas para 4 elementos.

**Resultado:**

- 375 px: [ ] Pasa  [ ] Falla
- 768 px: [ ] Pasa  [ ] Falla
- 850 / 851 px: [ ] Pasa  [ ] Falla
- 1280 px: [ ] Pasa  [ ] Falla
- Fecha / Tester / Entorno:
- Evidencia (captura, log o enlace):
- Observaciones:

---

## Caso 9: Ranking - fila resaltada, insignia "Tú" y nombres largos

**Pantalla:** `/ranking`.

**Precondiciones:** el estudiante de prueba figura entre los primeros 20 del ranking. Para probar un nombre largo: en `/perfil` poner un nombre de 35 o más caracteres sin espacios o con palabras largas (por ejemplo "Maximiliano Alejandrocristobal"), guardar y completar una prueba nueva (el ranking copia el nombre al calificar). Restaurar el nombre al terminar.

**Pasos:**

1. Abrir `/ranking` en 1280, 768 y 375 px y ubicar la fila del estudiante.
2. Observar el fondo de la fila, el avatar, el nombre y la insignia "Tú".
3. Si el estudiante está entre los 3 primeros, observar también su tarjeta del podio.

**Resultado esperado:**

- La fila del estudiante tiene fondo resaltado y avatar en color de acento.
- La insignia "Tú" aparece junto al nombre, legible y sin superponerse con el texto.
- Un nombre largo no rompe el layout: no se sale de la tarjeta ni empuja otras columnas ni genera desplazamiento horizontal de la página.
- La tarjeta del podio del estudiante lleva borde azul (no lleva la insignia "Tú", comportamiento actual).

**Resultado:**

- 375 px: [ ] Pasa  [ ] Falla
- 768 px: [ ] Pasa  [ ] Falla
- 1280 px: [ ] Pasa  [ ] Falla
- Fecha / Tester / Entorno:
- Evidencia (captura, log o enlace):
- Observaciones:

---

## Caso 10: Ranking - tarjeta "Tu posición actual" y "Cargar más"

**Pantalla:** `/ranking`.

**Precondiciones:** el estudiante de prueba con pruebas completadas queda fuera de los primeros 20 (hay más de 20 estudiantes en el ranking). Si no se dispone de esos datos, marcar el caso como Bloqueado.

**Pasos:**

1. Abrir `/ranking` en 1280, 768, 551, 550 y 375 px.
2. Desplazarse hasta el final. Tocar "Cargar más".

**Resultado esperado:**

- Aparece la tarjeta "Tu posición actual" con "#N posición" y el texto de ánimo, sin cortes. Hasta 550 px el icono de la tarjeta se oculta y el relleno se reduce.
- "Cargar más" se ve completo y accesible, y al tocarlo agrega filas sin romper la tabla.

**Resultado:**

- 375 px: [ ] Pasa  [ ] Falla
- 768 px: [ ] Pasa  [ ] Falla
- 1280 px: [ ] Pasa  [ ] Falla
- Fecha / Tester / Entorno:
- Evidencia (captura, log o enlace):
- Observaciones:

---

## Caso 11: Logros - lista de logros desbloqueados y bloqueados

**Pantalla:** `/logros` (se llega desde Perfil, botón "Logros").

**Precondiciones:** cuenta con al menos un logro desbloqueado ("Primer paso") y los otros bloqueados.

**Pasos:**

1. Abrir `/logros` en 1280, 768, 375 y 320 px (opcional).
2. Observar cada tarjeta de logro: título, descripción y etiqueta ("Desbloqueado" con fecha o "Bloqueado").

**Resultado esperado:**

- La lista es una columna centrada de hasta 500 px de ancho; en 375 px ocupa el ancho disponible con márgenes y sin desplazamiento horizontal.
- Los títulos y descripciones largos se ajustan dentro de la tarjeta sin cortarse.
- La etiqueta "Desbloqueado" con la fecha (dd/mm/aaaa) y la etiqueta "Bloqueado" se leen completas, y se distinguen los dos estados (colores y contraste).
- La pantalla no tiene cortes de CSS propios: confirmar que en 768 y 1280 px sigue viéndose ordenada.

**Resultado:**

- 375 px: [ ] Pasa  [ ] Falla
- 768 px: [ ] Pasa  [ ] Falla
- 1280 px: [ ] Pasa  [ ] Falla
- Fecha / Tester / Entorno:
- Evidencia (captura, log o enlace):
- Observaciones:

---

## Resultado general

Completar al terminar. Todo está vacío hasta que se ejecute.

- Estado: [ ] Aprobado  [ ] Con fallas  [ ] Bloqueado
- Casos con fallas (número y ancho):
- Observaciones generales:

## Notas finales

- Ejecutar con `npm run dev` y las herramientas de desarrollador en modo responsive.
- Registrar cualquier bug indicando el ancho exacto donde ocurre.
- Adjuntar capturas.
- Priorizar problemas de legibilidad y layout roto.
- Fuera de alcance de este documento: la pantalla de Retroalimentación (`/resultados/:id/retroalimentacion`), que no forma parte de lo que declaraba el commit original, y las pantallas Práctica y Cuestionario, cubiertas en `docs/qa/verificacion-responsive-practica.md`.
