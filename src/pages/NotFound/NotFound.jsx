import { Link } from "react-router-dom";

import "../../styles/auth.css";

function NotFound() {
	return (
		<main className="auth-page">
			<div className="auth-card">
				<h1 className="auth-title">Página no encontrada</h1>

				<p className="auth-subtitle">La dirección que abriste no existe.</p>

				<div className="auth-links">
					<Link to="/inicio">Volver al inicio</Link>
				</div>
			</div>
		</main>
	);
}

export default NotFound;
