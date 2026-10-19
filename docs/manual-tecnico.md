# Manual técnico de LearnFex

Este manual documenta cómo está construido LearnFex y cómo se opera: arquitectura, modelo de datos, reglas de seguridad, la Cloud Function de calificación, el flujo de una prueba, el desarrollo local y el procedimiento de despliegue. Termina con los problemas conocidos y la deuda técnica.

Todo lo que se afirma aquí se verificó contra el código y las reglas del repositorio (rama `main`, commit `99a359d`, 2026-10-19). Lo que no se pudo comprobar desde el repositorio (por ejemplo, qué versión de las reglas está desplegada en un proyecto) se marca como "no verificado". Cuando el código se aparta de los documentos de diseño (`docs/LearnFex_SDD.docx` y `docs/Plan_de_Proyecto_LearnFex.docx`), se indica. Para el uso de la aplicación, ver [`manual-usuario.md`](manual-usuario.md); para la instalación y los comandos del día a día, ver el [`README.md`](../README.md); para las variables de entorno, ver [`variables-de-entorno.md`](variables-de-entorno.md).

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
- La autenticación es de Firebase Authentication con correo y contraseña. El rol del usuario (`estudiante` o `administrador`) y el estado de la cuenta (`activo` o `inactivo`) viven en los campos `rol` y `estado` de su documento `usuarios/{uid}`, no en reclamaciones (custom claims) del token. Las reglas leen ese documento en cada solicitud (sección 4).
- El hosting del frontend definido por el Plan de Proyecto es Vercel (ver la sección 9).

Servicios de Firebase que el código inicializa: Authentication, Firestore, Functions y Storage (`src/config/firebase.js`). Storage se inicializa pero ninguna pantalla lo usa y no hay reglas de Storage en el repositorio.

## 2. Estructura del código

```text
src/
  config/firebase.js      Inicializa la app, auth, db, storage y functions (región us-central1);
                          conecta a emuladores si VITE_USE_EMULATORS === "true"
  context/AuthContext.jsx Sesión y perfil: carga usuarios/{uid} en onAuthStateChanged y lo vuelve a leer
                          con refreshProfile (lo llama Resultados); si la cuenta es inactiva
                          (esCuentaInactiva) cierra la sesión y activa el indicador cuentaInactiva
  hooks/                  useAuth (lee el contexto), useTimer (temporizador de la prueba)
  routes/                 AppRoutes (mapa de rutas), PrivateRoutes (exige sesión), AdminRoute (exige rol)
  layouts/                StudentLayout (Navbar + BottomNavigation), AdminLayout
  pages/{auth,student,admin,legal}/   Pantallas (legal: política de privacidad)
  pages/NotFound/         Página 404
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
| `/privacidad` | Ninguna | Pública: la política de tratamiento de datos debe poder leerse antes de registrarse. El registro la enlaza en una pestaña nueva |
| `*` (cualquier otra) | Ninguna | `NotFound`: "Página no encontrada", con un enlace a `/inicio` (sin sesión, `PrivateRoutes` lo lleva a `/`) |
| `/inicio`, `/practica`, `/estadisticas`, `/historial`, `/ranking`, `/logros`, `/perfil` | `PrivateRoutes` (solo exige sesión) | Dentro de `StudentLayout`. Un administrador también las abre |
| `/practica/cuestionario`, `/resultados/:resultadoId`, `/resultados/:resultadoId/retroalimentacion` | `PrivateRoutes` | Fuera de `StudentLayout` (sin menú) |
| `/admin`, `/admin/usuarios`, `/admin/preguntas`, `/admin/reportes`, `/admin/simulacros`, `/admin/configuracion`, `/admin/logros` | `AdminRoute` (sesión y `rol === "administrador"`) | Dentro de `AdminLayout` |

La ruta comodín `*` está declarada al final de `AppRoutes.jsx` (`src/routes/AppRoutes.jsx:89`). Las guardas de rutas son una comodidad de interfaz; la seguridad real está en las reglas de Firestore.

## 3. Modelo de datos de Firestore

Los nombres de campo son los que escribe el código actual. Donde difiere del diccionario de datos del SDD, se anota en la sección 13.

### `usuarios/{uid}`

El ID es el UID de Firebase Authentication. Lo crea el cliente al registrarse (`userRepository.createUserProfile`), después de crear la cuenta en Authentication. `userService.registerUser` y `createUserProfile` se niegan a continuar si no recibe la aceptación de la política (`src/services/userService.js:6`, `src/repositories/userRepository.js:47`). `updateUserProfile` descarta del cambio `rol`, `estado`, `xp`, `nivel`, `correo`, `consentimientoDatos` y `fechaConsentimiento` antes de escribir.

| Campo | Tipo | Descripción |
| ----- | ---- | ----------- |
| `nombre`, `apellido`, `correo` | string | Datos personales |
| `rol` | string | `estudiante` o `administrador` |
| `estado` | string | `activo` o `inactivo`. Un administrador lo cambia desde el panel (`setUserEstado`). Las reglas bloquean el acceso a los datos si vale algo distinto de `activo` (o si falta el campo, se trata como activo) y el cliente cierra la sesión con la misma regla (`esCuentaInactiva`); ver sección 4 |
| `xp` | number | Experiencia acumulada. La modifica la función |
| `nivel` | number | `max(floor(xp / 1000) + 1, nivel actual)`. La modifica la función |
| `colegio` | string | Editable por el propio usuario |
| `fechaRegistro` | timestamp | `serverTimestamp()` |
| `consentimientoDatos` | boolean | Siempre `true`: constancia de que aceptó la política de tratamiento de datos al registrarse. La regla de creación lo exige |
| `fechaConsentimiento` | timestamp | `serverTimestamp()` en el momento del registro. La regla de creación exige que sea igual a la hora del servidor (`request.time`) |

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
| `dificultad` | string | `baja`, `media` o `alta`, tanto en el seed como en el formulario y el filtro del panel (`Questions.jsx`). Una pregunta guardada desde el panel antes del PR #90 podría tener `facil` o `dificil` (no verificado si existe alguna) |
| `areaId` | string | ID del área |

### `cuestionarios/{cuestionarioId}`

Lo crea el cliente cada vez que un estudiante empieza una prueba (ID automático), una vez que ya tiene las preguntas: si el área no tiene preguntas, o el simulacro no cumple sus validaciones, no se crea nada. Incluye los cuestionarios por área y los simulacros. Las reglas aceptan el `create` solo con esta forma exacta (`esCuestionarioValido`, sección 4).

| Campo | Tipo | Descripción |
| ----- | ---- | ----------- |
| `titulo`, `descripcion` | string | Por ejemplo "Cuestionario de Matemáticas" o "Simulacro general" |
| `tipo` | string | `cuestionario` o `simulacro` |
| `areaId` | string o null | `null` en los simulacros |
| `duracion` | number | Copia de `tiempoLimite` del área (minutos); en el simulacro, la suma de las áreas |
| `estado` | string | `activo` al crearse (la regla exige ese valor) e `inactivo` si el panel lo desactiva (`deleteQuiz`); ninguna pantalla de estudiante ni la función lo consultan |
| `preguntas` | array de `{ preguntaId, orden }` | Preguntas del cuestionario: son las mismas que `Quiz.jsx` muestra (se usan las que devolvió `armarCuestionario` o `armarSimulacro`, no se vuelven a consultar) |
| `fechaCreacion` | timestamp | `serverTimestamp()`; la regla exige que sea igual a la hora del servidor. Los cuestionarios antiguos sin este campo no aparecen en la lista del panel |

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

Un documento por estudiante, con el UID como ID. Lo escribe solo la función: las reglas niegan toda escritura desde el cliente (`allow write: if false`, `firestore.rules:133`).

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

Lo escribe el cliente cada vez que el estudiante abre Estadísticas (`statisticsService.calcularEstadisticas` hace un `setDoc` con `merge` por cada área). Las reglas solo permiten escribir un documento cuyo ID empiece por el UID de quien escribe y cuyo `usuarioId` sea el suyo; los valores de `porcentajeAvance` y `promedioAciertos` no se validan (sección 12).

| Campo | Tipo | Descripción |
| ----- | ---- | ----------- |
| `usuarioId`, `areaId` | string | Dueño y área |
| `porcentajeAvance` | number | 100 si hay al menos una prueba del área, 0 si no |
| `promedioAciertos` | number | Porcentaje de aciertos en el área |

La pantalla muestra lo que calcula en el momento; estos documentos solo se guardan y no se vuelven a leer en el cliente actual.

### `estadisticas_plataforma/{docId}`

Existe en las reglas (solo la lee un administrador; nadie la escribe desde el cliente), pero ningún código la usa. El panel calcula sus estadísticas leyendo `usuarios` y `resultados` completos (`platformStatsService`).

### `configuracion/general`

| Campo | Tipo | Descripción |
| ----- | ---- | ----------- |
| `nombre` | string | Nombre de la aplicación (obligatorio al guardar) |
| `descripcion`, `emailSoporte` | string | Opcionales |

Solo el panel lo lee y lo escribe; ninguna pantalla de estudiante lo muestra.

## 4. Reglas de seguridad

Archivo: `firestore.rules`. Funciones auxiliares:

| Función | Qué comprueba |
| ------- | ------------- |
| `haySesion()` | Hay sesión de Firebase Authentication (`request.auth != null`), sin mirar el perfil |
| `estaActivo()` | Lista blanca: el usuario cuenta como activo solo si no tiene documento en `usuarios`, o su documento no tiene campo `estado`, o `estado == 'activo'` (`firestore.rules:16-19`) |
| `estaAutenticado()` | `haySesion() && estaActivo()`. Es la puerta de casi todas las reglas |
| `esPropioUsuario(id)` | `estaAutenticado()` y el UID de la sesión es `id` |
| `esAdministrador()` | `estaAutenticado()` y `usuarios/{uid}.rol == 'administrador'` (un administrador inactivo deja de serlo) |
| `esActualizacionDePerfil()` | El cambio solo toca `nombre`, `apellido` o `colegio` |
| `esPreguntaDeCuestionarioValida(p)` | Un elemento de `preguntas` es un mapa con exactamente `preguntaId` (string de hasta 100 caracteres) y `orden` (entero) |
| `esCuestionarioValido(datos)` | La forma exacta que escribe `createQuiz` (ver abajo) |

Las reglas, resumidas para un usuario con cuenta activa:

| Colección | Visitante | Estudiante | Administrador |
| --------- | --------- | ---------- | ------------- |
| `usuarios/{id}` | Nada | Lee su propio documento. Crea el suyo con `rol: estudiante`, `estado: activo`, `xp: 0`, `nivel: 1`, `consentimientoDatos: true` y `fechaConsentimiento` igual a la hora del servidor. Actualiza solo `nombre`, `apellido` y `colegio` del suyo | Lee todos. Actualiza cualquier campo de los documentos AJENOS; en el suyo solo `nombre`, `apellido` y `colegio`. Nadie puede borrar |
| `usuarios/{id}/logrosObtenidos` | Nada | Lee los suyos. No escribe | Lee todos. No escribe |
| `areas`, `preguntas`, `logros`, `configuracion` | Nada | Lee | Lee y escribe |
| `cuestionarios` | Nada | Lee. Crea solo si cumple `esCuestionarioValido`. No actualiza ni borra | Lee, actualiza y borra. Crea con la misma validación que un estudiante |
| `resultados/{id}` y `resultados/{id}/respuestas` | Nada | Lee los suyos (por `usuarioId`). No escribe | Lee todos. No escribe |
| `ranking/{id}` | Nada | Lee todos. No escribe | Lee todos. No escribe (solo escribe la función con el Admin SDK) |
| `estadisticas_progreso/{id}` | Nada | Lee los suyos. Crea o actualiza solo si el ID empieza por su UID y el documento lleva su `usuarioId`. No borra | Lee todos. Escribe en las mismas condiciones que un estudiante (solo los suyos) |
| `estadisticas_plataforma/{id}` | Nada | Nada | Lee. Nadie escribe desde el cliente |
| Cualquier otra colección | Nada | Nada | Nada |

#### Cuentas inactivas (lista blanca)

`estaActivo()` falla cerrado: cualquier valor de `estado` distinto de `activo` (`inactivo`, `Inactivo`, `suspendido`, `true`, cadena vacía, `null`...) bloquea. Un usuario bloqueado solo puede hacer una cosa: leer su propio documento `usuarios/{uid}` (la regla de lectura usa `haySesion()` y no `estaActivo()`, `firestore.rules:68-71`), porque `AuthContext` necesita leerlo para descubrir que está inactivo y cerrarle la sesión. Todo lo demás se niega, incluidas las lecturas de catálogos y las escrituras propias. Un administrador inactivo también pierde los permisos de administración, porque `esAdministrador()` pasa por `estaAutenticado()`.

Hay dos casos en que un usuario con sesión cuenta como activo sin serlo de verdad: que todavía no tenga documento en `usuarios` (es necesario en el registro, porque Authentication crea la cuenta antes que `createUserProfile` cree el documento) y que su documento no tenga el campo `estado`.

El cliente aplica la misma regla: `userService.esCuentaInactiva(perfil)` devuelve verdadero si el perfil existe, tiene la clave `estado` y su valor no es `activo` (un `estado: null` cuenta como inactivo). La usan `AuthContext` (al iniciar sesión y en `refreshProfile`) y `Login`, y cierran la sesión con el aviso "Tu cuenta está desactivada. Contactá a un administrador." Si se cambia `estaActivo()`, hay que cambiar también esa función.

#### Costo de las llamadas `get()` y `exists()`

`estaActivo()` ejecuta `exists()` y `get()` sobre `usuarios/{uid}`, y `esAdministrador()` ejecuta otro `get()` sobre el mismo documento. Todas las llamadas apuntan a un único documento (el del usuario que hace la solicitud). Según el comentario de las propias reglas (`firestore.rules:14-15`), Firestore las cobra como una sola lectura por solicitud aunque la regla las mencione varias veces; es decir, casi toda solicitud de un usuario con sesión suma una lectura de `usuarios/{uid}`. El costo exacto en facturación no se midió.

Firestore limita las llamadas de acceso a documentos desde las reglas a 10 por solicitud de un solo documento (20 en lecturas o escrituras de varios documentos, transacciones y lotes; es un límite de la plataforma, no verificable desde este repositorio). Las reglas actuales solo acceden a un documento distinto por solicitud, así que están lejos del límite; conviene tenerlo presente si se agregan reglas que lean otros documentos.

#### Forma exacta de `cuestionarios` (`esCuestionarioValido`)

Las reglas no pueden recorrer listas, así que del arreglo `preguntas` solo se comprueban la cantidad y el primer y el último elemento:

- Claves permitidas: `titulo`, `descripcion`, `tipo`, `areaId`, `duracion`, `estado`, `preguntas`, `fechaCreacion`. Obligatorias: `titulo`, `tipo`, `estado`, `preguntas`, `fechaCreacion`.
- `titulo` string de hasta 120 caracteres; `tipo` en `cuestionario` o `simulacro`; `estado == 'activo'`.
- `preguntas` es una lista de 1 a 100 elementos; el primero y el último cumplen `esPreguntaDeCuestionarioValida`.
- Opcionales: `descripcion` (string de hasta 500), `duracion` (number), `areaId` (null o string de hasta 100).
- `fechaCreacion == request.time`.

No se comprueba que los `preguntaId` existan ni se limita cuántos cuestionarios válidos puede crear un usuario (sección 12).

#### Otras reglas a tener presentes

- Administrador sobre su propio documento: la rama de administrador de `update` exige `request.auth.uid != usuarioId` (`firestore.rules:84`). Un administrador no puede cambiar su propio `rol` ni su propio `estado`; solo `nombre`, `apellido` y `colegio` por la rama del propio usuario. La interfaz lo refleja (`Users.jsx` deshabilita la fila propia). La rama de administrador sobre documentos ajenos no valida los valores que escribe en `rol` y `estado`.
- `estadisticas_progreso`: el ID es `{uid}_{areaId}`; la regla usa `statId.split('_')[0] == request.auth.uid` (`firestore.rules:142-144`). Se apoya en que un UID de Firebase Authentication no lleva guion bajo.
- Las reglas nuevas del Sprint 7 y del bloqueo de inactivos (`ranking`, `estadisticas_progreso`, `cuestionarios`, `estadisticas_plataforma`, `estaActivo()`) se sumaron en los PR #93 y #108. Que un proyecto de Firebase concreto las tenga desplegadas no se puede comprobar desde el repositorio (no verificado).

Qué cerró la migración a Cloud Functions: antes, el cliente calificaba la prueba y escribía XP, nivel, resultado, respuestas, logros y ranking, y las reglas tenían que permitírselo. Al mover esa lógica a `calificarPrueba` (que usa el Admin SDK y no está sujeta a las reglas), se cerraron en las reglas:

- Crear `resultados` y `resultados/{id}/respuestas` desde el cliente (`allow create: if false`).
- Crear `usuarios/{id}/logrosObtenidos` desde el cliente.
- Que el propio usuario modifique `xp` o `nivel` (ahora solo puede actualizar `nombre`, `apellido` y `colegio`).

Según `docs/qa/verificacion-rbac.md`, las reglas con estos cierres se desplegaron en el proyecto de desarrollo el 2026-10-15 y la verificación del 2026-10-18 las confirmó. Esa verificación también encontró brechas en `ranking`, `estadisticas_progreso`, `cuestionarios`, `estadisticas_plataforma` y en los usuarios inactivos; el código actual de `firestore.rules` las cierra (PR #93 y #108), pero esas filas no se volvieron a ejecutar: siguen figurando como falla en el registro de QA (ver su "Actualización posterior"). Lo que sigue abierto, como `preguntas` expuesta con su respuesta correcta, está en la sección 12.

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

1. Exige sesión y valida la entrada (`validacion.js`). No consulta el campo `estado` del usuario ni su rol: acepta la prueba de cualquier cuenta con un token válido, también de una desactivada (sección 12).
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

1. El estudiante toca un área en Práctica. La aplicación navega a `/practica/cuestionario` con el `areaId` en el estado de la navegación. Con "Iniciar simulacro" (bloque "Simulacro completo" de Práctica) navega con `areaId: null` y la misma pantalla arma el simulacro general (`Practice.jsx`, `handleSimulacro`).
2. `Quiz.jsx` prepara la prueba, una sola vez:
   - `quizService.armarCuestionario` lee el área, pide las preguntas del área (`questionService.obtenerPreguntas`, que mezcla al azar, toma hasta 10 y quita `respuestaCorrecta` y `explicacion` en el cliente) y, si hay al menos una, crea el documento en `cuestionarios` (con `preguntas`, `duracion` y `fechaCreacion`). Si no hay preguntas, lanza un error y no crea nada.
   - `armarSimulacro` exige al menos 5 áreas y al menos una pregunta en cada una; toma `numPreguntas` preguntas al azar de cada área y suma los `tiempoLimite`. Si no se cumple, lanza un error con el motivo y no crea el documento.
   - Las preguntas que devolvió esa misma llamada son las que se muestran y las que quedan guardadas en `cuestionarios.preguntas`: ya no hay una segunda consulta con otro orden aleatorio.
   - El temporizador (`useTimer`) arranca con la duración del área en minutos por 60 (en el simulacro, la suma de las áreas).
3. Las respuestas viven en el estado de React. No se guardan en ningún lado hasta enviar.
4. Al tocar "Finalizar" (o al llegar el temporizador a 0), el cliente llama a `calificarPrueba` con el `cuestionarioId`, una respuesta por pregunta mostrada (`null` si no se respondió) y `tiempoEmpleado = duración - tiempo restante`. Si quedan preguntas sin responder, "Finalizar" pide confirmación con `window.confirm` (al agotarse el tiempo no se pide). Si la llamada falla, se muestra "No se pudo enviar tu prueba..." con un botón "Reintentar" que vuelve a enviar las mismas respuestas; `functions/already-exists` navega al resultado ya guardado.
5. La función valida, califica y escribe (sección 6) y devuelve `resultadoId` y `nuevosLogros`.
6. El cliente navega a `/resultados/{resultadoId}` pasando `nuevosLogros` en el estado de la navegación. `Results` lee el resultado y sus respuestas (consulta con `where("usuarioId", "==", ...)`, alineada con las reglas), vuelve a leer el perfil con `refreshProfile` y, si llegaron logros nuevos, busca su nombre en el catálogo y muestra "¡Logro desbloqueado!". El aviso solo existe si se llega desde la prueba: al recargar o abrir el resultado desde el historial, el estado de la navegación ya no trae los logros.
7. En "Ver retroalimentación", `Feedback` lee cada pregunta con `getQuestionById` para mostrar la opción correcta y la explicación. Esto depende de que las reglas permitan leer esos campos de `preguntas` (ver la sección 12). Si una pregunta ya no existe, se omite y la pantalla muestra cuántas faltan.
8. Estadísticas, Historial, Logros, Ranking, Inicio y Perfil leen los datos ya escritos. Inicio y Perfil toman `xp` y `nivel` del perfil que `AuthContext` mantiene: se carga al iniciar sesión y se refresca al abrir Resultados, por lo que se ven al día después de una prueba. El Historial hace una lectura de `cuestionarios` por cada resultado para mostrar el título.

## 8. Desarrollo local con emuladores

Los comandos completos están en el [README](../README.md#desarrollo-local-con-la-emulator-suite). Resumen técnico:

- `firebase.json` define los emuladores de Authentication (9099), Firestore (8080), Functions (5001) y la interfaz (4000), con `singleProjectMode: true`. No hay emulador de Storage.
- Se inician con `firebase emulators:start --project demo-learnfex`. El prefijo `demo-` indica a Firebase que es un proyecto de demostración que no usa servicios reales.
- El cliente se conecta con `VITE_USE_EMULATORS=true`; `src/config/firebase.js` apunta a `127.0.0.1` en los puertos de `firebase.json`.
- El emulador de Functions ejecuta el código de `functions/` (necesita `npm install` en esa carpeta) y aplica `firestore.rules` y `firestore.indexes.json`, salvo que los índices compuestos no se exigen.
- Los datos no persisten entre ejecuciones. Hay que volver a cargar el seed y volver a asignar el rol de administrador.
- Las reglas leen `usuarios/{uid}` en casi todas las solicitudes (sección 4). Al probar reglas con el simulador o con un script, el usuario que actúa debe tener su documento en `usuarios` con el `rol` y el `estado` que se quieran simular; sin documento cuenta como activo y sin rol de administrador.

## 9. Despliegue

### 9.1 Requisitos

- Proyecto de Firebase con el plan Blaze (de pago por uso). Cloud Functions no se puede desplegar en el plan gratuito Spark. El Plan de Proyecto asumía Spark; ver la sección 13. Con el uso esperado de un proyecto académico el costo suele ser mínimo, pero conviene configurar alertas de presupuesto.
- Firebase CLI instalado y con sesión iniciada (`firebase login`) con una cuenta que tenga permisos sobre el proyecto.
- Node.js 22 para las funciones (declarado en `functions/package.json`).
- `.firebaserc`: versionado, con un único proyecto por defecto, `learnfex-dev-oscar` (el proyecto de desarrollo del equipo). Un comando sin `--project` se ejecutaría contra ese proyecto, que no es necesariamente el que se quiere desplegar; por eso `--project <id-del-proyecto>` sigue siendo la forma recomendada y los comandos de abajo la llevan. No define alias para staging o producción.

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
- La regla de creación de `usuarios` exige `consentimientoDatos` y `fechaConsentimiento`. Un cliente anterior al registro con consentimiento no los escribe, así que con las reglas nuevas desplegadas su registro falla con `permission-denied`. Al revés, el cliente nuevo funciona con las reglas anteriores (no prohibían campos adicionales). Es otra razón para publicar las reglas al final.
- Las reglas nuevas exigen que `cuestionarios` tenga la forma que escribe el cliente actual (`esCuestionarioValido`) y que `estadisticas_progreso` use un ID con el UID como prefijo; el cliente actual ya cumple ambas cosas.
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
- El primer administrador no se puede crear desde la aplicación: el registro siempre crea un estudiante y las reglas impiden que un estudiante cambie su `rol`. Hay que registrar la cuenta y editar a mano `usuarios/{uid}.rol` a `administrador` en la consola de Firestore (o en la interfaz de los emuladores). Después, ese administrador puede promover a otros desde la pantalla Usuarios (no puede cambiar su propio rol ni su propio estado).
- No ejecutar el seed contra un proyecto de producción con datos reales sin revisarlo: sobrescribe documentos con IDs fijos.

## 11. Diagnóstico de problemas frecuentes

| Síntoma | Causa probable | Qué revisar |
| ------- | -------------- | ----------- |
| "No se pudo calificar el cuestionario." al finalizar | La función no está desplegada o no responde; región distinta; emuladores apagados | `firebase functions:log --project <id>`; que `functions/index.js` y `src/config/firebase.js` usen `us-central1`; que los emuladores estén activos si `VITE_USE_EMULATORS=true` |
| "No se pudo cargar el historial" o error en Estadísticas | Falta el índice compuesto de `resultados` | Consola de Firebase > Firestore > Índices; desplegar `firestore:indexes` |
| `permission-denied` en consola del navegador | Reglas desplegadas distintas del código, usuario sin rol suficiente o cuenta con `estado` distinto de `activo` | Comparar el ruleset publicado con `firestore.rules`; revisar `usuarios/{uid}.rol` y `.estado` |
| `permission-denied` al registrarse | Reglas nuevas desplegadas con un cliente anterior al consentimiento, que no escribe `consentimientoDatos` ni `fechaConsentimiento` | Publicar el cliente nuevo; respetar el orden de la sección 9.2 |
| Un usuario ve "Tu cuenta está desactivada. Contactá a un administrador." | `usuarios/{uid}.estado` tiene cualquier valor distinto de `activo` (`inactivo`, `Inactivo`, `suspendido`, `null`...) | Reactivarlo desde Usuarios, o corregir el campo en la consola |
| Error del servidor (404 del hosting) o pantalla en blanco al recargar una ruta en producción | Falta la reescritura a `index.html` en el hosting. No confundir con la página "Página no encontrada" de la aplicación, que solo se ve cuando la reescritura funciona y la ruta no existe | `vercel.json` presente y desplegado |
| La aplicación en producción intenta conectarse a `127.0.0.1` | `VITE_USE_EMULATORS=true` en el build de producción | Variables del hosting y volver a construir |
| Errores de Firebase por configuración (`auth/invalid-api-key` y similares) | Variables `VITE_FIREBASE_*` ausentes en el build | Definirlas antes de construir; recordar que se inyectan en build |
| El seed termina con "Faltan SEED_ADMIN_EMAIL y/o SEED_ADMIN_PASSWORD" | Variables sin definir | [`variables-de-entorno.md`](variables-de-entorno.md) |
| El seed falla con `permission-denied` | El usuario del seed no tiene `rol: administrador` | Editar `usuarios/{uid}.rol` |
| Un usuario nuevo no ve el panel de administración | El rol se lee al iniciar sesión o recargar (y al abrir Resultados), no cuando un administrador lo cambia | Cerrar sesión y volver a entrar, o recargar |

## 12. Problemas conocidos y deuda técnica

Verificados contra `firestore.rules` y el código de `main` (commit `99a359d`). Solo se listan los problemas que siguen abiertos; lo que se corrigió desde la versión anterior de este manual está en la tabla "Corregido desde la versión anterior" al final de la sección. Los registros de QA (`docs/qa/verificacion-rbac.md` y `docs/qa/integracion-end-to-end.md`) son históricos del 2026-10-18 y todavía muestran como fallas varias de esas brechas; no se volvieron a ejecutar. Los problemas se agrupan por tema y están ordenados, dentro de cada grupo, de mayor a menor impacto.

### Seguridad y reglas de Firestore

1. `preguntas` expone la respuesta correcta (riesgo aceptado temporalmente, ver más abajo). Cualquier usuario con sesión activa puede leer `respuestaCorrecta` y `explicacion` de todas las preguntas antes de hacer una prueba (`allow read: if estaAutenticado()`, `firestore.rules:101-104`). `questionService.obtenerPreguntas` los quita solo en el cliente. La pantalla de retroalimentación depende de leer esos campos directamente (`Feedback.jsx:36-42`), así que cerrarlo exige rediseñar ese flujo (por ejemplo, guardar la respuesta correcta y la explicación en la subcolección `respuestas` al calificar, o devolverlas desde la función). Está en la tarjeta Sprint 7 - 04. Riesgo aceptado temporalmente por decisión del dueño del proyecto del 2026-10-19 (Opción C de esa tarjeta); ver tarjeta Sprint 7 - 04 en el tablero. Consecuencia aceptada: cualquier estudiante autenticado puede leer la respuesta correcta antes de rendir, sacar 100 %, ganar el XP máximo y escalar en el ranking; el ranking y el XP no son confiables frente a un estudiante que sepa usar las herramientas del navegador. Alcance: temporal; hay que revisarlo antes de usar la plataforma con estudiantes reales o de publicar un ranking con consecuencias. La Opción A (subcolección de soluciones servida por una Cloud Function) queda en el backlog, en la tarjeta "[Backlog] [01] Backend: proteger las respuestas correctas".
2. La desactivación de una cuenta no alcanza a la función ni a Authentication. `calificarPrueba` solo mira `request.auth` (`functions/src/calificarPrueba.js:14-20`) y usa el Admin SDK, que no pasa por las reglas: una cuenta desactivada con un token vigente puede seguir enviando pruebas y sumando XP y ranking. Además, `setUserEstado` solo actualiza el documento de Firestore (`userRepository.js:105-113`): la cuenta de Authentication sigue habilitada, puede iniciar sesión en Firebase y obtener tokens. Lo que sí bloquea el acceso son las reglas y el cierre de sesión del cliente (sección 4).
3. Un perfil inexistente cuenta como activo. `estaActivo()` devuelve verdadero si no existe `usuarios/{uid}` (`firestore.rules:17`), porque el registro lo necesita. Una cuenta de Authentication sin documento (por ejemplo, si falló `createUserProfile` tras crear la cuenta) puede leer y escribir lo que las reglas permiten a "autenticado". Tampoco hay un barrido que detecte esas cuentas.
4. No hay protección del último administrador. Ninguna regla comprueba cuántos administradores activos quedan, y la rama de administrador de `usuarios` no valida los valores que escribe en `rol` y `estado` (`firestore.rules:84`). El autobloqueo ya está cerrado (un administrador no puede cambiar su propio rol ni estado), pero un administrador puede degradar o desactivar a cualquier otro. El cambio de rol tampoco pide confirmación en la pantalla.
5. Creación ilimitada de cuestionarios válidos. Cualquier usuario con sesión activa puede crear cuantos cuestionarios con la forma correcta quiera (`firestore.rules:108`); se valida la forma y el tamaño, no la cantidad ni que los `preguntaId` existan, y de la lista `preguntas` solo se revisan el primer y el último elemento. Es una consecuencia de que el cliente cree los cuestionarios (ver el punto 10).
6. `estadisticas_progreso` acepta valores arbitrarios en el propio documento: la regla solo comprueba el prefijo del ID y el `usuarioId` (`firestore.rules:142-144`). Impacto bajo: el cliente actual no lee esos documentos para mostrar datos.
7. El `create` de `usuarios` no limita campos adicionales ni comprueba que `nombre`, `apellido` o `correo` coincidan con la cuenta (`firestore.rules:73-79`, no hay `hasOnly`). Lectura de las reglas, no ejecutado. Después de crear el documento, el usuario solo puede modificar `nombre`, `apellido` y `colegio`.
8. La función no tiene límite de uso ni App Check. `maxInstances` es 10, pero un usuario autenticado puede llamarla sin límite.
9. No hay `storage.rules` ni sección `storage` en `firebase.json`, y el cliente inicializa Storage aunque ninguna pantalla lo usa (`src/services/storageService.js` está vacío). Si algún día se usa, hay que escribir sus reglas primero.

### Integridad de la calificación y la gamificación

10. La función confía en el cuestionario que arma el cliente: no comprueba que las preguntas enviadas pertenezcan al cuestionario ni que se respondan todas (`functions/src/calificarPrueba.js:28`, decisión de diseño anotada en el código). Solo limita la cantidad de respuestas al tamaño del cuestionario. El puntaje es sobre las respuestas enviadas. Un usuario puede crear un cuestionario propio con una pregunta (las reglas lo permiten, punto 5) y, conociendo la respuesta correcta (punto 1), obtener 100%.
11. No hay límite de pruebas por usuario ni por día. Como el tope de 100 XP es por prueba, repetir pruebas permite acumular XP y subir en el ranking sin límite. Mientras los cuestionarios los cree el cliente, el XP y el ranking no son confiables. La solución de fondo es que los cree o valide el servidor.
12. `tiempoEmpleado` se acepta si está entre 0 y 86400; no se contrasta con la duración del cuestionario. El temporizador solo existe en el cliente.
13. La fase B de la función (XP, nivel, ranking, logros) no se reintenta. Si falla, el resultado queda guardado, el XP no se aplica, y un reenvío devuelve `already-exists`. No hay mecanismo de reparación.
14. Cada vez que se abre una prueba que consigue preguntas se crea un cuestionario, también si se abandona o se recarga la página; no se limpian. La lista del panel de simulacros crece sin control. (Desde el PR #92, una prueba que no puede armarse, por ejemplo un área sin preguntas, ya no deja un cuestionario vacío.)
15. El armado del simulacro solo exige 5 áreas y al menos una pregunta por área (`quizService.js:40-59`). Si un área tiene menos preguntas que su `numPreguntas`, aporta las que tenga, sin aviso. La comprobación tampoco exige que sean las cinco áreas del seed por ID.

### Datos y consistencia con el diseño

16. `areaId` en el formulario de preguntas es texto libre: no se valida contra las áreas existentes.
17. `tiempoLimite` y `duracion` se guardan en minutos; el SDD las define en segundos.
18. Una pregunta creada desde el panel antes del PR #90 podría conservar la dificultad `facil` o `dificil`; el filtro y la etiqueta actuales (`baja`, `media`, `alta`) no la reconocen. No se verificó si existe alguna en algún proyecto.
19. El perfil se lee al iniciar sesión y cuando se abre Resultados (`refreshProfile`). Un cambio de `rol` hecho por un administrador no se refleja en la sesión del afectado hasta que recarga la página o vuelve a entrar.
20. Las áreas no tienen pantalla de administración: solo seed o consola.
21. El panel no permite crear ni editar simulacros, y desactivar un cuestionario (`estado: inactivo`) no tiene efecto: ninguna pantalla de estudiante ni la función consultan ese campo.
22. La retroalimentación depende de que la pregunta siga existiendo en `preguntas`: el resultado no guarda una copia. Si un administrador borra una pregunta, la pantalla la omite y lo avisa, y el panel advierte al eliminar (PR #104), pero esa información se pierde para los resultados ya guardados.
23. La política de privacidad (`/privacidad`) dice que el responsable y un correo de soporte "deben ser publicados por el equipo en la aplicación" (`Privacy.jsx:25-27` y `107-110`), y que no hay opción para eliminar la cuenta o los datos (`Privacy.jsx:112-115`). Ninguna pantalla muestra datos de contacto: `configuracion/general.emailSoporte` solo se lee en el panel de administración. Es un hueco entre el texto legal y la aplicación, pendiente de decisión del equipo.

### Rendimiento y escalabilidad

24. Los cálculos de estadísticas se hacen en el cliente: Estadísticas del estudiante lee todos sus resultados y un cuestionario por cada uno distinto, y hace un `setDoc` por área en cada visita. El Dashboard y Reportes del administrador leen las colecciones `usuarios` y `resultados` completas (`platformStatsRepository.js:6` y `:15`) y un cuestionario por cada uno distinto. Escala mal con el número de usuarios; el SDD recomienda contadores o agregados precalculados.
25. El historial del estudiante no está paginado (el SDD pide paginación por cursores) y, desde el PR #98, hace una lectura de `cuestionarios` por cada resultado para mostrar el título (`History.jsx:87-97`).
26. El build genera un solo paquete JavaScript de unos 888 kB (advertencia de Vite); no hay división de código por ruta. Cifra de la versión anterior de este manual, no re-verificada para esta actualización (no se ejecutó el build).
27. Casi toda solicitud de un usuario con sesión suma una lectura de `usuarios/{uid}` por las reglas (`estaActivo()` y `esAdministrador()`, sección 4). No se midió su impacto en la facturación.

### Calidad, operación y documentación

28. Sin pruebas automatizadas del cliente; la función solo tiene pruebas unitarias (28: 6 de calificación, 9 de gamificación y 13 de validación). No hay pruebas del handler ni contra emuladores, ni de las reglas de Firestore.
29. `npm run lint` reportaba 26 errores y 2 advertencias preexistentes (por ejemplo, `React` importado sin usar y variables sin usar). Cifra de la versión anterior de este manual, no re-verificada para esta actualización.
30. No hay integración continua ni despliegue automatizado (sección 9.4).
31. `.firebaserc` apunta por defecto a `learnfex-dev-oscar`, un proyecto de desarrollo del equipo, y no define staging ni producción: por eso los despliegues siguen llevando `--project` (sección 9.1).
32. `.gitignore` ignora `.env`, `.env.production`, `.env.development`, `.env.test` y `*.local`, pero Vite carga `.env.<modo>` para cualquier modo (por ejemplo `.env.staging`), que no está cubierto.

### Corregido desde la versión anterior de este manual

Estos puntos figuraban como abiertos y el código actual los resuelve. Se dejan aquí para poder cruzarlos con los registros de QA, que todavía los muestran como fallas.

| Antes | Estado actual | PR |
| ----- | ------------- | -- |
| `ranking` escribible desde el cliente | `allow write: if false` (`firestore.rules:133`) | #93 |
| `estadisticas_progreso` permitía pisar el documento de otro usuario | El ID debe empezar por el UID de quien escribe (`firestore.rules:142-144`) | #93 |
| `cuestionarios` y `estadisticas_plataforma` sin validar | `cuestionarios` valida su forma (`esCuestionarioValido`); `estadisticas_plataforma` tiene `write: false` | #93 |
| Usuario inactivo sin restricción | Cierre de sesión con aviso en el cliente y lista blanca en las reglas (la función y Authentication siguen sin enterarse: punto 2) | #101, #108 |
| El administrador podía quitarse el rol | Ni el rol ni el estado propios se pueden cambiar (`firestore.rules:84`, `Users.jsx`) | #106, #108 |
| Dos barajadas distintas por prueba | Se muestran y se guardan las mismas preguntas | #92 |
| Dificultad `facil`/`dificil` en el panel | El panel usa `baja`, `media`, `alta` | #90 |
| Simulacro sin acceso en la interfaz y sin validar áreas | Botón en Práctica y validación de áreas y preguntas | #96, #92 |
| Perfil desactualizado tras una prueba | `refreshProfile` al abrir Resultados | #97 |
| Borrar una pregunta sin advertir | Advertencia al eliminar y aviso en la retroalimentación | #104 |
| Sin página 404 | `NotFound` en la ruta `*` | #105 |
| El cliente solo cerraba la sesión con `estado === "inactivo"`; con otro valor distinto de `activo` la sesión quedaba abierta y todo fallaba con `permission-denied` | `esCuentaInactiva` aplica en el cliente la misma regla que `estaActivo()` | #110 |
| El comentario de `scripts/seed-preguntas.js` decía que el panel de administración "todavía no existe" | Reescrito: el primer administrador se crea a mano y después los roles se gestionan desde el panel | #110 |
| Sin `.env.example`; `.firebaserc` vacío; `.gitignore` incompleto | Los tres versionados/ampliados | #91 |
| Historial sin título ni tiempo, inaccesible en móvil | Título, tiempo y acceso desde Perfil | #98 |
| "Promedio general" sin `%` en Reportes | Con `%` | #107 |
| Administración de simulacros: "Cargar más" no terminaba | `hasMore` en `getAllQuizzes` | #85 |

## 13. Diferencias entre los documentos de diseño y el código

Para evitar confusiones al leer el SDD y el Plan junto con el código:

| Tema | Lo que dicen el SDD o el Plan | Lo que hace el código |
| ---- | ----------------------------- | --------------------- |
| Plan de Firebase | El Plan asume Spark (gratuito) como suficiente | Cloud Functions exige el plan Blaze |
| Funciones callable (SDD 5.2) | Nueve funciones: `crearPerfilUsuario`, `obtenerPreguntas`, `finalizarPrueba`, `calificarPrueba` (interna), `obtenerEstadisticas`, `obtenerRanking`, `gestionarPregunta`, `gestionarUsuario` y un trigger `actualizarGamificacion` | Existe una sola: `calificarPrueba`, invocada directamente por el cliente, que incluye la gamificación. El perfil, las preguntas, las estadísticas, el ranking y la administración se hacen con acceso directo a Firestore |
| Respuesta correcta (SDD 6.2) | `obtenerPreguntas` nunca devuelve `respuestaCorrecta` ni `explicacion` durante la prueba | Las reglas dejan leerlos; solo se quitan en el cliente |
| Ranking (SDD 6.1) | `allow write: if false` (solo Cloud Functions) | Coincide: las reglas actuales tienen `allow write: if false` (`firestore.rules:133`) |
| Resultados (SDD 6.1) | El fragmento de ejemplo permite `create` al dueño | Las reglas reales lo prohíben; solo crea la función |
| Dificultad (SDD 4.2) | `baja`, `media`, `alta` | Coincide: el seed y el panel usan esos valores |
| Opciones (SDD 4.2) | `array<string>` y `respuestaCorrecta` como valor de la opción | `array` de `{ id, text }` y `respuestaCorrecta` es la letra |
| Tiempos (SDD 4.2) | `tiempoLimite` y `duracion` en segundos | En minutos |
| Entornos (SDD 8.1) | `learnfex-dev`, `learnfex-staging` y `learnfex-prod` | `.firebaserc` define un solo proyecto por defecto, `learnfex-dev-oscar`; no hay alias de staging ni de producción |
| CI/CD (SDD 8.2) | GitHub Actions con lint, pruebas y despliegue | No existe |
| Cuenta desactivada (ERS RF-020) | Debe restringir el acceso | Lo hace en parte: las reglas y el cliente la bloquean (sección 4), pero la cuenta de Authentication sigue habilitada y `calificarPrueba` no consulta el estado (sección 12, punto 2) |
| Perfil (SDD 5.1) | Foto, edición de datos, modo claro y oscuro | Solo nombre, apellido y colegio; sin foto ni temas |
| Persistencia sin conexión (SDD 7.1) | Se recomienda activarla | No está activada; la aplicación requiere conexión |
| Requisitos RF-026 a RF-031 | RF-026, RF-028 y RF-029 se citan en comentarios del código y RF-031 es el requisito de orden de despliegue que usa el equipo | La ERS v1.0 solo define RF-001 a RF-025; esos requisitos no figuran en ella |

## Referencias

- `docs/LearnFex_ERS.docx`, `docs/LearnFex_SDD.docx` y `docs/Plan_de_Proyecto_LearnFex.docx`: requisitos, diseño y plan.
- `docs/qa/`: casos de prueba y resultados de ejecución, en particular `verificacion-rbac.md` e `integracion-end-to-end.md`.
- `firestore.rules`, `firestore.indexes.json`, `firebase.json`, `functions/`: configuración y código descritos en este manual.
