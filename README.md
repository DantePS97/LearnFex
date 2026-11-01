# LearnFex

LearnFex es una aplicación web educativa y responsive para preparar a estudiantes de grados décimo y undécimo para las pruebas ICFES Saber 11. Ofrece cuestionarios por área y un simulacro completo con temporizador, calificación automática en el servidor con retroalimentación, estadísticas de progreso, puntos de experiencia (XP), niveles, logros y ranking. El registro exige el consentimiento para el tratamiento de datos personales. Incluye además un panel de administración con Dashboard, gestión de usuarios, preguntas, simulacros y logros, reportes por área y la configuración general.

Es un proyecto académico del equipo SENA (Guamal, Magdalena). Los documentos de diseño están en `docs/`: Especificación de Requisitos (ERS), Diseño de Software (SDD) y Plan de Proyecto, en formato `.docx`.

## Contenido

- [Stack tecnológico](#stack-tecnológico)
- [Requisitos previos](#requisitos-previos)
- [Instalación](#instalación)
- [Variables de entorno](#variables-de-entorno)
- [Scripts disponibles](#scripts-disponibles)
- [Desarrollo local con la Emulator Suite](#desarrollo-local-con-la-emulator-suite)
- [Carga de datos iniciales (seed)](#carga-de-datos-iniciales-seed)
- [Datos de demostración](#datos-de-demostración)
- [Estructura del proyecto](#estructura-del-proyecto)
- [Pruebas](#pruebas)
- [Despliegue](#despliegue)
- [Documentación](#documentación)

## Stack tecnológico

| Capa | Tecnología |
| ---- | ---------- |
| Interfaz | React 19, React Router 7, React Icons, CSS plano |
| Build y servidor de desarrollo | Vite 8 |
| Autenticación | Firebase Authentication (correo y contraseña) |
| Base de datos | Cloud Firestore |
| Lógica de servidor | Cloud Functions for Firebase (Node.js 22, 2.ª generación), función `calificarPrueba` |
| Calidad | ESLint 10; pruebas de la función con el ejecutor nativo de Node (`node --test`) |

## Requisitos previos

- Node.js 22 (LTS). Vite 8 exige Node `^20.19.0` o `>=22.12.0`, y `functions/package.json` declara Node 22 en `engines`.
- npm (viene con Node.js).
- Un proyecto de Firebase si se va a trabajar contra servicios reales. La Cloud Function requiere el plan Blaze para desplegarse.
- Firebase CLI (`firebase-tools`) para emuladores y despliegues: `npm install -g firebase-tools`.
- Java (JDK) instalado: lo necesitan los emuladores de Firebase, en particular el de Firestore.

## Instalación

```bash
git clone https://github.com/omarsantiago753/LearnFex.git
cd LearnFex

# Dependencias del cliente
npm install

# Dependencias de la Cloud Function (solo si se van a usar emuladores, pruebas o despliegue de funciones)
cd functions
npm install
cd ..
```

Después hay que crear el archivo de variables de entorno (ver la sección siguiente).

## Variables de entorno

El cliente lee su configuración de Firebase desde variables `VITE_*`. Se definen en un archivo `.env.local` en la raíz del repositorio. Ese archivo no se versiona: el `.gitignore` ignora `.env`, `.env.production`, `.env.development`, `.env.test` y cualquier archivo `*.local`.

| Variable | Para qué sirve | Obligatoria | Secreta | Quién la lee |
| -------- | -------------- | ----------- | ------- | ------------ |
| `VITE_FIREBASE_API_KEY` | Clave de API de la app web de Firebase | Sí | No (pública) | Cliente y seed |
| `VITE_FIREBASE_AUTH_DOMAIN` | Dominio de autenticación del proyecto | Sí | No (pública) | Cliente y seed |
| `VITE_FIREBASE_PROJECT_ID` | ID del proyecto de Firebase | Sí | No (pública) | Cliente y seed |
| `VITE_FIREBASE_STORAGE_BUCKET` | Bucket de Cloud Storage del proyecto | Sí | No (pública) | Cliente y seed |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | ID del remitente de mensajería del proyecto | Sí | No (pública) | Cliente y seed |
| `VITE_FIREBASE_APP_ID` | ID de la app web de Firebase | Sí | No (pública) | Cliente y seed |
| `VITE_USE_EMULATORS` | Con el valor `true` conecta el cliente a la Emulator Suite local | No (solo desarrollo) | No | Cliente |
| `SEED_ADMIN_EMAIL` | Correo del usuario administrador con el que el seed se autentica | Solo para el seed | Sí | Seed |
| `SEED_ADMIN_PASSWORD` | Contraseña de ese usuario administrador | Solo para el seed | Sí: nunca se versiona | Seed |
| `SEED_USE_EMULATORS` | Con el valor `true` el seed escribe en los emuladores y no en un proyecto real | No | No | Seed |

Puntos que conviene tener claros:

- La configuración web de Firebase no es un secreto: viaja dentro del código que se envía al navegador. Aun así se maneja por variables de entorno para poder cambiar de proyecto (desarrollo, pruebas, producción) sin tocar el código.
- Los valores salen de la Consola de Firebase, en Configuración del proyecto, pestaña General, sección Tus apps, opción SDK.
- Las variables `VITE_*` se inyectan en tiempo de build, no en tiempo de ejecución. En un hosting hay que definirlas antes de construir; si se cambian después, hay que volver a construir y publicar.
- `VITE_USE_EMULATORS` no debe ser `true` en producción: el cliente intentaría conectarse a `127.0.0.1`.
- La carpeta `functions/` no usa variables de entorno propias.
- El repositorio incluye un archivo `.env.example`, versionado, como plantilla con valores de ejemplo (nunca poner valores reales ahí). El bloque listo para copiar a `.env.local` y el detalle de cada variable están en [`docs/variables-de-entorno.md`](docs/variables-de-entorno.md).

## Scripts disponibles

Raíz del repositorio (`package.json`):

| Comando | Qué hace |
| ------- | -------- |
| `npm run dev` | Inicia el servidor de desarrollo de Vite con recarga en caliente |
| `npm run build` | Genera el build de producción en `dist/` (`vite build`) |
| `npm run preview` | Sirve localmente el build generado, para revisarlo |
| `npm run lint` | Ejecuta ESLint sobre todo el repositorio |
| `npm run emuladores` | Inicia la Emulator Suite con el proyecto de demostración (`firebase emulators:start --project demo-learnfex`) |
| `npm run seed:demo` | Carga cuentas y datos de demostración en los emuladores (ver [Datos de demostración](#datos-de-demostración)) |
| `npm run seed:demo:reset` | Borra lo de demostración y lo vuelve a crear |

Carpeta `functions/` (`functions/package.json`):

| Comando | Qué hace |
| ------- | -------- |
| `npm test` | Ejecuta las pruebas unitarias con `node --test` |
| `npm run serve` | Inicia solo el emulador de Functions (`firebase emulators:start --only functions`) |
| `npm run logs` | Muestra los registros de la función desplegada (`firebase functions:log`) |

Nota: `npm run lint` reporta hallazgos preexistentes en el código (en la fecha de este documento, 15 errores y 2 advertencias). Un cambio nuevo no debería aumentar ese número. La carpeta `.claude/` (copias de trabajo locales, no versionadas) está excluida del análisis.

## Desarrollo local con la Emulator Suite

La Emulator Suite permite desarrollar sin tocar un proyecto real. El archivo `firebase.json` configura estos emuladores:

| Emulador | Puerto |
| -------- | ------ |
| Authentication | 9099 |
| Firestore | 8080 |
| Functions | 5001 |
| Interfaz de los emuladores (UI) | 4000 |

Pasos:

1. Instalar las dependencias de `functions/` (`cd functions && npm install`).
2. Crear `.env.local` en la raíz con `VITE_USE_EMULATORS=true`, `VITE_FIREBASE_PROJECT_ID=demo-learnfex` y las demás variables `VITE_FIREBASE_*` con cualquier valor de relleno (con un proyecto `demo-*` el emulador no consulta servicios reales).
3. Iniciar los emuladores desde la raíz, indicando el proyecto de demostración:

   ```bash
   firebase emulators:start --project demo-learnfex
   ```

4. En otra terminal, iniciar el cliente:

   ```bash
   npm run dev
   ```

5. Abrir la aplicación en la dirección que muestre Vite y la interfaz de los emuladores en `http://127.0.0.1:4000`.

Cosas a tener en cuenta:

- El archivo `firebase.json` activa `singleProjectMode`: el ID de proyecto del cliente (`VITE_FIREBASE_PROJECT_ID`) debe coincidir con el que se pasa a `--project`.
- Los datos de los emuladores no persisten entre ejecuciones (no hay exportación configurada), así que hay que volver a cargar el seed cada vez.
- Un usuario que se registra en la aplicación siempre queda con rol `estudiante`. Para probar el panel de administración hay que cambiar a mano el campo `rol` de su documento `usuarios/{uid}` a `administrador`, desde la interfaz de los emuladores (pestaña Firestore). Si se carga `npm run seed:demo`, ya hay un administrador y estudiantes de prueba (ver [Datos de demostración](#datos-de-demostración)).
- Los emuladores no exigen los índices compuestos de `firestore.indexes.json`; en un proyecto real sí hacen falta (ver el manual técnico).

## Carga de datos iniciales (seed)

El script `scripts/seed-preguntas.js` carga 5 áreas, 40 preguntas (8 por área) y 3 logros. Usa IDs fijos, por lo que volver a ejecutarlo sobrescribe esos documentos en lugar de duplicarlos.

El script inicia sesión con el SDK de cliente, y las reglas de Firestore solo permiten escribir áreas, preguntas y logros a un administrador. Por eso necesita:

- `SEED_ADMIN_EMAIL` y `SEED_ADMIN_PASSWORD`: un usuario que ya exista en Firebase Authentication y cuyo documento `usuarios/{uid}` tenga `rol: administrador` (el primer administrador siempre se asigna a mano).
- Las seis variables `VITE_FIREBASE_*`, porque reutiliza la misma configuración que el cliente.
- Opcionalmente, `SEED_USE_EMULATORS=true` para escribir en los emuladores (Auth 9099 y Firestore 8080).

El script lee `process.env` y no carga archivos `.env` por sí mismo. Con Node 22 se puede pasar el archivo con la opción nativa `--env-file`:

```bash
node --env-file=.env.local scripts/seed-preguntas.js
```

Eso exige agregar `SEED_ADMIN_EMAIL`, `SEED_ADMIN_PASSWORD` y, si corresponde, `SEED_USE_EMULATORS` al mismo `.env.local` (que está ignorado por git). También se pueden exportar las variables en la terminal antes de ejecutar `node scripts/seed-preguntas.js`.

Advertencia: sin `SEED_USE_EMULATORS=true`, el script escribe en el proyecto de Firebase que indiquen las variables `VITE_FIREBASE_*`. Verificar a qué proyecto apuntan antes de ejecutarlo.

## Datos de demostración

Para mostrar o probar todas las funcionalidades hay un script que crea cuentas y un historial realista: un administrador, estudiantes con perfiles distintos (fuerte, medio, débil en un área, nuevo sin pruebas e inactivo), pruebas repartidas en los últimos días, simulacros, ranking y logros. En los emuladores el historial se genera invocando la Cloud Function `calificarPrueba` real.

Con los puertos estándar libres, desde la raíz y con `npm install` ya hecho:

```bash
npm run emuladores     # terminal 1: emuladores con el proyecto demo-learnfex
npm run seed:demo      # terminal 2: carga cuentas, banco de preguntas e historial
```

Después se inicia el cliente con `VITE_USE_EMULATORS=true` y los demás `VITE_FIREBASE_*` de relleno, pasados en la línea de comandos. Para volver al estado inicial: `npm run seed:demo:reset`.

El script también tiene un modo `--real` para cargar solo el historial de estudiantes ya registrados a mano en el proyecto real, con `--dry-run`, confirmación del proyecto y borrado de lo demo. Escribe con credenciales de administrador del proyecto, que se saltan las reglas de seguridad: leer antes la guía completa, con las cuentas, el guion de demostración y el modo real, en [`docs/datos-demo.md`](docs/datos-demo.md). Los datos de demostración deben borrarse antes de que entren estudiantes reales.

## Estructura del proyecto

```text
.
├── docs/                     Documentación (ERS, SDD, Plan, manuales, QA)
│   └── qa/                   Casos de prueba y ejecuciones de QA
├── functions/                Cloud Functions (Node.js 22)
│   ├── index.js              Registro de funciones y opciones globales (región us-central1)
│   ├── src/                  calificarPrueba, validación, calificación y gamificación
│   └── test/                 Pruebas unitarias (node --test)
├── scripts/
│   ├── seed-preguntas.js     Carga de áreas, preguntas y logros
│   └── seed-demo.js          Cuentas e historial de demostración (emuladores y modo --real)
├── src/
│   ├── pages/                Pantallas (auth, student, admin, legal y la página 404)
│   ├── components/           Componentes reutilizables (Button, Card, Input, Navbar, ...)
│   ├── layouts/              Estructuras de pantalla (StudentLayout, AdminLayout)
│   ├── routes/               Rutas y guardas (PrivateRoutes, AdminRoute)
│   ├── services/             Lógica de aplicación
│   ├── repositories/         Acceso a Firestore
│   ├── config/firebase.js    Inicialización del SDK de Firebase
│   ├── context/, hooks/      Estado de sesión (AuthContext) y hooks (useAuth, useTimer)
│   └── styles/               Variables, reset y estilos globales
├── .env.example              Plantilla de variables de entorno (valores de ejemplo)
├── .firebaserc               Proyecto de Firebase por defecto (learnfex-dev-oscar)
├── firebase.json             Configuración de Firebase y de los emuladores
├── firestore.rules           Reglas de seguridad de Firestore
├── firestore.indexes.json    Índices compuestos de Firestore
└── vercel.json               Reescritura de rutas para la SPA en Vercel
```

La arquitectura está pensada en capas: las pantallas (`pages`) usan los servicios (`services`), los servicios usan los repositorios (`repositories`) y solo los repositorios hablan con Firebase a través de `config/firebase.js`. En la práctica varias pantallas llaman a un repositorio directamente, sin pasar por un servicio; ver el manual técnico.

## Pruebas

Pruebas unitarias de la Cloud Function (calificación, validación de entrada y gamificación):

```bash
cd functions
npm install
npm test
```

El cliente de React no tiene pruebas automatizadas. La verificación funcional se documenta como casos manuales en `docs/qa/`:

| Documento | Contenido |
| --------- | --------- |
| `docs/qa/casos-prueba-simulacros.md` | Cuestionarios por área, simulacro y temporizador |
| `docs/qa/casos-prueba-gamificacion.md` | Calificación, XP, niveles y logros |
| `docs/qa/verificacion-rbac.md` | Control de acceso por roles en rutas y en reglas de Firestore |
| `docs/qa/integracion-end-to-end.md` | Recorrido completo de estudiante y administrador |
| `docs/qa/verificacion-responsive-practica.md` y `docs/qa/verificacion-responsive-sprint5.md` | Verificación responsive |

## Despliegue

El Plan de Proyecto define que el frontend se publica en Vercel y que el backend vive en Firebase. Resumen:

- Frontend: Vercel construye con `npm run build` y publica `dist/`. El archivo `vercel.json` reescribe todas las rutas a `index.html` para que las rutas de React Router funcionen al recargar o abrir un enlace directo. Las variables `VITE_*` deben estar definidas en Vercel antes de construir.
- Backend: se despliega con Firebase CLI y siempre con `--project`. El archivo `.firebaserc` solo define como proyecto por defecto el de desarrollo del equipo (`learnfex-dev-oscar`), así que un comando sin `--project` apuntaría ahí. El orden es obligatorio: primero la función, después el cliente nuevo y por último las reglas.

El procedimiento completo, con los comandos y el motivo del orden, está en el manual técnico.

## Documentación

- [Manual de usuario](docs/manual-usuario.md): uso de la aplicación para estudiantes y administradores.
- [Manual técnico](docs/manual-tecnico.md): arquitectura, modelo de datos, reglas, Cloud Function, despliegue y deuda técnica.
- [Variables de entorno](docs/variables-de-entorno.md): detalle de cada variable y bloque listo para copiar.
- [Datos de demostración](docs/datos-demo.md): cuentas, historial, guion de demostración y modo para el proyecto real.
- [Guion de la presentación](docs/guion-presentacion.md): guion para presentar los avances del proyecto.
- [Documentación de QA](docs/qa/): casos de prueba y resultados de ejecución.
- `docs/LearnFex_ERS.docx`, `docs/LearnFex_SDD.docx`, `docs/Plan_de_Proyecto_LearnFex.docx`: especificación, diseño y plan del proyecto.
- `docs/Mapa_de_Pantallas_Usuario_Cliente.png` y `docs/Mapa_de_Pantallas_Usuario_Administrador.png`: mapas de pantallas del diseño. Son una referencia de diseño; la aplicación implementada no incluye todo lo que muestran (ver las limitaciones conocidas en el manual de usuario).
