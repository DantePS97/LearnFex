import { getQuestionById } from "../repositories/questionRepository";
import { actualizarPosicion } from "../repositories/rankingRepository";
import { crearResultado } from "../repositories/resultRepository";
import { actualizarGamificacion } from "../repositories/userRepository";
import { evaluarLogros } from "../repositories/logroRepository";

export const calificarPrueba = async (cuestionarioId, respuestasEstudiante, usuarioId, tiempoEmpleado) => {
	const respuestasCalificadas = [];

	let respuestasCorrectas = 0;

	for (const respuesta of respuestasEstudiante) {
		const pregunta = await getQuestionById(respuesta.preguntaId);

		const esCorrecta = Boolean(pregunta) && respuesta.respuestaSeleccionada === pregunta.respuestaCorrecta;

		if (esCorrecta) {
			respuestasCorrectas += 1;
		}

		respuestasCalificadas.push({
			preguntaId: respuesta.preguntaId,
			respuestaSeleccionada: respuesta.respuestaSeleccionada,
			esCorrecta,
		});
	}

	const totalPreguntas = respuestasEstudiante.length;
	const respuestasIncorrectas = totalPreguntas - respuestasCorrectas;
	const puntaje = totalPreguntas > 0 ? Math.round((respuestasCorrectas / totalPreguntas) * 100) : 0;

	const resultadoId = await crearResultado(
		{
			usuarioId,
			cuestionarioId,
			puntaje,
			respuestasCorrectas,
			respuestasIncorrectas,
			tiempoEmpleado,
		},
		respuestasCalificadas
	);

	// El resultado ya quedo persistido arriba; lo que sigue es gamificacion "best effort"
	// (xp, ranking, logros) y no debe impedir que el estudiante vea su resultado si algo falla.
	let nuevosLogros = [];

	try {
		const xpGanado = respuestasCorrectas * 10;

		const { xp: xpActualizado } = await actualizarGamificacion(usuarioId, xpGanado);

		await actualizarPosicion(usuarioId, xpActualizado);

		nuevosLogros = await evaluarLogros(usuarioId, {
			resultadoId,
			puntaje,
			respuestasCorrectas,
			respuestasIncorrectas,
			tiempoEmpleado,
		});
	} catch (error) {
		console.error("No se pudo actualizar la gamificacion del resultado", resultadoId, error);
	}

	return { resultadoId, puntaje, respuestasCorrectas, respuestasIncorrectas, nuevosLogros };
};
