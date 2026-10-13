// URL base de la API del backend.
//
// Se lee de VITE_API_URL (configurada en frontend/.env o en Render).
// Si no esta definida se asume que el backend corre en localhost:4000
// (desarrollo). En produccion hay que definir VITE_API_URL con la
// direccion del backend desplegado, ej: https://pae-api.onrender.com

export const API_URL =
  (import.meta.env.VITE_API_URL || "http://localhost:4000").replace(/\/+$/, "");
