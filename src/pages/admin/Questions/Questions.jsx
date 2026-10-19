import { useEffect, useMemo, useState } from "react";

import {
	createQuestion,
	deleteQuestion,
	getAllQuestions,
	getQuestionsByArea,
	updateQuestion,
} from "../../../repositories/questionRepository";

import "./Questions.css";

const initialForm = {
	enunciado: "",
	opciones: ["", ""],
	respuestaCorrecta: "",
	dificultad: "media",
	explicacion: "",
	areaId: "",
};

const dificultades = [
	{ value: "", label: "Todas" },
	{ value: "baja", label: "Baja" },
	{ value: "media", label: "Media" },
	{ value: "alta", label: "Alta" },
];

function Questions() {
	const [preguntas, setPreguntas] = useState([]);
	const [loading, setLoading] = useState(true);
	const [saving, setSaving] = useState(false);
	const [error, setError] = useState("");

	const [busqueda, setBusqueda] = useState("");
	const [areaFiltro, setAreaFiltro] = useState("");
	const [dificultadFiltro, setDificultadFiltro] = useState("");

	const [modalAbierto, setModalAbierto] = useState(false);
	const [editandoId, setEditandoId] = useState(null);
	const [form, setForm] = useState(initialForm);

	const cargarPreguntas = async () => {
		try {
			setLoading(true);
			setError("");

			const data = areaFiltro
				? await getQuestionsByArea(areaFiltro, dificultadFiltro || undefined)
				: await getAllQuestions(dificultadFiltro || undefined);

			setPreguntas(data);
		} catch (err) {
			console.error(err);
			setError("No se pudieron cargar las preguntas.");
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		cargarPreguntas();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [areaFiltro, dificultadFiltro]);

	const areasDisponibles = useMemo(() => {
		return [
			...new Set(
				preguntas
					.map((pregunta) => pregunta.areaId)
					.filter(Boolean)
			),
		];
	}, [preguntas]);

	const preguntasFiltradas = useMemo(() => {
		const texto = busqueda.trim().toLowerCase();

		return preguntas.filter((pregunta) => {
			const coincideBusqueda =
				!texto ||
				pregunta.enunciado?.toLowerCase().includes(texto) ||
				pregunta.explicacion?.toLowerCase().includes(texto);

			const coincideArea =
				!areaFiltro || pregunta.areaId === areaFiltro;

			const coincideDificultad =
				!dificultadFiltro ||
				pregunta.dificultad === dificultadFiltro;

			return (
				coincideBusqueda &&
				coincideArea &&
				coincideDificultad
			);
		});
	}, [preguntas, busqueda, areaFiltro, dificultadFiltro]);

	const abrirCrear = () => {
		setEditandoId(null);
		setForm({
			...initialForm,
			areaId: areaFiltro || "",
		});
		setError("");
		setModalAbierto(true);
	};

	const abrirEditar = (pregunta) => {
		setEditandoId(pregunta.id);

		setForm({
			enunciado: pregunta.enunciado || "",
			opciones:
				pregunta.opciones?.length >= 2
					? pregunta.opciones.map((opcion) => opcion?.text ?? "")
					: ["", ""],
			respuestaCorrecta: pregunta.respuestaCorrecta || "",
			dificultad: pregunta.dificultad || "media",
			explicacion: pregunta.explicacion || "",
			areaId: pregunta.areaId || "",
		});

		setError("");
		setModalAbierto(true);
	};

	const cerrarModal = () => {
		if (saving) return;

		setModalAbierto(false);
		setEditandoId(null);
		setForm(initialForm);
	};

	const actualizarCampo = (campo, valor) => {
		setForm((prev) => ({
			...prev,
			[campo]: valor,
		}));
	};

	const actualizarOpcion = (index, valor) => {
		setForm((prev) => {
			const opciones = [...prev.opciones];
			opciones[index] = valor;

			return {
				...prev,
				opciones,
			};
		});
	};

	const agregarOpcion = () => {
		setForm((prev) => ({
			...prev,
			opciones: [...prev.opciones, ""],
		}));
	};

	const eliminarOpcion = (index) => {
		if (form.opciones.length <= 2) return;

		const opcionEliminada = form.opciones[index];

		setForm((prev) => {
			const opciones = prev.opciones.filter(
				(_, opcionIndex) => opcionIndex !== index
			);

			return {
				...prev,
				opciones,
				respuestaCorrecta:
					prev.respuestaCorrecta === opcionEliminada
						? ""
						: prev.respuestaCorrecta,
			};
		});
	};

	const validarFormulario = () => {
		if (!form.enunciado.trim()) {
			return "El enunciado es obligatorio.";
		}

		if (!form.areaId.trim()) {
			return "El areaId es obligatorio.";
		}

		const opcionesValidas = form.opciones
			.map((opcion) => opcion.trim())
			.filter(Boolean);

		if (opcionesValidas.length < 2) {
			return "La pregunta debe tener al menos 2 opciones.";
		}

		if (!form.respuestaCorrecta.trim()) {
			return "Debes seleccionar una respuesta correcta.";
		}

		const idsValidos = opcionesValidas.map((_, index) =>
			String.fromCharCode(65 + index)
		);

		if (!idsValidos.includes(form.respuestaCorrecta.trim())) {
			return "La respuesta correcta debe coincidir con una de las opciones.";
		}

		return null;
	};

	const guardarPregunta = async (event) => {
		event.preventDefault();

		const errorFormulario = validarFormulario();

		if (errorFormulario) {
			setError(errorFormulario);
			return;
		}

		const opcionesConTexto = form.opciones
			.map((opcion) => opcion.trim())
			.filter(Boolean);

		const datos = {
			enunciado: form.enunciado.trim(),
			opciones: opcionesConTexto.map((text, index) => ({
				id: String.fromCharCode(65 + index),
				text,
			})),
			respuestaCorrecta: form.respuestaCorrecta.trim(),
			dificultad: form.dificultad,
			explicacion: form.explicacion.trim(),
			areaId: form.areaId.trim(),
		};

		try {
			setSaving(true);
			setError("");

			if (editandoId) {
				await updateQuestion(editandoId, datos);
			} else {
				await createQuestion(datos);
			}

			cerrarModal();

			/*
			 * Volvemos a consultar el área actual.
			 */
			if (datos.areaId) {
				const actualizadas = await getQuestionsByArea(
					datos.areaId,
					dificultadFiltro || undefined
				);

				setPreguntas((prev) => {
					const otras = prev.filter(
						(pregunta) => pregunta.areaId !== datos.areaId
					);

					return [...otras, ...actualizadas];
				});
			}
		} catch (err) {
			console.error(err);
			setError(
				err.message || "No se pudo guardar la pregunta."
			);
		} finally {
			setSaving(false);
		}
	};

	const eliminarPregunta = async (pregunta) => {
		const confirmar = window.confirm(
			"¿Seguro que querés eliminar esta pregunta?\n\n" +
				"Si ya se usó en pruebas completadas, esos resultados dejarán de mostrarla " +
				"en la retroalimentación de los estudiantes. Esta acción no se puede deshacer."
		);

		if (!confirmar) return;

		try {
			setError("");

			await deleteQuestion(pregunta.id);

			setPreguntas((prev) =>
				prev.filter((item) => item.id !== pregunta.id)
			);
		} catch (err) {
			console.error(err);
			setError("No se pudo eliminar la pregunta.");
		}
	};

	const dificultadLabel = (dificultad) => {
		const encontrada = dificultades.find(
			(item) => item.value === dificultad
		);

		return encontrada?.label || dificultad || "Sin dificultad";
	};

	return (
		<main className="questions-page">
			<header className="questions-header">
				<div>
					<span className="questions-eyebrow">
						Administración
					</span>

					<h1>Preguntas</h1>

					<p>
						Crea, edita y administra las preguntas de
						LearnFex.
					</p>
				</div>

				<button
					type="button"
					className="questions-primary-button"
					onClick={abrirCrear}
				>
					+ Nueva pregunta
				</button>
			</header>

			<section className="questions-filters">
				<div className="questions-search">
					<label htmlFor="buscar-preguntas">
						Buscar
					</label>

					<input
						id="buscar-preguntas"
						type="search"
						placeholder="Buscar por enunciado..."
						value={busqueda}
						onChange={(event) =>
							setBusqueda(event.target.value)
						}
					/>
				</div>

				<div>
					<label htmlFor="filtro-area">Área</label>

					<input
						id="filtro-area"
						list="areas-disponibles"
						placeholder="Ej: matematicas"
						value={areaFiltro}
						onChange={(event) =>
							setAreaFiltro(event.target.value)
						}
					/>

					<datalist id="areas-disponibles">
						{areasDisponibles.map((area) => (
							<option key={area} value={area} />
						))}
					</datalist>
				</div>

				<div>
					<label htmlFor="filtro-dificultad">
						Dificultad
					</label>

					<select
						id="filtro-dificultad"
						value={dificultadFiltro}
						onChange={(event) =>
							setDificultadFiltro(event.target.value)
						}
					>
						{dificultades.map((dificultad) => (
							<option
								key={dificultad.value}
								value={dificultad.value}
							>
								{dificultad.label}
							</option>
						))}
					</select>
				</div>
			</section>

			{error && (
				<div className="questions-error">
					{error}
				</div>
			)}

			<section className="questions-content">
				<div className="questions-content-header">
					<h2>Listado de preguntas</h2>

					<span>
						{preguntasFiltradas.length} pregunta
						{preguntasFiltradas.length !== 1 ? "s" : ""}
					</span>
				</div>

				{loading ? (
					<div className="questions-empty">
						Cargando preguntas...
					</div>
				) : preguntasFiltradas.length === 0 ? (
					<div className="questions-empty">
						<p>No se encontraron preguntas.</p>

						<button
							type="button"
							onClick={abrirCrear}
							className="questions-secondary-button"
						>
							Crear una pregunta
						</button>
					</div>
				) : (
					<div className="questions-list">
						{preguntasFiltradas.map((pregunta, index) => (
							<article
								className="question-admin-card"
								key={pregunta.id}
							>
								<div className="question-admin-number">
									#{index + 1}
								</div>

								<div className="question-admin-body">
									<div className="question-admin-meta">
										<span className="question-area">
											{pregunta.areaId}
										</span>

										<span
											className={`question-difficulty difficulty-${pregunta.dificultad}`}
										>
											{dificultadLabel(
												pregunta.dificultad
											)}
										</span>
									</div>

									<h3>
										{pregunta.enunciado}
									</h3>

									<div className="question-options">
										{pregunta.opciones?.map(
											(opcion, opcionIndex) => (
												<div
													className={
														opcion.id ===
														pregunta.respuestaCorrecta
															? "question-option correct"
															: "question-option"
													}
													key={`${pregunta.id}-${opcionIndex}`}
												>
													<span>
														{opcion.id}
													</span>

													{opcion.text}
												</div>
											)
										)}
									</div>
								</div>

								<div className="question-admin-actions">
									<button
										type="button"
										onClick={() =>
											abrirEditar(pregunta)
										}
									>
										Editar
									</button>

									<button
										type="button"
										className="delete"
										onClick={() =>
											eliminarPregunta(pregunta)
										}
									>
										Eliminar
									</button>
								</div>
							</article>
						))}
					</div>
				)}
			</section>

			{modalAbierto && (
				<div
					className="questions-modal-overlay"
					onMouseDown={(event) => {
						if (event.target === event.currentTarget) {
							cerrarModal();
						}
					}}
				>
					<div className="questions-modal">
						<div className="questions-modal-header">
							<div>
								<span className="questions-eyebrow">
									{editandoId
										? "Editar"
										: "Crear"}
								</span>

								<h2>
									{editandoId
										? "Editar pregunta"
										: "Nueva pregunta"}
								</h2>
							</div>

							<button
								type="button"
								className="modal-close"
								onClick={cerrarModal}
								disabled={saving}
							>
								×
							</button>
						</div>

						<form onSubmit={guardarPregunta}>
							<div className="form-field">
								<label htmlFor="enunciado">
									Enunciado
								</label>

								<textarea
									id="enunciado"
									rows="4"
									value={form.enunciado}
									onChange={(event) =>
										actualizarCampo(
											"enunciado",
											event.target.value
										)
									}
									placeholder="Escribe el enunciado de la pregunta..."
								/>
							</div>

							<div className="form-grid">
								<div className="form-field">
									<label htmlFor="areaId">
										Área / areaId
									</label>

									<input
										id="areaId"
										type="text"
										value={form.areaId}
										onChange={(event) =>
											actualizarCampo(
												"areaId",
												event.target.value
											)
										}
										placeholder="ID del área"
									/>
								</div>

								<div className="form-field">
									<label htmlFor="dificultad">
										Dificultad
									</label>

									<select
										id="dificultad"
										value={form.dificultad}
										onChange={(event) =>
											actualizarCampo(
												"dificultad",
												event.target.value
											)
										}
									>
										{dificultades
											.filter(
												(item) =>
													item.value
											)
											.map((item) => (
												<option
													key={
														item.value
													}
													value={
														item.value
													}
												>
													{item.label}
												</option>
											))}
									</select>
								</div>
							</div>

							<div className="form-field">
								<div className="options-header">
									<label>
										Opciones
									</label>

									<button
										type="button"
										onClick={
											agregarOpcion
										}
									>
										+ Agregar opción
									</button>
								</div>

								<div className="form-options">
									{form.opciones.map(
										(opcion, index) => (
											<div
												className="form-option"
												key={index}
											>
												<span>
													{String.fromCharCode(
														65 +
															index
													)}
												</span>

												<input
													type="text"
													value={
														opcion
													}
													onChange={(
														event
													) =>
														actualizarOpcion(
															index,
															event
																.target
																.value
														)
													}
													placeholder={`Opción ${
														index +
														1
													}`}
												/>

												<button
													type="button"
													onClick={() =>
														eliminarOpcion(
															index
														)
													}
													disabled={
														form
															.opciones
															.length <=
														2
													}
												>
													×
												</button>
											</div>
										)
									)}
								</div>
							</div>

							<div className="form-field">
								<label htmlFor="respuestaCorrecta">
									Respuesta correcta
								</label>

								<select
									id="respuestaCorrecta"
									value={
										form.respuestaCorrecta
									}
									onChange={(event) =>
										actualizarCampo(
											"respuestaCorrecta",
											event.target.value
										)
									}
								>
									<option value="">
										Selecciona una opción
									</option>

									{form.opciones
										.filter(Boolean)
										.map(
											(
												opcion,
												index
											) => (
												<option
													key={`${opcion}-${index}`}
													value={String.fromCharCode(65 + index)}
												>
													{String.fromCharCode(
														65 +
															index
													)}{" "}
													-{" "}
													{
														opcion
													}
												</option>
											)
										)}
								</select>
							</div>

							<div className="form-field">
								<label htmlFor="explicacion">
									Explicación
								</label>

								<textarea
									id="explicacion"
									rows="3"
									value={form.explicacion}
									onChange={(event) =>
										actualizarCampo(
											"explicacion",
											event.target.value
										)
									}
									placeholder="Explicación de la respuesta..."
								/>
							</div>

							<div className="questions-modal-actions">
								<button
									type="button"
									className="questions-cancel-button"
									onClick={cerrarModal}
									disabled={saving}
								>
									Cancelar
								</button>

								<button
									type="submit"
									className="questions-primary-button"
									disabled={saving}
								>
									{saving
										? "Guardando..."
										: editandoId
										? "Guardar cambios"
										: "Crear pregunta"}
								</button>
							</div>
						</form>
					</div>
				</div>
			)}
		</main>
	);
}

export default Questions;