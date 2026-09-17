import React from "react";
import { useNavigate } from "react-router-dom";
import "./Home.css";

const Home = () => {
  const navigate = useNavigate();

  // Datos temporales del estudiante.
  // Posteriormente pueden venir desde el backend.
  const student = {
    name: "Estudiante",
    level: "Nivel intermedio",
    points: 1250,
    streak: 5,
  };

  const areas = [
    {
      id: 1,
      name: "Matemáticas",
      description: "Practica operaciones, álgebra y problemas.",
      icon: "∑",
      path: "/practice?area=matematicas",
    },
    {
      id: 2,
      name: "Lenguaje",
      description: "Mejora tu comprensión y expresión.",
      icon: "Aa",
      path: "/practice?area=lenguaje",
    },
    {
      id: 3,
      name: "Ciencias",
      description: "Aprende sobre ciencia y naturaleza.",
      icon: "⚛",
      path: "/practice?area=ciencias",
    },
    {
      id: 4,
      name: "Inglés",
      description: "Practica vocabulario y comprensión.",
      icon: "EN",
      path: "/practice?area=ingles",
    },
  ];

  const handlePractice = () => {
    navigate("/practica");
  };

  const handleRanking = () => {
    navigate("/ranking");
  };

  const handleResults = () => {
    navigate("/estadisticas");
  };

  const handleArea = (path) => {
    navigate(path);
  };

  return (
    <main className="home-container">

      {/* =====================================================
          ENCABEZADO
      ====================================================== */}
      <section className="home-header">
        <div className="home-welcome">
          <p className="home-greeting">
            ¡Hola, {student.name}! 👋
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

          <strong>{student.level}</strong>
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
              {student.points}
            </strong>
          </div>
        </article>

        <article className="home-stat-card">
          <div className="home-stat-icon">🔥</div>

          <div>
            <span className="home-stat-label">
              Racha
            </span>

            <strong className="home-stat-value">
              {student.streak} días
            </strong>
          </div>
        </article>

        <article className="home-stat-card">
          <div className="home-stat-icon">✓</div>

          <div>
            <span className="home-stat-label">
              Progreso
            </span>

            <strong className="home-stat-value">
              75%
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
              onClick={() => handleArea(area.path)}
            >
              <div className="home-area-icon">
                {area.icon}
              </div>

              <div className="home-area-info">
                <h3>{area.name}</h3>

                <p>{area.description}</p>
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
