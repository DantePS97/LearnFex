import {
	addDoc,
	collection,
	deleteDoc,
	doc,
	getDoc,
	getDocs,
	query,
	updateDoc,
	where,
} from "firebase/firestore";

import { db } from "../config/firebase";

const mezclar = (lista) => {
	const copia = [...lista];

	for (let i = copia.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));

		[copia[i], copia[j]] = [copia[j], copia[i]];
	}

	return copia;
};

export const getQuestionsByArea = async (areaId, dificultad, cantidad) => {
	const restricciones = [where("areaId", "==", areaId)];

	if (dificultad) {
		restricciones.push(where("dificultad", "==", dificultad));
	}

	const ref = query(collection(db, "preguntas"), ...restricciones);

	const snapshot = await getDocs(ref);

	const preguntas = mezclar(
		snapshot.docs.map((docSnap) => ({
			id: docSnap.id,
			...docSnap.data(),
		}))
	);

	return cantidad ? preguntas.slice(0, cantidad) : preguntas;
};

export const getQuestionById = async (id) => {
	const ref = doc(db, "preguntas", id);

	const snapshot = await getDoc(ref);

	if (!snapshot.exists()) {
		return null;
	}

	return {
		id: snapshot.id,
		...snapshot.data(),
	};
};

export const createQuestion = async (datos) => {
	if (!datos.opciones || datos.opciones.length < 2) {
		throw new Error("La pregunta debe tener al menos 2 opciones.");
	}

	const ref = collection(db, "preguntas");

	const nuevaPregunta = await addDoc(ref, {
		enunciado: datos.enunciado,
		opciones: datos.opciones,
		respuestaCorrecta: datos.respuestaCorrecta,
		dificultad: datos.dificultad,
		explicacion: datos.explicacion,
		areaId: datos.areaId,
	});

	return nuevaPregunta.id;
};

export const updateQuestion = async (id, cambios) => {
	const ref = doc(db, "preguntas", id);

	await updateDoc(ref, cambios);
};

export const deleteQuestion = async (id) => {
	const ref = doc(db, "preguntas", id);

	await deleteDoc(ref);
};
