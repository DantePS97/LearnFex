import {
	addDoc,
	collection,
	doc,
	getDoc,
	getDocs,
	limit,
	orderBy,
	query,
	serverTimestamp,
	startAfter,
	updateDoc,
} from "firebase/firestore";

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
		fechaCreacion: serverTimestamp(),
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

/**
 * Obtener todos los cuestionarios (paginado)
 * @param {DocumentSnapshot|null} cursor
 * @param {number} pageSize
 */
export const getAllQuizzes = async (cursor = null, pageSize = 10) => {
	const cuestionariosRef = collection(db, "cuestionarios");

	// Los cuestionarios creados antes de guardar fechaCreacion quedan fuera de la lista (descartables, decision consciente).
	let q;

	if (cursor) {
		q = query(
			cuestionariosRef,
			orderBy("fechaCreacion", "desc"),
			startAfter(cursor),
			limit(pageSize),
		);
	} else {
		q = query(
			cuestionariosRef,
			orderBy("fechaCreacion", "desc"),
			limit(pageSize),
		);
	}

	const snapshot = await getDocs(q);

	const items = snapshot.docs.map((docItem) => ({
		id: docItem.id,
		...docItem.data(),
	}));

	const lastDoc = snapshot.docs[snapshot.docs.length - 1] || null;

	return {
		items,
		lastDoc,
	};
};

export const updateQuiz = async (id, cambios) => {
	const ref = doc(db, "cuestionarios", id);

	await updateDoc(ref, cambios);
};

export const deleteQuiz = async (id) => {
	const ref = doc(db, "cuestionarios", id);

	await updateDoc(ref, {
		estado: "inactivo",
	});
};