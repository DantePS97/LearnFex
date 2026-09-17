import "./QuestionCard.css";

function QuestionCard({
	numero,
	total,
	enunciado,
	opciones = [],
	seleccionada = null,
	onSeleccionar = () => {},
	modoRetroalimentacion = false,
	respuestaCorrecta = null,
	explicacion = "",
}) {
	const getOpcionEstado = (opcionId) => {
		if (!modoRetroalimentacion) {
			return opcionId === seleccionada ? "seleccionada" : "";
		}

		if (opcionId === respuestaCorrecta) {
			return "correcta";
		}

		if (opcionId === seleccionada) {
			return "incorrecta";
		}

		return "";
	};

	return (
		<section className="question-card">
			<div className="question-card-header">
				<span className="question-card-counter">
					Pregunta {numero} de {total}
				</span>

				{modoRetroalimentacion && (
					<span
						className={`question-card-badge ${
							seleccionada === respuestaCorrecta
								? "question-card-badge--correcta"
								: "question-card-badge--incorrecta"
						}`}
					>
						{seleccionada === respuestaCorrecta ? "Correcta" : "Incorrecta"}
					</span>
				)}
			</div>

			<h2 className="question-card-enunciado">{enunciado}</h2>

			<div className="question-card-opciones">
				{opciones.map((opcion) => {
					const estado = getOpcionEstado(opcion.id);

					return (
						<button
							type="button"
							key={opcion.id}
							className={`question-card-opcion ${
								estado ? `question-card-opcion--${estado}` : ""
							}`}
							onClick={() => !modoRetroalimentacion && onSeleccionar(opcion.id)}
							disabled={modoRetroalimentacion}
						>
							<span className="question-card-opcion-id">{opcion.id}</span>
							<span className="question-card-opcion-text">{opcion.text}</span>
						</button>
					);
				})}
			</div>

			{modoRetroalimentacion && explicacion && (
				<div className="question-card-explicacion">
					<strong>Explicación</strong>
					<p>{explicacion}</p>
				</div>
			)}
		</section>
	);
}

export default QuestionCard;
