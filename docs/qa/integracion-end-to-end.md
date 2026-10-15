# QA - Pruebas de integración end-to-end (estudiante y administrador)

Este documento es la plantilla de ejecución del recorrido completo de LearnFex: los módulos del estudiante y los del administrador, más los cruces entre ambos. Sirve para registrar, con evidencia, qué se probó, quién lo probó y qué resultó.

- Estado del documento: plantilla de ejecución. **Ningún módulo fue ejecutado todavía y ninguno está aprobado.** Todas las casillas están vacías a propósito: un módulo solo se marca como aprobado cuando una persona lo ejecutó y dejó fecha, tester, entorno y evidencia.
- Verificado contra el código de `main` en el commit `c3d71aa`. Si `main` cambió desde entonces, revisar los pasos antes de ejecutarlos.
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
| Fecha de inicio | |
| Tester | |
| Entorno (URL, navegador y versión, dispositivo) | |
| Commit o rama probada | |
| Proyecto de Firebase | |
| Cuenta de estudiante (correo) | |
| Cuenta de administrador (correo) | |

## Cómo registrar el resultado

- En cada tabla, marcar `[x]` Pasa o Falla por paso. Si un paso no se pudo ejecutar, dejarlo sin marcar y explicar por qué en Observaciones del módulo.
- Al cerrar el módulo, marcar una sola opción: Aprobado (todos los pasos pasan), Con fallas (algún paso falla) o Bloqueado (no se pudo ejecutar). No dejar un módulo como Aprobado sin evidencia.
- Un paso con "Comportamiento actual conocido" que falla exactamente como allí se describe se registra como Falla con la observación "falla conocida". Solo se abre un defecto nuevo si falla de otra manera.
- Adjuntar evidencia (capturas, logs, enlaces) y anotar dónde quedó guardada.

---

# Recorrido del estudiante

## Módulo 1: Acceso e Inicio

**Precondiciones:** ninguna sesión iniciada.

| Paso | Acción | Resultado esperado | Resultado |
| ---- | ------ | ------------------ | --------- |
| 1.1 | En `/registro`, crear una cuenta con nombre, apellido, correo válido, contraseña de 6 o más caracteres y confirmación igual. | Se navega a `/inicio`. En Firestore existe `usuarios/{uid}` con `rol: estudiante`, `estado: activo`, `xp: 0`, `nivel: 1`. | [ ] Pasa  [ ] Falla |
| 1.2 | En `/`, iniciar sesión con una contraseña incorrecta. | Aparece "Correo o contraseña incorrectos", sin indicar cuál campo falló. | [ ] Pasa  [ ] Falla |
| 1.3 | Iniciar sesión con las credenciales correctas. | Se navega a `/inicio` (el rol es estudiante). | [ ] Pasa  [ ] Falla |
| 1.4 | Observar `/inicio`. | Cargan el saludo, las tarjetas "Puntos", "Racha" y "Progreso", las acciones "Practicar" y "Mis resultados", las 5 áreas de aprendizaje (desde Firestore) y el bloque de ranking. Sin errores en consola. | [ ] Pasa  [ ] Falla |
| 1.5 | Revisar los valores de las tarjetas de `/inicio`. | Deberían ser los datos reales del estudiante. **Comportamiento actual conocido:** son datos fijos del código (1250 puntos, racha 5 días, progreso 75%, "Nivel intermedio", nombre "Estudiante"); este paso falla hoy. | [ ] Pasa  [ ] Falla |
| 1.6 | Tocar "Comenzar práctica", "Ver resultados", "Ver todas" y "Ver ranking". | Navegan a `/practica`, `/estadisticas`, `/practica` y `/ranking`. | [ ] Pasa  [ ] Falla |
| 1.7 | Tocar una tarjeta de área de `/inicio`. | Se abre `/practica` con el filtro de esa área activo. | [ ] Pasa  [ ] Falla |
| 1.8 | Usar la navegación (Inicio, Práctica, Estadísticas, Ranking, Perfil). En pantallas de 768 px o más se ve arriba; en menos de 768 px, abajo. | Cada elemento navega a su pantalla y queda marcado como activo. | [ ] Pasa  [ ] Falla |

**Cierre del módulo 1:**

- Estado: [ ] Aprobado  [ ] Con fallas  [ ] Bloqueado
- Fecha / Tester / Entorno:
- Evidencia (captura, log o enlace):
- Observaciones:

---

## Módulo 2: Práctica

**Precondiciones:** sesión iniciada como estudiante. Detalle de cada paso en `docs/qa/casos-prueba-simulacros.md`.

| Paso | Acción | Resultado esperado | Resultado |
| ---- | ------ | ------------------ | --------- |
| 2.1 | Abrir `/practica`. | Se listan las 5 áreas desde Firestore. El buscador "Buscar área..." y los filtros por nombre acotan la lista. | [ ] Pasa  [ ] Falla |
| 2.2 | Tocar un área. | Se abre `/practica/cuestionario` sin barra de navegación superior ni inferior. Se ve el nombre del área, "Pregunta 1 de 8" (con el seed) y el temporizador en cuenta regresiva. Las preguntas cargan sin errores. | [ ] Pasa  [ ] Falla |
| 2.3 | Responder preguntas, cambiar una respuesta y saltar entre preguntas con la "Navegación de preguntas". | Solo queda marcada la última opción elegida. Las respondidas se marcan en la navegación. | [ ] Pasa  [ ] Falla |
| 2.4 | En la última pregunta, tocar "Finalizar". | El botón muestra "Enviando..." y se navega a `/resultados/{cuestionarioId}_{uid}`. | [ ] Pasa  [ ] Falla |
| 2.5 | En Firestore, revisar `cuestionarios`, `resultados/{cuestionarioId}_{uid}` y su subcolección `respuestas`. | Existe el cuestionario, un resultado con `usuarioId` correcto y una respuesta por pregunta. | [ ] Pasa  [ ] Falla |
| 2.6 | Opcional: iniciar un simulacro escribiendo `/practica/cuestionario` en la barra de direcciones. | Se abre el "Simulacro general" con 30 preguntas (6 por área, elegidas entre las 8 de cada una) y 95 minutos. **Comportamiento actual conocido:** no hay ningún botón para llegar a esta pantalla. | [ ] Pasa  [ ] Falla |

**Cierre del módulo 2:**

- Estado: [ ] Aprobado  [ ] Con fallas  [ ] Bloqueado
- Fecha / Tester / Entorno:
- Evidencia (captura, log o enlace):
- Observaciones:

---

## Módulo 3: Resultados y retroalimentación

**Precondiciones:** una prueba recién finalizada en el módulo 2, con aciertos y errores conocidos (por ejemplo, en un cuestionario por área de 8 preguntas, 6 correctas y 2 incorrectas).

| Paso | Acción | Resultado esperado | Resultado |
| ---- | ------ | ------------------ | --------- |
| 3.1 | Observar `/resultados/{id}`. | El puntaje es un porcentaje entero (75% para 6 de 8), con "Preguntas: 8", "Correctas: 6", "Incorrectas: 2" y la fecha. El estado es "Aprobado" con 60% o más y "No aprobado" con menos. | [ ] Pasa  [ ] Falla |
| 3.2 | Tocar "Ver retroalimentación". | Se abre `/resultados/{id}/retroalimentacion` (también sin barra de navegación). Cada pregunta muestra la opción elegida, la correcta, la etiqueta Correcta o Incorrecta y la explicación. | [ ] Pasa  [ ] Falla |
| 3.3 | Tocar "Volver a resultados". | Se vuelve a `/resultados/{id}`. | [ ] Pasa  [ ] Falla |
| 3.4 | Tocar "Nuevo cuestionario" y luego, desde otro resultado, "Volver al inicio". | Navegan a `/practica` y `/inicio`. | [ ] Pasa  [ ] Falla |
| 3.5 | Recargar `/resultados/{id}` (F5). | Se muestra el mismo resultado. | [ ] Pasa  [ ] Falla |
| 3.6 | Con otra cuenta de estudiante, abrir `/resultados/{id}` de la primera cuenta. | No se puede ver: aparece "No se pudo cargar el resultado." (ver `docs/qa/verificacion-rbac.md`). | [ ] Pasa  [ ] Falla |

**Cierre del módulo 3:**

- Estado: [ ] Aprobado  [ ] Con fallas  [ ] Bloqueado
- Fecha / Tester / Entorno:
- Evidencia (captura, log o enlace):
- Observaciones:

---

## Módulo 4: Ranking

**Precondiciones:** el estudiante completó al menos una prueba (el ranking lo escribe la función al calificar). Idealmente hay otros estudiantes con pruebas completadas.

| Paso | Acción | Resultado esperado | Resultado |
| ---- | ------ | ------------------ | --------- |
| 4.1 | Abrir `/ranking`. | Cargan el podio (los 3 primeros) y la tabla de clasificación, ordenados de mayor a menor puntaje. | [ ] Pasa  [ ] Falla |
| 4.2 | Ubicar la fila del estudiante. | Si está entre los primeros 20, su fila está resaltada y lleva la insignia "Tú". Si no está, aparece la tarjeta "Tu posición actual" con su posición. | [ ] Pasa  [ ] Falla |
| 4.3 | Comparar el puntaje mostrado con `ranking/{uid}.puntajeAcumulado` y `usuarios/{uid}.xp` en Firestore. | Los tres valores coinciden. | [ ] Pasa  [ ] Falla |
| 4.4 | Si hay 20 o más estudiantes, tocar "Cargar más". | Se agrega la siguiente página sin repetir filas. | [ ] Pasa  [ ] Falla |

**Cierre del módulo 4:**

- Estado: [ ] Aprobado  [ ] Con fallas  [ ] Bloqueado
- Fecha / Tester / Entorno:
- Evidencia (captura, log o enlace):
- Observaciones:

---

## Módulo 5: Estadísticas e historial

**Precondiciones:** el estudiante completó pruebas en al menos 2 áreas, con resultados distintos. Para los pasos del historial, anotar antes cuántas pruebas tiene. Para el paso 5.11 se necesita además una cuenta de estudiante sin ninguna prueba.

| Paso | Acción | Resultado esperado | Resultado |
| ---- | ------ | ------------------ | --------- |
| 5.1 | Abrir `/estadisticas`. | Carga sin error. "Pruebas" muestra el número de resultados del estudiante y "Promedio general" el porcentaje de aciertos sobre todas las preguntas respondidas. | [ ] Pasa  [ ] Falla |
| 5.2 | Revisar "Progreso por área". | Hay una barra por cada área con su porcentaje de aciertos. Las áreas sin pruebas muestran 0%. El color depende del valor: 80% o más, 60% o más, o menos de 60%. | [ ] Pasa  [ ] Falla |
| 5.3 | Revisar "Temas recomendados". | Se listan hasta 2 áreas con menos de 60%, las más bajas primero. Las áreas sin pruebas (0%) también se recomiendan. | [ ] Pasa  [ ] Falla |
| 5.4 | Completar una prueba más y volver a `/estadisticas`. | Los valores se actualizan. Las pruebas de simulacro cuentan en el total y en el promedio general, pero no en el progreso por área. | [ ] Pasa  [ ] Falla |
| 5.5 | Tocar "Practicar". | Navega a `/practica`. | [ ] Pasa  [ ] Falla |
| 5.6 | En un ancho de más de 600 px, abrir `/practica` y tocar "Historial". | Navega a `/historial` (no a `/estadisticas`). Se ve la etiqueta "MI PROGRESO", el título "Historial", la sección "Resultados anteriores" con el texto "Tus cuestionarios aparecen del más reciente al más antiguo." y el botón "Practicar". **Comportamiento actual conocido:** en 600 px o menos el botón "Historial" de Práctica se oculta por CSS y no hay otro acceso desde la interfaz (solo escribiendo `/historial`). | [ ] Pasa  [ ] Falla |
| 5.7 | Revisar la lista de `/historial`. | Hay una fila por cada prueba del estudiante (la cantidad coincide con "Pruebas" de `/estadisticas` y con los documentos de `resultados` con su `usuarioId`), ordenadas de la más reciente a la más antigua. Cada fila muestra "Cuestionario", la fecha y hora, "Puntaje" en %, "Correctas", "Incorrectas" y la etiqueta "Aprobado" (60% o más) o "No aprobado". | [ ] Pasa  [ ] Falla |
| 5.8 | Completar una prueba nueva y volver a `/historial`. | La prueba nueva aparece en la primera fila, con su puntaje y sus cantidades de correctas e incorrectas. | [ ] Pasa  [ ] Falla |
| 5.9 | Tocar una fila del historial. | Navega a `/resultados/{id}` y muestra el resultado de esa prueba. | [ ] Pasa  [ ] Falla |
| 5.10 | Comparar cada fila con lo que pide la ERS (RF-012): historial cronológico con fecha, área, puntaje y tiempo. | Fecha y puntaje se cubren. **Comportamiento actual conocido:** la fila no muestra el área ni el tiempo empleado, y el título siempre dice "Cuestionario", también en los simulacros. Este paso falla hoy respecto de la ERS. | [ ] Pasa  [ ] Falla |
| 5.11 | Con una cuenta de estudiante sin ninguna prueba, abrir `/historial`. | Estado vacío: título "Historial", el texto "Todavía no completaste ningún cuestionario" y el botón "Realizar cuestionario", que navega a `/practica`. | [ ] Pasa  [ ] Falla |
| 5.12 | En el proyecto de pruebas real (no en emuladores), comprobar en la consola de Firestore, sección Índices, que el índice compuesto de `resultados` (`usuarioId` ascendente y `fecha` descendente) está "Habilitado"; luego abrir `/historial`. | Con el índice habilitado la lista carga. Sin él, la consulta falla y se ve "No se pudo cargar el historial" con el botón "Intentar nuevamente" (`/estadisticas` usa la misma consulta). Este paso no se puede verificar con emuladores: no exigen índices compuestos. | [ ] Pasa  [ ] Falla |

**Cierre del módulo 5:**

- Estado: [ ] Aprobado  [ ] Con fallas  [ ] Bloqueado
- Fecha / Tester / Entorno:
- Evidencia (captura, log o enlace):
- Observaciones:

---

## Módulo 6: Logros

**Precondiciones:** cuenta de estudiante con 0, 1, 5 y luego 10 pruebas completadas en distintos momentos (los dos últimos umbrales son opcionales por duración). Detalle en `docs/qa/casos-prueba-gamificacion.md`.

| Paso | Acción | Resultado esperado | Resultado |
| ---- | ------ | ------------------ | --------- |
| 6.1 | Desde `/perfil`, tocar "Logros". | Se abre `/logros`. Los logros no están en la barra de navegación. | [ ] Pasa  [ ] Falla |
| 6.2 | Con 0 pruebas, revisar la lista. | Se ven los 3 logros del catálogo, todos "Bloqueado". | [ ] Pasa  [ ] Falla |
| 6.3 | Tras la primera prueba, volver a `/logros`. | "Primer paso" figura "Desbloqueado" con la fecha del día; los otros dos siguen bloqueados. | [ ] Pasa  [ ] Falla |
| 6.4 | Con 5 pruebas: revisar `/logros`. Con 10 (opcional): revisar de nuevo. | Con 5, "Estudiante dedicado" se desbloquea. Con 10, "Maestro de las áreas". Las fechas de los anteriores no cambian. | [ ] Pasa  [ ] Falla |

**Cierre del módulo 6:**

- Estado: [ ] Aprobado  [ ] Con fallas  [ ] Bloqueado
- Fecha / Tester / Entorno:
- Evidencia (captura, log o enlace):
- Observaciones:

---

## Módulo 7: Perfil

**Precondiciones:** sesión iniciada como estudiante.

| Paso | Acción | Resultado esperado | Resultado |
| ---- | ------ | ------------------ | --------- |
| 7.1 | Abrir `/perfil` y recargar (F5). | Se muestran correo, rol "estudiante", XP y nivel iguales a `usuarios/{uid}` en Firestore. Sin recargar, tras una prueba, el XP puede verse desactualizado (comportamiento actual conocido: el perfil se carga una sola vez al iniciar sesión). | [ ] Pasa  [ ] Falla |
| 7.2 | Cambiar nombre, apellido y colegio y tocar "Guardar cambios". | Aparece "Cambios guardados correctamente". Tras recargar, los valores persisten y coinciden con Firestore. | [ ] Pasa  [ ] Falla |
| 7.3 | Revisar el formulario. | Solo se pueden editar nombre, apellido y colegio. No hay campos para rol, estado, XP, nivel ni correo. | [ ] Pasa  [ ] Falla |
| 7.4 | Opcional: con DevTools en modo sin conexión, intentar guardar. | Aparece "No se pudieron guardar los cambios, intentá de nuevo". | [ ] Pasa  [ ] Falla |
| 7.5 | Opcional: completar una prueba nueva y abrir `/ranking`. | El nombre de la fila del estudiante refleja el cambio del paso 7.2 (el ranking copia el nombre al calificar una prueba). | [ ] Pasa  [ ] Falla |

**Cierre del módulo 7:**

- Estado: [ ] Aprobado  [ ] Con fallas  [ ] Bloqueado
- Fecha / Tester / Entorno:
- Evidencia (captura, log o enlace):
- Observaciones:

---

## Módulo 8: Menú del Perfil (Mi progreso, cambio de contraseña y cerrar sesión)

**Precondiciones:** sesión iniciada como estudiante, con una cuenta de prueba cuyo correo permita recibir mensajes (para el paso 8.3). Los accesos se ven en `/perfil` (`src/pages/student/Profile/Profile.jsx`). Este módulo va al final del recorrido del estudiante porque cierra la sesión.

| Paso | Acción | Resultado esperado | Resultado |
| ---- | ------ | ------------------ | --------- |
| 8.1 | Abrir `/perfil` y revisar el menú. | Se ven cuatro accesos: "Logros", "Mi progreso", "Configuración" y "Cerrar sesión". | [ ] Pasa  [ ] Falla |
| 8.2 | Tocar "Mi progreso". | Navega a `/estadisticas`. | [ ] Pasa  [ ] Falla |
| 8.3 | Volver a `/perfil` y tocar "Configuración" (cambio de contraseña). | Se envía un correo de restablecimiento de contraseña a `profile.correo` y aparece "Te enviamos un correo para cambiar tu contraseña". El correo llega a la bandeja de la cuenta de prueba. **Observación:** pese al nombre del acceso, "Configuración" no abre ninguna pantalla; su única acción es enviar ese correo. | [ ] Pasa  [ ] Falla |
| 8.4 | Opcional: con DevTools en modo sin conexión, tocar "Configuración". | Aparece "No se pudo enviar el correo para cambiar la contraseña, intentá de nuevo". | [ ] Pasa  [ ] Falla |
| 8.5 | Tocar "Cerrar sesión" y cancelar el aviso de confirmación. | Aparece "¿Estás seguro de que querés cerrar sesión?"; al cancelar la sesión sigue activa y se permanece en `/perfil`. | [ ] Pasa  [ ] Falla |
| 8.6 | Tocar "Cerrar sesión" y aceptar. | Se navega a `/` (pantalla de inicio de sesión). | [ ] Pasa  [ ] Falla |
| 8.7 | Tras cerrar sesión, escribir `/inicio`, `/perfil` y `/historial` en la barra de direcciones, y probar el botón "Atrás" del navegador. | Cada ruta redirige a `/`: ya no hay sesión y no se ve ninguna pantalla del estudiante. | [ ] Pasa  [ ] Falla |
| 8.8 | Iniciar sesión con la cuenta de administrador. | Se navega a `/admin`: el cierre de sesión permite cambiar de cuenta sin ventanas privadas. | [ ] Pasa  [ ] Falla |

**Cierre del módulo 8:**

- Estado: [ ] Aprobado  [ ] Con fallas  [ ] Bloqueado
- Fecha / Tester / Entorno:
- Evidencia (captura, log o enlace):
- Observaciones:

---

# Recorrido del administrador

**Precondiciones:** cuenta de administrador (ver precondiciones generales). Haber ejecutado antes algunos módulos del estudiante para que haya datos (usuarios, resultados). Los controles de acceso (qué rutas y datos puede usar cada rol) se verifican en detalle en `docs/qa/verificacion-rbac.md`. El panel no tiene botón de "Cerrar sesión": el administrador puede cerrar sesión entrando a `/perfil`, que también está abierto para su rol.

## Módulo A1: Acceso del administrador y Dashboard

| Paso | Acción | Resultado esperado | Resultado |
| ---- | ------ | ------------------ | --------- |
| A1.1 | En `/`, iniciar sesión con la cuenta de administrador. | Se navega a `/admin` (no a `/inicio`). Se ve el encabezado "Panel de administración" y la navegación con Dashboard, Usuarios, Preguntas, Simulacros, Logros, Reportes y Configuración. | [ ] Pasa  [ ] Falla |
| A1.2 | Observar el Dashboard. | Cargan "Usuarios totales", "Simulacros realizados" (cantidad de resultados guardados), "Preguntas en banco" y "Promedio general", y "Actividad reciente" con los últimos resultados (nombre, puntaje y fecha relativa). Sin errores en consola. | [ ] Pasa  [ ] Falla |
| A1.3 | Comparar los números con Firestore. | "Usuarios totales" = documentos en `usuarios`; "Preguntas en banco" = documentos en `preguntas`; "Simulacros realizados" = documentos en `resultados`. | [ ] Pasa  [ ] Falla |
| A1.4 | Recorrer la navegación del panel. | Cada sección abre su pantalla y queda marcada como activa. En menos de 768 px la navegación del panel está abajo. | [ ] Pasa  [ ] Falla |

**Cierre del módulo A1:**

- Estado: [ ] Aprobado  [ ] Con fallas  [ ] Bloqueado
- Fecha / Tester / Entorno:
- Evidencia (captura, log o enlace):
- Observaciones:

---

## Módulo A2: Usuarios

| Paso | Acción | Resultado esperado | Resultado |
| ---- | ------ | ------------------ | --------- |
| A2.1 | Abrir `/admin/usuarios`. | Se listan los usuarios con nombre, correo, rol y estado, de a 10, con "Cargar más" si hay más. | [ ] Pasa  [ ] Falla |
| A2.2 | Buscar por nombre o correo. | La lista se filtra; sin coincidencias aparece "No se encontraron usuarios.". | [ ] Pasa  [ ] Falla |
| A2.3 | Tocar "Ver detalle" en una fila. | Se abre el detalle con nombre, correo, rol, estado, XP, nivel y colegio. Se cierra con "Cerrar" o la "x". | [ ] Pasa  [ ] Falla |
| A2.4 | Cambiar el rol de una cuenta de prueba y volver a dejarlo. | El cambio se refleja en la fila y en `usuarios/{uid}.rol`. El usuario afectado ve el cambio al recargar su sesión. | [ ] Pasa  [ ] Falla |
| A2.5 | Tocar "Desactivar" en una cuenta de prueba y confirmar; luego "Activar". | El estado cambia a Inactivo y vuelve a Activo, y se refleja en `usuarios/{uid}.estado`. **Comportamiento actual conocido:** mientras está inactiva, la cuenta puede seguir usando la aplicación (ver `docs/qa/verificacion-rbac.md`, caso 18). | [ ] Pasa  [ ] Falla |

**Cierre del módulo A2:**

- Estado: [ ] Aprobado  [ ] Con fallas  [ ] Bloqueado
- Fecha / Tester / Entorno:
- Evidencia (captura, log o enlace):
- Observaciones:

---

## Módulo A3: Preguntas

| Paso | Acción | Resultado esperado | Resultado |
| ---- | ------ | ------------------ | --------- |
| A3.1 | Abrir `/admin/preguntas`. | Se listan las preguntas con área, dificultad, enunciado y opciones, con la correcta resaltada. El contador coincide con las filas. | [ ] Pasa  [ ] Falla |
| A3.2 | Buscar por texto y filtrar por área (por ejemplo `matematicas`) y por dificultad. | Solo quedan las preguntas que cumplen los criterios. | [ ] Pasa  [ ] Falla |
| A3.3 | Tocar "+ Nueva pregunta" y guardar sin enunciado; luego, con el resto completo, guardar sin elegir la respuesta correcta. | Aparecen los mensajes "El enunciado es obligatorio." y "Debes seleccionar una respuesta correcta.". No se guarda nada. | [ ] Pasa  [ ] Falla |
| A3.4 | Crear una pregunta válida con `areaId` igual al ID de un área (por ejemplo `matematicas`), 3 opciones y respuesta correcta. | Se guarda y aparece en la lista; existe en `preguntas` con sus opciones `{id: A, text: ...}`. | [ ] Pasa  [ ] Falla |
| A3.5 | Editar esa pregunta (cambiar enunciado y respuesta correcta). | Los cambios se reflejan en la lista y en Firestore. | [ ] Pasa  [ ] Falla |
| A3.6 | Como estudiante, iniciar un cuestionario del área elegida. | La pregunta nueva forma parte del banco del área y puede aparecer en el cuestionario (con el seed, el cuestionario toma todas las preguntas del área hasta 10: 8 más la nueva). | [ ] Pasa  [ ] Falla |
| A3.7 | Eliminar la pregunta de prueba y confirmar. | Desaparece de la lista y de Firestore. **Comportamiento actual conocido:** no hay advertencia sobre el impacto en resultados ya guardados (CU-05, flujo alternativo 4a de la ERS); la retroalimentación de esos resultados omite la pregunta borrada en silencio. | [ ] Pasa  [ ] Falla |

**Cierre del módulo A3:**

- Estado: [ ] Aprobado  [ ] Con fallas  [ ] Bloqueado
- Fecha / Tester / Entorno:
- Evidencia (captura, log o enlace):
- Observaciones:

---

## Módulo A4: Simulacros

| Paso | Acción | Resultado esperado | Resultado |
| ---- | ------ | ------------------ | --------- |
| A4.1 | Con al menos un cuestionario o simulacro creado por un estudiante después de que la aplicación guarda `fechaCreacion`, abrir `/admin/simulacros`. | Se listan los cuestionarios con las columnas Nombre (el `titulo`), Tipo ("Simulacro" o "Cuestionario"), Área (nombre del área; "Todas las áreas" en los simulacros), Creado (fecha y hora) y Estado ("activo" o "inactivo"), con la acción "Desactivar". Van ordenados del más reciente al más antiguo, de a 10, con el botón "Cargar más". Cada cuestionario que arma un estudiante al iniciar una prueba (también si lo abandona) aparece en la lista. | [ ] Pasa  [ ] Falla |
| A4.2 | Como estudiante, iniciar un cuestionario por área; como administrador, recargar `/admin/simulacros`. | El cuestionario nuevo aparece en la primera fila, con Tipo "Cuestionario", el nombre del área elegida, la fecha y hora actuales y el Estado "activo". | [ ] Pasa  [ ] Falla |
| A4.3 | Si hay más de 10 cuestionarios, tocar "Cargar más". | Se agrega la siguiente página sin repetir filas, manteniendo el orden por fecha descendente. | [ ] Pasa  [ ] Falla |
| A4.4 | Tocar "Desactivar" en una fila y confirmar el aviso "¿Desactivar este simulacro?". | El estado cambia a "inactivo" y el botón queda deshabilitado; `cuestionarios/{id}.estado` es `inactivo`. La fila sigue en la lista. | [ ] Pasa  [ ] Falla |
| A4.5 | Revisar si aparecen cuestionarios creados antes del PR #76 (sin campo `fechaCreacion` en Firestore). | **Comportamiento actual conocido:** no aparecen, porque la consulta ordena por `fechaCreacion` y Firestore omite los documentos que no tienen ese campo (decisión consciente: son descartables). Que no aparezcan es lo esperado, no un defecto; si la colección no tiene ningún cuestionario con `fechaCreacion`, se ve "No hay simulacros". | [ ] Pasa  [ ] Falla |

**Cierre del módulo A4:**

- Estado: [ ] Aprobado  [ ] Con fallas  [ ] Bloqueado
- Fecha / Tester / Entorno:
- Evidencia (captura, log o enlace):
- Observaciones:

---

## Módulo A5: Logros

| Paso | Acción | Resultado esperado | Resultado |
| ---- | ------ | ------------------ | --------- |
| A5.1 | Abrir `/admin/logros`. | Se muestra "Configuración de Logros" con el catálogo (los 3 del seed: nombre, descripción y criterio). | [ ] Pasa  [ ] Falla |
| A5.2 | Crear un logro con nombre, descripción y un criterio (`primer_quiz`, `cinco_simulacros` o `diez_simulacros`). | Se guarda, el formulario se limpia y el logro aparece en el catálogo. Existe en `logros`. | [ ] Pasa  [ ] Falla |
| A5.3 | Dejar nombre o descripción vacíos y enviar. | No se crea nada. | [ ] Pasa  [ ] Falla |
| A5.4 | Como estudiante, abrir `/logros`. | El logro nuevo aparece en la lista (bloqueado, o desbloqueado en la próxima prueba si cumple el criterio). | [ ] Pasa  [ ] Falla |

**Cierre del módulo A5:**

- Estado: [ ] Aprobado  [ ] Con fallas  [ ] Bloqueado
- Fecha / Tester / Entorno:
- Evidencia (captura, log o enlace):
- Observaciones:

---

## Módulo A6: Reportes

| Paso | Acción | Resultado esperado | Resultado |
| ---- | ------ | ------------------ | --------- |
| A6.1 | Abrir `/admin/reportes`. | Se muestran "Total usuarios", "Total pruebas" y "Promedio general", y "Desempeño por área" con una barra por área. Sin errores en consola. | [ ] Pasa  [ ] Falla |
| A6.2 | Comparar con el Dashboard y Firestore. | "Total usuarios" y "Total pruebas" coinciden con el Dashboard. El promedio de cada área es el promedio de `puntaje` de los resultados de cuestionarios de esa área; los simulacros cuentan en el promedio general pero no en ninguna área. | [ ] Pasa  [ ] Falla |
| A6.3 | Comparar el formato de "Promedio general" con el del Dashboard. | Mismo formato. **Comportamiento actual conocido:** el Dashboard lo muestra con "%" y Reportes sin "%". | [ ] Pasa  [ ] Falla |

**Cierre del módulo A6:**

- Estado: [ ] Aprobado  [ ] Con fallas  [ ] Bloqueado
- Fecha / Tester / Entorno:
- Evidencia (captura, log o enlace):
- Observaciones:

---

## Módulo A7: Configuración

| Paso | Acción | Resultado esperado | Resultado |
| ---- | ------ | ------------------ | --------- |
| A7.1 | Abrir `/admin/configuracion`. | Se muestra "Configuración general" con nombre de la aplicación, descripción y email de soporte (nombre "LearnFex" por defecto si no hay datos). | [ ] Pasa  [ ] Falla |
| A7.2 | Cambiar los tres campos y tocar "Guardar cambios". | Aparece "Guardado" y los valores persisten tras recargar; existen en `configuracion/general`. | [ ] Pasa  [ ] Falla |
| A7.3 | Borrar el nombre e intentar guardar. | El campo es obligatorio y no se guarda. | [ ] Pasa  [ ] Falla |
| A7.4 | Restaurar los valores originales. | La configuración vuelve al estado inicial. | [ ] Pasa  [ ] Falla |

**Cierre del módulo A7:**

- Estado: [ ] Aprobado  [ ] Con fallas  [ ] Bloqueado
- Fecha / Tester / Entorno:
- Evidencia (captura, log o enlace):
- Observaciones:

---

## Módulo C: Cruces entre estudiante y administrador

**Precondiciones:** una cuenta de estudiante y una de administrador, en navegadores o ventanas privadas distintas.

| Paso | Acción | Resultado esperado | Resultado |
| ---- | ------ | ------------------ | --------- |
| C.1 | Anotar en el Dashboard y en Reportes "Simulacros realizados"/"Total pruebas" y el promedio general. Como estudiante, completar una prueba. Volver al panel y recargar. | "Simulacros realizados" y "Total pruebas" suben 1. El promedio general cambia según el puntaje. "Actividad reciente" muestra el nombre del estudiante con el puntaje de la prueba. | [ ] Pasa  [ ] Falla |
| C.2 | Como estudiante nuevo, registrarse y volver al panel (recargar `/admin/usuarios` y el Dashboard). | El estudiante aparece en Usuarios con rol Estudiante y estado Activo; "Usuarios totales" sube 1. | [ ] Pasa  [ ] Falla |
| C.3 | Como administrador, crear una pregunta en un área y, como estudiante, iniciar un cuestionario de esa área. | La pregunta nueva forma parte del banco del cuestionario (ver A3.6). Eliminarla al terminar. | [ ] Pasa  [ ] Falla |
| C.4 | Como estudiante, abrir `/admin`. | Se redirige a `/inicio` y no se ve nada del panel (ver `docs/qa/verificacion-rbac.md`). | [ ] Pasa  [ ] Falla |

**Cierre del módulo C:**

- Estado: [ ] Aprobado  [ ] Con fallas  [ ] Bloqueado
- Fecha / Tester / Entorno:
- Evidencia (captura, log o enlace):
- Observaciones:

---

## Resumen de la ejecución

Completar al terminar. Todo está vacío hasta que se ejecute.

| Módulo | Estado | Fecha | Tester | Evidencia |
| ------ | ------ | ----- | ------ | --------- |
| 1. Acceso e Inicio | [ ] Aprobado  [ ] Con fallas  [ ] Bloqueado | | | |
| 2. Práctica | [ ] Aprobado  [ ] Con fallas  [ ] Bloqueado | | | |
| 3. Resultados y retroalimentación | [ ] Aprobado  [ ] Con fallas  [ ] Bloqueado | | | |
| 4. Ranking | [ ] Aprobado  [ ] Con fallas  [ ] Bloqueado | | | |
| 5. Estadísticas e historial | [ ] Aprobado  [ ] Con fallas  [ ] Bloqueado | | | |
| 6. Logros | [ ] Aprobado  [ ] Con fallas  [ ] Bloqueado | | | |
| 7. Perfil | [ ] Aprobado  [ ] Con fallas  [ ] Bloqueado | | | |
| 8. Menú del Perfil (Mi progreso, contraseña y cerrar sesión) | [ ] Aprobado  [ ] Con fallas  [ ] Bloqueado | | | |
| A1. Acceso del administrador y Dashboard | [ ] Aprobado  [ ] Con fallas  [ ] Bloqueado | | | |
| A2. Usuarios | [ ] Aprobado  [ ] Con fallas  [ ] Bloqueado | | | |
| A3. Preguntas | [ ] Aprobado  [ ] Con fallas  [ ] Bloqueado | | | |
| A4. Simulacros | [ ] Aprobado  [ ] Con fallas  [ ] Bloqueado | | | |
| A5. Logros | [ ] Aprobado  [ ] Con fallas  [ ] Bloqueado | | | |
| A6. Reportes | [ ] Aprobado  [ ] Con fallas  [ ] Bloqueado | | | |
| A7. Configuración | [ ] Aprobado  [ ] Con fallas  [ ] Bloqueado | | | |
| C. Cruces estudiante y administrador | [ ] Aprobado  [ ] Con fallas  [ ] Bloqueado | | | |

## Notas finales

- Documentos relacionados en `docs/qa/`: `casos-prueba-simulacros.md`, `casos-prueba-gamificacion.md`, `verificacion-rbac.md`, `verificacion-responsive-practica.md` y `verificacion-responsive-sprint5.md`.
- Si un paso falla, registrar los pasos exactos para reproducirlo y el valor mostrado frente al esperado.
