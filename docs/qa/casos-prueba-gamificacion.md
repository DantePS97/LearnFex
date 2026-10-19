# QA - Casos de prueba de calificación y gamificación

Este documento describe los casos de prueba para validar la calificación de pruebas y el sistema de gamificación (XP, nivel, ranking y logros) de LearnFex.

- Estado del documento: plantilla de ejecución. Ningún caso fue ejecutado todavía; todas las casillas de resultado están vacías a propósito.
- Verificado contra el código de `main` en el commit `99a359d` (2026-10-19). Si `main` cambió desde entonces, revisar los casos antes de ejecutarlos.
- Autoría original del borrador: Juliana Martínez (PR #59). Corregido contra el código real y actualizado tras el cambio del seed a 40 preguntas (PR #65), el menú completo de Perfil (PR #53) y el Sprint 7: Inicio con datos reales (PR #82), aviso de logro (PR #95), XP al día sin recargar (PR #97), confirmar al finalizar (PR #94), reglas de Firestore (PR #93 y #108).
- Requisitos que cubre (ERS 3.1.2 y 3.1.4): calificación automática de cuestionarios y simulacros (RF-010), XP por completar pruebas (RF-015), niveles y logros (RF-016), ranking (RF-017).

---

## Cómo funciona hoy (resumen verificado en el código)

Conocer esto evita marcar como defecto un comportamiento que es correcto.

- La calificación y la gamificación corren en la Cloud Function `calificarPrueba` (`functions/src/`), no en el cliente. El cliente solo envía las respuestas.
- El puntaje es un porcentaje entero: `Math.round(correctas / total * 100)` (`functions/src/calificacion.js`). No es la cantidad de respuestas correctas.
- Una pregunta sin responder cuenta como incorrecta.
- XP ganado por prueba: `min(correctas * 10, 100)` (`functions/src/gamificacion.js`). Con 0 correctas no se gana XP.
- Nivel: `max(floor(xp / 1000) + 1, nivelActual)`. El nivel nunca baja.
- Logros del seed: `primer_quiz` ("Primer paso", al completar la 1.ª prueba), `cinco_simulacros` ("Estudiante dedicado", 5 pruebas), `diez_simulacros` ("Maestro de las áreas", 10 pruebas). Se cuentan los resultados guardados, sin importar cuántas respuestas fueron correctas ni si fue cuestionario o simulacro.
- El ranking (`ranking/{uid}`) lo escribe la misma función: `puntajeAcumulado` es igual al XP del estudiante.
- Los logros se ven en `/logros` (se llega desde Perfil, botón "Logros"; no está en la barra de navegación). El Perfil muestra correo, rol, XP y nivel, el menú (Logros, Mi progreso, Historial, Configuración, Cerrar sesión) y el formulario de datos personales; no lista logros.
- Cuando la prueba desbloquea logros, la función los devuelve en `nuevosLogros`, el cliente los pasa a `/resultados/{id}` y esa pantalla muestra una tarjeta "¡Logro desbloqueado!" con el nombre de cada uno (busca el nombre en el catálogo de `logros`). El aviso solo aparece al llegar desde la prueba: no aparece al recargar el resultado ni al abrirlo desde el historial.
- Inicio (`/inicio`) muestra datos reales del perfil: el nombre, "Tu nivel", "Puntos" (XP), "Para subir de nivel" (1000 menos el resto de XP en el nivel) y "Progreso del nivel" (porcentaje). Ya no hay racha ni valores fijos.
- Inicio y Perfil toman el XP y el nivel del contexto de sesión (`AuthContext`), que se carga al iniciar sesión y se vuelve a leer (`refreshProfile`) cada vez que se abre una pantalla de resultados. Por eso, tras una prueba, ya se ven al día sin recargar.
- El resultado se guarda con ID determinista `{cuestionarioId}_{uid}`. Reenviar la misma prueba devuelve `already-exists` y el cliente navega a `/resultados/{cuestionarioId}_{uid}`.

## Seguridad: estado de las reglas

`firestore.rules` de `main` cierra la manipulación de la gamificación desde el cliente: el propio usuario solo puede actualizar `nombre`, `apellido` y `colegio`; `resultados`, `respuestas` y `logrosObtenidos` tienen `create: false`; `ranking` tiene `write: false`. Los casos 15 a 19 describen ese comportamiento correcto y todos deben pasar. Las versiones anteriores de este documento los marcaban como "esperado a fallar hasta la tarjeta 6-36"; ya no aplica. Si alguno falla, es una regresión: registrar los datos exactos. Las reglas dependen además del estado de la cuenta (`estado`, lista blanca): ver `docs/qa/verificacion-rbac.md`.

---

## Precondiciones generales

- Aplicación corriendo con `npm run dev`, apuntando a un proyecto de Firebase de pruebas (nunca datos reales).
- Función `calificarPrueba` desplegada en ese proyecto. Si no lo está, al finalizar una prueba aparece "No se pudo enviar tu prueba. Revisá tu conexión y volvé a intentar." con el botón "Reintentar".
- Datos cargados con `scripts/seed-preguntas.js`: 5 áreas, 40 preguntas (8 por área: 2 de dificultad baja, 3 media y 3 alta) y los 3 logros. Si el proyecto de pruebas ya tenía el seed anterior (20 preguntas), volver a ejecutar el script: usa IDs fijos (`seed_1` a `seed_40`) y `setDoc`, así que sobrescribe las áreas (con `numPreguntas: 6`) y agrega las preguntas nuevas.
- Con ese banco, un cuestionario por área tiene 8 preguntas (pide 10 y el área solo tiene 8: `quizService.js` usa `cantidad = 10` por defecto y `Practice.jsx` no pasa otra cantidad; el campo `numPreguntas` del área no se usa en el cuestionario por área). El simulacro tiene 30 preguntas (6 de cada una de las 5 áreas, según `numPreguntas`) y dura 95 minutos.
- Una cuenta de estudiante de prueba nueva (XP 0, nivel 1, sin resultados ni logros). Para repetir casos, crear otra cuenta en `/registro`.
- Acceso de lectura a la consola de Firestore. Algunos casos piden editar `usuarios/{uid}` a mano: hacerlo solo en el proyecto de pruebas y con cuentas de prueba.
- Cómo conocer la respuesta correcta de cada pregunta: campo `respuestaCorrecta` (una letra A-D) en la colección `preguntas` de la consola, o en `scripts/seed-preguntas.js`. Las preguntas se muestran en orden aleatorio: identificarlas por el enunciado.
- Cómo iniciar un simulacro: en `/practica`, bloque "Simulacro completo", botón "Iniciar simulacro". Un cuestionario por área se inicia desde Práctica, tocando un área.
- El Perfil y Inicio muestran el XP y el nivel del contexto de sesión, que se vuelve a leer al abrir la pantalla de resultados: tras una prueba ya se ven al día sin recargar. Ver el caso 5. Un cambio hecho directamente en la consola de Firestore sí requiere recargar la página (F5).
- Los casos 15 a 19 (seguridad) se ejecutan con el simulador de reglas de Firestore (Rules Playground, en la consola de Firebase) o con el emulador de Firestore usando `firestore.rules` del repositorio. El simulador permite elegir la operación, la ruta, el UID autenticado y los datos del documento. Para `update` ingresar el documento completo tal como quedaría tras la escritura. Las reglas leen `usuarios/{uid}` del actor (`rol` y `estado`): ese documento debe existir en el proyecto o emulador con los valores que se quieran simular.

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
- Un caso marcado "Esperado a fallar" y que falla exactamente como dice "Comportamiento actual conocido" se registra como **Falla** con la observación "falla conocida" y la tarjeta que lo resuelve. Solo se abre un defecto nuevo si falla de otra manera. Cuando se cierre la tarjeta, el caso debe pasar.
- Adjuntar evidencia (captura, log o enlace) en cada caso ejecutado.

---

## Caso 1: El puntaje es un porcentaje de aciertos

**Precondiciones:** sesión iniciada con la cuenta de prueba; respuestas correctas del área Matemáticas a la vista.

**Pasos:**

1. Ir a Práctica y tocar el área Matemáticas.
2. Responder 6 preguntas correctamente y 2 incorrectamente (el cuestionario tiene 8).
3. En la última pregunta, tocar "Finalizar".

**Resultado esperado:**

- Se navega a `/resultados/{cuestionarioId}_{uid}`.
- El puntaje mostrado es `75%` (no `6`), con "Preguntas: 8", "Correctas: 6" e "Incorrectas: 2".
- La etiqueta de estado es "Aprobado" (el umbral es 60%).
- En Firestore, `resultados/{cuestionarioId}_{uid}` tiene `puntaje: 75`, `respuestasCorrectas: 6` y `respuestasIncorrectas: 2`.

**Resultado:**

- Resultado: [ ] Pasa  [ ] Falla  [ ] Bloqueado
- Fecha / Tester / Entorno:
- Evidencia (captura, log o enlace):
- Observaciones:

---

## Caso 2: Preguntas sin responder y 0 correctas

**Precondiciones:** cuenta de prueba (puede ser la misma del caso 1, con otro cuestionario).

**Pasos:**

1. Iniciar un cuestionario por área (8 preguntas).
2. Navegar hasta la última pregunta sin responder ninguna. Tocar "Finalizar" y, en el aviso del navegador, aceptar.
3. Repetir con otro cuestionario respondiendo solo 2 preguntas, correctamente, y dejando las otras 6 sin responder. Aceptar el aviso.

**Resultado esperado:**

- Al tocar "Finalizar" con preguntas sin responder aparece el aviso "Te quedan N pregunta(s) sin responder. ¿Querés finalizar igual?" (N = 8 en el paso 2 y 6 en el paso 3). Si se cancela, no se envía nada. Solo al aceptar se envía la prueba.
- Paso 2: puntaje `0%`, "Correctas: 0", "Incorrectas: 8", estado "No aprobado". La prueba se guarda igual.
- Paso 3: puntaje `25%`, "Correctas: 2", "Incorrectas: 6", estado "No aprobado". Las preguntas sin responder cuentan como incorrectas y el porcentaje se calcula sobre todas las preguntas de la prueba.

**Resultado:**

- Resultado: [ ] Pasa  [ ] Falla  [ ] Bloqueado
- Fecha / Tester / Entorno:
- Evidencia (captura, log o enlace):
- Observaciones:

---

## Caso 3: Prueba con todas las respuestas correctas y umbral de aprobación

**Precondiciones:** cuenta de prueba.

**Pasos:**

1. Iniciar un cuestionario por área y responder las 8 preguntas correctamente. Finalizar.
2. Iniciar otro y responder 4 correctamente y 4 incorrectamente. Finalizar.

**Resultado esperado:**

- Paso 1: `100%`, "Aprobado".
- Paso 2: `50%`, "No aprobado" (menos de 60%).

**Resultado:**

- Resultado: [ ] Pasa  [ ] Falla  [ ] Bloqueado
- Fecha / Tester / Entorno:
- Evidencia (captura, log o enlace):
- Observaciones:

---

## Caso 4: Redondeo del puntaje (opcional)

El redondeo ya está cubierto por la prueba automática `functions/test/calificacion.test.js` ("mezcla de aciertos redondea el puntaje"). Este caso manual es opcional: con el seed actual cada cuestionario por área tiene 8 preguntas, un total que no divide a 100, así que se puede ejecutar sin crear datos extra.

**Precondiciones:** cuenta de prueba y el seed cargado (8 preguntas por cuestionario de área).

**Pasos:**

1. Iniciar un cuestionario por área y responder 1 pregunta correctamente (las otras 7 incorrectas o sin responder).
2. Repetir respondiendo 3 correctamente.

**Resultado esperado:**

- 1 de 8: `13%` (12,5 redondea hacia arriba). 3 de 8: `38%` (37,5 redondea hacia arriba). El puntaje siempre es un entero.

**Resultado:**

- Resultado: [ ] Pasa  [ ] Falla  [ ] Bloqueado
- Fecha / Tester / Entorno:
- Evidencia (captura, log o enlace):
- Observaciones:

---

## Caso 5: El XP aumenta 10 por respuesta correcta

**Precondiciones:** cuenta de prueba nueva (XP 0, nivel 1).

**Pasos:**

1. Abrir `/perfil` y anotar XP y nivel.
2. Completar un cuestionario por área con exactamente 3 respuestas correctas (las otras 5, incorrectas o sin responder).
3. En Firestore, abrir `usuarios/{uid}` y `ranking/{uid}`.
4. Desde Resultados, tocar "Volver al inicio" y revisar las tarjetas de Inicio; luego abrir `/perfil` con el menú, sin recargar la página, y anotar el XP mostrado.
5. Recargar la página (F5) en `/perfil` y anotar el XP.
6. Abrir `/ranking`.

**Resultado esperado:**

- Paso 3: `usuarios/{uid}.xp` es 30 y `nivel` es 1. `ranking/{uid}.puntajeAcumulado` es 30.
- Paso 4: sin recargar, Inicio muestra "Puntos 30", "Para subir de nivel 970 XP" y "Progreso del nivel 3%", y el Perfil muestra XP 30 y nivel 1 (la pantalla de resultados vuelve a leer el perfil al abrirse).
- Paso 5: el Perfil sigue mostrando XP 30 y nivel 1.
- Paso 6: el estudiante aparece en el ranking con "30 pts" y la insignia "Tú".

**Resultado:**

- Resultado: [ ] Pasa  [ ] Falla  [ ] Bloqueado
- Fecha / Tester / Entorno:
- Evidencia (captura, log o enlace):
- Observaciones:

---

## Caso 6: Con 0 correctas no se gana XP, pero la prueba cuenta como completada

**Precondiciones:** cuenta de prueba nueva (XP 0, sin resultados ni logros).

**Pasos:**

1. Completar un cuestionario por área sin responder ninguna pregunta (0 correctas).
2. En Firestore, revisar `usuarios/{uid}`, `ranking/{uid}` y `usuarios/{uid}/logrosObtenidos`.
3. Abrir `/logros`.

**Resultado esperado:**

- `usuarios/{uid}.xp` sigue en 0 y el nivel en 1.
- `ranking/{uid}` existe con `puntajeAcumulado: 0`.
- Se otorgó el logro `primer_quiz`: el criterio cuenta resultados guardados, no aciertos. En `/logros`, "Primer paso" aparece como desbloqueado.

**Resultado:**

- Resultado: [ ] Pasa  [ ] Falla  [ ] Bloqueado
- Fecha / Tester / Entorno:
- Evidencia (captura, log o enlace):
- Observaciones:

---

## Caso 7: Tope de 100 XP por prueba

**Precondiciones:** cuenta de prueba con XP conocido. Hace falta un simulacro (30 preguntas): con el banco del seed ningún cuestionario por área (8 preguntas) alcanza 10 correctas.

**Pasos:**

1. Anotar el XP actual (en Firestore).
2. Iniciar un simulacro (ver precondiciones generales) y responder 15 preguntas correctamente. Finalizar.
3. Comparar el XP en Firestore con el anotado.
4. Iniciar otro simulacro y responder exactamente 9 correctamente. Finalizar.
5. Iniciar otro y responder exactamente 10 correctamente. Finalizar.

**Resultado esperado:**

- Paso 3: el XP subió 100, no 150.
- Paso 4: el XP subió 90.
- Paso 5: el XP subió 100.

**Resultado:**

- Resultado: [ ] Pasa  [ ] Falla  [ ] Bloqueado
- Fecha / Tester / Entorno:
- Evidencia (captura, log o enlace):
- Observaciones:

---

## Caso 8: Múltiples pruebas seguidas acumulan XP sin pérdidas

**Precondiciones:** cuenta de prueba nueva (XP 0).

**Pasos:**

1. Completar 3 cuestionarios por área seguidos (8 preguntas cada uno), con 4, 2 y 3 respuestas correctas respectivamente.
2. Revisar `usuarios/{uid}.xp` y `ranking/{uid}.puntajeAcumulado` después de cada prueba.
3. Abrir `/resultados/{id}` de cada una (o revisar la colección `resultados`).

**Resultado esperado:**

- XP acumulado: 40, luego 60, luego 90. `ranking/{uid}.puntajeAcumulado` coincide con el XP en cada paso.
- Existen 3 documentos en `resultados`, uno por prueba, con su propio puntaje (50%, 25% y 38%, calculados sobre 8 preguntas). Ningún resultado se sobrescribe ni se pierde.

**Resultado:**

- Resultado: [ ] Pasa  [ ] Falla  [ ] Bloqueado
- Fecha / Tester / Entorno:
- Evidencia (captura, log o enlace):
- Observaciones:

---

## Caso 9: Dos pruebas finalizadas casi al mismo tiempo (opcional)

**Precondiciones:** cuenta de prueba con XP conocido; dos pestañas del navegador con la misma sesión.

**Pasos:**

1. En cada pestaña iniciar un cuestionario por área distinto y responder 3 preguntas correctamente.
2. Finalizar ambos en el menor intervalo posible.
3. Revisar el XP en Firestore.

**Resultado esperado:**

- El XP subió 60 en total (30 por prueba). La función actualiza el XP dentro de una transacción de Firestore, por lo que no se pierde ninguna de las dos sumas.
- Hay 2 documentos en `resultados`.

**Resultado:**

- Resultado: [ ] Pasa  [ ] Falla  [ ] Bloqueado
- Fecha / Tester / Entorno:
- Evidencia (captura, log o enlace):
- Observaciones:

---

## Caso 10: El nivel se calcula como floor(XP / 1000) + 1

**Precondiciones:** cuenta de prueba. Editar en la consola de Firestore (solo proyecto de pruebas) `usuarios/{uid}`: `xp: 950`, `nivel: 1`. Se necesita un simulacro.

**Pasos:**

1. Iniciar un simulacro y responder exactamente 5 preguntas correctamente (+50 XP). Finalizar.
2. Revisar `usuarios/{uid}`, `ranking/{uid}` y recargar `/perfil`.

**Resultado esperado:**

- `xp` es 1000 y `nivel` es 2 (el límite exacto de 1000 XP ya es nivel 2).
- `ranking/{uid}` refleja `puntajeAcumulado: 1000` y `nivel: 2`.
- El Perfil, tras recargar, muestra XP 1000 y nivel 2.

**Resultado:**

- Resultado: [ ] Pasa  [ ] Falla  [ ] Bloqueado
- Fecha / Tester / Entorno:
- Evidencia (captura, log o enlace):
- Observaciones:

---

## Caso 11: El nivel nunca baja

**Precondiciones:** cuenta de prueba. Editar en la consola (solo proyecto de pruebas) `usuarios/{uid}`: `xp: 0`, `nivel: 3`.

**Pasos:**

1. Completar un cuestionario por área con exactamente 4 respuestas correctas (las otras 4, incorrectas o sin responder).
2. Revisar `usuarios/{uid}`.

**Resultado esperado:**

- `xp` es 40 y `nivel` sigue en 3 (el nivel calculado por XP sería 1, pero se conserva el mayor).

**Resultado:**

- Resultado: [ ] Pasa  [ ] Falla  [ ] Bloqueado
- Fecha / Tester / Entorno:
- Evidencia (captura, log o enlace):
- Observaciones:

---

## Caso 12: Logro "Primer paso" automático

**Precondiciones:** cuenta de prueba nueva, sin resultados ni logros.

**Pasos:**

1. Abrir `/perfil` y tocar "Logros" (o ir a `/logros`). Verificar que "Primer paso" figura como "Bloqueado" y que no existe ningún botón para desbloquearlo.
2. Completar la primera prueba (cuestionario o simulacro), con cualquier cantidad de aciertos. Al terminar, observar la pantalla de resultados.
3. Recargar la pantalla de resultados (F5) y observar de nuevo.
4. Volver a `/perfil` y tocar "Logros".

**Resultado esperado:**

- Paso 1: se listan los 3 logros del catálogo, todos "Bloqueado". No hay acción manual para desbloquear.
- Paso 2: la pantalla de resultados muestra, además de las tarjetas de preguntas, correctas e incorrectas, una tarjeta "¡Logro desbloqueado!" con el nombre "Primer paso".
- Paso 3: tras recargar, la tarjeta "¡Logro desbloqueado!" ya no aparece (el aviso solo existe al llegar desde la prueba). El resultado sigue mostrándose igual.
- Paso 4: "Primer paso" aparece como "Desbloqueado" con la fecha de hoy. Los otros dos siguen "Bloqueado". En Firestore existe `usuarios/{uid}/logrosObtenidos/primer_quiz` con `fechaObtenido`.
- El logro se ve en `/logros`, no en el Perfil (el Perfil no lista logros).
- Si una prueba desbloquea dos logros a la vez, la pantalla muestra una tarjeta por cada uno.

**Nota:** la ERS (RF-016) pide notificar el logro obtenido; se cubre con esta tarjeta en la pantalla de resultados (PR #95). No hay notificación fuera de la aplicación.

**Resultado:**

- Resultado: [ ] Pasa  [ ] Falla  [ ] Bloqueado
- Fecha / Tester / Entorno:
- Evidencia (captura, log o enlace):
- Observaciones:

---

## Caso 13: Logros por cantidad de pruebas y sin duplicados

**Precondiciones:** cuenta de prueba nueva. Se necesitan 5 pruebas (alcanza con cuestionarios por área). El logro de 10 pruebas queda como opcional por duración.

**Pasos:**

1. Completar 4 pruebas. Abrir `/logros`.
2. Completar la 5.ª prueba. Abrir `/logros` y anotar la fecha del logro "Estudiante dedicado" y la de "Primer paso".
3. Completar una 6.ª prueba. Abrir `/logros` de nuevo.
4. Opcional: llegar a 10 pruebas y abrir `/logros`.

**Resultado esperado:**

- Paso 1: solo "Primer paso" está desbloqueado.
- Paso 2: "Estudiante dedicado" (criterio `cinco_simulacros`) se desbloquea con la 5.ª prueba, no antes; la pantalla de resultados de esa prueba muestra "¡Logro desbloqueado!" con ese nombre.
- Paso 3: las fechas de desbloqueo no cambian (un logro obtenido no se otorga otra vez) y no aparecen documentos duplicados en `logrosObtenidos`.
- Paso 4: "Maestro de las áreas" (criterio `diez_simulacros`) se desbloquea con la 10.ª prueba.

**Resultado:**

- Resultado: [ ] Pasa  [ ] Falla  [ ] Bloqueado
- Fecha / Tester / Entorno:
- Evidencia (captura, log o enlace):
- Observaciones:

---

## Caso 14: Reenviar la misma prueba no duplica XP ni resultados (avanzado, opcional)

Este caso no se puede reproducir desde la interfaz normal (el botón "Finalizar" se bloquea tras el primer envío). Requiere invocar la función `calificarPrueba` dos veces con el mismo `cuestionarioId` (emulador de funciones, o un script con `httpsCallable` en el proyecto de pruebas).

**Precondiciones:** cuenta de prueba autenticada; un `cuestionarioId` existente.

**Pasos:**

1. Invocar `calificarPrueba` con un `cuestionarioId`, sus respuestas y `tiempoEmpleado`. Anotar XP y número de documentos en `resultados`.
2. Invocar de nuevo con el mismo `cuestionarioId`.

**Resultado esperado:**

- La segunda llamada falla con el código `already-exists` ("Esta prueba ya fue enviada.").
- El XP, el ranking y los logros no cambian. No se crea un segundo resultado.
- Si el reintento viene del cliente, este navega a `/resultados/{cuestionarioId}_{uid}`.

**Resultado:**

- Resultado: [ ] Pasa  [ ] Falla  [ ] Bloqueado
- Fecha / Tester / Entorno:
- Evidencia (captura, log o enlace):
- Observaciones:

---

## Seguridad: manipulación de la gamificación desde el cliente

Los casos 15 a 19 verifican que un estudiante no pueda alterar su propio estado de gamificación saltándose la función. Se ejecutan con el simulador de reglas o el emulador (ver precondiciones generales), autenticado como el UID de la cuenta de prueba (`uid`), con un documento `usuarios/{uid}` existente de `rol: "estudiante"`, `estado: "activo"`, `xp: 100`, `nivel: 1`.

Reglas relevantes en `firestore.rules`: `esActualizacionDePerfil` y los bloques `usuarios`, `usuarios/{uid}/logrosObtenidos`, `resultados` y `ranking`. (La función `esActualizacionDeGamificacion` de versiones anteriores ya no existe.)

## Caso 15: No se puede cambiar `rol`, `estado` ni `correo`

**Precondiciones:** simulador o emulador, autenticado como `uid`.

**Pasos:**

1. Simular un `update` de `usuarios/{uid}` donde solo cambia `rol` a `"administrador"`.
2. Repetir cambiando solo `estado` a `"inactivo"` y luego solo `correo`.
3. Como control, simular un `update` que cambia solo `nombre` o `colegio`.
4. Desde la interfaz: en `/perfil`, cambiar nombre, apellido y colegio y guardar.

**Resultado esperado:**

- Pasos 1 y 2: denegado. La regla `usuarios` solo acepta que el propio usuario cambie `nombre`, `apellido` y `colegio`.
- Paso 3: permitido.
- Paso 4: se muestra "Cambios guardados correctamente" y el cambio persiste tras recargar. El formulario de Perfil nunca envía `rol`, `estado`, `xp`, `nivel` ni `correo`.

**Resultado:**

- Resultado: [ ] Pasa  [ ] Falla  [ ] Bloqueado
- Fecha / Tester / Entorno:
- Evidencia (captura, log o enlace):
- Observaciones:

---

## Caso 16: Un estudiante no puede subir su propio XP

**Precondiciones:** simulador o emulador, autenticado como `uid`, con `usuarios/{uid}.xp = 100`.

**Pasos:**

1. Simular un `update` de `usuarios/{uid}` con `xp: 200` (el resto igual).
2. Simular otro con `xp: 201`.
3. Simular otro con `xp: 50` (bajar el XP).
4. Repetir el paso 1 sobre el documento resultante varias veces.

**Resultado esperado:** los cuatro pasos son denegados. El propio usuario solo puede actualizar `nombre`, `apellido` y `colegio` (`esActualizacionDePerfil`); solo la Cloud Function (Admin SDK) modifica `xp`.

**Historial:** hasta el despliegue de las reglas de la tarjeta [Sprint 6 - 36], `xp` podía subir hasta +100 por escritura. Si alguno de los pasos queda permitido, es una regresión.

**Resultado:**

- Resultado: [ ] Pasa  [ ] Falla  [ ] Bloqueado
- Fecha / Tester / Entorno:
- Evidencia (captura, log o enlace):
- Observaciones:

---

## Caso 17: Un estudiante no puede subir su propio nivel

**Precondiciones:** simulador o emulador, autenticado como `uid`, con `usuarios/{uid}.nivel = 1`.

**Pasos:**

1. Simular un `update` donde solo cambia `nivel` a `50` (sin tocar `xp`).
2. Simular otro donde `nivel` baja a `0`.

**Resultado esperado:** ambas escrituras son denegadas (`nivel` no está entre los campos que el propio usuario puede cambiar).

**Historial:** hasta el despliegue de las reglas de la tarjeta [Sprint 6 - 36], la regla solo exigía `nivel >= nivel anterior`. Si el paso 1 queda permitido, es una regresión.

**Resultado:**

- Resultado: [ ] Pasa  [ ] Falla  [ ] Bloqueado
- Fecha / Tester / Entorno:
- Evidencia (captura, log o enlace):
- Observaciones:

---

## Caso 18: Un estudiante no puede crear sus propios resultados ni logros

**Precondiciones:** simulador o emulador, autenticado como `uid`.

**Pasos:**

1. Simular un `create` en `resultados/documento_falso` con `usuarioId: uid`, `puntaje: 100`, `respuestasCorrectas: 20`, `respuestasIncorrectas: 0`.
2. Simular un `create` en `resultados/documento_falso/respuestas/r1` con `usuarioId: uid`.
3. Simular un `create` en `usuarios/{uid}/logrosObtenidos/diez_simulacros` con `fechaObtenido`.
4. Simular el `update` o `delete` de cualquiera de esos documentos ya creados.

**Resultado esperado:** los cuatro pasos son denegados: solo la función crea resultados, respuestas y logros (`create: false`, `update, delete: false`).

**Historial:** hasta el despliegue de las reglas de la tarjeta [Sprint 6 - 36], los pasos 1 a 3 quedaban permitidos. Si alguno se permite, es una regresión.

**Resultado:**

- Resultado: [ ] Pasa  [ ] Falla  [ ] Bloqueado
- Fecha / Tester / Entorno:
- Evidencia (captura, log o enlace):
- Observaciones:

---

## Caso 19: Un estudiante no puede escribir su puntaje en el ranking

**Precondiciones:** simulador o emulador, autenticado como `uid`.

**Pasos:**

1. Simular un `set` en `ranking/{uid}` con `usuarioId: uid`, `puntajeAcumulado: 999999`, `nombre`, `apellido` y `nivel`.
2. Simular el mismo `set` sobre `ranking/{otroUid}`.
3. Simular un `delete` de `ranking/{uid}`.
4. Repetir los pasos 1 a 3 autenticado como administrador.
5. Como control, simular un `get` y un `list` de `ranking` como estudiante.

**Resultado esperado:** los pasos 1 a 4 son denegados, también para el administrador: el ranking lo escribe solo la función con el Admin SDK (`allow write: if false`). El paso 5 es permitido (`allow read: if estaAutenticado()`).

**Historial:** el registro de `docs/qa/verificacion-rbac.md` (2026-10-18) documentó que los pasos 1 y 3 se permitían; la regla actual los niega y esas filas no se volvieron a ejecutar. Si alguno se permite, es una regresión.

**Resultado:**

- Resultado: [ ] Pasa  [ ] Falla  [ ] Bloqueado
- Fecha / Tester / Entorno:
- Evidencia (captura, log o enlace):
- Observaciones:

---

## Caso 20: Coherencia del XP entre pantallas

**Precondiciones:** cuenta de prueba con XP y nivel conocidos (de los casos anteriores) y sesión recién iniciada.

**Pasos:**

1. Anotar `usuarios/{uid}.xp` y `nivel` en Firestore.
2. Abrir `/perfil` y `/ranking`.
3. Abrir `/inicio` y revisar el saludo, la etiqueta "Tu nivel" y las tarjetas "Puntos", "Para subir de nivel" y "Progreso del nivel".

**Resultado esperado:**

- `/perfil` muestra el mismo XP y nivel que Firestore. `/ranking` muestra "{xp} pts" y el nivel del estudiante.
- `/inicio` muestra los datos reales del estudiante: el saludo con su nombre ("¡Hola, {nombre}!"), "Nivel {nivel}", "Puntos" igual al XP, "Para subir de nivel" igual a `1000 - (xp mod 1000)` XP y "Progreso del nivel" igual a `round((xp mod 1000) / 1000 * 100)`%. No hay racha ni valores fijos.
- Los tres valores (Firestore, Perfil e Inicio) coinciden.

**Resultado:**

- Resultado: [ ] Pasa  [ ] Falla  [ ] Bloqueado
- Fecha / Tester / Entorno:
- Evidencia (captura, log o enlace):
- Observaciones:

---

## Caso 21: Prueba enviada por una cuenta desactivada (avanzado, opcional)

Este caso no se puede reproducir desde la interfaz: con la cuenta desactivada, las reglas niegan la lectura de `areas` y `preguntas`, y la aplicación no deja armar un cuestionario (y cierra la sesión al recargar). Requiere invocar la función con la sesión de esa cuenta (emulador de funciones, o un script con `httpsCallable` en el proyecto de pruebas).

**Precondiciones:** cuenta de prueba B con sesión iniciada en el script y un `cuestionarioId` existente (creado por B antes de ser desactivada). Un administrador desactiva a B (`usuarios/{B}.estado = "inactivo"`). Anotar el XP de B.

**Pasos:**

1. Con la sesión de B (token vigente), invocar `calificarPrueba` con el `cuestionarioId`, sus respuestas y `tiempoEmpleado`.
2. Revisar `resultados/{cuestionarioId}_{B}`, `usuarios/{B}.xp` y `ranking/{B}`.
3. Reactivar a B al terminar.

**Resultado esperado (comportamiento actual conocido):** la función no consulta el estado de la cuenta (`functions/src/calificarPrueba.js` solo exige `request.auth`) y usa el Admin SDK, que no pasa por las reglas. La llamada tiene éxito: se guarda el resultado y se suma el XP, aunque la cuenta esté desactivada. Es una brecha documentada en el manual técnico (sección 12); si la función llegara a rechazar a las cuentas desactivadas, este caso debe cambiar a "denegado" y actualizarse.

**Resultado:**

- Resultado: [ ] Pasa  [ ] Falla  [ ] Bloqueado
- Fecha / Tester / Entorno:
- Evidencia (captura, log o enlace):
- Observaciones:

---

## Notas finales

- Ejecutar todos los casos con la aplicación corriendo (`npm run dev`) y la consola del navegador abierta.
- Registrar cualquier comportamiento inesperado con los pasos exactos para reproducirlo.
- Los casos 15 a 19 deben pasar con el `firestore.rules` actual de `main`. Si el proyecto de pruebas tiene desplegado un ruleset anterior, algunos pueden fallar: comparar el ruleset publicado con el archivo antes de abrir un defecto.
- Documentos relacionados en `docs/qa/`: `verificacion-rbac.md` (reglas de acceso por rol y por usuario) y `casos-prueba-simulacros.md` (armado y flujo de las pruebas).
