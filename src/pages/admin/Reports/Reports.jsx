import { useEffect, useState } from "react";
import "./Reports.css";

import { getPlatformStats } from "../../../services/platformStatsService";

const Reports = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let activo = true;

    // 🔹 Cargar estadísticas
    const loadStats = async () => {
      try {
        const data = await getPlatformStats();

        if (activo) {
          setStats(data);
        }
      } catch (err) {
        console.error("Error cargando estadísticas:", err);

        if (activo) {
          setError("No se pudieron cargar los reportes");
        }
      } finally {
        if (activo) {
          setLoading(false);
        }
      }
    };

    loadStats();

    return () => {
      activo = false;
    };
  }, []);

  if (loading) {
    return <p className="reports__loading">Cargando reportes...</p>;
  }

  if (error) {
    return <p className="reports__error">{error}</p>;
  }

  return (
    <div className="reports">
      <h2 className="reports__title">Reportes por Área</h2>

      {/* RESUMEN GENERAL */}
      <div className="reports__summary">
        <div className="card">
          <p>Total usuarios</p>
          <strong>{stats.totalUsuarios}</strong>
        </div>

        <div className="card">
          <p>Total pruebas</p>
          <strong>{stats.totalPruebas}</strong>
        </div>

        <div className="card">
          <p>Promedio general</p>
          <strong>{stats.promedioGeneral}%</strong>
        </div>
      </div>

      {/* DESGLOSE POR ÁREA */}
      <div className="reports__areas">
        <h3>Desempeño por área</h3>

        {Object.entries(stats.promedioPorArea).map(([area, promedio]) => (
          <div key={area} className="reports__area">
            <span className="area-name">{area}</span>

            <div className="area-bar">
              <div
                className="area-bar__fill"
                style={{ width: `${promedio}%` }}
              />
            </div>

            <span className="area-score">{promedio}%</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Reports;
