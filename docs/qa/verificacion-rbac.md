# QA - Verificación RBAC (control de acceso por roles y por datos)

Este documento valida que el control de acceso de LearnFex funcione en dos niveles: las rutas de la aplicación (qué pantallas puede abrir cada rol) y los datos de Firestore (qué puede leer y escribir cada rol según `firestore.rules`).

- Estado del documento: plantilla de ejecución. Ningún caso fue ejecutado todavía; todas las casillas de resultado están vacías a propósito.
- Verificado contra el código de `main` en el commit `f17a14c`. Si `main` cambió desde entonces, revisar los casos antes de ejecutarlos.
- Autoría original del borrador: Juliana Martínez (PR #62). El borrador estaba cortado en el caso 2; este documento lo completa.
- Requisitos que cubre (ERS): acceso restringido según el rol con reglas de seguridad de Firestore (RNF-005), protección de los datos personales y del historial de resultados (RNF-006), gestión de usuarios por el administrador (RF-020) y el inicio de sesión que dirige al panel según el rol (RF-002).

---

## Cómo funciona hoy (resumen verificado en el código)

Rutas (`src/routes/AppRoutes.jsx`):

- Públicas: `/` (inicio de sesión), `/registro`, `/recuperar-contrasena`.
- Estudiante y administrador con sesión (`PrivateRoutes`): `/inicio`, `/practica`, `/estadisticas`, `/ranking`, `/logros`, `/perfil` (dentro del layout del estudiante) y `/practica/cuestionario`, `/resultados/:id`, `/resultados/:id/retroalimentacion` (fuera de ese layout). `PrivateRoutes` solo exige tener sesión: no distingue rol.
- Solo administrador (`AdminRoute`): `/admin`, `/admin/usuarios`, `/admin/preguntas`, `/admin/reportes`, `/admin/simulacros`, `/admin/configuracion`, `/admin/logros`.
- Sin sesión, ambas guardas redirigen a `/`. Con sesión pero sin rol `administrador`, `AdminRoute` redirige a `/inicio` (no existe una ruta `/home`).
- No hay ruta comodín: una URL inexistente (por ejemplo `/home`) muestra una pantalla en blanco, sin página 404.
- El rol sale del campo `rol` del documento `usuarios/{uid}`, que `AuthContext` carga una sola vez al iniciar sesión o recargar la página.
- Al iniciar sesión, `Login.jsx` navega a `/admin` si el rol es `administrador` y a `/inicio` en cualquier otro caso (también si falla la lectura del perfil).
- En `main` no hay botón de "Cerrar sesión" en la interfaz (existe `logout` en `authServices.js`, pero nadie lo usa; el PR #53, sin mergear, lo agrega en Perfil). Para probar otra cuenta usar ventanas privadas o borrar los datos del sitio.

Datos (`firestore.rules`), resumen:

- `usuarios/{id}`: lee el propio usuario o un administrador. Crea solo el propio usuario con `rol: estudiante`, `estado: activo`, `xp: 0`, `nivel: 1`. Actualiza un administrador cualquier campo; el propio usuario solo `nombre`, `apellido`, `colegio` o (hoy) `xp`/`nivel`. Nadie puede borrar.
- `usuarios/{id}/logrosObtenidos`: lee el propio usuario o un administrador; crea el propio usuario (hoy); sin update ni delete.
- `areas`, `preguntas`, `logros`, `configuracion`: leen todos los usuarios con sesión; escribe solo un administrador.
- `cuestionarios`: lee y crea cualquier usuario con sesión; actualiza y borra solo un administrador.
- `resultados` y `resultados/{id}/respuestas`: lee el dueño (`usuarioId`) o un administrador; crea el dueño (hoy); sin update ni delete.
- `ranking/{id}`: lee cualquier usuario con sesión; escribe el dueño del documento (el `id` es su UID) o un administrador.
- `estadisticas_progreso`: lee el dueño o un administrador; escribe cualquier usuario con sesión siempre que el documento nuevo tenga su propio `usuarioId`.
- `estadisticas_plataforma`: lee solo un administrador; cualquier usuario con sesión puede crear; sin update ni delete.
- Cualquier otra colección: denegado para todos.

## Hallazgo de seguridad vigente

Hoy `firestore.rules` todavía deja que un estudiante suba su propio XP y nivel y cree `resultados` y `logrosObtenidos` desde el cliente. Eso se cierra con la tarjeta de Notion **[Sprint 6 - 36] Reglas de Firestore**, que va después del despliegue de la función `calificarPrueba`. Los casos de datos de este documento marcan con "esperado a fallar hasta la tarjeta 6-36" lo que hoy está abierto. Además, este documento deja anotadas otras brechas de las reglas que no están en esa lista: ver "Brechas detectadas" al final.

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
| Fecha | |
| Tester | |
| Entorno (URL, navegador y versión) | |
| Commit o rama probada | |
| Proyecto de Firebase | |
| Estudiante A (correo y UID) | |
| Estudiante B (correo y UID) | |
| Administrador C (correo y UID) | |

## Cómo registrar el resultado

- Marcar `[x]` una sola opción por caso o por fila: Pasa, Falla o Bloqueado (no se pudo ejecutar; explicar por qué en Observaciones).
- En las tablas, la columna "Esperado (correcto)" es el comportamiento que debe tener el sistema. La columna "Hoy" es lo que producen las reglas o el código actuales. Si son distintas, la fila está marcada como **esperado a fallar**: si falla exactamente como dice "Hoy", se registra como **Falla** con la observación "falla conocida" y la tarjeta que lo resuelve. Solo se abre un defecto nuevo si falla de otra manera. Cuando se cierre la tarjeta, la fila debe pasar.
- Adjuntar evidencia (captura, resultado del simulador o log) en cada caso ejecutado.

---

# Parte 1: control de acceso en las rutas

## Caso 1: Sin sesión, las rutas del estudiante redirigen al inicio de sesión

**Precondiciones:** ninguna sesión iniciada (ventana privada).

**Pasos:**

1. Abrir directamente cada una de estas URL: `/inicio`, `/practica`, `/estadisticas`, `/ranking`, `/logros`, `/perfil`, `/practica/cuestionario`, `/resultados/cualquier_id`, `/resultados/cualquier_id/retroalimentacion`.
2. En cada una, observar la pantalla, la URL final y la pestaña Red de DevTools.

**Resultado esperado:**

- Se ve un instante "Verificando sesión..." y la URL termina en `/` (pantalla "Iniciar sesión").
- No se renderiza ninguna pantalla del estudiante y no se consulta ninguna colección de datos.

**Resultado:**

- Resultado: [ ] Pasa  [ ] Falla  [ ] Bloqueado
- Fecha / Tester / Entorno:
- Evidencia (captura, log o enlace):
- Observaciones:

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

- Resultado: [ ] Pasa  [ ] Falla  [ ] Bloqueado
- Fecha / Tester / Entorno:
- Evidencia (captura, log o enlace):
- Observaciones:

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

- Resultado: [ ] Pasa  [ ] Falla  [ ] Bloqueado
- Fecha / Tester / Entorno:
- Evidencia (captura, log o enlace):
- Observaciones:

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

- Resultado: [ ] Pasa  [ ] Falla  [ ] Bloqueado
- Fecha / Tester / Entorno:
- Evidencia (captura, log o enlace):
- Observaciones:

---

## Caso 5: Iniciar sesión como estudiante lleva a `/inicio`

**Precondiciones:** cuenta de estudiante A, sin sesión.

**Pasos:**

1. Iniciar sesión como A.
2. Observar la URL final y la navegación disponible.

**Resultado esperado:**

- Se navega a `/inicio`. La navegación del estudiante tiene Inicio, Práctica, Estadísticas, Ranking y Perfil. No hay enlaces al panel de administración.

**Resultado:**

- Resultado: [ ] Pasa  [ ] Falla  [ ] Bloqueado
- Fecha / Tester / Entorno:
- Evidencia (captura, log o enlace):
- Observaciones:

---

## Caso 6: El administrador puede abrir las rutas del estudiante (comportamiento actual)

`PrivateRoutes` solo exige sesión, así que un administrador también entra a las pantallas del estudiante. Este caso documenta ese comportamiento; no se espera redirección.

**Precondiciones:** cuenta de administrador C con sesión iniciada.

**Pasos:**

1. Escribir `/inicio`, `/practica`, `/ranking` y `/perfil` en la barra de direcciones.

**Resultado esperado (comportamiento actual):**

- Las cuatro pantallas se abren con normalidad. Si la especificación del producto exige separar totalmente al administrador de las pantallas del estudiante, anotarlo en Observaciones como brecha.

**Resultado:**

- Resultado: [ ] Pasa  [ ] Falla  [ ] Bloqueado
- Fecha / Tester / Entorno:
- Evidencia (captura, log o enlace):
- Observaciones:

---

## Caso 7: Rutas inexistentes (comportamiento actual)

**Precondiciones:** sesión iniciada como estudiante A.

**Pasos:**

1. Escribir `/home` y luego `/ruta-que-no-existe` en la barra de direcciones.
2. Revisar la pantalla y la consola.

**Resultado esperado (comportamiento actual):**

- La pantalla queda en blanco y la consola avisa que ninguna ruta coincide. No hay página 404 ni redirección. (Brecha menor; no hay tarjeta identificada.)

**Resultado:**

- Resultado: [ ] Pasa  [ ] Falla  [ ] Bloqueado
- Fecha / Tester / Entorno:
- Evidencia (captura, log o enlace):
- Observaciones:

---

## Caso 8: Cambio de rol desde el panel de administración

**Precondiciones:** administrador C, estudiante A y B de prueba. A tiene sesión abierta en otra ventana.

**Pasos:**

1. Como C, ir a `/admin/usuarios` y localizar a A (buscador por nombre o correo).
2. Cambiar el rol de A a "Administrador" con el selector de la fila.
3. En la sesión de A, sin recargar, escribir `/admin`.
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

- Resultado: [ ] Pasa  [ ] Falla  [ ] Bloqueado
- Fecha / Tester / Entorno:
- Evidencia (captura, log o enlace):
- Observaciones:

---

# Parte 2: control de acceso a los datos (`firestore.rules`)

En las tablas: A y B son estudiantes, C es administrador y "Sin sesión" es una solicitud no autenticada. "Propio" es un documento del mismo UID que el actor.

## Caso 9: Colección `usuarios`

| # | Operación | Actor | Esperado (correcto) | Hoy | Resultado |
| - | --------- | ----- | ------------------- | --- | --------- |
| 1 | `get` de `usuarios/{A}` | A | Permitido | Igual | [ ] Pasa  [ ] Falla |
| 2 | `get` de `usuarios/{B}` | A | Denegado | Igual | [ ] Pasa  [ ] Falla |
| 3 | `list` de `usuarios` | A | Denegado | Igual | [ ] Pasa  [ ] Falla |
| 4 | `get` y `list` de `usuarios` | Sin sesión | Denegado | Igual | [ ] Pasa  [ ] Falla |
| 5 | `get` y `list` de `usuarios` | C | Permitido (la pantalla Usuarios lista a todos) | Igual | [ ] Pasa  [ ] Falla |
| 6 | `update` de `usuarios/{B}` cambiando `nombre` | A | Denegado | Igual | [ ] Pasa  [ ] Falla |
| 7 | `update` de `usuarios/{A}` cambiando solo `nombre`, `apellido` o `colegio` | A | Permitido | Igual | [ ] Pasa  [ ] Falla |
| 8 | `update` de `usuarios/{A}` cambiando `rol`, `estado` o `correo` | A | Denegado | Igual | [ ] Pasa  [ ] Falla |
| 9 | `update` de `usuarios/{B}` cambiando `rol` y `estado` | C | Permitido (pantalla Usuarios) | Igual | [ ] Pasa  [ ] Falla |
| 10 | `create` de `usuarios/{uidNuevo}` con `rol: estudiante`, `estado: activo`, `xp: 0`, `nivel: 1`, autenticado como `uidNuevo` | uidNuevo | Permitido (registro) | Igual | [ ] Pasa  [ ] Falla |
| 11 | `create` de `usuarios/{uidNuevo}` con `rol: administrador`, autenticado como `uidNuevo` | uidNuevo | Denegado | Igual | [ ] Pasa  [ ] Falla |
| 12 | `create` de `usuarios/{otroUid}` | A | Denegado | Igual | [ ] Pasa  [ ] Falla |
| 13 | `delete` de `usuarios/{A}` | A | Denegado | Igual | [ ] Pasa  [ ] Falla |
| 14 | `delete` de `usuarios/{B}` | C | Denegado (nadie puede borrar usuarios) | Igual | [ ] Pasa  [ ] Falla |
| 15 | `update` de `usuarios/{A}` subiendo `xp` o `nivel` | A | Denegado | Permitido: `xp` hasta +100 por escritura y `nivel` a cualquier valor mayor. **Esperado a fallar hasta la tarjeta 6-36** | [ ] Pasa  [ ] Falla |

Para la fila 15 ver los casos 16 y 17 de `docs/qa/casos-prueba-gamificacion.md`, que detallan los límites actuales.

- Fecha / Tester / Entorno:
- Evidencia (captura, resultado del simulador o enlace):
- Observaciones:

---

## Caso 10: Subcolección `usuarios/{uid}/logrosObtenidos`

| # | Operación | Actor | Esperado (correcto) | Hoy | Resultado |
| - | --------- | ----- | ------------------- | --- | --------- |
| 1 | `get` y `list` de `usuarios/{A}/logrosObtenidos` | A | Permitido (pantalla Logros) | Igual | [ ] Pasa  [ ] Falla |
| 2 | `get` y `list` de `usuarios/{B}/logrosObtenidos` | A | Denegado | Igual | [ ] Pasa  [ ] Falla |
| 3 | `get` y `list` de `usuarios/{B}/logrosObtenidos` | C | Permitido | Igual | [ ] Pasa  [ ] Falla |
| 4 | `get` y `list` | Sin sesión | Denegado | Igual | [ ] Pasa  [ ] Falla |
| 5 | `create` de `usuarios/{A}/logrosObtenidos/diez_simulacros` | A | Denegado (solo la función otorga logros) | Permitido. **Esperado a fallar hasta la tarjeta 6-36** | [ ] Pasa  [ ] Falla |
| 6 | `create` de `usuarios/{B}/logrosObtenidos/x` | A | Denegado | Igual | [ ] Pasa  [ ] Falla |
| 7 | `update` o `delete` de un logro obtenido | A o C | Denegado | Igual | [ ] Pasa  [ ] Falla |

- Fecha / Tester / Entorno:
- Evidencia (captura, resultado del simulador o enlace):
- Observaciones:

---

## Caso 11: Catálogos `areas`, `preguntas`, `logros` y `configuracion`

Repetir cada fila para cada una de las cuatro colecciones (para `configuracion` usar el documento `configuracion/general`). Resultado esperado igual en las cuatro.

| # | Operación | Actor | Esperado (correcto) | Hoy | Resultado |
| - | --------- | ----- | ------------------- | --- | --------- |
| 1 | `get` y `list` | A | Permitido | Igual | [ ] Pasa  [ ] Falla |
| 2 | `get` y `list` | Sin sesión | Denegado | Igual | [ ] Pasa  [ ] Falla |
| 3 | `create`, `update` y `delete` | A | Denegado | Igual | [ ] Pasa  [ ] Falla |
| 4 | `create`, `update` y `delete` | C | Permitido | Igual | [ ] Pasa  [ ] Falla |

Desde la interfaz, como C: crear, editar y eliminar una pregunta en `/admin/preguntas`; crear un logro en `/admin/logros`; guardar cambios en `/admin/configuracion`. Todo debe funcionar. (Las áreas no tienen pantalla de administración: se gestionan por seed o consola.)

Observación para registrar (no cambia el resultado de las filas): la fila 1 sobre `preguntas` permite que cualquier estudiante lea el campo `respuestaCorrecta` (y `explicacion`) de todas las preguntas antes de hacer una prueba. Hoy la pantalla de retroalimentación lee esos campos directamente de `preguntas`. Es una brecha de diseño; no hay tarjeta identificada.

- Fecha / Tester / Entorno:
- Evidencia (captura, resultado del simulador o enlace):
- Observaciones:

---

## Caso 12: Colección `cuestionarios`

| # | Operación | Actor | Esperado (correcto) | Hoy | Resultado |
| - | --------- | ----- | ------------------- | --- | --------- |
| 1 | `get` y `list` | A | Permitido | Igual | [ ] Pasa  [ ] Falla |
| 2 | `get` y `list` | Sin sesión | Denegado | Igual | [ ] Pasa  [ ] Falla |
| 3 | `create` de un cuestionario | A | Permitido (hoy el cliente arma el cuestionario al iniciar una prueba) | Igual | [ ] Pasa  [ ] Falla |
| 4 | `update` y `delete` | A | Denegado | Igual | [ ] Pasa  [ ] Falla |
| 5 | `update` (por ejemplo `estado: inactivo`) | C | Permitido | Igual | [ ] Pasa  [ ] Falla |

Observación: la fila 3 permite que cualquier usuario con sesión cree cuestionarios con el contenido que quiera; no se valida su forma ni su tamaño. Es consecuencia de que el cliente los crea; no hay tarjeta identificada.

- Fecha / Tester / Entorno:
- Evidencia (captura, resultado del simulador o enlace):
- Observaciones:

---

## Caso 13: Colección `resultados` y su subcolección `respuestas`

Preparación: A y B tienen al menos un resultado cada uno (`resultados/{cuestionarioId}_{uid}`; anotar los IDs).

| # | Operación | Actor | Esperado (correcto) | Hoy | Resultado |
| - | --------- | ----- | ------------------- | --- | --------- |
| 1 | Abrir en la app `/resultados/{idDeA}` | A | Se ve el resultado | Igual | [ ] Pasa  [ ] Falla |
| 2 | `get` de `resultados/{idDeB}` (en la app: abrir `/resultados/{idDeB}`) | A | Denegado; la pantalla muestra "Ocurrió un error" y "No se pudo cargar el resultado." | Igual | [ ] Pasa  [ ] Falla |
| 3 | En la app, abrir `/resultados/{idDeB}/retroalimentacion` | A | Denegado; la pantalla muestra "No se pudo cargar la retroalimentación." | Igual | [ ] Pasa  [ ] Falla |
| 4 | `list` de `resultados` con filtro `usuarioId == A` (la pantalla Estadísticas) | A | Permitido | Igual | [ ] Pasa  [ ] Falla |
| 5 | `list` de `resultados` sin filtro | A | Denegado | Igual | [ ] Pasa  [ ] Falla |
| 6 | `get` y `list` de `resultados/{idDeB}/respuestas` filtrando por `usuarioId == B` | A | Denegado | Igual | [ ] Pasa  [ ] Falla |
| 7 | `get` y `list` de `resultados/{idDeA}/respuestas` filtrando por `usuarioId == A` | A | Permitido | Igual | [ ] Pasa  [ ] Falla |
| 8 | `create` de `resultados/x` con `usuarioId == A` | A | Denegado (solo la función crea resultados) | Permitido. **Esperado a fallar hasta la tarjeta 6-36** | [ ] Pasa  [ ] Falla |
| 9 | `create` de `resultados/x/respuestas/y` con `usuarioId == A` | A | Denegado | Permitido. **Esperado a fallar hasta la tarjeta 6-36** | [ ] Pasa  [ ] Falla |
| 10 | `create` de `resultados/x` con `usuarioId == B` | A | Denegado | Igual | [ ] Pasa  [ ] Falla |
| 11 | `update` y `delete` de cualquier resultado o respuesta | A o C | Denegado | Igual | [ ] Pasa  [ ] Falla |
| 12 | `get` y `list` de todos los resultados | C | Permitido (Dashboard y Reportes) | Igual | [ ] Pasa  [ ] Falla |
| 13 | En la app, abrir `/resultados/{idDeA}` | C | Las reglas permiten leerlo, pero la pantalla muestra "No tienes permiso para ver este resultado." (comprobación del cliente, `Results.jsx`) | Igual | [ ] Pasa  [ ] Falla |
| 14 | `get` y `list` | Sin sesión | Denegado | Igual | [ ] Pasa  [ ] Falla |

- Fecha / Tester / Entorno:
- Evidencia (captura, resultado del simulador o enlace):
- Observaciones:

---

## Caso 14: Colección `ranking`

| # | Operación | Actor | Esperado (correcto) | Hoy | Resultado |
| - | --------- | ----- | ------------------- | --- | --------- |
| 1 | `get` y `list` (la pantalla Ranking) | A | Permitido | Igual | [ ] Pasa  [ ] Falla |
| 2 | `get` y `list` | Sin sesión | Denegado | Igual | [ ] Pasa  [ ] Falla |
| 3 | `set` de `ranking/{A}` con `puntajeAcumulado: 999999` | A | Denegado (el ranking lo escribe la función desde el servidor) | Permitido. **Esperado a fallar hasta la tarjeta 6-36** (confirmar que la tarjeta incluya el bloque `ranking`) | [ ] Pasa  [ ] Falla |
| 4 | `delete` de `ranking/{A}` | A | Denegado | Permitido (la regla es `write`). Mismo tratamiento que la fila 3 | [ ] Pasa  [ ] Falla |
| 5 | `set` de `ranking/{B}` | A | Denegado | Igual | [ ] Pasa  [ ] Falla |
| 6 | `set` de `ranking/{B}` | C | Permitido | Igual | [ ] Pasa  [ ] Falla |

- Fecha / Tester / Entorno:
- Evidencia (captura, resultado del simulador o enlace):
- Observaciones:

---

## Caso 15: Colección `estadisticas_progreso`

Los IDs que usa la app son `{usuarioId}_{areaId}` (por ejemplo `{A}_matematicas`). La pantalla Estadísticas escribe estos documentos desde el cliente.

| # | Operación | Actor | Esperado (correcto) | Hoy | Resultado |
| - | --------- | ----- | ------------------- | --- | --------- |
| 1 | `list` con filtro `usuarioId == A` | A | Permitido | Igual | [ ] Pasa  [ ] Falla |
| 2 | `get` o `list` de documentos con `usuarioId == B` | A | Denegado | Igual | [ ] Pasa  [ ] Falla |
| 3 | `set` de `{A}_matematicas` con `usuarioId: A` | A | Permitido (lo hace la app al abrir Estadísticas) | Igual | [ ] Pasa  [ ] Falla |
| 4 | `set` de `{A}_matematicas` con `usuarioId: B` | A | Denegado | Igual | [ ] Pasa  [ ] Falla |
| 5 | `set` de `{B}_matematicas` (documento de B) con `usuarioId: A` | A | Denegado (no se puede pisar ni tomar el documento de otro) | Permitido: la regla solo mira el `usuarioId` del documento nuevo, no el dueño del existente | [ ] Pasa  [ ] Falla |
| 6 | `get` y `list` | C | Permitido | Igual | [ ] Pasa  [ ] Falla |
| 7 | `get` y `list` | Sin sesión | Denegado | Igual | [ ] Pasa  [ ] Falla |

La fila 5 es una brecha de las reglas que no figura en la tarjeta 6-36 conocida: si falla como indica "Hoy", registrarla como falla conocida y reportarla para abrir una tarjeta.

- Fecha / Tester / Entorno:
- Evidencia (captura, resultado del simulador o enlace):
- Observaciones:

---

## Caso 16: Colección `estadisticas_plataforma`

| # | Operación | Actor | Esperado (correcto) | Hoy | Resultado |
| - | --------- | ----- | ------------------- | --- | --------- |
| 1 | `get` y `list` | C | Permitido | Igual | [ ] Pasa  [ ] Falla |
| 2 | `get` y `list` | A | Denegado | Igual | [ ] Pasa  [ ] Falla |
| 3 | `update` y `delete` | A o C | Denegado | Igual | [ ] Pasa  [ ] Falla |
| 4 | `create` de cualquier documento | A | Denegado (solo debería escribirlo el administrador o el servidor) | Permitido: la regla acepta `create` de cualquier usuario con sesión | [ ] Pasa  [ ] Falla |

La colección no se usa en el código actual (el panel calcula las estadísticas leyendo `usuarios` y `resultados`). La fila 4 es una brecha menor; no hay tarjeta identificada.

- Fecha / Tester / Entorno:
- Evidencia (captura, resultado del simulador o enlace):
- Observaciones:

---

## Caso 17: Colecciones no declaradas en las reglas

**Precondiciones:** simulador o emulador.

**Pasos:**

1. Probar `get`, `list`, `create`, `update` y `delete` sobre una colección que no existe en las reglas (por ejemplo `prueba_qa/doc1`) con los actores A, C y Sin sesión.

**Resultado esperado:**

- Todas las operaciones son denegadas para todos los actores, incluido el administrador (las reglas niegan por defecto lo que no declaran).

**Resultado:**

- Resultado: [ ] Pasa  [ ] Falla  [ ] Bloqueado
- Fecha / Tester / Entorno:
- Evidencia (captura, resultado del simulador o enlace):
- Observaciones:

---

## Caso 18: Una cuenta desactivada no debería poder usar la aplicación

La ERS (RF-020) pide que el administrador pueda deshabilitar una cuenta "restringiendo su acceso". En `main` el campo `estado` solo se muestra y se cambia desde `/admin/usuarios`; ni el inicio de sesión, ni las rutas, ni `firestore.rules` lo consultan.

**Estado conocido: esperado a fallar. Sin tarjeta identificada.**

**Precondiciones:** administrador C y estudiante B de prueba. B tiene sesión abierta en otra ventana.

**Pasos:**

1. Como C, ir a `/admin/usuarios`, pulsar "Desactivar" sobre B y confirmar. Verificar que `usuarios/{B}.estado` pasa a `inactivo` y que la fila muestra "Inactivo".
2. En la sesión abierta de B, recargar y navegar por `/inicio`, `/practica` y empezar un cuestionario.
3. Cerrar la sesión de B (ventana privada nueva) y volver a iniciar sesión con B.
4. Como C, reactivar a B ("Activar") para dejar los datos como estaban.

**Resultado esperado (correcto):** B no puede iniciar sesión ni seguir usando la aplicación mientras su cuenta esté desactivada.

**Comportamiento actual conocido:** B puede iniciar sesión y usar la aplicación con normalidad; la desactivación no tiene efecto sobre el acceso.

**Resultado:**

- Resultado: [ ] Pasa  [ ] Falla  [ ] Bloqueado
- Fecha / Tester / Entorno:
- Evidencia (captura, log o enlace):
- Observaciones:

---

## Brechas detectadas al derivar los casos de las reglas

Estas son consecuencia directa del código actual de `firestore.rules` y de la aplicación; no son resultados de ejecución.

1. XP, nivel, `resultados`, `respuestas`, `logrosObtenidos` y `ranking` pueden escribirse desde el cliente (tarjeta 6-36; confirmar que incluya `ranking`).
2. `estadisticas_progreso`: se puede escribir sobre el documento de otro usuario si el documento nuevo lleva el propio `usuarioId` (caso 15, fila 5).
3. `preguntas` expone `respuestaCorrecta` a cualquier estudiante (caso 11).
4. `cuestionarios` y `estadisticas_plataforma` aceptan `create` de cualquier usuario con sesión sin validar contenido (casos 12 y 16).
5. `estado: inactivo` no restringe el acceso (caso 18).
6. No hay página 404 y no hay botón de cerrar sesión en `main` (casos 7 y precondiciones).

## Notas finales

- Ejecutar los casos de rutas con `npm run dev` y la consola del navegador abierta.
- Los casos de datos se pueden ejecutar todos en el simulador de reglas; los que dicen "en la app" se pueden comprobar también desde la interfaz.
- Las filas "esperado a fallar hasta la tarjeta 6-36" deben pasar cuando se cierre la tarjeta [Sprint 6 - 36] Reglas de Firestore. Volver a ejecutarlas entonces.
- Documentos relacionados en `docs/qa/`: `casos-prueba-gamificacion.md` (manipulación de XP, nivel y logros) y `integracion-end-to-end.md` (recorrido completo de estudiante y administrador).
