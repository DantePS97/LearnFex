import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Home.css";

import { getAllAreas } from "../../../repositories/areaRepository";
import { useAuth } from "../../../hooks/useAuth";

// Misma regla que functions/src/gamificacion.js: el nivel sube cada 1000 XP.
const XP_POR_NIVEL = 1000;

const Home = () => {
  const navigate = useNavigate();
  const { profile } = useAuth();

  const nombre = profile?.nombre?.trim() || "Estudiante";
  const xp = profile?.xp ?? 0;
  const nivel = profile?.nivel ?? 1;
  const xpEnNivel = xp % XP_POR_NIVEL;
  const progresoNivel = Math.round((xpEnNivel / XP_POR_NIVEL) * 100);

  const [areas, setAreas] = useState([]);

  useEffect(() => {
    const cargarAreas = async () => {
      try {
        const data = await getAllAreas();

        setAreas(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Error al cargar las áreas:", error);
        setAreas([]);
      }
    };

    cargarAreas();
  }, []);

  const handlePractice = () => {
    navigate("/practica");
  };

  const handleRanking = () => {
    navigate("/ranking");
  };

  const handleResults = () => {
    navigate("/estadisticas");
  };

  const handleArea = (area) => {
    navigate("/practica", { state: { areaNombre: area.nombre } });
  };

  return (
    <main className="home-container">

      {/* =====================================================
          ENCABEZADO
      ====================================================== */}
      <section className="home-header">
        <div className="home-welcome">
          <p className="home-greeting">
            ¡Hola, {nombre}! 👋
          </p>

          <h1 className="home-title">
            ¿Listo para aprender?
          </h1>

          <p className="home-subtitle">
            Continúa practicando y mejora tus conocimientos
            todos los días.
          </p>
        </div>

        <div className="home-level">
          <span className="home-level-label">
            Tu nivel
          </span>

          <strong>Nivel {nivel}</strong>
        </div>
      </section>

      {/* =====================================================
          TARJETAS DE ESTADÍSTICAS
      ====================================================== */}
      <section className="home-stats">

        <article className="home-stat-card">
          <div className="home-stat-icon">★</div>

          <div>
            <span className="home-stat-label">
              Puntos
            </span>

            <strong className="home-stat-value">
              {xp}
            </strong>
          </div>
        </article>

        <article className="home-stat-card">
          <div className="home-stat-icon">⬆</div>

          <div>
            <span className="home-stat-label">
              Para subir de nivel
            </span>

            <strong className="home-stat-value">
              {XP_POR_NIVEL - xpEnNivel} XP
            </strong>
          </div>
        </article>

        <article className="home-stat-card">
          <div className="home-stat-icon">✓</div>

          <div>
            <span className="home-stat-label">
              Progreso del nivel
            </span>

            <strong className="home-stat-value">
              {progresoNivel}%
            </strong>
          </div>
        </article>

      </section>

      {/* =====================================================
          ACCIONES PRINCIPALES
      ====================================================== */}
      <section className="home-actions">

        <article className="home-action-card home-action-practice">
          <div className="home-action-content">
            <span className="home-action-icon">✎</span>

            <div>
              <h2>Practicar</h2>

              <p>
                Resuelve preguntas y pon a prueba
                tus conocimientos.
              </p>
            </div>
          </div>

          <button
            className="home-button"
            onClick={handlePractice}
          >
            Comenzar práctica
          </button>
        </article>

        <article className="home-action-card">
          <div className="home-action-content">
            <span className="home-action-icon">📊</span>

            <div>
              <h2>Mis resultados</h2>

              <p>
                Revisa tus resultados y observa
                cómo has progresado.
              </p>
            </div>
          </div>

          <button
            className="home-button home-button-secondary"
            onClick={handleResults}
          >
            Ver resultados
          </button>
        </article>

      </section>

      {/* =====================================================
          ÁREAS DE APRENDIZAJE
      ====================================================== */}
      <section className="home-section">

        <div className="home-section-header">
          <div>
            <h2>Áreas de aprendizaje</h2>

            <p>
              Elige un área y comienza a practicar.
            </p>
          </div>

          <button
            className="home-see-more"
            onClick={handlePractice}
          >
            Ver todas
          </button>
        </div>

        <div className="home-areas">

          {areas.map((area) => (
            <article
              className="home-area-card"
              key={area.id}
              onClick={() => handleArea(area)}
            >
              <div className="home-area-icon">
                {(area.nombre || "?").charAt(0)}
              </div>

              <div className="home-area-info">
                <h3>{area.nombre}</h3>

                <p>{area.descripcion}</p>
              </div>

              <span className="home-area-arrow">
                →
              </span>
            </article>
          ))}

        </div>

      </section>

      {/* =====================================================
          RANKING
      ====================================================== */}
      <section className="home-ranking">

        <div className="home-ranking-icon">
          🏆
        </div>

        <div className="home-ranking-content">
          <h2>¿Cómo estás frente a otros estudiantes?</h2>

          <p>
            Consulta el ranking y descubre tu posición
            entre los estudiantes de LearnFex.
          </p>
        </div>

        <button
          className="home-ranking-button"
          onClick={handleRanking}
        >
          Ver ranking
        </button>

      </section>

    </main>
  );
};

export default Home;
