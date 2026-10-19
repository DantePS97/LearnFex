# Manual técnico de LearnFex

Este manual documenta cómo está construido LearnFex y cómo se opera: arquitectura, modelo de datos, reglas de seguridad, la Cloud Function de calificación, el flujo de una prueba, el desarrollo local y el procedimiento de despliegue. Termina con los problemas conocidos y la deuda técnica.

Todo lo que se afirma aquí se verificó contra el código y las reglas del repositorio (rama `main`). Cuando el código se aparta de los documentos de diseño (`docs/LearnFex_SDD.docx` y `docs/Plan_de_Proyecto_LearnFex.docx`), se indica. Para el uso de la aplicación, ver [`manual-usuario.md`](manual-usuario.md); para la instalación y los comandos del día a día, ver el [`README.md`](../README.md); para las variables de entorno, ver [`variables-de-entorno.md`](variables-de-entorno.md).

## Contenido

1. [Arquitectura](#1-arquitectura)
2. [Estructura del código](#2-estructura-del-código)
3. [Modelo de datos de Firestore](#3-modelo-de-datos-de-firestore)
4. [Reglas de seguridad](#4-reglas-de-seguridad)
5. [Índices](#5-índices)
6. [Cloud Function `calificarPrueba`](#6-cloud-function-calificarprueba)
7. [Flujo completo de una prueba](#7-flujo-completo-de-una-prueba)
8. [Desarrollo local con emuladores](#8-desarrollo-local-con-emuladores)
9. [Despliegue](#9-despliegue)
10. [Datos iniciales y primer administrador](#10-datos-iniciales-y-primer-administrador)
11. [Diagnóstico de problemas frecuentes](#11-diagnóstico-de-problemas-frecuentes)
12. [Problemas conocidos y deuda técnica](#12-problemas-conocidos-y-deuda-técnica)
13. [Diferencias entre los documentos de diseño y el código](#13-diferencias-entre-los-documentos-de-diseño-y-el-código)

---

## 1. Arquitectura

LearnFex es una aplicación de una sola página (SPA) en React que usa Firebase como backend (BaaS). No hay servidor propio.

```text
Navegador (React + Vite)
  |  SDK de Firebase (Auth, Firestore, Functions)
  v
Firebase (proyecto de Google Cloud)
  |- Authentication          correo y contraseña
  |- Cloud Firestore         datos; protegido por firestore.rules
  |- Cloud Functions (v2)    calificarPrueba (us-central1), con Admin SDK
```

Reparto de responsabilidades:

- El cliente lee y escribe en Firestore directamente para casi todo (catálogos, perfil, estadísticas, administración). Lo que puede hacer lo decide `firestore.rules`.
- La calificación de las pruebas y la gamificación (XP, nivel, ranking, logros) se hacen en la Cloud Function `calificarPrueba`. Usa el Admin SDK, que no pasa por las reglas. Las reglas impiden que el cliente escriba esos datos.
- La autenticación es de Firebase Authentication con correo y contraseña. El rol del usuario (`estudiante` o `administrador`) vive en el campo `rol` de su documento `usuarios/{uid}`, no en una reclamación (custom claim) del token.
- El hosting del frontend definido por el Plan de Proyecto es Vercel (ver la sección 9).

Servicios de Firebase que el código inicializa: Authentication, Firestore, Functions y Storage (`src/config/firebase.js`). Storage se inicializa pero ninguna pantalla lo usa y no hay reglas de Storage en el repositorio.

## 2. Estructura del código

```text
src/
  config/firebase.js      Inicializa la app, auth, db, storage y functions (región us-central1);
                          conecta a emuladores si VITE_USE_EMULATORS === "true"
  context/AuthContext.jsx Sesión y perfil: carga usuarios/{uid} una sola vez en onAuthStateChanged
  hooks/                  useAuth (lee el contexto), useTimer (temporizador de la prueba)
  routes/                 AppRoutes (mapa de rutas), PrivateRoutes (exige sesión), AdminRoute (exige rol)
  layouts/                StudentLayout (Navbar + BottomNavigation), AdminLayout
  pages/{auth,student,admin}/   Pantallas
  components/             Button, Card, Input, Loader, Navbar, BottomNavigation, ProgressBar, QuestionCard
  services/               authServices, userService, quizService, questionService, resultService,
                          statisticsService, platformStatsService (storageService está vacío)
  repositories/           Acceso a Firestore: user, area, question, quiz, result, ranking, logro,
                          statistics, platformStats, config
functions/
  index.js                initializeApp, setGlobalOptions({ region: "us-central1", maxInstances: 10 })
  src/calificarPrueba.js  Handler onCall
  src/validacion.js       Validación de la entrada
  src/calificacion.js     Calificación (función pura)
  src/gamificacion.js     XP, nivel, ranking y logros (transacción)
```

Capas previstas: pantallas (`pages`) -> servicios (`services`) -> repositorios (`repositories`) -> `config/firebase`. Solo los repositorios deberían importar el SDK de Firestore. En la práctica la regla no se cumple de forma estricta: varias pantallas importan un repositorio sin pasar por un servicio (por ejemplo Inicio, Práctica, Resultados, Retroalimentación, Historial, Ranking, Logros y casi todo el panel de administración), y `resultService`, `questionService` y `quizService` son delgados. Los servicios con lógica real son `quizService` (arma cuestionarios y simulacros), `statisticsService` y `platformStatsService` (cálculo de estadísticas en el cliente).

Rutas (`src/routes/AppRoutes.jsx`):

| Rutas | Guarda | Notas |
| ----- | ------ | ----- |
| `/`, `/registro`, `/recuperar-contrasena` | Ninguna | Públicas |
| `/inicio`, `/practica`, `/estadisticas`, `/historial`, `/ranking`, `/logros`, `/perfil` | `PrivateRoutes` (solo exige sesión) | Dentro de `StudentLayout`. Un administrador también las abre |
| `/practica/cuestionario`, `/resultados/:resultadoId`, `/resultados/:resultadoId/retroalimentacion` | `PrivateRoutes` | Fuera de `StudentLayout` (sin menú) |
| `/admin`, `/admin/usuarios`, `/admin/preguntas`, `/admin/reportes`, `/admin/simulacros`, `/admin/configuracion`, `/admin/logros` | `AdminRoute` (sesión y `rol === "administrador"`) | Dentro de `AdminLayout` |

No hay ruta comodín: una dirección inexistente muestra una pantalla en blanco. Las guardas de rutas son una comodidad de interfaz; la seguridad real está en las reglas de Firestore.

## 3. Modelo de datos de Firestore

Los nombres de campo son los que escribe el código actual. Donde difiere del diccionario de datos del SDD, se anota en la sección 13.

### `usuarios/{uid}`

El ID es el UID de Firebase Authentication. Lo crea el cliente al registrarse (`userRepository.createUserProfile`).

| Campo | Tipo | Descripción |
| ----- | ---- | ----------- |
| `nombre`, `apellido`, `correo` | string | Datos personales |
| `rol` | string | `estudiante` o `administrador` |
| `estado` | string | `activo` o `inactivo` (hoy solo informativo; ver sección 12) |
| `xp` | number | Experiencia acumulada. La modifica la función |
| `nivel` | number | `max(floor(xp / 1000) + 1, nivel actual)`. La modifica la función |
| `colegio` | string | Editable por el propio usuario |
| `fechaRegistro` | timestamp | `serverTimestamp()` |

Subcolección `usuarios/{uid}/logrosObtenidos/{logroId}`: un documento por logro obtenido, con `fechaObtenido` (timestamp). Los escribe la función.

### `areas/{areaId}`

Se cargan con el seed; el panel no las administra. IDs del seed: `matematicas`, `lectura_critica`, `ciencias_naturales`, `sociales_ciudadanas`, `ingles`.

| Campo | Tipo | Descripción |
| ----- | ---- | ----------- |
| `nombre`, `descripcion` | string | Texto visible |
| `numPreguntas` | number | Preguntas por área en el simulacro (el seed usa 6). El cuestionario por área no lo usa |
| `tiempoLimite` | number | Minutos (el seed usa 20, y 15 para Inglés). El cliente lo multiplica por 60 |

### `preguntas/{preguntaId}`

IDs del seed: `seed_1` a `seed_40`; las creadas desde el panel tienen ID automático.

| Campo | Tipo | Descripción |
| ----- | ---- | ----------- |
| `enunciado` | string | Texto de la pregunta |
| `opciones` | array de `{ id, text }` | `id` es una letra (`A`, `B`, ...) |
| `respuestaCorrecta` | string | La letra de la opción correcta |
| `explicacion` | string | Texto de retroalimentación |
| `dificultad` | string | El seed usa `baja`, `media`, `alta`; el formulario del panel usa `facil`, `media`, `dificil` |
| `areaId` | string | ID del área |

### `cuestionarios/{cuestionarioId}`

Lo crea el cliente cada vez que un estudiante empieza una prueba (ID automático). Incluye los cuestionarios por área y los simulacros.

| Campo | Tipo | Descripción |
| ----- | ---- | ----------- |
| `titulo`, `descripcion` | string | Por ejemplo "Cuestionario de Matemáticas" o "Simulacro general" |
| `tipo` | string | `cuestionario` o `simulacro` |
| `areaId` | string o null | `null` en los simulacros |
| `duracion` | number | Copia de `tiempoLimite` del área (minutos); en el simulacro, la suma de las áreas |
| `estado` | string | `activo` o `inactivo` (el panel lo cambia; nada lo consulta) |
| `preguntas` | array de `{ preguntaId, orden }` | Preguntas del cuestionario |
| `fechaCreacion` | timestamp | `serverTimestamp()`. Los cuestionarios antiguos sin este campo no aparecen en la lista del panel |

### `resultados/{cuestionarioId}_{uid}`

Lo escribe solo la función. El ID es determinista (ver la sección 6).

| Campo | Tipo | Descripción |
| ----- | ---- | ----------- |
| `usuarioId` | string | UID de quien envió la prueba (sale de la sesión) |
| `cuestionarioId` | string | Cuestionario evaluado |
| `puntaje` | number | Entero de 0 a 100: `round(correctas / respuestas enviadas * 100)` |
| `respuestasCorrectas`, `respuestasIncorrectas` | number | Una pregunta sin responder cuenta como incorrecta |
| `tiempoEmpleado` | number | Segundos, entero |
| `fecha` | timestamp | `serverTimestamp()` |

Subcolección `resultados/{id}/respuestas/{autoId}`: `preguntaId`, `respuestaSeleccionada` (string o `null`), `esCorrecta` (boolean) y `usuarioId` (necesario para que las reglas permitan leerla).

### `ranking/{uid}`

Un documento por estudiante, con el UID como ID. Lo escribe la función (ver también la sección 12, porque las reglas hoy permiten escribirlo desde el cliente).

| Campo | Tipo | Descripción |
| ----- | ---- | ----------- |
| `usuarioId` | string | UID |
| `puntajeAcumulado` | number | Igual al XP |
| `nombre`, `apellido` | string | Copia del perfil al momento de calificar, porque un estudiante no puede leer el perfil de otros |
| `nivel` | number | Copia del nivel |
| `fechaActualizacion` | timestamp | Última actualización |

### `logros/{logroId}`

Catálogo. IDs del seed: `primer_quiz`, `cinco_simulacros`, `diez_simulacros`. Los creados desde el panel tienen ID automático.

| Campo | Tipo | Descripción |
| ----- | ---- | ----------- |
| `nombre`, `descripcion` | string | Texto visible |
| `criterio` | string | Uno de `primer_quiz`, `cinco_simulacros`, `diez_simulacros` (resultados totales >= 1, 5, 10). Un criterio desconocido nunca se otorga |

### `estadisticas_progreso/{uid}_{areaId}`

Lo escribe el cliente cada vez que el estudiante abre Estadísticas (`statisticsService.calcularEstadisticas` hace un `setDoc` con `merge` por cada área).

| Campo | Tipo | Descripción |
| ----- | ---- | ----------- |
| `usuarioId`, `areaId` | string | Dueño y área |
| `porcentajeAvance` | number | 100 si hay al menos una prueba del área, 0 si no |
| `promedioAciertos` | number | Porcentaje de aciertos en el área |

La pantalla muestra lo que calcula en el momento; estos documentos solo se guardan y no se vuelven a leer en el cliente actual.

### `estadisticas_plataforma/{docId}`

Existe en las reglas, pero ningún código la usa. El panel calcula sus estadísticas leyendo `usuarios` y `resultados` completos (`platformStatsService`).

### `configuracion/general`

| Campo | Tipo | Descripción |
| ----- | ---- | ----------- |
| `nombre` | string | Nombre de la aplicación (obligatorio al guardar) |
| `descripcion`, `emailSoporte` | string | Opcionales |

Solo el panel lo lee y lo escribe; ninguna pantalla de estudiante lo muestra.

## 4. Reglas de seguridad

Archivo: `firestore.rules`. Funciones auxiliares: `estaAutenticado()`, `esPropioUsuario(id)`, `esAdministrador()` (lee `usuarios/{uid}.rol` con `get()`, así que cada evaluación suma una lectura) y `esActualizacionDePerfil()` (el cambio solo toca `nombre`, `apellido` o `colegio`).

| Colección | Visitante | Estudiante | Administrador |
| --------- | --------- | ---------- | ------------- |
| `usuarios/{id}` | Nada | Lee su propio documento. Crea el suyo con `rol: estudiante`, `estado: activo`, `xp: 0`, `nivel: 1`. Actualiza solo `nombre`, `apellido` y `colegio` del suyo | Lee todos. Actualiza cualquier campo de cualquiera. Nadie puede borrar |
| `usuarios/{id}/logrosObtenidos` | Nada | Lee los suyos. No escribe | Lee todos. No escribe |
| `areas`, `preguntas`, `logros`, `configuracion` | Nada | Lee | Lee y escribe |
| `cuestionarios` | Nada | Lee y crea (sin validar el contenido). No actualiza ni borra | Lee, crea, actualiza y borra |
| `resultados/{id}` y `resultados/{id}/respuestas` | Nada | Lee los suyos (por `usuarioId`). No escribe | Lee todos. No escribe |
| `ranking/{id}` | Nada | Lee todos. Escribe el documento cuyo ID es su UID | Lee y escribe |
| `estadisticas_progreso/{id}` | Nada | Lee los suyos. Escribe si el documento nuevo lleva su `usuarioId` | Lee todos. Escribe en las mismas condiciones que un estudiante |
| `estadisticas_plataforma/{id}` | Nada | Puede crear. No lee | Lee. Nadie actualiza ni borra |
| Cualquier otra colección | Nada | Nada | Nada |

Qué cerró la migración a Cloud Functions: antes, el cliente calificaba la prueba y escribía XP, nivel, resultado, respuestas, logros y ranking, y las reglas tenían que permitírselo. Al mover esa lógica a `calificarPrueba` (que usa el Admin SDK y no está sujeta a las reglas), se cerraron en las reglas:

- Crear `resultados` y `resultados/{id}/respuestas` desde el cliente (`allow create: if false`).
- Crear `usuarios/{id}/logrosObtenidos` desde el cliente.
- Que el propio usuario modifique `xp` o `nivel` (ahora solo puede actualizar `nombre`, `apellido` y `colegio`).

Según `docs/qa/verificacion-rbac.md`, las reglas con estos cierres se desplegaron en el proyecto de desarrollo el 2026-10-15 y la verificación del 2026-10-18 las confirmó. Quedan abiertas las brechas de la sección 12 (`ranking`, `estadisticas_progreso`, `preguntas`, `cuestionarios`, `estadisticas_plataforma` y usuarios inactivos).

## 5. Índices

Archivo: `firestore.indexes.json`. Define un único índice compuesto:

| Colección | Campos | Para qué |
| --------- | ------ | -------- |
| `resultados` | `usuarioId` ascendente, `fecha` descendente | Historial y Estadísticas (`resultRepository.getResultadosByUsuario`) |

Las demás consultas usan un solo campo o solo igualdades, y las cubren los índices automáticos (ordenar `ranking` por `puntajeAcumulado`, `usuarios` por `fechaRegistro` y `cuestionarios` por `fechaCreacion`).

Los emuladores no exigen índices compuestos. En un proyecto real, sin este índice las pantallas Historial y Estadísticas fallan ("No se pudo cargar el historial"). El índice tarda unos minutos en pasar a estado "Habilitado" después de desplegarlo.

## 6. Cloud Function `calificarPrueba`

Archivo: `functions/src/calificarPrueba.js`. Es una función callable de 2.ª generación (`onCall` de `firebase-functions/v2/https`). Configuración global en `functions/index.js`: región `us-central1` y `maxInstances: 10`. El cliente la invoca con `httpsCallable(functions, "calificarPrueba")` y debe usar la misma región (`getFunctions(app, "us-central1")`).

### Entrada

```js
{
  cuestionarioId: "abc123",        // ID de Firestore: letras, números, "-" y "_", hasta 128 caracteres
  respuestasEstudiante: [          // de 1 a 200 elementos, sin preguntaId repetido
    { preguntaId: "seed_1", respuestaSeleccionada: "A" }  // null si no respondió; texto de hasta 16 caracteres
  ],
  tiempoEmpleado: 312              // número entre 0 y 86400 (segundos); se redondea
}
```

El `uid` nunca se lee de la entrada: sale solo de `request.auth.uid`. Los campos extra se descartan.

### Salida

```js
{
  resultadoId: "abc123_<uid>",
  puntaje: 75,                    // entero de 0 a 100
  respuestasCorrectas: 3,
  respuestasIncorrectas: 1,
  nuevosLogros: ["primer_quiz"]   // IDs de los logros otorgados en esta llamada
}
```

La salida no incluye `respuestaCorrecta` ni `explicacion`.

### Errores

Son `HttpsError`. En el cliente el código llega con el prefijo `functions/`.

| Código | Cuándo |
| ------ | ------ |
| `unauthenticated` | No hay sesión |
| `invalid-argument` | La entrada no cumple el formato, o hay más respuestas que preguntas en el cuestionario |
| `not-found` | El cuestionario no existe, o alguna `preguntaId` no existe (el detalle trae el `preguntaId`) |
| `already-exists` | Ya existe el resultado de ese cuestionario para ese usuario |
| `internal` | Falló la escritura del resultado |

Si falla la gamificación (fase B) no se devuelve error: se registra en el log y la respuesta sale igual (ver "Fases").

### Pasos

1. Exige sesión y valida la entrada (`validacion.js`).
2. Lee `cuestionarios/{cuestionarioId}` y comprueba que no se envíen más respuestas que preguntas tiene (`preguntas.length`).
3. Lee todas las preguntas enviadas en un solo viaje (`db.getAll`). La función no comprueba que esas preguntas pertenezcan al cuestionario (decisión de diseño anotada en el código).
4. Califica (`calificacion.js`): una respuesta es correcta si es distinta de `null` e igual a `respuestaCorrecta`. El puntaje es `round(correctas / respuestas enviadas * 100)`.
5. Fase A, obligatoria y atómica: un lote (`batch`) que crea `resultados/{cuestionarioId}_{uid}` con `create()` y una respuesta por pregunta en la subcolección.
6. Fase B, tolerante a fallos: `gamificacion.js` en una transacción.
7. Devuelve el resultado.

### Idempotencia

El ID del resultado es `cuestionarioId_uid` y se escribe con `create()`. Si el estudiante reenvía la misma prueba (por ejemplo, un reintento tras un corte de red), el lote falla con el código gRPC `ALREADY_EXISTS` y la función responde `already-exists` sin duplicar el resultado, el XP ni los logros. El cliente (`Quiz.jsx`) trata `functions/already-exists` navegando al resultado ya guardado. Como cada prueba arma un cuestionario nuevo con ID propio, esto no limita cuántas pruebas puede hacer un estudiante; solo evita contar dos veces la misma.

### Gamificación y tope de XP

Constantes en `functions/src/gamificacion.js`:

| Constante | Valor | Efecto |
| --------- | ----- | ------ |
| `XP_POR_CORRECTA` | 10 | XP por cada respuesta correcta |
| `XP_MAXIMO_POR_PRUEBA` | 100 | Tope de XP por prueba: `min(correctas * 10, 100)` |
| `XP_POR_NIVEL` | 1000 | `nivel = max(floor(xp / 1000) + 1, nivel actual)`; el nivel nunca baja |

La transacción lee el usuario y los logros ya obtenidos; actualiza `xp` y `nivel` del usuario; escribe `ranking/{uid}` con `merge` (puntaje, nombre, apellido, nivel y fecha); y crea `logrosObtenidos/{logroId}` para cada logro del catálogo cuyo criterio se cumple y que el estudiante aún no tenía. Los criterios cuentan los resultados del usuario (incluido el recién guardado) con una consulta de agregación `count()`.

Fases y consistencia: la fase A es la fuente de verdad. Si la fase B falla (por ejemplo, el usuario no tiene documento en `usuarios`), el resultado queda guardado y el error se registra con `logger.error`. No hay reintento automático: un reenvío devolvería `already-exists` y la gamificación de esa prueba no se aplicaría nunca. Ver la sección 12.

### Pruebas

`cd functions && npm test` ejecuta 28 pruebas unitarias con `node --test`, en `functions/test/`: `calificacion.test.js`, `validacion.test.js` y `gamificacion.test.js` (esta última con una base de datos simulada). No hay pruebas del handler completo ni contra el emulador de Firestore.

## 7. Flujo completo de una prueba

1. El estudiante toca un área en Práctica. La aplicación navega a `/practica/cuestionario` con el `areaId` en el estado de la navegación. Sin `areaId`, la misma pantalla arma el simulacro general.
2. `Quiz.jsx` prepara la prueba:
   - `quizService.armarCuestionario` lee el área, elige hasta 10 preguntas al azar del área y crea el documento en `cuestionarios` (con `preguntas`, `duracion` y `fechaCreacion`).
   - En paralelo, `questionService.obtenerPreguntas` pide las preguntas del área otra vez (con otro orden aleatorio) y quita `respuestaCorrecta` y `explicacion` en el cliente. Esas son las que se muestran. Por eso el contenido de `cuestionarios.preguntas` puede no coincidir con las preguntas mostradas.
   - El temporizador (`useTimer`) arranca con la duración del área en minutos por 60.
3. Las respuestas viven en el estado de React. No se guardan en ningún lado hasta enviar.
4. Al tocar "Finalizar" (o al llegar el temporizador a 0), el cliente llama a `calificarPrueba` con el `cuestionarioId`, una respuesta por pregunta mostrada (`null` si no se respondió) y `tiempoEmpleado = duración - tiempo restante`.
5. La función valida, califica y escribe (sección 6) y devuelve `resultadoId`.
6. El cliente navega a `/resultados/{resultadoId}`. `Results` lee el resultado y sus respuestas (consulta con `where("usuarioId", "==", ...)`, alineada con las reglas).
7. En "Ver retroalimentación", `Feedback` lee cada pregunta con `getQuestionById` para mostrar la opción correcta y la explicación. Esto depende de que las reglas permitan leer esos campos de `preguntas` (ver la sección 12).
8. Estadísticas, Historial, Logros, Ranking, Inicio y Perfil leen los datos ya escritos. Inicio y Perfil toman `xp` y `nivel` del perfil que `AuthContext` cargó al iniciar sesión, por eso se ven desactualizados hasta recargar.

## 8. Desarrollo local con emuladores

Los comandos completos están en el [README](../README.md#desarrollo-local-con-la-emulator-suite). Resumen técnico:

- `firebase.json` define los emuladores de Authentication (9099), Firestore (8080), Functions (5001) y la interfaz (4000), con `singleProjectMode: true`. No hay emulador de Storage.
- Se inician con `firebase emulators:start --project demo-learnfex`. El prefijo `demo-` indica a Firebase que es un proyecto de demostración que no usa servicios reales.
- El cliente se conecta con `VITE_USE_EMULATORS=true`; `src/config/firebase.js` apunta a `127.0.0.1` en los puertos de `firebase.json`.
- El emulador de Functions ejecuta el código de `functions/` (necesita `npm install` en esa carpeta) y aplica `firestore.rules` y `firestore.indexes.json`, salvo que los índices compuestos no se exigen.
- Los datos no persisten entre ejecuciones. Hay que volver a cargar el seed y volver a asignar el rol de administrador.

## 9. Despliegue

### 9.1 Requisitos

- Proyecto de Firebase con el plan Blaze (de pago por uso). Cloud Functions no se puede desplegar en el plan gratuito Spark. El Plan de Proyecto asumía Spark; ver la sección 13. Con el uso esperado de un proyecto académico el costo suele ser mínimo, pero conviene configurar alertas de presupuesto.
- Firebase CLI instalado y con sesión iniciada (`firebase login`) con una cuenta que tenga permisos sobre el proyecto.
- Node.js 22 para las funciones (declarado en `functions/package.json`).
- `.firebaserc`: en el repositorio está vacío (0 bytes). No se puede depender de un proyecto predeterminado, por lo que todos los comandos de despliegue deben llevar `--project <id-del-proyecto>`.

Regla de oro: nunca ejecutar `firebase deploy` sin opciones. Despliega todo a la vez, sin respetar el orden de abajo y sobre el proyecto que la CLI tenga activo.

### 9.2 Orden obligatorio

El despliegue conjunto de la función, el cliente y las reglas debe hacerse en este orden (es el requisito de despliegue que el equipo identifica como RF-031):

1. Función `calificarPrueba`:

   ```bash
   firebase deploy --only functions --project <id-del-proyecto>
   ```

2. Índices de Firestore (pueden desplegarse en este paso; deben estar en estado "Habilitado" antes de que el cliente los necesite):

   ```bash
   firebase deploy --only firestore:indexes --project <id-del-proyecto>
   ```

3. Cliente nuevo publicado en el hosting (ver 9.3), con sus variables de entorno ya definidas.

4. Reglas de seguridad:

   ```bash
   firebase deploy --only firestore:rules --project <id-del-proyecto>
   ```

Por qué ese orden:

- El cliente nuevo llama a `calificarPrueba`. Si se publica antes que la función, no hay a quién llamar y toda prueba falla con "No se pudo calificar el cuestionario.".
- Las reglas actuales prohíben al cliente escribir resultados, respuestas, logros y su propio XP o nivel. Un cliente anterior a la migración (que escribía esos datos directamente) deja de funcionar en cuanto las reglas se despliegan. Por eso las reglas van al final, cuando ya está publicado el cliente que usa la función.
- La función usa el Admin SDK, así que funciona con las reglas anteriores o con las nuevas; desplegarla primero no rompe nada.

Comprobación después de cada paso: ver "Diagnóstico" (sección 11) y los registros con `firebase functions:log --project <id>` o `npm run logs` dentro de `functions/` (este último usa el proyecto activo de la CLI; preferir la forma con `--project`).

### 9.3 Frontend en Vercel

El Plan de Proyecto (secciones 2.1, 5.2, 9 y 10.2) y el SDD (sección 8) indican Vercel como hosting del frontend: construye con `vite build` y publica en su CDN, con un despliegue de vista previa por Pull Request y uno de producción por cada merge a la rama principal.

Configuración en Vercel:

- Framework: Vite. Comando de build: `npm run build`. Directorio de salida: `dist`. Vercel los detecta solos.
- Variables de entorno: cargar en Settings > Environment Variables las seis `VITE_FIREBASE_*` (y dejar `VITE_USE_EMULATORS` sin definir o en `false`) antes del primer build. Se inyectan en tiempo de build: si se cambian, hay que volver a desplegar. Ver [`variables-de-entorno.md`](variables-de-entorno.md).
- `vercel.json` (en la raíz del repositorio) reescribe todas las rutas a `index.html`:

  ```json
  {
    "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
  }
  ```

  Sin esa reescritura, abrir o recargar una ruta que no sea la raíz (por ejemplo `/inicio` o `/resultados/abc`) devuelve 404 del servidor, porque React Router resuelve las rutas en el navegador. Los archivos estáticos existentes (por ejemplo `/assets/...`) se siguen sirviendo directamente.
- Una vez publicado, comprobar en la consola de Firebase (Authentication > Configuración) que el dominio de la aplicación figure en los dominios autorizados. Esto no se probó para este repositorio.

Si se cambia de hosting, hace falta lo mismo: reescribir todas las rutas a `index.html`. En Firebase Hosting, agregar a `firebase.json` una sección `hosting` con `public: "dist"` y un `rewrites` de `**` a `/index.html` (hoy `firebase.json` no la tiene). En Netlify, un archivo `public/_redirects` con `/*  /index.html  200`.

### 9.4 Integración continua

El repositorio no tiene pipelines de integración continua (no hay `.github/workflows/`). El SDD (sección 8.2) los recomienda: ejecutar lint y pruebas en cada Pull Request y desplegar el backend al hacer merge. Se deja como recomendación porque modificar pipelines requiere una decisión del equipo. Una primera versión razonable ejecutaría `npm ci && npm run lint` en la raíz y `npm ci && npm test` en `functions/`; el lint hoy tiene errores preexistentes (sección 12), así que habría que corregirlos o configurarlo para no bloquear.

### 9.5 Revertir

- Reglas: volver a desplegar el `firestore.rules` de la versión anterior (`git checkout <commit> -- firestore.rules` y el comando del paso 4), o usar el historial de versiones de reglas de la consola de Firebase.
- Función: desplegar de nuevo el código de la versión anterior con el comando del paso 1.
- Cliente: Vercel permite volver a una versión anterior desde su panel.

## 10. Datos iniciales y primer administrador

- `scripts/seed-preguntas.js` carga 5 áreas, 40 preguntas (`seed_1` a `seed_40`) y 3 logros con `setDoc` e IDs fijos, por lo que ejecutarlo de nuevo sobrescribe en lugar de duplicar. Instrucciones y variables en el [README](../README.md#carga-de-datos-iniciales-seed).
- El script inicia sesión con `SEED_ADMIN_EMAIL` y `SEED_ADMIN_PASSWORD`. Las reglas exigen rol de administrador para escribir áreas, preguntas y logros.
- El primer administrador no se puede crear desde la aplicación: el registro siempre crea un estudiante y las reglas impiden que un estudiante cambie su `rol`. Hay que registrar la cuenta y editar a mano `usuarios/{uid}.rol` a `administrador` en la consola de Firestore (o en la interfaz de los emuladores). Después, ese administrador puede promover a otros desde la pantalla Usuarios.
- No ejecutar el seed contra un proyecto de producción con datos reales sin revisarlo: sobrescribe documentos con IDs fijos.

## 11. Diagnóstico de problemas frecuentes

| Síntoma | Causa probable | Qué revisar |
| ------- | -------------- | ----------- |
| "No se pudo calificar el cuestionario." al finalizar | La función no está desplegada o no responde; región distinta; emuladores apagados | `firebase functions:log --project <id>`; que `functions/index.js` y `src/config/firebase.js` usen `us-central1`; que los emuladores estén activos si `VITE_USE_EMULATORS=true` |
| "No se pudo cargar el historial" o error en Estadísticas | Falta el índice compuesto de `resultados` | Consola de Firebase > Firestore > Índices; desplegar `firestore:indexes` |
| `permission-denied` en consola del navegador | Reglas desplegadas distintas del código, o usuario sin rol suficiente | Comparar el ruleset publicado con `firestore.rules`; revisar `usuarios/{uid}.rol` |
| Pantalla en blanco al recargar una ruta en producción | Falta la reescritura a `index.html` en el hosting | `vercel.json` presente y desplegado |
| La aplicación en producción intenta conectarse a `127.0.0.1` | `VITE_USE_EMULATORS=true` en el build de producción | Variables del hosting y volver a construir |
| Errores de Firebase por configuración (`auth/invalid-api-key` y similares) | Variables `VITE_FIREBASE_*` ausentes en el build | Definirlas antes de construir; recordar que se inyectan en build |
| El seed termina con "Faltan SEED_ADMIN_EMAIL y/o SEED_ADMIN_PASSWORD" | Variables sin definir | [`variables-de-entorno.md`](variables-de-entorno.md) |
| El seed falla con `permission-denied` | El usuario del seed no tiene `rol: administrador` | Editar `usuarios/{uid}.rol` |
| Un usuario nuevo no ve el panel de administración | El rol se lee una sola vez al iniciar sesión | Cerrar sesión y volver a entrar, o recargar |

## 12. Problemas conocidos y deuda técnica

Verificados contra `firestore.rules` y el código actual. Las brechas de seguridad también están documentadas, con evidencia de ejecución, en `docs/qa/verificacion-rbac.md` y `docs/qa/integracion-end-to-end.md`. Se agrupan por tema y están ordenadas, dentro de cada grupo, de mayor a menor impacto.

### Seguridad y reglas de Firestore

1. `ranking` es escribible desde el cliente. La regla es `allow write: if esPropioUsuario(rankingId) || esAdministrador()`. Cualquier estudiante puede poner un `puntajeAcumulado` arbitrario en su propio documento o borrarlo, y el ranking se alimenta de esos valores. Debería ser solo lectura para el cliente (`allow write: if false`), porque lo escribe la función.
2. `estadisticas_progreso` permite escribir sobre el documento de otro usuario. La regla solo mira que el `usuarioId` del documento nuevo sea el propio, no el dueño del documento existente (`allow write: if estaAutenticado() && request.resource.data.usuarioId == request.auth.uid`). Un estudiante puede pisar el documento `{otroUid}_{areaId}`.
3. `preguntas` expone la respuesta correcta. Cualquier usuario con sesión puede leer `respuestaCorrecta` y `explicacion` de todas las preguntas antes de hacer una prueba. `questionService.obtenerPreguntas` los quita solo en el cliente. La pantalla de retroalimentación depende de leer esos campos, así que cerrarlo exige rediseñar ese flujo (por ejemplo, guardar la respuesta correcta y la explicación en la subcolección `respuestas` al calificar, o devolverlas desde la función).
4. `cuestionarios` y `estadisticas_plataforma` aceptan `create` de cualquier usuario con sesión sin validar contenido ni tamaño. Los cuestionarios los crea el cliente al iniciar una prueba, y de ahí depende la función. `estadisticas_plataforma` no se usa y debería cerrarse.
5. Usuario inactivo sin restricción. El campo `estado` solo se muestra y se cambia desde el panel. Ni el inicio de sesión, ni las rutas, ni las reglas, ni la función lo consultan, así que una cuenta desactivada sigue usando la aplicación (ERS, RF-020).
6. El administrador puede quitarse a sí mismo el rol, sin aviso, y no hay protección del último administrador. El cambio de rol tampoco pide confirmación.
7. La función no tiene límite de uso ni App Check. `maxInstances` es 10, pero un usuario autenticado puede llamarla sin límite.

### Integridad de la calificación y la gamificación

8. La función confía en el cuestionario que arma el cliente: no comprueba que las preguntas enviadas pertenezcan al cuestionario ni que se respondan todas. Solo limita la cantidad de respuestas al tamaño del cuestionario. El puntaje es sobre las respuestas enviadas. Un usuario puede crear un cuestionario propio con una o pocas preguntas (sumado al punto 3, conociendo la respuesta correcta) y obtener 100%.
9. No hay límite de pruebas por usuario ni por día. Como el tope de 100 XP es por prueba, repetir pruebas permite acumular XP y subir en el ranking sin límite. Mientras los cuestionarios los cree el cliente, el XP y el ranking no son confiables. La solución de fondo es que los cree o valide el servidor.
10. `tiempoEmpleado` se acepta si está entre 0 y 86400; no se contrasta con la duración del cuestionario. El temporizador solo existe en el cliente.
11. La fase B de la función (XP, nivel, ranking, logros) no se reintenta. Si falla, el resultado queda guardado, el XP no se aplica, y un reenvío devuelve `already-exists`. No hay mecanismo de reparación.
12. Dos barajadas distintas por prueba. `armarCuestionario` guarda un conjunto de preguntas y `Quiz.jsx` muestra otro (segunda consulta con otro orden aleatorio). Hoy no rompe nada porque el área tiene 8 preguntas y el cuestionario pide hasta 10, pero `cuestionarios.preguntas` no refleja lo que vio el estudiante. Lo correcto es leer las preguntas del cuestionario guardado.
13. Cada vez que se abre una prueba se crea un cuestionario, también si se abandona o se recarga la página; no se limpian. La lista del panel de simulacros crece sin control.

### Datos y consistencia con el diseño

14. Valores de dificultad inconsistentes: el seed usa `baja`, `media`, `alta` y el panel `facil`, `media`, `dificil`. Los filtros del panel no coinciden con los datos cargados por el seed.
15. `areaId` en el formulario de preguntas es texto libre: no se valida contra las áreas existentes.
16. `tiempoLimite` y `duracion` se guardan en minutos; el SDD las define en segundos.
17. El perfil (`xp`, `nivel`, `rol`) se carga una sola vez al iniciar sesión. Inicio y Perfil se ven desactualizados tras una prueba, y un cambio de rol no se refleja sin recargar.
18. Las áreas no tienen pantalla de administración: solo seed o consola.
19. Los simulacros no tienen acceso en la interfaz (solo escribiendo `/practica/cuestionario`) y el armado no valida que cada área aporte preguntas (RF-008). El panel no permite crear ni editar simulacros.
20. Al borrar una pregunta no se advierte el impacto sobre resultados ya guardados; la retroalimentación omite en silencio la pregunta borrada.

### Rendimiento y escalabilidad

21. Los cálculos de estadísticas se hacen en el cliente: Estadísticas del estudiante lee todos sus resultados y un cuestionario por cada uno, y hace un `setDoc` por área en cada visita. El Dashboard y Reportes del administrador leen las colecciones `usuarios` y `resultados` completas. Escala mal con el número de usuarios; el SDD recomienda contadores o agregados precalculados.
22. El historial del estudiante no está paginado (el SDD pide paginación por cursores).
23. El build genera un solo paquete JavaScript de unos 888 kB (advertencia de Vite); no hay división de código por ruta.
24. `esAdministrador()` hace una lectura adicional de `usuarios` en cada evaluación de reglas que la usa.

### Calidad, operación y documentación

25. Sin pruebas automatizadas del cliente; la función solo tiene pruebas unitarias (28). No hay pruebas del handler ni contra emuladores.
26. `npm run lint` reporta 26 errores y 2 advertencias preexistentes (por ejemplo, `React` importado sin usar y variables sin usar).
27. No hay integración continua ni despliegue automatizado (sección 9.4).
28. `.firebaserc` está vacío en el repositorio: todo despliegue exige `--project`.
29. `.gitignore` ignora `.env` y `*.local`, pero no `.env.production`, `.env.development` ni `.env.test`, que Vite también carga.
30. Storage se inicializa y no se usa (sin reglas ni emulador); `src/services/storageService.js` está vacío.
31. No hay página 404.
32. El mensaje de error de `scripts/seed-preguntas.js` aún dice que el panel de administración "todavía no existe"; ya existe.
33. El proyecto no tiene `.env.example` versionado (el entorno de trabajo que preparó esta documentación no permitió crearlo): el bloque está en [`variables-de-entorno.md`](variables-de-entorno.md).

## 13. Diferencias entre los documentos de diseño y el código

Para evitar confusiones al leer el SDD y el Plan junto con el código:

| Tema | Lo que dicen el SDD o el Plan | Lo que hace el código |
| ---- | ----------------------------- | --------------------- |
| Plan de Firebase | El Plan asume Spark (gratuito) como suficiente | Cloud Functions exige el plan Blaze |
| Funciones callable (SDD 5.2) | Nueve funciones: `crearPerfilUsuario`, `obtenerPreguntas`, `finalizarPrueba`, `calificarPrueba` (interna), `obtenerEstadisticas`, `obtenerRanking`, `gestionarPregunta`, `gestionarUsuario` y un trigger `actualizarGamificacion` | Existe una sola: `calificarPrueba`, invocada directamente por el cliente, que incluye la gamificación. El perfil, las preguntas, las estadísticas, el ranking y la administración se hacen con acceso directo a Firestore |
| Respuesta correcta (SDD 6.2) | `obtenerPreguntas` nunca devuelve `respuestaCorrecta` ni `explicacion` durante la prueba | Las reglas dejan leerlos; solo se quitan en el cliente |
| Ranking (SDD 6.1) | `allow write: if false` (solo Cloud Functions) | Las reglas permiten escribir al dueño del documento y al administrador |
| Resultados (SDD 6.1) | El fragmento de ejemplo permite `create` al dueño | Las reglas reales lo prohíben; solo crea la función |
| Dificultad (SDD 4.2) | `baja`, `media`, `alta` | El seed usa esos valores; el panel usa `facil`, `media`, `dificil` |
| Opciones (SDD 4.2) | `array<string>` y `respuestaCorrecta` como valor de la opción | `array` de `{ id, text }` y `respuestaCorrecta` es la letra |
| Tiempos (SDD 4.2) | `tiempoLimite` y `duracion` en segundos | En minutos |
| Entornos (SDD 8.1) | `learnfex-dev`, `learnfex-staging` y `learnfex-prod` | No hay configuración de entornos en el repositorio; `.firebaserc` está vacío |
| CI/CD (SDD 8.2) | GitHub Actions con lint, pruebas y despliegue | No existe |
| Cuenta desactivada (ERS RF-020) | Debe restringir el acceso | No lo hace |
| Perfil (SDD 5.1) | Foto, edición de datos, modo claro y oscuro | Solo nombre, apellido y colegio; sin foto ni temas |
| Persistencia sin conexión (SDD 7.1) | Se recomienda activarla | No está activada; la aplicación requiere conexión |
| Requisitos RF-026 a RF-031 | RF-026, RF-028 y RF-029 se citan en comentarios del código y RF-031 es el requisito de orden de despliegue que usa el equipo | La ERS v1.0 solo define RF-001 a RF-025; esos requisitos no figuran en ella |

## Referencias

- `docs/LearnFex_ERS.docx`, `docs/LearnFex_SDD.docx` y `docs/Plan_de_Proyecto_LearnFex.docx`: requisitos, diseño y plan.
- `docs/qa/`: casos de prueba y resultados de ejecución, en particular `verificacion-rbac.md` e `integracion-end-to-end.md`.
- `firestore.rules`, `firestore.indexes.json`, `firebase.json`, `functions/`: configuración y código descritos en este manual.
