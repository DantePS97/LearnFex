import { addDoc, collection, getDocs } from "firebase/firestore";

import { db } from "../config/firebase";

export const getCatalogoLogros = async () => {
	const ref = collection(db, "logros");

	const snapshot = await getDocs(ref);

	return snapshot.docs.map((docSnap) => ({
		id: docSnap.id,
		...docSnap.data(),
	}));
};

export const getLogrosDelUsuario = async (usuarioId) => {
	const ref = collection(db, "usuarios", usuarioId, "logrosObtenidos");

	const snapshot = await getDocs(ref);

	return snapshot.docs.map((docSnap) => ({
		id: docSnap.id,
		...docSnap.data(),
	}));
};

// Solo los NOMBRES de criterio permitidos al crear un logro. La evaluación ya no ocurre en el
// cliente: la hace la Cloud Function calificarPrueba (functions/src/gamificacion.js).
const CRITERIOS_VALIDOS = new Set(["primer_quiz", "cinco_simulacros", "diez_simulacros"]);

export const createLogro = async (datos) => {
	if (!datos?.nombre || !datos?.descripcion) {
		throw new Error("El logro debe tener nombre y descripción.");
	}

	if (!CRITERIOS_VALIDOS.has(datos.criterio)) {
		throw new Error(`Criterio de logro desconocido: ${datos.criterio}.`);
	}

	const ref = collection(db, "logros");

	const nuevoLogro = await addDoc(ref, {
		nombre: datos.nombre,
		descripcion: datos.descripcion,
		criterio: datos.criterio,
	});

	return nuevoLogro.id;
};
