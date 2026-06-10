// ============================================================
// servidor principal del backend
// expone la API que usa el frontend, los datos estan en supabase
// ============================================================

import "dotenv/config";
import express from "express";
import cors from "cors";

// Importamos las rutas de la aplicacion
import reservasRouter from "./routes/reservas.js";
import menusRouter from "./routes/menus.js";
import contactoRouter from "./routes/contacto.js";
import chatRouter from "./routes/chat.js";
import avisosRouter from "./routes/avisos.js";
import adminRouter from "./routes/admin.js";
import loginRouter from "./routes/login.js";
import usuariosRouter from "./routes/usuarios.js";
import beneficiariosRouter from "./routes/beneficiarios.js";
import notificacionesRouter from "./routes/notificaciones.js";
import archivosRouter from "./routes/archivos.js";
import estadisticasRouter from "./routes/estadisticas.js";
import galeriaRouter from "./routes/galeria.js";
import metricasRouter from "./routes/metricas.js";
import institucionesRouter from "./routes/instituciones.js";
import colaboradoresRouter from "./routes/colaboradores.js";

const app = express();
const PORT = process.env.PORT || 4000;

// Middlewares
// 1. cors: permite que el frontend (en otro puerto/dominio) haga peticiones
// 2. express.json: convierte el cuerpo de las peticiones a JSON.
//    El limite alto es para recibir las imagenes en base64.
app.use(cors());
app.use(express.json({ limit: "8mb" }));

// Ruta de salud: sirve para verificar que el servidor esta vivo
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", servicio: "PAE API", fecha: new Date().toISOString() });
});

// Montamos las rutas bajo /api
app.use("/api/reservas", reservasRouter);
app.use("/api/menus", menusRouter);
app.use("/api/contacto", contactoRouter);
app.use("/api/chat", chatRouter);
app.use("/api/avisos", avisosRouter);
app.use("/api/admin", adminRouter);
app.use("/api/login", loginRouter);
app.use("/api/usuarios", usuariosRouter);
app.use("/api/beneficiarios", beneficiariosRouter);
app.use("/api/notificaciones", notificacionesRouter);
app.use("/api/archivos", archivosRouter);
app.use("/api/estadisticas", estadisticasRouter);
app.use("/api/galeria", galeriaRouter);
app.use("/api/metricas", metricasRouter);
app.use("/api/instituciones", institucionesRouter);
app.use("/api/colaboradores", colaboradoresRouter);

// Middleware para rutas no encontradas (error 404)
app.use((_req, res) => {
  res.status(404).json({ error: "Ruta no encontrada" });
});

// Arrancamos el servidor
app.listen(PORT, () => {
  console.log(`PAE API corriendo en http://localhost:${PORT}`);
});
