import { addDoc, collection, doc, getDoc } from "firebase/firestore";

import { db } from "../config/firebase";

export const createQuiz = async (datos) => {
	const ref = collection(db, "cuestionarios");

	const nuevoCuestionario = await addDoc(ref, {
		titulo: datos.titulo,
		descripcion: datos.descripcion,
		tipo: datos.tipo,
		areaId: datos.areaId ?? null,
		duracion: datos.duracion,
		estado: "activo",
		preguntas: datos.preguntas,
	});

	return nuevoCuestionario.id;
};

export const getQuizById = async (id) => {
	const ref = doc(db, "cuestionarios", id);

	const snapshot = await getDoc(ref);

	if (!snapshot.exists()) {
		return null;
	}

	return {
		id: snapshot.id,
		...snapshot.data(),
	};
};
