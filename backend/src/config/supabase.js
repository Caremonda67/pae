// conexion con supabase
// las claves estan en el .env, no se suben a github
// la conexion se hace perezosa para que el servidor arranque
// aunque todavia no esten configuradas las variables

import { createClient } from "@supabase/supabase-js";

// Leemos las variables de entorno cargadas por dotenv en server.js
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

let cliente = null;

// Devuelve el cliente de Supabase, creandolo la primera vez
export function getSupabase() {
  if (cliente) return cliente;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error(
      "Faltan las variables SUPABASE_URL o SUPABASE_ANON_KEY. " +
        "Copia backend/.env.example a backend/.env y completa los datos."
    );
  }

  cliente = createClient(supabaseUrl, supabaseKey);
  return cliente;
}
