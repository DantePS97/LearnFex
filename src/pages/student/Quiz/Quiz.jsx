import React, { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "./Quiz.css";

import { useAuth } from "../../../hooks/useAuth";
import { useTimer } from "../../../hooks/useTimer";
import { getAllAreas, getAreaById } from "../../../repositories/areaRepository";
import { obtenerPreguntas } from "../../../services/questionService";
import { armarCuestionario, armarSimulacro } from "../../../services/quizService";
import { calificarPrueba } from "../../../services/resultService";
import QuestionCard from "../../../components/QuestionCard/QuestionCard";

const CANTIDAD_POR_DEFECTO = 10;
const DURACION_POR_DEFECTO_MINUTOS = 20;

export default function Quiz() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();

  const areaId = location.state?.areaId ?? null;
  const cantidad = location.state?.cantidad ?? CANTIDAD_POR_DEFECTO;

  const [cuestionarioId, setCuestionarioId] = useState(null);
  const [areaNombre, setAreaNombre] = useState("");
  const [preguntas, setPreguntas] = useState([]);
  const [duracion, setDuracion] = useState(0);
  const [respuestas, setRespuestas] = useState({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [enviando, setEnviando] = useState(false);

  const finalizadoRef = useRef(false);
  const preparadoRef = useRef(false);

  const finalizarCuestionario = async (tiempoRestante) => {
    if (finalizadoRef.current) return;

    finalizadoRef.current = true;
    setEnviando(true);

    try {
      const respuestasEstudiante = preguntas.map((pregunta) => ({
        preguntaId: pregunta.id,
        respuestaSeleccionada: respuestas[pregunta.id] ?? null,
      }));

      const tiempoEmpleado = Math.max(duracion - tiempoRestante, 0);

      const resultado = await calificarPrueba(
        cuestionarioId,
        respuestasEstudiante,
        user.uid,
        tiempoEmpleado
      );

      navigate(`/resultados/${resultado.resultadoId}`);
    } catch (err) {
      console.error("Error al calificar la prueba:", err);
      setError("No se pudo calificar el cuestionario.");
      finalizadoRef.current = false;
      setEnviando(false);
    }
  };

  const { time, formatted, start, reset } = useTimer({
    initialTime: duracion,
    countdown: true,
    autoStart: false,
    onEnd: () => finalizarCuestionario(0),
  });

  useEffect(() => {
    if (preparadoRef.current) return;
    preparadoRef.current = true;

    const cargarCuestionario = async () => {
      try {
        setLoading(true);
        setError("");

        if (areaId) {
          const [idCuestionario, preguntasArea, area] = await Promise.all([
            armarCuestionario(areaId, cantidad),
            obtenerPreguntas(areaId, null, cantidad),
            getAreaById(areaId),
          ]);

          setCuestionarioId(idCuestionario);
          setPreguntas(preguntasArea);
          setAreaNombre(area?.nombre ?? "");
          setDuracion((area?.tiempoLimite || DURACION_POR_DEFECTO_MINUTOS) * 60);
        } else {
          const idCuestionario = await armarSimulacro();
          const areas = await getAllAreas();

          const preguntasSimulacro = (
            await Promise.all(
              areas.map((area) => obtenerPreguntas(area.id, null, area.numPreguntas))
            )
          ).flat();

          const duracionTotal = areas.reduce(
            (total, area) => total + (area.tiempoLimite || 0),
            0
          );

          setCuestionarioId(idCuestionario);
          setPreguntas(preguntasSimulacro);
          setAreaNombre("Simulacro general");
          setDuracion((duracionTotal || DURACION_POR_DEFECTO_MINUTOS) * 60);
        }
      } catch (err) {
        console.error("Error al preparar el cuestionario:", err);
        setError("No se pudo preparar el cuestionario.");
      } finally {
        setLoading(false);
      }
    };

    cargarCuestionario();
  }, [areaId, cantidad]);

  useEffect(() => {
    if (!loading && duracion > 0) {
      reset();
      start();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, duracion]);

  const pregunta = preguntas[currentIndex];
  const seleccionada = pregunta ? respuestas[pregunta.id] ?? null : null;
  const esUltima = currentIndex >= preguntas.length - 1;

  const handleSeleccionar = (opcionId) => {
    if (!pregunta) return;

    setRespuestas((previas) => ({
      ...previas,
      [pregunta.id]: opcionId,
    }));
  };

  const handlePrevious = () => {
    if (currentIndex === 0) return;

    setCurrentIndex((previo) => previo - 1);
  };

  const handleNext = () => {
    if (esUltima) return;

    setCurrentIndex((previo) => previo + 1);
  };

  const goToQuestion = (index) => {
    setCurrentIndex(index);
  };

  if (loading) {
    return (
      <div className="quiz-screen quiz-screen--centrado">
        <p>Preparando cuestionario...</p>
      </div>
    );
  }

  if (error || !pregunta) {
    return (
      <div className="quiz-screen quiz-screen--centrado">
        <p>{error || "No hay preguntas disponibles."}</p>
      </div>
    );
  }

  return (
    <div className="quiz-screen">

      <header className="quiz-header">
        <div className="quiz-header-content">

          <div className="quiz-brand">
            <div className="quiz-logo">
              🎓
            </div>

            <div>
              <h1>LearnFex</h1>

              <span>{areaNombre}</span>
            </div>
          </div>

          <div className="quiz-header-info">

            <div className="question-counter">
              <span>Pregunta</span>

              <strong>
                {currentIndex + 1} de {preguntas.length}
              </strong>
            </div>

            <div className="quiz-timer">
              <span>⏱</span>

              <strong>{formatted}</strong>
            </div>

          </div>
        </div>
      </header>

      <main className="quiz-container">

        <QuestionCard
          numero={currentIndex + 1}
          total={preguntas.length}
          enunciado={pregunta.enunciado}
          opciones={pregunta.opciones}
          seleccionada={seleccionada}
          onSeleccionar={handleSeleccionar}
        />

        <div className="question-controls">

          <button
            type="button"
            className="previous-button"
            onClick={handlePrevious}
            disabled={currentIndex === 0}
          >
            ← Anterior
          </button>

          {esUltima ? (
            <button
              type="button"
              className="next-button"
              onClick={() => finalizarCuestionario(time)}
              disabled={enviando}
            >
              {enviando ? "Enviando..." : "Finalizar"}
            </button>
          ) : (
            <button
              type="button"
              className="next-button"
              onClick={handleNext}
            >
              Siguiente →
            </button>
          )}

        </div>

        <section className="question-navigation">

          <div className="navigation-header">

            <h3>
              Navegación de preguntas
            </h3>

            <div className="navigation-legend">

              <span>
                <i className="legend-dot answered" />
                Respondida
              </span>

              <span>
                <i className="legend-dot unanswered" />
                Sin responder
              </span>

            </div>

          </div>

          <div className="question-numbers">

            {preguntas.map((item, index) => {
              const answered = respuestas[item.id] !== undefined && respuestas[item.id] !== null;
              const current = currentIndex === index;

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => goToQuestion(index)}
                  className={`question-number ${current ? "current" : ""} ${
                    answered ? "answered" : ""
                  }`}
                >
                  {index + 1}
                </button>
              );
            })}

          </div>

        </section>

        <div className="mobile-timer">

          <span>⏱</span>

          <strong>{formatted}</strong>

        </div>

      </main>
    </div>
  );
}
