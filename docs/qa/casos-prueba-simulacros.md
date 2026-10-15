# QA - Casos de prueba de cuestionarios y simulacros

Este documento describe los casos de prueba del flujo de evaluación de LearnFex: elegir un área, armar un cuestionario o un simulacro, responder con temporizador, finalizar y guardar el resultado.

- Estado del documento: plantilla de ejecución. Ningún caso fue ejecutado todavía; todas las casillas de resultado están vacías a propósito.
- Verificado contra el código de `main` en el commit `f17a14c`. Si `main` cambió desde entonces, revisar los casos antes de ejecutarlos.
- Autoría original del borrador: Juliana Martínez (PR #60). Corregido contra el código real.
- Basado en la ERS, sección 3.1.2 (Evaluación). Requisitos que cubre: selección de materia (RF-006), cuestionarios (RF-007), simulacro completo con las cinco áreas (RF-008), temporizador (RF-009) y calificación automática (RF-010).

---

## Cómo funciona hoy (resumen verificado en el código)

- Práctica (`/practica`) lista las áreas de la colección `areas` (tarjetas, filtros y buscador). Tocar un área navega a `/practica/cuestionario` con el `areaId`. El botón "+ Nueva práctica" inicia el primer área de la lista filtrada; no inicia un simulacro. En pantallas de hasta 600 px el encabezado de acciones ("Historial" y "+ Nueva práctica") se oculta por CSS.
- **No existe ningún botón ni enlace para iniciar el simulacro general.** El simulacro se inicia entrando a `/practica/cuestionario` sin `areaId` (por ejemplo, escribiendo la URL). Ver la brecha en el caso 2.
- `/practica/cuestionario` y `/resultados/:id` están dentro de las rutas privadas pero fuera del layout del estudiante: no tienen barra de navegación superior ni inferior.
- Un cuestionario por área toma hasta 10 preguntas del área al azar (`armarCuestionario`, por defecto 10), dura el `tiempoLimite` del área en minutos (20 si el área no lo define) y crea un documento en `cuestionarios` de tipo `cuestionario`.
- El simulacro (`armarSimulacro` en `src/services/quizService.js`) recorre todas las áreas existentes, toma `numPreguntas` preguntas al azar de cada una y suma los `tiempoLimite` de todas. Crea un documento en `cuestionarios` de tipo `simulacro` con `areaId: null`. **No valida que cada área aporte preguntas ni que estén las cinco áreas**; solo usa las áreas que haya en `areas`.
- Con los datos del seed (`scripts/seed-preguntas.js`): 5 áreas con 4 preguntas cada una. Cuestionario por área: 4 preguntas. Simulacro: 20 preguntas y 95 minutos (20 + 20 + 20 + 20 + 15; Inglés tiene 15).
- El orden de las áreas dentro del simulacro es el que devuelve Firestore al listar `areas` (por ID de documento), y la pantalla no indica a qué área pertenece cada pregunta.
- Las respuestas se guardan solo en memoria hasta finalizar. El botón "Finalizar" aparece únicamente en la última pregunta. Se puede saltar entre preguntas con la "Navegación de preguntas". No hay confirmación si quedan preguntas sin responder.
- Al finalizar (o al llegar el temporizador a cero) el cliente llama a la Cloud Function `calificarPrueba` y navega a `/resultados/{cuestionarioId}_{uid}`. La función guarda el resultado, una respuesta por pregunta (con `esCorrecta` calculado en el servidor) y aplica la gamificación.
- Quien envía las respuestas no puede indicar el `usuarioId`: la función toma la identidad de la sesión.

---

## Precondiciones generales

- Aplicación corriendo con `npm run dev`, apuntando a un proyecto de Firebase de pruebas, con la función `calificarPrueba` desplegada (si no, al finalizar aparece "No se pudo calificar el cuestionario.").
- Datos del seed cargados (5 áreas, 20 preguntas).
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
- Cada cuestionario carga preguntas reales de Firestore del área elegida: el encabezado muestra el nombre del área, el contador dice "Pregunta 1 de 4" (con el seed) y el temporizador arranca en `20:00` (`15:00` en Inglés).
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

1. En `/practica` y en `/inicio`, buscar un botón o enlace para iniciar un simulacro.
2. Escribir `/practica/cuestionario` en la barra de direcciones y entrar.
3. Revisar el encabezado, el contador, el temporizador y recorrer las preguntas con "Siguiente" y la "Navegación de preguntas".
4. En Firestore, abrir el nuevo documento de `cuestionarios`.

**Resultado esperado:**

- Paso 1: no existe ningún acceso al simulacro desde la interfaz (comportamiento actual).
- Paso 3: el encabezado dice "Simulacro general", el contador "Pregunta 1 de 20" y el temporizador `95:00`. El simulacro incluye 4 preguntas de cada una de las 5 áreas (20 en total). No hay opción para omitir un área: todas las preguntas están en la misma secuencia.
- Paso 4: el documento tiene `tipo: "simulacro"`, `areaId: null`, `titulo: "Simulacro general"`, `duracion: 95`, `estado: "activo"` y `preguntas` con 20 entradas `{preguntaId, orden}`.

**Comportamiento actual conocido (brechas):**

- No hay forma de iniciar el simulacro desde la interfaz; hay que escribir la URL. La ERS (RF-008, CU-03) espera una opción "Simulacro completo".
- El campo `orden` y el conjunto de preguntas guardados en `cuestionarios` no son los mismos que se muestran: el documento se arma con una consulta y la pantalla vuelve a consultar y barajar las preguntas por separado (`quizService.js` y `Quiz.jsx`). Con el seed (todas las preguntas de cada área entran en el simulacro) el conjunto coincide pero el orden no. Con un banco más grande el conjunto también puede diferir. Comparar los `preguntaId` del documento con los mostrados y anotar las diferencias.

**Resultado:**

- Resultado: [ ] Pasa  [ ] Falla  [ ] Bloqueado
- Fecha / Tester / Entorno:
- Evidencia (captura, log o enlace):
- Observaciones:

---

## Caso 3: Simulacro cuando faltan preguntas en un área (brecha frente a RF-008)

La ERS (RF-008) pide no permitir omitir un área. El código actual no valida esto: este caso documenta el comportamiento real.

**Precondiciones:** proyecto de pruebas. En la consola de Firestore, crear temporalmente `areas/area_vacia_prueba` con `nombre: "Área vacía de prueba"`, `descripcion: "temporal"`, `numPreguntas: 4`, `tiempoLimite: 5` y sin ninguna pregunta que apunte a ella. Borrar ese documento al terminar.

**Pasos:**

1. Ir a `/practica` y verificar que aparece "Área vacía de prueba".
2. Tocar esa área.
3. Volver y escribir `/practica/cuestionario` para iniciar un simulacro.
4. Revisar el contador, el temporizador y los documentos nuevos de `cuestionarios`.

**Resultado esperado (comportamiento actual):**

- Paso 2: se muestra "No hay preguntas disponibles." y no se puede continuar.
- Paso 3: el simulacro **sí inicia**, con las 20 preguntas de las 5 áreas reales y sin avisar que un área no aportó preguntas. El temporizador suma también los 5 minutos del área vacía (`100:00`).

**Resultado esperado según la ERS (no se cumple hoy):** el simulacro no debería iniciar, o debería avisar, si falta alguna de las cinco áreas. Como todavía no hay tarjeta que agregue esa validación, si el paso 3 falla respecto de la ERS se registra como "falla conocida" y se anota la brecha para abrir una tarjeta.

**Resultado:**

- Resultado: [ ] Pasa  [ ] Falla  [ ] Bloqueado
- Fecha / Tester / Entorno:
- Evidencia (captura, log o enlace):
- Observaciones:

---

## Caso 4: El temporizador llega a cero y finaliza la prueba

**Precondiciones:** proyecto de pruebas. Para no esperar 15 a 20 minutos, editar temporalmente en Firestore `areas/matematicas.tiempoLimite` a `0.5` (30 segundos) y restaurarlo a `20` al terminar. Para el simulacro, hacer lo mismo con las 5 áreas (por ejemplo `0.5` cada una, 2 minutos y medio en total).

**Pasos:**

1. Iniciar un cuestionario de Matemáticas. Responder solo 2 preguntas.
2. No tocar nada más y esperar a que el temporizador llegue a `00:00`.
3. Repetir con el simulacro (`/practica/cuestionario`), sin responder nada.

**Resultado esperado:**

- El temporizador cuenta hacia atrás en vivo y es visible en todo momento (en pantallas de hasta 700 px aparece debajo de las preguntas, no en el encabezado).
- Al llegar a `00:00` la prueba se finaliza sola y se navega a `/resultados/{cuestionarioId}_{uid}` sin pulsar "Finalizar".
- Se califican las respuestas registradas hasta ese momento: en el paso 1, 2 respondidas (las que sean correctas suman) y 2 sin responder (incorrectas). En el paso 3, 0 correctas y 20 incorrectas.
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
- La subcolección `respuestas` tiene exactamente un documento por pregunta (4 en un cuestionario del seed), sin repetir `preguntaId`.
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
2. Usar la "Navegación de preguntas" para saltar a la última pregunta (la 20). Verificar qué botón aparece en las demás preguntas y en la última.
3. Tocar "Finalizar".

**Resultado esperado:**

- Mientras no se esté en la última pregunta aparece "Siguiente", no "Finalizar".
- En la última pregunta aparece "Finalizar". Al tocarlo no se pide confirmación y la prueba se envía.
- Las preguntas sin responder se guardan con `respuestaSeleccionada: null` y cuentan como incorrectas; el puntaje se calcula sobre las 20 preguntas.
- Mientras se envía, el botón muestra "Enviando..." y queda deshabilitado (no se puede enviar dos veces).

**Resultado:**

- Resultado: [ ] Pasa  [ ] Falla  [ ] Bloqueado
- Fecha / Tester / Entorno:
- Evidencia (captura, log o enlace):
- Observaciones:

---

## Caso 7: Acceso sin autenticación

**Precondiciones:** ninguna sesión iniciada (ventana privada, o cerrar sesión). La interfaz actual no tiene botón de "Cerrar sesión" en `main`: usar una ventana privada o borrar los datos del sitio desde DevTools.

**Pasos:**

1. Abrir directamente `/practica/cuestionario`.
2. Abrir directamente `/practica` y `/resultados/cualquier_id`.
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

1. Finalizar el simulacro del caso 2 respondiendo 12 preguntas correctamente.
2. Verificar la navegación y la pantalla de resultados.
3. En Firestore, abrir `resultados/{cuestionarioId}_{uid}` y su subcolección `respuestas`.

**Resultado esperado:**

- Se navega a `/resultados/{cuestionarioId}_{uid}` y se muestra `60%` ("Aprobado"), 20 preguntas, 12 correctas, 8 incorrectas.
- El documento de `resultados` tiene `usuarioId` igual al UID de la sesión, `cuestionarioId`, `puntaje: 60`, `respuestasCorrectas: 12`, `respuestasIncorrectas: 8`, `tiempoEmpleado` (segundos, número entero) y `fecha`.
- `respuestas` tiene 20 documentos, cada uno con `preguntaId`, `respuestaSeleccionada`, `esCorrecta` y `usuarioId` igual al UID de la sesión.
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

## Notas finales

- Ejecutar las pruebas con `npm run dev` y revisar la consola del navegador en cada caso.
- Validar los datos en Firebase donde se indique.
- Si algún caso falla, registrar los pasos exactos para reproducirlo.
- Casos de gamificación (XP, nivel, logros) y de seguridad de datos: `docs/qa/casos-prueba-gamificacion.md` y `docs/qa/verificacion-rbac.md`.
