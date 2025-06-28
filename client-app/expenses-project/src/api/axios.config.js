import axios from "axios";

// Crear instancia de axios con URL base de tu API
const api = axios.create({
  baseURL: "https://localhost:7008/api",
});

// Agregar interceptor para inyectar el token en cada petición (si existe)
api.interceptors.request.use(config => {
  const token = localStorage.getItem("token"); // o donde guardes el JWT
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
