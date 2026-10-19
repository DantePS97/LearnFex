import { createContext, useCallback, useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";

import { auth } from "../config/firebase";
import * as userService from "../services/userService";

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
	const [user, setUser] = useState(null);
	const [profile, setProfile] = useState(null);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
			try {
				if (firebaseUser) {
					const perfil = await userService.getUserProfile(firebaseUser.uid);

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
		refreshProfile,
	};

	return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
