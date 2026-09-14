import React, { useEffect, useState } from "react";
import "./Achievements.css";

const defaultAchievements = [
  {
    id: 1,
    title: "Primer paso",
    description: "Completa tu primera actividad",
    unlocked: false,
  },
  {
    id: 2,
    title: "Constante",
    description: "Completa 5 actividades",
    unlocked: false,
  },
  {
    id: 3,
    title: "Experto",
    description: "Obtén más de 90 puntos",
    unlocked: false,
  },
];

const Achievements = () => {
  const [achievements, setAchievements] = useState([]);

  // Cargar logros desde localStorage o usar los por defecto
  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem("achievements"));
    if (stored) {
      setAchievements(stored);
    } else {
      localStorage.setItem("achievements", JSON.stringify(defaultAchievements));
      setAchievements(defaultAchievements);
    }
  }, []);

  // Guardar cambios en localStorage
  useEffect(() => {
    if (achievements.length > 0) {
      localStorage.setItem("achievements", JSON.stringify(achievements));
    }
  }, [achievements]);

  // Función para desbloquear logro
  const unlockAchievement = (id) => {
    const updated = achievements.map((ach) =>
      ach.id === id ? { ...ach, unlocked: true } : ach,
    );
    setAchievements(updated);
  };

  return (
    <div className="achievements-container">
      <h2>🏅 Logros</h2>

      <div className="achievements-list">
        {achievements.map((ach) => (
          <div
            key={ach.id}
            className={`achievement ${ach.unlocked ? "unlocked" : "locked"}`}
          >
            <h3>{ach.title}</h3>
            <p>{ach.description}</p>

            {!ach.unlocked ? (
              <button onClick={() => unlockAchievement(ach.id)}>
                Desbloquear
              </button>
            ) : (
              <span className="badge">✔ Desbloqueado</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Achievements;
