# QA - Casos de prueba de cuestionarios y simulacros

Este documento describe los casos de prueba del flujo de evaluación de LearnFex: elegir un área, armar un cuestionario o un simulacro, responder con temporizador, finalizar y guardar el resultado.

- Estado del documento: plantilla de ejecución. Ningún caso fue ejecutado todavía; todas las casillas de resultado están vacías a propósito.
- Verificado contra el código de `main` en el commit `99a359d` (2026-10-19). Si `main` cambió desde entonces, revisar los casos antes de ejecutarlos.
- Autoría original del borrador: Juliana Martínez (PR #60). Corregido contra el código real y actualizado tras el cambio del seed a 40 preguntas (PR #65), el cierre de sesión en Perfil (PR #53) y el Sprint 7: las mismas preguntas en pantalla y en el documento y validación del simulacro (PR #92), confirmar al finalizar y reintentar el envío (PR #94), botón "Simulacro completo" (PR #96), temporizador fijo en móvil (PR #102).
- Basado en la ERS, sección 3.1.2 (Evaluación). Requisitos que cubre: selección de materia (RF-006), cuestionarios (RF-007), simulacro completo con las cinco áreas (RF-008), temporizador (RF-009) y calificación automática (RF-010).

---

## Cómo funciona hoy (resumen verificado en el código)

- Práctica (`/practica`) lista las áreas de la colección `areas` (tarjetas, filtros y buscador). Tocar un área navega a `/practica/cuestionario` con el `areaId`. El botón "Historial" navega a `/historial` (lista de resultados anteriores; ver `docs/qa/integracion-end-to-end.md`, módulo 5). El botón "+ Nueva práctica" inicia el primer área de la lista filtrada; no inicia un simulacro. En pantallas de hasta 600 px el encabezado de acciones ("Historial" y "+ Nueva práctica") se oculta por CSS (el historial se abre entonces desde Perfil).
- **El simulacro se inicia desde Práctica**, con el bloque "Simulacro completo" y su botón "Iniciar simulacro", que navega a `/practica/cuestionario` con `areaId: null`. El bloque se ve en todos los anchos; el botón queda deshabilitado mientras se cargan las áreas o si no hay ninguna.
- `/practica/cuestionario` y `/resultados/:id` están dentro de las rutas privadas pero fuera del layout del estudiante: no tienen barra de navegación superior ni inferior.
- Un cuestionario por área toma hasta 10 preguntas del área al azar (`armarCuestionario`, por defecto 10; `Practice.jsx` no pasa otra cantidad y el campo `numPreguntas` del área no se usa aquí), dura el `tiempoLimite` del área en minutos (20 si el área no lo define) y crea un documento en `cuestionarios` de tipo `cuestionario`. Si el área no tiene preguntas, lanza el error "El área ... todavía no tiene preguntas." y no crea el documento.
- El simulacro (`armarSimulacro` en `src/services/quizService.js`) exige al menos 5 áreas en `areas` ("El simulacro necesita 5 áreas y hay N configuradas.") y al menos una pregunta en cada una ("Faltan preguntas en: ..."); si no se cumple, no crea el documento. Si se cumple, toma `numPreguntas` preguntas al azar de cada área y suma los `tiempoLimite` de todas, y crea un documento en `cuestionarios` de tipo `simulacro` con `areaId: null`. Las áreas que haya en `areas` son las que se usan (no exige las cinco por ID).
- **Las preguntas que se muestran son las del documento `cuestionarios` guardado**: `Quiz.jsx` usa las preguntas que devolvió `armarCuestionario` o `armarSimulacro`, en el mismo orden que `preguntas[].orden`.
- Con los datos del seed (`scripts/seed-preguntas.js`): 5 áreas con 8 preguntas cada una (2 de dificultad baja, 3 media y 3 alta) y `numPreguntas: 6` en cada área. Cuestionario por área: 8 preguntas (pide 10 y el área solo tiene 8, así que entran todas). Simulacro: 30 preguntas (6 al azar de las 8 de cada área) y 95 minutos (20 + 20 + 20 + 20 + 15; Inglés tiene 15).
- El orden de las áreas dentro del simulacro es el que devuelve Firestore al listar `areas` (por ID de documento), y la pantalla no indica a qué área pertenece cada pregunta.
- Las respuestas se guardan solo en memoria hasta finalizar. El botón "Finalizar" aparece únicamente en la última pregunta. Se puede saltar entre preguntas con la "Navegación de preguntas". Si quedan preguntas sin responder, "Finalizar" abre una confirmación del navegador ("Te quedan N pregunta(s) sin responder. ¿Querés finalizar igual?"); al cancelar, se vuelve a la prueba. Al llegar el temporizador a cero no se pide confirmación.
- Al finalizar (o al llegar el temporizador a cero) el cliente llama a la Cloud Function `calificarPrueba` y navega a `/resultados/{cuestionarioId}_{uid}`. La función guarda el resultado, una respuesta por pregunta (con `esCorrecta` calculado en el servidor) y aplica la gamificación.
- Si el envío falla, la pantalla muestra "No se pudo enviar tu prueba. Revisá tu conexión y volvé a intentar." con un botón "Reintentar" (que vuelve a enviar las mismas respuestas); las respuestas no se pierden. Si la función responde `already-exists`, el cliente navega al resultado ya guardado.
- Temporizador: hasta 700 px de ancho el encabezado solo muestra la marca y el temporizador aparece en un bloque fijo (`position: fixed`) centrado en la parte inferior de la pantalla; desde 701 px está en el encabezado.
- Quien envía las respuestas no puede indicar el `usuarioId`: la función toma la identidad de la sesión.

---

## Precondiciones generales

- Aplicación corriendo con `npm run dev`, apuntando a un proyecto de Firebase de pruebas, con la función `calificarPrueba` desplegada (si no, al finalizar aparece "No se pudo enviar tu prueba. Revisá tu conexión y volvé a intentar." con el botón "Reintentar").
- Datos del seed cargados (5 áreas, 40 preguntas). Si el proyecto ya tenía el seed anterior (20 preguntas y `numPreguntas: 4`), volver a ejecutar `scripts/seed-preguntas.js`: sobrescribe las áreas y agrega `seed_21` a `seed_40`.
- Una cuenta de estudiante de prueba y acceso de lectura a la consola de Firestore. Algunos casos piden editar `areas` a mano: hacerlo solo en el proyecto de pruebas y restaurar los valores originales al terminar.
- Consola del navegador abierta (DevTools) para revisar errores.

## Datos de la ejecución

| Campo | Valor |
| ----- | ----- |
| Fecha | |
| Tester | |
| Entorno (URL, navegador y versión) | |
| Commit o rama probada | |
| Proyecto de Firebase | |
| Cuenta de prueba (correo) | |

## Cómo registrar el resultado

- Marcar `[x]` una sola opción por caso: Pasa, Falla o Bloqueado (no se pudo ejecutar; explicar por qué en Observaciones).
- Un caso con "Comportamiento actual conocido" que falla exactamente como allí se describe se registra como **Falla** con la observación "falla conocida". Solo se abre un defecto nuevo si falla de otra manera.
- Adjuntar evidencia (captura, log o enlace) en cada caso ejecutado.

---

## Caso 1: Selección de área y carga de preguntas

**Precondiciones:** sesión iniciada como estudiante.

**Pasos:**

1. Ir a `/practica`. Verificar las áreas listadas.
2. Tocar cada una de las 5 áreas, una por una (volver a Práctica entre cada una).
3. En cada cuestionario, observar el encabezado, el contador, el temporizador y la primera pregunta. No finalizar (salir sin enviar).

**Resultado esperado:**

- Práctica lista las 5 áreas: Matemáticas, Lectura Crítica, Ciencias Naturales, Ciencias Sociales y Ciudadanas e Inglés.
- Cada cuestionario carga preguntas reales de Firestore del área elegida: el encabezado muestra el nombre del área, el contador dice "Pregunta 1 de 8" (con el seed) y el temporizador arranca en `20:00` (`15:00` en Inglés).
- Ninguna lista queda vacía y no hay errores en la consola.
- Las preguntas se muestran con sus opciones y sin respuesta correcta ni explicación.
- No hay barra de navegación superior ni inferior en esta pantalla.

**Resultado:**

- Resultado: [ ] Pasa  [ ] Falla  [ ] Bloqueado
- Fecha / Tester / Entorno:
- Evidencia (captura, log o enlace):
- Observaciones:

---

## Caso 2: Iniciar el simulacro general con las cinco áreas

**Precondiciones:** sesión iniciada como estudiante; las 5 áreas del seed existen.

**Pasos:**

1. Ir a `/practica` y ubicar el bloque "Simulacro completo" (etiqueta "SIMULACRO"). Comprobar que se ve también en un ancho de 375 px.
2. Tocar "Iniciar simulacro".
3. Revisar el encabezado, el contador, el temporizador y recorrer las preguntas con "Siguiente" y la "Navegación de preguntas". Anotar el enunciado de las 30 preguntas, en orden.
4. En Firestore, abrir el nuevo documento de `cuestionarios` y comparar los `preguntaId` de `preguntas`, en el orden de `orden`, con las preguntas anotadas en el paso 3.

**Resultado esperado:**

- Pasos 1 y 2: el bloque "Simulacro completo" ("Preguntas de las cinco áreas con tiempo controlado, como en el Saber 11.") tiene el botón "Iniciar simulacro", que abre `/practica/cuestionario`. En 600 px o menos el botón ocupa todo el ancho del bloque. Inicio no tiene un acceso directo al simulacro: sus botones llevan a `/practica`.
- Paso 3: el encabezado dice "Simulacro general", el contador "Pregunta 1 de 30" y el temporizador `95:00`. El simulacro incluye 6 preguntas de cada una de las 5 áreas (30 en total), elegidas al azar entre las 8 de cada área. No hay opción para omitir un área: todas las preguntas están en la misma secuencia.
- Paso 4: el documento tiene `tipo: "simulacro"`, `areaId: null`, `titulo: "Simulacro general"`, `duracion: 95`, `estado: "activo"`, `fechaCreacion` y `preguntas` con 30 entradas `{preguntaId, orden}`. **Los `preguntaId` y su orden coinciden con las preguntas que se mostraron en pantalla** (el conjunto y el orden son los mismos).

**Notas:**

- La ERS (RF-008, CU-03) pide una opción "Simulacro completo": está en Práctica desde el PR #96.
- Si en el paso 4 el conjunto o el orden no coinciden, es una regresión del PR #92: registrar como Falla con los `preguntaId` de ambos lados.

**Resultado:**

- Resultado: [ ] Pasa  [ ] Falla  [ ] Bloqueado
- Fecha / Tester / Entorno:
- Evidencia (captura, log o enlace):
- Observaciones:

---

## Caso 3: Simulacro y cuestionario cuando faltan preguntas en un área (RF-008)

La ERS (RF-008) pide no permitir omitir un área. Desde el PR #92 el armado lo valida.

**Precondiciones:** proyecto de pruebas. En la consola de Firestore, crear temporalmente `areas/area_vacia_prueba` con `nombre: "Área vacía de prueba"`, `descripcion: "temporal"`, `numPreguntas: 6`, `tiempoLimite: 5` y sin ninguna pregunta que apunte a ella. Borrar ese documento al terminar. Anotar cuántos documentos hay en `cuestionarios` antes de empezar.

**Pasos:**

1. Ir a `/practica` y verificar que aparece "Área vacía de prueba".
2. Tocar esa área.
3. Volver a `/practica` y tocar "Iniciar simulacro".
4. Revisar el mensaje en pantalla y la cantidad de documentos en `cuestionarios`.
5. Opcional: tocar "Volver a práctica" en cada pantalla de error.

**Resultado esperado:**

- Paso 2: se muestra "El área Área vacía de prueba todavía no tiene preguntas." con el botón "Volver a práctica". No se crea ningún documento en `cuestionarios`.
- Paso 3: el simulacro **no inicia**: se muestra "Faltan preguntas en: Área vacía de prueba." con el botón "Volver a práctica". No se crea ningún documento en `cuestionarios` y no se llega a mostrar el temporizador.
- Paso 4: la cantidad de documentos en `cuestionarios` es la misma que antes del caso (sin cuestionarios vacíos).
- Paso 5: el botón navega a `/practica`.

**Variante opcional (solo en un proyecto descartable):** con menos de 5 documentos en `areas`, "Iniciar simulacro" muestra "El simulacro necesita 5 áreas y hay N configuradas." y no crea el documento. No es necesario borrar áreas del proyecto del equipo para ejecutar este caso; si no hay un proyecto descartable, dejar la variante sin ejecutar y explicarlo en Observaciones.

**Resultado:**

- Resultado: [ ] Pasa  [ ] Falla  [ ] Bloqueado
- Fecha / Tester / Entorno:
- Evidencia (captura, log o enlace):
- Observaciones:

---

## Caso 4: El temporizador llega a cero y finaliza la prueba

**Precondiciones:** proyecto de pruebas. Para no esperar 15 a 20 minutos, editar temporalmente en Firestore `areas/matematicas.tiempoLimite` a `0.5` (30 segundos) y restaurarlo a `20` al terminar. Para el simulacro, hacer lo mismo con las 5 áreas (por ejemplo `0.5` cada una, 2 minutos y medio en total).

**Pasos:**

1. Iniciar un cuestionario de Matemáticas (8 preguntas). Responder solo 2 preguntas.
2. No tocar nada más y esperar a que el temporizador llegue a `00:00`.
3. Repetir con el simulacro (botón "Iniciar simulacro" de Práctica), sin responder nada.
4. Repetir el paso 1 en un ancho de 375 px, desplazándose por las preguntas y la "Navegación de preguntas" mientras corre el tiempo.

**Resultado esperado:**

- El temporizador cuenta hacia atrás en vivo y es visible en todo momento. En pantallas de hasta 700 px aparece en un bloque fijo centrado en la parte inferior de la pantalla (no en el encabezado) y no se mueve ni queda fuera de la vista al desplazarse por la página; desde 701 px está en el encabezado.
- Al llegar a `00:00` la prueba se finaliza sola y se navega a `/resultados/{cuestionarioId}_{uid}` sin pulsar "Finalizar" y sin pedir confirmación, aunque haya preguntas sin responder.
- Se califican las respuestas registradas hasta ese momento: en el paso 1, 2 respondidas (las que sean correctas suman) y 6 sin responder (incorrectas). En el paso 3, 0 correctas y 30 incorrectas.
- El resultado queda guardado y `tiempoEmpleado` es igual a la duración total en segundos (30 en el paso 1).

**Resultado:**

- Resultado: [ ] Pasa  [ ] Falla  [ ] Bloqueado
- Fecha / Tester / Entorno:
- Evidencia (captura, log o enlace):
- Observaciones:

---

## Caso 5: Cambio de respuesta

**Precondiciones:** sesión iniciada; un cuestionario por área en curso.

**Pasos:**

1. En la pregunta 1, elegir la opción A. Luego elegir la opción B. Verificar el resaltado.
2. Ir a la pregunta 2 y volver a la 1.
3. Responder el resto y finalizar.
4. En Firestore, abrir `resultados/{cuestionarioId}_{uid}/respuestas` y buscar la respuesta de la pregunta 1.
5. Opcional: abrir "Ver retroalimentación" y revisar qué opción figura como seleccionada.

**Resultado esperado:**

- En la pantalla solo queda marcada la última opción elegida (B), y sigue marcada al volver a la pregunta.
- La subcolección `respuestas` tiene exactamente un documento por pregunta (8 en un cuestionario del seed), sin repetir `preguntaId`.
- La respuesta de la pregunta 1 tiene `respuestaSeleccionada: "B"` y `esCorrecta` calculado por el servidor.

**Resultado:**

- Resultado: [ ] Pasa  [ ] Falla  [ ] Bloqueado
- Fecha / Tester / Entorno:
- Evidencia (captura, log o enlace):
- Observaciones:

---

## Caso 6: Finalizar con preguntas sin responder

**Precondiciones:** sesión iniciada; un simulacro en curso.

**Pasos:**

1. Responder solo la pregunta 1.
2. Usar la "Navegación de preguntas" para saltar a la última pregunta (la 30). Verificar qué botón aparece en las demás preguntas y en la última.
3. Tocar "Finalizar" y, en el aviso del navegador, cancelar.
4. Tocar "Finalizar" otra vez y aceptar.
5. Repetir con otro simulacro respondiendo las 30 preguntas y tocar "Finalizar".

**Resultado esperado:**

- Mientras no se esté en la última pregunta aparece "Siguiente", no "Finalizar".
- En la última pregunta aparece "Finalizar".
- Pasos 3 y 4: el aviso dice "Te quedan 29 pregunta(s) sin responder. ¿Querés finalizar igual?". Al cancelar, la prueba no se envía y se permanece en la misma pregunta con el temporizador corriendo. Al aceptar, la prueba se envía.
- Las preguntas sin responder se guardan con `respuestaSeleccionada: null` y cuentan como incorrectas; el puntaje se calcula sobre las 30 preguntas.
- Mientras se envía, el botón muestra "Enviando..." y queda deshabilitado (no se puede enviar dos veces).
- Paso 5: con todas las preguntas respondidas no aparece ningún aviso y la prueba se envía directamente.

**Resultado:**

- Resultado: [ ] Pasa  [ ] Falla  [ ] Bloqueado
- Fecha / Tester / Entorno:
- Evidencia (captura, log o enlace):
- Observaciones:

---

## Caso 7: Acceso sin autenticación

**Precondiciones:** ninguna sesión iniciada: usar una ventana privada, o cerrar sesión desde `/perfil` con el botón "Cerrar sesión" (pide confirmación y navega a `/`).

**Pasos:**

1. Abrir directamente `/practica/cuestionario`.
2. Abrir directamente `/practica`, `/historial` y `/resultados/cualquier_id`.
3. En Firestore, comprobar si se creó un documento nuevo en `cuestionarios`.

**Resultado esperado:**

- Se muestra brevemente "Verificando sesión..." y se redirige a `/` (pantalla de inicio de sesión) en los tres casos.
- No se carga ninguna pregunta ni se crea ningún documento en `cuestionarios`.

**Resultado:**

- Resultado: [ ] Pasa  [ ] Falla  [ ] Bloqueado
- Fecha / Tester / Entorno:
- Evidencia (captura, log o enlace):
- Observaciones:

---

## Caso 8: Registro correcto del resultado en Firestore

**Precondiciones:** cuenta de prueba nueva o conocida; un simulacro completo respondido y finalizado a mano (no por tiempo).

**Pasos:**

1. Finalizar el simulacro del caso 2 respondiendo 18 preguntas correctamente.
2. Verificar la navegación y la pantalla de resultados.
3. En Firestore, abrir `resultados/{cuestionarioId}_{uid}` y su subcolección `respuestas`.

**Resultado esperado:**

- Se navega a `/resultados/{cuestionarioId}_{uid}` y se muestra `60%` ("Aprobado"), 30 preguntas, 18 correctas, 12 incorrectas.
- El documento de `resultados` tiene `usuarioId` igual al UID de la sesión, `cuestionarioId`, `puntaje: 60`, `respuestasCorrectas: 18`, `respuestasIncorrectas: 12`, `tiempoEmpleado` (segundos, número entero) y `fecha`.
- `respuestas` tiene 30 documentos, cada uno con `preguntaId`, `respuestaSeleccionada`, `esCorrecta` y `usuarioId` igual al UID de la sesión.
- El `usuarioId` no depende de lo que envíe el cliente: lo asigna la función con la sesión autenticada.

**Resultado:**

- Resultado: [ ] Pasa  [ ] Falla  [ ] Bloqueado
- Fecha / Tester / Entorno:
- Evidencia (captura, log o enlace):
- Observaciones:

---

## Caso 9: Persistencia al recargar la página durante una prueba

**Precondiciones:** sesión iniciada; un simulacro o cuestionario por área en curso con 2 o 3 preguntas respondidas y el temporizador avanzado.

**Pasos:**

1. Anotar el tiempo restante y las respuestas dadas.
2. Recargar la página (F5).
3. Observar la pantalla y el temporizador. En Firestore, revisar los documentos de `cuestionarios`.

**Resultado esperado (comportamiento actual de diseño):**

- No hay persistencia del progreso. La prueba se prepara desde cero: se crea un documento nuevo en `cuestionarios`, las preguntas se vuelven a barajar, el temporizador reinicia con la duración completa y las respuestas anteriores se pierden. No hay errores.
- El documento de `cuestionarios` de la prueba abandonada queda sin resultado asociado (documento huérfano).
- Anotar si, después de recargar, sigue siendo el mismo tipo de prueba (el área elegida se conserva en el historial del navegador) o pasa a ser un simulacro general.

**Resultado:**

- Resultado: [ ] Pasa  [ ] Falla  [ ] Bloqueado
- Fecha / Tester / Entorno:
- Evidencia (captura, log o enlace):
- Observaciones:

---

## Caso 10: Fallo de envío y botón "Reintentar"

**Precondiciones:** proyecto de pruebas, sesión iniciada como estudiante, DevTools abierto (pestaña Red).

**Pasos:**

1. Iniciar un cuestionario por área y responder 3 preguntas.
2. En DevTools, pasar la red a "Sin conexión" (Offline).
3. Saltar a la última pregunta y tocar "Finalizar" (aceptar el aviso de preguntas sin responder).
4. Observar la pantalla y el temporizador.
5. Volver a poner la red en línea y tocar "Reintentar".
6. En Firestore, revisar `resultados` y `usuarios/{uid}`.

**Resultado esperado:**

- Paso 3: el botón pasa un momento por "Enviando..." y vuelve a "Finalizar" habilitado; aparece un bloque con "No se pudo enviar tu prueba. Revisá tu conexión y volvé a intentar." y un botón "Reintentar". No se navega a Resultados.
- Paso 4: las 3 respuestas siguen marcadas y el temporizador sigue corriendo. Si llega a cero con el error a la vista, la prueba se vuelve a intentar sola.
- Paso 5: con red, "Reintentar" muestra "Enviando..." y navega a `/resultados/{cuestionarioId}_{uid}` con el puntaje de las 3 respuestas.
- Paso 6: existe un único documento `resultados/{cuestionarioId}_{uid}` y el XP se sumó una sola vez. Si en el primer intento la función sí había guardado el resultado y solo se perdió la respuesta, "Reintentar" recibe `already-exists` y también navega al resultado ya guardado, sin duplicar nada.

**Resultado:**

- Resultado: [ ] Pasa  [ ] Falla  [ ] Bloqueado
- Fecha / Tester / Entorno:
- Evidencia (captura, log o enlace):
- Observaciones:

---

## Caso 11: Cuestionario por área con las mismas preguntas en pantalla y en el documento

**Precondiciones:** sesión iniciada como estudiante; seed cargado.

**Pasos:**

1. Iniciar un cuestionario de Matemáticas. Anotar los enunciados de las 8 preguntas, en el orden en que se muestran.
2. En Firestore, abrir el documento nuevo de `cuestionarios` y leer `preguntas` (`preguntaId` y `orden`). Abrir cada `preguntas/{preguntaId}` y comparar el enunciado.
3. Finalizar la prueba y abrir `resultados/{cuestionarioId}_{uid}/respuestas`.

**Resultado esperado:**

- El documento de `cuestionarios` tiene `tipo: "cuestionario"`, `areaId: "matematicas"`, `duracion: 20` y 8 entradas en `preguntas`.
- Los enunciados de las preguntas del documento, ordenados por `orden`, coinciden uno a uno con los que se vieron en pantalla.
- La subcolección `respuestas` tiene 8 documentos y sus `preguntaId` son exactamente los del documento de `cuestionarios`.

**Resultado:**

- Resultado: [ ] Pasa  [ ] Falla  [ ] Bloqueado
- Fecha / Tester / Entorno:
- Evidencia (captura, log o enlace):
- Observaciones:

---

## Caso 12: Pregunta eliminada después de la prueba

**Precondiciones:** proyecto de pruebas; una cuenta de administrador y una de estudiante. El administrador crea una pregunta temporal en el área `matematicas` desde `/admin/preguntas`.

**Pasos:**

1. Como estudiante, iniciar un cuestionario de Matemáticas (con el seed hay 8 preguntas; con la temporal son 9 y entran todas, así que la temporal aparece) y finalizar la prueba.
2. Como administrador, en `/admin/preguntas`, tocar "Eliminar" sobre la pregunta temporal y leer el aviso antes de confirmar.
3. Como estudiante, abrir el resultado y tocar "Ver retroalimentación".

**Resultado esperado:**

- Paso 2: el aviso dice "¿Seguro que querés eliminar esta pregunta?" y advierte que, si ya se usó en pruebas completadas, esos resultados dejarán de mostrarla en la retroalimentación y que la acción no se puede deshacer.
- Paso 3: la retroalimentación muestra las demás preguntas y, en el encabezado, "1 pregunta de esta prueba ya no está disponible porque fue eliminada del banco.". El resultado (puntaje, correctas, incorrectas) no cambia.

**Resultado:**

- Resultado: [ ] Pasa  [ ] Falla  [ ] Bloqueado
- Fecha / Tester / Entorno:
- Evidencia (captura, log o enlace):
- Observaciones:

---

## Notas finales

- Ejecutar las pruebas con `npm run dev` y revisar la consola del navegador en cada caso.
- Validar los datos en Firebase donde se indique.
- Si algún caso falla, registrar los pasos exactos para reproducirlo.
- Casos de gamificación (XP, nivel, logros) y de seguridad de datos: `docs/qa/casos-prueba-gamificacion.md` y `docs/qa/verificacion-rbac.md`.
