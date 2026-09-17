import { collection, doc, getDocs, query, setDoc, where } from "firebase/firestore";

import { db } from "../config/firebase";

export const getEstadisticasByUsuario = async (usuarioId) => {
	const ref = query(collection(db, "estadisticas_progreso"), where("usuarioId", "==", usuarioId));

	const snapshot = await getDocs(ref);

	return snapshot.docs.map((docSnap) => ({
		id: docSnap.id,
		...docSnap.data(),
	}));
};

export const upsertEstadistica = async (usuarioId, areaId, datos) => {
	const ref = doc(db, "estadisticas_progreso", `${usuarioId}_${areaId}`);

	await setDoc(
		ref,
		{
			usuarioId,
			areaId,
			porcentajeAvance: datos.porcentajeAvance,
			promedioAciertos: datos.promedioAciertos,
		},
		{ merge: true }
	);
};
