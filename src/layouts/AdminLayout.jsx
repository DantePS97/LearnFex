// src/layouts/AdminLayout.jsx

import { NavLink, Outlet, useNavigate } from "react-router-dom";

import * as authServices from "../services/authServices";

import {
	FiGrid,
	FiUsers,
	FiHelpCircle,
	FiLayers,
	FiAward,
	FiBarChart2,
	FiSettings,
	FiLogOut,
} from "react-icons/fi";

import "./AdminLayout.css";

// Secciones del panel de administración, según el mapa de pantallas
// (docs/Mapa_de_Pantallas_Usuario_Administrador.png, bloque "Navegación
// principal"). Las rutas anidadas se habilitan en feature/AdminRoutesWiring.
const adminNavigationItems = [
	{
		label: "Dashboard",
		path: "/admin",
		end: true,
		icon: <FiGrid />,
	},
	{
		label: "Usuarios",
		path: "/admin/usuarios",
		icon: <FiUsers />,
	},
	{
		label: "Preguntas",
		path: "/admin/preguntas",
		icon: <FiHelpCircle />,
	},
	{
		label: "Simulacros",
		path: "/admin/simulacros",
		icon: <FiLayers />,
	},
	{
		label: "Logros",
		path: "/admin/logros",
		icon: <FiAward />,
	},
	{
		label: "Reportes",
		path: "/admin/reportes",
		icon: <FiBarChart2 />,
	},
	{
		label: "Configuración",
		path: "/admin/configuracion",
		icon: <FiSettings />,
	},
];

function AdminLayout() {
	const navigate = useNavigate();

	// Mismo patrón que el Perfil del estudiante: confirmar, cerrar sesión y
	// volver al login.
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
			window.alert("No se pudo cerrar sesión, intentá de nuevo");
		}
	};

	return (
		<div className="admin-layout">
			<header className="admin-header">
				<div className="admin-header-brand">
					<div className="admin-header-logo">L</div>

					<div className="admin-header-info">
						<h1 className="admin-header-title">Panel de administración</h1>

						<p className="admin-header-subtitle">LearnFex</p>
					</div>
				</div>

				<nav className="admin-header-links">
					{adminNavigationItems.map((item) => (
						<NavLink
							key={item.path}
							to={item.path}
							end={item.end}
							className={({ isActive }) =>
								`admin-header-link ${
									isActive ? "admin-header-link--active" : ""
								}`
							}
						>
							<span className="admin-header-link-icon">{item.icon}</span>

							<span className="admin-header-link-label">{item.label}</span>
						</NavLink>
					))}
				</nav>

				<button
					type="button"
					className="admin-header-logout"
					onClick={handleLogout}
					aria-label="Cerrar sesión"
				>
					<span className="admin-header-logout-icon">
						<FiLogOut />
					</span>

					<span className="admin-header-logout-label">Cerrar sesión</span>
				</button>
			</header>

			<main className="admin-content">
				<Outlet />
			</main>

			<nav className="admin-bottom-navigation">
				{adminNavigationItems.map((item) => (
					<NavLink
						key={item.path}
						to={item.path}
						end={item.end}
						className={({ isActive }) =>
							`admin-bottom-navigation-item ${
								isActive ? "admin-bottom-navigation-item--active" : ""
							}`
						}
					>
						<span className="admin-bottom-navigation-icon">{item.icon}</span>

						<span className="admin-bottom-navigation-label">
							{item.label}
						</span>
					</NavLink>
				))}
			</nav>
		</div>
	);
}

export default AdminLayout;
