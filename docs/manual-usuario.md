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

---

# Parte 1. Manual del estudiante

## 1. Crear una cuenta

1. En la pantalla de inicio de sesión, tocar "¿No tenés cuenta? Registrate".
2. Completar nombre, apellido, correo, contraseña y confirmación de la contraseña. Todos los campos son obligatorios.
3. La contraseña debe tener al menos 6 caracteres y las dos contraseñas deben coincidir. El correo debe tener un formato válido.
4. Tocar "Crear cuenta". Si todo está bien, la aplicación abre directamente la pantalla de Inicio.

Mensajes posibles: "Este correo ya está registrado", "La contraseña es muy débil" o "Todos los campos son obligatorios".

## 2. Iniciar sesión

1. En la pantalla de inicio (`/`), escribir el correo y la contraseña y tocar "Ingresar".
2. Si los datos son correctos, un estudiante entra a Inicio y un administrador entra al panel de administración.
3. Si el correo o la contraseña no son correctos, aparece "Correo o contraseña incorrectos". Por seguridad no se indica cuál de los dos falló.

Si se intenta abrir una pantalla interna sin haber iniciado sesión, la aplicación lleva de nuevo al inicio de sesión.

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

Los puntos y el nivel se leen una sola vez al iniciar sesión. Después de terminar una prueba pueden verse desactualizados hasta que se recarga la página (tecla F5).

## 5. Practicar por área

1. Abrir Práctica en el menú.
2. Se listan las áreas disponibles: Matemáticas, Lectura Crítica, Ciencias Naturales, Ciencias Sociales y Ciudadanas e Inglés (con los datos iniciales del proyecto). Se puede buscar por nombre en "Buscar área..." o filtrar con los botones de cada área.
3. Tocar un área para empezar un cuestionario de esa área. El botón "+ Nueva práctica" empieza el cuestionario de la primera área de la lista que se ve en pantalla.

En pantallas de 600 píxeles de ancho o menos, los botones "Historial" y "+ Nueva práctica" de esta pantalla no se muestran; en ese caso se empieza tocando directamente el área.

## 6. Resolver un cuestionario

Cada vez que se toca un área, la aplicación arma un cuestionario nuevo con hasta 10 preguntas del área, elegidas al azar. Si el área tiene menos de 10 preguntas, entran todas.

La pantalla del cuestionario no tiene menú: está pensada para concentrarse. Contiene:

- El nombre del área y el contador "Pregunta X de N".
- El temporizador en cuenta regresiva. En pantallas angostas aparece debajo de las preguntas.
- El enunciado y las opciones (A, B, C, D). Se elige una opción tocándola; se puede cambiar de opción las veces que se quiera antes de terminar.
- Los botones "Anterior" y "Siguiente". En la última pregunta, "Siguiente" se reemplaza por "Finalizar".
- La "Navegación de preguntas": una fila de números para saltar a cualquier pregunta. Las preguntas respondidas se marcan distinto de las que faltan.

Cómo funciona el tiempo:

- La duración depende del área. Con los datos iniciales son 20 minutos, y 15 minutos para Inglés.
- El temporizador empieza solo cuando carga el cuestionario. No se puede pausar.
- Si el tiempo llega a cero, la prueba se envía sola con las respuestas dadas hasta ese momento.
- Una pregunta sin responder cuenta como incorrecta. La aplicación no avisa si quedan preguntas sin responder al tocar "Finalizar".

Qué no hacer:

- No recargar la página ni salir de la pantalla durante la prueba. Las respuestas solo viven en la pantalla hasta que se envían; si se recarga, la prueba se arma de nuevo desde cero, con otras preguntas y el tiempo completo, y lo respondido se pierde.
- No enviar la misma prueba dos veces. Si el envío se repite, la aplicación abre el resultado ya guardado.

Si al enviar aparece "No se pudo calificar el cuestionario.", revisar la conexión e intentar de nuevo con "Finalizar".

## 7. Simulacro

El simulacro general reúne preguntas de todas las áreas en una sola prueba: con los datos iniciales son 6 preguntas por cada una de las 5 áreas (30 en total), con una duración que suma el tiempo de todas las áreas (95 minutos). Funciona igual que un cuestionario: temporizador, navegación entre preguntas, envío y resultados.

Estado actual: el simulacro existe, pero la aplicación no tiene ningún botón ni enlace que lo inicie. Hoy solo se llega a él escribiendo `/practica/cuestionario` en la barra de direcciones del navegador, con la sesión iniciada y sin pasar por Práctica. Se recomienda usar ese método solo si el equipo lo indica, y hasta que se agregue un acceso en la interfaz.

El simulacro cuenta como una prueba más para los puntos, los logros y el historial, pero no suma al progreso por área de Estadísticas.

## 8. Resultados y retroalimentación

Al terminar se abre la pantalla de resultados con:

- El puntaje: un porcentaje de respuestas correctas sobre el total de preguntas.
- La etiqueta "Aprobado" si el puntaje es 60% o más y "No aprobado" si es menor.
- El número de preguntas, correctas e incorrectas, y la fecha.
- Tres botones: "Volver al inicio", "Ver retroalimentación" y "Nuevo cuestionario".

Con "Ver retroalimentación" se revisa cada pregunta: la opción elegida, la opción correcta, si la respuesta fue correcta o incorrecta y una explicación. Las preguntas pueden aparecer en un orden distinto al que se vio al responder. Si un administrador borró una pregunta después de la prueba, esa pregunta no aparece en la retroalimentación. El botón "Volver a resultados" regresa al resultado.

Los puntos ganados y los logros nuevos no se muestran en esta pantalla: se ven después en Inicio, Perfil y Logros.

## 9. Historial

El historial lista todas las pruebas realizadas, de la más reciente a la más antigua. Cada fila muestra "Cuestionario", la fecha y hora, el puntaje, las correctas, las incorrectas y si fue aprobada. Al tocar una fila se abre su resultado.

Cómo llegar:

- Desde Práctica, con el botón "Historial" (en pantallas de más de 600 píxeles de ancho).
- Escribiendo `/historial` en la barra de direcciones. En el celular es el único camino hoy.

Si todavía no hay pruebas, la pantalla lo indica y ofrece el botón "Realizar cuestionario". El historial no muestra el área ni el tiempo empleado, y los simulacros también aparecen como "Cuestionario".

## 10. Estadísticas

Abrir Estadísticas en el menú. Muestra:

- "Promedio general": porcentaje de respuestas correctas sobre todas las preguntas respondidas.
- "Pruebas": cuántas pruebas se han realizado.
- "Progreso por área": una barra por área con el porcentaje de aciertos. El color de la barra cambia: 80% o más, entre 60% y 79%, y menos de 60%. Las áreas sin pruebas muestran 0%.
- "Temas recomendados": hasta dos áreas con menos de 60% de aciertos, empezando por las más bajas. Las áreas sin pruebas también se recomiendan.

Los simulacros suman al total y al promedio general, pero no al progreso de ningún área.

## 11. Ranking

Abrir Ranking en el menú. Se ve:

- El podio con los tres primeros.
- La clasificación con la posición, el nombre, el nivel y los puntos de cada estudiante. Se cargan 20 por vez; el botón "Cargar más" agrega los siguientes.
- Tu fila resaltada con la insignia "Tú". Si no estás entre los que se ven, aparece la tarjeta "Tu posición actual" con tu número.

El ranking ordena por puntos (XP). El nombre y el nivel de cada fila se actualizan al terminar una prueba.

## 12. Puntos, niveles y logros

- Cada respuesta correcta suma 10 puntos de experiencia (XP). Una prueba suma como máximo 100 XP.
- El nivel sube cada 1000 XP y nunca baja.
- Los logros se obtienen automáticamente según cuántas pruebas se han completado. Con los datos iniciales hay tres: "Primer paso" (1 prueba), "Estudiante dedicado" (5 pruebas) y "Maestro de las áreas" (10 pruebas). Cuentan las pruebas completadas, sin importar el puntaje.
- Para ver los logros, ir a Perfil y tocar "Logros". Cada logro aparece como "Bloqueado" o "Desbloqueado" con su fecha.

## 13. Perfil

Abrir Perfil en el menú. Se ve el correo, el rol, el XP y el nivel (solo lectura), un menú y un formulario.

Formulario: se pueden cambiar nombre, apellido y colegio. Tocar "Guardar cambios"; aparece "Cambios guardados correctamente". El correo, el rol, el XP y el nivel no se pueden editar.

Menú:

- "Logros": abre la lista de logros.
- "Mi progreso": abre Estadísticas.
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
- Cambiar el rol: el selector de la fila cambia entre Estudiante y Administrador. El cambio se guarda al instante, sin pedir confirmación. La persona afectada lo nota cuando recarga la página o vuelve a iniciar sesión. Tener cuidado: un administrador puede quitarse a sí mismo el rol, y entonces pierde el acceso al panel.
- Desactivar o activar una cuenta: el botón de la fila pide confirmación y cambia el estado entre Activo e Inactivo. Importante: hoy el estado solo se registra y se muestra; una cuenta inactiva todavía puede iniciar sesión y usar la aplicación.

## 4. Preguntas

Muestra el banco de preguntas con el área, la dificultad, el enunciado y las opciones (la opción correcta está resaltada).

- Filtros: buscar por texto (enunciado o explicación), filtrar por área escribiendo su ID (por ejemplo `matematicas`; el campo sugiere los IDs de las preguntas cargadas) y filtrar por dificultad.
- Crear una pregunta: tocar "+ Nueva pregunta". En la ventana completar:
  - Enunciado (obligatorio).
  - Área / areaId: el ID del área. Con los datos iniciales son `matematicas`, `lectura_critica`, `ciencias_naturales`, `sociales_ciudadanas` e `ingles`. La pantalla no comprueba que el ID exista: un ID mal escrito crea una pregunta que ningún cuestionario usará.
  - Dificultad: Fácil, Media o Difícil.
  - Opciones: mínimo dos; con "+ Agregar opción" se suman más y con la "x" se quitan. Se identifican con letras A, B, C, etc.
  - Respuesta correcta: se elige de la lista de opciones.
  - Explicación: texto que verán los estudiantes en la retroalimentación.
- Editar: el botón "Editar" abre la misma ventana con los datos de la pregunta.
- Eliminar: el botón "Eliminar" pide confirmación y borra la pregunta de forma permanente. La aplicación no advierte si la pregunta ya fue usada en pruebas; en la retroalimentación de esas pruebas simplemente deja de aparecer.

Si falta un dato obligatorio, aparecen mensajes como "El enunciado es obligatorio." o "Debes seleccionar una respuesta correcta.". Los mensajes se muestran en la parte superior de la pantalla.

Nota sobre la dificultad: las preguntas de los datos iniciales usan los valores baja, media y alta, mientras que el formulario y el filtro usan Fácil, Media y Difícil. Por eso el filtro "Fácil" o "Difícil" no encuentra las preguntas de los datos iniciales; el filtro "Media" sí coincide con ambas.

## 5. Simulacros

Lista todos los cuestionarios y simulacros que se han armado, del más reciente al más antiguo, de a 10, con las columnas Nombre, Tipo, Área, Creado y Estado. Cada vez que un estudiante empieza una prueba se crea una fila nueva (también si la abandona), por lo que la lista crece rápido. El botón "Cargar más" aparece mientras haya más páginas.

La única acción es "Desactivar" (con confirmación), que cambia el estado a inactivo. La fila no se borra. Por ahora esta pantalla no sirve para crear ni editar simulacros, y desactivar un cuestionario no impide que los estudiantes sigan practicando.

## 6. Logros

"Configuración de Logros" muestra el catálogo de logros y un formulario para crear uno nuevo:

1. Escribir el nombre y la descripción (ambos obligatorios).
2. Elegir el criterio: `primer_quiz` (1 prueba completada), `cinco_simulacros` (5 pruebas) o `diez_simulacros` (10 pruebas).
3. Tocar "Crear logro".

Si falta el nombre o la descripción, no se crea nada y no se muestra ningún mensaje. Un logro nuevo se otorga automáticamente a cada estudiante la próxima vez que termine una prueba y cumpla el criterio. Desde esta pantalla no se pueden editar ni borrar logros.

## 7. Reportes

Muestra "Total usuarios", "Total pruebas" y "Promedio general" (sin el símbolo %), y debajo "Desempeño por área" con una barra y el promedio de puntaje de cada área. Los simulacros cuentan en el promedio general pero no en ningún área.

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
- No hay notificaciones.
- No hay pantalla de bienvenida previa al inicio de sesión, aceptación de términos al registrarse ni verificación en dos pasos.
- El simulacro no tiene botón de acceso (ver la sección 7 de la parte del estudiante).
- No se puede pausar una prueba ni retomarla después de recargar; tampoco marcar preguntas para revisar.
- El historial no muestra el área ni el tiempo empleado.
- No hay racha de días ni ranking semanal o mensual: el ranking es único y por puntos.
- Los puntos y el nivel de Inicio y Perfil no se actualizan hasta recargar la página.
- El panel no permite crear ni editar simulacros, administrar las áreas, editar o borrar logros, ni borrar usuarios.
- Desactivar una cuenta no le impide el acceso.
- Una dirección que no existe muestra una pantalla en blanco, sin página de error.

---

# Preguntas frecuentes

**No veo mis puntos actualizados después de una prueba.** Recargar la página con la tecla F5. Los puntos se guardan correctamente; la pantalla los lee al iniciar sesión.

**Recargué durante una prueba y se reinició.** Es el comportamiento actual: las respuestas no se guardan hasta enviar la prueba. Hay que empezar de nuevo.

**Terminé una prueba y no aparece el logro.** Los logros se otorgan al terminar la prueba, según el número de pruebas completadas. Abrir Perfil, tocar "Logros" y, si hace falta, recargar la página.

**Olvidé mi contraseña.** Usar "¿Olvidaste tu contraseña?" en el inicio de sesión.

**Quiero ser administrador.** Un administrador puede cambiar el rol desde Usuarios. Si no existe ningún administrador, el equipo técnico debe asignarlo directamente en la base de datos (ver el manual técnico).
