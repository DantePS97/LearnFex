# Variables de entorno

Este documento describe todas las variables de entorno que lee el código de LearnFex. Se obtuvo buscando `import.meta.env` y `process.env` en el repositorio: el cliente las lee en `src/config/firebase.js` y el script de carga de datos en `scripts/seed-preguntas.js`. La carpeta `functions/` no lee ninguna variable de entorno propia.

El repositorio incluye un archivo `.env.example`, versionado, que sirve de plantilla con valores de ejemplo (así lo describe el commit que lo agregó; este documento no reproduce su contenido). Para trabajar, copiarlo a un archivo `.env.local` en la raíz del repositorio (ignorado por git) y reemplazar los valores; el bloque de la sección [Bloque listo para copiar](#bloque-listo-para-copiar) tiene todas las variables que lee el código y puede usarse igual. `.env.example` nunca debe llevar valores reales.

## Cliente (Vite)

Estas variables se leen con `import.meta.env` en `src/config/firebase.js`. Vite solo expone al navegador las variables cuyo nombre empieza con `VITE_`.

| Variable | Para qué sirve | Obligatoria | Pública o secreta | De dónde sale |
| -------- | -------------- | ----------- | ----------------- | ------------- |
| `VITE_FIREBASE_API_KEY` | Clave de API que identifica la app web ante los servicios de Firebase | Sí | Pública | Consola de Firebase, SDK |
| `VITE_FIREBASE_AUTH_DOMAIN` | Dominio que usa Firebase Authentication (por lo general `<proyecto>.firebaseapp.com`) | Sí | Pública | Consola de Firebase, SDK |
| `VITE_FIREBASE_PROJECT_ID` | ID del proyecto de Firebase; determina qué Firestore y qué funciones se usan | Sí | Pública | Consola de Firebase, SDK |
| `VITE_FIREBASE_STORAGE_BUCKET` | Bucket de Cloud Storage. Se inicializa, pero hoy ninguna pantalla sube ni descarga archivos | Sí (el SDK lo recibe en la configuración) | Pública | Consola de Firebase, SDK |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | ID del remitente de mensajería del proyecto | Sí (el SDK lo recibe en la configuración) | Pública | Consola de Firebase, SDK |
| `VITE_FIREBASE_APP_ID` | ID de la app web registrada en el proyecto | Sí | Pública | Consola de Firebase, SDK |
| `VITE_USE_EMULATORS` | Si vale exactamente `true`, el cliente se conecta a los emuladores locales (Auth 9099, Firestore 8080, Functions 5001) | No | No aplica | Se escribe a mano |

Cómo obtener los seis valores `VITE_FIREBASE_*`:

1. Entrar a la Consola de Firebase y abrir el proyecto.
2. Ir a Configuración del proyecto (icono de engranaje), pestaña General.
3. En la sección Tus apps, elegir la app web (si no existe, registrarla).
4. En la opción SDK, elegir "Config" y copiar los valores del objeto `firebaseConfig` a las variables correspondientes.

Sobre su carácter público: la configuración web de Firebase no es un secreto, porque el navegador la recibe tal cual. Lo que protege los datos son las reglas de seguridad de Firestore y la autenticación, no el ocultamiento de estos valores. Aun así se manejan por variables de entorno para no dejar la configuración de un proyecto fijada en el código y poder usar proyectos distintos por entorno.

Cuándo se leen: las variables `VITE_*` se sustituyen en el código durante el build (`npm run build`) o al iniciar el servidor de desarrollo (`npm run dev`). No se pueden cambiar en un sitio ya construido. Por eso, en un hosting como Vercel hay que definirlas en la configuración del proyecto antes de construir, y si cambian hay que construir y publicar otra vez.

Sobre `VITE_USE_EMULATORS`: es solo para desarrollo local. No debe valer `true` en producción, porque el cliente intentaría conectarse a `127.0.0.1` y la aplicación no funcionaría para los usuarios. Si no se define, se comporta como falso.

Con `VITE_USE_EMULATORS=true`, la variable `VITE_FIREBASE_PROJECT_ID` debe coincidir con el proyecto con el que se inician los emuladores (`demo-learnfex`), porque `firebase.json` activa `singleProjectMode`.

## Script de carga de datos (`scripts/seed-preguntas.js`)

El script lee con `process.env` las seis variables `VITE_FIREBASE_*` anteriores (con el mismo significado) y las siguientes:

| Variable | Para qué sirve | Obligatoria | Pública o secreta | De dónde sale |
| -------- | -------------- | ----------- | ----------------- | ------------- |
| `SEED_ADMIN_EMAIL` | Correo de un usuario administrador con el que el script inicia sesión | Sí | Dato personal; no se versiona | Un usuario ya creado en Authentication |
| `SEED_ADMIN_PASSWORD` | Contraseña de ese usuario | Sí | Secreta: nunca se versiona ni se comparte | La define quien administra la cuenta |
| `SEED_USE_EMULATORS` | Si vale exactamente `true`, el script escribe en los emuladores (Auth 9099, Firestore 8080) en lugar de un proyecto real | No | No aplica | Se escribe a mano |

Si falta `SEED_ADMIN_EMAIL` o `SEED_ADMIN_PASSWORD`, el script termina con un mensaje de error antes de conectarse.

El usuario administrador debe existir en Firebase Authentication y su documento `usuarios/{uid}` debe tener `rol: administrador`; las reglas de Firestore exigen ese rol para escribir áreas, preguntas y logros. El primer administrador se asigna siempre a mano, editando el documento en la consola de Firestore (o en la interfaz de los emuladores).

## Script de datos de demostración (`scripts/seed-demo.js`)

Este script no usa las variables `VITE_*` ni `SEED_*`. Sus variables, todas opcionales salvo la primera en modo `--real`, se explican en [datos-demo.md](datos-demo.md): `DEMO_ACCESS_TOKEN` (secreta: token de acceso, solo modo `--real`, nunca se versiona ni se imprime), `DEMO_PROJECT_ID`, `DEMO_QUOTA_PROJECT`, `DEMO_AUTH_EMULATOR_HOST`, `DEMO_FIRESTORE_EMULATOR_HOST` y `DEMO_FUNCTIONS_EMULATOR_HOST`.

## Reglas de manejo

- No versionar nunca `SEED_ADMIN_PASSWORD` ni ningún archivo que la contenga.
- El `.gitignore` del repositorio ignora `.env`, `.env.production`, `.env.development`, `.env.test` y `*.local` (por lo que `.env.local` queda ignorado). Vite carga `.env.<modo>` para cualquier modo, así que un archivo con otro nombre (por ejemplo `.env.staging`) no está cubierto: no guardar valores reales en él o agregarlo al `.gitignore`.
- `.env.example` sí está versionado y debe contener solo valores de ejemplo; nunca valores reales.
- Si se publica el sitio en Vercel, cargar las variables `VITE_*` en la configuración del proyecto (Settings, Environment Variables) para los entornos que correspondan. No cargar `VITE_USE_EMULATORS` o dejarla en `false`.

## Bloque listo para copiar

Copiar a un archivo `.env.local` en la raíz del repositorio y reemplazar los valores. Todos los valores de ejemplo son ficticios.

```dotenv
# --- Cliente (Vite): configuración web de Firebase ---
# Consola de Firebase > Configuración del proyecto > General > Tus apps > SDK.
VITE_FIREBASE_API_KEY=tu-api-key
VITE_FIREBASE_AUTH_DOMAIN=tu-proyecto.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=tu-proyecto
VITE_FIREBASE_STORAGE_BUCKET=tu-proyecto.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=000000000000
VITE_FIREBASE_APP_ID=1:000000000000:web:0000000000000000000000

# Solo desarrollo local con la Emulator Suite. Nunca "true" en producción.
VITE_USE_EMULATORS=false

# --- Script de carga de datos (scripts/seed-preguntas.js) ---
# Usuario administrador existente en Authentication, con rol "administrador" en usuarios/{uid}.
SEED_ADMIN_EMAIL=admin@ejemplo.com
SEED_ADMIN_PASSWORD=cambiar-esta-contrasena
# "true" para cargar el seed en los emuladores en lugar de un proyecto real.
SEED_USE_EMULATORS=false
```

Para trabajar con emuladores, cambiar estos valores:

```dotenv
VITE_FIREBASE_PROJECT_ID=demo-learnfex
VITE_USE_EMULATORS=true
SEED_USE_EMULATORS=true
```

Para ejecutar el seed leyendo ese archivo (Node 22 o superior):

```bash
node --env-file=.env.local scripts/seed-preguntas.js
```
