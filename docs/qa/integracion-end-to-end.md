# QA - Pruebas de integración end-to-end (estudiante y administrador)

Este documento es la plantilla de ejecución del recorrido completo de LearnFex: los módulos del estudiante y los del administrador, más los cruces entre ambos. Sirve para registrar, con evidencia, qué se probó, quién lo probó y qué resultó.

- Estado del documento: **ejecutado el 2026-10-18** contra el proyecto de Firebase del equipo `learnfex-dev-oscar`, con el cliente local. Resultado: 81 pasos PASA, 3 FALLA y 5 No ejecutados, de 89 (detalle en "Resumen de la ejecución"). Fue una ejecución del implementador del proyecto (un agente de Claude), **no una verificación independiente de QA**: conviene que una persona del equipo la repita o la revise antes de darla por aprobada.
- Ejecutado contra el código de `main` en el commit `3ac0365`. La versión anterior del documento estaba verificada contra `c3d71aa`; desde entonces cambiaron el Inicio del estudiante (PR #82, ahora muestra datos reales) y el panel de administración (botón "Cerrar sesión"), y por eso se actualizaron los pasos 1.4, 1.5 y A1.1 y la nota inicial del recorrido del administrador.
- Autoría original del borrador: Silvana Castro (PR #61). El borrador declaraba los 8 módulos como aprobados sin evidencia; este documento lo reemplaza.
- Actualizado tras los merges del seed de 40 preguntas (PR #65), la pantalla de historial `/historial` (PR #67), el menú completo de Perfil con cierre de sesión (PR #53) y la lista de `/admin/simulacros` (PR #76). El módulo 8 (menú del Perfil) y el módulo A4 (Simulacros) pasaron de "bloqueado/esperado a fallar" a módulos normales.

---

## Precondiciones generales

- Aplicación corriendo con `npm run dev`, apuntando a un proyecto de Firebase de pruebas (nunca datos reales), con `firestore.rules` y la función `calificarPrueba` desplegadas.
- Datos del seed cargados (`scripts/seed-preguntas.js`): 5 áreas, 40 preguntas (8 por área) y 3 logros. Con ese banco un cuestionario por área tiene 8 preguntas y el simulacro 30. Si el proyecto ya tenía el seed anterior (20 preguntas), volver a ejecutar el script: sobrescribe las áreas (`numPreguntas: 6`) y agrega `seed_21` a `seed_40`.
- Índices de Firestore desplegados (`firestore.indexes.json`): Estadísticas e Historial consultan `resultados` con `usuarioId` y orden por `fecha` descendente, y eso necesita un índice compuesto. El emulador de Firestore no lo exige: en emuladores no se puede comprobar si falta.
- Una cuenta de estudiante nueva (se crea en el módulo 1) y una cuenta de administrador: registrar una cuenta y cambiar a mano su campo `rol` a `administrador` en `usuarios/{uid}` desde la consola de Firestore (solo en el proyecto de pruebas).
- Acceso de lectura a la consola de Firestore para comprobar documentos.
- Consola del navegador abierta (DevTools) para revisar errores en cada módulo.
- Para cambiar de cuenta se puede usar "Cerrar sesión" en Perfil (módulo 8) o ventanas privadas distintas.

## Datos de la ejecución

| Campo | Valor |
| ----- | ----- |
| Fecha de inicio | 2026-10-18 |
| Tester | Claude (implementador del proyecto; ejecución no independiente de QA) |
| Entorno (URL, navegador y versión, dispositivo) | Cliente local Vite en `http://localhost:5302`, navegador integrado de Claude Desktop (Chromium), viewport de 1280x900 (y de 600x900 para las comprobaciones de la navegación inferior). Verificación de Firestore por REST con el token del Firebase CLI. |
| Commit o rama probada | `main` en `3ac0365` |
| Proyecto de Firebase | `learnfex-dev-oscar`, función `calificarPrueba` y reglas desplegadas el 2026-10-15; índice compuesto de `resultados` (`usuarioId` ascendente, `fecha` descendente) en estado READY |
| Cuenta de estudiante (correo) | `qa-e2e-1792384962@learnfex-dev.test` (registrada con la pantalla de Registro); como segundas cuentas, `qa-e2e-1792384962-b@learnfex-dev.test` (alta por la API de Auth) y `qa-e2e-1792384962-c@learnfex-dev.test` (registrada con la pantalla de Registro en el paso C.2). Las tres se borraron al terminar. |
| Cuenta de administrador (correo) | `qa-e2e-1792384962-adm@learnfex-dev.test` (alta por la API de Auth y documento `usuarios/{uid}` con `rol: administrador` por REST). Se borró al terminar. |

### Desvíos de entorno y de método de esta ejecución

- **Banco de preguntas reducido.** El proyecto real tiene 21 preguntas (Matemáticas 5; Ciencias Naturales, Ciencias Sociales y Ciudadanas, Inglés y Lectura Crítica 4 cada una) y las áreas tienen `numPreguntas: 4`, no las 40 preguntas (8 por área) y `numPreguntas: 6` que asume el documento. Por eso un cuestionario por área muestra "de 4" (Matemáticas "de 5") y el simulacro 20 preguntas en lugar de 30. No se ejecutó el seed ni se cargaron preguntas. Es una condición de entorno, no una falla.
- **Método.** Las acciones del navegador se hicieron con scripts en la consola del navegador integrado (clics y valores sobre el DOM de la aplicación), no con ratón y teclado reales. Los diálogos `window.confirm` se sobrescribieron desde la consola (devolviendo `true` o `false` según el caso) porque el navegador integrado descarta los diálogos nativos; el texto de cada aviso se capturó y se anota en el paso.
- **Datos reales intactos.** Se trabajó solo con cuentas, cuestionarios, resultados, una pregunta y un logro temporales (prefijo `qa-e2e-1792384962`); las cuentas del equipo y la configuración general no se tocaron. La limpieza y los conteos antes y después están en "Resumen de la ejecución".
- **Casos no ejecutados** por condiciones inalcanzables o inseguras: cortar la red del navegador (pasos 7.4 y 8.4), comprobar la llegada del correo de restablecimiento a una bandeja real (parte del paso 8.3) y guardar la configuración general real (A7.2 y A7.4).

## Cómo registrar el resultado

- En cada tabla, marcar `[x]` Pasa o Falla por paso. Si un paso no se pudo ejecutar, dejarlo sin marcar y explicar por qué en Observaciones del módulo.
- Al cerrar el módulo, marcar una sola opción: Aprobado (todos los pasos pasan), Con fallas (algún paso falla) o Bloqueado (no se pudo ejecutar). No dejar un módulo como Aprobado sin evidencia.
- Un paso con "Comportamiento actual conocido" que falla exactamente como allí se describe se registra como Falla con la observación "falla conocida". Solo se abre un defecto nuevo si falla de otra manera.
- Adjuntar evidencia (capturas, logs, enlaces) y anotar dónde quedó guardada.
- En esta ejecución, la evidencia son los valores observados en pantalla y los documentos leídos por REST, anotados en las Observaciones de cada módulo (no hay capturas). Los módulos con pasos no ejecutados y sin fallas se marcan "Parcial" en el Estado cuando esos pasos no son opcionales.

---

# Recorrido del estudiante

## Módulo 1: Acceso e Inicio

**Precondiciones:** ninguna sesión iniciada.

| Paso | Acción | Resultado esperado | Resultado |
| ---- | ------ | ------------------ | --------- |
| 1.1 | En `/registro`, crear una cuenta con nombre, apellido, correo válido, contraseña de 6 o más caracteres y confirmación igual. | Se navega a `/inicio`. En Firestore existe `usuarios/{uid}` con `rol: estudiante`, `estado: activo`, `xp: 0`, `nivel: 1`. | [x] Pasa  [ ] Falla |
| 1.2 | En `/`, iniciar sesión con una contraseña incorrecta. | Aparece "Correo o contraseña incorrectos", sin indicar cuál campo falló. | [x] Pasa  [ ] Falla |
| 1.3 | Iniciar sesión con las credenciales correctas. | Se navega a `/inicio` (el rol es estudiante). | [x] Pasa  [ ] Falla |
| 1.4 | Observar `/inicio`. | Cargan el saludo con el nombre del estudiante, la tarjeta "Tu nivel" y las tarjetas "Puntos", "Para subir de nivel" y "Progreso del nivel", las acciones "Practicar" y "Mis resultados", las 5 áreas de aprendizaje (desde Firestore) y el bloque de ranking. Sin errores en consola. | [x] Pasa  [ ] Falla |
| 1.5 | Revisar los valores de las tarjetas de `/inicio`. | Son los datos reales del estudiante: nombre, nivel, XP en "Puntos", XP que falta para el siguiente nivel (de 1000 en 1000) en "Para subir de nivel" y el porcentaje en "Progreso del nivel". Coinciden con `usuarios/{uid}` tras recargar; sin recargar, tras una prueba, el XP puede verse desactualizado (el perfil se carga una sola vez al iniciar sesión). | [x] Pasa  [ ] Falla |
| 1.6 | Tocar "Comenzar práctica", "Ver resultados", "Ver todas" y "Ver ranking". | Navegan a `/practica`, `/estadisticas`, `/practica` y `/ranking`. | [x] Pasa  [ ] Falla |
| 1.7 | Tocar una tarjeta de área de `/inicio`. | Se abre `/practica` con el filtro de esa área activo. | [x] Pasa  [ ] Falla |
| 1.8 | Usar la navegación (Inicio, Práctica, Estadísticas, Ranking, Perfil). En pantallas de 768 px o más se ve arriba; en menos de 768 px, abajo. | Cada elemento navega a su pantalla y queda marcado como activo. | [x] Pasa  [ ] Falla |

**Cierre del módulo 1:**

- Estado: [x] Aprobado  [ ] Con fallas  [ ] Bloqueado
- Fecha / Tester / Entorno: 2026-10-18 / Claude (implementador del proyecto; ejecución no independiente de QA) / `learnfex-dev-oscar`, función `calificarPrueba` y reglas desplegadas el 2026-10-15, cliente local Vite sobre `main` `3ac0365`
- Evidencia (captura, log o enlace): valores observados y lecturas REST descritos abajo; sin capturas.
- Observaciones:
  - 1.1: cuenta registrada con la pantalla de Registro (nombre `qa-e2e-1792384962`); navegó a `/inicio`. REST: `usuarios/7XRHlCHICGNeuLcLqzsbnbIEpYx2` con `rol: estudiante`, `estado: activo`, `xp: 0`, `nivel: 1`, `colegio` vacío.
  - 1.2: mensaje "Correo o contraseña incorrectos". La consola registró un solo error, el 400 de esa llamada de login fallida (esperado).
  - 1.3: navegó a `/inicio`.
  - 1.4: se vio "¡Hola, qa-e2e-1792384962!", "Tu nivel / Nivel 1", "Puntos 0", "Para subir de nivel 1000 XP", "Progreso del nivel 0%", las 5 áreas y el bloque de ranking. Recargando `/inicio` no hubo errores en consola. El paso se actualizó: el Inicio ya no tiene las tarjetas "Racha" ni "Progreso" (PR #82).
  - 1.5: tras la primera prueba (30 XP) y recargar: "Puntos 30", "Para subir de nivel 970 XP", "Progreso del nivel 3%" y el nombre real. Sin recargar mostraba "Puntos 0" (perfil cargado una sola vez, igual que en 7.1). La falla conocida de los datos fijos (1250 puntos, racha 5 días, 75%) ya no existe tras el PR #82.
  - 1.6: llevó a `/practica`, `/estadisticas`, `/practica` y `/ranking`.
  - 1.7: la tarjeta "Matemáticas" abrió `/practica` con el filtro "Matemáticas" activo.
  - 1.8: a 1280 px la navegación queda arriba (y = 14) y a 600 px abajo (y = 837 de 900). Cada enlace navega y queda marcado como activo.

---

## Módulo 2: Práctica

**Precondiciones:** sesión iniciada como estudiante. Detalle de cada paso en `docs/qa/casos-prueba-simulacros.md`.

| Paso | Acción | Resultado esperado | Resultado |
| ---- | ------ | ------------------ | --------- |
| 2.1 | Abrir `/practica`. | Se listan las 5 áreas desde Firestore. El buscador "Buscar área..." y los filtros por nombre acotan la lista. | [x] Pasa  [ ] Falla |
| 2.2 | Tocar un área. | Se abre `/practica/cuestionario` sin barra de navegación superior ni inferior. Se ve el nombre del área, "Pregunta 1 de 8" (con el seed) y el temporizador en cuenta regresiva. Las preguntas cargan sin errores. | [x] Pasa  [ ] Falla |
| 2.3 | Responder preguntas, cambiar una respuesta y saltar entre preguntas con la "Navegación de preguntas". | Solo queda marcada la última opción elegida. Las respondidas se marcan en la navegación. | [x] Pasa  [ ] Falla |
| 2.4 | En la última pregunta, tocar "Finalizar". | El botón muestra "Enviando..." y se navega a `/resultados/{cuestionarioId}_{uid}`. | [x] Pasa  [ ] Falla |
| 2.5 | En Firestore, revisar `cuestionarios`, `resultados/{cuestionarioId}_{uid}` y su subcolección `respuestas`. | Existe el cuestionario, un resultado con `usuarioId` correcto y una respuesta por pregunta. | [x] Pasa  [ ] Falla |
| 2.6 | Opcional: iniciar un simulacro escribiendo `/practica/cuestionario` en la barra de direcciones. | Se abre el "Simulacro general" con 30 preguntas (6 por área, elegidas entre las 8 de cada una) y 95 minutos. **Comportamiento actual conocido:** no hay ningún botón para llegar a esta pantalla. | [x] Pasa  [ ] Falla |

**Cierre del módulo 2:**

- Estado: [x] Aprobado  [ ] Con fallas  [ ] Bloqueado
- Fecha / Tester / Entorno: 2026-10-18 / Claude (implementador del proyecto; ejecución no independiente de QA) / `learnfex-dev-oscar`, función `calificarPrueba` y reglas desplegadas el 2026-10-15, cliente local Vite sobre `main` `3ac0365`
- Evidencia (captura, log o enlace): valores observados y lecturas REST descritos abajo; sin capturas.
- Observaciones:
  - 2.1: 5 áreas desde Firestore. Buscar "ingl" deja solo Inglés; buscar "zzz" muestra "No encontramos áreas"; el filtro "Lectura Crítica" deja solo esa área; "Todas" restaura las 5.
  - 2.2: en Inglés se abrió `/practica/cuestionario` sin enlaces de navegación, con "Pregunta 1 de 4" (desvío de entorno: 4 en lugar de 8) y el temporizador en cuenta regresiva desde 15:00 (el `tiempoLimite` del área: 14:59, 14:57...).
  - 2.3: en la pregunta 1 se eligió A y luego C: solo quedó marcada C. Saltando por la navegación a las preguntas 4, 2 y 3 y respondiéndolas, las respondidas se marcaron (`1111`).
  - 2.4: al tocar "Finalizar" el botón mostró "Enviando..." y se navegó a `/resultados/7Af15wF0edkiV3nQRyhR_7XRHlCHICGNeuLcLqzsbnbIEpYx2`.
  - 2.5: REST: `cuestionarios/7Af15wF0edkiV3nQRyhR` (`areaId: ingles`, `tipo: cuestionario`, 4 preguntas, `duracion: 15`, `estado: activo`, con `fechaCreacion`); `resultados/..._7XRH...` con `usuarioId` correcto, `puntaje: 75`, 3 correctas, 1 incorrecta, `tiempoEmpleado: 22`; 4 documentos en `respuestas`. XP del usuario 0 a 30 y `ranking/{uid}` con 30.
  - 2.6: al abrir `/practica/cuestionario` por la barra de direcciones se abrió el "Simulacro general" con "Pregunta 1 de 20" (desvío de entorno: 4 por área x 5 áreas = 20, no 30), temporizador de 95:00 (suma de los `tiempoLimite` de las áreas) y sin navegación. REST: `cuestionarios/0VW6ToMFTxk9jizZecWB`, `tipo: simulacro`, sin `areaId`, 20 preguntas. Se respondió con 12 aciertos y 8 errores: 60%, "Aprobado". XP 30 a 130 (12 x 10 = 120, con el tope de 100 por prueba). Sigue sin haber un botón que lleve a esta pantalla (el botón "+ Nueva práctica" abre el cuestionario de la primera área filtrada, no el simulacro).
  - Reenvío de la misma prueba (nota 5 del encargo): en un cuestionario de Matemáticas (`Qr8ryZpwzVT7C9g94E4f`, 5 preguntas) se llamó a `calificarPrueba` desde la consola con las 5 respuestas correctas (100%, XP 130 a 180) y luego se tocó "Finalizar" en la pantalla con 2 aciertos de 5. La función respondió `already-exists` y el cliente navegó a `/resultados/Qr8ryZpwzVT7C9g94E4f_7XRH...`, que mostró el resultado original (100%, 5 correctas, 0 incorrectas). REST: el XP quedó en 180 (no 200), `ranking` en 180 y `respuestas` con 5 documentos (sin duplicados).
  - El orden de `cuestionarios/{id}.preguntas` (por ejemplo `seed_20, seed_18, seed_19, seed_17`) no coincide con el orden en que `Quiz.jsx` muestra las preguntas, porque el cuestionario se arma y las preguntas se piden en dos consultas distintas. Mientras el área tenga 10 preguntas o menos el conjunto es el mismo; con más, podrían diferir. Es una observación, no una falla de este módulo.

---

## Módulo 3: Resultados y retroalimentación

**Precondiciones:** una prueba recién finalizada en el módulo 2, con aciertos y errores conocidos (por ejemplo, en un cuestionario por área de 8 preguntas, 6 correctas y 2 incorrectas).

| Paso | Acción | Resultado esperado | Resultado |
| ---- | ------ | ------------------ | --------- |
| 3.1 | Observar `/resultados/{id}`. | El puntaje es un porcentaje entero (75% para 6 de 8), con "Preguntas: 8", "Correctas: 6", "Incorrectas: 2" y la fecha. El estado es "Aprobado" con 60% o más y "No aprobado" con menos. | [x] Pasa  [ ] Falla |
| 3.2 | Tocar "Ver retroalimentación". | Se abre `/resultados/{id}/retroalimentacion` (también sin barra de navegación). Cada pregunta muestra la opción elegida, la correcta, la etiqueta Correcta o Incorrecta y la explicación. | [x] Pasa  [ ] Falla |
| 3.3 | Tocar "Volver a resultados". | Se vuelve a `/resultados/{id}`. | [x] Pasa  [ ] Falla |
| 3.4 | Tocar "Nuevo cuestionario" y luego, desde otro resultado, "Volver al inicio". | Navegan a `/practica` y `/inicio`. | [x] Pasa  [ ] Falla |
| 3.5 | Recargar `/resultados/{id}` (F5). | Se muestra el mismo resultado. | [x] Pasa  [ ] Falla |
| 3.6 | Con otra cuenta de estudiante, abrir `/resultados/{id}` de la primera cuenta. | No se puede ver: aparece "No se pudo cargar el resultado." (ver `docs/qa/verificacion-rbac.md`). | [x] Pasa  [ ] Falla |

**Cierre del módulo 3:**

- Estado: [x] Aprobado  [ ] Con fallas  [ ] Bloqueado
- Fecha / Tester / Entorno: 2026-10-18 / Claude (implementador del proyecto; ejecución no independiente de QA) / `learnfex-dev-oscar`, función `calificarPrueba` y reglas desplegadas el 2026-10-15, cliente local Vite sobre `main` `3ac0365`
- Evidencia (captura, log o enlace): valores observados y lecturas REST descritos abajo; sin capturas.
- Observaciones:
  - 3.1: con la prueba de Inglés (3 de 4): "75%", "Aprobado", "Preguntas 4", "Correctas 3", "Incorrectas 1" y fecha 18/10/2026 (desvío de entorno: 4 preguntas en lugar de 8). Otros resultados vistos: 60% del simulacro (12 de 20) con "Aprobado" (el límite se cumple), 100% (5 de 5), y 25% (1 de 4) y 50% (2 de 4) con "No aprobado".
  - 3.2: se abrió `/resultados/{id}/retroalimentacion` sin enlaces de navegación. Cada pregunta mostró la etiqueta "Correcta" o "Incorrecta", la opción elegida (marcada como incorrecta cuando falló), la correcta marcada y la explicación. Las preguntas aparecen en un orden distinto al que se vio al responder.
  - 3.3: volvió a `/resultados/{id}`.
  - 3.4: "Nuevo cuestionario" llevó a `/practica` y "Volver al inicio" a `/inicio` (se probó desde el mismo resultado, no desde otro).
  - 3.5: recargando `/resultados/{id}` se mostró el mismo resultado (75%, 4/3/1).
  - 3.6: con la cuenta `...-b`, abrir el resultado de la primera cuenta mostró "Ocurrió un error / No se pudo cargar el resultado." con el botón "Intentar nuevamente".

---

## Módulo 4: Ranking

**Precondiciones:** el estudiante completó al menos una prueba (el ranking lo escribe la función al calificar). Idealmente hay otros estudiantes con pruebas completadas.

| Paso | Acción | Resultado esperado | Resultado |
| ---- | ------ | ------------------ | --------- |
| 4.1 | Abrir `/ranking`. | Cargan el podio (los 3 primeros) y la tabla de clasificación, ordenados de mayor a menor puntaje. | [x] Pasa  [ ] Falla |
| 4.2 | Ubicar la fila del estudiante. | Si está entre los primeros 20, su fila está resaltada y lleva la insignia "Tú". Si no está, aparece la tarjeta "Tu posición actual" con su posición. | [x] Pasa  [ ] Falla |
| 4.3 | Comparar el puntaje mostrado con `ranking/{uid}.puntajeAcumulado` y `usuarios/{uid}.xp` en Firestore. | Los tres valores coinciden. | [x] Pasa  [ ] Falla |
| 4.4 | Si hay 20 o más estudiantes, tocar "Cargar más". | Se agrega la siguiente página sin repetir filas. | [x] Pasa  [ ] Falla |

**Cierre del módulo 4:**

- Estado: [x] Aprobado  [ ] Con fallas  [ ] Bloqueado
- Fecha / Tester / Entorno: 2026-10-18 / Claude (implementador del proyecto; ejecución no independiente de QA) / `learnfex-dev-oscar`, función `calificarPrueba` y reglas desplegadas el 2026-10-15, cliente local Vite sobre `main` `3ac0365`
- Evidencia (captura, log o enlace): valores observados y lecturas REST descritos abajo; sin capturas.
- Observaciones:
  - 4.1: "8 estudiantes" en la clasificación (7 del equipo + la cuenta de prueba). Podio: 1.030, 1.020 y 320 pts; tabla ordenada de mayor a menor (1.030, 1.020, 320, 210, 190, 150, 60, 10). Una de las filas del ranking real (la del administrador del seed) no tiene nombre y se ve como "Estudiante" con nivel "-": dato del entorno, no defecto de la pantalla.
  - 4.2: con 8 estudiantes la cuenta de prueba quedó en la posición 5 con la fila resaltada (clase `current-ranking-user`) y la insignia "Tú", con 190 pts. Para comprobar la otra rama del paso se crearon 24 documentos temporales en `ranking` con puntajes altos (borrados después): la cuenta quedó en la posición 29, fuera de las primeras 20 filas, y apareció la tarjeta "Tu posición actual: #29".
  - 4.3: 190 en pantalla, `ranking/{uid}.puntajeAcumulado` 190 y `usuarios/{uid}.xp` 190 (10 x 3 + 100 + 50 + 10 de las cuatro pruebas hechas hasta entonces).
  - 4.4: sin los documentos temporales había 8 estudiantes y no aparecía "Cargar más". Con los 24 temporales (32 estudiantes) aparecieron 20 filas y "Cargar más"; al tocarlo se completaron las 32 filas sin repetidas y el botón desapareció. Ejecutado así porque el proyecto real tiene menos de 20 estudiantes.

---

## Módulo 5: Estadísticas e historial

**Precondiciones:** el estudiante completó pruebas en al menos 2 áreas, con resultados distintos. Para los pasos del historial, anotar antes cuántas pruebas tiene. Para el paso 5.11 se necesita además una cuenta de estudiante sin ninguna prueba.

| Paso | Acción | Resultado esperado | Resultado |
| ---- | ------ | ------------------ | --------- |
| 5.1 | Abrir `/estadisticas`. | Carga sin error. "Pruebas" muestra el número de resultados del estudiante y "Promedio general" el porcentaje de aciertos sobre todas las preguntas respondidas. | [x] Pasa  [ ] Falla |
| 5.2 | Revisar "Progreso por área". | Hay una barra por cada área con su porcentaje de aciertos. Las áreas sin pruebas muestran 0%. El color depende del valor: 80% o más, 60% o más, o menos de 60%. | [x] Pasa  [ ] Falla |
| 5.3 | Revisar "Temas recomendados". | Se listan hasta 2 áreas con menos de 60%, las más bajas primero. Las áreas sin pruebas (0%) también se recomiendan. | [x] Pasa  [ ] Falla |
| 5.4 | Completar una prueba más y volver a `/estadisticas`. | Los valores se actualizan. Las pruebas de simulacro cuentan en el total y en el promedio general, pero no en el progreso por área. | [x] Pasa  [ ] Falla |
| 5.5 | Tocar "Practicar". | Navega a `/practica`. | [x] Pasa  [ ] Falla |
| 5.6 | En un ancho de más de 600 px, abrir `/practica` y tocar "Historial". | Navega a `/historial` (no a `/estadisticas`). Se ve la etiqueta "MI PROGRESO", el título "Historial", la sección "Resultados anteriores" con el texto "Tus cuestionarios aparecen del más reciente al más antiguo." y el botón "Practicar". **Comportamiento actual conocido:** en 600 px o menos el botón "Historial" de Práctica se oculta por CSS y no hay otro acceso desde la interfaz (solo escribiendo `/historial`). | [x] Pasa  [ ] Falla |
| 5.7 | Revisar la lista de `/historial`. | Hay una fila por cada prueba del estudiante (la cantidad coincide con "Pruebas" de `/estadisticas` y con los documentos de `resultados` con su `usuarioId`), ordenadas de la más reciente a la más antigua. Cada fila muestra "Cuestionario", la fecha y hora, "Puntaje" en %, "Correctas", "Incorrectas" y la etiqueta "Aprobado" (60% o más) o "No aprobado". | [x] Pasa  [ ] Falla |
| 5.8 | Completar una prueba nueva y volver a `/historial`. | La prueba nueva aparece en la primera fila, con su puntaje y sus cantidades de correctas e incorrectas. | [x] Pasa  [ ] Falla |
| 5.9 | Tocar una fila del historial. | Navega a `/resultados/{id}` y muestra el resultado de esa prueba. | [x] Pasa  [ ] Falla |
| 5.10 | Comparar cada fila con lo que pide la ERS (RF-012): historial cronológico con fecha, área, puntaje y tiempo. | Fecha y puntaje se cubren. **Comportamiento actual conocido:** la fila no muestra el área ni el tiempo empleado, y el título siempre dice "Cuestionario", también en los simulacros. Este paso falla hoy respecto de la ERS. | [ ] Pasa  [x] Falla |
| 5.11 | Con una cuenta de estudiante sin ninguna prueba, abrir `/historial`. | Estado vacío: título "Historial", el texto "Todavía no completaste ningún cuestionario" y el botón "Realizar cuestionario", que navega a `/practica`. | [x] Pasa  [ ] Falla |
| 5.12 | En el proyecto de pruebas real (no en emuladores), comprobar en la consola de Firestore, sección Índices, que el índice compuesto de `resultados` (`usuarioId` ascendente y `fecha` descendente) está "Habilitado"; luego abrir `/historial`. | Con el índice habilitado la lista carga. Sin él, la consulta falla y se ve "No se pudo cargar el historial" con el botón "Intentar nuevamente" (`/estadisticas` usa la misma consulta). Este paso no se puede verificar con emuladores: no exigen índices compuestos. | [x] Pasa  [ ] Falla |

**Cierre del módulo 5:**

- Estado: [ ] Aprobado  [x] Con fallas  [ ] Bloqueado
- Fecha / Tester / Entorno: 2026-10-18 / Claude (implementador del proyecto; ejecución no independiente de QA) / `learnfex-dev-oscar`, función `calificarPrueba` y reglas desplegadas el 2026-10-15, cliente local Vite sobre `main` `3ac0365`
- Evidencia (captura, log o enlace): valores observados y lecturas REST descritos abajo; sin capturas.
- Observaciones:
  - 5.1: con 4 pruebas (Inglés 75%, simulacro 60%, Matemáticas 100%, Ciencias Naturales 25%): "Pruebas 4" y "Promedio general 64%" (21 correctas de 33 respondidas, 63,6%). Carga sin error: confirma además que el índice compuesto funciona.
  - 5.2: una barra por área: Ciencias Naturales 25% (`progress-fill--danger`), Inglés 75% (`progress-fill--primary`), Lectura Crítica 0% (`danger`), Matemáticas 100% (`progress-fill--success`), Ciencias Sociales y Ciudadanas 0% (`danger`).
  - 5.3: "Temas recomendados": Lectura Crítica y Ciencias Sociales y Ciudadanas (las dos con 0%, sin pruebas), por debajo de Ciencias Naturales (25%). Tras la quinta prueba se vieron Ciencias Sociales (0%) y Ciencias Naturales (25%).
  - 5.4: se completó Lectura Crítica con 50% (2 de 4): "Pruebas 5", "Promedio general 62%" (23 de 37) y Lectura Crítica 50%. El simulacro (60%) cuenta en el total y el promedio general; en el progreso por área, Inglés sigue en 75%, Matemáticas en 100% y Ciencias Naturales en 25%, sin las preguntas del simulacro.
  - 5.5: "Practicar" navegó a `/practica`.
  - 5.6: a 1280 px, "Historial" en `/practica` navegó a `/historial` con "MI PROGRESO", "Historial", "Consulta los cuestionarios que has realizado y revisa tus resultados.", "Resultados anteriores", "Tus cuestionarios aparecen del más reciente al más antiguo." y "Practicar". Comportamiento conocido verificado: a 600 px el botón existe en el DOM pero `.practice-header-actions` queda con `display: none` (regla `@media (max-width: 600px)` de `Practice.css`).
  - 5.7: 5 filas, igual que "Pruebas 5" y que los 5 `resultados` del usuario por REST, de la más reciente a la más antigua (50%, 25%, 100%, 60%, 75%), cada una con "Cuestionario", fecha y hora (por ejemplo "18/10/2026, 11:51 p. m."), "Puntaje" %, "Correctas", "Incorrectas" y "Aprobado" o "No aprobado". La fila del simulacro también dice "Cuestionario".
  - 5.8: con la segunda cuenta (11 pruebas), una prueba nueva (Inglés, 100%, 4 correctas, 0 incorrectas) apareció en la primera fila de un historial de 11 filas, encima de la anterior (25%).
  - 5.9: tocar la tercera fila abrió `/resultados/Qr8ryZpwzVT7C9g94E4f_7XRH...` con 100%, 5 correctas, 0 incorrectas.
  - 5.10: falla conocida. La fila no muestra el área ni el tiempo empleado y los simulacros se titulan "Cuestionario". Lo cubre la tarjeta de Sprint 7 "[Sprint 7 - 12] [01] Frontend: Historial accesible desde el celular, con título del cuestionario y tiempo empleado (RF-012)".
  - 5.11: con la segunda cuenta aún sin pruebas: "Historial", "Todavía no completaste ningún cuestionario" y el botón "Realizar cuestionario", que navegó a `/practica`.
  - 5.12: por la API de administración de Firestore el índice de `resultados` (`usuarioId` ascendente, `fecha` descendente, `__name__` descendente) está en estado READY. `/historial` y `/estadisticas` cargaron sin errores. Aquí sí es verificable, a diferencia de los emuladores.

---

## Módulo 6: Logros

**Precondiciones:** cuenta de estudiante con 0, 1, 5 y luego 10 pruebas completadas en distintos momentos (los dos últimos umbrales son opcionales por duración). Detalle en `docs/qa/casos-prueba-gamificacion.md`.

| Paso | Acción | Resultado esperado | Resultado |
| ---- | ------ | ------------------ | --------- |
| 6.1 | Desde `/perfil`, tocar "Logros". | Se abre `/logros`. Los logros no están en la barra de navegación. | [x] Pasa  [ ] Falla |
| 6.2 | Con 0 pruebas, revisar la lista. | Se ven los 3 logros del catálogo, todos "Bloqueado". | [x] Pasa  [ ] Falla |
| 6.3 | Tras la primera prueba, volver a `/logros`. | "Primer paso" figura "Desbloqueado" con la fecha del día; los otros dos siguen bloqueados. | [x] Pasa  [ ] Falla |
| 6.4 | Con 5 pruebas: revisar `/logros`. Con 10 (opcional): revisar de nuevo. | Con 5, "Estudiante dedicado" se desbloquea. Con 10, "Maestro de las áreas". Las fechas de los anteriores no cambian. | [x] Pasa  [ ] Falla |

**Cierre del módulo 6:**

- Estado: [x] Aprobado  [ ] Con fallas  [ ] Bloqueado
- Fecha / Tester / Entorno: 2026-10-18 / Claude (implementador del proyecto; ejecución no independiente de QA) / `learnfex-dev-oscar`, función `calificarPrueba` y reglas desplegadas el 2026-10-15, cliente local Vite sobre `main` `3ac0365`
- Evidencia (captura, log o enlace): valores observados y lecturas REST descritos abajo; sin capturas.
- Observaciones:
  - Todo el módulo se ejecutó con la segunda cuenta (`...-b`), que empezó con 0 pruebas, y se llegó a 10 pruebas completadas en pantalla (11 con la del paso 7.5).
  - 6.1: desde `/perfil`, "Logros" abrió `/logros`; la navegación solo tiene Inicio, Práctica, Estadísticas, Ranking y Perfil.
  - 6.2: con 0 pruebas, "Estudiante dedicado", "Maestro de las áreas" y "Primer paso", los tres "Bloqueado".
  - 6.3: tras la primera prueba (Inglés, 75%): "Primer paso" con "Desbloqueado 18/10/2026"; los otros dos "Bloqueado". REST: `logrosObtenidos/primer_quiz` con `fechaObtenido` 2026-10-19T04:52:52Z (UTC).
  - 6.4: con 4 pruebas seguían bloqueados los dos últimos. Con 5: "Estudiante dedicado" se desbloqueó (REST `cinco_simulacros` 04:53:46Z). Con 10: "Maestro de las áreas" (REST `diez_simulacros` 04:54:32Z). Las fechas de los anteriores no cambiaron (`primer_quiz` seguía en 04:52:52Z). El XP final tras las 10 pruebas fue 320, igual a la suma de correctas x 10.

---

## Módulo 7: Perfil

**Precondiciones:** sesión iniciada como estudiante.

| Paso | Acción | Resultado esperado | Resultado |
| ---- | ------ | ------------------ | --------- |
| 7.1 | Abrir `/perfil` y recargar (F5). | Se muestran correo, rol "estudiante", XP y nivel iguales a `usuarios/{uid}` en Firestore. Sin recargar, tras una prueba, el XP puede verse desactualizado (comportamiento actual conocido: el perfil se carga una sola vez al iniciar sesión). | [x] Pasa  [ ] Falla |
| 7.2 | Cambiar nombre, apellido y colegio y tocar "Guardar cambios". | Aparece "Cambios guardados correctamente". Tras recargar, los valores persisten y coinciden con Firestore. | [x] Pasa  [ ] Falla |
| 7.3 | Revisar el formulario. | Solo se pueden editar nombre, apellido y colegio. No hay campos para rol, estado, XP, nivel ni correo. | [x] Pasa  [ ] Falla |
| 7.4 | Opcional: con DevTools en modo sin conexión, intentar guardar. | Aparece "No se pudieron guardar los cambios, intentá de nuevo". | [ ] Pasa  [ ] Falla (No ejecutado, ver Observaciones) |
| 7.5 | Opcional: completar una prueba nueva y abrir `/ranking`. | El nombre de la fila del estudiante refleja el cambio del paso 7.2 (el ranking copia el nombre al calificar una prueba). | [x] Pasa  [ ] Falla |

**Cierre del módulo 7:**

- Estado: [x] Aprobado  [ ] Con fallas  [ ] Bloqueado
- Fecha / Tester / Entorno: 2026-10-18 / Claude (implementador del proyecto; ejecución no independiente de QA) / `learnfex-dev-oscar`, función `calificarPrueba` y reglas desplegadas el 2026-10-15, cliente local Vite sobre `main` `3ac0365`
- Evidencia (captura, log o enlace): valores observados y lecturas REST descritos abajo; sin capturas.
- Observaciones:
  - Aprobado salvo el paso 7.4, que es opcional y no se ejecutó.
  - Se ejecutó con la segunda cuenta (`...-b`).
  - 7.1: tras 10 pruebas y sin recargar, el perfil mostraba "XP 0" (comportamiento conocido: el perfil se carga al iniciar sesión). Recargando se vio correo `qa-e2e-1792384962-b@learnfex-dev.test`, rol "estudiante", "XP 320" y "Nivel 1", iguales a `usuarios/{uid}`.
  - 7.2: se cambió a nombre `qa-e2e-1792384962-ed`, apellido `Otro2` y colegio `Colegio QA e2e`: apareció "Cambios guardados correctamente". REST y recarga mostraron los mismos tres valores.
  - 7.3: el formulario solo tiene los campos `nombre`, `apellido` y `colegio`. Correo, rol, XP y nivel se muestran como texto, no editables; no hay campo para el estado.
  - 7.4: **No ejecutado.** No se puede cortar la red del navegador integrado de forma segura, y simularlo con código inventaría el resultado.
  - 7.5: con una prueba nueva (Inglés, 100%) el ranking mostró la fila "qa-e2e-1792384962-ed" (nombre editado, con "Tú" y 360 pts), mientras la primera cuenta, que no cambió su nombre, siguió como "qa-e2e-1792384962" con 210 pts.

---

## Módulo 8: Menú del Perfil (Mi progreso, cambio de contraseña y cerrar sesión)

**Precondiciones:** sesión iniciada como estudiante, con una cuenta de prueba cuyo correo permita recibir mensajes (para el paso 8.3). Los accesos se ven en `/perfil` (`src/pages/student/Profile/Profile.jsx`). Este módulo va al final del recorrido del estudiante porque cierra la sesión.

| Paso | Acción | Resultado esperado | Resultado |
| ---- | ------ | ------------------ | --------- |
| 8.1 | Abrir `/perfil` y revisar el menú. | Se ven cuatro accesos: "Logros", "Mi progreso", "Configuración" y "Cerrar sesión". | [x] Pasa  [ ] Falla |
| 8.2 | Tocar "Mi progreso". | Navega a `/estadisticas`. | [x] Pasa  [ ] Falla |
| 8.3 | Volver a `/perfil` y tocar "Configuración" (cambio de contraseña). | Se envía un correo de restablecimiento de contraseña a `profile.correo` y aparece "Te enviamos un correo para cambiar tu contraseña". El correo llega a la bandeja de la cuenta de prueba. **Observación:** pese al nombre del acceso, "Configuración" no abre ninguna pantalla; su única acción es enviar ese correo. | [ ] Pasa  [ ] Falla (No ejecutado en parte, ver Observaciones) |
| 8.4 | Opcional: con DevTools en modo sin conexión, tocar "Configuración". | Aparece "No se pudo enviar el correo para cambiar la contraseña, intentá de nuevo". | [ ] Pasa  [ ] Falla (No ejecutado, ver Observaciones) |
| 8.5 | Tocar "Cerrar sesión" y cancelar el aviso de confirmación. | Aparece "¿Estás seguro de que querés cerrar sesión?"; al cancelar la sesión sigue activa y se permanece en `/perfil`. | [x] Pasa  [ ] Falla |
| 8.6 | Tocar "Cerrar sesión" y aceptar. | Se navega a `/` (pantalla de inicio de sesión). | [x] Pasa  [ ] Falla |
| 8.7 | Tras cerrar sesión, escribir `/inicio`, `/perfil` y `/historial` en la barra de direcciones, y probar el botón "Atrás" del navegador. | Cada ruta redirige a `/`: ya no hay sesión y no se ve ninguna pantalla del estudiante. | [x] Pasa  [ ] Falla |
| 8.8 | Iniciar sesión con la cuenta de administrador. | Se navega a `/admin`: el cierre de sesión permite cambiar de cuenta sin ventanas privadas. | [x] Pasa  [ ] Falla |

**Cierre del módulo 8:**

- Estado: [ ] Aprobado  [ ] Con fallas  [ ] Bloqueado (Parcial: sin fallas; 8.3 solo se comprobó en parte y 8.4 no se ejecutó)
- Fecha / Tester / Entorno: 2026-10-18 / Claude (implementador del proyecto; ejecución no independiente de QA) / `learnfex-dev-oscar`, función `calificarPrueba` y reglas desplegadas el 2026-10-15, cliente local Vite sobre `main` `3ac0365`
- Evidencia (captura, log o enlace): valores observados y lecturas REST descritos abajo; sin capturas.
- Observaciones:
  - Se ejecutó con la segunda cuenta (`...-b`).
  - 8.1: el menú tiene "Logros", "Mi progreso", "Configuración" y "Cerrar sesión".
  - 8.2: "Mi progreso" navegó a `/estadisticas`.
  - 8.3: **No ejecutado en parte.** Al tocar "Configuración" apareció "Te enviamos un correo para cambiar tu contraseña" y no se abrió ninguna pantalla. La cuenta de prueba usa un dominio `.test` sin bandeja, así que no se pudo comprobar que el correo llegue.
  - 8.4: **No ejecutado.** No se puede cortar la red del navegador integrado de forma segura.
  - 8.5: con `window.confirm` sobrescrito para devolver `false`, el aviso fue "¿Estás seguro de que querés cerrar sesión?"; se permaneció en `/perfil` con el menú visible.
  - 8.6: con `window.confirm` devolviendo `true`, navegó a `/` (pantalla "Iniciar sesión").
  - 8.7: sin sesión, escribir `/inicio`, `/perfil` y `/historial` redirigió cada vez a `/` (pantalla de inicio de sesión); el botón "Atrás" también terminó en `/`.
  - 8.8: con la cuenta de administrador temporal se navegó a `/admin`. Los cambios de cuenta de toda la ejecución se hicieron con el cierre de sesión de la aplicación o borrando la sesión local del navegador integrado, sin ventanas privadas.

---

# Recorrido del administrador

**Precondiciones:** cuenta de administrador (ver precondiciones generales). Haber ejecutado antes algunos módulos del estudiante para que haya datos (usuarios, resultados). Los controles de acceso (qué rutas y datos puede usar cada rol) se verifican en detalle en `docs/qa/verificacion-rbac.md`. La navegación del panel incluye un botón "Cerrar sesión" (con aviso de confirmación); el administrador también puede cerrar sesión entrando a `/perfil`, que está abierto para su rol.

## Módulo A1: Acceso del administrador y Dashboard

| Paso | Acción | Resultado esperado | Resultado |
| ---- | ------ | ------------------ | --------- |
| A1.1 | En `/`, iniciar sesión con la cuenta de administrador. | Se navega a `/admin` (no a `/inicio`). Se ve el encabezado "Panel de administración" y la navegación con Dashboard, Usuarios, Preguntas, Simulacros, Logros, Reportes, Configuración y Cerrar sesión. | [x] Pasa  [ ] Falla |
| A1.2 | Observar el Dashboard. | Cargan "Usuarios totales", "Simulacros realizados" (cantidad de resultados guardados), "Preguntas en banco" y "Promedio general", y "Actividad reciente" con los últimos resultados (nombre, puntaje y fecha relativa). Sin errores en consola. | [x] Pasa  [ ] Falla |
| A1.3 | Comparar los números con Firestore. | "Usuarios totales" = documentos en `usuarios`; "Preguntas en banco" = documentos en `preguntas`; "Simulacros realizados" = documentos en `resultados`. | [x] Pasa  [ ] Falla |
| A1.4 | Recorrer la navegación del panel. | Cada sección abre su pantalla y queda marcada como activa. En menos de 768 px la navegación del panel está abajo. | [x] Pasa  [ ] Falla |

**Cierre del módulo A1:**

- Estado: [x] Aprobado  [ ] Con fallas  [ ] Bloqueado
- Fecha / Tester / Entorno: 2026-10-18 / Claude (implementador del proyecto; ejecución no independiente de QA) / `learnfex-dev-oscar`, función `calificarPrueba` y reglas desplegadas el 2026-10-15, cliente local Vite sobre `main` `3ac0365`
- Evidencia (captura, log o enlace): valores observados y lecturas REST descritos abajo; sin capturas.
- Observaciones:
  - A1.1: el inicio de sesión llevó a `/admin` con "Panel de administración" y la navegación Dashboard, Usuarios, Preguntas, Simulacros, Logros, Reportes, Configuración y "Cerrar sesión". Este último botón (con el aviso "¿Estás seguro de que querés cerrar sesión?", que lleva a `/`) no figuraba en la versión anterior del documento: se actualizó el paso y la nota inicial.
  - A1.2: "Usuarios totales 13", "Simulacros realizados 86", "Preguntas en banco 21", "Promedio general 86%" y "Actividad reciente" con los últimos resultados (nombre, puntaje y "hace 1 minuto"). Sin errores de esta pantalla en la consola (los únicos errores de la sesión fueron el 400 del login fallido del paso 1.2 y las claves duplicadas de A4.3).
  - A1.3: REST: 13 documentos en `usuarios`, 21 en `preguntas` y 86 en `resultados`; promedio de `puntaje` de los 86 resultados: 85,94 (se ve 86%).
  - A1.4: las 7 secciones abrieron su pantalla (`/admin`, `/admin/usuarios`, `/admin/preguntas`, `/admin/simulacros`, `/admin/logros`, `/admin/reportes`, `/admin/configuracion`) y quedaron marcadas como activas. A 1280 px la navegación está arriba y a 600 px abajo (y = 837 de 900).

---

## Módulo A2: Usuarios

| Paso | Acción | Resultado esperado | Resultado |
| ---- | ------ | ------------------ | --------- |
| A2.1 | Abrir `/admin/usuarios`. | Se listan los usuarios con nombre, correo, rol y estado, de a 10, con "Cargar más" si hay más. | [x] Pasa  [ ] Falla |
| A2.2 | Buscar por nombre o correo. | La lista se filtra; sin coincidencias aparece "No se encontraron usuarios.". | [x] Pasa  [ ] Falla |
| A2.3 | Tocar "Ver detalle" en una fila. | Se abre el detalle con nombre, correo, rol, estado, XP, nivel y colegio. Se cierra con "Cerrar" o la "x". | [x] Pasa  [ ] Falla |
| A2.4 | Cambiar el rol de una cuenta de prueba y volver a dejarlo. | El cambio se refleja en la fila y en `usuarios/{uid}.rol`. El usuario afectado ve el cambio al recargar su sesión. | [x] Pasa  [ ] Falla |
| A2.5 | Tocar "Desactivar" en una cuenta de prueba y confirmar; luego "Activar". | El estado cambia a Inactivo y vuelve a Activo, y se refleja en `usuarios/{uid}.estado`. **Comportamiento actual conocido:** mientras está inactiva, la cuenta puede seguir usando la aplicación (ver `docs/qa/verificacion-rbac.md`, caso 18). | [x] Pasa  [ ] Falla |

**Cierre del módulo A2:**

- Estado: [x] Aprobado  [ ] Con fallas  [ ] Bloqueado
- Fecha / Tester / Entorno: 2026-10-18 / Claude (implementador del proyecto; ejecución no independiente de QA) / `learnfex-dev-oscar`, función `calificarPrueba` y reglas desplegadas el 2026-10-15, cliente local Vite sobre `main` `3ac0365`
- Evidencia (captura, log o enlace): valores observados y lecturas REST descritos abajo; sin capturas.
- Observaciones:
  - Las acciones de rol y estado se hicieron solo sobre las cuentas temporales `qa-e2e-1792384962...`; las cuentas del equipo que aparecen en la lista no se tocaron.
  - A2.1: 10 filas con nombre, correo, rol (selector), estado y acciones, y "Cargar más"; al tocarlo se completaron las 13 sin repetidas. Tras cargar todas, el botón aguanta un clic más (que no agrega filas) y luego desaparece.
  - A2.2: buscar por correo (`qa-e2e-1792384962-adm`) y por nombre (`Otro2`) dejó una fila; "zzzz-no-existe" mostró "No se encontraron usuarios."; vaciar el buscador restauró las 10 filas.
  - A2.3: "Ver detalle" abrió "Detalle del usuario" con Nombre, Correo, Rol "estudiante", Estado "activo", XP 210, Nivel 1 y Colegio "Sin colegio". Se cerró con la "x" y con "Cerrar".
  - A2.4: se cambió el rol de la primera cuenta de prueba a "Administrador": la fila lo mostró y REST dio `rol: administrador`. Al iniciar sesión con esa cuenta se llegó a `/admin` (el cambio se ve al volver a entrar). Se la devolvió a "Estudiante" desde el panel y REST dio `rol: estudiante`.
  - A2.5: en la segunda cuenta de prueba, "Desactivar" mostró "¿Deseas desactivar la cuenta de qa-e2e-1792384962-ed Otro2?"; el estado pasó a "Inactivo" (REST `inactivo`) y el botón a "Activar", que con "¿Deseas activar la cuenta de ...?" lo devolvió a "Activo" (REST `activo`). El comportamiento conocido (la cuenta inactiva puede seguir usando la aplicación) no se volvió a comprobar en esta ejecución.

---

## Módulo A3: Preguntas

| Paso | Acción | Resultado esperado | Resultado |
| ---- | ------ | ------------------ | --------- |
| A3.1 | Abrir `/admin/preguntas`. | Se listan las preguntas con área, dificultad, enunciado y opciones, con la correcta resaltada. El contador coincide con las filas. | [x] Pasa  [ ] Falla |
| A3.2 | Buscar por texto y filtrar por área (por ejemplo `matematicas`) y por dificultad. | Solo quedan las preguntas que cumplen los criterios. | [x] Pasa  [ ] Falla |
| A3.3 | Tocar "+ Nueva pregunta" y guardar sin enunciado; luego, con el resto completo, guardar sin elegir la respuesta correcta. | Aparecen los mensajes "El enunciado es obligatorio." y "Debes seleccionar una respuesta correcta.". No se guarda nada. | [x] Pasa  [ ] Falla |
| A3.4 | Crear una pregunta válida con `areaId` igual al ID de un área (por ejemplo `matematicas`), 3 opciones y respuesta correcta. | Se guarda y aparece en la lista; existe en `preguntas` con sus opciones `{id: A, text: ...}`. | [x] Pasa  [ ] Falla |
| A3.5 | Editar esa pregunta (cambiar enunciado y respuesta correcta). | Los cambios se reflejan en la lista y en Firestore. | [x] Pasa  [ ] Falla |
| A3.6 | Como estudiante, iniciar un cuestionario del área elegida. | La pregunta nueva forma parte del banco del área y puede aparecer en el cuestionario (con el seed, el cuestionario toma todas las preguntas del área hasta 10: 8 más la nueva). | [x] Pasa  [ ] Falla |
| A3.7 | Eliminar la pregunta de prueba y confirmar. | Desaparece de la lista y de Firestore. **Comportamiento actual conocido:** no hay advertencia sobre el impacto en resultados ya guardados (CU-05, flujo alternativo 4a de la ERS); la retroalimentación de esos resultados omite la pregunta borrada en silencio. | [x] Pasa  [ ] Falla |

**Cierre del módulo A3:**

- Estado: [x] Aprobado  [ ] Con fallas  [ ] Bloqueado
- Fecha / Tester / Entorno: 2026-10-18 / Claude (implementador del proyecto; ejecución no independiente de QA) / `learnfex-dev-oscar`, función `calificarPrueba` y reglas desplegadas el 2026-10-15, cliente local Vite sobre `main` `3ac0365`
- Evidencia (captura, log o enlace): valores observados y lecturas REST descritos abajo; sin capturas.
- Observaciones:
  - La pregunta temporal (`l5gdSrrNwGhjVlbFxPwL`, área `matematicas`) existió unos minutos en el banco real y se borró dentro del paso A3.7. Solo se editó y borró esa pregunta.
  - A3.1: 21 tarjetas, igual al contador "21 preguntas"; en cada una la opción correcta lleva la clase `correct`.
  - A3.2: el texto "factorizar" dejó 1 pregunta; el área `matematicas` dejó 5; área y dificultad "Media" dejaron 4; solo "Media" dejó 12; sin filtros volvieron las 21.
  - A3.3: sin enunciado apareció "El enunciado es obligatorio." (también "El areaId es obligatorio." si falta el área) y, con el resto completo y sin respuesta correcta, "Debes seleccionar una respuesta correcta.". No se guardó nada (el contador siguió en 21). Los mensajes se muestran en el bloque de error de la cabecera de la pantalla (`.questions-error`), no dentro del modal; no se comprobó visualmente si quedan tapados por el modal abierto.
  - A3.4: con enunciado `qa-e2e-1792384962 pregunta temporal`, `areaId` `matematicas`, dificultad media, 3 opciones y respuesta B: se guardó y la lista pasó a 22. REST: `opciones` `[{id: A, ...}, {id: B, ...}, {id: C, ...}]`, `respuestaCorrecta: B`.
  - A3.5: se cambiaron el enunciado (`... temporal editada`) y la respuesta correcta a C: la lista y REST lo reflejaron.
  - A3.6 (y C.3): con la segunda cuenta de estudiante, el cuestionario de Matemáticas mostró "Pregunta 1 de 6" (desvío de entorno: las 5 preguntas reales de Matemáticas más la nueva) y la pregunta nueva fue la primera. Se abandonó ese cuestionario (`MkuLxaUgFQaSrWsz3uKU`, 6 preguntas) sin finalizarlo.
  - A3.7: el aviso fue "¿Seguro que quieres eliminar esta pregunta?"; la pregunta desapareció de la lista (21 de nuevo) y REST devolvió 404 para el documento. No hubo advertencia sobre resultados guardados (comportamiento conocido).

---

## Módulo A4: Simulacros

| Paso | Acción | Resultado esperado | Resultado |
| ---- | ------ | ------------------ | --------- |
| A4.1 | Con al menos un cuestionario o simulacro creado por un estudiante después de que la aplicación guarda `fechaCreacion`, abrir `/admin/simulacros`. | Se listan los cuestionarios con las columnas Nombre (el `titulo`), Tipo ("Simulacro" o "Cuestionario"), Área (nombre del área; "Todas las áreas" en los simulacros), Creado (fecha y hora) y Estado ("activo" o "inactivo"), con la acción "Desactivar". Van ordenados del más reciente al más antiguo, de a 10, con el botón "Cargar más". Cada cuestionario que arma un estudiante al iniciar una prueba (también si lo abandona) aparece en la lista. | [x] Pasa  [ ] Falla |
| A4.2 | Como estudiante, iniciar un cuestionario por área; como administrador, recargar `/admin/simulacros`. | El cuestionario nuevo aparece en la primera fila, con Tipo "Cuestionario", el nombre del área elegida, la fecha y hora actuales y el Estado "activo". | [x] Pasa  [ ] Falla |
| A4.3 | Si hay más de 10 cuestionarios, tocar "Cargar más". | Se agrega la siguiente página sin repetir filas, manteniendo el orden por fecha descendente. | [ ] Pasa  [x] Falla |
| A4.4 | Tocar "Desactivar" en una fila y confirmar el aviso "¿Desactivar este simulacro?". | El estado cambia a "inactivo" y el botón queda deshabilitado; `cuestionarios/{id}.estado` es `inactivo`. La fila sigue en la lista. | [x] Pasa  [ ] Falla |
| A4.5 | Revisar si aparecen cuestionarios creados antes del PR #76 (sin campo `fechaCreacion` en Firestore). | **Comportamiento actual conocido:** no aparecen, porque la consulta ordena por `fechaCreacion` y Firestore omite los documentos que no tienen ese campo (decisión consciente: son descartables). Que no aparezcan es lo esperado, no un defecto; si la colección no tiene ningún cuestionario con `fechaCreacion`, se ve "No hay simulacros". | [x] Pasa  [ ] Falla |

**Cierre del módulo A4:**

- Estado: [ ] Aprobado  [x] Con fallas  [ ] Bloqueado
- Fecha / Tester / Entorno: 2026-10-18 / Claude (implementador del proyecto; ejecución no independiente de QA) / `learnfex-dev-oscar`, función `calificarPrueba` y reglas desplegadas el 2026-10-15, cliente local Vite sobre `main` `3ac0365`
- Evidencia (captura, log o enlace): valores observados y lecturas REST descritos abajo; sin capturas.
- Observaciones:
  - A4.1: 10 filas con Nombre, Tipo, Área, Creado y Estado más "Desactivar", ordenadas de la más reciente a la más antigua (por ejemplo "19/10/2026, 12:00 a. m." y luego "18/10/2026, 11:55 p. m."). Los simulacros dicen "Simulacro general / Simulacro / Todas las áreas". El cuestionario abandonado de A3.6 aparece en la primera fila. Cargando todas las páginas se llegó a 71 filas, igual a los 71 cuestionarios que tienen `fechaCreacion` por REST (de 106).
  - A4.2: la segunda cuenta de estudiante inició Matemáticas y al recargar `/admin/simulacros` la primera fila fue "Cuestionario de Matemáticas / Cuestionario / Matemáticas / 19/10/2026, 12:00 a. m. / activo".
  - A4.3: **falla.** Las páginas 2 a 8 se agregan bien sin repetir (10, 20, ... 70 y 71 filas). Pero el botón "Cargar más" no desaparece al llegar al final: con las 71 filas, un clic más deja 71 (la página vacía pone el cursor en `null`) y el clic siguiente vuelve a pedir la primera página y la agrega al final (81 filas; las filas 72 a 81 son las filas 1 a 10 repetidas). La consola registra "Encountered two children with the same key" con los ids de los cuestionarios repetidos. Causa: `Simulations.jsx` hace `setCursor(res.lastDoc)` también cuando la página llega vacía (`lastDoc` es `null`) y `loadQuizzes(true)` con cursor `null` consulta la primera página; no hay un estado de "no hay más páginas". La lista de usuarios, el ranking y las demás paginaciones sí se comportan bien. No encontré una tarjeta de Sprint 7 que lo cubra: brecha nueva.
  - A4.4: en el cuestionario abandonado de A3.6, "Desactivar" mostró "¿Desactivar este simulacro?"; la fila pasó a "inactivo", el botón quedó deshabilitado y REST dio `estado: inactivo` en `cuestionarios/MkuLxaUgFQaSrWsz3uKU`.
  - A4.5: los 35 cuestionarios sin `fechaCreacion` (106 menos 71) no aparecen en la lista. Es lo esperado.

---

## Módulo A5: Logros

| Paso | Acción | Resultado esperado | Resultado |
| ---- | ------ | ------------------ | --------- |
| A5.1 | Abrir `/admin/logros`. | Se muestra "Configuración de Logros" con el catálogo (los 3 del seed: nombre, descripción y criterio). | [x] Pasa  [ ] Falla |
| A5.2 | Crear un logro con nombre, descripción y un criterio (`primer_quiz`, `cinco_simulacros` o `diez_simulacros`). | Se guarda, el formulario se limpia y el logro aparece en el catálogo. Existe en `logros`. | [x] Pasa  [ ] Falla |
| A5.3 | Dejar nombre o descripción vacíos y enviar. | No se crea nada. | [x] Pasa  [ ] Falla |
| A5.4 | Como estudiante, abrir `/logros`. | El logro nuevo aparece en la lista (bloqueado, o desbloqueado en la próxima prueba si cumple el criterio). | [x] Pasa  [ ] Falla |

**Cierre del módulo A5:**

- Estado: [x] Aprobado  [ ] Con fallas  [ ] Bloqueado
- Fecha / Tester / Entorno: 2026-10-18 / Claude (implementador del proyecto; ejecución no independiente de QA) / `learnfex-dev-oscar`, función `calificarPrueba` y reglas desplegadas el 2026-10-15, cliente local Vite sobre `main` `3ac0365`
- Evidencia (captura, log o enlace): valores observados y lecturas REST descritos abajo; sin capturas.
- Observaciones:
  - El logro temporal usó el criterio `diez_simulacros` y existió solo unos minutos: `calificarPrueba` otorga a cada estudiante todos los logros del catálogo cuyo criterio cumple, y se borró por REST justo después de A5.4 (el panel no tiene acción de borrar logros).
  - A5.1: "Configuración de Logros" con "Estudiante dedicado", "Maestro de las áreas" y "Primer paso", cada uno con descripción y criterio.
  - A5.2: se creó `qa-e2e-1792384962 logro` ("Logro temporal de QA e2e", `diez_simulacros`): apareció al inicio del catálogo y el formulario se limpió (campos vacíos y criterio de vuelta en `primer_quiz`). REST: `logros/cO2hYpaMMOFBXuSSpI4D` con `nombre`, `descripcion` y `criterio` (a diferencia de los 3 del seed, no tiene campo `id`).
  - A5.3: enviar con nombre y descripción vacíos, con solo el nombre y con solo la descripción no creó nada (el catálogo y REST siguieron en 3). No se muestra ningún mensaje de error.
  - A5.4: con la primera cuenta de estudiante (5 pruebas), `/logros` mostró "qa-e2e-1792384962 logro" como "Bloqueado" (necesita 10 pruebas), junto a los otros tres.

---

## Módulo A6: Reportes

| Paso | Acción | Resultado esperado | Resultado |
| ---- | ------ | ------------------ | --------- |
| A6.1 | Abrir `/admin/reportes`. | Se muestran "Total usuarios", "Total pruebas" y "Promedio general", y "Desempeño por área" con una barra por área. Sin errores en consola. | [x] Pasa  [ ] Falla |
| A6.2 | Comparar con el Dashboard y Firestore. | "Total usuarios" y "Total pruebas" coinciden con el Dashboard. El promedio de cada área es el promedio de `puntaje` de los resultados de cuestionarios de esa área; los simulacros cuentan en el promedio general pero no en ninguna área. | [x] Pasa  [ ] Falla |
| A6.3 | Comparar el formato de "Promedio general" con el del Dashboard. | Mismo formato. **Comportamiento actual conocido:** el Dashboard lo muestra con "%" y Reportes sin "%". | [ ] Pasa  [x] Falla |

**Cierre del módulo A6:**

- Estado: [ ] Aprobado  [x] Con fallas  [ ] Bloqueado
- Fecha / Tester / Entorno: 2026-10-18 / Claude (implementador del proyecto; ejecución no independiente de QA) / `learnfex-dev-oscar`, función `calificarPrueba` y reglas desplegadas el 2026-10-15, cliente local Vite sobre `main` `3ac0365`
- Evidencia (captura, log o enlace): valores observados y lecturas REST descritos abajo; sin capturas.
- Observaciones:
  - A6.1: "Total usuarios 13", "Total pruebas 86", "Promedio general 86" y "Desempeño por área": Ciencias Naturales 82%, Inglés 75%, Lectura Crítica 82%, Matemáticas 91%, Ciencias Sociales y Ciudadanas 94%. Sin errores propios de la pantalla en la consola.
  - A6.2: coinciden con el Dashboard (13 y 86) y con REST: promedios de `puntaje` por área calculados con el `areaId` de cada cuestionario: Ciencias Naturales 82,14 (21 resultados), Inglés 75,00 (8), Lectura Crítica 81,82 (11), Matemáticas 90,70 (37) y Ciencias Sociales 93,75 (8). El simulacro (60%) cuenta en el promedio general (85,94) y en ningún área.
  - A6.3: falla conocida. El Dashboard muestra "86%" y Reportes "86" (sin "%"). Lo cubre la tarjeta de Sprint 7 "[Sprint 7 - 17] [01] Frontend: Reportes del admin — mostrar el promedio general con el símbolo de porcentaje".

---

## Módulo A7: Configuración

| Paso | Acción | Resultado esperado | Resultado |
| ---- | ------ | ------------------ | --------- |
| A7.1 | Abrir `/admin/configuracion`. | Se muestra "Configuración general" con nombre de la aplicación, descripción y email de soporte (nombre "LearnFex" por defecto si no hay datos). | [x] Pasa  [ ] Falla |
| A7.2 | Cambiar los tres campos y tocar "Guardar cambios". | Aparece "Guardado" y los valores persisten tras recargar; existen en `configuracion/general`. | [ ] Pasa  [ ] Falla (No ejecutado, ver Observaciones) |
| A7.3 | Borrar el nombre e intentar guardar. | El campo es obligatorio y no se guarda. | [x] Pasa  [ ] Falla |
| A7.4 | Restaurar los valores originales. | La configuración vuelve al estado inicial. | [ ] Pasa  [ ] Falla (No ejecutado, ver Observaciones) |

**Cierre del módulo A7:**

- Estado: [ ] Aprobado  [ ] Con fallas  [ ] Bloqueado (Parcial: sin fallas; A7.2 y A7.4 no se ejecutaron)
- Fecha / Tester / Entorno: 2026-10-18 / Claude (implementador del proyecto; ejecución no independiente de QA) / `learnfex-dev-oscar`, función `calificarPrueba` y reglas desplegadas el 2026-10-15, cliente local Vite sobre `main` `3ac0365`
- Evidencia (captura, log o enlace): valores observados y lecturas REST descritos abajo; sin capturas.
- Observaciones:
  - A7.1: la pantalla mostró "Configuración general" con nombre `LearnFex`, la descripción "Plataforma de simulacros y práctica para el examen de Estado (verificación LearnFex)" y el email de soporte `soporte@learnfex.test`, iguales a `configuracion/general` por REST.
  - A7.2 y A7.4: **No ejecutados.** Guardar escribe el documento único `configuracion/general` del proyecto real y esta pantalla no tiene una entidad temporal propia sobre la que probar; se prefirió no arriesgar la configuración del equipo. Pendiente para una ejecución en un proyecto de pruebas descartable.
  - A7.3: con el nombre vacío, el campo (`required`) bloqueó el envío ("Completa este campo"): el formulario no llegó a enviarse y `configuracion/general` siguió idéntico por REST. Además, `updateConfiguracionGeneral` rechaza un nombre vacío. No se probó un nombre de solo espacios.
  - `configuracion/general` quedó idéntico al inicio y al final de la ejecución.

---

## Módulo C: Cruces entre estudiante y administrador

**Precondiciones:** una cuenta de estudiante y una de administrador, en navegadores o ventanas privadas distintas.

| Paso | Acción | Resultado esperado | Resultado |
| ---- | ------ | ------------------ | --------- |
| C.1 | Anotar en el Dashboard y en Reportes "Simulacros realizados"/"Total pruebas" y el promedio general. Como estudiante, completar una prueba. Volver al panel y recargar. | "Simulacros realizados" y "Total pruebas" suben 1. El promedio general cambia según el puntaje. "Actividad reciente" muestra el nombre del estudiante con el puntaje de la prueba. | [x] Pasa  [ ] Falla |
| C.2 | Como estudiante nuevo, registrarse y volver al panel (recargar `/admin/usuarios` y el Dashboard). | El estudiante aparece en Usuarios con rol Estudiante y estado Activo; "Usuarios totales" sube 1. | [x] Pasa  [ ] Falla |
| C.3 | Como administrador, crear una pregunta en un área y, como estudiante, iniciar un cuestionario de esa área. | La pregunta nueva forma parte del banco del cuestionario (ver A3.6). Eliminarla al terminar. | [x] Pasa  [ ] Falla |
| C.4 | Como estudiante, abrir `/admin`. | Se redirige a `/inicio` y no se ve nada del panel (ver `docs/qa/verificacion-rbac.md`). | [x] Pasa  [ ] Falla |

**Cierre del módulo C:**

- Estado: [x] Aprobado  [ ] Con fallas  [ ] Bloqueado
- Fecha / Tester / Entorno: 2026-10-18 / Claude (implementador del proyecto; ejecución no independiente de QA) / `learnfex-dev-oscar`, función `calificarPrueba` y reglas desplegadas el 2026-10-15, cliente local Vite sobre `main` `3ac0365`
- Evidencia (captura, log o enlace): valores observados y lecturas REST descritos abajo; sin capturas.
- Observaciones:
  - Los dos roles se alternaron en la misma pestaña, cerrando la sesión entre uno y otro, en lugar de usar dos ventanas.
  - C.1: antes: Dashboard "Simulacros realizados 86", "Promedio general 86%"; Reportes "Total pruebas 86", "Promedio general 86". Un estudiante completó una prueba de Ciencias Sociales con 0% y, al recargar el panel: "Simulacros realizados 87", "Total pruebas 87", promedio 85% (Dashboard) y 85 (Reportes), y "Actividad reciente" con "qa-e2e-1792384962 Estudiante / 0% / hace 11 segundos" en primer lugar. El promedio de Ciencias Sociales bajó de 94% a 83%.
  - C.2: un estudiante nuevo (`qa-e2e-1792384962-c`) se registró con la pantalla de Registro; en el panel, "Usuarios totales" pasó de 13 a 14 y `/admin/usuarios` mostró su fila con rol "Estudiante" y estado "Activo".
  - C.3: es el mismo recorrido que A3.6 (la pregunta nueva apareció como primera de un cuestionario de Matemáticas de 6) y se eliminó en A3.7.
  - C.4: con una cuenta de estudiante, abrir `/admin` terminó en `/inicio`, sin ningún elemento del panel.

---

## Resumen de la ejecución

Ejecución del 2026-10-18 contra `learnfex-dev-oscar` (cliente local sobre `main` `3ac0365`), por Claude como implementador del proyecto; no es una verificación independiente de QA.

| Módulo | Estado | Fecha | Tester | Evidencia |
| ------ | ------ | ----- | ------ | --------- |
| 1. Acceso e Inicio | [x] Aprobado  [ ] Con fallas  [ ] Bloqueado | 2026-10-18 | Claude (no independiente) | 8 PASA |
| 2. Práctica | [x] Aprobado  [ ] Con fallas  [ ] Bloqueado | 2026-10-18 | Claude (no independiente) | 6 PASA; reenvío `already-exists` verificado, XP sin duplicar |
| 3. Resultados y retroalimentación | [x] Aprobado  [ ] Con fallas  [ ] Bloqueado | 2026-10-18 | Claude (no independiente) | 6 PASA |
| 4. Ranking | [x] Aprobado  [ ] Con fallas  [ ] Bloqueado | 2026-10-18 | Claude (no independiente) | 4 PASA (4.2 y 4.4 con 24 documentos temporales de ranking) |
| 5. Estadísticas e historial | [ ] Aprobado  [x] Con fallas  [ ] Bloqueado | 2026-10-18 | Claude (no independiente) | 11 PASA, 1 FALLA (5.10, conocida) |
| 6. Logros | [x] Aprobado  [ ] Con fallas  [ ] Bloqueado | 2026-10-18 | Claude (no independiente) | 4 PASA (0, 1, 5 y 10 pruebas) |
| 7. Perfil | [x] Aprobado  [ ] Con fallas  [ ] Bloqueado | 2026-10-18 | Claude (no independiente) | 4 PASA, 1 No ejecutado (7.4, opcional) |
| 8. Menú del Perfil (Mi progreso, contraseña y cerrar sesión) | [ ] Aprobado  [ ] Con fallas  [ ] Bloqueado (Parcial) | 2026-10-18 | Claude (no independiente) | 6 PASA, 2 No ejecutados (8.3 en parte, 8.4) |
| A1. Acceso del administrador y Dashboard | [x] Aprobado  [ ] Con fallas  [ ] Bloqueado | 2026-10-18 | Claude (no independiente) | 4 PASA |
| A2. Usuarios | [x] Aprobado  [ ] Con fallas  [ ] Bloqueado | 2026-10-18 | Claude (no independiente) | 5 PASA |
| A3. Preguntas | [x] Aprobado  [ ] Con fallas  [ ] Bloqueado | 2026-10-18 | Claude (no independiente) | 7 PASA |
| A4. Simulacros | [ ] Aprobado  [x] Con fallas  [ ] Bloqueado | 2026-10-18 | Claude (no independiente) | 4 PASA, 1 FALLA (A4.3, nueva) |
| A5. Logros | [x] Aprobado  [ ] Con fallas  [ ] Bloqueado | 2026-10-18 | Claude (no independiente) | 4 PASA |
| A6. Reportes | [ ] Aprobado  [x] Con fallas  [ ] Bloqueado | 2026-10-18 | Claude (no independiente) | 2 PASA, 1 FALLA (A6.3, conocida) |
| A7. Configuración | [ ] Aprobado  [ ] Con fallas  [ ] Bloqueado (Parcial) | 2026-10-18 | Claude (no independiente) | 2 PASA, 2 No ejecutados (A7.2 y A7.4) |
| C. Cruces estudiante y administrador | [x] Aprobado  [ ] Con fallas  [ ] Bloqueado | 2026-10-18 | Claude (no independiente) | 4 PASA |

### Conteo de pasos

De los 89 pasos del documento: **81 PASA**, **3 FALLA** y **5 No ejecutados**.

- No ejecutados: 7.4 y 8.4 (cortar la red del navegador), 8.3 (en parte: el mensaje apareció, pero no se pudo comprobar la llegada del correo) y A7.2 y A7.4 (guardar y restaurar la configuración general real).

### Fallas encontradas

| Paso | Falla | Causa | Tarjeta que la cubre |
| ---- | ----- | ----- | -------------------- |
| 5.10 | La fila del historial no muestra el área ni el tiempo empleado, y los simulacros se titulan "Cuestionario" (RF-012). Falla conocida. | `History.jsx` usa un título fijo y no lee el `tiempoEmpleado` del resultado ni el área del cuestionario. | "[Sprint 7 - 12] [01] Frontend: Historial accesible desde el celular, con título del cuestionario y tiempo empleado (RF-012)" |
| A6.3 | "Promedio general" se ve como "86%" en el Dashboard y como "86" en Reportes. Falla conocida. | `Reports.jsx` muestra `stats.promedioGeneral` sin el símbolo. | "[Sprint 7 - 17] [01] Frontend: Reportes del admin — mostrar el promedio general con el símbolo de porcentaje" |
| A4.3 | En `/admin/simulacros`, "Cargar más" no desaparece al llegar a la última página y, tras una página vacía, el siguiente clic vuelve a agregar la primera página: filas repetidas (81 filas con 71 cuestionarios) y errores de claves duplicadas en la consola. | `Simulations.jsx` guarda `res.lastDoc` (`null` en una página vacía) como cursor y `loadQuizzes(true)` con cursor `null` consulta la primera página; falta un estado "no hay más páginas". | Ninguna encontrada: **brecha nueva** |

### Brechas nuevas y observaciones

- **Brecha nueva:** A4.3 (arriba). Sugerencia: devolver también un indicador de "hay más" (por ejemplo, pedir `pageSize + 1` o no actualizar el cursor cuando la página llega vacía) y ocultar el botón.
- Observación (no es falla de un paso): el orden de `cuestionarios/{id}.preguntas` no coincide con el orden que muestra `Quiz.jsx` (se arman en consultas distintas); con áreas de más de 10 preguntas incluso el conjunto podría diferir. Conviene mostrar las preguntas leyendo el cuestionario guardado.
- Observación: el botón "Cerrar sesión" del panel de administración y los datos reales de Inicio no figuraban en la versión anterior del documento; los pasos 1.4, 1.5 y A1.1 y la nota inicial del recorrido del administrador ya se actualizaron.
- Observación: en A3.3 los mensajes de validación se renderizan en la cabecera de la pantalla y no dentro del modal; no se comprobó visualmente si el modal los tapa.
- No verificado en esta ejecución: el comportamiento conocido de una cuenta "Inactiva" que sigue usando la aplicación (A2.5; ver `docs/qa/verificacion-rbac.md`, caso 18).

### Limpieza y estado final de Firestore

Se creó y se borró por REST (y por `accounts:delete` en Auth) todo lo temporal: 4 cuentas de Auth y sus documentos de `usuarios`, sus subcolecciones `logrosObtenidos` (5), 17 `resultados` con sus 87 `respuestas`, 18 `cuestionarios` (17 finalizados y 1 abandonado), 2 documentos de `ranking` (más 24 temporales del paso 4.4), 10 documentos de `estadisticas_progreso`, 1 pregunta y 1 logro. Conteos de colecciones antes y después: `usuarios` 10 y 10, `cuestionarios` 89 y 89, `resultados` 70 y 70, `ranking` 7 y 7, `preguntas` 21 y 21, `logros` 3 y 3, `areas` 5 y 5. Los documentos de esas colecciones quedaron idénticos a los del inicio, y `configuracion/general` quedó idéntico (`nombre` `LearnFex`, la misma descripción y `emailSoporte` `soporte@learnfex.test`).

## Notas finales

- Documentos relacionados en `docs/qa/`: `casos-prueba-simulacros.md`, `casos-prueba-gamificacion.md`, `verificacion-rbac.md`, `verificacion-responsive-practica.md` y `verificacion-responsive-sprint5.md`.
- Si un paso falla, registrar los pasos exactos para reproducirlo y el valor mostrado frente al esperado.
