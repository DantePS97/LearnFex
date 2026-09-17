import { collection, doc, getDoc, getDocs } from "firebase/firestore";

import { db } from "../config/firebase";

export const getAllAreas = async () => {
	const ref = collection(db, "areas");

	const snapshot = await getDocs(ref);

	return snapshot.docs.map((docSnap) => ({
		id: docSnap.id,
		...docSnap.data(),
	}));
};

export const getAreaById = async (id) => {
	const ref = doc(db, "areas", id);

	const snapshot = await getDoc(ref);

	if (!snapshot.exists()) {
		return null;
	}

	return {
		id: snapshot.id,
		...snapshot.data(),
	};
};
