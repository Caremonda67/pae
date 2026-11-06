// Script para registrar a las 4 directoras de grupo como profesoras en el sistema PAE:
// - Carmen Aydee González Ortega -> Grado 9-1, Turno Refrigerio (Jornada Tarde)
// - Gloria Esneda Gallego Torres -> Grado 9-2, Turno Refrigerio (Jornada Tarde)
// - Alba Marina Chicunque Angrino -> Grado 10-1, Turno Almuerzo (Jornada Única)
// - Viviana Esperanza Murillo Tovar -> Grado 10-2, Turno Almuerzo (Jornada Única)
// Sede: Institución Educativa Ciudad Cordoba Sede Enrique Olaya Herrera

import { getSupabase } from "../src/config/supabase.js";
import { hashClave } from "../src/config/password.js";

const SEDE = "Institución Educativa Ciudad Cordoba Sede Enrique Olaya Herrera";
const PIN_INICIAL = "1234";

export const PROFESORES = [
  {
    nombre: "Carmen Aydee González Ortega",
    usuario: "Carmen",
    rol: "profesor",
    sede: SEDE,
    turno: "Refrigerio",
    grado: "9-1",
    activo: true,
  },
  {
    nombre: "Gloria Esneda Gallego Torres",
    usuario: "Gloria",
    rol: "profesor",
    sede: SEDE,
    turno: "Refrigerio",
    grado: "9-2",
    activo: true,
  },
  {
    nombre: "Alba Marina Chicunque Angrino",
    usuario: "Alba",
    rol: "profesor",
    sede: SEDE,
    turno: "Almuerzo",
    grado: "10-1",
    activo: true,
  },
  {
    nombre: "Viviana Esperanza Murillo Tovar",
    usuario: "Viviana",
    rol: "profesor",
    sede: SEDE,
    turno: "Almuerzo",
    grado: "10-2",
    activo: true,
  },
];

async function registrar() {
  console.log(`Registrando ${PROFESORES.length} profesoras/directoras de grupo...`);
  const sb = getSupabase();
  const clave_hash = hashClave(PIN_INICIAL);

  const datos = PROFESORES.map((p) => ({
    ...p,
    clave_hash,
  }));

  const { data, error } = await sb
    .from("usuarios")
    .upsert(datos, { onConflict: "usuario" })
    .select("id, nombre, usuario, rol, sede, turno, grado");

  if (error) {
    throw new Error(`Error registrando profesores: ${error.message}`);
  }

  console.log("✅ Profesoras registradas exitosamente:");
  console.table(data);
}

registrar().catch((err) => {
  console.error("❌ Error en registro de profesores:", err);
  process.exit(1);
});
