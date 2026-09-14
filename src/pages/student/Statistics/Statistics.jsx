import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import resultService from "../../../services/resultService";
import "./Statistics.css";

const Estadistica = () => {
  const navigate = useNavigate();

  const [statistics, setStatistics] = useState({
    average: 0,
    accuracy: 0,
    totalQuestions: 0,
    completedPractices: 0,
  });

  const [progress, setProgress] = useState([]);
  const [recentResults, setRecentResults] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // ---------------------------------------------------------
  // ID DEL ESTUDIANTE
  // ---------------------------------------------------------
  const studentId = localStorage.getItem("studentId");

  // ---------------------------------------------------------
  // CARGAR ESTADÍSTICAS
  // ---------------------------------------------------------
  useEffect(() => {
    const loadStatistics = async () => {
      try {
        setLoading(true);
        setError("");

        if (!studentId) {
          throw new Error(
            "No se encontró el estudiante actual."
          );
        }

        // Estadísticas generales
        const statisticsData =
          await resultService.getStudentStatistics(studentId);

        // Progreso por área
        const progressData =
          await resultService.getProgressByArea(studentId);

        // Resultados recientes
        const resultsData =
          await resultService.getResultsByStudent(studentId);

        setStatistics({
          average:
            statisticsData?.average ??
            statisticsData?.promedio ??
            0,

          accuracy:
            statisticsData?.accuracy ??
            statisticsData?.precision ??
            0,

          totalQuestions:
            statisticsData?.totalQuestions ??
            statisticsData?.preguntasRespondidas ??
            0,

          completedPractices:
            statisticsData?.completedPractices ??
            statisticsData?.practicasCompletadas ??
            0,
        });

        setProgress(
          Array.isArray(progressData)
            ? progressData
            : progressData?.data || []
        );

        setRecentResults(
          Array.isArray(resultsData)
            ? resultsData.slice(0, 5)
            : resultsData?.data?.slice(0, 5) || []
        );
      } catch (err) {
        console.error(err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadStatistics();
  }, [studentId]);

  // ---------------------------------------------------------
  // FORMATEAR PORCENTAJE
  // ---------------------------------------------------------
  const formatPercentage = (value) => {
    const number = Number(value) || 0;

    return `${Math.round(number)}%`;
  };

  // ---------------------------------------------------------
  // COLOR / ESTADO DE RESULTADO
  // ---------------------------------------------------------
  const getResultClass = (score) => {
    const value = Number(score) || 0;

    if (value >= 80) {
      return "estadistica-result-good";
    }

    if (value >= 60) {
      return "estadistica-result-medium";
    }

    return "estadistica-result-low";
  };

  // ---------------------------------------------------------
  // NOMBRE DEL ÁREA
  // ---------------------------------------------------------
  const getAreaName = (area) => {
    const areas = {
      matematicas: "Matemáticas",
      lenguaje: "Lenguaje",
      ciencias: "Ciencias",
      ingles: "Inglés",
      matemáticas: "Matemáticas",
    };

    return areas[area?.toLowerCase()] || area || "General";
  };

  // ---------------------------------------------------------
  // CARGANDO
  // ---------------------------------------------------------
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

  // ---------------------------------------------------------
  // ERROR
  // ---------------------------------------------------------
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

  // ---------------------------------------------------------
  // INTERFAZ
  // ---------------------------------------------------------
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
          onClick={() => navigate("/practice")}
        >
          Practicar
        </button>
      </section>

      {/* =====================================================
          TARJETAS PRINCIPALES
      ====================================================== */}
      <section className="estadistica-cards">

        {/* PROMEDIO */}
        <article className="estadistica-card">
          <div className="estadistica-card-top">
            <div className="estadistica-card-icon">
              %
            </div>

            <span>Promedio</span>
          </div>

          <strong className="estadistica-card-value">
            {formatPercentage(statistics.average)}
          </strong>

          <p>
            Rendimiento promedio
          </p>
        </article>

        {/* PRECISIÓN */}
        <article className="estadistica-card">
          <div className="estadistica-card-top">
            <div className="estadistica-card-icon">
              ✓
            </div>

            <span>Precisión</span>
          </div>

          <strong className="estadistica-card-value">
            {formatPercentage(statistics.accuracy)}
          </strong>

          <p>
            Respuestas correctas
          </p>
        </article>

        {/* PREGUNTAS */}
        <article className="estadistica-card">
          <div className="estadistica-card-top">
            <div className="estadistica-card-icon">
              ?
            </div>

            <span>Preguntas</span>
          </div>

          <strong className="estadistica-card-value">
            {statistics.totalQuestions}
          </strong>

          <p>
            Preguntas respondidas
          </p>
        </article>

        {/* PRÁCTICAS */}
        <article className="estadistica-card">
          <div className="estadistica-card-top">
            <div className="estadistica-card-icon">
              ★
            </div>

            <span>Prácticas</span>
          </div>

          <strong className="estadistica-card-value">
            {statistics.completedPractices}
          </strong>

          <p>
            Prácticas completadas
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

          {progress.length > 0 ? (
            progress.map((item, index) => {
              const value =
                Number(
                  item.progress ??
                  item.average ??
                  item.score ??
                  item.porcentaje ??
                  0
                );

              return (
                <div
                  className="estadistica-progress-item"
                  key={item.id || index}
                >
                  <div className="estadistica-progress-info">

                    <div>
                      <strong>
                        {getAreaName(
                          item.area || item.nombre
                        )}
                      </strong>

                      <span>
                        {formatPercentage(value)}
                      </span>
                    </div>

                    <div className="estadistica-progress-bar">
                      <div
                        className="estadistica-progress-fill"
                        style={{
                          width: `${Math.min(
                            Math.max(value, 0),
                            100
                          )}%`,
                        }}
                      ></div>
                    </div>

                  </div>
                </div>
              );
            })
          ) : (
            <div className="estadistica-empty">
              <span>📚</span>

              <p>
                Todavía no tienes progreso registrado.
              </p>

              <button
                onClick={() => navigate("/practice")}
                className="estadistica-button"
              >
                Comenzar una práctica
              </button>
            </div>
          )}

        </div>
      </section>

      {/* =====================================================
          RESULTADOS RECIENTES
      ====================================================== */}
      <section className="estadistica-section">

        <div className="estadistica-section-header">
          <div>
            <h2>Actividad reciente</h2>

            <p>
              Tus últimas prácticas realizadas.
            </p>
          </div>

          <button
            className="estadistica-link-button"
            onClick={() => navigate("/results")}
          >
            Ver resultados
          </button>
        </div>

        <div className="estadistica-results">

          {recentResults.length > 0 ? (
            recentResults.map((result, index) => {
              const score =
                Number(
                  result.score ??
                  result.puntaje ??
                  result.result ??
                  0
                );

              return (
                <article
                  className="estadistica-result"
                  key={result.id || index}
                >
                  <div className="estadistica-result-info">

                    <div className="estadistica-result-icon">
                      ✓
                    </div>

                    <div>
                      <strong>
                        {getAreaName(
                          result.area
                        )}
                      </strong>

                      <span>
                        {result.topic ||
                          result.tema ||
                          "Práctica"}
                      </span>
                    </div>

                  </div>

                  <div className="estadistica-result-score">
                    <span>
                      Puntaje
                    </span>

                    <strong
                      className={getResultClass(score)}
                    >
                      {formatPercentage(score)}
                    </strong>
                  </div>
                </article>
              );
            })
          ) : (
            <div className="estadistica-empty">
              <span>📊</span>

              <p>
                No hay actividades recientes.
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
          onClick={() => navigate("/practice")}
          className="estadistica-tip-button"
        >
          Empezar
        </button>

      </section>

    </main>
  );
};

export default Estadistica;
