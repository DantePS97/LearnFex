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
 * @returns {Promise<{items: object[], lastDoc: DocumentSnapshot|null, hasMore: boolean}>}
 *   lastDoc es el ultimo documento de `items` (cursor de la pagina siguiente) y
 *   hasMore indica si existe al menos un documento mas despues de esta pagina.
 */
export const getAllQuizzes = async (cursor = null, pageSize = 10) => {
	const cuestionariosRef = collection(db, "cuestionarios");

	// Los cuestionarios creados antes de guardar fechaCreacion quedan fuera de la lista (descartables, decision consciente).
	// Se pide un documento de mas para saber si hay otra pagina sin un clic extra.
	let q;

	if (cursor) {
		q = query(
			cuestionariosRef,
			orderBy("fechaCreacion", "desc"),
			startAfter(cursor),
			limit(pageSize + 1),
		);
	} else {
		q = query(
			cuestionariosRef,
			orderBy("fechaCreacion", "desc"),
			limit(pageSize + 1),
		);
	}

	const snapshot = await getDocs(q);

	const hasMore = snapshot.docs.length > pageSize;
	const pageDocs = snapshot.docs.slice(0, pageSize);

	const items = pageDocs.map((docItem) => ({
		id: docItem.id,
		...docItem.data(),
	}));

	const lastDoc = pageDocs[pageDocs.length - 1] || null;

	return {
		items,
		lastDoc,
		hasMore,
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