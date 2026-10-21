# Guion de la presentación de avances de LearnFex

Pensado para unos 15 minutos: 2 de contexto, 10 de demostración, 3 de cierre y preguntas. Los tiempos son una guía.

La demostración usa el **proyecto real** (`learnfex-dev-oscar`) con las cuentas de prueba `@demo.test`. Si algo falla, el plan B es el emulador local (ver [datos-demo.md](datos-demo.md)).

## 1. Mensaje central (30 segundos)

> LearnFex ya permite que un estudiante se registre con su consentimiento, practique por áreas y haga un simulacro completo, y vea su progreso, su ranking y sus logros. Un administrador gestiona usuarios, preguntas, simulacros y logros desde su propio panel. La calificación se hace en el servidor, no en el navegador, y las reglas de seguridad separan lo que puede hacer cada rol.

## 2. Qué se logró (1 minuto y medio)

Decí esto sin leer, con tus palabras:

- **Para el estudiante:** registro con consentimiento de datos y política de privacidad, práctica por área, simulacro completo (30 preguntas, 95 minutos), retroalimentación con explicación, Estadísticas con temas recomendados, Ranking, Logros, Historial y Perfil con XP y nivel reales.
- **Para el administrador:** Dashboard con datos reales, Usuarios (activar y desactivar), Preguntas con dificultad baja, media y alta, Simulacros, Logros, Reportes por área y Configuración.
- **Detrás de escena:** una Cloud Function (`calificarPrueba`) califica, calcula XP, nivel, ranking y logros. Las reglas de Firestore controlan el acceso por rol, y una cuenta inactiva no puede leer ni escribir.
- **Calidad y entrega:** QA de seguridad (RBAC) e integración ejecutadas y documentadas, manual de usuario y manual técnico, README y variables de entorno documentadas.
- **Cómo se trabajó:** tablero Kanban con tarjetas por sprint, ramas y pull requests revisados, y las estudiantes con su autoría preservada en el historial.

No cites porcentajes de cumplimiento de la ERS sin volver a medirlos.

## 3. Antes de empezar (30 minutos antes)

- [ ] `git switch main && git pull` y confirmar que no hay cambios sin guardar.
- [ ] Abrir la aplicación y entrar con **cada** cuenta una vez (Valentina, Camila, Daniela, el administrador). Confirmar que funciona y cerrar sesión.
- [ ] Verificar que **Daniela** está **activa** y sin pruebas (la vas a desactivar durante la demo).
- [ ] Tener dos ventanas del navegador: una en modo normal y otra en privado, para cambiar de cuenta sin cerrar sesión cada vez.
- [ ] Internet estable. Si hay duda, tener el emulador levantado en otra ventana como plan B.
- [ ] Cerrar notificaciones y pestañas personales. Zoom del navegador al 110 o 125 % para que se lea en la sala.
- [ ] Tener a mano las contraseñas de las cuentas de prueba (en un lugar que no se proyecte).

## 4. Demostración (10 minutos)

| Min | Pantalla | Qué hacer | Qué decir |
| --- | -------- | --------- | --------- |
| 0:00 | Registro | Crear una cuenta nueva y marcar la política de datos | "El consentimiento es obligatorio y queda registrado con fecha." Entrás a Inicio con 0 puntos y nivel 1. |
| 1:00 | Estados vacíos (cuenta nueva o Daniela) | Mostrar Estadísticas, Historial y Logros | "Un estudiante nuevo ve estados vacíos reales, no datos inventados." |
| 2:00 | Práctica | Elegir un área, responder unas preguntas y finalizar | "Las respuestas correctas no se calculan en el navegador: viaja el envío y el servidor califica." |
| 3:30 | Resultados | Ver puntaje, "Ver retroalimentación" y el logro "Primer paso" | "El XP, el nivel y el logro los calculó la Cloud Function." Volver a Inicio: los puntos ya cambiaron. |
| 4:30 | Ranking | Abrir Ranking | "Entra al ranking al terminar su primera prueba." |
| 5:00 | Valentina (estudiante fuerte) | Inicio, Estadísticas, Historial, Logros | Nivel 2, 16 pruebas, 3 logros, primer lugar. Mostrar un simulacro en el Historial. |
| 6:00 | Simulacro | Con Valentina, "Iniciar simulacro" y mostrar la pantalla sin terminarlo | 30 preguntas, 95 minutos, temporizador y navegación. |
| 6:45 | Camila (estudiante con dificultades) | Estadísticas | "Temas recomendados" apunta a Matemáticas y Ciencias Naturales: el sistema orienta dónde reforzar. |
| 7:30 | Administrador: Dashboard y Reportes | Entrar como administrador | Tarjetas reales, actividad reciente y desempeño por área. |
| 8:15 | Usuarios | Buscar a Daniela y desactivarla | "Desactivar una cuenta no es solo cambiar una etiqueta." Tu propia fila no se puede desactivar. |
| 9:00 | Cuenta inactiva | En la otra ventana, intentar entrar como Daniela | "Tu cuenta está desactivada. Contactá a un administrador." Las reglas del servidor también la bloquean. |
| 9:30 | Preguntas, Simulacros, Logros, Configuración | Recorrer rápido | Filtro de dificultad, alta de pregunta, catálogo de logros. |

Al terminar, reactivá a Daniela si querés repetir la demostración.

### Si algo falla durante la demostración

- Una pantalla no carga: recargá una vez. Si sigue, seguí con la siguiente y no te detengas a depurar en público.
- Un error de permisos o de inicio de sesión: cambiá a la otra ventana o al emulador local. Decí "tengo un entorno local de respaldo" con naturalidad.
- Nunca digas "esto antes funcionaba". Decí "esto lo muestro con la grabación o en el entorno local".

## 5. Seguridad y arquitectura (1 minuto, si hay tiempo)

- **Dos roles (estudiante y administrador)**, controlados por las reglas de Firestore y no solo por la interfaz.
- **La calificación vive en el servidor.** El cliente no puede darse XP a sí mismo: `resultados`, `respuestas` y logros solo los escribe la función.
- **Cuentas inactivas bloqueadas** en el cliente y en las reglas.
- **Pruebas de seguridad documentadas** en `docs/qa/verificacion-rbac.md`: se encontraron fallas reales, se corrigieron y las reglas corregidas están desplegadas.

## 6. Lo que falta, dicho con honestidad (1 minuto)

Conviene decirlo vos antes de que lo pregunten:

- **Las respuestas correctas son legibles** para un estudiante que use las herramientas del navegador. Es un riesgo aceptado de forma temporal; la solución definitiva (servirlas desde una Cloud Function) está en el backlog. Hasta entonces el ranking y el XP no son confiables frente a un estudiante malintencionado.
- **Banco de preguntas:** hay 42 preguntas de prueba. Falta cargar un banco con preguntas reales tipo ICFES.
- **QA responsive** de algunas pantallas en curso.
- **Pendientes de entrega:** publicar la aplicación, alertas de presupuesto de Firebase, datos de contacto de la política de privacidad y validación legal, prueba con estudiantes reales y volver a ejecutar las pruebas de QA que fallaban antes de las correcciones.

## 7. Preguntas probables

**¿Por qué calificar en una Cloud Function y no en el navegador?** Porque el navegador es del usuario: cualquier estudiante podría modificar el código y asignarse el puntaje máximo. En el servidor, el cliente solo envía sus respuestas.

**¿Qué pasa si desactivo a un usuario que tiene la sesión abierta?** El cliente le cierra la sesión y le muestra el mensaje, y las reglas del servidor dejan de aceptar sus lecturas y escrituras.

**¿Los datos de ejemplo son reales?** No. Son cuentas y resultados de demostración, marcados como tales, que se pueden borrar con un comando antes de que entren estudiantes reales.

**¿Cuánto falta para entregar?** La fecha de entrega es el 06/11/2026. Lo que falta está en la sección 6; lo más importante es el banco de preguntas real y la prueba con estudiantes.

**¿Por qué no cerraron ya lo de las respuestas legibles?** Cerrarlo exige rediseñar la pantalla de retroalimentación, que hoy lee la respuesta correcta directamente. Se evaluó, se registró la decisión en el tablero y se aceptó el riesgo de forma temporal mientras no hay estudiantes reales.

**¿Cómo se organizó el equipo?** Con un tablero Kanban por sprints, una rama por tarea, pull requests y revisión; las contribuciones de cada integrante quedan en el historial de Git.

## 8. Después de la presentación

- Si hubo comentarios o pedidos, anotalos en el tablero ese mismo día.
- Antes de que estudiantes reales usen la aplicación, borrá los datos de demostración:

```bash
npm run seed:demo -- --real --reset
```
