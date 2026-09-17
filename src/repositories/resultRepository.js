import {
	collection,
	doc,
	getDoc,
	getDocs,
	orderBy,
	query,
	serverTimestamp,
	where,
	writeBatch,
} from "firebase/firestore";

import { db } from "../config/firebase";

export const crearResultado = async (datosResultado, respuestas) => {
	const batch = writeBatch(db);

	const resultadoRef = doc(collection(db, "resultados"));

	batch.set(resultadoRef, {
		...datosResultado,
		fecha: serverTimestamp(),
	});

	respuestas.forEach((respuesta) => {
		const respuestaRef = doc(collection(resultadoRef, "respuestas"));

		batch.set(respuestaRef, {
			...respuesta,
			usuarioId: datosResultado.usuarioId,
		});
	});

	await batch.commit();

	return resultadoRef.id;
};

export const getResultadosByUsuario = async (usuarioId) => {
	const ref = query(
		collection(db, "resultados"),
		where("usuarioId", "==", usuarioId),
		orderBy("fecha", "desc")
	);

	const snapshot = await getDocs(ref);

	return snapshot.docs.map((docSnap) => ({
		id: docSnap.id,
		...docSnap.data(),
	}));
};

export const getResultadoConRespuestas = async (resultadoId) => {
	const resultadoRef = doc(db, "resultados", resultadoId);

	const resultadoSnapshot = await getDoc(resultadoRef);

	if (!resultadoSnapshot.exists()) {
		return null;
	}

	const respuestasSnapshot = await getDocs(collection(resultadoRef, "respuestas"));

	const respuestas = respuestasSnapshot.docs.map((docSnap) => ({
		id: docSnap.id,
		...docSnap.data(),
	}));

	return {
		id: resultadoSnapshot.id,
		...resultadoSnapshot.data(),
		respuestas,
	};
};
