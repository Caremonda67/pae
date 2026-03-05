# ============================================================
# PAE API - Servidor Express
# ============================================================
# Este archivo es el punto de entrada del backend.
# Crea un servidor que expone una API REST consumida por el
# frontend (React). La base de datos vive en Supabase (nube).
# ============================================================

import "dotenv/config";
import express from "express";
import cors from "cors";

// Importamos las rutas de la aplicacion
import reservasRouter from "./routes/reservas.js";
import menusRouter from "./routes/menus.js";
import contactoRouter from "./routes/contacto.js";

const app = express();
const PORT = process.env.PORT || 4000;

// Middlewares
// 1. cors: permite que el frontend (en otro puerto/dominio) haga peticiones
// 2. express.json: convierte el cuerpo de las peticiones a JSON
app.use(cors());
app.use(express.json());

// Ruta de salud: sirve para verificar que el servidor esta vivo
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", servicio: "PAE API", fecha: new Date().toISOString() });
});

// Montamos las rutas bajo /api
app.use("/api/reservas", reservasRouter);
app.use("/api/menus", menusRouter);
app.use("/api/contacto", contactoRouter);

// Middleware para rutas no encontradas (error 404)
app.use((_req, res) => {
  res.status(404).json({ error: "Ruta no encontrada" });
});

// Arrancamos el servidor
app.listen(PORT, () => {
  console.log(`PAE API corriendo en http://localhost:${PORT}`);
});
