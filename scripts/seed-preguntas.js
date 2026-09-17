import { initializeApp } from "firebase/app";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
import { doc, getFirestore, setDoc } from "firebase/firestore";

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
	{ id: "matematicas", nombre: "Matemáticas", descripcion: "Razonamiento cuantitativo y resolución de problemas.", numPreguntas: 4, tiempoLimite: 20 },
	{ id: "lectura_critica", nombre: "Lectura Crítica", descripcion: "Comprensión e interpretación de textos.", numPreguntas: 4, tiempoLimite: 20 },
	{ id: "ciencias_naturales", nombre: "Ciencias Naturales", descripcion: "Biología, física y química.", numPreguntas: 4, tiempoLimite: 20 },
	{ id: "sociales_ciudadanas", nombre: "Ciencias Sociales y Ciudadanas", descripcion: "Historia, geografía y competencias ciudadanas.", numPreguntas: 4, tiempoLimite: 20 },
	{ id: "ingles", nombre: "Inglés", descripcion: "Comprensión lectora y gramática en inglés.", numPreguntas: 4, tiempoLimite: 15 },
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
