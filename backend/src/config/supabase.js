// ============================================================
// Conexion a Supabase
// ============================================================
// Configuracion centralizada del cliente de Supabase.
// Los valores secretos viven en el archivo .env (no se suben a Git).
// ============================================================

import { createClient } from "@supabase/supabase-js";

// Leemos las variables de entorno cargadas por dotenv en server.js
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error(
    "[ERROR] Faltan las variables SUPABASE_URL o SUPABASE_ANON_KEY. Copia .env.example a .env y completa los datos."
  );
}

// Cliente unico reutilizado en toda la aplicacion
export const supabase = createClient(supabaseUrl, supabaseKey);
