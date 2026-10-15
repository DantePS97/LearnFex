
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { useAuth } from "../../../hooks/useAuth";
import * as userService from "../../../services/userService";
import * as authServices from "../../../services/authServices";
import Input from "../../../components/Input/Input";
import Button from "../../../components/Button/Button";
import Loader from "../../../components/Loader/Loader";
import "./Profile.css";

function Profile() {
	const navigate = useNavigate();
	const { user, profile, loading } = useAuth();

	const [nombre, setNombre] = useState("");
	const [apellido, setApellido] = useState("");
	const [colegio, setColegio] = useState("");
	const [guardando, setGuardando] = useState(false);
	const [guardado, setGuardado] = useState(false);
	const [error, setError] = useState("");
	const [passwordEnviada, setPasswordEnviada] = useState(false);

	useEffect(() => {
		if (profile) {
			setNombre(profile.nombre ?? "");
			setApellido(profile.apellido ?? "");
			setColegio(profile.colegio ?? "");
		}
	}, [profile]);

	if (loading || !profile) {
		return <Loader text="Cargando perfil..." fullScreen />;
	}

	const handleSubmit = async (event) => {
		event.preventDefault();

		setGuardando(true);
		setGuardado(false);
		setError("");

		const cambios = { nombre, apellido, colegio };

		try {
			await userService.updateUserProfile(user.uid, cambios);

			setGuardado(true);
		} catch {
			setError("No se pudieron guardar los cambios, intentá de nuevo");
		} finally {
			setGuardando(false);
		}
	};

	const handleChangePassword = async () => {
		setPasswordEnviada(false);
		setError("");

		try {
			await authServices.resetPassword(profile.correo);
			setPasswordEnviada(true);
		} catch {
			setError(
				"No se pudo enviar el correo para cambiar la contraseña, intentá de nuevo"
			);
		}
	};

	const handleLogout = async () => {
		const confirmar = window.confirm(
			"¿Estás seguro de que querés cerrar sesión?"
		);

		if (!confirmar) {
			return;
		}

		try {
			await authServices.logout();
			navigate("/");
		} catch {
			setError("No se pudo cerrar sesión, intentá de nuevo");
		}
	};

	return (
		<main className="profile-page">
			<h1 className="profile-title">Mi perfil</h1>

			<section className="profile-summary">
				<div className="profile-field">
					<span className="profile-field-label">Correo</span>
					<span className="profile-field-value">{profile.correo}</span>
				</div>

				<div className="profile-field">
					<span className="profile-field-label">Rol</span>
					<span className="profile-field-value">{profile.rol}</span>
				</div>

				<div className="profile-field">
					<span className="profile-field-label">XP</span>
					<span className="profile-field-value">{profile.xp}</span>
				</div>

				<div className="profile-field">
					<span className="profile-field-label">Nivel</span>
					<span className="profile-field-value">{profile.nivel}</span>
				</div>
			</section>

			<section className="profile-menu">
				<button
					type="button"
					className="profile-menu-item"
					onClick={() => navigate("/logros")}
				>
					🏅 Logros
				</button>

				<button
					type="button"
					className="profile-menu-item"
					onClick={() => navigate("/estadisticas")}
				>
					📊 Mi progreso
				</button>

				<button
					type="button"
					className="profile-menu-item"
					onClick={handleChangePassword}
				>
					⚙️ Configuración
				</button>

				<button
					type="button"
					className="profile-menu-item"
					onClick={handleLogout}
				>
					🚪 Cerrar sesión
				</button>
			</section>

			{guardado && (
				<p className="profile-success">Cambios guardados correctamente</p>
			)}

			{passwordEnviada && (
				<p className="profile-success">
					Te enviamos un correo para cambiar tu contraseña
				</p>
			)}

			{error && <p className="profile-error">{error}</p>}

			<form className="profile-form" onSubmit={handleSubmit}>
				<Input
					label="Nombre"
					name="nombre"
					value={nombre}
					onChange={(event) => setNombre(event.target.value)}
					disabled={guardando}
				/>

				<Input
					label="Apellido"
					name="apellido"
					value={apellido}
					onChange={(event) => setApellido(event.target.value)}
					disabled={guardando}
				/>

				<Input
					label="Colegio"
					name="colegio"
					value={colegio}
					onChange={(event) => setColegio(event.target.value)}
					disabled={guardando}
				/>

				<Button type="submit" disabled={guardando}>
					{guardando ? "Guardando..." : "Guardar cambios"}
				</Button>
			</form>
		</main>
	);
}

export default Profile;
