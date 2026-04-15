// rutas del menu semanal y valoraciones de platos
// los estudiantes puntuan los platos (1 a 5 estrellas) y esa
// retroalimentacion le sirve a la cocina para mejorar el menu

import { Router } from "express";
import { getSupabase } from "../config/supabase.js";
import { requiereAdmin } from "../config/auth.js";

const router = Router();

// GET /api/menus
// Lista todos los menus del programa con su valoracion promedio
router.get("/", async (_req, res) => {
  const { data, error } = await getSupabase()
    .from("menus")
    .select("*")
    .order("dia", { ascending: true });
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

// POST /api/menus
// Crea un menu nuevo (solo admin)
// Cuerpo esperado: { dia, platillo, descripcion, calorias }
router.post("/", requiereAdmin, async (req, res) => {
  const { dia, platillo, descripcion, calorias } = req.body;

  if (!dia || !platillo) {
    return res.status(400).json({ error: "Faltan datos obligatorios" });
  }

  const { data, error } = await getSupabase()
    .from("menus")
    .insert([{ dia, platillo, descripcion, calorias }])
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data);
});

// POST /api/menus/:id/valorar
// Guarda la valoracion de un plato (1 a 5)
// Cuerpo esperado: { puntos: 4 }
// Un mismo documento no puede votar el mismo plato dos veces.
router.post("/:id/valorar", async (req, res) => {
  const menuId = req.params.id;
  const { puntos, documento } = req.body;

  const puntosNum = Number(puntos);
  if (!Number.isInteger(puntosNum) || puntosNum < 1 || puntosNum > 5) {
    return res
      .status(400)
      .json({ error: "La valoración debe ser un número entre 1 y 5" });
  }

  // El documento debe estar registrado (solo beneficiarios votan)
  if (documento) {
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
  }

  const { data, error } = await getSupabase()
    .from("valoraciones")
    .insert([{ menu_id: menuId, puntos: puntosNum, documento: documento || null }])
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data);
});

export default router;
