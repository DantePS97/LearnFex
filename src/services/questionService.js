import { getQuestionsByArea } from "../repositories/questionRepository";

export const obtenerPreguntas = async (areaId, dificultad, cantidad) => {
	const preguntas = await getQuestionsByArea(areaId, dificultad, cantidad);

	return preguntas.map((pregunta) => {
		const { respuestaCorrecta, explicacion, ...preguntaSegura } = pregunta;

		return preguntaSegura;
	});
};
