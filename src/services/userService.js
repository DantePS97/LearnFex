import * as authServices from "./authServices";
import * as userRepository from "../repositories/userRepository";

export const registerUser = async (email, password, nombre, apellido, aceptoPolitica) => {
	// Se valida antes de crear la cuenta en Auth para no dejar una cuenta sin perfil.
	if (aceptoPolitica !== true) {
		throw new Error("Se requiere aceptar la política de tratamiento de datos personales.");
	}

	const credenciales = await authServices.register(email, password);

	await userRepository.createUserProfile(credenciales.user.uid, {
		nombre,
		apellido,
		correo: email,
		consentimientoDatos: true,
	});

	return {
		uid: credenciales.user.uid,
		rol: "estudiante",
	};
};

export const getUserProfile = (uid) => {
	return userRepository.getUserById(uid);
};

// Misma regla que estaActivo() de firestore.rules: solo es activa una cuenta sin perfil, sin campo
// `estado` o con estado === "activo"; cualquier otro valor (incluido null) la deja inactiva.
export const esCuentaInactiva = (perfil) => {
	return Boolean(perfil) && Object.hasOwn(perfil, "estado") && perfil.estado !== "activo";
};

export const updateUserProfile = (uid, changes) => {
	return userRepository.updateUserProfile(uid, changes);
};
