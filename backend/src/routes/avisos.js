// rutas de los avisos / noticias del programa
// la web muestra solo los avisos PUBLICADOS. Los que estan en borrador
// los ven (y editan) coordinador, profesor y admin desde el panel.
// El flujo de aprobacion: quien redacta lo deja en borrador y el
// coordinador (o admin) lo publica.

import { Router } from "express";
import { getSupabase } from "../config/supabase.js";
import { requiereRol } from "../config/auth.js";

const router = Router();

// GET /api/avisos
// Solo los avisos publicados (para la Home y la pagina de noticias).
router.get("/", async (_req, res) => {
  const { data, error } = await getSupabase()
    .from("avisos")
    .select("*")
    .eq("estado", "publicado")
    .order("created_at", { ascending: false });

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// GET /api/avisos/todos
// Todos los avisos, incluidos los borradores (para el panel: admin,
// coordinador y profesor). Van primero los borradores para que se
// atienda lo pendiente de publicar.
router.get("/todos", requiereRol("admin", "coordinador", "profesor"), async (_req, res) => {
  const { data, error } = await getSupabase()
    .from("avisos")
    .select("*")
    .order("estado", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// POST /api/avisos
// Crea un aviso. Los profesores siempre crean en estado "borrador" para revisión.
// Solo admin y coordinador pueden publicar directamente.
// Cuerpo: { titulo, texto, fecha, imagen?, estado? }
router.post("/", requiereRol("admin", "coordinador", "profesor"), async (req, res) => {
  const { titulo, texto, fecha, imagen } = req.body;
  const esDirectivo = req.usuario.rol === "admin" || req.usuario.rol === "coordinador";
  const estado = esDirectivo && req.body.estado !== "borrador" ? "publicado" : "borrador";

  if (!titulo || !titulo.trim() || !texto || !texto.trim()) {
    return res.status(400).json({ error: "Faltan el título y el texto" });
  }

  const { data, error } = await getSupabase()
    .from("avisos")
    .insert([
      {
        titulo: titulo.trim(),
        texto: texto.trim(),
        fecha: fecha || new Date().toISOString().slice(0, 10),
        imagen: imagen || null,
        estado,
        creado_por: req.usuario.sub || null,
      },
    ])
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data);
});

// PUT /api/avisos/:id
// Edita un aviso o cambia su estado (publicar / pasar a borrador).
// Solo admin y coordinador pueden cambiar el estado a "publicado".
// Cuerpo: { titulo?, texto?, fecha?, imagen?, estado? }
router.put("/:id", requiereRol("admin", "coordinador", "profesor"), async (req, res) => {
  const { titulo, texto, fecha, imagen } = req.body;
  const { estado } = req.body;

  const esDirectivo = req.usuario.rol === "admin" || req.usuario.rol === "coordinador";

  const cambios = {};
  if (titulo !== undefined) cambios.titulo = titulo;
  if (texto !== undefined) cambios.texto = texto;
  if (fecha !== undefined) cambios.fecha = fecha;
  if (imagen !== undefined) cambios.imagen = imagen;
  if (estado !== undefined) {
    if (!["borrador", "publicado"].includes(estado)) {
      return res.status(400).json({ error: "Estado inválido" });
    }
    if (estado === "publicado" && !esDirectivo) {
      return res.status(403).json({ error: "Solo el coordinador o administrador pueden publicar avisos." });
    }
    cambios.estado = estado;
  }

  if (Object.keys(cambios).length === 0) {
    return res.status(400).json({ error: "No hay nada que actualizar" });
  }

  const { error } = await getSupabase()
    .from("avisos")
    .update(cambios)
    .eq("id", req.params.id);

  if (error) return res.status(500).json({ error: error.message });
  res.json({ ok: true });
});

// DELETE /api/avisos/:id
// Borra un aviso (solo admin y coordinador)
router.delete("/:id", requiereRol("admin", "coordinador"), async (req, res) => {
  const { error } = await getSupabase()
    .from("avisos")
    .delete()
    .eq("id", req.params.id);

  if (error) return res.status(500).json({ error: error.message });
  res.status(204).end();
});

export default router;
