# Manual de usuario de LearnFex

LearnFex es una aplicación web para practicar las áreas de la prueba ICFES Saber 11. Funciona en el navegador, en computador, tablet o celular, y no necesita instalación. Este manual explica cómo usarla con el rol de estudiante y con el rol de administrador.

Este documento describe lo que la aplicación hace hoy. Lo que está en el diseño pero todavía no existe se indica en la sección [Limitaciones conocidas](#limitaciones-conocidas).

## Contenido

- [Antes de empezar](#antes-de-empezar)
- [Parte 1. Manual del estudiante](#parte-1-manual-del-estudiante)
- [Parte 2. Manual del administrador](#parte-2-manual-del-administrador)
- [Limitaciones conocidas](#limitaciones-conocidas)
- [Preguntas frecuentes](#preguntas-frecuentes)

## Antes de empezar

- Se necesita un navegador actualizado y conexión a internet. La aplicación no funciona sin conexión.
- Hay dos roles: estudiante y administrador. Todas las cuentas nuevas se crean como estudiante. Solo otro administrador (o el equipo técnico) puede convertir una cuenta en administrador.
- La navegación se adapta al tamaño de la pantalla: en pantallas de 768 píxeles de ancho o más, el menú está en la parte superior; en pantallas más angostas, está en una barra inferior.
- Si se abre una dirección que no existe, aparece la página "Página no encontrada" ("La dirección que abriste no existe.") con el enlace "Volver al inicio". Sin sesión iniciada, ese enlace lleva al inicio de sesión.

---

# Parte 1. Manual del estudiante

## 1. Crear una cuenta

1. En la pantalla de inicio de sesión, tocar "¿No tenés cuenta? Registrate".
2. Completar nombre, apellido, correo, contraseña y confirmación de la contraseña. Todos los campos son obligatorios.
3. La contraseña debe tener al menos 6 caracteres y las dos contraseñas deben coincidir. El correo debe tener un formato válido.
4. Marcar la casilla "Acepto la política de tratamiento de datos personales". Es obligatoria: sin marcarla no se crea la cuenta. El texto de la casilla es un enlace a la política (`/privacidad`), que se abre en una pestaña nueva y se puede leer sin tener cuenta.
5. Tocar "Crear cuenta". Si todo está bien, la aplicación abre directamente la pantalla de Inicio.

Mensajes posibles: "Este correo ya está registrado", "La contraseña es muy débil", "Todos los campos son obligatorios" y "Debés aceptar la política de tratamiento de datos personales para registrarte".

Al crear la cuenta, la aplicación guarda la constancia de que aceptaste la política y la fecha en que lo hiciste. La política explica qué datos se recogen, para qué se usan y quién los ve, y menciona que la aplicación no ofrece una opción para borrar la cuenta o los datos: esa solicitud la gestiona el equipo administrador.

## 2. Iniciar sesión

1. En la pantalla de inicio (`/`), escribir el correo y la contraseña y tocar "Ingresar".
2. Si los datos son correctos, un estudiante entra a Inicio y un administrador entra al panel de administración.
3. Si el correo o la contraseña no son correctos, aparece "Correo o contraseña incorrectos". Por seguridad no se indica cuál de los dos falló.
4. Si un administrador desactivó la cuenta, no se puede entrar: aparece "Tu cuenta está desactivada. Contactá a un administrador." y la sesión se cierra.

Si se intenta abrir una pantalla interna sin haber iniciado sesión, la aplicación lleva de nuevo al inicio de sesión.

Si una cuenta se desactiva mientras tiene la sesión abierta, la aplicación se da cuenta al recargar la página o al abrir una pantalla de resultados: cierra la sesión y, en el inicio de sesión, muestra el mismo aviso. Mientras tanto, las pantallas que consultan datos empiezan a fallar.

## 3. Recuperar la contraseña

1. En el inicio de sesión, tocar "¿Olvidaste tu contraseña?".
2. Escribir el correo de la cuenta y tocar "Enviar instrucciones".
3. La aplicación responde "Si el correo está registrado, te enviamos las instrucciones para restablecer tu contraseña". Revisar la bandeja de entrada y la carpeta de correo no deseado y seguir el enlace del mensaje.

La respuesta es la misma exista o no la cuenta, para no revelar qué correos están registrados.

También se puede pedir el cambio de contraseña con la sesión iniciada: en Perfil, el botón "Configuración" envía ese mismo correo a la dirección de la cuenta.

## 4. Pantalla de Inicio

Al entrar se ve:

- Un saludo con el nombre y la tarjeta "Tu nivel".
- Tres tarjetas: "Puntos" (la experiencia o XP acumulada), "Para subir de nivel" (XP que falta para el siguiente nivel) y "Progreso del nivel" (porcentaje del nivel actual).
- Dos accesos: "Comenzar práctica" y "Ver resultados" (lleva a Estadísticas).
- Las áreas de aprendizaje. Al tocar una, se abre Práctica con esa área filtrada.
- Un bloque para ver el ranking.

El menú principal tiene cinco opciones: Inicio, Práctica, Estadísticas, Ranking y Perfil.

Los puntos y el nivel se leen al iniciar sesión y se vuelven a leer cada vez que se abre una pantalla de resultados. Por eso, al terminar una prueba, Inicio y Perfil ya muestran los puntos nuevos sin recargar la página.

## 5. Practicar por área

1. Abrir Práctica en el menú.
2. Se listan las áreas disponibles: Matemáticas, Lectura Crítica, Ciencias Naturales, Ciencias Sociales y Ciudadanas e Inglés (con los datos iniciales del proyecto). Se puede buscar por nombre en "Buscar área..." o filtrar con los botones de cada área.
3. Tocar un área para empezar un cuestionario de esa área. El botón "+ Nueva práctica" empieza el cuestionario de la primera área de la lista que se ve en pantalla.
4. Para una prueba con las cinco áreas, usar el bloque "Simulacro completo" y tocar "Iniciar simulacro" (ver la sección 7).

En pantallas de 600 píxeles de ancho o menos, los botones "Historial" y "+ Nueva práctica" del encabezado no se muestran; en ese caso se empieza tocando directamente el área, y el historial se abre desde Perfil (ver la sección 9). El bloque "Simulacro completo" se ve en todos los anchos.

## 6. Resolver un cuestionario

Cada vez que se toca un área, la aplicación arma un cuestionario nuevo con hasta 10 preguntas del área, elegidas al azar. Si el área tiene menos de 10 preguntas, entran todas (con los datos iniciales, cada área tiene 8). Las preguntas que se ven son exactamente las que quedan guardadas en ese cuestionario.

Si el área todavía no tiene preguntas, en lugar del cuestionario aparece un mensaje ("El área ... todavía no tiene preguntas.") y el botón "Volver a práctica".

La pantalla del cuestionario no tiene menú: está pensada para concentrarse. Contiene:

- El nombre del área y el contador "Pregunta X de N".
- El temporizador en cuenta regresiva. En pantallas de 700 píxeles de ancho o menos aparece fijo en la parte inferior de la pantalla, siempre visible aunque se desplace la página; en pantallas más anchas está en el encabezado.
- El enunciado y las opciones (A, B, C, D). Se elige una opción tocándola; se puede cambiar de opción las veces que se quiera antes de terminar.
- Los botones "Anterior" y "Siguiente". En la última pregunta, "Siguiente" se reemplaza por "Finalizar".
- La "Navegación de preguntas": una fila de números para saltar a cualquier pregunta. Las preguntas respondidas se marcan distinto de las que faltan.

Cómo funciona el tiempo:

- La duración depende del área. Con los datos iniciales son 20 minutos, y 15 minutos para Inglés.
- El temporizador empieza solo cuando carga el cuestionario. No se puede pausar.
- Si el tiempo llega a cero, la prueba se envía sola con las respuestas dadas hasta ese momento.
- Una pregunta sin responder cuenta como incorrecta. Si al tocar "Finalizar" quedan preguntas sin responder, la aplicación avisa ("Te quedan N pregunta(s) sin responder. ¿Querés finalizar igual?") y se puede cancelar para volver a la prueba. Cuando el tiempo se agota no se pide confirmación: la prueba se envía sola.

Qué no hacer:

- No recargar la página ni salir de la pantalla durante la prueba. Las respuestas solo viven en la pantalla hasta que se envían; si se recarga, la prueba se arma de nuevo desde cero, con otras preguntas y el tiempo completo, y lo respondido se pierde.
- No enviar la misma prueba dos veces. Si el envío se repite, la aplicación abre el resultado ya guardado.

Si el envío falla, aparece "No se pudo enviar tu prueba. Revisá tu conexión y volvé a intentar." junto a un botón "Reintentar". Las respuestas se conservan en la pantalla: revisar la conexión y tocar "Reintentar".

## 7. Simulacro

El simulacro general reúne preguntas de todas las áreas en una sola prueba: con los datos iniciales son 6 preguntas por cada una de las 5 áreas (30 en total), con una duración que suma el tiempo de todas las áreas (95 minutos). Funciona igual que un cuestionario: temporizador, navegación entre preguntas, envío y resultados.

Cómo iniciarlo: en Práctica, en el bloque "Simulacro completo", tocar "Iniciar simulacro". El botón está deshabilitado mientras se cargan las áreas o si no hay ninguna. Los títulos en el historial y en el panel del administrador son "Simulacro general".

Antes de armarlo, la aplicación comprueba que haya al menos 5 áreas configuradas y que cada una tenga al menos una pregunta. Si falta algo, no empieza la prueba y muestra el motivo ("El simulacro necesita 5 áreas y hay N configuradas." o "Faltan preguntas en: ..."), con el botón "Volver a práctica"; en ese caso no se crea ningún cuestionario.

El simulacro cuenta como una prueba más para los puntos, los logros y el historial, pero no suma al progreso por área de Estadísticas.

## 8. Resultados y retroalimentación

Al terminar se abre la pantalla de resultados con:

- El puntaje: un porcentaje de respuestas correctas sobre el total de preguntas.
- La etiqueta "Aprobado" si el puntaje es 60% o más y "No aprobado" si es menor.
- El número de preguntas, correctas e incorrectas, y la fecha.
- Si la prueba desbloqueó algún logro, una tarjeta "¡Logro desbloqueado!" con el nombre de cada logro nuevo.
- Tres botones: "Volver al inicio", "Ver retroalimentación" y "Nuevo cuestionario".

La tarjeta de logro solo aparece justo al terminar la prueba: si se recarga la página de resultados o se abre más tarde desde el historial, ya no se muestra (el logro sigue en Logros).

Con "Ver retroalimentación" se revisa cada pregunta: la opción elegida, la opción correcta, si la respuesta fue correcta o incorrecta y una explicación. Las preguntas pueden aparecer en un orden distinto al que se vio al responder. Si un administrador borró una pregunta después de la prueba, esa pregunta no aparece y la pantalla lo avisa ("1 pregunta de esta prueba ya no está disponible porque fue eliminada del banco." o el equivalente en plural). El botón "Volver a resultados" regresa al resultado.

Los puntos ganados no se muestran en esta pantalla: se ven en Inicio y Perfil, que ya aparecen actualizados.

## 9. Historial

El historial lista todas las pruebas realizadas, de la más reciente a la más antigua. Cada fila muestra el título de la prueba (por ejemplo "Cuestionario de Matemáticas" o "Simulacro general"), la fecha y hora, el tiempo empleado, el puntaje, las correctas, las incorrectas y si fue aprobada. Al tocar una fila se abre su resultado.

Cómo llegar:

- Desde Perfil, con el acceso "Historial" del menú (funciona en cualquier ancho de pantalla, también en el celular).
- Desde Práctica, con el botón "Historial" (solo en pantallas de más de 600 píxeles de ancho).

Si todavía no hay pruebas, la pantalla lo indica y ofrece el botón "Realizar cuestionario". Si no se puede leer el título de una prueba, esa fila muestra "Cuestionario". Los resultados guardados sin tiempo empleado solo muestran la fecha. Si la carga falla, aparece "No se pudo cargar el historial" con el botón "Intentar nuevamente".

## 10. Estadísticas

Abrir Estadísticas en el menú. Muestra:

- "Promedio general": porcentaje de respuestas correctas sobre todas las preguntas respondidas.
- "Pruebas": cuántas pruebas se han realizado.
- "Progreso por área": una barra por área con el porcentaje de aciertos. El color de la barra cambia: 80% o más, entre 60% y 79%, y menos de 60%. Las áreas sin pruebas se indican con "(sin pruebas)" y muestran 0%. Si todavía no se hizo ninguna prueba, en lugar de las barras aparece "Todavía no tienes progreso registrado." con el botón "Comenzar una práctica".
- "Temas recomendados": hasta dos áreas con menos de 60% de aciertos, empezando por las más bajas. Solo se recomiendan áreas en las que ya se hizo al menos una prueba. Si no hay ninguna prueba, la sección pide hacer la primera práctica; si hay pruebas y todas las áreas tienen 60% o más, muestra "¡Muy bien! Ninguna área está por debajo del 60%.".

Los simulacros suman al total y al promedio general, pero no al progreso de ningún área.

## 11. Ranking

Abrir Ranking en el menú. Se ve:

- El podio con los tres primeros.
- La clasificación con la posición, el nombre, el nivel y los puntos de cada estudiante. Se cargan 20 por vez; el botón "Cargar más" agrega los siguientes.
- Tu fila resaltada con la insignia "Tú". Si no estás entre los que se ven, aparece la tarjeta "Tu posición actual" con tu número.

El ranking ordena por puntos (XP). El nombre y el nivel de cada fila se actualizan al terminar una prueba. En el celular la tabla se adapta: los puntos de cada estudiante se ven siempre; en pantallas de 550 píxeles de ancho o menos se oculta la columna del nivel. Cada fila muestra el nombre (sin el apellido).

## 12. Puntos, niveles y logros

- Cada respuesta correcta suma 10 puntos de experiencia (XP). Una prueba suma como máximo 100 XP.
- El nivel sube cada 1000 XP y nunca baja.
- Los logros se obtienen automáticamente según cuántas pruebas se han completado. Con los datos iniciales hay tres: "Primer paso" (1 prueba), "Estudiante dedicado" (5 pruebas) y "Maestro de las áreas" (10 pruebas). Cuentan las pruebas completadas, sin importar el puntaje.
- Cuando una prueba desbloquea un logro, la pantalla de resultados lo avisa con "¡Logro desbloqueado!" y el nombre del logro.
- Para ver todos los logros, ir a Perfil y tocar "Logros". Cada logro aparece como "Bloqueado" o "Desbloqueado" con su fecha.

## 13. Perfil

Abrir Perfil en el menú. Se ve el correo, el rol, el XP y el nivel (solo lectura), un menú y un formulario.

Formulario: se pueden cambiar nombre, apellido y colegio. Tocar "Guardar cambios"; aparece "Cambios guardados correctamente". El correo, el rol, el XP y el nivel no se pueden editar.

Menú:

- "Logros": abre la lista de logros.
- "Mi progreso": abre Estadísticas.
- "Historial": abre el historial de pruebas (ver la sección 9).
- "Configuración": envía un correo para cambiar la contraseña a la dirección de la cuenta. No abre otra pantalla; aparece el aviso "Te enviamos un correo para cambiar tu contraseña".
- "Cerrar sesión": pide confirmación y, al aceptar, vuelve al inicio de sesión.

## 14. Cerrar sesión

En Perfil, tocar "Cerrar sesión" y aceptar el aviso "¿Estás seguro de que querés cerrar sesión?". La aplicación vuelve al inicio de sesión. Al cerrar sesión ya no se puede abrir ninguna pantalla interna.

---

# Parte 2. Manual del administrador

Solo las cuentas con rol de administrador pueden usar el panel. Una cuenta de estudiante que escribe una dirección del panel es llevada a Inicio.

## 1. Ingresar al panel

Iniciar sesión como se explica en la parte del estudiante. Una cuenta de administrador entra directamente al Dashboard (`/admin`).

El panel tiene su propio menú con siete secciones y el botón "Cerrar sesión": Dashboard, Usuarios, Preguntas, Simulacros, Logros, Reportes y Configuración. En pantallas angostas, el menú pasa a la parte inferior.

Un administrador también puede abrir las pantallas de estudiante escribiendo su dirección (por ejemplo `/inicio` o `/perfil`).

## 2. Dashboard

Muestra cuatro tarjetas:

- "Usuarios totales": cuentas registradas.
- "Simulacros realizados": cantidad de pruebas completadas por los estudiantes (cuestionarios y simulacros).
- "Preguntas en banco": preguntas disponibles.
- "Promedio general": promedio de los puntajes de todas las pruebas.

Debajo, "Actividad reciente" lista las últimas 8 pruebas con el nombre del estudiante, el puntaje y cuánto tiempo pasó.

## 3. Usuarios

Lista las cuentas con nombre, correo, rol y estado, de a 10. El botón "Cargar más" trae las siguientes.

- Buscar: el cuadro "Buscar usuario" filtra por nombre o correo, pero solo entre las cuentas ya cargadas. Para buscar una cuenta que no se ve, primero hay que tocar "Cargar más".
- Ver detalle: abre una ventana con nombre, correo, rol, estado, XP, nivel y colegio.
- Cambiar el rol: el selector de la fila cambia entre Estudiante y Administrador. El cambio se guarda al instante, sin pedir confirmación. La persona afectada lo nota cuando recarga la página o vuelve a iniciar sesión.
- Desactivar o activar una cuenta: el botón de la fila pide confirmación y cambia el estado entre Activo e Inactivo. Una cuenta inactiva no puede iniciar sesión (ve "Tu cuenta está desactivada. Contactá a un administrador."); si ya tenía la sesión abierta, se le cierra al recargar o al abrir una pantalla de resultados, y mientras tanto las consultas a los datos dejan de funcionar. Una cuenta de administrador desactivada también pierde los permisos de administración.
- Tu propia fila: el selector de rol y el botón de estado de tu propia cuenta están deshabilitados. Un administrador no puede cambiar su propio rol ni desactivar su propia cuenta (si se intenta, aparece "No podés cambiar tu propio rol. Pedile a otro administrador que lo haga." o el aviso equivalente para el estado). Sí puede cambiar su nombre, apellido y colegio desde Perfil.

La aplicación no comprueba cuántos administradores activos quedan: un administrador puede degradar o desactivar a otro sin ese control. Si alguna vez no queda ninguno, el equipo técnico debe asignar el rol directamente en la base de datos.

## 4. Preguntas

Muestra el banco de preguntas con el área, la dificultad, el enunciado y las opciones (la opción correcta está resaltada).

- Filtros: buscar por texto (enunciado o explicación), filtrar por área escribiendo su ID (por ejemplo `matematicas`; el campo sugiere los IDs de las preguntas cargadas) y filtrar por dificultad.
- Crear una pregunta: tocar "+ Nueva pregunta". En la ventana completar:
  - Enunciado (obligatorio).
  - Área / areaId: el ID del área. Con los datos iniciales son `matematicas`, `lectura_critica`, `ciencias_naturales`, `sociales_ciudadanas` e `ingles`. La pantalla no comprueba que el ID exista: un ID mal escrito crea una pregunta que ningún cuestionario usará.
  - Dificultad: Baja, Media o Alta (Media por defecto).
  - Opciones: mínimo dos; con "+ Agregar opción" se suman más y con la "x" se quitan. Se identifican con letras A, B, C, etc.
  - Respuesta correcta: se elige de la lista de opciones.
  - Explicación: texto que verán los estudiantes en la retroalimentación.
- Editar: el botón "Editar" abre la misma ventana con los datos de la pregunta.
- Eliminar: el botón "Eliminar" pide confirmación y borra la pregunta de forma permanente. El aviso advierte que, si la pregunta ya se usó en pruebas completadas, esos resultados dejarán de mostrarla en la retroalimentación de los estudiantes, y que la acción no se puede deshacer. La aplicación no indica cuántas pruebas la usaron.

Si falta un dato obligatorio, aparecen mensajes como "El enunciado es obligatorio." o "Debes seleccionar una respuesta correcta.". Los mensajes se muestran en la parte superior de la pantalla.

Nota sobre la dificultad: tanto los datos iniciales como el formulario y el filtro usan los valores baja, media y alta (se muestran como Baja, Media y Alta). Una pregunta que se haya guardado desde el panel con una versión anterior de la aplicación podría tener el valor antiguo `facil` o `dificil`: el filtro "Baja" o "Alta" no la encuentra y la lista muestra el valor tal como está guardado. Si existe alguna, editarla y volver a elegir la dificultad.

## 5. Simulacros

Lista todos los cuestionarios y simulacros que se han armado, del más reciente al más antiguo, de a 10, con las columnas Nombre, Tipo, Área, Creado y Estado. Cada vez que un estudiante empieza una prueba se crea una fila nueva (también si la abandona), por lo que la lista crece rápido. El botón "Cargar más" aparece mientras haya más páginas.

La única acción es "Desactivar" (con confirmación), que cambia el estado a inactivo. La fila no se borra. Por ahora esta pantalla no sirve para crear ni editar simulacros, y desactivar un cuestionario no impide que los estudiantes sigan practicando. En pantallas angostas la tabla se desplaza hacia los lados.

## 6. Logros

"Configuración de Logros" muestra el catálogo de logros y un formulario para crear uno nuevo:

1. Escribir el nombre y la descripción (ambos obligatorios).
2. Elegir el criterio: `primer_quiz` (1 prueba completada), `cinco_simulacros` (5 pruebas) o `diez_simulacros` (10 pruebas).
3. Tocar "Crear logro".

Si falta el nombre o la descripción, no se crea nada y no se muestra ningún mensaje. Un logro nuevo se otorga automáticamente a cada estudiante la próxima vez que termine una prueba y cumpla el criterio. Desde esta pantalla no se pueden editar ni borrar logros.

## 7. Reportes

Muestra "Total usuarios", "Total pruebas" y "Promedio general" (con el símbolo %), y debajo "Desempeño por área" con una barra y el promedio de puntaje de cada área. Los simulacros cuentan en el promedio general pero no en ningún área.

## 8. Configuración

"Configuración general" permite editar el nombre de la aplicación (obligatorio), la descripción y el correo de soporte, y guardarlos con "Guardar cambios" ("Guardado" confirma). Estos datos se almacenan, pero hoy ninguna pantalla de estudiante los muestra.

Las áreas (Matemáticas, Lectura Crítica, etc.) no se administran desde el panel: se cargan con el script de datos iniciales o directamente en Firestore.

## 9. Cerrar sesión

Tocar "Cerrar sesión" en el panel y aceptar el aviso de confirmación. La aplicación vuelve al inicio de sesión.

---

# Limitaciones conocidas

Estas funciones aparecen en los documentos de diseño o en los mapas de pantallas, pero no existen en la aplicación actual:

- No hay tema claro y oscuro: la aplicación tiene un solo aspecto.
- No hay foto de perfil.
- No hay recuperación sin conexión ni modo sin conexión: sin internet la aplicación no funciona.
- No hay notificaciones fuera de la aplicación; el único aviso es la tarjeta "¡Logro desbloqueado!" de la pantalla de resultados.
- No hay pantalla de bienvenida previa al inicio de sesión ni verificación en dos pasos.
- La política de tratamiento de datos dice que el equipo debe publicar en la aplicación los datos del responsable y un correo de soporte, pero la aplicación todavía no los muestra en ninguna pantalla. Tampoco hay una opción para eliminar la cuenta o los datos: esa solicitud la gestiona el equipo administrador.
- No se puede pausar una prueba ni retomarla después de recargar; tampoco marcar preguntas para revisar.
- El historial carga todas las pruebas de una vez, sin páginas.
- No hay racha de días ni ranking semanal o mensual: el ranking es único y por puntos.
- El rol de una cuenta se lee al iniciar sesión: un cambio de rol hecho por un administrador solo se nota al recargar la página o volver a entrar.
- El panel no permite crear ni editar simulacros, administrar las áreas, editar o borrar logros, ni borrar usuarios.
- Desactivar una cuenta restringe su acceso, pero no la elimina ni la quita del servicio de inicio de sesión.

---

# Preguntas frecuentes

**No veo mis puntos actualizados después de una prueba.** Inicio y Perfil se actualizan al abrir la pantalla de resultados. Si no cambian, recargar la página con la tecla F5. Si siguen sin cambiar pero el resultado de la prueba sí figura en el historial, avisar al equipo técnico: puede haber fallado el cálculo de los puntos de esa prueba.

**Recargué durante una prueba y se reinició.** Es el comportamiento actual: las respuestas no se guardan hasta enviar la prueba. Hay que empezar de nuevo.

**Terminé una prueba y no aparece el logro.** Los logros se otorgan al terminar la prueba, según el número de pruebas completadas, y la pantalla de resultados los avisa solo en ese momento. Para ver todos, abrir Perfil, tocar "Logros" y, si hace falta, recargar la página.

**Me dice que mi cuenta está desactivada.** Un administrador desactivó la cuenta. Hay que pedirle a un administrador que la vuelva a activar desde Usuarios.

**¿Dónde leo la política de tratamiento de datos?** En la pantalla de registro, tocando el texto de la casilla de aceptación, o escribiendo `/privacidad` en la barra de direcciones; no hace falta tener sesión.

**Olvidé mi contraseña.** Usar "¿Olvidaste tu contraseña?" en el inicio de sesión.

**Quiero ser administrador.** Un administrador puede cambiar el rol desde Usuarios. Si no existe ningún administrador, el equipo técnico debe asignarlo directamente en la base de datos (ver el manual técnico).
