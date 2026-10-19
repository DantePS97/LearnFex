import { Link } from "react-router-dom";

import "./Privacy.css";

const VERSION_FECHA = "2026-10-19";

function Privacy() {
	return (
		<main className="privacy-page">
			<article className="privacy-card">
				<header className="privacy-header">
					<h1 className="privacy-title">Política de tratamiento de datos personales</h1>
					<p className="privacy-version">
						Versión del <time dateTime={VERSION_FECHA}>{VERSION_FECHA}</time>
					</p>
					<p className="privacy-text">
						Este documento explica qué datos personales recoge LearnFex, para qué los usa, quién puede verlos y
						cómo puede ejercer sus derechos como titular, conforme a la Ley 1581 de 2012 (Colombia).
					</p>
				</header>

				<section className="privacy-section" aria-labelledby="privacy-responsable">
					<h2 id="privacy-responsable">1. Responsable del tratamiento</h2>
					<p className="privacy-text">
						LearnFex es una plataforma de práctica y simulacros para estudiantes, desarrollada como proyecto
						de formación. La identificación y los datos de contacto del responsable del tratamiento deben ser
						publicados por el equipo de LearnFex en la aplicación.
					</p>
				</section>

				<section className="privacy-section" aria-labelledby="privacy-datos">
					<h2 id="privacy-datos">2. Datos que se recogen</h2>
					<ul className="privacy-list">
						<li>
							<strong>Cuenta:</strong> correo electrónico, nombre y apellido. La contraseña la gestiona Firebase
							Authentication; LearnFex no la guarda en su base de datos.
						</li>
						<li>
							<strong>Perfil:</strong> colegio (opcional, lo completa usted desde su perfil), rol en la
							plataforma (estudiante o administrador), estado de la cuenta y fecha de registro.
						</li>
						<li>
							<strong>Consentimiento:</strong> la constancia de que aceptó esta política y la fecha en que lo
							hizo.
						</li>
						<li>
							<strong>Actividad académica:</strong> resultados de las pruebas (puntaje, fecha y tiempo
							empleado), las respuestas que selecciona en cada pregunta y si fueron correctas, y estadísticas de
							progreso por área.
						</li>
						<li>
							<strong>Gamificación:</strong> puntos de experiencia (XP), nivel, logros obtenidos con su fecha, y
							puntaje acumulado y posición en el ranking.
						</li>
					</ul>
				</section>

				<section className="privacy-section" aria-labelledby="privacy-finalidades">
					<h2 id="privacy-finalidades">3. Para qué se usan</h2>
					<ul className="privacy-list">
						<li>Crear y mantener su cuenta y permitirle iniciar sesión.</li>
						<li>Calificar sus pruebas y mostrarle la retroalimentación de cada respuesta.</li>
						<li>Calcular y mostrarle sus estadísticas e historial de progreso.</li>
						<li>Otorgar puntos, niveles y logros, y construir el ranking de estudiantes.</li>
						<li>Administrar la plataforma: gestión de usuarios, preguntas, simulacros y reportes.</li>
					</ul>
				</section>

				<section className="privacy-section" aria-labelledby="privacy-visibilidad">
					<h2 id="privacy-visibilidad">4. Quién puede ver sus datos</h2>
					<ul className="privacy-list">
						<li>
							<strong>Usted:</strong> accede a su perfil, resultados, estadísticas y logros.
						</li>
						<li>
							<strong>Administradores de la plataforma:</strong> pueden consultar los datos de las cuentas y los
							resultados para gestionar el servicio.
						</li>
						<li>
							<strong>Otros estudiantes (ranking):</strong> los estudiantes con sesión iniciada ven en la
							pantalla de Ranking su nombre, su nivel y su puntaje acumulado. El registro del ranking incluye
							también su apellido.
						</li>
					</ul>
					<p className="privacy-text">
						La aplicación no integra servicios de publicidad ni de analítica de terceros.
					</p>
				</section>

				<section className="privacy-section" aria-labelledby="privacy-proveedor">
					<h2 id="privacy-proveedor">5. Proveedor de infraestructura</h2>
					<p className="privacy-text">
						LearnFex usa Google Firebase (Authentication, Cloud Firestore y Cloud Functions). Por eso sus datos
						se almacenan y procesan en la infraestructura de Google, que actúa como proveedor del servicio.
					</p>
				</section>

				<section className="privacy-section" aria-labelledby="privacy-derechos">
					<h2 id="privacy-derechos">6. Sus derechos como titular</h2>
					<p className="privacy-text">De acuerdo con la Ley 1581 de 2012, usted tiene derecho a:</p>
					<ul className="privacy-list">
						<li>Conocer, actualizar y rectificar sus datos personales.</li>
						<li>Acceder de forma gratuita a los datos que se hayan recogido sobre usted.</li>
						<li>Solicitar la supresión de sus datos.</li>
						<li>Revocar la autorización que otorgó para su tratamiento.</li>
					</ul>
					<p className="privacy-text">
						Puede actualizar su nombre, apellido y colegio directamente desde la sección Perfil. Para ejercer
						los demás derechos, escriba al correo de soporte que el equipo de LearnFex publique en la
						aplicación.
					</p>
					<p className="privacy-text">
						Tenga en cuenta que hoy la aplicación no ofrece una opción para eliminar la cuenta ni los datos: la
						solicitud de supresión o de revocatoria debe gestionarla el equipo administrador.
					</p>
				</section>

				<section className="privacy-section" aria-labelledby="privacy-conservacion">
					<h2 id="privacy-conservacion">7. Conservación</h2>
					<p className="privacy-text">
						Sus datos se conservan mientras su cuenta exista. El proyecto aún no define plazos de conservación
						ni un procedimiento de eliminación automática.
					</p>
				</section>

				<section className="privacy-section" aria-labelledby="privacy-seguridad">
					<h2 id="privacy-seguridad">8. Seguridad</h2>
					<p className="privacy-text">
						El acceso a los datos se restringe mediante reglas de seguridad de Firestore: cada estudiante accede
						a su propia información y los administradores a la necesaria para gestionar la plataforma. Ninguna
						medida de seguridad es infalible.
					</p>
				</section>

				<section className="privacy-section" aria-labelledby="privacy-autorizacion">
					<h2 id="privacy-autorizacion">9. Autorización y cambios</h2>
					<p className="privacy-text">
						Al marcar la casilla de aceptación en el registro usted autoriza el tratamiento descrito en este
						documento. Si esta política cambia, se actualizará la fecha de versión que aparece al inicio.
					</p>
				</section>

				<footer className="privacy-footer">
					<Link to="/">Volver a LearnFex</Link>
				</footer>
			</article>
		</main>
	);
}

export default Privacy;
