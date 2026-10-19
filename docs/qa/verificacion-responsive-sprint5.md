# QA - Verificación responsive del Sprint 5: Resultados, Estadísticas, Historial, Ranking y Logros

Este documento valida el comportamiento responsive de las pantallas del Sprint 5 de LearnFex: Resultados (`Results.jsx`), Estadísticas (`Statistics.jsx`), Historial (`History.jsx`), Ranking (`Ranking.jsx`) y Logros (`Achievements.jsx`).

- Estado del documento: plantilla de ejecución. Ningún caso fue ejecutado todavía; todas las casillas de resultado están vacías a propósito.
- Verificado contra el código de `main` en el commit `99a359d` (2026-10-19). Si `main` cambió desde entonces, revisar los casos antes de ejecutarlos. Actualizado tras el Sprint 7: aviso "¡Logro desbloqueado!" en Resultados (PR #95), Historial con título y tiempo y accesible desde Perfil (PR #98), Estadísticas con estado vacío (PR #99), Ranking responsive (PR #100), página 404 (PR #105) y política de privacidad pública (PR #87).
- Autoría original del borrador: Juliana Martínez (PR #64). Corregido contra el código real: el borrador cubría Retroalimentación, Estadísticas y Ranking, y no cubría Resultados ni Logros. Actualizado tras la migración de colores a tokens (PRs de CSS #50 a #52 y #73 a #75: cambios de color, sin cambios de layout ni de cortes; Ranking y Resultados pasaron de tema claro a oscuro) y tras agregar la pantalla Historial (PR #67).
- Requisito que cubre (ERS): diseño adaptable a distintos tamaños de pantalla (RNF-010). El contenido funcional de estas pantallas (ranking, estadísticas, historial) se verifica en `docs/qa/integracion-end-to-end.md`.

---

## Precondición de código

- El PR #23 (reconexión del backend a Firestore real) ya está mergeado en `main` (estado MERGED al verificar este documento). Las estadísticas, el ranking y los logros leen datos reales de Firestore.

## Cómo está armada cada pantalla (resumen verificado en el código)

- **Estadísticas (`/estadisticas`), Historial (`/historial`), Ranking (`/ranking`) y Logros (`/logros`)** están dentro de `StudentLayout`: tienen la barra superior y la inferior. Menos de 768 px: la barra superior muestra solo la marca y la barra inferior fija (70 px) tiene 5 elementos (Inicio, Práctica, Estadísticas, Ranking, Perfil). Desde 768 px: la barra superior muestra los 5 enlaces y no hay barra inferior. Logros no figura en esa navegación: se llega desde Perfil, botón "Logros". Historial tampoco: se llega desde Perfil (elemento "Historial" del menú, en cualquier ancho) o desde Práctica, botón "Historial" (que se oculta en 600 px o menos).
- **Tema de color:** Resultados, Estadísticas, Historial y Ranking usan los tokens de `src/styles/variables.css` (superficies `--color-surface` y `--color-surface-alt`, texto blanco, acento celeste `--color-primary`) y se ven sobre fondo oscuro; Logros tiene colores propios, también oscuros. Ranking y Resultados antes tenían tema claro: al revisar cada caso, comprobar también que ningún texto quede ilegible por contraste (por ejemplo texto oscuro sobre fondo oscuro).
- **Resultados (`/resultados/:id`)** está fuera de `StudentLayout` (`src/routes/AppRoutes.jsx`, flujo de resolución de pruebas): no tiene barra superior ni inferior en ningún ancho.
- Cortes de CSS de cada pantalla:
  - Resultados: 768 px (la tarjeta principal pasa a columna, las 3 tarjetas de datos a 1 columna y los botones a columna de ancho completo) y 480 px (círculo de puntaje más chico).
  - Estadísticas: 950 px (las tarjetas pasan a 2 columnas) y 650 px (1 columna, encabezado en columna y botones de ancho completo).
  - Historial: 720 px (el encabezado pasa a columna y cada fila pasa de una sola línea a un bloque: título y fecha arriba, tres datos iguales en el medio y estado con flecha abajo). Ancho máximo del contenido: 900 px.
  - Ranking: 850 px (el podio pasa a 1 columna, se oculta la fila de títulos de la tabla y la fila de cada estudiante pasa a 4 columnas: posición, estudiante, nivel de 80 px y puntos de 100 px) y 550 px (la fila pasa a 3 columnas: posición, estudiante y puntos; se oculta la columna del nivel; avatar y textos más chicos). En ningún ancho se ocultan los puntos.
  - Resultados: además, si la prueba desbloqueó logros, se agrega una tarjeta "¡Logro desbloqueado!" por logro (solo al llegar desde la prueba), con el estilo de las tarjetas de datos.
  - Logros: no tiene cortes propios; es una lista vertical centrada de ancho máximo 500 px.
- Las barras de progreso de Estadísticas no son CSS propio de la pantalla: usan el componente compartido `ProgressBar` (`src/components/ProgressBar/ProgressBar.jsx`): nombre del área a la izquierda, porcentaje a la derecha y una pista de 10 px de alto con relleno proporcional. El color del relleno depende del valor (80% o más "success", 60% o más "primary", menos de 60% "danger").

## Anchos a probar

| Dispositivo | Ancho | Qué se verifica |
| ----------- | ----- | --------------- |
| Mobile | 375 px | Vista principal móvil |
| Mobile pequeño | 320 px | Que no haya desbordes horizontales (opcional) |
| Tablet | 768 px | Primer ancho con barra superior con enlaces |
| Desktop | 1280 px | Vista de escritorio |
| Anchos de corte | 767, 720, 721, 650, 651, 550, 480, 850 y 951 px | Cambios de layout, según el caso |

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

**Pantallas:** `/estadisticas`, `/historial`, `/ranking`, `/logros` y `/resultados/{id}`.

**Pasos:**

1. Abrir cada pantalla en 375, 767, 768 y 1280 px y observar las barras de navegación.
2. En 375 px, desplazarse hasta el final de cada pantalla.

**Resultado esperado:**

- Estadísticas, Historial, Ranking y Logros: hasta 767 px, barra superior con la marca y barra inferior fija; desde 768 px, barra superior con enlaces y sin barra inferior. En Estadísticas y Ranking el elemento correspondiente figura como activo. En Logros y en Historial ninguno figura como activo (no están en la navegación).
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
3. Con una cuenta nueva (sin logros), terminar la primera prueba y observar la pantalla de resultados en 1280, 769, 768 y 375 px: debe aparecer la tarjeta "¡Logro desbloqueado!" con el nombre "Primer paso".

**Resultado esperado:**

- En 769 px o más, las 3 tarjetas van en una fila de 3 columnas y los 3 botones en una fila alineada a la derecha, sin cortarse ni apilarse de forma irregular.
- Hasta 768 px, las tarjetas van una debajo de otra y los botones ocupan todo el ancho, uno debajo del otro.
- Los números y etiquetas se leen completos. Los botones navegan a `/inicio`, a la retroalimentación y a `/practica`.
- Paso 3: la tarjeta "¡Logro desbloqueado!" (con un icono de medalla y el nombre del logro debajo) se ve completa, sin cortarse, entre las tarjetas de datos y los botones, y con el mismo estilo de las tarjetas "Correctas"; en 768 px o menos queda en una sola columna. Al recargar la página, la tarjeta desaparece (es lo esperado).

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

1. Observar las barras de las 5 áreas en 375, 768 y 1280 px. Tener áreas con porcentajes en los tres rangos (80% o más, de 60% a 79%, menos de 60%) y alguna sin pruebas.
2. Comparar el porcentaje escrito con el largo del relleno.
3. Con una cuenta sin ninguna prueba, abrir `/estadisticas` en 375 y 1280 px.

**Resultado esperado:**

- Cada barra muestra el nombre del área a la izquierda y el porcentaje a la derecha; ambos se leen completos aunque el nombre del área sea largo (por ejemplo "Ciencias Sociales y Ciudadanas"). Las áreas sin pruebas llevan "(sin pruebas)" junto al nombre y 0%.
- La pista ocupa todo el ancho disponible, no se deforma en 375 px y el relleno es proporcional al porcentaje. Una barra en 0% muestra solo la pista vacía; en 100% la llena.
- El color del relleno es distinto según el rango (80% o más, 60% o más, menos de 60%) y se distingue del fondo con contraste suficiente.
- Paso 3: en lugar de las barras se ve el estado vacío ("Todavía no tienes progreso registrado." con el botón "Comenzar una práctica", que navega a `/practica`), centrado y sin cortes. Las tarjetas "Promedio general" (0%) y "Pruebas" (0) se siguen viendo.

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

1. Observar las tarjetas de temas recomendados (áreas con pruebas y menos de 60%) y el bloque final con el botón "Empezar" en 1280, 768, 651, 650 y 375 px.
2. Con una cuenta sin pruebas, y luego con una cuenta con pruebas en todas las áreas y 60% o más en cada una, observar la sección "Temas recomendados".

**Resultado esperado:**

- Cada tema recomendado muestra nombre, la leyenda "Refuerza esta área" y el porcentaje del área en rojo, sin cortarse; hasta 650 px el porcentaje se ajusta alineado a la derecha. Solo aparecen áreas en las que hay al menos una prueba (hasta dos).
- Paso 2: sin pruebas se ve "Hacé tu primera práctica para recibir recomendaciones."; con todas las áreas en 60% o más se ve "¡Muy bien! Ninguna área está por debajo del 60%.". Ambos mensajes quedan centrados y legibles.
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
- Hasta 850 px el podio pasa a una columna y la fila de títulos se oculta. Cada fila muestra 4 columnas: posición, estudiante, nivel y puntos ("{n} pts"), sin columnas vacías.
- Hasta 550 px cada fila muestra 3 columnas: posición, estudiante y puntos; la columna del nivel se oculta. El avatar y los textos son más chicos pero legibles.
- **En todos los anchos se ven los puntos de cada fila** ("{n} pts", alineados a la derecha en 850 px o menos), sin cortes ni superposiciones.

**Nota:** hasta el PR #100 el CSS ocultaba el nivel y los puntos en pantallas de hasta 850 px y la grilla de escritorio declaraba una columna de más. Si en algún ancho no se ven los puntos, es una regresión: registrarla con el ancho exacto.

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

- La fila del estudiante se distingue de las demás: fondo `--color-surface-alt` (un tono más oscuro que el resto de la tabla) y avatar en el color primario (celeste). Comprobar que la diferencia se nota a simple vista; si no se distingue, anotarlo como hallazgo de contraste.
- La insignia "Tú" aparece junto al nombre, legible y sin superponerse con el texto.
- Un nombre largo no rompe el layout: no se sale de la tarjeta ni empuja otras columnas ni genera desplazamiento horizontal de la página.
- La tarjeta del podio del estudiante lleva borde en el color primario (celeste; no lleva la insignia "Tú", comportamiento actual).

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

## Caso 12: Historial - lista de resultados y estado vacío

**Pantalla:** `/historial` (se llega desde Perfil con el elemento "Historial" del menú, en cualquier ancho, o desde Práctica con el botón "Historial", visible desde 601 px).

**Precondiciones:** estudiante con al menos 3 resultados guardados, de preferencia uno con 60% o más y otro con menos. Para el estado vacío hace falta una cuenta de estudiante sin ninguna prueba; si no hay, dejar ese paso sin marcar y explicarlo en Observaciones. El índice compuesto de `resultados` debe estar desplegado en el proyecto de pruebas (ver `docs/qa/integracion-end-to-end.md`, paso 5.12).

**Pasos:**

1. Abrir `/historial` en 1280, 769, 768, 721, 720 y 375 px (en 375 px, llegando desde Perfil). Observar el encabezado ("MI PROGRESO", "Historial", botón "Practicar") y las filas. Tener al menos un cuestionario por área y un simulacro entre los resultados.
2. En cada fila, ubicar: el título de la prueba (por ejemplo "Cuestionario de Matemáticas" o "Simulacro general") con la fecha, hora y tiempo empleado ("m:ss min"), "Puntaje", "Correctas", "Incorrectas", la etiqueta de estado y la flecha.
3. En escritorio, pasar el mouse sobre una fila y recorrer las filas con la tecla Tab.
4. Con la cuenta sin pruebas, abrir `/historial` en 375 y 1280 px.

**Resultado esperado:**

- El contenido está centrado y no pasa de 900 px de ancho. Hay barra superior o inferior según el ancho, como en Estadísticas, y ningún elemento de la navegación figura como activo.
- Cada fila muestra el título del cuestionario o simulacro (no un título fijo) y, junto a la fecha y hora, el tiempo empleado en formato "m:ss min". Un título largo no desborda la fila ni empuja los datos.
- Desde 721 px el encabezado va en fila (título a la izquierda, "Practicar" a la derecha) y cada resultado ocupa una sola línea: título y fecha, los tres datos y el estado con la flecha.
- Hasta 720 px el encabezado va en columna y cada resultado se acomoda en tres bloques: título y fecha arriba, "Puntaje", "Correctas" e "Incorrectas" en tres columnas iguales en el medio, y abajo el estado y la flecha en los extremos opuestos. No hay textos cortados ni desplazamiento horizontal de la página en ningún ancho.
- Se distinguen los colores: "Correctas" en verde, "Incorrectas" en rojo, "Aprobado" verde y "No aprobado" rojo, todos legibles sobre el fondo oscuro. Al pasar el mouse la fila se levanta un poco y su borde toma el color primario; con Tab se ve el contorno de foco.
- Estado vacío: una tarjeta centrada (hasta 480 px de ancho) con el icono, el título "Historial", el texto "Todavía no completaste ningún cuestionario" y el botón "Realizar cuestionario", sin cortes en 375 px.

**Resultado:**

- 375 px: [ ] Pasa  [ ] Falla
- 720 / 721 px: [ ] Pasa  [ ] Falla
- 768 px: [ ] Pasa  [ ] Falla
- 1280 px: [ ] Pasa  [ ] Falla
- Fecha / Tester / Entorno:
- Evidencia (captura, log o enlace):
- Observaciones:

---

## Caso 13: Pantallas públicas del Sprint 7 - registro con consentimiento, `/privacidad` y página 404

**Pantallas:** `/registro`, `/privacidad` y una dirección inexistente (por ejemplo `/ruta-que-no-existe`). Ninguna requiere sesión.

**Pasos:**

1. Abrir `/registro` en 1280, 768 y 375 px. Observar la casilla "Acepto la política de tratamiento de datos personales". Tocar "Crear cuenta" con todos los campos completos y la casilla sin marcar.
2. Tocar el texto enlazado de la casilla.
3. Abrir `/privacidad` en 1280, 768, 481, 480 y 375 px y desplazarse hasta el final. Tocar "Volver a LearnFex".
4. Abrir `/ruta-que-no-existe` en 1280 y 375 px, con y sin sesión iniciada. Tocar "Volver al inicio".

**Resultado esperado:**

- Paso 1: la casilla y su texto se ven completos y alineados en todos los anchos, sin cortarse ni desbordar la tarjeta del formulario. Con la casilla sin marcar aparece, debajo de ella, "Debés aceptar la política de tratamiento de datos personales para registrarte" y el foco pasa a la casilla; no se crea la cuenta.
- Paso 2: la política se abre en una pestaña nueva (`/privacidad`), sin perder lo escrito en el formulario.
- Paso 3: la política es una tarjeta centrada de hasta 760 px de ancho; hasta 480 px el relleno de la página y de la tarjeta se reduce. Los textos largos se ajustan al ancho (no hay desplazamiento horizontal). "Volver a LearnFex" navega a `/`.
- Paso 4: se ve la tarjeta "Página no encontrada" con el texto "La dirección que abriste no existe." y el enlace "Volver al inicio", centrada y legible en ambos anchos. Con sesión, el enlace lleva a `/inicio`; sin sesión, termina en `/` (inicio de sesión).

**Resultado:**

- 375 px: [ ] Pasa  [ ] Falla
- 480 / 481 px: [ ] Pasa  [ ] Falla
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
