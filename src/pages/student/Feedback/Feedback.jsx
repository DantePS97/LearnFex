import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import "./Feedback.css";

import { getResultadoConRespuestas } from "../../../repositories/resultRepository";
import { getQuestionById } from "../../../repositories/questionRepository";
import QuestionCard from "../../../components/QuestionCard/QuestionCard";

const Feedback = () => {
  const navigate = useNavigate();
  const { resultadoId } = useParams();

  const [preguntasRetroalimentacion, setPreguntasRetroalimentacion] = useState([]);
  const [omitidas, setOmitidas] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const cargarRetroalimentacion = async () => {
      if (!resultadoId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError("");

        const resultado = await getResultadoConRespuestas(resultadoId);

        if (!resultado) {
          setError("No se encontró el resultado solicitado.");
          return;
        }

        const detalles = await Promise.all(
          (resultado.respuestas || []).map(async (respuesta) => {
            const pregunta = await getQuestionById(respuesta.preguntaId);

            return { respuesta, pregunta };
          })
        );

        const disponibles = detalles.filter((item) => item.pregunta);

        setPreguntasRetroalimentacion(disponibles);
        setOmitidas(detalles.length - disponibles.length);
      } catch (err) {
        console.error("Error al cargar la retroalimentación:", err);
        setError("No se pudo cargar la retroalimentación.");
      } finally {
        setLoading(false);
      }
    };

    cargarRetroalimentacion();
  }, [resultadoId]);

  const handleVolver = () => {
    navigate(`/resultados/${resultadoId}`);
  };

  if (loading) {
    return (
      <div className="feedback-container">
        <p>Cargando retroalimentación...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="feedback-container">
        <p>{error}</p>

        <button type="button" className="feedback-back-button" onClick={handleVolver}>
          Volver a resultados
        </button>
      </div>
    );
  }

  return (
    <div className="feedback-container">
      <header className="feedback-header">
        <h1>Retroalimentación</h1>
        <p>Revisa cada pregunta, tu respuesta y la correcta.</p>

        {omitidas > 0 && (
          <p>
            {omitidas === 1
              ? "1 pregunta de esta prueba ya no está disponible porque fue eliminada del banco."
              : `${omitidas} preguntas de esta prueba ya no están disponibles porque fueron eliminadas del banco.`}
          </p>
        )}
      </header>

      <div className="feedback-list">
        {preguntasRetroalimentacion.map(({ respuesta, pregunta }, index) => (
          <QuestionCard
            key={respuesta.id || pregunta.id}
            numero={index + 1}
            total={preguntasRetroalimentacion.length}
            enunciado={pregunta.enunciado}
            opciones={pregunta.opciones}
            seleccionada={respuesta.respuestaSeleccionada}
            modoRetroalimentacion
            respuestaCorrecta={pregunta.respuestaCorrecta}
            explicacion={pregunta.explicacion}
          />
        ))}
      </div>

      <button type="button" className="feedback-back-button" onClick={handleVolver}>
        Volver a resultados
      </button>
    </div>
  );
};

export default Feedback;
