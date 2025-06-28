import { Routes, Route, Navigate } from 'react-router-dom';
import Login          from './features/auth/Login';
import Dashboard      from './dashboard/Dashboard';
import Register       from './features/auth/Register';
import ForgotPassword from './features/auth/ForgotPassword';
import Incomes        from './features/dashboard/Incomes';
import Expenses       from './features/dashboard/Expenses';
import ResetPassword  from './features/auth/ResetPassword';
import Header         from './dashboard/Header';
import { parseJwt }   from './utils/jwt';

export default function App() {
  const token = localStorage.getItem('token');
  const payload = parseJwt(token) || {};
  const isAuthenticated = !!payload.exp && Date.now() < payload.exp * 1000;
  const userName = payload.unique_name || payload.name || '';

  return (
    <>
      {/* Solo muestro el Header si está autenticado */}
      {isAuthenticated && <Header userName={userName} />}

      <Routes>
        {/* Ruta pública: si ya estás logueado, te mando al dashboard */}
        <Route
          path="/login"
          element={
            isAuthenticated
              ? <Navigate to="/dashboard" replace />
              : <Login />
          }
        />

        {/* Resto de públicas */}
        <Route
          path="/register"
          element={
            isAuthenticated
              ? <Navigate to="/dashboard" replace />
              : <Register />
          }
        />
        <Route
          path="/forgot-password"
          element={
            isAuthenticated
              ? <Navigate to="/dashboard" replace />
              : <ForgotPassword />
          }
        />
        <Route
          path="/reset-password"
          element={<ResetPassword />}
        />

        {/* Rutas protegidas: si no estás logueado, te mando a login */}
        <Route
          path="/dashboard"
          element={
            isAuthenticated
              ? <Dashboard />
              : <Navigate to="/login" replace />
          }
        />
        <Route
          path="/incomes"
          element={
            isAuthenticated
              ? <Incomes />
              : <Navigate to="/login" replace />
          }
        />
        <Route
          path="/expenses"
          element={
            isAuthenticated
              ? <Expenses />
              : <Navigate to="/login" replace />
          }
        />

        {/* Cualquier otra ruta va al login o al dashboard */}
        <Route
          path="*"
          element={
            isAuthenticated
              ? <Navigate to="/dashboard" replace />
              : <Navigate to="/login" replace />
          }
        />
      </Routes>
    </>
  );
}
