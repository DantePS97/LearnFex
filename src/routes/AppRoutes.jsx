import { Routes, Route } from "react-router-dom";

import Login from "../pages/auth/Login/Login";
import Register from "../pages/auth/Register/Register";
import ForgotPassword from "../pages/auth/ForgotPassword/Forgotpassword";
import Home from "../pages/student/Home/Home";
import Practice from "../pages/student/Practice/Practice";
import Statistics from "../pages/student/Statistics/Statistics";
import Results from "../pages/student/Results/Results";
import Ranking from "../pages/student/Ranking/Ranking";
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

				<Route path="/estadisticas" element={<Statistics />} />
				<Route path="/resultados" element={<Results />} />


				<Route path="/ranking" element={<Ranking />} />

				<Route path="/perfil" element={<Profile />} />
			</Route>

			<Route element={<AdminRoute />}>
				<Route path="/admin" element={<Dashboard />} />
			</Route>
		</Routes>
	);
}

export default AppRoutes;
