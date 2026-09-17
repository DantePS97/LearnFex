import { Routes, Route } from "react-router-dom";

import Login from "../pages/auth/Login/Login";
import Register from "../pages/auth/Register/Register";
import ForgotPassword from "../pages/auth/ForgotPassword/Forgotpassword";
import Home from "../pages/student/Home/Home";
import Practice from "../pages/student/Practice/Practice";
import Quiz from "../pages/student/Quiz/Quiz";
import Results from "../pages/student/Results/Results";
import Feedback from "../pages/student/Feedback/Feedback";
import Statistics from "../pages/student/Statistics/Statistics";
import Ranking from "../pages/student/Ranking/Ranking";
import Achievements from "../pages/student/Achievements/Achievements";
import Profile from "../pages/student/Profile/Profile";
import Dashboard from "../pages/admin/Dashboard/Dashboard";
import PrivateRoutes from "./PrivateRoutes";
import AdminRoute from "./AdminRoute";

function AppRoutes() {
	return (
		<Routes>
			<Route path="/" element={<Login />} />

			<Route path="/registro" element={<Register />} />

			<Route path="/recuperar-contrasena" element={<ForgotPassword />} />

			<Route element={<PrivateRoutes />}>
				<Route path="/inicio" element={<Home />} />

				<Route path="/practica" element={<Practice />} />

				<Route path="/practica/cuestionario" element={<Quiz />} />

				<Route path="/resultados/:resultadoId" element={<Results />} />

				<Route
					path="/resultados/:resultadoId/retroalimentacion"
					element={<Feedback />}
				/>

				<Route path="/estadisticas" element={<Statistics />} />

				<Route path="/ranking" element={<Ranking />} />

				<Route path="/logros" element={<Achievements />} />

				<Route path="/perfil" element={<Profile />} />
			</Route>

			<Route element={<AdminRoute />}>
				<Route path="/admin" element={<Dashboard />} />
			</Route>
		</Routes>
	);
}

export default AppRoutes;
