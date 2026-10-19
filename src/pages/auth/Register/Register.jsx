import { useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import * as userService from "../../../services/userService";
import Input from "../../../components/Input/Input";
import Button from "../../../components/Button/Button";
import "../../../styles/auth.css";

const REGEX_CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function Register() {
	const navigate = useNavigate();

	const [nombre, setNombre] = useState("");
	const [apellido, setApellido] = useState("");
	const [correo, setCorreo] = useState("");
	const [contrasena, setContrasena] = useState("");
	const [confirmarContrasena, setConfirmarContrasena] = useState("");

	const [aceptaPolitica, setAceptaPolitica] = useState(false);
	const checkboxPoliticaRef = useRef(null);

	const [errorConfirmacion, setErrorConfirmacion] = useState("");
	const [errorPolitica, setErrorPolitica] = useState("");
	const [error, setError] = useState("");
	const [enviando, setEnviando] = useState(false);

	const validar = () => {
		if (!nombre || !apellido || !correo || !contrasena || !confirmarContrasena) {
			setError("Todos los campos son obligatorios");
			return false;
		}

		if (!REGEX_CORREO.test(correo)) {
			setError("Ingresá un correo con formato válido");
			return false;
		}

		if (contrasena.length < 6) {
			setError("La contraseña debe tener al menos 6 caracteres");
			return false;
		}

		if (contrasena !== confirmarContrasena) {
			setErrorConfirmacion("Las contraseñas no coinciden");
			return false;
		}

		if (!aceptaPolitica) {
			setErrorPolitica("Debés aceptar la política de tratamiento de datos personales para registrarte");
			checkboxPoliticaRef.current?.focus();
			return false;
		}

		return true;
	};

	const handleSubmit = async (event) => {
		event.preventDefault();

		setError("");
		setErrorConfirmacion("");
		setErrorPolitica("");

		if (!validar()) {
			return;
		}

		setEnviando(true);

		try {
			await userService.registerUser(correo, contrasena, nombre, apellido, aceptaPolitica);

			navigate("/inicio");
		} catch (err) {
			if (err.code === "auth/email-already-in-use") {
				setError("Este correo ya está registrado");
			} else if (err.code === "auth/weak-password") {
				setError("La contraseña es muy débil");
			} else {
				setError("Ocurrió un error, intentá de nuevo");
			}

			setEnviando(false);
		}
	};

	return (
		<main className="auth-page">
			<div className="auth-card">
				<h1 className="auth-title">Crear cuenta</h1>
				<p className="auth-subtitle">Registrate para empezar a practicar</p>

				{error && <p className="auth-error">{error}</p>}

				<form className="auth-form" onSubmit={handleSubmit}>
					<Input
						label="Nombre"
						name="nombre"
						value={nombre}
						onChange={(event) => setNombre(event.target.value)}
						required
						disabled={enviando}
					/>

					<Input
						label="Apellido"
						name="apellido"
						value={apellido}
						onChange={(event) => setApellido(event.target.value)}
						required
						disabled={enviando}
					/>

					<Input
						label="Correo"
						type="email"
						name="correo"
						value={correo}
						onChange={(event) => setCorreo(event.target.value)}
						required
						disabled={enviando}
					/>

					<Input
						label="Contraseña"
						type="password"
						name="contrasena"
						value={contrasena}
						onChange={(event) => setContrasena(event.target.value)}
						required
						disabled={enviando}
					/>

					<Input
						label="Confirmar contraseña"
						type="password"
						name="confirmarContrasena"
						value={confirmarContrasena}
						onChange={(event) => setConfirmarContrasena(event.target.value)}
						required
						disabled={enviando}
						error={errorConfirmacion}
					/>

					<div className="auth-consent">
						<div className="auth-consent-row">
							<input
								ref={checkboxPoliticaRef}
								id="aceptaPolitica"
								name="aceptaPolitica"
								type="checkbox"
								className="auth-consent-checkbox"
								checked={aceptaPolitica}
								onChange={(event) => {
									setAceptaPolitica(event.target.checked);
									setErrorPolitica("");
								}}
								disabled={enviando}
								aria-required="true"
								aria-invalid={errorPolitica ? "true" : "false"}
								aria-describedby={errorPolitica ? "aceptaPolitica-error" : undefined}
							/>

							<label className="auth-consent-label" htmlFor="aceptaPolitica">
								Acepto la{" "}
								<Link to="/privacidad" target="_blank" rel="noopener noreferrer">
									política de tratamiento de datos personales
								</Link>
							</label>
						</div>

						{errorPolitica && (
							<span id="aceptaPolitica-error" className="input-error" role="alert">
								{errorPolitica}
							</span>
						)}
					</div>

					<Button type="submit" disabled={enviando}>
						{enviando ? "Creando cuenta..." : "Crear cuenta"}
					</Button>
				</form>

				<div className="auth-links">
					<Link to="/">¿Ya tenés cuenta? Iniciá sesión</Link>
				</div>
			</div>
		</main>
	);
}

export default Register;
