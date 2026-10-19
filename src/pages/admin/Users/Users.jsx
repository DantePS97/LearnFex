import { useEffect, useMemo, useState } from "react";

import {
	getAllUsers,
	setUserEstado,
	setUserRol,
} from "../../../repositories/userRepository";

import { useAuth } from "../../../hooks/useAuth";

import "./Users.css";

function Users() {
	const { user: usuarioActual } = useAuth();

	const esUsuarioActual = (usuario) => usuario.id === usuarioActual?.uid;

	const [users, setUsers] = useState([]);
	const [cursor, setCursor] = useState(null);
	const [search, setSearch] = useState("");
	const [selectedUser, setSelectedUser] = useState(null);

	const [loading, setLoading] = useState(false);
	const [error, setError] = useState("");
	const [savingUserId, setSavingUserId] = useState(null);

	const loadUsers = async (nextCursor = null) => {
		setLoading(true);
		setError("");

		try {
			const result = await getAllUsers(nextCursor);

			setUsers((currentUsers) =>
				nextCursor ? [...currentUsers, ...result.users] : result.users,
			);

			setCursor(result.cursor);
		} catch (err) {
			console.error("Error al cargar usuarios:", err);
			setError("No se pudieron cargar los usuarios.");
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		loadUsers();
	}, []);

	const filteredUsers = useMemo(() => {
		const term = search.trim().toLowerCase();

		if (!term) {
			return users;
		}

		return users.filter((user) => {
			const nombreCompleto =
				`${user.nombre ?? ""} ${user.apellido ?? ""}`.toLowerCase();

			const correo = (user.correo ?? "").toLowerCase();

			return nombreCompleto.includes(term) || correo.includes(term);
		});
	}, [users, search]);

	const handleEstado = async (user) => {
		if (esUsuarioActual(user)) {
			setError("No podés desactivar tu propia cuenta. Pedile a otro administrador que lo haga.");
			return;
		}

		const nuevoEstado =
			user.estado === "activo" ? "inactivo" : "activo";

		const accion =
			nuevoEstado === "activo" ? "activar" : "desactivar";

		const nombre =
			`${user.nombre ?? ""} ${user.apellido ?? ""}`.trim() ||
			user.correo ||
			"este usuario";

		const confirmado = window.confirm(
			`¿Deseas ${accion} la cuenta de ${nombre}?`,
		);

		if (!confirmado) {
			return;
		}

		setSavingUserId(user.id);
		setError("");

		try {
			await setUserEstado(user.id, nuevoEstado);

			setUsers((currentUsers) =>
				currentUsers.map((currentUser) =>
					currentUser.id === user.id
						? { ...currentUser, estado: nuevoEstado }
						: currentUser,
				),
			);

			setSelectedUser((currentUser) =>
				currentUser?.id === user.id
					? { ...currentUser, estado: nuevoEstado }
					: currentUser,
			);
		} catch (err) {
			console.error("Error al cambiar estado:", err);
			setError("No se pudo cambiar el estado del usuario.");
		} finally {
			setSavingUserId(null);
		}
	};

	const handleRol = async (user, nuevoRol) => {
		if (esUsuarioActual(user)) {
			setError("No podés cambiar tu propio rol. Pedile a otro administrador que lo haga.");
			return;
		}

		if (!nuevoRol || nuevoRol === user.rol) {
			return;
		}

		setSavingUserId(user.id);
		setError("");

		try {
			await setUserRol(user.id, nuevoRol);

			setUsers((currentUsers) =>
				currentUsers.map((currentUser) =>
					currentUser.id === user.id
						? { ...currentUser, rol: nuevoRol }
						: currentUser,
				),
			);

			setSelectedUser((currentUser) =>
				currentUser?.id === user.id
					? { ...currentUser, rol: nuevoRol }
					: currentUser,
			);
		} catch (err) {
			console.error("Error al cambiar rol:", err);
			setError("No se pudo cambiar el rol del usuario.");
		} finally {
			setSavingUserId(null);
		}
	};

	const handleLoadMore = async () => {
		if (!cursor || loading) {
			return;
		}

		await loadUsers(cursor);
	};

	const getNombreCompleto = (user) => {
		const nombre = `${user.nombre ?? ""} ${user.apellido ?? ""}`.trim();

		return nombre || "Sin nombre";
	};

	return (
		<main className="users-page">
			<section className="users-header">
				<div>
					<h1>Usuarios</h1>
					<p>Gestiona las cuentas de usuarios de LearnFex.</p>
				</div>
			</section>

			<section className="users-toolbar">
				<label htmlFor="user-search">Buscar usuario</label>

				<input
					id="user-search"
					type="search"
					placeholder="Buscar por nombre o correo..."
					value={search}
					onChange={(event) => setSearch(event.target.value)}
				/>
			</section>

			{error && <p className="users-error">{error}</p>}

			<section className="users-content">
				<div className="users-table-wrapper">
					<table className="users-table">
						<thead>
							<tr>
								<th>Nombre</th>
								<th>Correo</th>
								<th>Rol</th>
								<th>Estado</th>
								<th>Acciones</th>
							</tr>
						</thead>

						<tbody>
							{filteredUsers.length === 0 && !loading ? (
								<tr>
									<td colSpan="5" className="users-empty">
										{search
											? "No se encontraron usuarios."
											: "No hay usuarios para mostrar."}
									</td>
								</tr>
							) : (
								filteredUsers.map((user) => (
									<tr key={user.id}>
										<td>
											<strong>
												{getNombreCompleto(user)}
											</strong>
										</td>

										<td>{user.correo || "Sin correo"}</td>

										<td>
											<select
												value={user.rol || "estudiante"}
												onChange={(event) =>
													handleRol(
														user,
														event.target.value,
													)
												}
												disabled={
													savingUserId === user.id ||
													esUsuarioActual(user)
												}
											>
												<option value="estudiante">
													Estudiante
												</option>
												<option value="administrador">
													Administrador
												</option>
											</select>
										</td>

										<td>
											<span
												className={`user-status user-status--${
													user.estado === "activo"
														? "active"
														: "inactive"
												}`}
											>
												{user.estado === "activo"
													? "Activo"
													: "Inactivo"}
											</span>
										</td>

										<td>
											<div className="users-actions">
												<button
													type="button"
													className="button button--secondary"
													onClick={() =>
														setSelectedUser(user)
													}
												>
													Ver detalle
												</button>

												<button
													type="button"
													className={`button ${
														user.estado === "activo"
															? "button--danger"
															: "button--success"
													}`}
													onClick={() =>
														handleEstado(user)
													}
													disabled={
														savingUserId ===
															user.id ||
														esUsuarioActual(user)
													}
												>
													{savingUserId === user.id
														? "Guardando..."
														: user.estado ===
															  "activo"
															? "Desactivar"
															: "Activar"}
												</button>
											</div>
										</td>
									</tr>
								))
							)}
						</tbody>
					</table>
				</div>

				{loading && (
					<p className="users-loading">Cargando usuarios...</p>
				)}

				{!loading && cursor && (
					<div className="users-pagination">
						<button
							type="button"
							className="button button--primary"
							onClick={handleLoadMore}
							disabled={loading}
						>
							Cargar más
						</button>
					</div>
				)}
			</section>

			{selectedUser && (
				<div className="user-detail-overlay">
					<section
						className="user-detail"
						aria-labelledby="user-detail-title"
					>
						<div className="user-detail-header">
							<h2 id="user-detail-title">
								Detalle del usuario
							</h2>

							<button
								type="button"
								className="user-detail-close"
								onClick={() => setSelectedUser(null)}
								aria-label="Cerrar detalle"
							>
								×
							</button>
						</div>

						<div className="user-detail-content">
							<div className="user-detail-row">
								<span>Nombre</span>
								<strong>
									{getNombreCompleto(selectedUser)}
								</strong>
							</div>

							<div className="user-detail-row">
								<span>Correo</span>
								<strong>
									{selectedUser.correo || "Sin correo"}
								</strong>
							</div>

							<div className="user-detail-row">
								<span>Rol</span>
								<strong>
									{selectedUser.rol || "Sin rol"}
								</strong>
							</div>

							<div className="user-detail-row">
								<span>Estado</span>
								<strong>
									{selectedUser.estado || "Sin estado"}
								</strong>
							</div>

							<div className="user-detail-row">
								<span>XP</span>
								<strong>{selectedUser.xp ?? 0}</strong>
							</div>

							<div className="user-detail-row">
								<span>Nivel</span>
								<strong>{selectedUser.nivel ?? 1}</strong>
							</div>

							<div className="user-detail-row">
								<span>Colegio</span>
								<strong>
									{selectedUser.colegio || "Sin colegio"}
								</strong>
							</div>
						</div>

						<div className="user-detail-footer">
							<button
								type="button"
								className="button button--secondary"
								onClick={() => setSelectedUser(null)}
							>
								Cerrar
							</button>
						</div>
					</section>
				</div>
			)}
		</main>
	);
}

export default Users;