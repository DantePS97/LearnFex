import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { useAuth } from "../../../hooks/useAuth";
import * as authServices from "../../../services/authServices";
import * as userService from "../../../services/userService";
import Input from "../../../components/Input/Input";
import Button from "../../../components/Button/Button";
import "../../../styles/auth.css";

const CODIGOS_CREDENCIAL_INVALIDA = [
	"auth/invalid-credential",
	"auth/wrong-password",
	"auth/user-not-found",
	"auth/invalid-email",
];

const MENSAJE_CUENTA_INACTIVA = "Tu cuenta está desactivada. Contactá a un administrador.";

function Login() {
	const navigate = useNavigate();
	const { cuentaInactiva } = useAuth();

	const [correo, setCorreo] = useState("");
	const [contrasena, setContrasena] = useState("");
	const [error, setError] = useState("");
	const [enviando, setEnviando] = useState(false);

	const handleSubmit = async (event) => {
		event.preventDefault();

		setError("");
		setEnviando(true);

		let credenciales;

		try {
			credenciales = await authServices.login(correo, contrasena);
		} catch (err) {
			if (CODIGOS_CREDENCIAL_INVALIDA.includes(err.code)) {
				setError("Correo o contraseña incorrectos");
			} else {
				setError("Ocurrió un error, intentá de nuevo");
			}

			setEnviando(false);
			return;
		}

		try {
			const perfil = await userService.getUserProfile(credenciales.user.uid);

			if (perfil?.estado === "inactivo") {
				setError(MENSAJE_CUENTA_INACTIVA);
				setEnviando(false);
				return;
			}

			navigate(perfil?.rol === "administrador" ? "/admin" : "/inicio");
		} catch {
			navigate("/inicio");
		}
	};

	const mensajeError = error || (cuentaInactiva ? MENSAJE_CUENTA_INACTIVA : "");

	return (
		<main className="auth-page">
			<div className="auth-card">
				<h1 className="auth-title">Iniciar sesión</h1>
				<p className="auth-subtitle">Ingresá a tu cuenta de LearnFex</p>

				{mensajeError && <p className="auth-error">{mensajeError}</p>}

				<form className="auth-form" onSubmit={handleSubmit}>
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

					<Button type="submit" disabled={enviando}>
						{enviando ? "Ingresando..." : "Ingresar"}
					</Button>
				</form>

				<div className="auth-links">
					<Link to="/recuperar-contrasena">¿Olvidaste tu contraseña?</Link>
					<Link to="/registro">¿No tenés cuenta? Registrate</Link>
				</div>
			</div>
		</main>
	);
}

export default Login;
