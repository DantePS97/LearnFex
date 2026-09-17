import { doc, getDoc, runTransaction, setDoc, updateDoc, serverTimestamp } from "firebase/firestore";

import { db } from "../config/firebase";

const CAMPOS_PROTEGIDOS = ["rol", "estado", "xp", "nivel", "correo"];

export const getUserById = async (uid) => {
	const ref = doc(db, "usuarios", uid);

	const snapshot = await getDoc(ref);

	if (!snapshot.exists()) {
		return null;
	}

	return {
		id: snapshot.id,
		...snapshot.data(),
	};
};

export const createUserProfile = async (uid, { nombre, apellido, correo, rol = "estudiante" }) => {
	const ref = doc(db, "usuarios", uid);

	await setDoc(ref, {
		nombre,
		apellido,
		correo,
		rol,
		estado: "activo",
		xp: 0,
		nivel: 1,
		colegio: "",
		fechaRegistro: serverTimestamp(),
	});
};

export const updateUserProfile = async (uid, changes) => {
	const ref = doc(db, "usuarios", uid);

	const cambiosSeguros = { ...changes };

	CAMPOS_PROTEGIDOS.forEach((campo) => {
		delete cambiosSeguros[campo];
	});

	await updateDoc(ref, cambiosSeguros);
};

const XP_MAXIMO_POR_LLAMADA = 100;

export const actualizarGamificacion = async (uid, xpGanado) => {
	const ref = doc(db, "usuarios", uid);

	return runTransaction(db, async (transaction) => {
		const snapshot = await transaction.get(ref);

		if (!snapshot.exists()) {
			throw new Error("El usuario no existe.");
		}

		const { xp: xpActual, nivel: nivelActual } = snapshot.data();

		// El aumento se limita a 100 por llamada porque firestore.rules exige xp_nuevo <= xp_viejo + 100.
		const xpAplicado = Math.min(Math.max(xpGanado, 0), XP_MAXIMO_POR_LLAMADA);

		const nuevoXp = xpActual + xpAplicado;
		const nuevoNivel = Math.max(Math.floor(nuevoXp / 1000) + 1, nivelActual);

		transaction.update(ref, {
			xp: nuevoXp,
			nivel: nuevoNivel,
		});

		return { xp: nuevoXp, nivel: nuevoNivel };
	});
};
