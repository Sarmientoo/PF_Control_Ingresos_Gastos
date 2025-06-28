import { useState } from "react";
import { Mail, ArrowLeft, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axios from "axios";

function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setFeedback("");

    const url = "https://localhost:7008/api/Users/forgot-password";
    // ← aquí defines config
    const config = {
      headers: { "Content-Type": "application/json" }
    };

    try {
      // …
      await axios.post(
        url,
        JSON.stringify(email), // además stringify para enviar "email" como JSON puro
        config
      );
      setFeedback("Si el correo es válido, te enviaremos instrucciones para restablecer tu contraseña.");
    } catch (error) {
      // ahora verás si es un 400 real o un error de red/CORS
      console.error("Error completo:", error);
      console.log("Response:", error.response);
      setFeedback("Hubo un error. Verificá el correo o intentá más tarde.");
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-sky-900 to-slate-900 px-4">
      <div className="absolute inset-0 opacity-20">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fillRule='evenodd'%3E%3Cg fill='%239C92AC' fillOpacity='0.05'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
        }}></div>
      </div>

      <div className="relative z-10 w-full max-w-6xl mx-auto">
        <div className="bg-white/10 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 p-12 lg:p-16">
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl mb-8">
              <Mail className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-4xl lg:text-5xl font-bold text-white mb-4">¿Olvidaste tu contraseña?</h2>
            <p className="text-gray-300 text-lg">Ingresá tu correo para enviarte instrucciones</p>
          </div>

          <form onSubmit={handleSubmit} className="max-w-md mx-auto space-y-8">
            <div className="space-y-3">
              <label htmlFor="email" className="block text-base font-medium text-gray-200">
                Correo electrónico
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Mail className="h-6 w-6 text-gray-400" />
                </div>
                <input
                  id="email"
                  type="email"
                  placeholder="tucorreo@ejemplo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
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
                  Enviando...
                </div>
              ) : (
                "Enviar instrucciones"
              )}
            </button>

            {feedback && (
              <div className="p-4 bg-white/10 border border-white/20 rounded-xl">
                <p className="text-white text-base text-center">{feedback}</p>
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

export default ForgotPassword;
