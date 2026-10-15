import {
	collection,
	doc,
	getDoc,
	getDocs,
	limit,
	orderBy,
	query,
	setDoc,
	startAfter,
	updateDoc,
	serverTimestamp,
} from "firebase/firestore";

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

export const getAllUsers = async (cursor = null, pageSize = 10) => {
	const usuariosRef = collection(db, "usuarios");

	const restricciones = [orderBy("fechaRegistro", "desc")];

	if (cursor) {
		restricciones.push(startAfter(cursor));
	}

	restricciones.push(limit(pageSize));

	const snapshot = await getDocs(query(usuariosRef, ...restricciones));

	const users = snapshot.docs.map((docItem) => ({
		id: docItem.id,
		...docItem.data(),
	}));

	const lastDoc = snapshot.docs[snapshot.docs.length - 1] || null;

	return { users, cursor: lastDoc };
};

const ESTADOS_VALIDOS = ["activo", "inactivo"];

export const setUserEstado = async (uid, estado) => {
	if (!ESTADOS_VALIDOS.includes(estado)) {
		throw new Error(`Estado inválido: ${estado}. Debe ser 'activo' o 'inactivo'.`);
	}

	const ref = doc(db, "usuarios", uid);

	await updateDoc(ref, { estado });
};

const ROLES_VALIDOS = ["estudiante", "administrador"];

export const setUserRol = async (uid, rol) => {
	if (!ROLES_VALIDOS.includes(rol)) {
		throw new Error(`Rol inválido: ${rol}. Debe ser 'estudiante' o 'administrador'.`);
	}

	const ref = doc(db, "usuarios", uid);

	await updateDoc(ref, { rol });
};
