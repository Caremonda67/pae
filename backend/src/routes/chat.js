// ============================================================
// Chatbot con IA (Gemini)
// ============================================================
// El estudiante pregunta "que hay de comer hoy" o "como reservo"
// y el bot responde usando los datos REALES de la base:
// el menu, cuantas minutas hay reservadas, el reporte de
// desperdicio y los avisos publicados.
//
// La clave de gemini esta en el .env (GEMINI_API_KEY) y no se
// sube a github ni se manda al navegador, el backend es el que
// habla con la api de google internamente.
// ============================================================

import { Router } from "express";
import { getSupabase } from "../config/supabase.js";

const router = Router();

// Junta todo el contexto del programa en un texto que entiende el bot
function construirPromptSistema(contexto) {
  return [
    "Eres 'PAE Bot', el asistente virtual del Programa de Alimentación Escolar",
    "de la institución educativa. Respondes en español, con tono amable, claro y",
    "cercano, como un orientador del programa.",
    "",
    "Tu objetivo es ayudar a estudiantes, padres y docentes. Debes usar SIEMPRE",
    "la información REAL que se te da abajo (menú, reservas, reporte y avisos).",
    "Si te preguntan algo que no esté en esos datos, di que puedes consultarlo y",
    "sugiere hablar con el equipo del PAE por el formulario de contacto.",
    "",
    "Información importante del programa:",
    "- El estudiante debe RESERVAR su comida para que la cocina prepare solo",
    "  la cantidad exacta y así evitar el desperdicio de alimentos.",
    "- Para reservar: entrar a la página y usar la opción 'Reservar comida'.",
    "- Las sedes disponibles son: Sede A, Sede B y Sede C.",
    "- Los turnos son: Almuerzo y Refrigerio.",
    "",
    `MENÚ ACTUAL (menú oficial de la semana):\n${contexto.menu}`,
    "",
    `RESERVAS (cuántas minutas se han reservado por fecha):\n${contexto.reservas}`,
    "",
    `REPORTE DE DESPERDICIO:\n${contexto.reporte}`,
    "",
    `AVISOS PUBLICADOS POR EL ADMINISTRADOR:\n${contexto.avisos}`,
    "",
    "Responde de forma breve y útil (máximo 4-5 líneas). Si te preguntan por",
    "un día específico, indica exactamente el platillo de ese día si está en el",
    "menú. Si te preguntan cuántas minutas hay reservadas, usa los totales.",
    "Si te preguntan por avisos, cuéntalos. Ayuda a reducir el desperdicio",
    "recordando reservar la comida.",
  ].join("\n");
}

// POST /api/chat
// Cuerpo esperado: { mensaje: "texto del usuario" }
router.post("/", async (req, res) => {
  const { mensaje } = req.body;

  if (!mensaje || typeof mensaje !== "string") {
    return res.status(400).json({ error: "Falta el mensaje" });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({
      error:
        "El chatbot no está configurado aún. Pide al equipo que complete GEMINI_API_KEY en backend/.env",
    });
  }

  // Modelo de Gemini. Configurable por si Google actualiza la lista
  // de modelos gratuitos (ver https://ai.google.dev/gemini-api/docs/models)
  const modelo = process.env.GEMINI_MODEL || "gemini-3.5-flash";

  try {
    const supabase = getSupabase();

    // 1. Menu real desde la base de datos
    const { data: menus, error: errMenu } = await supabase
      .from("menus")
      .select("dia, platillo, descripcion, calorias");

    let menuTexto = "(El menú está vacío en la base de datos)";
    if (!errMenu && menus && menus.length > 0) {
      menuTexto = menus
        .map(
          (m) =>
            `- ${m.dia}: ${m.platillo} (${m.descripcion || "Sin descripción"}${m.calorias ? `, ${m.calorias} kcal` : ""})`
        )
        .join("\n");
    }

    // 2. Totales de reservas por fecha
    const { data: reservas, error: errReservas } = await supabase
      .from("reservas")
      .select("fecha, asistio");

    let reservasTexto = "(Aún no hay reservas registradas)";
    if (!errReservas && reservas && reservas.length > 0) {
      // contamos las reservas de cada fecha
      const porFecha = {};
      for (const r of reservas) {
        if (!porFecha[r.fecha]) porFecha[r.fecha] = { total: 0, asistieron: 0 };
        porFecha[r.fecha].total += 1;
        if (r.asistio) porFecha[r.fecha].asistieron += 1;
      }
      reservasTexto = Object.entries(porFecha)
        .map(([fecha, info]) => `- ${fecha}: ${info.total} reservadas`)
        .join("\n");
    }

    // 3. Reporte de desperdicio
    let total = 0;
    let asistieron = 0;
    if (!errReservas && reservas) {
      for (const r of reservas) {
        total += 1;
        if (r.asistio) asistieron += 1;
      }
    }
    const desperdicio = total - asistieron;
    let porcentaje = 0;
    if (total > 0) porcentaje = Math.round((desperdicio / total) * 100);
    const reporteTexto =
      total === 0
        ? "No hay reservas todavía."
        : `Total reservadas: ${total}. Asistieron: ${asistieron}. Sin asistir: ${desperdicio} (${porcentaje}% de desperdicio).`;

    // 4. Avisos publicados
    const { data: avisos, error: errAvisos } = await supabase
      .from("avisos")
      .select("titulo, texto")
      .order("created_at", { ascending: false });

    let avisosTexto = "(No hay avisos publicados)";
    if (!errAvisos && avisos && avisos.length > 0) {
      avisosTexto = avisos
        .map((a) => `- ${a.titulo}: ${a.texto}`)
        .join("\n");
    }

    const contexto = {
      menu: menuTexto,
      reservas: reservasTexto,
      reporte: reporteTexto,
      avisos: avisosTexto,
    };

    // 5. Llamamos a la API de Gemini (Google)
    const respuesta = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${modelo}:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          system_instruction: {
            parts: [{ text: construirPromptSistema(contexto) }],
          },
          contents: [
            {
              role: "user",
              parts: [{ text: mensaje }],
            },
          ],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 1024,
          },
        }),
      }
    );

    const datos = await respuesta.json();

    if (!respuesta.ok) {
      console.error("Gemini error:", JSON.stringify(datos));
      return res.status(502).json({ error: "Error del servicio de IA" });
    }

    // 6. Extraemos el texto de la respuesta de Gemini
    const texto =
      datos?.candidates?.[0]?.content?.parts
        ?.map((part) => part.text)
        .join("") || "No pude generar una respuesta.";

    res.json({ respuesta: texto });
  } catch (err) {
    console.error("Chatbot error:", err);
    res.status(500).json({ error: "Error interno del chatbot" });
  }
});

export default router;
