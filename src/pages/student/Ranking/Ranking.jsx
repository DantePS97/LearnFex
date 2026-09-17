// src/pages/student/Ranking/Ranking.jsx

import React, { useEffect, useRef, useState } from "react";
import "./Ranking.css";

import { useAuth } from "../../../hooks/useAuth";
import {
  getPosicionUsuario,
  getRankingGeneral,
} from "../../../repositories/rankingRepository";
import { getUserById } from "../../../repositories/userRepository";

const LIMITE_POR_PAGINA = 20;

const getPositionIcon = (position) => {
  if (position === 1) return "🥇";
  if (position === 2) return "🥈";
  if (position === 3) return "🥉";

  return position;
};

const getInitials = (name) => {
  return (name || "?")
    .split(" ")
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase();
};

function Ranking() {
  const { user } = useAuth();

  const [items, setItems] = useState([]);
  const [lastDoc, setLastDoc] = useState(null);
  const [hayMas, setHayMas] = useState(true);
  const [miPosicion, setMiPosicion] = useState(null);

  const [loading, setLoading] = useState(true);
  const [cargandoMas, setCargandoMas] = useState(false);

  const perfilesCache = useRef(new Map());

  const enriquecerConPerfil = async (rankingItems) => {
    const enriquecidos = await Promise.all(
      rankingItems.map(async (item) => {
        if (!perfilesCache.current.has(item.usuarioId)) {
          const perfil = await getUserById(item.usuarioId);

          perfilesCache.current.set(item.usuarioId, perfil);
        }

        const perfil = perfilesCache.current.get(item.usuarioId);

        return {
          ...item,
          nombre: perfil ? `${perfil.nombre} ${perfil.apellido || ""}`.trim() : "Estudiante",
          nivel: perfil?.nivel ?? null,
        };
      })
    );

    return enriquecidos;
  };

  useEffect(() => {
    const cargarRanking = async () => {
      try {
        setLoading(true);

        const { items: primeraPagina, lastDoc: ultimoDoc } =
          await getRankingGeneral(LIMITE_POR_PAGINA);

        const primeraPaginaConPerfil = await enriquecerConPerfil(primeraPagina);

        setItems(primeraPaginaConPerfil);
        setLastDoc(ultimoDoc);
        setHayMas(primeraPagina.length === LIMITE_POR_PAGINA);

        if (user?.uid) {
          const estaEnPagina = primeraPagina.some(
            (item) => item.usuarioId === user.uid
          );

          if (!estaEnPagina) {
            const posicion = await getPosicionUsuario(user.uid);
            setMiPosicion(posicion);
          }
        }
      } catch (error) {
        console.error("Error al cargar el ranking:", error);
      } finally {
        setLoading(false);
      }
    };

    cargarRanking();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const handleCargarMas = async () => {
    if (!lastDoc || cargandoMas) return;

    try {
      setCargandoMas(true);

      const { items: siguientePagina, lastDoc: ultimoDoc } =
        await getRankingGeneral(LIMITE_POR_PAGINA, lastDoc);

      const siguientePaginaConPerfil = await enriquecerConPerfil(siguientePagina);

      setItems((previos) => [...previos, ...siguientePaginaConPerfil]);
      setLastDoc(ultimoDoc);
      setHayMas(siguientePagina.length === LIMITE_POR_PAGINA);
    } catch (error) {
      console.error("Error al cargar más resultados:", error);
    } finally {
      setCargandoMas(false);
    }
  };

  if (loading) {
    return (
      <div className="ranking-page">
        <p>Cargando ranking...</p>
      </div>
    );
  }

  const podio = items.slice(0, 3);

  return (
    <div className="ranking-page">

      {/* Encabezado */}
      <header className="ranking-header">
        <div>
          <h1>🏆 Ranking</h1>
          <p>
            Compara tu progreso y posición con otros estudiantes.
          </p>
        </div>
      </header>

      {/* Podio */}
      <section className="ranking-podium">

        {podio.map((item, index) => (
          <div
            key={item.id}
            className={`podium-card position-${index + 1} ${
              item.usuarioId === user?.uid ? "current-user" : ""
            }`}
          >
            <div className="podium-medal">
              {getPositionIcon(index + 1)}
            </div>

            <div className="student-avatar">
              {getInitials(item.nombre)}
            </div>

            <h2>{item.nombre || "Estudiante"}</h2>

            <strong>
              {(item.puntajeAcumulado || 0).toLocaleString()} pts
            </strong>
          </div>
        ))}

      </section>

      {/* Tabla */}
      <section className="ranking-table-container">

        <div className="ranking-table-header">
          <h2>Clasificación</h2>
          <span>{items.length} estudiantes</span>
        </div>

        <div className="ranking-table">

          <div className="ranking-row ranking-row-title">
            <span>Pos.</span>
            <span>Estudiante</span>
            <span>Nivel</span>
            <span>Puntos</span>
          </div>

          {items.map((item, index) => (
            <div
              key={item.id}
              className={`ranking-row ${
                item.usuarioId === user?.uid ? "current-ranking-user" : ""
              }`}
            >

              <div className="ranking-position">
                {getPositionIcon(index + 1)}
              </div>

              <div className="ranking-student">

                <div className="ranking-avatar">
                  {getInitials(item.nombre)}
                </div>

                <div>
                  <strong>{item.nombre || "Estudiante"}</strong>

                  {item.usuarioId === user?.uid && (
                    <span className="you-badge">
                      Tú
                    </span>
                  )}
                </div>

              </div>

              <div>
                <span className="level-badge">
                  {item.nivel || "-"}
                </span>
              </div>

              <div className="ranking-points">
                {(item.puntajeAcumulado || 0).toLocaleString()} pts
              </div>

            </div>
          ))}

        </div>

        {hayMas && (
          <div className="ranking-table-header">
            <button
              type="button"
              onClick={handleCargarMas}
              disabled={cargandoMas}
            >
              {cargandoMas ? "Cargando..." : "Cargar más"}
            </button>
          </div>
        )}
      </section>

      {/* Información del usuario */}
      {miPosicion && (
        <section className="my-ranking-card">

          <div className="my-ranking-icon">
            📊
          </div>

          <div className="my-ranking-info">
            <h3>Tu posición actual</h3>
            <p>
              Sigue completando quizzes para subir posiciones.
            </p>
          </div>

          <div className="my-ranking-position">
            <strong>#{miPosicion.posicion}</strong>
            <span>posición</span>
          </div>

        </section>
      )}

    </div>
  );
}

export default Ranking;
