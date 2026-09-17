import { getAllAreas } from "../repositories/areaRepository";
import { getQuizById } from "../repositories/quizRepository";
import { getResultadosByUsuario } from "../repositories/resultRepository";
import { upsertEstadistica } from "../repositories/statisticsRepository";

const UMBRAL_RECOMENDACION = 60;

export const calculateAccuracy = (respuestasCorrectas, totalPreguntas) => {
	if (!totalPreguntas || totalPreguntas <= 0) {
		return 0;
	}

	return Math.round((respuestasCorrectas / totalPreguntas) * 100);
};

// Los resultados no guardan areaId (solo cuestionarioId), así que se resuelve por cuestionario, con cache.
const obtenerAreaIdDelResultado = async (resultado, cacheCuestionarios) => {
	if (cacheCuestionarios.has(resultado.cuestionarioId)) {
		return cacheCuestionarios.get(resultado.cuestionarioId);
	}

	const cuestionario = await getQuizById(resultado.cuestionarioId);
	const areaId = cuestionario ? cuestionario.areaId : null;

	cacheCuestionarios.set(resultado.cuestionarioId, areaId);

	return areaId;
};

export const calcularEstadisticas = async (usuarioId) => {
	const [resultados, areas] = await Promise.all([
		getResultadosByUsuario(usuarioId),
		getAllAreas(),
	]);

	const cacheCuestionarios = new Map();

	const resultadosConArea = await Promise.all(
		resultados.map(async (resultado) => ({
			...resultado,
			areaId: await obtenerAreaIdDelResultado(resultado, cacheCuestionarios),
		}))
	);

	const porArea = [];

	for (const area of areas) {
		const resultadosArea = resultadosConArea.filter((resultado) => resultado.areaId === area.id);

		const totalPreguntas = resultadosArea.reduce(
			(total, resultado) => total + (resultado.respuestasCorrectas || 0) + (resultado.respuestasIncorrectas || 0),
			0
		);

		const respuestasCorrectas = resultadosArea.reduce(
			(total, resultado) => total + (resultado.respuestasCorrectas || 0),
			0
		);

		const promedioAciertos = calculateAccuracy(respuestasCorrectas, totalPreguntas);
		const porcentajeAvance = resultadosArea.length > 0 ? 100 : 0;

		await upsertEstadistica(usuarioId, area.id, { porcentajeAvance, promedioAciertos });

		porArea.push({
			areaId: area.id,
			nombre: area.nombre,
			totalPruebas: resultadosArea.length,
			promedioAciertos,
			porcentajeAvance,
		});
	}

	const totalCorrectasGeneral = resultados.reduce(
		(total, resultado) => total + (resultado.respuestasCorrectas || 0),
		0
	);

	const totalPreguntasGeneral = resultados.reduce(
		(total, resultado) => total + (resultado.respuestasCorrectas || 0) + (resultado.respuestasIncorrectas || 0),
		0
	);

	const general = {
		totalPruebas: resultados.length,
		promedioAciertos: calculateAccuracy(totalCorrectasGeneral, totalPreguntasGeneral),
	};

	const temasRecomendados = porArea
		.filter((area) => area.promedioAciertos < UMBRAL_RECOMENDACION)
		.sort((a, b) => a.promedioAciertos - b.promedioAciertos)
		.slice(0, 2)
		.map((area) => area.nombre);

	return { porArea, general, temasRecomendados };
};

export default {
	calculateAccuracy,
	calcularEstadisticas,
};
