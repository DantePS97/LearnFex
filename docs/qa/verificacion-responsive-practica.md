# QA - Verificación responsive de Práctica y Cuestionario

Este documento valida el comportamiento responsive de las pantallas de Práctica (`Practice.jsx`) y del cuestionario o simulacro en curso (`Quiz.jsx`) de LearnFex.

- Estado del documento: plantilla de ejecución. Ningún caso fue ejecutado todavía; todas las casillas de resultado están vacías a propósito.
- Verificado contra el código de `main` en el commit `f17a14c`. Si `main` cambió desde entonces, revisar los casos antes de ejecutarlos.
- Autoría original del borrador: Juliana Martínez (PR #63). Corregido contra el código real.
- Requisito que cubre (ERS): diseño adaptable a distintos tamaños de pantalla (RNF-010) y temporizador visible durante la prueba (RF-009).

---

## Cómo está armada la navegación (resumen verificado en el código)

Este es el punto que más se prestaba a error, así que conviene tenerlo claro antes de ejecutar:

- **Práctica (`/practica`) está dentro de `StudentLayout`** (`src/layouts/StudentLayout.jsx`): tiene la barra superior (`Navbar`) y la barra inferior (`BottomNavigation`).
  - Menos de 768 px: la barra superior muestra solo la marca ("L", "LearnFex", "Preparación Saber 11"), sin los enlaces; la barra inferior fija (70 px de alto) muestra Inicio, Práctica, Estadísticas, Ranking y Perfil.
  - 768 px o más: la barra superior muestra además los 5 enlaces y la barra inferior se oculta. El corte es `min-width: 768px` en `Navbar.css`, `BottomNavigation.css` y `StudentLayout.css`: a 768 px exactos ya se ve la versión de escritorio y a 767 px la móvil.
- **El cuestionario o simulacro en curso (`/practica/cuestionario`, `Quiz.jsx`) está FUERA de `StudentLayout`** (`src/routes/AppRoutes.jsx`, rutas del flujo de resolución de pruebas, SDD 5.1). No tiene barra superior ni barra inferior en ningún ancho. Tiene su propio encabezado con la marca ("LearnFex" y el nombre del área o "Simulacro general").
- Cortes de CSS propios de cada pantalla:
  - Práctica: 900 px (la grilla de áreas pasa de 2 columnas a 1), 600 px (se ocultan los botones "Historial" y "+ Nueva práctica" del encabezado) y 400 px (menos relleno lateral).
  - Cuestionario: 700 px (el contador y el temporizador salen del encabezado y el temporizador pasa a mostrarse como un bloque al final de la pantalla) y 430 px (marca y botones más compactos; los botones Anterior y Siguiente ocupan todo el ancho).

## Anchos a probar

| Dispositivo | Ancho | Qué se verifica |
| ----------- | ----- | --------------- |
| Mobile | 375 px | Vista principal móvil |
| Mobile pequeño | 320 px | Que no haya desbordes horizontales (opcional) |
| Tablet | 768 px | Primer ancho con barra superior con enlaces |
| Desktop | 1280 px | Vista de escritorio |
| Anchos de corte | 767, 768, 700, 701, 600, 601, 900 y 901 px | Cambios de layout, según el caso |

## Precondiciones generales

- Aplicación corriendo con `npm run dev`, con datos del seed cargados (5 áreas, 20 preguntas) y la función `calificarPrueba` desplegada.
- Sesión iniciada como estudiante.
- Navegador con DevTools: modo "Toggle Device Toolbar" en "Responsive", escribiendo el ancho exacto; repetir con el redimensionado manual de la ventana. Anotar siempre el ancho exacto donde algo falla.
- Cuestionario por área: se inicia tocando un área en `/practica`. Simulacro (20 preguntas): no tiene botón; se inicia escribiendo `/practica/cuestionario` en la barra de direcciones.
- Al probar los casos del cuestionario, no finalizar si no hace falta (salir con la navegación del navegador).

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

## Caso 1: Navegación de Práctica según el ancho

**Pantalla:** `/practica`.

**Pasos:**

1. Abrir `/practica` en cada ancho de la lista y observar la barra superior y la inferior.
2. Pasar de 767 a 768 px y de 768 a 767 px con el redimensionado manual.
3. Desplazarse hasta el final de la página en 375 px.

**Resultado esperado:**

- Hasta 767 px: barra superior solo con la marca (sin enlaces) y barra inferior fija con los 5 elementos, "Práctica" marcado como activo.
- Desde 768 px: barra superior con marca y los 5 enlaces, "Práctica" marcado como activo; no hay barra inferior.
- Nunca se ven las dos navegaciones con enlaces a la vez.
- En 375 px, la última tarjeta de área y cualquier contenido final quedan por encima de la barra inferior (no quedan tapados). Al cruzar 768 px no hay saltos raros ni solapamientos.

**Resultado:**

- 375 px: [ ] Pasa  [ ] Falla
- 767 px: [ ] Pasa  [ ] Falla
- 768 px: [ ] Pasa  [ ] Falla
- 1280 px: [ ] Pasa  [ ] Falla
- Fecha / Tester / Entorno:
- Evidencia (captura, log o enlace):
- Observaciones:

---

## Caso 2: Práctica - encabezado y botones de acción

**Pantalla:** `/practica`.

**Pasos:**

1. Observar el encabezado ("Práctica", "Banco de preguntas ICFES") y los botones "Historial" y "+ Nueva práctica" en 1280, 768, 601, 600 y 375 px.
2. En un ancho donde se vean, tocar "Historial" y luego "+ Nueva práctica".

**Resultado esperado:**

- Desde 601 px los dos botones se ven alineados a la derecha del título, sin cortarse ni solaparse con él.
- Hasta 600 px los dos botones se ocultan (comportamiento actual por CSS); el título sigue completo y legible.
- "Historial" navega a `/estadisticas`. "+ Nueva práctica" abre el cuestionario del primer área de la lista filtrada (no un simulacro).

**Resultado:**

- 375 px: [ ] Pasa  [ ] Falla
- 600 / 601 px: [ ] Pasa  [ ] Falla
- 768 px: [ ] Pasa  [ ] Falla
- 1280 px: [ ] Pasa  [ ] Falla
- Fecha / Tester / Entorno:
- Evidencia (captura, log o enlace):
- Observaciones:

---

## Caso 3: Práctica - buscador, filtros y tarjetas de áreas

**Pantalla:** `/practica`.

**Pasos:**

1. Observar el buscador "Buscar área...", la fila de filtros ("Todas" y una por área) y las tarjetas de áreas en 1280, 901, 900, 768 y 375 px.
2. En 375 px, desplazar la fila de filtros hacia los lados con el dedo o el mouse.
3. Escribir en el buscador un texto sin coincidencias y luego uno con coincidencia.
4. Revisar con 320 px (opcional) si aparece barra de desplazamiento horizontal en la página.

**Resultado esperado:**

- 901 px o más: las tarjetas se ven en 2 columnas. 900 px o menos: en 1 columna.
- Las tarjetas no se cortan: título y descripción largos se acortan con puntos suspensivos o se ajustan, sin salirse de la tarjeta y sin superponerse con el icono ni la flecha.
- La fila de filtros se desplaza horizontalmente dentro de su contenedor (no hace desplazar toda la página).
- Sin coincidencias aparece "No encontramos áreas". Tocar una tarjeta abre el cuestionario de esa área.
- No hay desplazamiento horizontal de la página en ningún ancho.

**Resultado:**

- 375 px: [ ] Pasa  [ ] Falla
- 768 px: [ ] Pasa  [ ] Falla
- 900 / 901 px: [ ] Pasa  [ ] Falla
- 1280 px: [ ] Pasa  [ ] Falla
- Fecha / Tester / Entorno:
- Evidencia (captura, log o enlace):
- Observaciones:

---

## Caso 4: Cuestionario - la pantalla no tiene barra superior ni inferior

**Pantalla:** `/practica/cuestionario` (cuestionario por área y simulacro).

**Pasos:**

1. Desde Práctica, tocar un área y observar la pantalla del cuestionario en cada ancho.
2. Repetir con el simulacro escribiendo `/practica/cuestionario` en la barra de direcciones.
3. Buscar en la pantalla la barra superior con enlaces y la barra inferior de navegación.

**Resultado esperado:**

- En 375, 768 y 1280 px, la pantalla no tiene barra superior de navegación (Inicio, Práctica, ...) ni barra inferior. Solo se ve su propio encabezado con la marca ("LearnFex" y el nombre del área o "Simulacro general").
- No hay forma de ir a otra sección desde esta pantalla sin salir con el navegador: es el comportamiento diseñado para el flujo de la prueba, no un defecto.
- La ausencia de barras no deja contenido pegado al borde: el contenido tiene márgenes laterales en todos los anchos.

**Resultado:**

- 375 px: [ ] Pasa  [ ] Falla
- 768 px: [ ] Pasa  [ ] Falla
- 1280 px: [ ] Pasa  [ ] Falla
- Fecha / Tester / Entorno:
- Evidencia (captura, log o enlace):
- Observaciones:

---

## Caso 5: Cuestionario - encabezado, contador y temporizador

**Pantalla:** `/practica/cuestionario`.

**Pasos:**

1. Observar el encabezado en 1280, 768, 701, 700 y 375 px. Anotar dónde se ven el contador "Pregunta N de M" y el temporizador.
2. Dejar correr unos segundos el temporizador en cada ancho.
3. En 375 px, observar si el temporizador se ve al abrir la pantalla y después de responder preguntas y desplazarse por la página.

**Resultado esperado:**

- 701 px o más: el contador y el temporizador (formato mm:ss, cuenta regresiva) están a la derecha del encabezado, sin cortarse ni salirse del contenedor.
- 700 px o menos: el encabezado solo muestra la marca; el contador y el temporizador del encabezado se ocultan. El contador sigue visible dentro de la tarjeta de la pregunta ("Pregunta N de M") y el temporizador aparece como un bloque centrado al final de la pantalla, debajo de la navegación de preguntas.
- En todos los anchos el temporizador se actualiza cada segundo y no se superpone con otros elementos.
- La ERS (RF-009) pide un temporizador visible durante toda la prueba.

**Comportamiento actual conocido (posible brecha, por lectura del CSS):** en 700 px o menos el bloque del temporizador no es fijo (`.mobile-timer` está al final de la página), por lo que puede quedar fuera de la vista mientras se responde. Si al ejecutar el paso 3 hay que desplazarse hasta el final para ver el tiempo, anotarlo como hallazgo de usabilidad.

**Resultado:**

- 375 px: [ ] Pasa  [ ] Falla
- 700 / 701 px: [ ] Pasa  [ ] Falla
- 768 px: [ ] Pasa  [ ] Falla
- 1280 px: [ ] Pasa  [ ] Falla
- Fecha / Tester / Entorno:
- Evidencia (captura, log o enlace):
- Observaciones:

---

## Caso 6: Cuestionario - tarjeta de pregunta y opciones

**Pantalla:** `/practica/cuestionario`.

**Pasos:**

1. Recorrer todas las preguntas del cuestionario en 375, 768 y 1280 px. Prestar atención a los enunciados y opciones más largos.
2. Tocar varias opciones y observar el estado seleccionado.

**Resultado esperado:**

- La tarjeta no se corta: el enunciado y el texto de cada opción se ven completos y se ajustan al ancho sin desbordar.
- Las opciones no se superponen entre sí y tienen un área táctil cómoda en 375 px.
- La opción elegida queda marcada con claridad. No se ve la respuesta correcta ni explicación durante la prueba.

**Resultado:**

- 375 px: [ ] Pasa  [ ] Falla
- 768 px: [ ] Pasa  [ ] Falla
- 1280 px: [ ] Pasa  [ ] Falla
- Fecha / Tester / Entorno:
- Evidencia (captura, log o enlace):
- Observaciones:

---

## Caso 7: Cuestionario - botones y navegación de preguntas

**Pantalla:** `/practica/cuestionario`, cuestionario por área (4 preguntas) y simulacro (20 preguntas).

**Pasos:**

1. En 1280, 768, 430 y 375 px, observar los botones "Anterior" y "Siguiente", y en la última pregunta "Finalizar".
2. Observar la "Navegación de preguntas" (números y leyenda "Respondida" / "Sin responder") en el simulacro de 20 preguntas.
3. Responder algunas preguntas y comprobar que los números cambian a "respondida" y que se puede saltar tocando un número.

**Resultado esperado:**

- Los botones son accesibles (no quedan fuera de pantalla ni tapados). "Anterior" está deshabilitado en la primera pregunta.
- En 430 px o menos, "Anterior" y "Siguiente" se reparten el ancho de la fila.
- Los 20 números de la navegación se acomodan en varias filas sin salirse del contenedor ni generar desplazamiento horizontal. En 700 px o menos, el título y la leyenda se apilan en vertical.
- La leyenda se lee completa y los colores de respondida y sin responder se distinguen.

**Resultado:**

- 375 px: [ ] Pasa  [ ] Falla
- 430 px: [ ] Pasa  [ ] Falla
- 768 px: [ ] Pasa  [ ] Falla
- 1280 px: [ ] Pasa  [ ] Falla
- Fecha / Tester / Entorno:
- Evidencia (captura, log o enlace):
- Observaciones:

---

## Caso 8: Cambiar el tamaño de la ventana durante la prueba

**Pantalla:** `/practica/cuestionario`.

**Pasos:**

1. En 1280 px, iniciar un cuestionario, responder 2 preguntas y anotar el tiempo restante.
2. Reducir la ventana hasta 375 px y volver a 1280 px (o rotar el dispositivo emulado).
3. Verificar la pregunta actual, las respuestas dadas y el temporizador.

**Resultado esperado:**

- El cambio de ancho no reinicia la prueba: se conservan la pregunta actual, las respuestas marcadas y el avance del temporizador (el cambio es solo de CSS).
- Al cruzar 700 px el temporizador pasa del encabezado al bloque inferior y viceversa, sin duplicarse ni desaparecer.

**Resultado:**

- Cambio 1280 a 375 px: [ ] Pasa  [ ] Falla
- Cambio 375 a 1280 px: [ ] Pasa  [ ] Falla
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

- Ejecutar las pruebas con `npm run dev`.
- Usar DevTools, "Toggle Device Toolbar" en modo Responsive, y revisar también con el redimensionado manual.
- Documentar los errores con precisión (píxeles exactos) y adjuntar capturas.
- Las pantallas de Resultados, Estadísticas, Ranking y Logros se cubren en `docs/qa/verificacion-responsive-sprint5.md`. La pantalla de Retroalimentación no está cubierta por ninguno de los dos documentos.
