import React, { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import "./Results.css";

import { getCatalogoLogros } from "../../../repositories/logroRepository";
import { getResultadoConRespuestas } from "../../../repositories/resultRepository";
import { useAuth } from "../../../hooks/useAuth";

const Results = () => {
  const navigate = useNavigate();
  const { resultadoId } = useParams();
  const { user, refreshProfile } = useAuth();

  const [resultado, setResultado] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const location = useLocation();
  const nuevosLogrosIds = location.state?.nuevosLogros ?? [];
  const [logrosNuevos, setLogrosNuevos] = useState([]);

  useEffect(() => {
    if (nuevosLogrosIds.length === 0) return;

    getCatalogoLogros()
      .then((catalogo) =>
        setLogrosNuevos(catalogo.filter((logro) => nuevosLogrosIds.includes(logro.id)))
      )
      .catch((err) => console.error("No se pudo cargar el catálogo de logros:", err));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resultadoId]);

  useEffect(() => {
    const loadResultado = async () => {
      if (!resultadoId) {
        setResultado(null);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError("");

        const data = await getResultadoConRespuestas(resultadoId);

        if (data && user?.uid && data.usuarioId !== user.uid) {
          setError("No tienes permiso para ver este resultado.");
          setResultado(null);
          return;
        }

        setResultado(data);
      } catch (err) {
        console.error("Error al cargar el resultado:", err);
        setError("No se pudo cargar el resultado.");
      } finally {
        setLoading(false);
      }
    };

    loadResultado();
  }, [resultadoId, user]);

  useEffect(() => {
    refreshProfile();
  }, [resultadoId, refreshProfile]);

  const getResultStatus = (data) =>
    Number(data?.puntaje ?? 0) >= 60 ? "Aprobado" : "No aprobado";

  const getStatusClass = (data) =>
    getResultStatus(data) === "Aprobado"
      ? "results-status--passed"
      : "results-status--failed";

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

  const handleGoHome = () => {
    navigate("/inicio");
  };

  const handleRetry = () => {
    navigate("/practica");
  };

  const handleFeedback = () => {
    navigate(`/resultados/${resultadoId}/retroalimentacion`);
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

  if (!resultado) {
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

  const totalPreguntas =
    (resultado.respuestasCorrectas || 0) + (resultado.respuestasIncorrectas || 0);

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
                {resultado.puntaje}%
              </span>

              <span className="results-score-label">
                Puntaje
              </span>
            </div>
          </div>

          <div className="results-main-info">
            <span
              className={`results-status ${getStatusClass(resultado)}`}
            >
              {getResultStatus(resultado)}
            </span>

            <h2>Tu resultado</h2>

            <p className="results-date">
              {formatDate(resultado.fecha)}
            </p>
          </div>

        </article>

        {/* Estadísticas */}
        <div className="results-stats">

          <div className="results-stat-card">
            <span className="results-stat-icon">📝</span>

            <div>
              <strong>{totalPreguntas}</strong>
              <span>Preguntas</span>
            </div>
          </div>

          <div className="results-stat-card results-stat-card--correct">
            <span className="results-stat-icon">✓</span>

            <div>
              <strong>{resultado.respuestasCorrectas || 0}</strong>
              <span>Correctas</span>
            </div>
          </div>

          <div className="results-stat-card results-stat-card--incorrect">
            <span className="results-stat-icon">✕</span>

            <div>
              <strong>{resultado.respuestasIncorrectas || 0}</strong>
              <span>Incorrectas</span>
            </div>
          </div>

        </div>

        {/* Logros nuevos */}
        {logrosNuevos.length > 0 && (
          <div className="results-stats">
            {logrosNuevos.map((logro) => (
              <div key={logro.id} className="results-stat-card results-stat-card--correct">
                <span className="results-stat-icon">🏅</span>

                <div>
                  <strong>¡Logro desbloqueado!</strong>
                  <span>{logro.nombre}</span>
                </div>
              </div>
            ))}
          </div>
        )}

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
            className="results-button results-button--secondary"
            onClick={handleFeedback}
          >
            Ver retroalimentación
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
