import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Results.css";

import {
  getRecentResultsByUser,
} from "../repositories/resultRepository";

const Results = ({ userId }) => {
  const navigate = useNavigate();

  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadResults = async () => {
      if (!userId) {
        setResults([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError("");

        const data = await getRecentResultsByUser(userId);

        setResults(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Error al cargar los resultados:", err);
        setError("No se pudieron cargar los resultados.");
      } finally {
        setLoading(false);
      }
    };

    loadResults();
  }, [userId]);

  const getPercentage = (result) => {
    const percentage = Number(result?.percentage ?? 0);

    if (percentage <= 1) {
      return Math.round(percentage * 100);
    }

    return Math.round(percentage);
  };

  const getCorrectAnswers = (result) =>
    Number(result?.correctAnswers ?? 0);

  const getIncorrectAnswers = (result) =>
    Number(
      result?.incorrectAnswers ??
        Math.max(
          0,
          Number(result?.totalQuestions ?? 0) -
            getCorrectAnswers(result)
        )
    );

  const getTotalQuestions = (result) =>
    Number(result?.totalQuestions ?? 0);

  const getResultStatus = (result) => {
    if (result?.passed === true) {
      return "Aprobado";
    }

    if (result?.passed === false) {
      return "No aprobado";
    }

    return getPercentage(result) >= 60 ? "Aprobado" : "No aprobado";
  };

  const getStatusClass = (result) => {
    return getResultStatus(result) === "Aprobado"
      ? "results-status--passed"
      : "results-status--failed";
  };

  const formatDate = (date) => {
    if (!date) return "Sin fecha";

    try {
      let parsedDate = date;

      if (date?.seconds) {
        parsedDate = new Date(date.seconds * 1000);
      }

      const formattedDate = new Date(parsedDate);

      if (Number.isNaN(formattedDate.getTime())) {
        return "Sin fecha";
      }

      return formattedDate.toLocaleDateString("es-CO", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
    } catch {
      return "Sin fecha";
    }
  };

  const getAreaName = (result) => {
    return (
      result?.areaName ||
      result?.area ||
      result?.areaId ||
      "Área general"
    );
  };

  const handleGoHome = () => {
    navigate("/");
  };

  const handleRetry = () => {
    navigate("/quiz");
  };

  if (loading) {
    return (
      <section className="results">
        <div className="results-loading">
          <div className="results-spinner"></div>
          <p>Cargando resultados...</p>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="results">
        <div className="results-error">
          <span className="results-error-icon">⚠️</span>
          <h2>Ocurrió un error</h2>
          <p>{error}</p>

          <button
            type="button"
            className="results-button results-button--primary"
            onClick={() => window.location.reload()}
          >
            Intentar nuevamente
          </button>
        </div>
      </section>
    );
  }

  if (results.length === 0) {
    return (
      <section className="results">
        <div className="results-empty">
          <div className="results-empty-icon">📊</div>

          <h1>Aún no tienes resultados</h1>

          <p>
            Completa un cuestionario para comenzar a ver tu
            progreso.
          </p>

          <button
            type="button"
            className="results-button results-button--primary"
            onClick={handleRetry}
          >
            Realizar cuestionario
          </button>
        </div>
      </section>
    );
  }

  const latestResult = results[0];

  const latestPercentage = getPercentage(latestResult);
  const latestCorrect = getCorrectAnswers(latestResult);
  const latestIncorrect = getIncorrectAnswers(latestResult);
  const latestTotal = getTotalQuestions(latestResult);

  return (
    <section className="results">
      <div className="results-container">

        {/* Encabezado */}
        <header className="results-header">
          <div>
            <span className="results-subtitle">
              RESULTADOS
            </span>

            <h1>¡Cuestionario completado!</h1>

            <p>
              Revisa tu desempeño y continúa mejorando.
            </p>
          </div>
        </header>

        {/* Resultado principal */}
        <article className="results-main-card">

          <div className="results-score">
            <div className="results-score-circle">
              <span className="results-score-value">
                {latestPercentage}%
              </span>

              <span className="results-score-label">
                Puntaje
              </span>
            </div>
          </div>

          <div className="results-main-info">
            <span
              className={`results-status ${getStatusClass(
                latestResult
              )}`}
            >
              {getResultStatus(latestResult)}
            </span>

            <h2>Tu resultado</h2>

            <p className="results-area">
              Área: {getAreaName(latestResult)}
            </p>

            <p className="results-date">
              {formatDate(latestResult.createdAt)}
            </p>
          </div>

        </article>

        {/* Estadísticas */}
        <div className="results-stats">

          <div className="results-stat-card">
            <span className="results-stat-icon">📝</span>

            <div>
              <strong>{latestTotal}</strong>
              <span>Preguntas</span>
            </div>
          </div>

          <div className="results-stat-card results-stat-card--correct">
            <span className="results-stat-icon">✓</span>

            <div>
              <strong>{latestCorrect}</strong>
              <span>Correctas</span>
            </div>
          </div>

          <div className="results-stat-card results-stat-card--incorrect">
            <span className="results-stat-icon">✕</span>

            <div>
              <strong>{latestIncorrect}</strong>
              <span>Incorrectas</span>
            </div>
          </div>

        </div>

        {/* Historial */}
        <section className="results-history">

          <div className="results-section-header">
            <div>
              <h2>Historial de resultados</h2>
              <p>
                Consulta tus cuestionarios anteriores.
              </p>
            </div>
          </div>

          <div className="results-table-wrapper">
            <table className="results-table">
              <thead>
                <tr>
                  <th>Área</th>
                  <th>Preguntas</th>
                  <th>Correctas</th>
                  <th>Puntaje</th>
                  <th>Estado</th>
                  <th>Fecha</th>
                </tr>
              </thead>

              <tbody>
                {results.map((result, index) => {
                  const percentage = getPercentage(result);

                  return (
                    <tr key={result.id || index}>

                      <td>
                        <span className="results-area-name">
                          {getAreaName(result)}
                        </span>
                      </td>

                      <td>
                        {getTotalQuestions(result)}
                      </td>

                      <td>
                        <span className="results-correct">
                          {getCorrectAnswers(result)}
                        </span>
                      </td>

                      <td>
                        <strong>
                          {percentage}%
                        </strong>
                      </td>

                      <td>
                        <span
                          className={`results-status ${getStatusClass(
                            result
                          )}`}
                        >
                          {getResultStatus(result)}
                        </span>
                      </td>

                      <td>
                        {formatDate(result.createdAt)}
                      </td>

                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        {/* Botones */}
        <div className="results-actions">

          <button
            type="button"
            className="results-button results-button--secondary"
            onClick={handleGoHome}
          >
            Volver al inicio
          </button>

          <button
            type="button"
            className="results-button results-button--primary"
            onClick={handleRetry}
          >
            Nuevo cuestionario
          </button>

        </div>

      </div>
    </section>
  );
};

export default Results;