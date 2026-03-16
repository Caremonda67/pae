// ============================================================
// Chatbot con IA (Gemini)
// ============================================================
// El estudiante pregunta "que hay de comer hoy" o "como reservo"
// y el bot responde usando el menu real de la base de datos.
//
// La clave de gemini esta en el .env (GEMINI_API_KEY) y no se
// sube a github ni se manda al navegador, el backend es el que
// habla con la api de google internamente.
// ============================================================

import { Router } from "express";
import { getSupabase } from "../config/supabase.js";

const router = Router();

// Mensaje base: define la personalidad y el conocimiento del bot.
// El bot "es" el programa PAE y responde en tono cercano.
function construirPromptSistema(menuTexto) {
  return [
    "Eres 'PAE Bot', el asistente virtual del Programa de Alimentación Escolar",
    "de la institución educativa. Respondes en español, con tono amable, claro y",
    "cercano, como un orientador del programa.",
    "",
    "Tu objetivo es ayudar a estudiantes, padres y docentes. Debes usar SIEMPRE",
    "la información real del menú que se te da abajo. Si te preguntan algo que",
    "no está en el menú o no sabes, di que puedes consultarlo y sugiere hablar",
    "con el equipo del PAE a través del formulario de contacto.",
    "",
    "Información importante del programa:",
    "- El estudiante debe RESERVAR su comida para que la cocina prepare solo",
    "  la cantidad exacta y así evitar el desperdicio de alimentos.",
    "- Para reservar: entrar a la página y usar la opción 'Reservar comida'.",
    "- Las sedes disponibles son: Sede A, Sede B y Sede C.",
    "- Los turnos son: Almuerzo y Refrigerio.",
    "",
    `MENÚ ACTUAL (este es el menú oficial de la semana):\n${menuTexto}`,
    "",
    "Responde de forma breve y útil (máximo 4-5 líneas). Si te preguntan por",
    "un día específico, indica exactamente el platillo de ese día si está en el",
    "menú. Ayuda a reducir el desperdicio recordando reservar la comida.",
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
    // 1. Cargamos el menu real desde la base de datos
    const { data: menus, error } = await getSupabase()
      .from("menus")
      .select("dia, platillo, descripcion, calorias");

    let menuTexto = "(El menú está vacío en la base de datos)";
    if (!error && menus && menus.length > 0) {
      menuTexto = menus
        .map(
          (m) => `- ${m.dia}: ${m.platillo} (${m.descripcion || "Sin descripción"}${m.calorias ? `, ${m.calorias} kcal` : ""})`
        )
        .join("\n");
    }

    // 2. Llamamos a la API de Gemini (Google)
    const respuesta = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${modelo}:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          system_instruction: {
            parts: [{ text: construirPromptSistema(menuTexto) }],
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

    // 3. Extraemos el texto de la respuesta de Gemini
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
