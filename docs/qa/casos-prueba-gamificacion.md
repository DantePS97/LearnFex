# QA - Casos de prueba de calificación y gamificación

Este documento describe los casos de prueba para validar la calificación de pruebas y el sistema de gamificación (XP, nivel, ranking y logros) de LearnFex.

- Estado del documento: plantilla de ejecución. Ningún caso fue ejecutado todavía; todas las casillas de resultado están vacías a propósito.
- Verificado contra el código de `main` en el commit `f17a14c`. Si `main` cambió desde entonces, revisar los casos antes de ejecutarlos.
- Autoría original del borrador: Juliana Martínez (PR #59). Corregido contra el código real.
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
- Los logros se ven en `/logros` (se llega desde Perfil, botón "Logros"; no está en la barra de navegación). El Perfil muestra solo correo, rol, XP y nivel.
- El resultado se guarda con ID determinista `{cuestionarioId}_{uid}`. Reenviar la misma prueba devuelve `already-exists` y el cliente navega a `/resultados/{cuestionarioId}_{uid}`.

## Hallazgo de seguridad vigente

Hoy `firestore.rules` todavía permite que un estudiante suba su propio XP (hasta +100 por escritura) y su nivel, y cree documentos en `resultados` y `usuarios/{uid}/logrosObtenidos` desde el cliente. Eso se cierra con la tarjeta de Notion **[Sprint 6 - 36] Reglas de Firestore**, que va después del despliegue de la función. Los casos 15 a 19 describen el comportamiento correcto y marcan con "esperado a fallar hasta la tarjeta 6-36" lo que hoy está abierto (casos 16 a 19); el caso 15 pasa hoy.

---

## Precondiciones generales

- Aplicación corriendo con `npm run dev`, apuntando a un proyecto de Firebase de pruebas (nunca datos reales).
- Función `calificarPrueba` desplegada en ese proyecto. Si no lo está, al finalizar una prueba aparece "No se pudo calificar el cuestionario.".
- Datos cargados con `scripts/seed-preguntas.js`: 5 áreas, 20 preguntas (4 por área) y los 3 logros. Con ese banco, un cuestionario por área tiene 4 preguntas y el simulacro tiene 20.
- Una cuenta de estudiante de prueba nueva (XP 0, nivel 1, sin resultados ni logros). Para repetir casos, crear otra cuenta en `/registro`.
- Acceso de lectura a la consola de Firestore. Algunos casos piden editar `usuarios/{uid}` a mano: hacerlo solo en el proyecto de pruebas y con cuentas de prueba.
- Cómo conocer la respuesta correcta de cada pregunta: campo `respuestaCorrecta` (una letra A-D) en la colección `preguntas` de la consola, o en `scripts/seed-preguntas.js`. Las preguntas se muestran en orden aleatorio: identificarlas por el enunciado.
- Cómo iniciar un simulacro: no hay botón en la interfaz. Con la sesión iniciada, escribir `/practica/cuestionario` en la barra de direcciones (sin pasar por Práctica). Un cuestionario por área se inicia desde Práctica, tocando un área.
- El Perfil toma los datos del usuario una sola vez, al iniciar sesión. Para ver el XP o nivel actualizado hay que recargar la página (F5) en `/perfil`. Ver el caso 5.
- Los casos 15 a 19 (seguridad) se ejecutan con el simulador de reglas de Firestore (Rules Playground, en la consola de Firebase) o con el emulador de Firestore usando `firestore.rules` del repositorio. El simulador permite elegir la operación, la ruta, el UID autenticado y los datos del documento. Para `update` ingresar el documento completo tal como quedaría tras la escritura.

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
2. Responder 3 preguntas correctamente y 1 incorrectamente (el cuestionario tiene 4).
3. En la última pregunta, tocar "Finalizar".

**Resultado esperado:**

- Se navega a `/resultados/{cuestionarioId}_{uid}`.
- El puntaje mostrado es `75%` (no `3`), con "Preguntas: 4", "Correctas: 3" e "Incorrectas: 1".
- La etiqueta de estado es "Aprobado" (el umbral es 60%).
- En Firestore, `resultados/{cuestionarioId}_{uid}` tiene `puntaje: 75`, `respuestasCorrectas: 3` y `respuestasIncorrectas: 1`.

**Resultado:**

- Resultado: [ ] Pasa  [ ] Falla  [ ] Bloqueado
- Fecha / Tester / Entorno:
- Evidencia (captura, log o enlace):
- Observaciones:

---

## Caso 2: Preguntas sin responder y 0 correctas

**Precondiciones:** cuenta de prueba (puede ser la misma del caso 1, con otro cuestionario).

**Pasos:**

1. Iniciar un cuestionario por área (4 preguntas).
2. Navegar hasta la última pregunta sin responder ninguna. Tocar "Finalizar".
3. Repetir con otro cuestionario respondiendo solo 1 pregunta, correctamente, y dejando las otras 3 sin responder.

**Resultado esperado:**

- Paso 2: puntaje `0%`, "Correctas: 0", "Incorrectas: 4", estado "No aprobado". La prueba se guarda igual.
- Paso 3: puntaje `25%`, "Correctas: 1", "Incorrectas: 3", estado "No aprobado". Las preguntas sin responder cuentan como incorrectas y el porcentaje se calcula sobre todas las preguntas de la prueba.
- No hay ninguna confirmación al finalizar con preguntas sin responder (comportamiento actual, no es defecto).

**Resultado:**

- Resultado: [ ] Pasa  [ ] Falla  [ ] Bloqueado
- Fecha / Tester / Entorno:
- Evidencia (captura, log o enlace):
- Observaciones:

---

## Caso 3: Prueba con todas las respuestas correctas y umbral de aprobación

**Precondiciones:** cuenta de prueba.

**Pasos:**

1. Iniciar un cuestionario por área y responder las 4 preguntas correctamente. Finalizar.
2. Iniciar otro y responder 2 correctamente y 2 incorrectamente. Finalizar.

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

El redondeo ya está cubierto por la prueba automática `functions/test/calificacion.test.js` ("mezcla de aciertos redondea el puntaje"). Este caso manual solo se ejecuta si se dispone de una prueba cuyo total no divide a 100.

**Precondiciones:** un área de pruebas con un número de preguntas que no divida a 100 (por ejemplo 3 o 6), creada solo en el proyecto de pruebas.

**Pasos:**

1. Iniciar un cuestionario de esa área con 3 preguntas y responder 1 correctamente.
2. Repetir respondiendo 2 correctamente.

**Resultado esperado:**

- 1 de 3: `33%`. 2 de 3: `67%`. El puntaje siempre es un entero.

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
2. Completar un cuestionario por área con 3 respuestas correctas y 1 incorrecta.
3. En Firestore, abrir `usuarios/{uid}` y `ranking/{uid}`.
4. Volver a `/perfil` sin recargar y anotar el XP mostrado.
5. Recargar la página (F5) en `/perfil` y anotar el XP.
6. Abrir `/ranking`.

**Resultado esperado:**

- Paso 3: `usuarios/{uid}.xp` es 30 y `nivel` es 1. `ranking/{uid}.puntajeAcumulado` es 30.
- Paso 5: el Perfil muestra XP 30 y nivel 1.
- Paso 6: el estudiante aparece en el ranking con "30 pts" y la insignia "Tú".

**Comportamiento actual conocido (brecha):** en el paso 4 el Perfil sigue mostrando el XP anterior, porque `AuthContext` carga el perfil una sola vez al iniciar sesión y la navegación interna no lo refresca. Si en el paso 4 se ve 30 sin recargar, anotarlo en Observaciones (el comportamiento cambió).

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

**Precondiciones:** cuenta de prueba con XP conocido. Hace falta un simulacro (20 preguntas): con el banco del seed ningún cuestionario por área alcanza 10 correctas.

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

1. Completar 3 cuestionarios por área seguidos, con 4, 2 y 3 respuestas correctas respectivamente.
2. Revisar `usuarios/{uid}.xp` y `ranking/{uid}.puntajeAcumulado` después de cada prueba.
3. Abrir `/resultados/{id}` de cada una (o revisar la colección `resultados`).

**Resultado esperado:**

- XP acumulado: 40, luego 60, luego 90. `ranking/{uid}.puntajeAcumulado` coincide con el XP en cada paso.
- Existen 3 documentos en `resultados`, uno por prueba, con su propio puntaje (100%, 50%, 75%). Ningún resultado se sobrescribe ni se pierde.

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

1. Completar un cuestionario por área con 4 respuestas correctas.
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
2. Completar la primera prueba (cuestionario o simulacro), con cualquier cantidad de aciertos.
3. Volver a `/perfil` y tocar "Logros".

**Resultado esperado:**

- Paso 1: se listan los 3 logros del catálogo, todos "Bloqueado". No hay acción manual para desbloquear.
- Paso 3: "Primer paso" aparece como "Desbloqueado" con la fecha de hoy. Los otros dos siguen "Bloqueado". En Firestore existe `usuarios/{uid}/logrosObtenidos/primer_quiz` con `fechaObtenido`.
- El logro se ve en `/logros`, no en el Perfil (el Perfil no lista logros).

**Comportamiento actual conocido (brecha):** al terminar la prueba no se muestra ninguna notificación del logro obtenido; la función devuelve `nuevosLogros` pero el cliente navega directo a Resultados sin usarlo. La ERS (RF-016) pide notificar el logro.

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
- Paso 2: "Estudiante dedicado" (criterio `cinco_simulacros`) se desbloquea con la 5.ª prueba, no antes.
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

Los casos 15 a 19 verifican que un estudiante no pueda alterar su propio estado de gamificación saltándose la función. Se ejecutan con el simulador de reglas o el emulador (ver precondiciones generales), autenticado como el UID de la cuenta de prueba (`uid`), con un documento `usuarios/{uid}` existente de `rol: "estudiante"`, `xp: 100`, `nivel: 1`.

Reglas relevantes en `firestore.rules`: `esActualizacionDePerfil`, `esActualizacionDeGamificacion` y los bloques `usuarios`, `usuarios/{uid}/logrosObtenidos`, `resultados` y `ranking`.

## Caso 15: No se puede cambiar `rol`, `estado` ni `correo` (pasa hoy)

**Precondiciones:** simulador o emulador, autenticado como `uid`.

**Pasos:**

1. Simular un `update` de `usuarios/{uid}` donde solo cambia `rol` a `"administrador"`.
2. Repetir cambiando solo `estado` a `"inactivo"` y luego solo `correo`.
3. Como control, simular un `update` que cambia solo `nombre` o `colegio`.
4. Desde la interfaz: en `/perfil`, cambiar nombre, apellido y colegio y guardar.

**Resultado esperado:**

- Pasos 1 y 2: denegado. La regla `usuarios` solo acepta que el propio usuario cambie `nombre`, `apellido`, `colegio` o (por ahora) `xp` y `nivel`.
- Paso 3: permitido.
- Paso 4: se muestra "Cambios guardados correctamente" y el cambio persiste tras recargar. El formulario de Perfil nunca envía `rol`, `estado`, `xp`, `nivel` ni `correo`.

**Resultado:**

- Resultado: [ ] Pasa  [ ] Falla  [ ] Bloqueado
- Fecha / Tester / Entorno:
- Evidencia (captura, log o enlace):
- Observaciones:

---

## Caso 16: Un estudiante no puede subir su propio XP

**Estado conocido: esperado a fallar hasta la tarjeta [Sprint 6 - 36] Reglas de Firestore.**

**Precondiciones:** simulador o emulador, autenticado como `uid`, con `usuarios/{uid}.xp = 100`.

**Pasos:**

1. Simular un `update` de `usuarios/{uid}` con `xp: 200` (el resto igual).
2. Simular otro con `xp: 201`.
3. Simular otro con `xp: 50` (bajar el XP).
4. Repetir el paso 1 sobre el documento resultante varias veces.

**Resultado esperado (correcto):** todas las escrituras de `xp` desde el cliente son denegadas. Solo la Cloud Function (Admin SDK) modifica `xp`.

**Comportamiento actual conocido:** `esActualizacionDeGamificacion` permite subir `xp` hasta +100 por escritura (`xp <= xp anterior + 100`) y no permite bajarlo. Hoy el paso 1 queda permitido, el paso 2 denegado, el paso 3 denegado y el paso 4 permitido todas las veces: un estudiante puede acumular XP sin límite repitiendo escrituras.

**Resultado:**

- Resultado: [ ] Pasa  [ ] Falla  [ ] Bloqueado
- Fecha / Tester / Entorno:
- Evidencia (captura, log o enlace):
- Observaciones:

---

## Caso 17: Un estudiante no puede subir su propio nivel

**Estado conocido: esperado a fallar hasta la tarjeta [Sprint 6 - 36] Reglas de Firestore.**

**Precondiciones:** simulador o emulador, autenticado como `uid`, con `usuarios/{uid}.nivel = 1`.

**Pasos:**

1. Simular un `update` donde solo cambia `nivel` a `50` (sin tocar `xp`).
2. Simular otro donde `nivel` baja a `0`.

**Resultado esperado (correcto):** ambas escrituras son denegadas.

**Comportamiento actual conocido:** la regla solo exige `nivel >= nivel anterior` y no lo relaciona con el XP. Hoy el paso 1 queda permitido (cualquier nivel mayor) y el paso 2 denegado.

**Resultado:**

- Resultado: [ ] Pasa  [ ] Falla  [ ] Bloqueado
- Fecha / Tester / Entorno:
- Evidencia (captura, log o enlace):
- Observaciones:

---

## Caso 18: Un estudiante no puede crear sus propios resultados ni logros

**Estado conocido: esperado a fallar hasta la tarjeta [Sprint 6 - 36] Reglas de Firestore.**

**Precondiciones:** simulador o emulador, autenticado como `uid`.

**Pasos:**

1. Simular un `create` en `resultados/documento_falso` con `usuarioId: uid`, `puntaje: 100`, `respuestasCorrectas: 20`, `respuestasIncorrectas: 0`.
2. Simular un `create` en `resultados/documento_falso/respuestas/r1` con `usuarioId: uid`.
3. Simular un `create` en `usuarios/{uid}/logrosObtenidos/diez_simulacros` con `fechaObtenido`.
4. Simular el `update` o `delete` de cualquiera de esos documentos ya creados.

**Resultado esperado (correcto):** los pasos 1 a 3 son denegados: solo la función crea resultados, respuestas y logros.

**Comportamiento actual conocido:** las reglas permiten crear esos documentos mientras `usuarioId` sea el propio UID (`resultados`, `respuestas`) o el propio usuario (`logrosObtenidos`). Hoy los pasos 1 a 3 quedan permitidos. El paso 4 está denegado hoy (`update` y `delete` son `false`), eso sí debe seguir así.

**Resultado:**

- Resultado: [ ] Pasa  [ ] Falla  [ ] Bloqueado
- Fecha / Tester / Entorno:
- Evidencia (captura, log o enlace):
- Observaciones:

---

## Caso 19: Un estudiante no puede escribir su puntaje en el ranking

**Estado conocido: esperado a fallar hasta la tarjeta [Sprint 6 - 36] Reglas de Firestore (confirmar que la tarjeta incluya este bloque).**

**Precondiciones:** simulador o emulador, autenticado como `uid`.

**Pasos:**

1. Simular un `set` en `ranking/{uid}` con `usuarioId: uid`, `puntajeAcumulado: 999999`, `nombre`, `apellido` y `nivel`.
2. Simular el mismo `set` sobre `ranking/{otroUid}`.

**Resultado esperado (correcto):** ambas escrituras son denegadas: desde la función el ranking lo escribe el servidor.

**Comportamiento actual conocido:** la regla `ranking` permite escribir el propio documento (`esPropioUsuario(rankingId)`). Hoy el paso 1 queda permitido y el paso 2 denegado.

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
3. Abrir `/inicio` y revisar las tarjetas "Puntos", "Racha" y "Progreso" y la etiqueta "Tu nivel".

**Resultado esperado:**

- `/perfil` muestra el mismo XP y nivel que Firestore. `/ranking` muestra "{xp} pts" y el nivel del estudiante.
- `/inicio` debería mostrar los datos reales del estudiante.

**Comportamiento actual conocido (brecha):** `/inicio` muestra datos temporales fijos en el código (nombre "Estudiante", "Nivel intermedio", 1250 puntos, racha de 5 días, progreso 75%) que no dependen del XP real (`Home.jsx`, objeto `student`). El paso 3 falla hoy; no hay tarjeta asignada identificada para esto.

**Resultado:**

- Resultado: [ ] Pasa  [ ] Falla  [ ] Bloqueado
- Fecha / Tester / Entorno:
- Evidencia (captura, log o enlace):
- Observaciones:

---

## Notas finales

- Ejecutar todos los casos con la aplicación corriendo (`npm run dev`) y la consola del navegador abierta.
- Registrar cualquier comportamiento inesperado con los pasos exactos para reproducirlo.
- Los casos 16 a 19 deben pasar cuando se cierre la tarjeta [Sprint 6 - 36] Reglas de Firestore. Volver a ejecutarlos entonces.
- Documentos relacionados en `docs/qa/`: `verificacion-rbac.md` (reglas de acceso por rol y por usuario) y `casos-prueba-simulacros.md` (armado y flujo de las pruebas).
