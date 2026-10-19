import { createContext, useCallback, useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";

import { auth } from "../config/firebase";
import * as userService from "../services/userService";
import * as authServices from "../services/authServices";

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
	const [user, setUser] = useState(null);
	const [profile, setProfile] = useState(null);
	const [loading, setLoading] = useState(true);
	const [cuentaInactiva, setCuentaInactiva] = useState(false);

	useEffect(() => {
		const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
			try {
				if (firebaseUser) {
					const perfil = await userService.getUserProfile(firebaseUser.uid);

					if (perfil?.estado === "inactivo") {
						setCuentaInactiva(true);
						setUser(null);
						setProfile(null);
						await authServices.logout();
						return;
					}

					setCuentaInactiva(false);
					setUser(firebaseUser);
					setProfile(perfil);
				} else {
					setUser(null);
					setProfile(null);
				}
			} catch (error) {
				console.error(error);

				setUser(firebaseUser);
				setProfile(null);
			} finally {
				setLoading(false);
			}
		});

		return () => unsubscribe();
	}, []);

	const refreshProfile = useCallback(async () => {
		if (!auth.currentUser) return;

		try {
			const perfil = await userService.getUserProfile(auth.currentUser.uid);

			if (perfil?.estado === "inactivo") {
				setCuentaInactiva(true);
				setUser(null);
				setProfile(null);
				await authServices.logout();
				return;
			}

			setProfile(perfil);
		} catch (error) {
			console.error("No se pudo refrescar el perfil:", error);
		}
	}, []);

	const value = {
		user,
		profile,
		rol: profile?.rol ?? null,
		loading,
		cuentaInactiva,
		refreshProfile,
	};

	return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
