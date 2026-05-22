// rutas del menu del PAE y valoraciones de platos
// el menu rota por semana del mes (1-4) y cada dia tiene una comida
// diferente por jornada (Almuerzo y Refrigerio). Los estudiantes
// puntuan los platos (1 a 5 estrellas) y esa retroalimentacion le
// sirve a la cocina para mejorar el menu.

import { Router } from "express";
import { getSupabase } from "../config/supabase.js";
import { requiereRol } from "../config/auth.js";

const router = Router();

// Semana del mes (1-4): dias 1-7 son semana 1, 8-14 semana 2, etc.
function semanaDelMes(fecha) {
  return Math.min(4, Math.ceil(fecha.getDate() / 7));
}

// Dia de la semana en espanol (Lunes..Viernes). Los fines de semana
// se devuelve "Lunes" (no hay servicio), asi la Home muestra el del lunes.
function diaEnEspanol(fecha) {
  const dias = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
  const nombre = dias[fecha.getDay()];
  if (nombre === "Domingo" || nombre === "Sábado") return "Lunes";
  return nombre;
}

// GET /api/menus
// Lista los menus con su valoracion promedio. Se puede filtrar por
// semana (?semana=2) o por semana y dia (?semana=2&dia=Lunes).
router.get("/", async (req, res) => {
  let consulta = getSupabase()
    .from("menus")
    .select("*")
    .order("semana", { ascending: true })
    .order("dia", { ascending: true })
    .order("jornada", { ascending: true });

  if (req.query.semana) {
    consulta = consulta.eq("semana", Number(req.query.semana));
  }
  if (req.query.dia) {
    consulta = consulta.eq("dia", req.query.dia);
  }

  const { data, error } = await consulta;
  if (error) return res.status(500).json({ error: error.message });

  // Leemos las valoraciones guardadas y calculamos el promedio
  const { data: valoraciones, error: errVal } = await getSupabase()
    .from("valoraciones")
    .select("menu_id, puntos");

  let promedioPorMenu = {};
  let conteoPorMenu = {};
  if (!errVal && valoraciones) {
    const sumaPorMenu = {};
    for (const v of valoraciones) {
      if (!sumaPorMenu[v.menu_id]) sumaPorMenu[v.menu_id] = 0;
      if (!conteoPorMenu[v.menu_id]) conteoPorMenu[v.menu_id] = 0;
      sumaPorMenu[v.menu_id] += v.puntos;
      conteoPorMenu[v.menu_id] += 1;
    }
    promedioPorMenu = Object.fromEntries(
      Object.entries(sumaPorMenu).map(([id, suma]) => [
        id,
        Math.round((suma / conteoPorMenu[id]) * 10) / 10,
      ])
    );
  }

  // Adjuntamos el promedio y la cantidad de votos a cada menu
  const menusConValoracion = data.map((menu) => ({
    ...menu,
    valoracion: promedioPorMenu[menu.id] || null,
    votos: conteoPorMenu[menu.id] || 0,
  }));

  res.json(menusConValoracion);
});

// GET /api/menus/hoy
// La comida del dia actual (zona horaria de Colombia): todas las
// jornadas de HOY de la semana del mes vigente. La usa la Home.
// Tambien acepta ?fecha=YYYY-MM-DD para consultar un dia concreto
// (lo usa el panel de cocina). Devuelve:
// { semana, dia, platos: [{ jornada, platillo, ... }] }
router.get("/hoy", async (req, res) => {
  let colombia;
  if (req.query.fecha) {
    const [año, mes, dia] = String(req.query.fecha).split("-").map(Number);
    if (!año || !mes || !dia) {
      return res.status(400).json({ error: "Fecha no válida" });
    }
    colombia = new Date(año, mes - 1, dia, 12, 0, 0);
  } else {
    const ahora = new Date();
    // Hora de Colombia (UTC-5) para no fallar cerca de la medianoche
    colombia = new Date(ahora.getTime() - 5 * 60 * 60 * 1000);
  }
  const semana = semanaDelMes(colombia);
  const dia = diaEnEspanol(colombia);

  const { data, error } = await getSupabase()
    .from("menus")
    .select("*")
    .eq("semana", semana)
    .eq("dia", dia)
    .order("jornada", { ascending: true });

  if (error) return res.status(500).json({ error: error.message });
  res.json({ semana, dia, platos: data });
});

// POST /api/menus
// Crea una comida del menu (solo admin)
// Cuerpo esperado: { semana, dia, jornada, platillo, descripcion, calorias, imagen }
//   - semana: 1 a 4 (semana del mes)
//   - jornada: "Almuerzo" o "Refrigerio" (una comida DIFERENTE por jornada)
router.post("/", requiereRol("admin", "cocina"), async (req, res) => {
  const { semana, dia, jornada, platillo, descripcion, calorias, imagen } = req.body;

  if (!dia || !platillo || !jornada) {
    return res.status(400).json({ error: "Faltan datos obligatorios" });
  }

  const semanaNum = Math.min(4, Math.max(1, Number(semana) || 1));

  const { data, error } = await getSupabase()
    .from("menus")
    .insert([{
      semana: semanaNum,
      dia,
      jornada,
      platillo,
      descripcion,
      calorias: calorias || null,
      imagen: imagen || null,
    }])
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data);
});

// DELETE /api/menus/:id
// Elimina un plato del menu (solo admin)
router.delete("/:id", requiereRol("admin", "cocina"), async (req, res) => {
  const { error } = await getSupabase()
    .from("menus")
    .delete()
    .eq("id", req.params.id);
  if (error) return res.status(500).json({ error: error.message });
  res.status(204).end();
});

// POST /api/menus/:id/valorar
// Guarda la valoracion de un plato (1 a 5)
// Cuerpo esperado: { puntos: 4, documento: "1234567890" }
// El documento es obligatorio (solo beneficiarios votan) y un mismo
// documento no puede votar el mismo plato dos veces.
router.post("/:id/valorar", async (req, res) => {
  const menuId = req.params.id;
  const { puntos, documento } = req.body;

  const puntosNum = Number(puntos);
  if (!Number.isInteger(puntosNum) || puntosNum < 1 || puntosNum > 5) {
    return res
      .status(400)
      .json({ error: "La valoración debe ser un número entre 1 y 5" });
  }

  // El documento es obligatorio: los votos anonimos inflan las estrellas
  if (!documento) {
    return res
      .status(400)
      .json({ error: "Debes ingresar tu documento para valorar" });
  }

  // El documento debe estar registrado (solo beneficiarios votan)
  const { data: beneficiario } = await getSupabase()
    .from("beneficiarios")
    .select("id")
    .eq("documento", String(documento).trim())
    .maybeSingle();

  if (!beneficiario) {
    return res.status(400).json({ error: "Documento no registrado" });
  }

  // Evitar votos repetidos del mismo documento en el mismo plato
  const { data: yaVoto } = await getSupabase()
    .from("valoraciones")
    .select("id")
    .eq("menu_id", menuId)
    .eq("documento", String(documento).trim())
    .maybeSingle();

  if (yaVoto) {
    // Si ya voto, actualizamos su puntaje en vez de crear otro
    const { data, error } = await getSupabase()
      .from("valoraciones")
      .update({ puntos: puntosNum })
      .eq("id", yaVoto.id)
      .select()
      .single();

    if (error) return res.status(500).json({ error: error.message });
    return res.json(data);
  }

  const { data, error } = await getSupabase()
    .from("valoraciones")
    .insert([{ menu_id: menuId, puntos: puntosNum, documento: String(documento).trim() }])
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data);
});

export default router;
