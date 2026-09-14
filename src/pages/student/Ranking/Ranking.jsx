// src/components/Ranking.jsx

import React, { useState } from "react";
import "./Ranking.css";

const rankingData = [
  {
    id: 1,
    position: 1,
    name: "María González",
    points: 2450,
    quizzes: 32,
    level: "Experto"
  },
  {
    id: 2,
    position: 2,
    name: "Juan Pérez",
    points: 2180,
    quizzes: 29,
    level: "Experto"
  },
  {
    id: 3,
    position: 3,
    name: "Carlos Infante",
    points: 1950,
    quizzes: 25,
    level: "Avanzado",
    currentUser: true
  },
  {
    id: 4,
    position: 4,
    name: "Sofía Martínez",
    points: 1870,
    quizzes: 24,
    level: "Avanzado"
  },
  {
    id: 5,
    position: 5,
    name: "Andrés Rodríguez",
    points: 1740,
    quizzes: 22,
    level: "Avanzado"
  },
  {
    id: 6,
    position: 6,
    name: "Laura Sánchez",
    points: 1620,
    quizzes: 20,
    level: "Intermedio"
  },
  {
    id: 7,
    position: 7,
    name: "Daniel Torres",
    points: 1490,
    quizzes: 18,
    level: "Intermedio"
  },
  {
    id: 8,
    position: 8,
    name: "Valentina López",
    points: 1350,
    quizzes: 17,
    level: "Intermedio"
  }
];

const getPositionIcon = (position) => {
  if (position === 1) return "🥇";
  if (position === 2) return "🥈";
  if (position === 3) return "🥉";

  return position;
};

const getInitials = (name) => {
  return name
    .split(" ")
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase();
};

function Ranking() {
  const [filter, setFilter] = useState("general");

  const filteredRanking = [...rankingData].sort(
    (a, b) => b.points - a.points
  );

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

      {/* Filtros */}
      <div className="ranking-filters">
        <button
          className={filter === "general" ? "active" : ""}
          onClick={() => setFilter("general")}
        >
          Ranking general
        </button>

        <button
          className={filter === "semanal" ? "active" : ""}
          onClick={() => setFilter("semanal")}
        >
          Esta semana
        </button>

        <button
          className={filter === "mensual" ? "active" : ""}
          onClick={() => setFilter("mensual")}
        >
          Este mes
        </button>
      </div>

      {/* Podio */}
      <section className="ranking-podium">

        {filteredRanking.slice(0, 3).map((student) => (
          <div
            key={student.id}
            className={`podium-card position-${student.position} ${
              student.currentUser ? "current-user" : ""
            }`}
          >
            <div className="podium-medal">
              {getPositionIcon(student.position)}
            </div>

            <div className="student-avatar">
              {getInitials(student.name)}
            </div>

            <h2>{student.name}</h2>

            <span className="student-level">
              {student.level}
            </span>

            <strong>{student.points.toLocaleString()} pts</strong>

            <small>
              {student.quizzes} quizzes completados
            </small>
          </div>
        ))}

      </section>

      {/* Tabla */}
      <section className="ranking-table-container">

        <div className="ranking-table-header">
          <h2>Clasificación</h2>
          <span>{filteredRanking.length} estudiantes</span>
        </div>

        <div className="ranking-table">

          <div className="ranking-row ranking-row-title">
            <span>Pos.</span>
            <span>Estudiante</span>
            <span>Nivel</span>
            <span>Quizzes</span>
            <span>Puntos</span>
          </div>

          {filteredRanking.map((student, index) => (
            <div
              key={student.id}
              className={`ranking-row ${
                student.currentUser ? "current-ranking-user" : ""
              }`}
            >

              <div className="ranking-position">
                {getPositionIcon(index + 1)}
              </div>

              <div className="ranking-student">

                <div className="ranking-avatar">
                  {getInitials(student.name)}
                </div>

                <div>
                  <strong>{student.name}</strong>

                  {student.currentUser && (
                    <span className="you-badge">
                      Tú
                    </span>
                  )}
                </div>

              </div>

              <div>
                <span className="level-badge">
                  {student.level}
                </span>
              </div>

              <div className="quiz-count">
                {student.quizzes}
              </div>

              <div className="ranking-points">
                {student.points.toLocaleString()} pts
              </div>

            </div>
          ))}

        </div>
      </section>

      {/* Información del usuario */}
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
          <strong>#3</strong>
          <span>posición</span>
        </div>

      </section>

    </div>
  );
}

export default Ranking;