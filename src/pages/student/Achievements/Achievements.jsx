import React, { useEffect, useState } from "react";
import "./Achievements.css";

import { useAuth } from "../../../hooks/useAuth";
import {
  getCatalogoLogros,
  getLogrosDelUsuario,
} from "../../../repositories/logroRepository";

const formatFecha = (fecha) => {
  if (!fecha) return "";

  try {
    const parsed = fecha?.seconds ? new Date(fecha.seconds * 1000) : new Date(fecha);

    if (Number.isNaN(parsed.getTime())) return "";

    return parsed.toLocaleDateString("es-CO", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  } catch {
    return "";
  }
};

const Achievements = () => {
  const { user } = useAuth();

  const [catalogo, setCatalogo] = useState([]);
  const [obtenidos, setObtenidos] = useState(new Map());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const cargarLogros = async () => {
      if (!user?.uid) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);

        const [catalogoLogros, logrosUsuario] = await Promise.all([
          getCatalogoLogros(),
          getLogrosDelUsuario(user.uid),
        ]);

        setCatalogo(catalogoLogros);
        setObtenidos(new Map(logrosUsuario.map((logro) => [logro.id, logro])));
      } catch (error) {
        console.error("Error al cargar los logros:", error);
      } finally {
        setLoading(false);
      }
    };

    cargarLogros();
  }, [user]);

  if (loading) {
    return (
      <div className="achievements-container">
        <p>Cargando logros...</p>
      </div>
    );
  }

  return (
    <div className="achievements-container">
      <h2>🏅 Logros</h2>

      <div className="achievements-list">
        {catalogo.map((logro) => {
          const obtenido = obtenidos.get(logro.id);

          return (
            <div
              key={logro.id}
              className={`achievement ${obtenido ? "unlocked" : "locked"}`}
            >
              <h3>{logro.titulo || logro.nombre}</h3>
              <p>{logro.descripcion}</p>

              {obtenido ? (
                <span className="badge">
                  ✔ Desbloqueado {formatFecha(obtenido.fechaObtenido)}
                </span>
              ) : (
                <span className="badge badge-locked">Bloqueado</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Achievements;
