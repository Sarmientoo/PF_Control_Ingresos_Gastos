import { Lock, ArrowLeft, Loader2 } from 'lucide-react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import axios from 'axios';

function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const navigate = useNavigate();

  // Estados
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading]       = useState(false);
  const [message, setMessage]       = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const res = await axios.post(
        "https://localhost:7008/api/Users/reset-password",
        { token, newPassword },
        { headers: { "Content-Type": "application/json" } }
      );

      // Si el servidor responde con 200 y un body de texto, lo mostramos:
      setMessage(res.data || "¡Contraseña actualizada correctamente!");
    } catch (error) {
      if (error.response) {
        // Errores sabidos del backend
        if (error.response.status === 400) {
          setMessage(error.response.data || "Token inválido o expirado.");
        } else if (error.response.status === 404) {
          setMessage("Usuario no encontrado.");
        } else {
          setMessage("Error inesperado del servidor.");
        }
      } else {
        // Error de red, CORS, etc
        setMessage("Error de red o servidor no disponible.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-sky-900 to-slate-900 px-4">
      <div className="absolute inset-0 opacity-20">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fillRule='evenodd'%3E%3Cg fill='%239C92AC' fillOpacity='0.05'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />
      </div>

      <div className="relative z-10 w-full max-w-6xl mx-auto">
        <div className="bg-white/10 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 p-12 lg:p-16">
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl mb-8">
              <Lock className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-4xl lg:text-5xl font-bold text-white mb-4">
              Restablecer contraseña
            </h2>
            <p className="text-gray-300 text-lg">
              Ingresa tu nueva contraseña
            </p>
          </div>

          <form onSubmit={handleSubmit} className="max-w-md mx-auto space-y-8">
            <div className="space-y-3">
              <label
                htmlFor="newPassword"
                className="block text-base font-medium text-gray-200"
              >
                Nueva contraseña
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="h-6 w-6 text-gray-400" />
                </div>
                <input
                  id="newPassword"
                  type="password"
                  placeholder="••••••••"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  className="w-full pl-12 pr-4 py-4 text-lg bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 backdrop-blur-sm"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-4 px-6 text-lg rounded-xl font-semibold text-white transition-all duration-300 transform ${
                loading
                  ? "bg-gray-600 cursor-not-allowed"
                  : "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 hover:scale-[1.02] active:scale-[0.98] shadow-lg hover:shadow-xl"
              }`}
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <Loader2 className="w-6 h-6 mr-3 animate-spin" />
                  Cambiando...
                </div>
              ) : (
                "Cambiar contraseña"
              )}
            </button>

            {/* Mensaje de éxito o error */}
            {message && (
              <div className="p-4 bg-white/10 border border-white/20 rounded-xl">
                <p className="text-white text-base text-center">{message}</p>
              </div>
            )}
          </form>

          <div className="mt-10 text-center">
            <button
              onClick={() => navigate('/login')}
              className="flex items-center justify-center gap-2 text-blue-400 hover:text-blue-300 transition-colors text-base"
            >
              <ArrowLeft className="w-5 h-5" />
              Volver a iniciar sesión
            </button>
          </div>
        </div>

        <div className="text-center mt-6">
          <p className="text-gray-500 text-xs">
            © 2025 Control Ingresos/Gastos App. Todos los derechos reservados.
          </p>
        </div>
      </div>
    </div>
  );
}

export default ResetPassword;
