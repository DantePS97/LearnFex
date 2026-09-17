import { collection, doc, getDocs, serverTimestamp, setDoc } from "firebase/firestore";

import { db } from "../config/firebase";
import { getResultadosByUsuario } from "./resultRepository";

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

// Criterios simplificados por conteo de resultados; un parser genérico de criterios queda fuera de alcance.
const CRITERIOS = {
	primer_quiz: (totalResultados) => totalResultados >= 1,
	cinco_simulacros: (totalResultados) => totalResultados >= 5,
	diez_simulacros: (totalResultados) => totalResultados >= 10,
};

export const evaluarLogros = async (usuarioId, resultado) => {
	const catalogo = await getCatalogoLogros();
	const logrosObtenidos = await getLogrosDelUsuario(usuarioId);

	const idsObtenidos = new Set(logrosObtenidos.map((logro) => logro.id));

	const totalResultados = (await getResultadosByUsuario(usuarioId)).length;

	const nuevosLogros = [];

	for (const logro of catalogo) {
		if (idsObtenidos.has(logro.id)) {
			continue;
		}

		const cumpleCriterio = CRITERIOS[logro.criterio];

		if (cumpleCriterio && cumpleCriterio(totalResultados, resultado)) {
			const ref = doc(db, "usuarios", usuarioId, "logrosObtenidos", logro.id);

			await setDoc(ref, { fechaObtenido: serverTimestamp() });

			nuevosLogros.push(logro.id);
		}
	}

	return nuevosLogros;
};
