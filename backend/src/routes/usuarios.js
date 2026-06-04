// ============================================================
// Usuarios del sistema (cuentas con rol)
// ============================================================
// Solo el administrador crea/edita/borra cuentas. Cada cuenta tiene
// un usuario (para estudiantes es su documento) y una clave/PIN.
// La clave se guarda hasheada para el login (clave_hash) y tambien
// en texto plano (clave) para que el admin la vea y la edite.
//
//   GET    /api/usuarios          lista cuentas (incluye la clave)
//   POST   /api/usuarios          crea una cuenta
//   PUT    /api/usuarios/:id      edita datos, activa/desactiva o cambia la clave
//   DELETE /api/usuarios/:id      borra una cuenta
// ============================================================

import { Router } from "express";
import { getSupabase } from "../config/supabase.js";
import { requiereRol, ROLES } from "../config/auth.js";
import { hashClave } from "../config/password.js";

const router = Router();

// GET /api/usuarios
// Lista las cuentas (con la clave en texto plano para que el admin
// la vea). Solo admin.
router.get("/", requiereRol("admin"), async (_req, res) => {
  const { data, error } = await getSupabase()
    .from("usuarios")
    .select("id, nombre, usuario, clave, rol, activo, created_at")
    .order("nombre", { ascending: true });

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// POST /api/usuarios
// Crea una cuenta. Cuerpo: { nombre, usuario, clave, rol }
// Para un estudiante, usuario = su documento y clave = su PIN.
router.post("/", requiereRol("admin"), async (req, res) => {
  const { nombre, usuario, clave, rol } = req.body || {};

  if (!nombre || !String(nombre).trim()) {
    return res.status(400).json({ error: "Falta el nombre" });
  }
  if (!usuario || !String(usuario).trim()) {
    return res.status(400).json({ error: "Falta el usuario" });
  }
  if (!clave || String(clave).length < 4) {
    return res.status(400).json({ error: "La clave o PIN debe tener al menos 4 caracteres" });
  }
  if (!ROLES.includes(rol)) {
    return res.status(400).json({ error: `Rol invalido. Usa uno de: ${ROLES.join(", ")}` });
  }

  // El usuario no se debe repetir (documento de estudiante unico)
  const { data: existente, error: errExiste } = await getSupabase()
    .from("usuarios")
    .select("id")
    .eq("usuario", String(usuario).trim())
    .maybeSingle();

  if (errExiste) return res.status(500).json({ error: errExiste.message });
  if (existente) {
    return res.status(400).json({ error: "Ese usuario ya tiene cuenta" });
  }

  const { data, error } = await getSupabase()
    .from("usuarios")
    .insert([
      {
        nombre: String(nombre).trim(),
        usuario: String(usuario).trim(),
        clave: String(clave),
        clave_hash: hashClave(clave),
        rol,
      },
    ])
    .select("id, nombre, usuario, clave, rol, activo, created_at")
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data);
});

// PUT /api/usuarios/:id
// Edita los datos de una cuenta (nombre, usuario, rol), la activa o
// desactiva, o cambia su clave/PIN. Solo admin.
// Cuerpo: { activo?, clave?, nombre?, usuario?, rol? }
router.put("/:id", requiereRol("admin"), async (req, res) => {
  const { activo, clave, nombre, usuario, rol } = req.body || {};

  // Validamos cada campo antes de armar la actualizacion
  if (usuario !== undefined && !String(usuario).trim()) {
    return res.status(400).json({ error: "El usuario no puede quedar vacío" });
  }
  if (rol !== undefined && !ROLES.includes(rol)) {
    return res.status(400).json({ error: `Rol invalido. Usa uno de: ${ROLES.join(", ")}` });
  }
  if (clave !== undefined && String(clave).length < 4) {
    return res.status(400).json({ error: "La clave o PIN debe tener al menos 4 caracteres" });
  }

  const cambios = {};
  if (typeof activo === "boolean") cambios.activo = activo;
  if (nombre !== undefined && String(nombre).trim()) cambios.nombre = String(nombre).trim();
  if (usuario !== undefined) cambios.usuario = String(usuario).trim();
  if (rol !== undefined) cambios.rol = rol;
  if (clave !== undefined) {
    cambios.clave = String(clave);
    cambios.clave_hash = hashClave(clave);
  }

  if (Object.keys(cambios).length === 0) {
    return res.status(400).json({ error: "No hay nada que actualizar" });
  }

  // Si cambia el usuario, no se puede repetir con otra cuenta
  if (cambios.usuario) {
    const { data: existente, error: errExiste } = await getSupabase()
      .from("usuarios")
      .select("id")
      .neq("id", req.params.id)
      .eq("usuario", cambios.usuario)
      .maybeSingle();
    if (errExiste) return res.status(500).json({ error: errExiste.message });
    if (existente) {
      return res.status(400).json({ error: "Ese usuario ya tiene cuenta" });
    }
  }

  const { data, error } = await getSupabase()
    .from("usuarios")
    .update(cambios)
    .eq("id", req.params.id)
    .select("id, nombre, usuario, clave, rol, activo, created_at")
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// DELETE /api/usuarios/:id
// Borra una cuenta. Solo admin.
router.delete("/:id", requiereRol("admin"), async (req, res) => {
  const { error } = await getSupabase()
    .from("usuarios")
    .delete()
    .eq("id", req.params.id);
  if (error) return res.status(500).json({ error: error.message });
  res.status(204).end();
});

export default router;
