import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./History.css";

import { getResultadosByUsuario } from "../../../repositories/resultRepository";
import { useAuth } from "../../../hooks/useAuth";
import Button from "../../../components/Button/Button";
import Card from "../../../components/Card/Card";
import Loader from "../../../components/Loader/Loader";

const PUNTAJE_APROBATORIO = 60;

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

		return formattedDate.toLocaleString("es-CO", {
			day: "2-digit",
			month: "2-digit",
			year: "numeric",
			hour: "2-digit",
			minute: "2-digit",
		});
	} catch {
		return "Sin fecha";
	}
};

const isPassed = (puntaje) => Number(puntaje ?? 0) >= PUNTAJE_APROBATORIO;

const History = () => {
	const navigate = useNavigate();
	const { user, loading: authLoading } = useAuth();

	// null = todavía no se cargó (distinto de "cargó y no hay resultados").
	const [resultados, setResultados] = useState(null);
	const [error, setError] = useState("");
	const [intento, setIntento] = useState(0);

	useEffect(() => {
		// Esperar a que useAuth resuelva la sesión: si no, se decidiría el
		// estado vacío antes de conocer al usuario.
		if (authLoading || !user?.uid) return;

		let cancelado = false;

		getResultadosByUsuario(user.uid)
			.then((data) => {
				if (!cancelado) setResultados(data || []);
			})
			.catch((err) => {
				console.error("Error al cargar el historial:", err);

				if (!cancelado) setError("No se pudo cargar el historial.");
			});

		return () => {
			cancelado = true;
		};
	}, [user, authLoading, intento]);

	const handleRetry = () => {
		setError("");
		setResultados(null);
		setIntento((valor) => valor + 1);
	};

	const handleOpenResult = (resultadoId) => {
		navigate(`/resultados/${resultadoId}`);
	};

	const lista = resultados ?? [];
	const loading = authLoading || (Boolean(user?.uid) && resultados === null && !error);

	if (loading) {
		return (
			<main className="history">
				<Loader text="Cargando historial..." />
			</main>
		);
	}

	if (error) {
		return (
			<main className="history">
				<Card className="history-state">
					<div className="history-state-icon" aria-hidden="true">
						⚠️
					</div>

					<h2 className="history-state-title">No se pudo cargar el historial</h2>

					<p className="history-state-text">{error}</p>

					<Button onClick={handleRetry}>
						Intentar nuevamente
					</Button>
				</Card>
			</main>
		);
	}

	if (lista.length === 0) {
		return (
			<main className="history">
				<Card className="history-state">
					<div className="history-state-icon" aria-hidden="true">
						📜
					</div>

					<h1 className="history-state-title">Historial</h1>

					<p className="history-state-text">
						Todavía no completaste ningún cuestionario
					</p>

					<Button onClick={() => navigate("/practica")}>
						Realizar cuestionario
					</Button>
				</Card>
			</main>
		);
	}

	return (
		<main className="history">
			<header className="history-header">
				<div>
					<p className="history-label">MI PROGRESO</p>

					<h1 className="history-title">Historial</h1>

					<p className="history-description">
						Consulta los cuestionarios que has realizado y revisa tus resultados.
					</p>
				</div>

				<Button onClick={() => navigate("/practica")}>Practicar</Button>
			</header>

			<section className="history-section">
				<div className="history-section-header">
					<h2 className="history-section-title">Resultados anteriores</h2>

					<p className="history-section-text">
						Tus cuestionarios aparecen del más reciente al más antiguo.
					</p>
				</div>

				<ul className="history-list">
					{lista.map((resultado) => (
						<li key={resultado.id}>
							<button
								type="button"
								className="history-item"
								onClick={() => handleOpenResult(resultado.id)}
							>
								<div className="history-item-main">
									<div className="history-item-icon" aria-hidden="true">
										📝
									</div>

									<div className="history-item-info">
										<strong>Cuestionario</strong>
										<span>{formatDate(resultado.fecha)}</span>
									</div>
								</div>

								<div className="history-item-stat">
									<strong>{resultado.puntaje ?? 0}%</strong>
									<span>Puntaje</span>
								</div>

								<div className="history-item-stat history-item-stat--correct">
									<strong>{resultado.respuestasCorrectas ?? 0}</strong>
									<span>Correctas</span>
								</div>

								<div className="history-item-stat history-item-stat--incorrect">
									<strong>{resultado.respuestasIncorrectas ?? 0}</strong>
									<span>Incorrectas</span>
								</div>

								<div className="history-item-status">
									<span
										className={`history-status ${
											isPassed(resultado.puntaje)
												? "history-status--passed"
												: "history-status--failed"
										}`}
									>
										{isPassed(resultado.puntaje) ? "Aprobado" : "No aprobado"}
									</span>

									<span className="history-item-arrow" aria-hidden="true">
										→
									</span>
								</div>
							</button>
						</li>
					))}
				</ul>
			</section>
		</main>
	);
};

export default History;
