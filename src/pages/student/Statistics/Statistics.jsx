import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Statistics.css";

import { useAuth } from "../../../hooks/useAuth";
import { calcularEstadisticas } from "../../../services/statisticsService";
import ProgressBar from "../../../components/ProgressBar/ProgressBar";

const Estadistica = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [porArea, setPorArea] = useState([]);
  const [general, setGeneral] = useState({ totalPruebas: 0, promedioAciertos: 0 });
  const [temasRecomendados, setTemasRecomendados] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadStatistics = async () => {
      if (!user?.uid) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError("");

        const data = await calcularEstadisticas(user.uid);

        setPorArea(data.porArea || []);
        setGeneral(data.general || { totalPruebas: 0, promedioAciertos: 0 });
        setTemasRecomendados(data.temasRecomendados || []);
      } catch (err) {
        console.error(err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadStatistics();
  }, [user]);

  if (loading) {
    return (
      <main className="estadistica-container">
        <div className="estadistica-loading">
          <div className="estadistica-spinner"></div>

          <p>Cargando estadísticas...</p>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="estadistica-container">
        <div className="estadistica-error">
          <div className="estadistica-error-icon">
            !
          </div>

          <h2>No se pudieron cargar las estadísticas</h2>

          <p>{error}</p>

          <button
            onClick={() => window.location.reload()}
            className="estadistica-button"
          >
            Intentar nuevamente
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="estadistica-container">

      {/* =====================================================
          ENCABEZADO
      ====================================================== */}
      <section className="estadistica-header">
        <div>
          <p className="estadistica-label">
            MI PROGRESO
          </p>

          <h1>Estadísticas</h1>

          <p className="estadistica-description">
            Consulta tu rendimiento y observa cómo
            has avanzado en LearnFex.
          </p>
        </div>

        <button
          className="estadistica-practice-button"
          onClick={() => navigate("/practica")}
        >
          Practicar
        </button>
      </section>

      {/* =====================================================
          TARJETAS PRINCIPALES
      ====================================================== */}
      <section className="estadistica-cards">

        <article className="estadistica-card">
          <div className="estadistica-card-top">
            <div className="estadistica-card-icon">
              %
            </div>

            <span>Promedio general</span>
          </div>

          <strong className="estadistica-card-value">
            {general.promedioAciertos}%
          </strong>

          <p>
            Rendimiento promedio
          </p>
        </article>

        <article className="estadistica-card">
          <div className="estadistica-card-top">
            <div className="estadistica-card-icon">
              ★
            </div>

            <span>Pruebas</span>
          </div>

          <strong className="estadistica-card-value">
            {general.totalPruebas}
          </strong>

          <p>
            Pruebas realizadas
          </p>
        </article>

      </section>

      {/* =====================================================
          PROGRESO POR ÁREA
      ====================================================== */}
      <section className="estadistica-section">

        <div className="estadistica-section-header">
          <div>
            <h2>Progreso por área</h2>

            <p>
              Observa tu rendimiento en cada área.
            </p>
          </div>
        </div>

        <div className="estadistica-progress-list">

          {porArea.length > 0 ? (
            porArea.map((area) => (
              <div
                className="estadistica-progress-item"
                key={area.areaId}
              >
                <ProgressBar
                  value={area.promedioAciertos}
                  label={area.nombre}
                  showPercentage
                  variant={
                    area.promedioAciertos >= 80
                      ? "success"
                      : area.promedioAciertos >= 60
                        ? "primary"
                        : "danger"
                  }
                />
              </div>
            ))
          ) : (
            <div className="estadistica-empty">
              <span>📚</span>

              <p>
                Todavía no tienes progreso registrado.
              </p>

              <button
                onClick={() => navigate("/practica")}
                className="estadistica-button"
              >
                Comenzar una práctica
              </button>
            </div>
          )}

        </div>
      </section>

      {/* =====================================================
          TEMAS RECOMENDADOS
      ====================================================== */}
      <section className="estadistica-section">

        <div className="estadistica-section-header">
          <div>
            <h2>Temas recomendados</h2>

            <p>
              Áreas donde más puedes mejorar.
            </p>
          </div>

          <button
            className="estadistica-link-button"
            onClick={() => navigate("/practica")}
          >
            Practicar
          </button>
        </div>

        <div className="estadistica-results">

          {temasRecomendados.length > 0 ? (
            temasRecomendados.map((tema) => (
              <article
                className="estadistica-result"
                key={tema}
              >
                <div className="estadistica-result-info">

                  <div className="estadistica-result-icon">
                    ✓
                  </div>

                  <div>
                    <strong>{tema}</strong>

                    <span>Refuerza esta área</span>
                  </div>

                </div>

                <div className="estadistica-result-score">
                  <strong className="estadistica-result-low">
                    Recomendado
                  </strong>
                </div>
              </article>
            ))
          ) : (
            <div className="estadistica-empty">
              <span>📊</span>

              <p>
                No hay temas recomendados por ahora.
              </p>
            </div>
          )}

        </div>
      </section>

      {/* =====================================================
          CONSEJO
      ====================================================== */}
      <section className="estadistica-tip">

        <div className="estadistica-tip-icon">
          💡
        </div>

        <div>
          <h2>Sigue practicando</h2>

          <p>
            La práctica constante te ayudará a mejorar
            tus resultados y avanzar en LearnFex.
          </p>
        </div>

        <button
          onClick={() => navigate("/practica")}
          className="estadistica-tip-button"
        >
          Empezar
        </button>

      </section>

    </main>
  );
};

export default Estadistica;
