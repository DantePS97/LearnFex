import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Practice.css";

import { getAllAreas } from "../../../repositories/areaRepository";

function Practice() {
  const navigate = useNavigate();

  const [areas, setAreas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeArea, setActiveArea] = useState("Todas");
  const [search, setSearch] = useState("");

  useEffect(() => {
    const cargarAreas = async () => {
      try {
        setLoading(true);

        const data = await getAllAreas();

        setAreas(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Error al cargar las áreas:", error);
        setAreas([]);
      } finally {
        setLoading(false);
      }
    };

    cargarAreas();
  }, []);

  const filteredAreas = areas.filter((area) => {
    const matchesArea =
      activeArea === "Todas" || area.nombre === activeArea;

    const matchesSearch = (area.nombre || "")
      .toLowerCase()
      .includes(search.toLowerCase());

    return matchesArea && matchesSearch;
  });

  const handlePractice = (area) => {
    navigate("/practica/cuestionario", { state: { areaId: area.id } });
  };

  return (
    <div className="practice-page">
      <div className="practice-container">

        {/* HEADER */}
        <header className="practice-header">
          <div className="practice-title-section">
            <h1 className="practice-title">Práctica</h1>

            <p className="practice-subtitle">
              Banco de preguntas ICFES
            </p>
          </div>

          <div className="practice-header-actions">
            <button
              type="button"
              className="practice-button practice-button-secondary"
              onClick={() => navigate("/estadisticas")}
            >
              Historial
            </button>

            <button
              type="button"
              className="practice-button practice-button-primary"
              disabled={filteredAreas.length === 0}
              onClick={() => filteredAreas[0] && handlePractice(filteredAreas[0])}
            >
              + Nueva práctica
            </button>
          </div>
        </header>

        {/* BUSCADOR */}
        <div className="practice-search">
          <input
            type="text"
            value={search}
            placeholder="Buscar área..."
            onChange={(event) => setSearch(event.target.value)}
          />

          <span className="practice-search-icon">
            🔍
          </span>
        </div>

        {/* FILTROS */}
        <div className="practice-filters">
          <button
            type="button"
            className={`practice-filter ${
              activeArea === "Todas" ? "active" : ""
            }`}
            onClick={() => setActiveArea("Todas")}
          >
            Todas
          </button>

          {areas.map((area) => (
            <button
              type="button"
              key={area.id}
              className={`practice-filter ${
                activeArea === area.nombre ? "active" : ""
              }`}
              onClick={() => setActiveArea(area.nombre)}
            >
              {area.nombre}
            </button>
          ))}
        </div>

        {/* ÁREAS DISPONIBLES */}
        <section className="practice-section">

          <div className="practice-section-header">
            <h2 className="practice-section-title">
              Áreas disponibles
            </h2>

            <button
              type="button"
              className="practice-section-link"
              onClick={() => setActiveArea("Todas")}
            >
              Ver todas
            </button>
          </div>

          {loading ? (
            <div className="practice-empty">
              <p>Cargando áreas...</p>
            </div>
          ) : (
            <div className="practice-topics-grid">
              {filteredAreas.map((area) => (
                <article
                  key={area.id}
                  className="practice-topic-card"
                  onClick={() => handlePractice(area)}
                >
                  <div className="practice-topic-icon">
                    {(area.nombre || "?").charAt(0)}
                  </div>

                  <div className="practice-topic-info">
                    <h3 className="practice-topic-title">
                      {area.nombre}
                    </h3>

                    <p className="practice-topic-description">
                      {area.descripcion || `${area.numPreguntas || 0} preguntas`}
                    </p>
                  </div>

                  <span className="practice-topic-arrow">
                    →
                  </span>
                </article>
              ))}
            </div>
          )}
        </section>

        {/* SIN RESULTADOS */}
        {!loading && filteredAreas.length === 0 && (
          <div className="practice-empty">
            <div className="practice-empty-icon">
              🔍
            </div>

            <h3>No encontramos áreas</h3>

            <p>
              Intenta buscar otra área o selecciona
              una categoría diferente.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default Practice;
