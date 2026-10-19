import { getAllAreas, getAreaById } from "../repositories/areaRepository";
import { createQuiz } from "../repositories/quizRepository";
import { obtenerPreguntas } from "./questionService";

const AREAS_MINIMAS_SIMULACRO = 5;

const crearErrorDeArmado = (mensaje) =>
	Object.assign(new Error(mensaje), { code: "quiz/sin-preguntas" });

export const armarCuestionario = async (areaId, cantidad = 10) => {
	const area = await getAreaById(areaId);

	if (!area) {
		throw new Error("El área seleccionada no existe.");
	}

	const preguntas = await obtenerPreguntas(areaId, null, cantidad);

	if (preguntas.length === 0) {
		throw crearErrorDeArmado(`El área ${area.nombre} todavía no tiene preguntas.`);
	}

	const preguntasCuestionario = preguntas.map((pregunta, indice) => ({
		preguntaId: pregunta.id,
		orden: indice + 1,
	}));

	const cuestionarioId = await createQuiz({
		titulo: `Cuestionario de ${area.nombre}`,
		descripcion: area.descripcion,
		tipo: "cuestionario",
		areaId,
		duracion: area.tiempoLimite,
		preguntas: preguntasCuestionario,
	});

	return { cuestionarioId, preguntas, area };
};

export const armarSimulacro = async () => {
	const areas = await getAllAreas();

	if (areas.length < AREAS_MINIMAS_SIMULACRO) {
		throw crearErrorDeArmado(
			`El simulacro necesita ${AREAS_MINIMAS_SIMULACRO} áreas y hay ${areas.length} configuradas.`
		);
	}

	const preguntasPorArea = await Promise.all(
		areas.map((area) => obtenerPreguntas(area.id, null, area.numPreguntas))
	);

	const areasSinPreguntas = areas
		.filter((_, indice) => preguntasPorArea[indice].length === 0)
		.map((area) => area.nombre);

	if (areasSinPreguntas.length > 0) {
		throw crearErrorDeArmado(`Faltan preguntas en: ${areasSinPreguntas.join(", ")}.`);
	}

	const preguntas = preguntasPorArea.flat();

	const preguntasSimulacro = preguntas.map((pregunta, indice) => ({
		preguntaId: pregunta.id,
		orden: indice + 1,
	}));

	const duracionTotal = areas.reduce((total, area) => total + (area.tiempoLimite || 0), 0);

	const cuestionarioId = await createQuiz({
		titulo: "Simulacro general",
		descripcion: "Simulacro con preguntas de todas las áreas.",
		tipo: "simulacro",
		areaId: null,
		duracion: duracionTotal,
		preguntas: preguntasSimulacro,
	});

	return { cuestionarioId, preguntas, areas };
};
