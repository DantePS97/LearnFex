import { initializeApp } from "firebase/app";
import { connectAuthEmulator, getAuth, signInWithEmailAndPassword } from "firebase/auth";
import { connectFirestoreEmulator, doc, getFirestore, setDoc } from "firebase/firestore";

const firebaseConfig = {
	apiKey: process.env.VITE_FIREBASE_API_KEY,
	authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
	projectId: process.env.VITE_FIREBASE_PROJECT_ID,
	storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
	messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
	appId: process.env.VITE_FIREBASE_APP_ID,
};

const ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD;

const areas = [
	{ id: "matematicas", nombre: "Matemáticas", descripcion: "Razonamiento cuantitativo y resolución de problemas.", numPreguntas: 6, tiempoLimite: 20 },
	{ id: "lectura_critica", nombre: "Lectura Crítica", descripcion: "Comprensión e interpretación de textos.", numPreguntas: 6, tiempoLimite: 20 },
	{ id: "ciencias_naturales", nombre: "Ciencias Naturales", descripcion: "Biología, física y química.", numPreguntas: 6, tiempoLimite: 20 },
	{ id: "sociales_ciudadanas", nombre: "Ciencias Sociales y Ciudadanas", descripcion: "Historia, geografía y competencias ciudadanas.", numPreguntas: 6, tiempoLimite: 20 },
	{ id: "ingles", nombre: "Inglés", descripcion: "Comprensión lectora y gramática en inglés.", numPreguntas: 6, tiempoLimite: 15 },
];

const preguntas = [
	{
		areaId: "matematicas",
		dificultad: "baja",
		enunciado: "¿Cuál es el resultado de factorizar x² - 9?",
		opciones: [
			{ id: "A", text: "(x + 3)(x - 3)" },
			{ id: "B", text: "(x + 9)(x - 1)" },
			{ id: "C", text: "(x - 3)(x - 3)" },
			{ id: "D", text: "(x + 3)²" },
		],
		respuestaCorrecta: "A",
		explicacion: "x² - 9 es una diferencia de cuadrados: a² - b² = (a + b)(a - b), con a = x y b = 3.",
	},
	{
		areaId: "matematicas",
		dificultad: "media",
		enunciado: "Un carro recorre 240 km en 3 horas a velocidad constante. ¿Cuál es su velocidad en km/h?",
		opciones: [
			{ id: "A", text: "60 km/h" },
			{ id: "B", text: "80 km/h" },
			{ id: "C", text: "100 km/h" },
			{ id: "D", text: "120 km/h" },
		],
		respuestaCorrecta: "B",
		explicacion: "Velocidad = distancia / tiempo = 240 km / 3 h = 80 km/h.",
	},
	{
		areaId: "matematicas",
		dificultad: "media",
		enunciado: "Si el 20% de un número es 40, ¿cuál es ese número?",
		opciones: [
			{ id: "A", text: "160" },
			{ id: "B", text: "180" },
			{ id: "C", text: "200" },
			{ id: "D", text: "220" },
		],
		respuestaCorrecta: "C",
		explicacion: "Si 0.20 · x = 40, entonces x = 40 / 0.20 = 200.",
	},
	{
		areaId: "matematicas",
		dificultad: "alta",
		enunciado: "¿Cuál es la pendiente de la recta que pasa por los puntos (2, 3) y (6, 11)?",
		opciones: [
			{ id: "A", text: "1" },
			{ id: "B", text: "2" },
			{ id: "C", text: "3" },
			{ id: "D", text: "4" },
		],
		respuestaCorrecta: "B",
		explicacion: "Pendiente = (y2 - y1) / (x2 - x1) = (11 - 3) / (6 - 2) = 8 / 4 = 2.",
	},
	{
		areaId: "lectura_critica",
		dificultad: "baja",
		enunciado: "En un texto argumentativo, la tesis es:",
		opciones: [
			{ id: "A", text: "Un ejemplo que apoya la idea principal" },
			{ id: "B", text: "La idea central que el autor defiende" },
			{ id: "C", text: "La conclusión del texto únicamente" },
			{ id: "D", text: "Una cita de otro autor" },
		],
		respuestaCorrecta: "B",
		explicacion: "La tesis es la idea central o postura que el autor sostiene y busca defender a lo largo del texto.",
	},
	{
		areaId: "lectura_critica",
		dificultad: "media",
		enunciado: "¿Qué función cumple un conector como 'sin embargo' en un texto?",
		opciones: [
			{ id: "A", text: "Introduce una idea que se opone o contrasta con la anterior" },
			{ id: "B", text: "Suma una idea similar a la anterior" },
			{ id: "C", text: "Da un ejemplo de lo dicho antes" },
			{ id: "D", text: "Cierra el texto de forma definitiva" },
		],
		respuestaCorrecta: "A",
		explicacion: "'Sin embargo' es un conector adversativo: introduce una idea que contrasta u objeta la idea previa.",
	},
	{
		areaId: "lectura_critica",
		dificultad: "media",
		enunciado: "Inferir el significado de una palabra desconocida por el contexto significa:",
		opciones: [
			{ id: "A", text: "Buscarla siempre en el diccionario" },
			{ id: "B", text: "Ignorarla y seguir leyendo" },
			{ id: "C", text: "Deducir su sentido a partir de las palabras que la rodean" },
			{ id: "D", text: "Reemplazarla por un sinónimo cualquiera" },
		],
		respuestaCorrecta: "C",
		explicacion: "La inferencia por contexto usa las pistas del texto circundante para deducir el significado probable.",
	},
	{
		areaId: "lectura_critica",
		dificultad: "alta",
		enunciado: "Un texto que presenta hechos verificables, sin opiniones del autor, se clasifica como:",
		opciones: [
			{ id: "A", text: "Argumentativo" },
			{ id: "B", text: "Narrativo" },
			{ id: "C", text: "Expositivo/informativo" },
			{ id: "D", text: "Lírico" },
		],
		respuestaCorrecta: "C",
		explicacion: "Los textos expositivos o informativos buscan explicar hechos de forma objetiva, sin emitir juicios de valor.",
	},
	{
		areaId: "ciencias_naturales",
		dificultad: "baja",
		enunciado: "¿Cuál es la unidad básica estructural y funcional de los seres vivos?",
		opciones: [
			{ id: "A", text: "El átomo" },
			{ id: "B", text: "La célula" },
			{ id: "C", text: "El tejido" },
			{ id: "D", text: "El órgano" },
		],
		respuestaCorrecta: "B",
		explicacion: "La célula es la unidad estructural y funcional básica de todos los organismos vivos.",
	},
	{
		areaId: "ciencias_naturales",
		dificultad: "media",
		enunciado: "En la fotosíntesis, ¿qué gas absorben las plantas de la atmósfera?",
		opciones: [
			{ id: "A", text: "Oxígeno" },
			{ id: "B", text: "Nitrógeno" },
			{ id: "C", text: "Dióxido de carbono" },
			{ id: "D", text: "Hidrógeno" },
		],
		respuestaCorrecta: "C",
		explicacion: "Las plantas absorben CO2 y, junto con agua y luz solar, producen glucosa y liberan oxígeno.",
	},
	{
		areaId: "ciencias_naturales",
		dificultad: "media",
		enunciado: "¿Cuál es la fórmula química del agua?",
		opciones: [
			{ id: "A", text: "CO2" },
			{ id: "B", text: "H2O" },
			{ id: "C", text: "O2" },
			{ id: "D", text: "NaCl" },
		],
		respuestaCorrecta: "B",
		explicacion: "El agua está compuesta por dos átomos de hidrógeno y uno de oxígeno: H2O.",
	},
	{
		areaId: "ciencias_naturales",
		dificultad: "alta",
		enunciado: "La primera ley de Newton establece que un cuerpo en reposo o movimiento uniforme:",
		opciones: [
			{ id: "A", text: "Siempre acelera con el tiempo" },
			{ id: "B", text: "Permanece así a menos que actúe una fuerza externa neta" },
			{ id: "C", text: "Pierde energía constantemente" },
			{ id: "D", text: "Cambia de dirección espontáneamente" },
		],
		respuestaCorrecta: "B",
		explicacion: "La ley de inercia dice que un cuerpo mantiene su estado de reposo o movimiento rectilíneo uniforme salvo que una fuerza externa neta actúe sobre él.",
	},
	{
		areaId: "sociales_ciudadanas",
		dificultad: "baja",
		enunciado: "¿Qué órgano del Estado colombiano tiene la función de hacer las leyes?",
		opciones: [
			{ id: "A", text: "El Congreso de la República" },
			{ id: "B", text: "La Corte Suprema de Justicia" },
			{ id: "C", text: "La Presidencia" },
			{ id: "D", text: "La Procuraduría" },
		],
		respuestaCorrecta: "A",
		explicacion: "El Congreso de la República (rama legislativa) es el encargado de crear, reformar y derogar las leyes.",
	},
	{
		areaId: "sociales_ciudadanas",
		dificultad: "media",
		enunciado: "El derecho al voto en Colombia es un ejemplo de participación:",
		opciones: [
			{ id: "A", text: "Económica" },
			{ id: "B", text: "Política" },
			{ id: "C", text: "Religiosa" },
			{ id: "D", text: "Deportiva" },
		],
		respuestaCorrecta: "B",
		explicacion: "El voto es un mecanismo de participación política que permite a los ciudadanos elegir a sus representantes.",
	},
	{
		areaId: "sociales_ciudadanas",
		dificultad: "media",
		enunciado: "¿Qué se entiende por globalización?",
		opciones: [
			{ id: "A", text: "El aislamiento económico de los países" },
			{ id: "B", text: "La interconexión económica, cultural y social entre países" },
			{ id: "C", text: "Un sistema de gobierno único mundial" },
			{ id: "D", text: "La eliminación de las fronteras políticas" },
		],
		respuestaCorrecta: "B",
		explicacion: "La globalización es el proceso de creciente interconexión económica, social, cultural y tecnológica entre países.",
	},
	{
		areaId: "sociales_ciudadanas",
		dificultad: "alta",
		enunciado: "La división de poderes en ejecutivo, legislativo y judicial busca principalmente:",
		opciones: [
			{ id: "A", text: "Concentrar el poder en una sola persona" },
			{ id: "B", text: "Evitar el abuso de poder mediante controles mutuos" },
			{ id: "C", text: "Reducir el número de funcionarios públicos" },
			{ id: "D", text: "Eliminar la necesidad de elecciones" },
		],
		respuestaCorrecta: "B",
		explicacion: "La separación de poderes (Montesquieu) busca que cada rama controle a las otras, evitando la concentración y el abuso del poder.",
	},
	{
		areaId: "ingles",
		dificultad: "baja",
		enunciado: "Choose the correct option: 'She ___ a student.'",
		opciones: [
			{ id: "A", text: "am" },
			{ id: "B", text: "is" },
			{ id: "C", text: "are" },
			{ id: "D", text: "be" },
		],
		respuestaCorrecta: "B",
		explicacion: "With the third person singular ('she'), the correct form of the verb 'to be' in present is 'is'.",
	},
	{
		areaId: "ingles",
		dificultad: "media",
		enunciado: "What is the past tense of 'go'?",
		opciones: [
			{ id: "A", text: "goed" },
			{ id: "B", text: "gone" },
			{ id: "C", text: "went" },
			{ id: "D", text: "going" },
		],
		respuestaCorrecta: "C",
		explicacion: "'Go' is an irregular verb; its simple past form is 'went'.",
	},
	{
		areaId: "ingles",
		dificultad: "media",
		enunciado: "Select the correct sentence:",
		opciones: [
			{ id: "A", text: "He don't like coffee." },
			{ id: "B", text: "He doesn't likes coffee." },
			{ id: "C", text: "He doesn't like coffee." },
			{ id: "D", text: "He not like coffee." },
		],
		respuestaCorrecta: "C",
		explicacion: "With third person singular in negative present simple, the auxiliary is 'doesn't' followed by the base form of the verb: 'doesn't like'.",
	},
	{
		areaId: "ingles",
		dificultad: "alta",
		enunciado: "Choose the sentence written in the passive voice:",
		opciones: [
			{ id: "A", text: "The teacher explained the lesson." },
			{ id: "B", text: "The lesson was explained by the teacher." },
			{ id: "C", text: "The teacher is explaining the lesson." },
			{ id: "D", text: "The teacher will explain the lesson." },
		],
		respuestaCorrecta: "B",
		explicacion: "The passive voice moves the object of the action to the subject position: 'The lesson was explained by the teacher.'",
	},
	{
		areaId: "matematicas",
		dificultad: "baja",
		enunciado: "Un artículo cuesta $80.000 y tiene un descuento del 15%. ¿Cuál es su precio final?",
		opciones: [
			{ id: "A", text: "$68.000" },
			{ id: "B", text: "$65.000" },
			{ id: "C", text: "$72.000" },
			{ id: "D", text: "$92.000" },
		],
		respuestaCorrecta: "A",
		explicacion: "El descuento es 0,15 · 80.000 = 12.000, así que el precio final es 80.000 - 12.000 = $68.000. Equivale a pagar el 85% del valor original.",
	},
	{
		areaId: "matematicas",
		dificultad: "media",
		enunciado: "Si f(x) = 3x² - 2x + 1, ¿cuál es el valor de f(-2)?",
		opciones: [
			{ id: "A", text: "9" },
			{ id: "B", text: "13" },
			{ id: "C", text: "21" },
			{ id: "D", text: "17" },
		],
		respuestaCorrecta: "D",
		explicacion: "f(-2) = 3·(-2)² - 2·(-2) + 1 = 3·4 + 4 + 1 = 17. El error más común es olvidar que -2·(-2) es positivo.",
	},
	{
		areaId: "matematicas",
		dificultad: "alta",
		enunciado: "En una bolsa hay 5 fichas rojas, 3 azules y 2 verdes. Se extraen dos fichas al azar, una tras otra y sin devolver la primera a la bolsa. ¿Cuál es la probabilidad de que ambas sean rojas?",
		opciones: [
			{ id: "A", text: "1/4" },
			{ id: "B", text: "2/9" },
			{ id: "C", text: "4/9" },
			{ id: "D", text: "1/2" },
		],
		respuestaCorrecta: "B",
		explicacion: "La primera ficha es roja con probabilidad 5/10. Como no se devuelve, quedan 4 rojas de 9 fichas, y la segunda es roja con probabilidad 4/9. Entonces P = 5/10 · 4/9 = 20/90 = 2/9. El valor 1/4 correspondería a devolver la ficha.",
	},
	{
		areaId: "matematicas",
		dificultad: "alta",
		enunciado: "Una llave A llena un tanque vacío en 6 horas y una llave B lo llena en 3 horas. Si ambas se abren al mismo tiempo, ¿en cuánto tiempo se llena el tanque?",
		opciones: [
			{ id: "A", text: "1,5 horas" },
			{ id: "B", text: "4,5 horas" },
			{ id: "C", text: "2 horas" },
			{ id: "D", text: "9 horas" },
		],
		respuestaCorrecta: "C",
		explicacion: "En una hora la llave A llena 1/6 del tanque y la llave B 1/3. Juntas llenan 1/6 + 1/3 = 1/2 del tanque por hora, así que lo llenan completo en 2 horas. Promediar los tiempos (4,5 horas) es un error frecuente.",
	},
	{
		areaId: "lectura_critica",
		dificultad: "baja",
		enunciado: "Lea el fragmento: 'El agua dulce es un recurso limitado: solo alrededor del 3% del agua del planeta es dulce y, de esa fracción, gran parte está congelada en glaciares.' La función principal del fragmento es:",
		opciones: [
			{ id: "A", text: "Narrar una experiencia personal relacionada con el agua" },
			{ id: "B", text: "Informar sobre la escasez del agua dulce" },
			{ id: "C", text: "Ordenar al lector que ahorre agua" },
			{ id: "D", text: "Describir el paisaje de un glaciar" },
		],
		respuestaCorrecta: "B",
		explicacion: "El fragmento presenta datos sobre la cantidad de agua dulce disponible, sin relatar hechos, sin dar órdenes y sin describir un paisaje. Su función es informar.",
	},
	{
		areaId: "lectura_critica",
		dificultad: "media",
		enunciado: "Lea la oración: 'Aunque la tecnología facilita la comunicación, muchos jóvenes reportan sentirse más solos que nunca.' En ella, el conector 'aunque' establece una relación de:",
		opciones: [
			{ id: "A", text: "Causa entre las dos ideas" },
			{ id: "B", text: "Finalidad de la primera idea" },
			{ id: "C", text: "Concesión: se admite algo que contrasta con lo que se afirma después" },
			{ id: "D", text: "Secuencia temporal entre los dos hechos" },
		],
		respuestaCorrecta: "C",
		explicacion: "'Aunque' introduce una concesión: se reconoce un hecho (la tecnología facilita la comunicación) que no impide la idea principal (los jóvenes se sienten solos). No expresa causa, finalidad ni orden temporal.",
	},
	{
		areaId: "lectura_critica",
		dificultad: "alta",
		enunciado: "Lea el texto: 'La alcaldía anunció que, para reducir el tráfico, aumentará el costo del parqueadero en el centro. Los comerciantes aseguran que las ventas caerán; los defensores de la medida afirman que más personas usarán el transporte público.' ¿En qué supuesto se apoya el argumento de quienes defienden la medida?",
		opciones: [
			{ id: "A", text: "En que, si estacionar cuesta más, algunas personas dejarán el carro particular y usarán el transporte público" },
			{ id: "B", text: "En que el comercio del centro tiene poca importancia para la ciudad" },
			{ id: "C", text: "En que el transporte público es gratuito" },
			{ id: "D", text: "En que los comerciantes no tienen derecho a opinar sobre la medida" },
		],
		respuestaCorrecta: "A",
		explicacion: "Para que 'más personas usen el transporte público' al encarecer el parqueadero, se supone que el mayor costo desincentiva el uso del carro particular. Los demás supuestos no aparecen en el texto ni son necesarios para el argumento.",
	},
	{
		areaId: "lectura_critica",
		dificultad: "alta",
		enunciado: "Lea el argumento: 'Mi vecino dice que hay que reciclar, pero ayer dejó una bolsa de basura en la calle; por lo tanto, reciclar no sirve.' Este razonamiento es débil porque:",
		opciones: [
			{ id: "A", text: "Usa datos estadísticos inexactos" },
			{ id: "B", text: "Apela a la opinión de un experto reconocido" },
			{ id: "C", text: "Repite en la conclusión lo que ya dijo en la premisa" },
			{ id: "D", text: "Descalifica la idea por la conducta de quien la defiende, sin evaluar la idea misma" },
		],
		respuestaCorrecta: "D",
		explicacion: "Es una falacia ad hominem: la conducta del vecino no demuestra que reciclar sea inútil. La validez de una idea se evalúa por sus razones y evidencias, no por quién la dice.",
	},
	{
		areaId: "ciencias_naturales",
		dificultad: "baja",
		enunciado: "¿Qué organelo de la célula es el principal responsable de producir energía en forma de ATP mediante la respiración celular?",
		opciones: [
			{ id: "A", text: "La mitocondria" },
			{ id: "B", text: "El ribosoma" },
			{ id: "C", text: "El núcleo" },
			{ id: "D", text: "El aparato de Golgi" },
		],
		respuestaCorrecta: "A",
		explicacion: "En las mitocondrias ocurre la mayor parte de la respiración celular aeróbica, que produce ATP. Los ribosomas sintetizan proteínas, el núcleo guarda el ADN y el aparato de Golgi procesa y empaqueta moléculas.",
	},
	{
		areaId: "ciencias_naturales",
		dificultad: "media",
		enunciado: "Un objeto de 2 kg se mueve con una aceleración de 3 m/s². ¿Cuál es la fuerza neta que actúa sobre él?",
		opciones: [
			{ id: "A", text: "1,5 N" },
			{ id: "B", text: "5 N" },
			{ id: "C", text: "6 N" },
			{ id: "D", text: "9 N" },
		],
		respuestaCorrecta: "C",
		explicacion: "Según la segunda ley de Newton, F = m · a = 2 kg · 3 m/s² = 6 N.",
	},
	{
		areaId: "ciencias_naturales",
		dificultad: "alta",
		enunciado: "Se mezclan 100 mL de una solución de ácido clorhídrico (HCl) 0,1 M con 100 mL de una solución de hidróxido de sodio (NaOH) 0,1 M. A 25 °C, el pH de la mezcla resultante es aproximadamente:",
		opciones: [
			{ id: "A", text: "1" },
			{ id: "B", text: "7" },
			{ id: "C", text: "10" },
			{ id: "D", text: "13" },
		],
		respuestaCorrecta: "B",
		explicacion: "Cada solución aporta 0,01 mol (0,1 mol/L · 0,1 L). El ácido fuerte y la base fuerte reaccionan mol a mol (HCl + NaOH → NaCl + H2O), por lo que se neutralizan por completo y queda una solución de sal neutra, con pH cercano a 7.",
	},
	{
		areaId: "ciencias_naturales",
		dificultad: "alta",
		enunciado: "En una planta, el color púrpura de la flor (P) es dominante sobre el color blanco (p). Dos plantas de flores púrpuras se cruzan y una de sus hijas tiene flores blancas. ¿Cuál es el genotipo de las dos plantas progenitoras?",
		opciones: [
			{ id: "A", text: "PP y PP" },
			{ id: "B", text: "PP y Pp" },
			{ id: "C", text: "Pp y pp" },
			{ id: "D", text: "Pp y Pp" },
		],
		respuestaCorrecta: "D",
		explicacion: "La hija de flores blancas es pp, así que recibió un alelo p de cada progenitor. Como ambos tienen flores púrpuras, no pueden ser pp; por lo tanto los dos son heterocigotos (Pp). En ese cruce, 1/4 de la descendencia es pp.",
	},
	{
		areaId: "sociales_ciudadanas",
		dificultad: "baja",
		enunciado: "En Colombia, ¿qué mecanismo permite a cualquier persona pedir a un juez la protección inmediata de un derecho fundamental que considera vulnerado?",
		opciones: [
			{ id: "A", text: "El cabildo abierto" },
			{ id: "B", text: "El voto en blanco" },
			{ id: "C", text: "La acción de tutela" },
			{ id: "D", text: "La revocatoria del mandato" },
		],
		respuestaCorrecta: "C",
		explicacion: "La acción de tutela (artículo 86 de la Constitución de 1991) permite reclamar ante un juez, de forma preferente y sumaria, la protección inmediata de los derechos fundamentales.",
	},
	{
		areaId: "sociales_ciudadanas",
		dificultad: "media",
		enunciado: "El Frente Nacional (1958-1974) fue un acuerdo político en Colombia que se caracterizó por:",
		opciones: [
			{ id: "A", text: "La prohibición de todos los partidos políticos" },
			{ id: "B", text: "La alternancia de la presidencia y la distribución paritaria de los cargos públicos entre liberales y conservadores" },
			{ id: "C", text: "La elección de los presidentes por parte de las Fuerzas Militares" },
			{ id: "D", text: "La creación de un partido único que gobernó el país" },
		],
		respuestaCorrecta: "B",
		explicacion: "El Frente Nacional puso fin a la dictadura de Rojas Pinilla y estableció que liberales y conservadores se alternarían en la presidencia cada cuatro años y repartirían por igual los cargos públicos. Esto excluyó a otras fuerzas políticas.",
	},
	{
		areaId: "sociales_ciudadanas",
		dificultad: "alta",
		enunciado: "El Congreso aprueba una ley que contradice un artículo de la Constitución. De acuerdo con el principio de supremacía constitucional, ¿qué debe ocurrir?",
		opciones: [
			{ id: "A", text: "La ley prevalece porque es posterior a la Constitución" },
			{ id: "B", text: "El presidente decide cuál de las dos normas se aplica" },
			{ id: "C", text: "Ambas normas conservan la misma validez" },
			{ id: "D", text: "Prevalece la Constitución y la Corte Constitucional puede declarar la ley inexequible" },
		],
		respuestaCorrecta: "D",
		explicacion: "La Constitución es norma de normas (artículo 4): si una ley la contradice, prevalece la Constitución. La Corte Constitucional controla la constitucionalidad de las leyes y puede retirarlas del ordenamiento declarándolas inexequibles.",
	},
	{
		areaId: "sociales_ciudadanas",
		dificultad: "alta",
		enunciado: "Un país obtiene casi todos sus ingresos de exportar un solo producto agrícola. Si el volumen exportado se mantiene, pero el precio internacional de ese producto cae de forma sostenida, ¿cuál es el efecto más directo sobre su economía?",
		opciones: [
			{ id: "A", text: "Aumentan sus ingresos por exportaciones" },
			{ id: "B", text: "Disminuyen sus ingresos por exportaciones y queda vulnerable por depender de un solo producto" },
			{ id: "C", text: "No hay ningún efecto, porque el precio no influye en los ingresos" },
			{ id: "D", text: "El empleo en la industria crece de forma automática" },
		],
		respuestaCorrecta: "B",
		explicacion: "Ingreso = precio · cantidad. Si la cantidad se mantiene y el precio baja, el ingreso disminuye. Además, la dependencia de un solo producto concentra el riesgo: cualquier caída del precio afecta a toda la economía.",
	},
	{
		areaId: "ingles",
		dificultad: "baja",
		enunciado: "Complete the sentence: 'I have lived in Medellín ___ 2015.'",
		opciones: [
			{ id: "A", text: "for" },
			{ id: "B", text: "since" },
			{ id: "C", text: "ago" },
			{ id: "D", text: "while" },
		],
		respuestaCorrecta: "B",
		explicacion: "With the present perfect, 'since' is used with a specific point in time (2015), while 'for' is used with a period of time (for ten years).",
	},
	{
		areaId: "ingles",
		dificultad: "media",
		enunciado: "Choose the correct option: 'If it rains tomorrow, we ___ the picnic.'",
		opciones: [
			{ id: "A", text: "would cancel" },
			{ id: "B", text: "cancelled" },
			{ id: "C", text: "will cancel" },
			{ id: "D", text: "had cancelled" },
		],
		respuestaCorrecta: "C",
		explicacion: "This is a first conditional sentence, used for real or likely future situations: 'if' + present simple, 'will' + base form of the verb.",
	},
	{
		areaId: "ingles",
		dificultad: "alta",
		enunciado: "Choose the sentence that correctly expresses a hypothetical situation in the past:",
		opciones: [
			{ id: "A", text: "If I would have studied more, I would pass the exam." },
			{ id: "B", text: "If I studied more, I would have passed the exam." },
			{ id: "C", text: "If I have studied more, I would passed the exam." },
			{ id: "D", text: "If I had studied more, I would have passed the exam." },
		],
		respuestaCorrecta: "D",
		explicacion: "The third conditional is formed with 'if' + past perfect ('had studied') in the condition and 'would have' + past participle ('would have passed') in the result.",
	},
	{
		areaId: "ingles",
		dificultad: "alta",
		enunciado: "Read the text: 'Although the new policy was meant to reduce waste, it ended up backfiring: companies simply moved their production abroad.' In this context, 'backfiring' means:",
		opciones: [
			{ id: "A", text: "producing the opposite of the intended result" },
			{ id: "B", text: "being applied successfully" },
			{ id: "C", text: "being cancelled by the government" },
			{ id: "D", text: "receiving public praise" },
		],
		respuestaCorrecta: "A",
		explicacion: "The policy was intended to reduce waste, but companies moved their production abroad instead. 'Although' signals the contrast, so 'backfiring' means that the policy had the opposite effect to the one intended.",
	},
];

const logros = [
	{ id: "primer_quiz", nombre: "Primer paso", descripcion: "Completá tu primer cuestionario o simulacro.", criterio: "primer_quiz" },
	{ id: "cinco_simulacros", nombre: "Estudiante dedicado", descripcion: "Completá 5 simulacros o cuestionarios.", criterio: "cinco_simulacros" },
	{ id: "diez_simulacros", nombre: "Maestro de las áreas", descripcion: "Completá 10 simulacros o cuestionarios.", criterio: "diez_simulacros" },
];

async function seed() {
	if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
		console.error(
			"Faltan SEED_ADMIN_EMAIL y/o SEED_ADMIN_PASSWORD en las variables de entorno.\n" +
				"Este script necesita autenticarse como un usuario con rol 'administrador' " +
				"(firestore.rules exige esAdministrador() para escribir en areas/preguntas/logros).\n" +
				"Ese usuario tiene que existir ya en Firebase Auth y tener rol: 'administrador' " +
				"seteado a mano en su documento de Firestore (usuarios/{uid}), ya que el panel de administración todavía no existe."
		);
		process.exit(1);
	}

	const app = initializeApp(firebaseConfig);
	const auth = getAuth(app);
	const db = getFirestore(app);

	// Optional: seed the local Firebase Emulator Suite instead of production.
	// Ports must match the "emulators" block of firebase.json.
	// eslint-disable-next-line no-undef -- pre-existing: this Node script is linted with browser globals
	if (process.env.SEED_USE_EMULATORS === "true") {
		connectAuthEmulator(auth, "http://127.0.0.1:9099");
		connectFirestoreEmulator(db, "127.0.0.1", 8080);
		console.log("Usando emuladores de Firebase (Auth 9099, Firestore 8080).");
	}

	await signInWithEmailAndPassword(auth, ADMIN_EMAIL, ADMIN_PASSWORD);

	for (const area of areas) {
		await setDoc(doc(db, "areas", area.id), area);
		console.log(`Área cargada: ${area.nombre}`);
	}

	for (const [index, pregunta] of preguntas.entries()) {
		await setDoc(doc(db, "preguntas", `seed_${index + 1}`), pregunta);
	}
	console.log(`${preguntas.length} preguntas cargadas.`);

	for (const logro of logros) {
		await setDoc(doc(db, "logros", logro.id), logro);
	}
	console.log(`${logros.length} logros cargados.`);

	console.log("Seed completo.");
	process.exit(0);
}

seed().catch((error) => {
	console.error("Error al cargar los datos semilla:", error);
	process.exit(1);
});
