import { getAllAreas, getAreaById } from "../repositories/areaRepository";
import { createQuiz } from "../repositories/quizRepository";
import { obtenerPreguntas } from "./questionService";

export const armarCuestionario = async (areaId, cantidad = 10) => {
	const area = await getAreaById(areaId);

	if (!area) {
		throw new Error("El área seleccionada no existe.");
	}

	const preguntas = await obtenerPreguntas(areaId, null, cantidad);

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

	return cuestionarioId;
};

export const armarSimulacro = async () => {
	const areas = await getAllAreas();

	let orden = 0;
	const preguntasSimulacro = [];

	for (const area of areas) {
		const preguntas = await obtenerPreguntas(area.id, null, area.numPreguntas);

		preguntas.forEach((pregunta) => {
			orden += 1;

			preguntasSimulacro.push({ preguntaId: pregunta.id, orden });
		});
	}

	const duracionTotal = areas.reduce((total, area) => total + (area.tiempoLimite || 0), 0);

	const cuestionarioId = await createQuiz({
		titulo: "Simulacro general",
		descripcion: "Simulacro con preguntas de todas las áreas.",
		tipo: "simulacro",
		areaId: null,
		duracion: duracionTotal,
		preguntas: preguntasSimulacro,
	});

	return cuestionarioId;
};
