// rutas de los sobrantes
// el personal de cocina registra cuantas porciones (y su peso en
// kilogramos) sobraron de cada jornada y sede al final del dia. Esos
// datos alimentan el reporte de sobrantes. Lo guarda cocina/admin y
// lo puede consultar tambien el coordinador.

import { Router } from "express";
import { getSupabase } from "../config/supabase.js";
import { requiereRol } from "../config/auth.js";

const router = Router();
const TURNOS = ["Almuerzo", "Refrigerio"];

// Valida que una fecha sea real y no sea futura: no tiene sentido
// reportar sobrantes de un dia que aun no llega.
function validarFechaSobrantes(fecha) {
  if (typeof fecha !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
    return "La fecha debe tener el formato año-mes-día (ej: 2026-08-10).";
  }

  const [año, mes, dia] = fecha.split("-").map(Number);
  const fechaObj = new Date(año, mes - 1, dia);
  if (
    fechaObj.getFullYear() !== año ||
    fechaObj.getMonth() !== mes - 1 ||
    fechaObj.getDate() !== dia
  ) {
    return "Esa fecha no existe.";
  }

  const hoy = new Date();
  const hoyTexto = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, "0")}-${String(hoy.getDate()).padStart(2, "0")}`;
  if (fecha > hoyTexto) {
    return "No se puede reportar sobrantes de una fecha futura.";
  }

  return null;
}

// GET /api/sobrantes?fecha=YYYY-MM-DD
// Lista los sobrantes registrados para una fecha (admin, cocina, coordinador)
router.get("/", requiereRol("admin", "cocina", "coordinador"), async (req, res) => {
  const { fecha } = req.query;
  if (!fecha) {
    return res.status(400).json({ error: "Falta la fecha" });
  }

  const { data, error } = await getSupabase()
    .from("sobrantes")
    .select("*")
    .eq("fecha", fecha)
    .order("sede", { ascending: true })
    .order("turno", { ascending: true });

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// POST /api/sobrantes
// Crea o actualiza el sobrante de una fecha + sede + jornada.
// Cuerpo: { fecha, sede, turno, porciones, peso_kg }
// Solo cocina y admin lo guardan.
router.post("/", requiereRol("admin", "cocina"), async (req, res) => {
  const { fecha, sede, turno } = req.body || {};
  let { porciones, peso_kg } = req.body || {};

  const errorFecha = validarFechaSobrantes(fecha);
  if (errorFecha) return res.status(400).json({ error: errorFecha });

  if (!TURNOS.includes(turno)) {
    return res.status(400).json({ error: "Turno no válido" });
  }

  if (!sede || !sede.trim()) {
    return res.status(400).json({ error: "Falta la sede" });
  }

  // La sede debe existir en la tabla de sedes (evita nombres inventados)
  const { data: sedes, error: errSedes } = await getSupabase()
    .from("sedes")
    .select("nombre");
  if (errSedes) return res.status(500).json({ error: errSedes.message });
  if (!sedes.map((s) => s.nombre).includes(sede)) {
    return res.status(400).json({ error: "Sede no válida" });
  }

  // Porciones: entero 0 o mas (vacio se guarda como null)
  if (porciones !== undefined && porciones !== null && porciones !== "") {
    porciones = Number(porciones);
    if (!Number.isInteger(porciones) || porciones < 0) {
      return res
        .status(400)
        .json({ error: "Las porciones deben ser un número entero (0 o más)" });
    }
  } else {
    porciones = null;
  }

  // Peso: numero 0 o mas en kilogramos (vacio se guarda como null)
  if (peso_kg !== undefined && peso_kg !== null && peso_kg !== "") {
    peso_kg = Number(peso_kg);
    if (Number.isNaN(peso_kg) || peso_kg < 0) {
      return res
        .status(400)
        .json({ error: "El peso debe ser un número (0 o más)" });
    }
  } else {
    peso_kg = null;
  }

  const fila = {
    fecha,
    sede,
    turno,
    porciones,
    peso_kg,
    creado_por: req.usuario?.nombre || req.usuario?.sub || null,
  };

  const { data, error } = await getSupabase()
    .from("sobrantes")
    .upsert(fila, { onConflict: "fecha,sede,turno" })
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

export default router;
