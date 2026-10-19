# QA - Verificación RBAC (control de acceso por roles y por datos)

Este documento valida que el control de acceso de LearnFex funcione en dos niveles: las rutas de la aplicación (qué pantallas puede abrir cada rol) y los datos de Firestore (qué puede leer y escribir cada rol según `firestore.rules`).

- Estado del documento: ejecutado el 2026-10-18 (tarjeta [Sprint 6 - 12] [01]). Cada caso tiene marcado su resultado y la evidencia observada. Ver "Datos de la ejecución" (qué entorno se usó para cada caso) y el "Resumen de ejecución" al final. La ejecución la hizo quien implementó el proyecto con ayuda de IA, no un tester independiente.
- Verificado contra el código de `main` en el commit `3ac0365` (ejecución del 2026-10-18). La versión anterior del documento se había verificado contra `c3d71aa`. Si `main` cambió desde entonces, revisar los casos antes de volver a ejecutarlos.
- Autoría original del borrador: Juliana Martínez (PR #62). El borrador estaba cortado en el caso 2; este documento lo completa. Actualizado tras agregar la ruta `/historial` (PR #67), el cierre de sesión en Perfil (PR #53) y, en la ejecución, tras el despliegue de las reglas de la tarjeta [Sprint 6 - 36] y el botón de cierre de sesión del panel de administración.
- Requisitos que cubre (ERS): acceso restringido según el rol con reglas de seguridad de Firestore (RNF-005), protección de los datos personales y del historial de resultados (RNF-006), gestión de usuarios por el administrador (RF-020) y el inicio de sesión que dirige al panel según el rol (RF-002).

---

## Cómo funciona hoy (resumen verificado en el código)

> Nota del 2026-10-19: este resumen describe el código de `main` `3ac0365`, el de la ejecución del 2026-10-18, y se conserva tal cual porque explica los resultados registrados más abajo. Desde entonces cambiaron las reglas y varias pantallas (ruta `/privacidad` y página 404, consentimiento en el registro, bloqueo de cuentas inactivas, `ranking` y `estadisticas_progreso` cerradas, forma validada de `cuestionarios`, el administrador sin poder cambiar su propio rol). El detalle está en la sección "Actualización posterior (2026-10-19)" al final, y el comportamiento vigente de las reglas, en la sección 4 de `docs/manual-tecnico.md`.

Rutas (`src/routes/AppRoutes.jsx`):

- Públicas: `/` (inicio de sesión), `/registro`, `/recuperar-contrasena`.
- Estudiante y administrador con sesión (`PrivateRoutes`): `/inicio`, `/practica`, `/estadisticas`, `/historial`, `/ranking`, `/logros`, `/perfil` (dentro del layout del estudiante) y `/practica/cuestionario`, `/resultados/:id`, `/resultados/:id/retroalimentacion` (fuera de ese layout). `PrivateRoutes` solo exige tener sesión: no distingue rol.
- Solo administrador (`AdminRoute`): `/admin`, `/admin/usuarios`, `/admin/preguntas`, `/admin/reportes`, `/admin/simulacros`, `/admin/configuracion`, `/admin/logros`.
- Sin sesión, ambas guardas redirigen a `/`. Con sesión pero sin rol `administrador`, `AdminRoute` redirige a `/inicio` (no existe una ruta `/home`).
- No hay ruta comodín: una URL inexistente (por ejemplo `/home`) muestra una pantalla en blanco, sin página 404.
- El rol sale del campo `rol` del documento `usuarios/{uid}`, que `AuthContext` carga una sola vez al iniciar sesión o recargar la página.
- Al iniciar sesión, `Login.jsx` navega a `/admin` si el rol es `administrador` y a `/inicio` en cualquier otro caso (también si falla la lectura del perfil).
- El botón "Cerrar sesión" está en Perfil (`/perfil`) y también en el encabezado del panel de administración (`AdminLayout`, commit `8212b28`). En ambos pide confirmación (`window.confirm`), llama a `authServices.logout()` y navega a `/`. Para probar otra cuenta se puede usar ese botón o ventanas privadas distintas.

Datos (`firestore.rules`), resumen:

- `usuarios/{id}`: lee el propio usuario o un administrador. Crea solo el propio usuario con `rol: estudiante`, `estado: activo`, `xp: 0`, `nivel: 1`. Actualiza un administrador cualquier campo; el propio usuario solo `nombre`, `apellido` o `colegio` (desde el despliegue de la tarjeta 6-36 ya no puede tocar `xp` ni `nivel`). Nadie puede borrar.
- `usuarios/{id}/logrosObtenidos`: lee el propio usuario o un administrador; sin create, update ni delete desde el cliente (los otorga el servidor).
- `areas`, `preguntas`, `logros`, `configuracion`: leen todos los usuarios con sesión; escribe solo un administrador.
- `cuestionarios`: lee y crea cualquier usuario con sesión; actualiza y borra solo un administrador.
- `resultados` y `resultados/{id}/respuestas`: lee el dueño (`usuarioId`) o un administrador; sin create, update ni delete desde el cliente.
- `ranking/{id}`: lee cualquier usuario con sesión; escribe el dueño del documento (el `id` es su UID) o un administrador.
- `estadisticas_progreso`: lee el dueño o un administrador; escribe cualquier usuario con sesión siempre que el documento nuevo tenga su propio `usuarioId`.
- `estadisticas_plataforma`: lee solo un administrador; cualquier usuario con sesión puede crear; sin update ni delete.
- Cualquier otra colección: denegado para todos.

## Hallazgo de seguridad vigente

> Nota del 2026-10-19: este hallazgo describe el estado en la fecha de la ejecución (2026-10-18). Las brechas de Sprint 7 que menciona (`ranking`, `estadisticas_progreso`, `cuestionarios`, `estadisticas_plataforma` y usuarios inactivos) ya tienen corrección en `main`; sigue abierta la de `preguntas` ([Sprint 7 - 04]). Ver "Actualización posterior (2026-10-19)" al final. Esas filas no se volvieron a ejecutar.

Las reglas de la tarjeta de Notion **[Sprint 6 - 36] Reglas de Firestore** ya están desplegadas en `learnfex-dev-oscar` (release del 2026-10-15 19:02 UTC, idénticas a `firestore.rules` de `main`): un estudiante ya no puede subir su propio XP y nivel ni crear `resultados`, `respuestas` ni `logrosObtenidos` desde el cliente. Los casos 9.15, 10.5, 13.8 y 13.9 pasan desde ese despliegue.

Siguen abiertas las brechas que cubren las tarjetas de Sprint 7, y la ejecución las confirmó (marcadas como falla conocida en cada caso): `ranking` escribible por el dueño ([Sprint 7 - 02]), `estadisticas_progreso` escribible sobre el documento de otro usuario ([Sprint 7 - 01]), `cuestionarios` y `estadisticas_plataforma` sin validar ([Sprint 7 - 03]), `preguntas` legible con la respuesta correcta ([Sprint 7 - 04]) y usuarios inactivos sin restricción ([Sprint 7 - 05] [01] en pantalla y [02] en reglas). Ver "Brechas detectadas" al final.

---

## Precondiciones generales

- Aplicación corriendo con `npm run dev`, apuntando a un proyecto de Firebase de pruebas (nunca datos reales), con `firestore.rules` desplegadas tal como están en el repositorio.
- Datos del seed cargados (`scripts/seed-preguntas.js`).
- Tres cuentas de prueba:
  - Estudiante A y estudiante B: crearlas en `/registro` (el registro siempre crea rol `estudiante`).
  - Administrador C: registrar una cuenta y cambiar a mano su campo `rol` a `administrador` en `usuarios/{uid}` desde la consola de Firestore (solo en el proyecto de pruebas).
- Anotar los UID de las tres cuentas (consola de Authentication) en la tabla de datos de la ejecución.
- Los casos de datos (9 a 18) se ejecutan con el simulador de reglas de Firestore (Rules Playground, en la consola de Firebase) o con el emulador de Firestore usando el `firestore.rules` del repositorio. El simulador permite elegir la operación (get, list, create, update, delete), la ruta, el UID autenticado (o sin autenticar) y los datos del documento; para `update` ingresar el documento completo tal como quedaría. Cuando el caso diga que se puede ver desde la interfaz, ese camino también es válido.

## Datos de la ejecución

| Campo | Valor |
| ----- | ----- |
| Fecha | 2026-10-18 |
| Tester | Claude (implementador del proyecto; ejecución no independiente de QA) |
| Entorno R (proyecto real, solo sin sesión) | `learnfex-dev-oscar` (reglas desplegadas el 2026-10-15 19:02 UTC; el ruleset publicado se comparó con `firestore.rules` de `main` y es idéntico), cliente local Vite sobre `main` 3ac0365 (puerto 5301) y SDK web de Firebase 12.18.0 desde Node. Solo se hicieron lecturas y escrituras sin sesión sobre ids `qa-rbac-*`, todas denegadas |
| Entorno E (emulador local, todo lo que requiere sesión) | Emulator Suite local (Authentication y Firestore, proyecto `demo-learnfex-qa-rbac`) cargando el `firestore.rules` de `main` 3ac0365; la aplicación de ese commit apuntando al emulador (`VITE_USE_EMULATORS=true`, tres servidores Vite en los puertos 5311, 5312 y 5313 para tener sesiones separadas por origen) y el navegador integrado de Claude Desktop (viewport 1024x768). Los casos de datos se ejecutaron con un script de Node y el SDK web 12.18.0 con un cliente por rol |
| Commit o rama probada | `main` 3ac0365 (rama `docs/QAEjecucionRBAC` creada desde `origin/main`) |
| Proyecto de Firebase | Entorno R: `learnfex-dev-oscar`. Entorno E: `demo-learnfex-qa-rbac` (emulador, descartado al terminar) |
| Estudiante A (correo y UID) | `qa-rbac-mverz52n-a@example.com`, UID de emulador `ZkCbqksUhnJZwaeZ7Zkm6mqYS3AM` |
| Estudiante B (correo y UID) | `qa-rbac-mverz52n-b@example.com`, UID de emulador `AiDF5EANuaVxGVxEmX3EO6mCOoFl` |
| Administrador C (correo y UID) | `qa-rbac-mverz52n-c@example.com`, UID de emulador `6nvvttAMRE1C2q0UpqSSOaN7k27z` |

Desvío respecto del plan original: no se crearon cuentas de Authentication ni datos en `learnfex-dev-oscar` (no se inició sesión contra el servicio de identidad real ni se escribió en el proyecto del equipo). Por eso todo lo que exige sesión se ejecutó en el emulador local con las mismas reglas (el ruleset desplegado es idéntico al archivo del repositorio, comparado byte a byte tras normalizar saltos de línea), y en el proyecto real solo se ejecutó lo que no necesita sesión. Limitaciones del emulador: no exige el índice compuesto de `firestore.indexes.json` (caso 13, fila 4) y no reproduce el estado real de los datos del proyecto. Los usuarios `qa-rbac-*` también tienen un usuario inactivo (D, `qa-rbac-mverz52n-d@example.com`) y un usuario de registro nuevo (E) usados en los casos 9 y 18; el emulador se descartó al terminar.

## Cómo registrar el resultado

- Marcar `[x]` una sola opción por caso o por fila: Pasa, Falla o Bloqueado (no se pudo ejecutar; explicar por qué en Observaciones).
- En las tablas, la columna "Esperado (correcto)" es el comportamiento que debe tener el sistema. La columna "Hoy" es lo que producen las reglas o el código actuales. Si son distintas, la fila está marcada como **esperado a fallar**: si falla exactamente como dice "Hoy", se registra como **Falla** con la observación "falla conocida" y la tarjeta que lo resuelve. Solo se abre un defecto nuevo si falla de otra manera. Cuando se cierre la tarjeta, la fila debe pasar.
- Adjuntar evidencia (captura, resultado del simulador o log) en cada caso ejecutado.

---

# Parte 1: control de acceso en las rutas

## Caso 1: Sin sesión, las rutas del estudiante redirigen al inicio de sesión

**Precondiciones:** ninguna sesión iniciada (ventana privada).

**Pasos:**

1. Abrir directamente cada una de estas URL: `/inicio`, `/practica`, `/estadisticas`, `/historial`, `/ranking`, `/logros`, `/perfil`, `/practica/cuestionario`, `/resultados/cualquier_id`, `/resultados/cualquier_id/retroalimentacion`.
2. En cada una, observar la pantalla, la URL final y la pestaña Red de DevTools.

**Resultado esperado:**

- Se ve un instante "Verificando sesión..." y la URL termina en `/` (pantalla "Iniciar sesión").
- No se renderiza ninguna pantalla del estudiante y no se consulta ninguna colección de datos.

**Resultado:**

- Resultado: [x] Pasa  [ ] Falla  [ ] Bloqueado
- Fecha / Tester / Entorno: 2026-10-18 / Claude (implementador del proyecto; ejecución no independiente de QA) / Entorno R (`learnfex-dev-oscar`, cliente local Vite sobre `main` 3ac0365)
- Evidencia (captura, log o enlace): las diez URL terminaron en `/` con el título "Iniciar sesión" (cada una cargada en un marco de la misma página sin sesión, más una carga directa de `/practica` en la pestaña). En ninguna se registró una solicitud de recursos a `googleapis.com`/Firestore (0 de 10).
- Observaciones: el texto transitorio "Verificando sesión..." no se observó (dura milisegundos); el código de `PrivateRoutes` lo muestra mientras `loading` es verdadero. El navegador integrado no muestra las solicitudes de Firestore en la pestaña Red, por eso se usaron las entradas de rendimiento de la página.

---

## Caso 2: Sin sesión, las rutas de administración redirigen al inicio de sesión

**Precondiciones:** ninguna sesión iniciada (ventana privada).

**Pasos:**

1. Abrir directamente `/admin`, `/admin/usuarios`, `/admin/preguntas`, `/admin/reportes`, `/admin/simulacros`, `/admin/configuracion` y `/admin/logros`.
2. En cada una, observar la URL final y la pestaña Red.

**Resultado esperado:**

- La URL termina en `/` (inicio de sesión) en las siete rutas.
- No se renderiza el panel de administración ni se hace ninguna lectura de Firestore.

**Resultado:**

- Resultado: [x] Pasa  [ ] Falla  [ ] Bloqueado
- Fecha / Tester / Entorno: 2026-10-18 / Claude (implementador del proyecto; ejecución no independiente de QA) / Entorno R (`learnfex-dev-oscar`, cliente local Vite sobre `main` 3ac0365)
- Evidencia (captura, log o enlace): las siete rutas terminaron en `/` con el título "Iniciar sesión"; 0 solicitudes a `googleapis.com`/Firestore en cada una.
- Observaciones: ninguna salvo la nota de medición del caso 1.

---

## Caso 3: Un estudiante que abre rutas de administración es redirigido a `/inicio`

**Precondiciones:** sesión iniciada como estudiante A.

**Pasos:**

1. Escribir `/admin` en la barra de direcciones.
2. Repetir con `/admin/usuarios`, `/admin/preguntas`, `/admin/reportes`, `/admin/simulacros`, `/admin/configuracion` y `/admin/logros`.
3. En cada caso, revisar la URL final, la pantalla y la pestaña Red.
4. Pulsar "Atrás" en el navegador después de uno de los redireccionamientos.

**Resultado esperado:**

- La URL final es `/inicio` (no `/`, no `/home`: esa ruta no existe) y se ve la pantalla de inicio del estudiante.
- No se renderiza ningún componente del panel de administración ni se hace ninguna consulta a `usuarios`, `resultados` u otra colección de administración.
- "Atrás" no vuelve a la ruta de administración (el redireccionamiento reemplaza la entrada del historial).

**Resultado:**

- Resultado: [x] Pasa  [ ] Falla  [ ] Bloqueado
- Fecha / Tester / Entorno: 2026-10-18 / Claude (implementador del proyecto; ejecución no independiente de QA) / Entorno E (aplicación de `main` 3ac0365 contra el emulador local)
- Evidencia (captura, log o enlace): con A (rol `estudiante`) las siete rutas terminaron en `/inicio`, con la pantalla de inicio del estudiante y sin el texto "Panel de administración". Prueba de "Atrás": desde `/perfil` se abrió `/admin/usuarios`, la URL pasó a `/inicio` y "Atrás" volvió a `/perfil` (no a `/admin/usuarios`).
- Observaciones: no se capturó el tráfico a Firestore por colección; la guarda redirige antes de montar el panel (`AdminRoute.jsx`: `Navigate replace` antes de `Outlet`).

---

## Caso 4: El administrador accede a todas las rutas de administración

**Precondiciones:** cuenta de administrador C.

**Pasos:**

1. Iniciar sesión como C en `/`.
2. Verificar a dónde navega la aplicación.
3. Recorrer las siete secciones del panel con la navegación (Dashboard, Usuarios, Preguntas, Simulacros, Logros, Reportes, Configuración) y también escribiendo cada URL.
4. Recargar la página (F5) estando en `/admin/usuarios`.

**Resultado esperado:**

- Paso 2: tras iniciar sesión se navega a `/admin`.
- Paso 3: cada ruta abre su pantalla dentro del panel (encabezado "Panel de administración" y navegación del panel). Ninguna redirige.
- Paso 4: se ve "Verificando sesión..." y luego la misma pantalla; no se redirige.

**Resultado:**

- Resultado: [x] Pasa  [ ] Falla  [ ] Bloqueado
- Fecha / Tester / Entorno: 2026-10-18 / Claude (implementador del proyecto; ejecución no independiente de QA) / Entorno E (aplicación de `main` 3ac0365 contra el emulador local)
- Evidencia (captura, log o enlace): tras iniciar sesión como C la URL fue `/admin` con el encabezado "Panel de administración". Las siete URL (`/admin`, `/admin/usuarios`, `/admin/preguntas`, `/admin/reportes`, `/admin/simulacros`, `/admin/configuracion`, `/admin/logros`) se cargaron sin redirigir y con el panel visible. La navegación tiene los siete enlaces (Dashboard, Usuarios, Preguntas, Simulacros, Logros, Reportes, Configuración). Recarga en `/admin/usuarios`: la URL siguió en `/admin/usuarios` con la lista de usuarios.
- Observaciones: la navegación se comprobó por los siete enlaces con su `href` y por URL escrita; no se hizo clic en cada enlace. El texto transitorio "Verificando sesión..." no se observó.

---

## Caso 5: Iniciar sesión como estudiante lleva a `/inicio`

**Precondiciones:** cuenta de estudiante A, sin sesión.

**Pasos:**

1. Iniciar sesión como A.
2. Observar la URL final y la navegación disponible.

**Resultado esperado:**

- Se navega a `/inicio`. La navegación del estudiante tiene Inicio, Práctica, Estadísticas, Ranking y Perfil. No hay enlaces al panel de administración.

**Resultado:**

- Resultado: [x] Pasa  [ ] Falla  [ ] Bloqueado
- Fecha / Tester / Entorno: 2026-10-18 / Claude (implementador del proyecto; ejecución no independiente de QA) / Entorno E (aplicación de `main` 3ac0365 contra el emulador local)
- Evidencia (captura, log o enlace): URL final `/inicio`; enlaces de navegación: Inicio (`/inicio`), Práctica (`/practica`), Estadísticas (`/estadisticas`), Ranking (`/ranking`), Perfil (`/perfil`); 0 enlaces a `/admin`.
- Observaciones: ninguna.

---

## Caso 6: El administrador puede abrir las rutas del estudiante (comportamiento actual)

`PrivateRoutes` solo exige sesión, así que un administrador también entra a las pantallas del estudiante. Este caso documenta ese comportamiento; no se espera redirección.

**Precondiciones:** cuenta de administrador C con sesión iniciada.

**Pasos:**

1. Escribir `/inicio`, `/practica`, `/historial`, `/ranking` y `/perfil` en la barra de direcciones.

**Resultado esperado (comportamiento actual):**

- Las cinco pantallas se abren con normalidad (en `/perfil` también está el botón "Cerrar sesión"; el panel de administración tiene además el suyo en el encabezado). Si la especificación del producto exige separar totalmente al administrador de las pantallas del estudiante, anotarlo en Observaciones como brecha.

**Resultado:**

- Resultado: [x] Pasa  [ ] Falla  [ ] Bloqueado
- Fecha / Tester / Entorno: 2026-10-18 / Claude (implementador del proyecto; ejecución no independiente de QA) / Entorno E (aplicación de `main` 3ac0365 contra el emulador local)
- Evidencia (captura, log o enlace): con C, las cinco rutas se abrieron sin redirigir (`/inicio`, `/practica`, `/historial`, `/ranking`, `/perfil`) y `/perfil` mostró el botón "Cerrar sesión". Además, el encabezado del panel de administración tiene su propio botón "Cerrar sesión" (accesible como `button "Cerrar sesión"` en `/admin/usuarios`).
- Observaciones: el texto anterior del documento decía que el panel de administración no tenía botón de cerrar sesión; estaba desactualizado (commit `8212b28`) y se corrigió. Brecha de producto: el administrador no está separado de las pantallas del estudiante; sin tarjeta identificada, a confirmar con la especificación.

---

## Caso 7: Rutas inexistentes (comportamiento actual)

**Precondiciones:** sesión iniciada como estudiante A.

**Pasos:**

1. Escribir `/home` y luego `/ruta-que-no-existe` en la barra de direcciones.
2. Revisar la pantalla y la consola.

**Resultado esperado (comportamiento actual):**

- La pantalla queda en blanco y la consola avisa que ninguna ruta coincide. No hay página 404 ni redirección. (Brecha menor; no hay tarjeta identificada.)

**Resultado:**

- Resultado: [x] Pasa  [ ] Falla  [ ] Bloqueado
- Fecha / Tester / Entorno: 2026-10-18 / Claude (implementador del proyecto; ejecución no independiente de QA) / Entorno E (aplicación de `main` 3ac0365 contra el emulador local)
- Evidencia (captura, log o enlace): en `/home` y en `/ruta-que-no-existe` la URL no cambió, `#root` quedó vacío (0 caracteres de HTML) y la consola registró `No routes matched location "/home"` y `No routes matched location "/ruta-que-no-existe"`.
- Observaciones: la brecha (sin página 404) se confirma; sin tarjeta identificada.

---

## Caso 8: Cambio de rol desde el panel de administración

**Precondiciones:** administrador C, estudiante A y B de prueba. A tiene sesión abierta en otra ventana.

**Pasos:**

1. Como C, ir a `/admin/usuarios` y localizar a A (buscador por nombre o correo).
2. Cambiar el rol de A a "Administrador" con el selector de la fila.
3. En la sesión de A, sin recargar la página (navegación dentro de la aplicación; escribir la URL en la barra de direcciones recarga la página y equivale al paso 4), ir a `/admin`.
4. Recargar la página (F5) en la sesión de A y escribir `/admin` otra vez.
5. Como C, devolver el rol de A a "Estudiante". Recargar la sesión de A y escribir `/admin`.
6. Opcional: como C, intentar cambiar el propio rol a "Estudiante".

**Resultado esperado:**

- Paso 2: el selector queda en "Administrador" y en Firestore `usuarios/{A}.rol` es `administrador`.
- Paso 3: A sigue siendo redirigido a `/inicio` hasta recargar (el rol se carga una sola vez; comportamiento actual).
- Paso 4: tras recargar, A entra a `/admin`.
- Paso 5: tras recargar, A vuelve a ser redirigido a `/inicio`.
- Paso 6: el cambio se permite sin confirmación ni advertencia (no hay protección contra quitarse el último administrador; brecha menor, sin tarjeta identificada). Restaurar el rol de C en la consola después.

**Resultado:**

- Resultado: [x] Pasa  [ ] Falla  [ ] Bloqueado
- Fecha / Tester / Entorno: 2026-10-18 / Claude (implementador del proyecto; ejecución no independiente de QA) / Entorno E (aplicación de `main` 3ac0365 contra el emulador local; C en el puerto 5312 y A en el 5311 para tener sesiones separadas)
- Evidencia (captura, log o enlace): paso 2: el selector de A quedó en "Administrador" y una lectura REST del emulador mostró `usuarios/{A}.rol = administrador`. Paso 3: con la navegación interna sin recargar (`history.pushState` hacia `/admin`) A quedó en `/inicio`. Paso 4: tras recargar y abrir `/admin`, A vio el "Panel de administración". Paso 5: tras volver a "Estudiante" (REST: `rol = estudiante`), recargar y abrir `/admin`, A terminó en `/inicio`. Paso 6: C cambió su propio rol a "Estudiante" desde su fila, sin ningún aviso ni confirmación, y la lectura REST mostró `rol = estudiante`.
- Observaciones: se restauró el rol de C como administrador por REST del emulador (tras el cambio ya no tenía permiso para hacerlo desde la aplicación). Se confirma la brecha menor del paso 6 (sin tarjeta identificada). El paso 3 solo es válido como navegación interna: la recarga que implica escribir la URL vuelve a leer el rol.

---

# Parte 2: control de acceso a los datos (`firestore.rules`)

En las tablas: A y B son estudiantes, C es administrador y "Sin sesión" es una solicitud no autenticada. "Propio" es un documento del mismo UID que el actor.

Convención de evidencia de esta ejecución: salvo que se indique otra cosa, las filas se ejecutaron en el Entorno E con el SDK web (un cliente por rol); las filas "Sin sesión" se ejecutaron además en el Entorno R (`learnfex-dev-oscar`) con el mismo resultado. Un resultado `permission-denied` es el código de error del SDK de Firestore.

## Caso 9: Colección `usuarios`

| # | Operación | Actor | Esperado (correcto) | Hoy | Resultado |
| - | --------- | ----- | ------------------- | --- | --------- |
| 1 | `get` de `usuarios/{A}` | A | Permitido | Igual | [x] Pasa  [ ] Falla |
| 2 | `get` de `usuarios/{B}` | A | Denegado | Igual | [x] Pasa  [ ] Falla |
| 3 | `list` de `usuarios` | A | Denegado | Igual | [x] Pasa  [ ] Falla |
| 4 | `get` y `list` de `usuarios` | Sin sesión | Denegado | Igual | [x] Pasa  [ ] Falla |
| 5 | `get` y `list` de `usuarios` | C | Permitido (la pantalla Usuarios lista a todos) | Igual | [x] Pasa  [ ] Falla |
| 6 | `update` de `usuarios/{B}` cambiando `nombre` | A | Denegado | Igual | [x] Pasa  [ ] Falla |
| 7 | `update` de `usuarios/{A}` cambiando solo `nombre`, `apellido` o `colegio` | A | Permitido | Igual | [x] Pasa  [ ] Falla |
| 8 | `update` de `usuarios/{A}` cambiando `rol`, `estado` o `correo` | A | Denegado | Igual | [x] Pasa  [ ] Falla |
| 9 | `update` de `usuarios/{B}` cambiando `rol` y `estado` | C | Permitido (pantalla Usuarios) | Igual | [x] Pasa  [ ] Falla |
| 10 | `create` de `usuarios/{uidNuevo}` con `rol: estudiante`, `estado: activo`, `xp: 0`, `nivel: 1`, autenticado como `uidNuevo` | uidNuevo | Permitido (registro) | Igual | [x] Pasa  [ ] Falla |
| 11 | `create` de `usuarios/{uidNuevo}` con `rol: administrador`, autenticado como `uidNuevo` | uidNuevo | Denegado | Igual | [x] Pasa  [ ] Falla |
| 12 | `create` de `usuarios/{otroUid}` | A | Denegado | Igual | [x] Pasa  [ ] Falla |
| 13 | `delete` de `usuarios/{A}` | A | Denegado | Igual | [x] Pasa  [ ] Falla |
| 14 | `delete` de `usuarios/{B}` | C | Denegado (nadie puede borrar usuarios) | Igual | [x] Pasa  [ ] Falla |
| 15 | `update` de `usuarios/{A}` subiendo `xp` o `nivel` | A | Denegado | Igual: denegado desde el despliegue de la tarjeta 6-36 (antes se permitía `xp` hasta +100 por escritura y `nivel` a cualquier valor mayor) | [x] Pasa  [ ] Falla |

Para la fila 15, los casos 16 y 17 de `docs/qa/casos-prueba-gamificacion.md` describen los límites anteriores al despliegue de 6-36 y pueden estar desactualizados; no se revisaron en esta ejecución.

- Fecha / Tester / Entorno: 2026-10-18 / Claude (implementador del proyecto; ejecución no independiente de QA) / Entorno E (emulador local con `firestore.rules` de `main` 3ac0365); fila 4 también en Entorno R
- Evidencia (captura, resultado del simulador o enlace): fila 1: permitido. Filas 2, 3 y 4: `permission-denied` (la fila 4 también `permission-denied` en `learnfex-dev-oscar` para `get` y `list`). Fila 5: `get` y `list` permitidos. Fila 6: `permission-denied`. Fila 7: `nombre`, `apellido` y `colegio` permitidos, cada uno por separado. Fila 8: `rol`, `estado` y `correo` `permission-denied`, cada uno por separado. Fila 9: permitido (B pasó a `administrador` e `inactivo` y se restauró). Fila 10: permitido. Fila 11: `permission-denied` (se ejecutó antes que la 10, con el mismo UID). Filas 12, 13 y 14: `permission-denied`. Fila 15: `xp: 50`, `nivel: 2` y `xp: 100` con `nivel: 3`, los tres `permission-denied`.
- Observaciones: sin diferencias respecto de lo esperado.

---

## Caso 10: Subcolección `usuarios/{uid}/logrosObtenidos`

| # | Operación | Actor | Esperado (correcto) | Hoy | Resultado |
| - | --------- | ----- | ------------------- | --- | --------- |
| 1 | `get` y `list` de `usuarios/{A}/logrosObtenidos` | A | Permitido (pantalla Logros) | Igual | [x] Pasa  [ ] Falla |
| 2 | `get` y `list` de `usuarios/{B}/logrosObtenidos` | A | Denegado | Igual | [x] Pasa  [ ] Falla |
| 3 | `get` y `list` de `usuarios/{B}/logrosObtenidos` | C | Permitido | Igual | [x] Pasa  [ ] Falla |
| 4 | `get` y `list` | Sin sesión | Denegado | Igual | [x] Pasa  [ ] Falla |
| 5 | `create` de `usuarios/{A}/logrosObtenidos/diez_simulacros` | A | Denegado (solo la función otorga logros) | Igual: denegado desde el despliegue de la tarjeta 6-36 (antes se permitía) | [x] Pasa  [ ] Falla |
| 6 | `create` de `usuarios/{B}/logrosObtenidos/x` | A | Denegado | Igual | [x] Pasa  [ ] Falla |
| 7 | `update` o `delete` de un logro obtenido | A o C | Denegado | Igual | [x] Pasa  [ ] Falla |

- Fecha / Tester / Entorno: 2026-10-18 / Claude (implementador del proyecto; ejecución no independiente de QA) / Entorno E (emulador local con `firestore.rules` de `main` 3ac0365); fila 4 también en Entorno R
- Evidencia (captura, resultado del simulador o enlace): fila 1: `get` y `list` permitidos. Fila 2: `permission-denied` en ambos. Fila 3: permitidos. Fila 4: `permission-denied` en ambos (también en `learnfex-dev-oscar`). Fila 5: `permission-denied`. Fila 6: `permission-denied`. Fila 7: `update` y `delete` de A y de C, los cuatro `permission-denied`.
- Observaciones: sin diferencias respecto de lo esperado.

---

## Caso 11: Catálogos `areas`, `preguntas`, `logros` y `configuracion`

Repetir cada fila para cada una de las cuatro colecciones (para `configuracion` usar el documento `configuracion/general`). Resultado esperado igual en las cuatro.

| # | Operación | Actor | Esperado (correcto) | Hoy | Resultado |
| - | --------- | ----- | ------------------- | --- | --------- |
| 1 | `get` y `list` | A | Permitido | Igual | [x] Pasa  [ ] Falla |
| 2 | `get` y `list` | Sin sesión | Denegado | Igual | [x] Pasa  [ ] Falla |
| 3 | `create`, `update` y `delete` | A | Denegado | Igual | [x] Pasa  [ ] Falla |
| 4 | `create`, `update` y `delete` | C | Permitido | Igual | [x] Pasa  [ ] Falla |

Desde la interfaz, como C: crear, editar y eliminar una pregunta en `/admin/preguntas`; crear un logro en `/admin/logros`; guardar cambios en `/admin/configuracion`. Todo debe funcionar. (Las áreas no tienen pantalla de administración: se gestionan por seed o consola.)

Observación para registrar (no cambia el resultado de las filas): la fila 1 sobre `preguntas` permite que cualquier estudiante lea el campo `respuestaCorrecta` (y `explicacion`) de todas las preguntas antes de hacer una prueba. Hoy la pantalla de retroalimentación lee esos campos directamente de `preguntas`. Es una brecha de diseño; la cubre la tarjeta [Sprint 7 - 04] (decisión sobre quién puede leer la respuesta correcta).

- Fecha / Tester / Entorno: 2026-10-18 / Claude (implementador del proyecto; ejecución no independiente de QA) / Entorno E (emulador local con `firestore.rules` de `main` 3ac0365); fila 2 también en Entorno R
- Evidencia (captura, resultado del simulador o enlace): en las cuatro colecciones: fila 1 `get` y `list` permitidos; fila 2 `permission-denied` en `get` y `list` (también en `learnfex-dev-oscar`, incluido `configuracion/general`); fila 3 `create`, `update` y `delete` de A, los tres `permission-denied`; fila 4 `create`, `update` y `delete` de C permitidos (sobre documentos `qa-rbac-*` y, en el emulador, `configuracion/general`). Observación de `preguntas`: A leyó un documento y los campos `respuestaCorrecta` y `explicacion` estaban presentes.
- Observaciones: la comprobación "desde la interfaz como C" (crear, editar y eliminar una pregunta, crear un logro, guardar la configuración) no se ejecutó por pantalla: se ejecutaron las operaciones equivalentes de Firestore con el SDK. La brecha de `respuestaCorrecta` se confirma (tarjeta [Sprint 7 - 04]).

---

## Caso 12: Colección `cuestionarios`

| # | Operación | Actor | Esperado (correcto) | Hoy | Resultado |
| - | --------- | ----- | ------------------- | --- | --------- |
| 1 | `get` y `list` | A | Permitido | Igual | [x] Pasa  [ ] Falla |
| 2 | `get` y `list` | Sin sesión | Denegado | Igual | [x] Pasa  [ ] Falla |
| 3 | `create` de un cuestionario | A | Permitido (hoy el cliente arma el cuestionario al iniciar una prueba) | Igual | [x] Pasa  [ ] Falla |
| 4 | `update` y `delete` | A | Denegado | Igual | [x] Pasa  [ ] Falla |
| 5 | `update` (por ejemplo `estado: inactivo`) | C | Permitido | Igual | [x] Pasa  [ ] Falla |

Observación: la fila 3 permite que cualquier usuario con sesión cree cuestionarios con el contenido que quiera; no se valida su forma ni su tamaño. Es consecuencia de que el cliente los crea; la cubre la tarjeta [Sprint 7 - 03].

- Fecha / Tester / Entorno: 2026-10-18 / Claude (implementador del proyecto; ejecución no independiente de QA) / Entorno E (emulador local con `firestore.rules` de `main` 3ac0365); fila 2 también en Entorno R
- Evidencia (captura, resultado del simulador o enlace): fila 1: `get` y `list` permitidos. Fila 2: `permission-denied` en ambos (también en `learnfex-dev-oscar`). Fila 3: `create` con la forma que arma la app permitido. Fila 4: `update` y `delete` `permission-denied`. Fila 5: permitido. Observación: A creó un cuestionario con 20 KB de texto arbitrario y `preguntas` con un valor que no es una lista, y el `create` fue permitido.
- Observaciones: se confirma la falta de validación del contenido (falla conocida de diseño, tarjeta [Sprint 7 - 03]; no cambia el resultado de la fila 3).

---

## Caso 13: Colección `resultados` y su subcolección `respuestas`

Preparación: A y B tienen al menos un resultado cada uno (`resultados/{cuestionarioId}_{uid}`; anotar los IDs).

| # | Operación | Actor | Esperado (correcto) | Hoy | Resultado |
| - | --------- | ----- | ------------------- | --- | --------- |
| 1 | Abrir en la app `/resultados/{idDeA}` | A | Se ve el resultado | Igual | [x] Pasa  [ ] Falla |
| 2 | `get` de `resultados/{idDeB}` (en la app: abrir `/resultados/{idDeB}`) | A | Denegado; la pantalla muestra "Ocurrió un error" y "No se pudo cargar el resultado." | Igual | [x] Pasa  [ ] Falla |
| 3 | En la app, abrir `/resultados/{idDeB}/retroalimentacion` | A | Denegado; la pantalla muestra "No se pudo cargar la retroalimentación." | Igual | [x] Pasa  [ ] Falla |
| 4 | `list` de `resultados` con filtro `usuarioId == A` (las pantallas Estadísticas e Historial; esta consulta además ordena por `fecha` y necesita el índice compuesto de `firestore.indexes.json`, que el emulador no exige) | A | Permitido | Igual | [x] Pasa  [ ] Falla |
| 5 | `list` de `resultados` sin filtro | A | Denegado | Igual | [x] Pasa  [ ] Falla |
| 6 | `get` y `list` de `resultados/{idDeB}/respuestas` filtrando por `usuarioId == B` | A | Denegado | Igual | [x] Pasa  [ ] Falla |
| 7 | `get` y `list` de `resultados/{idDeA}/respuestas` filtrando por `usuarioId == A` | A | Permitido | Igual | [x] Pasa  [ ] Falla |
| 8 | `create` de `resultados/x` con `usuarioId == A` | A | Denegado (solo la función crea resultados) | Igual: denegado desde el despliegue de la tarjeta 6-36 (antes se permitía) | [x] Pasa  [ ] Falla |
| 9 | `create` de `resultados/x/respuestas/y` con `usuarioId == A` | A | Denegado | Igual: denegado desde el despliegue de la tarjeta 6-36 (antes se permitía) | [x] Pasa  [ ] Falla |
| 10 | `create` de `resultados/x` con `usuarioId == B` | A | Denegado | Igual | [x] Pasa  [ ] Falla |
| 11 | `update` y `delete` de cualquier resultado o respuesta | A o C | Denegado | Igual | [x] Pasa  [ ] Falla |
| 12 | `get` y `list` de todos los resultados | C | Permitido (Dashboard y Reportes) | Igual | [x] Pasa  [ ] Falla |
| 13 | En la app, abrir `/resultados/{idDeA}` | C | Las reglas permiten leerlo, pero la pantalla muestra "No tienes permiso para ver este resultado." (comprobación del cliente, `Results.jsx`) | Igual | [x] Pasa  [ ] Falla |
| 14 | `get` y `list` | Sin sesión | Denegado | Igual | [x] Pasa  [ ] Falla |

- Fecha / Tester / Entorno: 2026-10-18 / Claude (implementador del proyecto; ejecución no independiente de QA) / Entorno E (emulador local con `firestore.rules` de `main` 3ac0365; filas 1, 2, 3 y 13 en la aplicación y el resto con el SDK); fila 14 también en Entorno R
- Evidencia (captura, resultado del simulador o enlace): fila 1: la pantalla mostró "80%", "Aprobado" y "Tu resultado". Fila 2: la pantalla mostró "Ocurrió un error" y "No se pudo cargar el resultado.". Fila 3: la pantalla mostró "No se pudo cargar la retroalimentación.". Fila 4: permitido. Fila 5: `permission-denied`. Fila 6: `get` y `list` `permission-denied`. Fila 7: `get` y `list` permitidos. Filas 8, 9 y 10: `permission-denied`. Fila 11: `update` y `delete` de resultado y de respuesta, con A y con C, los ocho `permission-denied`. Fila 12: `get` y `list` permitidos. Fila 13: la pantalla mostró "Ocurrió un error" y "No tienes permiso para ver este resultado.". Fila 14: `permission-denied` en `get` y `list` de `resultados` y de `respuestas` (también en `learnfex-dev-oscar`).
- Observaciones: en la fila 4 se usó `orderBy("fecha", "desc")` como la app; el índice compuesto de `firestore.indexes.json` no se pudo verificar porque el emulador no lo exige y no se consultó con sesión en el proyecto real.

---

## Caso 14: Colección `ranking`

| # | Operación | Actor | Esperado (correcto) | Hoy | Resultado |
| - | --------- | ----- | ------------------- | --- | --------- |
| 1 | `get` y `list` (la pantalla Ranking) | A | Permitido | Igual | [x] Pasa  [ ] Falla |
| 2 | `get` y `list` | Sin sesión | Denegado | Igual | [x] Pasa  [ ] Falla |
| 3 | `set` de `ranking/{A}` con `puntajeAcumulado: 999999` | A | Denegado (el ranking lo escribe la función desde el servidor) | Permitido (confirmado). Falla conocida: la cubre la tarjeta [Sprint 7 - 02] (la tarjeta 6-36 no incluye el bloque `ranking`) | [ ] Pasa  [x] Falla |
| 4 | `delete` de `ranking/{A}` | A | Denegado | Permitido (confirmado; la regla es `write`). Falla conocida, mismo tratamiento que la fila 3 (tarjeta [Sprint 7 - 02]) | [ ] Pasa  [x] Falla |
| 5 | `set` de `ranking/{B}` | A | Denegado | Igual | [x] Pasa  [ ] Falla |
| 6 | `set` de `ranking/{B}` | C | Permitido | Igual | [x] Pasa  [ ] Falla |

- Fecha / Tester / Entorno: 2026-10-18 / Claude (implementador del proyecto; ejecución no independiente de QA) / Entorno E (emulador local con `firestore.rules` de `main` 3ac0365); fila 2 también en Entorno R
- Evidencia (captura, resultado del simulador o enlace): fila 1: `get` y `list` permitidos. Fila 2: `permission-denied` (también en `learnfex-dev-oscar`). Fila 3: el `setDoc` de A sobre `ranking/{A}` con `puntajeAcumulado: 999999` fue permitido y una lectura posterior devolvió `999999`. Fila 4: el `deleteDoc` de A sobre `ranking/{A}` fue permitido. Fila 5: `permission-denied`. Fila 6: permitido.
- Observaciones: filas 3 y 4: falla conocida exactamente como indica "Hoy"; no se abre un defecto nuevo. Deben pasar al cerrar [Sprint 7 - 02].

---

## Caso 15: Colección `estadisticas_progreso`

Los IDs que usa la app son `{usuarioId}_{areaId}` (por ejemplo `{A}_matematicas`). La pantalla Estadísticas escribe estos documentos desde el cliente.

| # | Operación | Actor | Esperado (correcto) | Hoy | Resultado |
| - | --------- | ----- | ------------------- | --- | --------- |
| 1 | `list` con filtro `usuarioId == A` | A | Permitido | Igual | [x] Pasa  [ ] Falla |
| 2 | `get` o `list` de documentos con `usuarioId == B` | A | Denegado | Igual | [x] Pasa  [ ] Falla |
| 3 | `set` de `{A}_matematicas` con `usuarioId: A` | A | Permitido (lo hace la app al abrir Estadísticas) | Igual | [x] Pasa  [ ] Falla |
| 4 | `set` de `{A}_matematicas` con `usuarioId: B` | A | Denegado | Igual | [x] Pasa  [ ] Falla |
| 5 | `set` de `{B}_matematicas` (documento de B) con `usuarioId: A` | A | Denegado (no se puede pisar ni tomar el documento de otro) | Permitido (confirmado): la regla solo mira el `usuarioId` del documento nuevo, no el dueño del existente. Falla conocida: la cubre la tarjeta [Sprint 7 - 01] | [ ] Pasa  [x] Falla |
| 6 | `get` y `list` | C | Permitido | Igual | [x] Pasa  [ ] Falla |
| 7 | `get` y `list` | Sin sesión | Denegado | Igual | [x] Pasa  [ ] Falla |

La fila 5 es una brecha de las reglas que no figuraba en la tarjeta 6-36: la cubre la tarjeta [Sprint 7 - 01] (impedir escribir las estadísticas de otro usuario).

- Fecha / Tester / Entorno: 2026-10-18 / Claude (implementador del proyecto; ejecución no independiente de QA) / Entorno E (emulador local con `firestore.rules` de `main` 3ac0365); fila 7 también en Entorno R
- Evidencia (captura, resultado del simulador o enlace): fila 1: permitido. Fila 2: `get` del documento de B y `list` con `usuarioId == B`, ambos `permission-denied`. Fila 3: permitido (con `merge`). Fila 4: `permission-denied`. Fila 5: el `setDoc` de A sobre `{B}_matematicas` con `usuarioId: A` fue permitido y el documento de B quedó con `usuarioId` igual al UID de A. Fila 6: `get` y `list` permitidos. Fila 7: `get` y `list` (con y sin filtro) `permission-denied` (también en `learnfex-dev-oscar`).
- Observaciones: fila 5: falla conocida, exactamente como indica "Hoy" (se ejecutó la última de la tabla para no contaminar las demás). Debe pasar al cerrar [Sprint 7 - 01].

---

## Caso 16: Colección `estadisticas_plataforma`

| # | Operación | Actor | Esperado (correcto) | Hoy | Resultado |
| - | --------- | ----- | ------------------- | --- | --------- |
| 1 | `get` y `list` | C | Permitido | Igual | [x] Pasa  [ ] Falla |
| 2 | `get` y `list` | A | Denegado | Igual | [x] Pasa  [ ] Falla |
| 3 | `update` y `delete` | A o C | Denegado | Igual | [x] Pasa  [ ] Falla |
| 4 | `create` de cualquier documento | A | Denegado (solo debería escribirlo el administrador o el servidor) | Permitido (confirmado): la regla acepta `create` de cualquier usuario con sesión. Falla conocida: la cubre la tarjeta [Sprint 7 - 03] | [ ] Pasa  [x] Falla |

La colección no se usa en el código actual (el panel calcula las estadísticas leyendo `usuarios` y `resultados`). La fila 4 es una brecha menor que cubre la tarjeta [Sprint 7 - 03] (validar la creación de cuestionarios y cerrar `estadisticas_plataforma`).

- Fecha / Tester / Entorno: 2026-10-18 / Claude (implementador del proyecto; ejecución no independiente de QA) / Entorno E (emulador local con `firestore.rules` de `main` 3ac0365)
- Evidencia (captura, resultado del simulador o enlace): fila 1: `get` y `list` de C permitidos. Fila 2: `permission-denied` en ambos. Fila 3: `update` y `delete` de A y de C, los cuatro `permission-denied`. Fila 4: el `create` de A fue permitido.
- Observaciones: fila 4: falla conocida, exactamente como indica "Hoy". Complemento en `learnfex-dev-oscar` (Entorno R): sin sesión, `get`, `list` y `create` sobre `estadisticas_plataforma` dieron `permission-denied`.

---

## Caso 17: Colecciones no declaradas en las reglas

**Precondiciones:** simulador o emulador.

**Pasos:**

1. Probar `get`, `list`, `create`, `update` y `delete` sobre una colección que no existe en las reglas (por ejemplo `prueba_qa/doc1`) con los actores A, C y Sin sesión.

**Resultado esperado:**

- Todas las operaciones son denegadas para todos los actores, incluido el administrador (las reglas niegan por defecto lo que no declaran).

**Resultado:**

- Resultado: [x] Pasa  [ ] Falla  [ ] Bloqueado
- Fecha / Tester / Entorno: 2026-10-18 / Claude (implementador del proyecto; ejecución no independiente de QA) / Entorno E (emulador local con `firestore.rules` de `main` 3ac0365); Sin sesión también en Entorno R
- Evidencia (captura, log o enlace): sobre `prueba_qa` con A, con C (administrador) y sin sesión, las cinco operaciones (`get`, `list`, `create`, `update`, `delete`) dieron `permission-denied` (15 de 15). Sin sesión en `learnfex-dev-oscar`: las cinco operaciones sobre `prueba_qa/qa-rbac-*` también `permission-denied`; la colección sigue con 0 documentos.
- Observaciones: ninguna.

---

## Caso 18: Una cuenta desactivada no debería poder usar la aplicación

La ERS (RF-020) pide que el administrador pueda deshabilitar una cuenta "restringiendo su acceso". En `main` el campo `estado` solo se muestra y se cambia desde `/admin/usuarios`; ni el inicio de sesión, ni las rutas, ni `firestore.rules` lo consultan.

**Estado conocido: esperado a fallar. Lo cubren las tarjetas [Sprint 7 - 05] [01] (pantalla: no dejar entrar a un inactivo) y [Sprint 7 - 05] [02] (reglas: un inactivo no lee ni escribe datos).**

**Precondiciones:** administrador C y estudiante B de prueba. B tiene sesión abierta en otra ventana.

**Pasos:**

1. Como C, ir a `/admin/usuarios`, pulsar "Desactivar" sobre B y confirmar. Verificar que `usuarios/{B}.estado` pasa a `inactivo` y que la fila muestra "Inactivo".
2. En la sesión abierta de B, recargar y navegar por `/inicio`, `/practica` y empezar un cuestionario.
3. Cerrar la sesión de B (ventana privada nueva) y volver a iniciar sesión con B.
4. Como C, reactivar a B ("Activar") para dejar los datos como estaban.

**Resultado esperado (correcto):** B no puede iniciar sesión ni seguir usando la aplicación mientras su cuenta esté desactivada.

**Comportamiento actual conocido:** B puede iniciar sesión y usar la aplicación con normalidad; la desactivación no tiene efecto sobre el acceso.

**Resultado:**

- Resultado: [ ] Pasa  [x] Falla  [ ] Bloqueado
- Fecha / Tester / Entorno: 2026-10-18 / Claude (implementador del proyecto; ejecución no independiente de QA) / Entorno E (aplicación de `main` 3ac0365 contra el emulador local; C en el puerto 5312 y B en el 5313)
- Evidencia (captura, log o enlace): paso 1: tras confirmar ("¿Deseas desactivar la cuenta de qa-rbac-mverz52n B QA?"), la fila mostró "Inactivo" y la lectura REST del emulador devolvió `estado = inactivo`. Paso 2: B recargó y siguió viendo `/inicio` ("¡Hola, qa-rbac-mverz52n B!") y `/practica` con normalidad. No se pudo empezar un cuestionario por pantalla (el área del seed del emulador tiene 0 preguntas); en su lugar, con el SDK, un usuario con `estado: inactivo` (D) hizo `get` de su documento, `list` de `preguntas` y de `ranking`, `create` de un cuestionario y `update` de su `nombre`, todo permitido. Paso 3: B cerró sesión desde Perfil, volvió a iniciar sesión y la aplicación lo llevó a `/inicio`. Paso 4: tras "Activar", `estado = activo`.
- Observaciones: falla conocida, exactamente como indica "Comportamiento actual conocido"; no se abre un defecto nuevo. Los botones "Desactivar" y "Activar" usan `window.confirm`; el navegador integrado no mostró el diálogo, así que se reemplazó `window.confirm` por una función que devuelve verdadero desde la consola de la página (sin cambios en el código del repositorio).

---

## Brechas detectadas al derivar los casos de las reglas

Estas son consecuencia directa del código actual de `firestore.rules` y de la aplicación. La ejecución del 2026-10-18 confirmó las que se indican; ninguna de las confirmadas carece de tarjeta.

1. XP, nivel, `resultados`, `respuestas` y `logrosObtenidos`: cerradas por el despliegue de la tarjeta 6-36 (los casos 9.15, 10.5, 13.8 y 13.9 pasan). `ranking` sigue escribible desde el cliente (casos 14.3 y 14.4, confirmado): tarjeta [Sprint 7 - 02].
2. `estadisticas_progreso`: se puede escribir sobre el documento de otro usuario si el documento nuevo lleva el propio `usuarioId` (caso 15, fila 5, confirmado): tarjeta [Sprint 7 - 01].
3. `preguntas` expone `respuestaCorrecta` a cualquier estudiante (caso 11, confirmado): tarjeta [Sprint 7 - 04].
4. `cuestionarios` y `estadisticas_plataforma` aceptan `create` de cualquier usuario con sesión sin validar contenido (casos 12 y 16, confirmado): tarjeta [Sprint 7 - 03].
5. `estado: inactivo` no restringe el acceso (caso 18, confirmado): tarjetas [Sprint 7 - 05] [01] y [02].
6. No hay página 404 (caso 7, confirmado; sin tarjeta identificada). El administrador no está separado de las pantallas del estudiante (caso 6, comportamiento actual, a confirmar con la especificación) y puede quitarse a sí mismo el rol de administrador sin aviso (caso 8, paso 6, confirmado; sin tarjeta identificada). El botón de cerrar sesión del panel de administración ya existe (se corrigió el texto anterior que decía lo contrario).

## Notas finales

- Ejecutar los casos de rutas con `npm run dev` y la consola del navegador abierta.
- Los casos de datos se pueden ejecutar todos en el simulador de reglas; los que dicen "en la app" se pueden comprobar también desde la interfaz.
- Las filas que antes decían "esperado a fallar hasta la tarjeta 6-36" (9.15, 10.5, 13.8 y 13.9) pasan desde el despliegue de [Sprint 6 - 36]. Las filas con falla conocida que quedan (14.3, 14.4, 15.5, 16.4 y el caso 18) deben pasar cuando se cierren las tarjetas de Sprint 7 indicadas; volver a ejecutarlas entonces.
- Documentos relacionados en `docs/qa/`: `casos-prueba-gamificacion.md` (manipulación de XP, nivel y logros) y `integracion-end-to-end.md` (recorrido completo de estudiante y administrador).

## Resumen de ejecución

Ejecución del 2026-10-18, 72 verificaciones (8 casos de rutas, 62 filas de las tablas de los casos 9 a 16, el caso 17 y el caso 18):

| Resultado | Cantidad |
| --------- | -------- |
| Pasa | 67 |
| Falla | 5 |
| No ejecutado / Bloqueado | 0 |

Fallas (todas conocidas; ninguna es un defecto nuevo):

| Caso | Qué falla | Error observado | Tarjeta |
| ---- | --------- | --------------- | ------- |
| 14, fila 3 | A escribe `ranking/{A}` con `puntajeAcumulado: 999999` | permitido (se leyó `999999`) | [Sprint 7 - 02] |
| 14, fila 4 | A borra `ranking/{A}` | permitido | [Sprint 7 - 02] |
| 15, fila 5 | A escribe el documento `{B}_matematicas` con `usuarioId: A` | permitido; el documento de B quedó a nombre de A | [Sprint 7 - 01] |
| 16, fila 4 | A crea un documento en `estadisticas_plataforma` | permitido | [Sprint 7 - 03] |
| 18 | Un usuario `inactivo` inicia sesión y usa la aplicación y los datos | sin restricción en pantalla ni en reglas | [Sprint 7 - 05] [01] y [02] |

Observaciones que no cambian ninguna fila: `preguntas` expone `respuestaCorrecta` y `explicacion` a un estudiante (caso 11, tarjeta [Sprint 7 - 04]); `cuestionarios` acepta contenido arbitrario de 20 KB (caso 12, tarjeta [Sprint 7 - 03]).

Brechas nuevas no cubiertas por ninguna tarjeta: ninguna de las reglas de Firestore. Siguen sin tarjeta identificada las brechas menores de producto ya anotadas: no hay página 404 (caso 7), el administrador no está separado de las pantallas del estudiante (caso 6) y puede quitarse a sí mismo el rol sin aviso (caso 8, paso 6).

Textos obsoletos corregidos: las columnas "Hoy" y las notas "esperado a fallar hasta la tarjeta 6-36" de los casos 9.15, 10.5, 13.8 y 13.9 (las reglas ya están desplegadas y esos casos pasan); el resumen de reglas de usuarios, logros y resultados; la afirmación de que el panel de administración no tiene botón de cerrar sesión (casos 6 y brechas); el paso 3 del caso 8 (escribir la URL recarga la página); el commit verificado y el estado del documento.

Limitaciones de esta ejecución: lo que requiere sesión se ejecutó en el emulador local y no en `learnfex-dev-oscar` (ver "Datos de la ejecución"); el emulador no exige el índice compuesto del caso 13, fila 4; no se hizo clic en cada enlace de la navegación del caso 4; la comprobación por pantalla de los CRUD del caso 11 no se ejecutó (se hicieron las operaciones equivalentes con el SDK); el texto transitorio "Verificando sesión..." no se observó.

---

## Actualización posterior (2026-10-19)

Esta sección se agregó después de la ejecución del 2026-10-18 y no cambia ninguno de los resultados registrados arriba. **Las filas que figuran como Falla (14.3, 14.4, 15.5, 16.4 y el caso 18) NO se volvieron a ejecutar y siguen figurando como Falla hasta que alguien las re-ejecute.** Aquí solo se anota qué corrección ya está mergeada en `main` y qué conviene agregar a la próxima ejecución. Verificado contra `main` `99a359d`.

### Casos fallidos con corrección mergeada y desplegada

Las correcciones están mergeadas en `main` (PR #93, #101 y #108). Según informó el equipo, también están desplegadas; ese dato no se puede comprobar desde el repositorio y no se verificó.

| Caso / fila | Qué fallaba (2026-10-18) | Corrección en `main` | Dónde se ve en el código |
| ----------- | ------------------------ | -------------------- | ------------------------ |
| 14.3 y 14.4 | A escribía y borraba `ranking/{A}` | `ranking` con `allow write: if false`: solo escribe la función (PR #93, commit `0ee25a9`) | `firestore.rules:130-134` |
| 15.5 | A pisaba el documento `{B}_matematicas` | `estadisticas_progreso` exige que el ID empiece por el UID de quien escribe (PR #93, commit `f96820d`) | `firestore.rules:136-147` |
| 16.4 | A creaba documentos en `estadisticas_plataforma` | `estadisticas_plataforma` con `allow write: if false` (PR #93, commit `bec7a57`) | `firestore.rules:154-158` |
| 18 | Una cuenta `inactivo` seguía usando la aplicación y los datos | Cliente: cierra la sesión y avisa (PR #101, commit `4c58469`). Reglas: lista blanca `estaActivo()` (PR #108, commits `a475330` y `ca6d868`) | `src/context/AuthContext.jsx:22-28`, `src/pages/auth/Login/Login.jsx:53-57`, `firestore.rules:16-24` |

Sigue abierto y no cambió: `preguntas` expone `respuestaCorrecta` y `explicacion` (observación del caso 11, tarjeta [Sprint 7 - 04], pendiente de decisión). Del caso 18, además, siguen sin tratarse la función `calificarPrueba` (acepta pruebas de una cuenta inactiva) y la cuenta de Authentication (no se deshabilita); ver la sección 12 de `docs/manual-tecnico.md`.

### Otras afirmaciones de este documento que ya no describen el código

Estas filas están registradas como Pasa o como brecha en su momento. No se tocaron; se anotan aquí para que quien re-ejecute sepa qué esperar.

| Dónde | Lo que dice el registro | Qué hace el código hoy |
| ----- | ----------------------- | ---------------------- |
| Caso 7 | Una URL inexistente deja la pantalla en blanco, sin 404 | Muestra la página "Página no encontrada" con el enlace "Volver al inicio" (PR #105; `src/routes/AppRoutes.jsx:89`, `src/pages/NotFound/NotFound.jsx`) |
| Caso 8, paso 6 y brecha 6 | C cambia su propio rol a Estudiante sin aviso | La fila propia tiene el selector y el botón de estado deshabilitados y `handleRol` muestra "No podés cambiar tu propio rol..." (PR #106; `src/pages/admin/Users/Users.jsx:120-124`). Las reglas también lo niegan (PR #108; `firestore.rules:84`) |
| Caso 9, fila 10 | `create` de `usuarios/{uidNuevo}` con `rol`, `estado`, `xp` y `nivel` válidos queda permitido | Además exige `consentimientoDatos == true` y `fechaConsentimiento == request.time` (PR #87; `firestore.rules:73-79`); sin esos campos se deniega |
| Caso 9, fila 9 | C actualiza `rol` y `estado` de B (permitido) | Sigue permitido sobre documentos ajenos. Sobre su propio documento, C solo puede cambiar `nombre`, `apellido` y `colegio` |
| Caso 12, fila 3 y observación | A crea un cuestionario con 20 KB de texto y `preguntas` que no es una lista, y el `create` se permite | `create` solo se permite con la forma de `esCuestionarioValido` (título de hasta 120 caracteres, `preguntas` lista de 1 a 100 elementos, `estado: activo`, `fechaCreacion == request.time`; `firestore.rules:50-65` y `106-110`). Sigue sin límite de cantidad |
| Rutas públicas ("Cómo funciona hoy") | `/`, `/registro`, `/recuperar-contrasena` | Se suma `/privacidad`, también pública (`src/routes/AppRoutes.jsx:45`) |
| "Brechas detectadas al derivar los casos de las reglas", puntos 1 a 6 | Seis brechas abiertas o confirmadas | Corregidas en `main`: `ranking` (1), `estadisticas_progreso` (2), la forma de `cuestionarios` y `estadisticas_plataforma` (4, sin límite de cantidad de cuestionarios), usuarios inactivos en cliente y reglas (5), página 404 y autoprotección del administrador (6). Siguen abiertas: `preguntas` expone `respuestaCorrecta` (3) y el administrador sigue sin estar separado de las pantallas del estudiante (6, a confirmar con la especificación) |
| Perfil cargado una sola vez (caso 8, paso 3) | El rol se carga una sola vez | Además se vuelve a leer el perfil al abrir una pantalla de resultados (`refreshProfile`, PR #97); el paso 3 sigue siendo válido porque no pasa por Resultados |

### Casos nuevos que conviene agregar a la próxima ejecución

1. Estado inválido (lista blanca): como C, poner `estado` de B en `"Inactivo"`, `"suspendido"`, `""` y `null`, y comprobar que B queda bloqueado en las reglas (todo `permission-denied` salvo leer su propio `usuarios/{B}`) y que el cliente solo cierra la sesión con el valor exacto `"inactivo"`. Comprobar también que un usuario sin campo `estado` y uno sin documento en `usuarios` cuentan como activos.
2. Usuario inactivo en detalle: con `estado: "inactivo"`, `get` de su propio documento permitido; `get` y `list` de `areas`, `preguntas`, `ranking`, `cuestionarios` y `resultados`, `create` de cuestionario y `update` de su perfil, todos denegados. Un administrador inactivo no puede leer `usuarios/{otro}` ni escribir catálogos.
3. Administrador sobre su propio documento: `update` de `rol` o `estado` en `usuarios/{C}` denegado; `update` de `nombre`, `apellido` o `colegio` permitido; sobre `usuarios/{B}` permitido. Desde la pantalla Usuarios, la fila propia debe verse con el selector y el botón deshabilitados.
4. Consentimiento obligatorio: `create` de `usuarios/{uidNuevo}` sin `consentimientoDatos`, con `consentimientoDatos: false`, sin `fechaConsentimiento` y con una fecha enviada por el cliente (no el tiempo del servidor): todos denegados; con `true` y `serverTimestamp()`, permitido. En la pantalla: registrarse sin marcar la casilla muestra el aviso y no crea la cuenta ni el perfil; marcándola, el perfil queda con ambos campos.
5. Página 404 y política: `/ruta-que-no-existe` y `/home`, con y sin sesión, muestran "Página no encontrada"; `/privacidad` se abre sin sesión.
6. Forma de `cuestionarios`: `create` con una clave extra, con `estado: "inactivo"`, con `fechaCreacion` enviada por el cliente, con `preguntas` vacía o de más de 100 elementos y con el primer elemento sin `preguntaId`: todos denegados; con la forma que arma `createQuiz`, permitido.
7. `estadisticas_progreso`: `set` de un ID que no empieza por el UID del actor y `set` de `{A}_matematicas` con `usuarioId: B`, denegados; `{A}_ingles` con `usuarioId: A`, permitido. Un administrador solo puede escribir los suyos.
8. `ranking` y `estadisticas_plataforma`: `write` denegado también para el administrador; lectura de `ranking` permitida a cualquier cuenta activa.
9. Funcionales relacionados (ver `casos-prueba-simulacros.md` y `casos-prueba-gamificacion.md`): iniciar el simulacro desde Práctica, aviso "¡Logro desbloqueado!", confirmar al finalizar con preguntas sin responder y "Reintentar" tras un fallo de envío.
10. Cuenta desactivada y `calificarPrueba` (brecha conocida): la función acepta la prueba de una cuenta inactiva; ver el caso 21 de `casos-prueba-gamificacion.md`.
