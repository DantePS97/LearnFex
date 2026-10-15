import {
  collection,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  where,
} from "firebase/firestore";

import { db } from "../config/firebase";

export const getResultadosByUsuario = async (usuarioId) => {
  const ref = query(
    collection(db, "resultados"),
    where("usuarioId", "==", usuarioId),
    orderBy("fecha", "desc"),
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

  // 🔥 EXTRAER usuarioId (clave del fix)
  const { usuarioId } = resultadoSnapshot.data();

  // 🔥 FIX: query con where alineado a las reglas
  const respuestasRef = query(
    collection(resultadoRef, "respuestas"),
    where("usuarioId", "==", usuarioId),
  );

  const respuestasSnapshot = await getDocs(respuestasRef);

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
