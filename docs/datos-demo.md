# Datos de demostración de LearnFex

Este documento explica cómo preparar LearnFex con datos de prueba realistas para una presentación: cuentas, banco de preguntas, historial de estudiantes, ranking, logros y panel de administración con contenido. Está pensado para quien presenta.

Hay dos formas de usarlo:

- **Demo local con emuladores (recomendada):** todo ocurre en tu computador, con el Emulator Suite de Firebase. No toca ningún proyecto real y se puede reiniciar las veces que haga falta.
- **Proyecto real (`--real`):** escribe solo el historial de estudiantes que ya registraste a mano en el proyecto real. Es opcional y lo ejecuta el dueño del proyecto (ver [Usar los datos en el proyecto real](#usar-los-datos-en-el-proyecto-real)).

## Contenido

- [Antes de empezar](#antes-de-empezar)
- [Levantar la demo local](#levantar-la-demo-local)
- [Reiniciar a estado limpio](#reiniciar-a-estado-limpio)
- [Cuentas demo](#cuentas-demo)
- [Qué datos se cargan](#qué-datos-se-cargan)
- [Guion de demostración (10 minutos)](#guion-de-demostración-10-minutos)
- [Usar los datos en el proyecto real](#usar-los-datos-en-el-proyecto-real)
- [Antes de presentar](#antes-de-presentar)
- [Si algo falla](#si-algo-falla)
- [Cómo funciona por dentro](#cómo-funciona-por-dentro)

## Antes de empezar

Requisitos (una sola vez):

- Node.js 22 o superior (el proyecto se probó con Node 24; el emulador de funciones avisa que la versión no coincide con `engines`, y sigue funcionando).
- Java 21 o superior (lo necesita el emulador de Firestore).
- Firebase CLI instalado (`firebase --version`).
- Dependencias instaladas, desde la raíz del repositorio:

```bash
npm ci
npm --prefix functions ci
```

No hace falta tocar el archivo `.env`: todas las variables de la demo se pasan en la línea de comandos.

## Levantar la demo local

Se usan tres terminales abiertas en la raíz del repositorio. Los comandos sirven en PowerShell y en Git Bash, salvo donde se indica.

**Terminal 1: emuladores.** Déjala abierta durante toda la demo.

```bash
npm run emuladores
```

Equivale a `firebase emulators:start --project demo-learnfex`. Levanta Auth (9099), Firestore (8080), Functions (5001) y la interfaz de los emuladores (http://localhost:4000). Espera a ver "All emulators ready".

**Terminal 2: cargar los datos demo.**

```bash
npm run seed:demo
```

Tarda unos segundos. Al final imprime la tabla de cuentas y los números esperados del Dashboard. Si dice "Verificación cruzada: OK", los datos coinciden con lo planeado.

**Terminal 3: la aplicación apuntando a los emuladores.** `VITE_USE_EMULATORS=true` y el resto de variables se pasan en la línea de comandos (tienen prioridad sobre cualquier archivo `.env`).

PowerShell:

```powershell
$env:VITE_USE_EMULATORS = "true"
$env:VITE_FIREBASE_PROJECT_ID = "demo-learnfex"
$env:VITE_FIREBASE_API_KEY = "demo-key"
$env:VITE_FIREBASE_AUTH_DOMAIN = "demo-learnfex.firebaseapp.com"
$env:VITE_FIREBASE_STORAGE_BUCKET = "demo-learnfex.appspot.com"
$env:VITE_FIREBASE_MESSAGING_SENDER_ID = "000000000000"
$env:VITE_FIREBASE_APP_ID = "1:000000000000:web:0000000000000000000000"
npm run dev
```

Git Bash:

```bash
VITE_USE_EMULATORS=true \
VITE_FIREBASE_PROJECT_ID=demo-learnfex \
VITE_FIREBASE_API_KEY=demo-key \
VITE_FIREBASE_AUTH_DOMAIN=demo-learnfex.firebaseapp.com \
VITE_FIREBASE_STORAGE_BUCKET=demo-learnfex.appspot.com \
VITE_FIREBASE_MESSAGING_SENDER_ID=000000000000 \
VITE_FIREBASE_APP_ID=1:000000000000:web:0000000000000000000000 \
npm run dev
```

Abre la dirección que imprime Vite (normalmente http://localhost:5173). Abajo de la pantalla debe verse el aviso rojo "Running in emulator mode. Do not use with production credentials.": confirma que la app usa los emuladores y no el proyecto real.

Las variables de PowerShell (`$env:...`) duran lo que dure esa ventana. Para volver a trabajar contra el proyecto real, cierra esa terminal o ejecuta `Remove-Item Env:VITE_USE_EMULATORS`.

## Reiniciar a estado limpio

Los emuladores no guardan datos al cerrarse. Hay dos formas de volver al estado inicial:

1. **Reinicio completo (la más segura):** en la Terminal 1 pulsa `Ctrl+C`, vuelve a ejecutar `npm run emuladores` y luego `npm run seed:demo`.
2. **Sin reiniciar los emuladores:**

   ```bash
   npm run seed:demo:reset
   ```

   Borra todo lo demo (cuentas, banco, cuestionarios, resultados, ranking, logros, estadísticas) y lo vuelve a crear. También borra lo que las cuentas demo hicieron durante la presentación (por ejemplo, las pruebas que resolviste en vivo). No borra cuentas creadas con otros correos (por ejemplo, la que registraste en vivo): para esas usa el reinicio completo.

Correr `npm run seed:demo` dos veces sin `--reset` no duplica nada: lo que ya existe se conserva y solo se completa lo que falte. Eso significa que no deshace cambios hechos en la demo (como activar a una cuenta inactiva); para eso, usa `--reset`.

## Cuentas demo

Todas las cuentas usan la misma contraseña, que solo existe en el emulador: `Demo2026!`.

| Correo | Rol | Estado | Qué mostrar |
| ------ | --- | ------ | ----------- |
| `admin@learnfex-demo.test` | Administrador | Activo | Panel de administración completo |
| `valentina.ramirez@learnfex-demo.test` | Estudiante | Activo | Estudiante fuerte: nivel 2, 3 logros, primer lugar del ranking, 2 simulacros |
| `santiago.gomez@learnfex-demo.test` | Estudiante | Activo | Estudiante medio: 7 pruebas, 2 logros |
| `camila.torres@learnfex-demo.test` | Estudiante | Activo | Débil en Matemáticas y Ciencias Naturales: "Temas recomendados" |
| `mateo.rodriguez@learnfex-demo.test` | Estudiante | Activo | Estudiante nuevo sin pruebas: estados vacíos reales |
| `daniela.cardona@learnfex-demo.test` | Estudiante | **Inactivo** | Bloqueo de cuentas inactivas |

## Qué datos se cargan

**Banco de preguntas:** las 5 áreas (Matemáticas, Lectura Crítica, Ciencias Naturales, Ciencias Sociales y Ciudadanas, Inglés) con las 40 preguntas de `scripts/seed-preguntas.js` (8 por área, con dificultades baja, media y alta), los 3 logros del catálogo y la configuración general de la aplicación. El simulacro completo se arma con 6 preguntas por área: 30 preguntas y 95 minutos.

**Historial de estudiantes** (30 pruebas en total, repartidas en los últimos 19 días; los simulacros y cuestionarios aparecen en Historial y en Simulacros del panel):

| Estudiante | Pruebas | Promedio | XP | Nivel | Logros | Detalle |
| ---------- | ------- | -------- | -- | ----- | ------ | ------- |
| Valentina Ramírez | 16 | 88% | 1190 | 2 | 3 | 14 cuestionarios y 2 simulacros (80% y 90%); sin áreas bajo 60% |
| Santiago Gómez | 7 | 69% | 430 | 1 | 2 | 6 cuestionarios y 1 simulacro (70%) |
| Camila Torres | 4 | 47% | 150 | 1 | 1 | Matemáticas 31%, Ciencias Naturales 50% |
| Daniela Cardona | 3 | 67% | 160 | 1 | 1 | Hecho mientras la cuenta estaba activa |
| Mateo Rodríguez | 0 | | 0 | 1 | 0 | Sin actividad |

**Lo que debería ver el administrador:**

- Dashboard: Usuarios totales 6, Simulacros realizados 30, Preguntas en banco 40, Promedio general 76%.
- Reportes por área: Ciencias Naturales 75%, Inglés 82%, Lectura Crítica 82%, Matemáticas 69%, Ciencias Sociales y Ciudadanas 75%.
- Ranking (visible para los estudiantes): Valentina 1190, Santiago 430, Daniela 160, Camila 150.

Las fechas se calculan a partir del día en que se ejecuta el script (hora de Colombia), así que "Actividad reciente" siempre dice "hace unas horas / ayer / hace N días". Si preparas la demo con varios días de anticipación, vuelve a correr `npm run seed:demo:reset` el día anterior.

## Guion de demostración (10 minutos)

Los tiempos son una guía. El orden está pensado para que el estudiante nuevo (Mateo) muestre primero los estados vacíos y luego "se llene" en vivo.

| Min | Pantalla | Qué hacer | Qué mostrar |
| --- | -------- | --------- | ----------- |
| 0:00 | Registro (`/registro`) | Crear una cuenta nueva con un correo cualquiera, marcando "Acepto la política de tratamiento de datos personales" | El consentimiento es obligatorio; al crear la cuenta entra a Inicio con 0 puntos y nivel 1. Cierra sesión desde Perfil. Esa cuenta suma 1 al total de usuarios del Dashboard (7) |
| 1:30 | Inicio de sesión | Entrar como Mateo | Estado vacío real: Estadísticas ("Todavía no tienes progreso registrado"), Historial ("Todavía no completaste ningún cuestionario") y Logros (todos bloqueados) |
| 2:30 | Práctica por área | Entrar a Práctica, elegir un área y resolver unas preguntas; tocar "Finalizar" | Cuestionario de hasta 10 preguntas con temporizador y navegación. Basta responder algunas; las demás cuentan como incorrectas |
| 4:00 | Resultados y retroalimentación | Ver el puntaje y tocar "Ver retroalimentación" | Puntaje, "Aprobado/No aprobado", tarjeta "¡Logro desbloqueado!" (Primer paso) y la explicación de cada pregunta |
| 5:00 | Inicio, Estadísticas, Ranking | Volver a Inicio, abrir Estadísticas y Ranking | Los puntos nuevos ya aparecen; Mateo entra al ranking |
| 5:30 | Simulacro completo | Cerrar sesión y entrar como Valentina. En Práctica, tocar "Iniciar simulacro" y mostrar la pantalla (30 preguntas, 95 minutos), sin terminarlo | Temporizador y navegación. Para ver simulacros ya resueltos, ir a Historial |
| 6:30 | Valentina: Inicio, Estadísticas, Historial, Ranking, Logros, Perfil | Recorrer las pantallas | Nivel 2 (1190 puntos, 19% del siguiente nivel), áreas con 80% o más, "¡Muy bien!" en recomendaciones, 16 pruebas en el historial (2 simulacros), primer lugar en el ranking, 3 logros desbloqueados con su fecha, Perfil con colegio |
| 7:30 | Camila: Estadísticas | Entrar como Camila | "Temas recomendados": Matemáticas (31%) y Ciencias Naturales (50%); Inglés y Sociales aparecen "(sin pruebas)" |
| 8:00 | Administrador: Dashboard y Reportes | Entrar como `admin@learnfex-demo.test` | Las cuatro tarjetas del Dashboard, la actividad reciente y el desempeño por área |
| 8:45 | Usuarios | Buscar a Daniela; activar y desactivar | Daniela aparece "Inactivo". Tu propia fila no se puede desactivar |
| 9:15 | Preguntas, Simulacros, Logros, Configuración | Recorrer las pantallas | Preguntas con filtro de dificultad (Baja, Media, Alta) y alta de pregunta; Simulacros con la lista de cuestionarios y "Desactivar"; Logros con el catálogo; Configuración general con nombre, descripción y correo de soporte (editable) |
| 9:45 | Bloqueo de cuenta inactiva | Con Daniela en estado "Inactivo", cerrar sesión e intentar entrar como ella | "Tu cuenta está desactivada. Contactá a un administrador." (si la reactivaste en el minuto 8:45, desactívala de nuevo antes) |

Después de la presentación, vuelve al estado inicial con `npm run seed:demo:reset` o reiniciando los emuladores.

Notas para improvisar:

- Lo que se haga en vivo cambia los números: cada prueba nueva suma al Dashboard y al Ranking, y cada cuestionario nuevo aparece en Simulacros del panel.
- El estudiante nuevo deja de estar vacío cuando resuelve una prueba. Si necesitas mostrar el estado vacío otra vez, usa `--reset`.
- La interfaz de los emuladores (http://localhost:4000) permite ver y editar los documentos de Firestore y las cuentas de Authentication.

## Usar los datos en el proyecto real

Esta parte es opcional y la ejecuta el dueño del proyecto. El modo `--real` **no crea cuentas ni toca Authentication**: escribe el historial de estudiantes que ya existen. Escribe en el Firestore real, saltándose las reglas de seguridad (usa permisos de administrador del proyecto), por eso pide confirmación.

Qué escribe, para cada estudiante: cuestionarios, resultados con sus respuestas, ranking, logros obtenidos, estadísticas de progreso y la actualización de `xp` y `nivel` en `usuarios`. Tiene las mismas formas de dato que produce la Cloud Function `calificarPrueba`. Marca con `esDemo: true` los cuestionarios, los resultados, las respuestas, el ranking, los logros obtenidos y las estadísticas que escribe, para poder encontrarlos después. **No** marca los perfiles de `usuarios` (son cuentas reales): solo les actualiza `xp` y `nivel`. No escribe áreas, preguntas, logros ni configuración: el banco ya debe estar cargado.

Perfiles: con la lista de correos, el primero recibe el historial del estudiante fuerte, el segundo el del medio y el tercero el del débil. Del cuarto en adelante no se escribe nada (quedan como estudiantes nuevos). La contraseña de cada cuenta es la que se usó al registrarla.

Validación previa: antes de escribir o borrar nada, el script lee y valida **todos** los correos y, si algo falla, se detiene sin haber tocado datos. Rechaza correos repetidos, correos que no existen, cuentas que no son de estudiante, cuentas con pruebas reales y cuentas con `xp` o `nivel` sin pruebas demo. Esto vale también con `--reset --emails`.

Pasos:

1. **Banco cargado.** El proyecto real debe tener las 5 áreas con al menos 6 preguntas cada una y el catálogo de logros (se cargan con `scripts/seed-preguntas.js`, ver [variables-de-entorno.md](variables-de-entorno.md)). El script lo comprueba y se detiene con un mensaje si falta algo.
2. **Registrar a mano 3 o 4 estudiantes** desde `/registro` de la aplicación real, marcando el consentimiento. Usá cuentas recién registradas, sin pruebas: el script se niega a escribir sobre estudiantes que ya tienen actividad real. Anotá los correos **tal cual los escribiste al registrarte**: el perfil guarda el correo con las mismas mayúsculas y minúsculas, y el script lo busca así (si no lo encuentra, prueba en minúsculas, pero no más que eso).
3. **Obtener un token de acceso** de una cuenta con permisos sobre Firestore del proyecto (propietario o rol de Cloud Datastore). Con la CLI de Google Cloud ya iniciada:

   PowerShell:

   ```powershell
   $env:DEMO_ACCESS_TOKEN = (gcloud auth print-access-token)
   ```

   Git Bash:

   ```bash
   export DEMO_ACCESS_TOKEN=$(gcloud auth print-access-token)
   ```

   El token dura aproximadamente una hora: generalo justo antes de correr el script (un token vencido a mitad de camino interrumpe la escritura). Vive solo en esa terminal y el script nunca lo imprime ni lo guarda. No lo pegues en archivos ni en chats. Si la API responde que falta un proyecto de cuota, define también `DEMO_QUOTA_PROJECT` con el id del proyecto.
4. **Proyecto.** El script solo escribe en el proyecto por defecto de `.firebaserc` (`projects.default`); ese es el proyecto esperado. Si defines `DEMO_PROJECT_ID` con un id distinto, el script se detiene con un mensaje claro. Para cambiar de proyecto usa `firebase use` (o no definas `DEMO_PROJECT_ID`). Comprueba el id que imprime la primera línea ("Modo REAL ... Proyecto: ...") antes de confirmar.
5. **Ensayo sin escribir (`--dry-run`).** Lista las pruebas y los documentos que se escribirían, sin escribir nada:

   ```bash
   npm run seed:demo -- --real --dry-run --emails uno@correo.com,dos@correo.com,tres@correo.com,cuatro@correo.com
   ```

6. **Ejecución real.** El mismo comando sin `--dry-run`. El script pide escribir el id del proyecto para confirmar:

   ```bash
   npm run seed:demo -- --real --emails uno@correo.com,dos@correo.com,tres@correo.com,cuatro@correo.com
   ```

   Es idempotente: si lo corres otra vez, no duplica nada. Atención con `--yes`: omite la pregunta de confirmación, que es la única barrera antes de escribir en el proyecto real. Úsalo solo si ya revisaste el `--dry-run` y estás seguro del proyecto. No se permite junto con `--reset` ni `--borrar`: borrar siempre pide confirmar.
7. **Revisar** entrando a la aplicación con esas cuentas y con una de administrador: Inicio, Estadísticas, Ranking, Logros, Historial y Dashboard.
8. **Borrar lo demo después:**

   ```bash
   npm run seed:demo -- --real --reset
   ```

   Qué borra exactamente:

   - Los documentos marcados con `esDemo`: cuestionarios, resultados y sus respuestas.
   - De cada estudiante que tuvo datos demo, **por uid y no por la marca**: su ranking, sus logros obtenidos y sus estadísticas de progreso (esos documentos pueden haber sido reescritos por la aplicación, y se borran aunque ya no estén marcados; la aplicación vuelve a crear las estadísticas al abrir Estadísticas). Y les devuelve `xp` y `nivel` a 0 y 1.
   - Si un estudiante ya hizo pruebas reales además de las demo, solo se borran sus resultados demo y se conservan su `xp`, ranking, logros y estadísticas; el script lo avisa.
   - Las cuentas, los perfiles, el banco y la configuración no se tocan.

   Para borrar y volver a crear en un solo paso, agrega `--emails ...` (se validan antes de borrar).

   **Si el borrado se interrumpe** (corte de red, token vencido): vuelve a correr `npm run seed:demo -- --real --reset`. El borrado va en orden (primero `xp`, ranking, logros y estadísticas; luego respuestas y resultados; al final los cuestionarios) y descubre qué limpiar por cualquier marca que haya quedado (resultados, ranking, estadísticas o logros marcados), así que la segunda corrida termina el trabajo. Las respuestas huérfanas (sin su resultado) y los logros marcados se buscan con una consulta de grupo de colecciones; en Firestore real puede exigir un índice. Si el script avisa que no pudo hacer esa búsqueda, igual completa el borrado a partir de los resultados, el ranking y las estadísticas que encuentre, pero podrían quedar respuestas huérfanas, que se pueden borrar a mano desde la consola de Firestore (campo `esDemo` igual a `true`).

Ten en cuenta: el Dashboard y los Reportes del proyecto real incluirán estos datos mientras existan. Borra lo demo antes de que los usuarios reales empiecen a usar la aplicación.

## Antes de presentar

Lista de verificación, idealmente el día anterior y otra vez una hora antes:

- [ ] Emuladores levantados (`npm run emuladores`) y el mensaje "All emulators ready".
- [ ] Datos cargados con `npm run seed:demo:reset` (o reinicio completo de emuladores + `npm run seed:demo`) y "Verificación cruzada: OK" al final.
- [ ] La app abierta con `VITE_USE_EMULATORS=true` y el aviso rojo "Running in emulator mode" visible.
- [ ] Probado el inicio de sesión con Valentina, Camila, Mateo y el administrador. Con Daniela debe aparecer "Tu cuenta está desactivada".
- [ ] Dashboard con 6 usuarios, 30 pruebas, 40 preguntas y 76% (antes de hacer nada en vivo).
- [ ] Navegador sin sesión abierta de otras cuentas (usa una ventana nueva o cierra sesión).
- [ ] Zoom del navegador y tamaño de ventana cómodos para la sala; si presentas en celular, prueba la barra inferior de navegación.
- [ ] Un plan B: capturas de pantalla de cada pantalla clave (por si el emulador falla).

## Si algo falla

| Síntoma | Causa probable | Qué hacer |
| ------- | -------------- | --------- |
| `No se puede conectar con el emulador de Auth/Firestore/Functions` | Los emuladores no están levantados, o usan otros puertos | Levanta `npm run emuladores` y espera "All emulators ready". Si los puertos 9099, 8080 o 5001 están ocupados por otra instancia, ciérrala (o usa otros puertos en una copia de `firebase.json` y define `DEMO_AUTH_EMULATOR_HOST`, `DEMO_FIRESTORE_EMULATOR_HOST` y `DEMO_FUNCTIONS_EMULATOR_HOST`) |
| La app muestra errores de red o de permisos | La app no está apuntando a los emuladores | Revisa que `npm run dev` se haya lanzado con `VITE_USE_EMULATORS=true` en esa misma terminal y que veas el aviso rojo. Reinicia Vite |
| "Correo o contraseña incorrectos" con una cuenta demo | La cuenta no existe (emuladores reiniciados sin volver a cargar) o la contraseña es otra | Ejecuta `npm run seed:demo`. La contraseña es `Demo2026!` |
| Estadísticas o Ranking vacíos para estudiantes con historial | Se reiniciaron los emuladores y no se volvió a cargar | Ejecuta `npm run seed:demo` |
| `Cannot find module 'firebase/...'` al correr el seed | Faltan las dependencias | `npm ci` en la raíz |
| La función `calificarPrueba` falla al cargar los datos | No se instalaron las dependencias de `functions/` | `npm --prefix functions ci` y reinicia los emuladores |
| "Verificación cruzada: N diferencia(s)" | Datos previos mezclados con los nuevos | `npm run seed:demo:reset` o reinicio completo |
| El seed dice "Faltan preguntas..." (modo real) | El banco del proyecto real no está cargado | Carga el banco con `scripts/seed-preguntas.js` |
| El modo real falla con 401 o 403 | Token vencido o sin permisos | Genera otro token (dura aprox. 1 hora) con una cuenta con permisos sobre Firestore; si pide proyecto de cuota, define `DEMO_QUOTA_PROJECT` |
| El modo real dice "No se encontró ningún usuario con el correo ..." | El correo no coincide con el del registro (se respetan mayúsculas) o la cuenta es de otro proyecto | Pasa el correo exactamente como lo escribiste al registrarte y confirma que la cuenta exista en el proyecto de `.firebaserc` |
| El modo real dice "está repetido", "no es un estudiante" o "ya tiene pruebas reales" | La lista de `--emails` no es válida | Corrige la lista: sin repetidos, solo estudiantes y cuentas recién registradas. No se escribió ni se borró nada |
| El modo real dice que `DEMO_PROJECT_ID` no coincide con `.firebaserc` | Variable de entorno de otro proyecto | Quita `DEMO_PROJECT_ID` o ejecuta `firebase use` para el proyecto correcto |
| Un `--reset --real` se interrumpió | Corte de red o token vencido | Genera otro token y vuelve a correr `npm run seed:demo -- --real --reset`: termina el borrado |
| Se pierde el estado a mitad de la demo | Se cerraron los emuladores | Levántalos y ejecuta `npm run seed:demo` (1 minuto) |

## Cómo funciona por dentro

Resumen técnico para quien quiera entender o ampliar el script (`scripts/seed-demo.js`):

- **Cuentas:** se crean en el Auth Emulator con su API REST (`accounts:signUp`). Los documentos de `usuarios` tienen la misma forma que crea el registro real (`createUserProfile`): `rol`, `estado`, `xp`, `nivel`, `colegio`, `fechaRegistro`, `consentimientoDatos: true` y `fechaConsentimiento`. Daniela se crea activa, recibe su historial y al final pasa a `estado: "inactivo"`.
- **Historial en modo emulador:** para cada prueba se crea el cuestionario (`demo_<perfil>_<NN>`) y se invoca la Cloud Function real `calificarPrueba` con el token de la cuenta del estudiante, de modo que la calificación, el XP (`min(correctas × 10, 100)`), el nivel (`floor(xp / 1000) + 1`), el ranking y los logros los calcula el código real. La función usa `serverTimestamp()`, así que después se reescriben con permisos de administrador las fechas de los resultados, de los logros obtenidos, del cuestionario y del ranking para repartir la actividad en los últimos 19 días.
- **Estadísticas de progreso:** documentos `estadisticas_progreso/<uid>_<areaId>` con `porcentajeAvance` y `promedioAciertos`, calculados con la misma fórmula que `calcularEstadisticas`. La app también los actualiza sola al abrir Estadísticas.
- **Verificación cruzada:** al terminar, el script compara lo que escribió la función (puntajes, respuestas, XP, nivel, ranking y logros) con el plan que calculó por su cuenta. Junto con la comparación del modo directo (siguiente punto), esto respalda que la réplica usada por el modo `--real` produce los mismos datos que la función.
- **Modo directo:** `--directo` escribe el historial por REST sin llamar a la función, con el mismo código que el modo `--real`. En las pruebas de este cambio, el estado resultante fue idéntico al del modo con función (salvo los ids automáticos de las respuestas).
- **Datos deterministas:** las respuestas de cada prueba salen de un generador pseudoaleatorio con semilla fija (perfil y número de prueba), así que siempre se cargan los mismos datos.
- **Marca `esDemo`:** llevan `esDemo: true` los cuestionarios, los resultados, el ranking, los logros obtenidos, las estadísticas de progreso y, en el modo directo y en `--real`, las respuestas. En el modo con función las respuestas las crea la función sin marca; el reset del emulador las borra igual, listándolas desde cada resultado. Los perfiles de `usuarios` se marcan solo en el emulador. El banco y la configuración no se marcan: en el emulador se borran por id conocido, y en `--real` nunca se tocan. Por eso `--reset` no se basa únicamente en la marca: completa por uid (ranking, logros y estadísticas de los estudiantes afectados) y por los ids conocidos.
- **Reset con corte a mitad:** el borrado se hace en etapas ordenadas (`xp`, ranking, logros y estadísticas; respuestas y resultados; cuestionarios; y en el emulador, perfiles y banco) y descubre los uid por cualquier marca restante. Se probó cortando el segundo, tercer y cuarto commit con un proxy que devolvía error, y en todos los casos la segunda corrida dejó todo limpio.

Opciones del script (`node scripts/seed-demo.js --ayuda` las lista):

| Opción | Efecto |
| ------ | ------ |
| `--reset` | Borra lo demo y lo recrea (con `--real`, solo borra salvo que se pasen `--emails`) |
| `--borrar` | Solo borra lo demo |
| `--real`, `--emails`, `--dry-run`, `--yes` | Modo proyecto real, ver [arriba](#usar-los-datos-en-el-proyecto-real). `--yes` quita la confirmación y no se admite con `--reset` ni `--borrar` |
| `--solo-base` | Crea cuentas, perfiles y banco, sin historial |
| `--directo` | Escribe el historial por REST sin llamar a la función |

Variables de entorno del script: `DEMO_ACCESS_TOKEN` (solo `--real`), `DEMO_PROJECT_ID` (con `--real`, si se define debe coincidir con `.firebaserc`), `DEMO_QUOTA_PROJECT`, `DEMO_AUTH_EMULATOR_HOST`, `DEMO_FIRESTORE_EMULATOR_HOST` y `DEMO_FUNCTIONS_EMULATOR_HOST`. En modo emulador el proyecto debe empezar con `demo-`, y los hosts solo pueden ser locales (127.0.0.1, localhost o [::1]).
