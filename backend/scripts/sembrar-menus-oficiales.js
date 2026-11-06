// Script de migracion para sembrar los 40 menus oficiales del PAE Cali 2026
// Basado en Resolucion 335 de 2021 - SED PAE Cali (Union Temporal Nutriendo Cali 2026)
// Anexo 8.2 Complemento Preparado en Sitio Jornada PM (Refrigerio)
// Anexo 8.3 Almuerzo Jornada Unica (Almuerzo)

import { getSupabase } from "../src/config/supabase.js";

const IMG = (id) => `https://images.unsplash.com/photo-${id}?w=400`;

export const MENUS_OFICIALES = [
  // ==========================================
  // SEMANA 1
  // ==========================================
  // Lunes S1
  {
    semana: 1,
    dia: "Lunes",
    jornada: "Almuerzo",
    platillo: "Fajitas de carne de cerdo asada con arroz primavera y papa criolla al romero",
    descripcion: "Fajitas de carne de cerdo asada con verduras entre la preparación, arroz primavera (zanahoria y arveja), papa criolla dorada con romero y ajo, y sorbete de guayaba.",
    calorias: 560,
    imagen: IMG("1544025162-d76694265947"),
    estado: "publicado"
  },
  {
    semana: 1,
    dia: "Lunes",
    jornada: "Refrigerio",
    platillo: "Huevos pericos con arroz con zanahoria y puré de papa criolla",
    descripcion: "Huevos pericos acompañados de arroz con zanahoria, puré de papa criolla y sorbete de guayaba con banano.",
    calorias: 380,
    imagen: IMG("1525351484163-7529414344d8"),
    estado: "publicado"
  },
  // Martes S1
  {
    semana: 1,
    dia: "Martes",
    jornada: "Almuerzo",
    platillo: "Fajitas de pechuga de pollo asado con lentejas guisadas y papa chorreada",
    descripcion: "Fajitas de pechuga de pollo asado, lentejas guisadas caseras, arroz blanco, papa chorreada en salsa criolla, ensalada de tomate, aguacate y lechuga con limón, y jugo de lulo en agua.",
    calorias: 580,
    imagen: IMG("1594998893017-36147cbcae05"),
    estado: "publicado"
  },
  {
    semana: 1,
    dia: "Martes",
    jornada: "Refrigerio",
    platillo: "Fajitas de pollo salteado con espaguetis en salsa criolla y arroz",
    descripcion: "Fajitas de pollo salteado con verduras (cebolla y zanahoria), espaguetis en salsa criolla con queso, arroz blanco, piña picada y jugo de maracuyá en agua.",
    calorias: 420,
    imagen: IMG("1563379091339-03b21ab4a4f8"),
    estado: "publicado"
  },
  // Miercoles S1
  {
    semana: 1,
    dia: "Miercoles",
    jornada: "Almuerzo",
    platillo: "Estofado de cerdo con papa, arroz con fideos y plátano maduro",
    descripcion: "Estofado tierno de carne de cerdo con papa, arroz con fideos dorados, tajada de plátano maduro asado, verduras orientales salteadas (repollo, zanahoria y pimentón), y sorbete de guanábana.",
    calorias: 570,
    imagen: IMG("1574484284002-952d92456975"),
    estado: "publicado"
  },
  {
    semana: 1,
    dia: "Miercoles",
    jornada: "Refrigerio",
    platillo: "Huevos pericos con frijoles guisados y plátano maduro con queso",
    descripcion: "Huevos pericos, frijoles guisados con zapallo, arroz blanco, tajada de plátano maduro asado con queso doble crema, mandarina y jugo de lulo en agua.",
    calorias: 410,
    imagen: IMG("1589301760014-d929f3979dbc"),
    estado: "publicado"
  },
  // Jueves S1
  {
    semana: 1,
    dia: "Jueves",
    jornada: "Almuerzo",
    platillo: "Huevos pericos con arvejas guisadas, puré de papa y ensalada tropical",
    descripcion: "Huevos pericos tradicionales, arvejas guisadas, arroz blanco, puré suave de papa común, ensalada tropical (piña calada, repollo y zanahoria), y jugo de piña en agua.",
    calorias: 520,
    imagen: IMG("1541832676-9b763b0239ab"),
    estado: "publicado"
  },
  {
    semana: 1,
    dia: "Jueves",
    jornada: "Refrigerio",
    platillo: "Carne de cerdo guisada con cilantro y arroz con verduras",
    descripcion: "Carne de cerdo guisada al cilantro, arroz blanco con habichuela y zanahoria, chips de papa común, mix de mango y papaya, y sorbete de fresa.",
    calorias: 430,
    imagen: IMG("1598515214211-89d3c73ae83b"),
    estado: "publicado"
  },
  // Viernes S1
  {
    semana: 1,
    dia: "Viernes",
    jornada: "Almuerzo",
    platillo: "Fajitas de pollo a la jardinera con arroz verde y plátano melado",
    descripcion: "Fajitas de pechuga de pollo a la jardinera con verduras entre la preparación, arroz verde al perejil, plátano melado tradicional y sorbete de mango.",
    calorias: 550,
    imagen: IMG("1604908176997-125f25cc6f3d"),
    estado: "publicado"
  },
  {
    semana: 1,
    dia: "Viernes",
    jornada: "Refrigerio",
    platillo: "Lentejas guisadas con arroz blanco y papas a la francesa",
    descripcion: "Lentejas guisadas caseras, arroz blanco, papas a la francesa doradas, ensalada fresca de cebolla, tomate y cilantro, y sorbete de mango.",
    calorias: 390,
    imagen: IMG("1547592166-23ac45744acd"),
    estado: "publicado"
  },

  // ==========================================
  // SEMANA 2
  // ==========================================
  // Lunes S2
  {
    semana: 2,
    dia: "Lunes",
    jornada: "Almuerzo",
    platillo: "Chop suey de pechuga de pollo con arroz blanco y plátano maduro",
    descripcion: "Chop suey de pechuga de pollo salteado con repollo y zanahoria, arroz blanco suelto, tajada de plátano maduro asado y sorbete de guanábana.",
    calorias: 540,
    imagen: IMG("1512058564366-18510be2db19"),
    estado: "publicado"
  },
  {
    semana: 2,
    dia: "Lunes",
    jornada: "Refrigerio",
    platillo: "Huevos revueltos con tomate, arroz blanco y plátano maduro",
    descripcion: "Huevos revueltos con tomate fresco, arroz blanco, tajada de plátano maduro asado, ensalada de lechuga, tomate y aguacate, y sorbete de mango.",
    calorias: 370,
    imagen: IMG("1525351484163-7529414344d8"),
    estado: "publicado"
  },
  // Martes S2
  {
    semana: 2,
    dia: "Martes",
    jornada: "Almuerzo",
    platillo: "Huevos revueltos con lentejas guisadas y papa chorreada",
    descripcion: "Huevos revueltos suaves, lentejas guisadas caseras, arroz blanco, papa chorreada con salsa de queso y cebolla, ensalada de lechuga, tomate y pepino cohombro, y jugo de piña en agua.",
    calorias: 530,
    imagen: IMG("1547592166-23ac45744acd"),
    estado: "publicado"
  },
  {
    semana: 2,
    dia: "Martes",
    jornada: "Refrigerio",
    platillo: "Fajitas de pollo asado con arroz primavera y puré de papa criolla",
    descripcion: "Fajitas de pollo asado jugoso, arroz primavera (zanahoria y arveja), puré suave de papa criolla, banano fresco y sorbete de guayaba.",
    calorias: 410,
    imagen: IMG("1532550907401-a500c9a57435"),
    estado: "publicado"
  },
  // Miercoles S2
  {
    semana: 2,
    dia: "Miercoles",
    jornada: "Almuerzo",
    platillo: "Fajitas de cerdo con zapallo y arveja, arroz con fideos y puré criollo",
    descripcion: "Fajitas de carne de cerdo salteadas con zapallo y arveja, arroz con fideos dorados, puré cremoso de papa criolla y sorbete de fresa.",
    calorias: 550,
    imagen: IMG("1543339308-43e59d6b73a6"),
    estado: "publicado"
  },
  {
    semana: 2,
    dia: "Miercoles",
    jornada: "Refrigerio",
    platillo: "Huevos pericos con papa criolla dorada al romero y ajo",
    descripcion: "Huevos pericos campesinos, arroz blanco, papa criolla dorada con romero y ajo, papaya picada fresca y sorbete de guanábana.",
    calorias: 360,
    imagen: IMG("1541832676-9b763b0239ab"),
    estado: "publicado"
  },
  // Jueves S2
  {
    semana: 2,
    dia: "Jueves",
    jornada: "Almuerzo",
    platillo: "Fajitas de carne de res asada con frijoles guisados y moneditas de plátano",
    descripcion: "Fajitas de carne de res asada a la plancha, frijoles guisados con zapallo, arroz blanco, moneditas de plátano crocantes, ensalada de tomate, aguacate y lechuga con limón, y jugo de guayaba en agua.",
    calorias: 590,
    imagen: IMG("1555939594-58d7cb561ad1"),
    estado: "publicado"
  },
  {
    semana: 2,
    dia: "Jueves",
    jornada: "Refrigerio",
    platillo: "Sándwich de pollo apanado con queso y papas a la francesa",
    descripcion: "Sándwich de pollo apanado con queso derretido, lechuga y tomate en pan fresco, acompañado de papas a la francesa y jugo de maracuyá en agua.",
    calorias: 440,
    imagen: IMG("1625813506062-0aeb1d7a094b"),
    estado: "publicado"
  },
  // Viernes S2
  {
    semana: 2,
    dia: "Viernes",
    jornada: "Almuerzo",
    platillo: "Chuleta de cerdo con arroz verde y ensalada fría de papa",
    descripcion: "Deliciosa chuleta de cerdo dorada, arroz verde al perejil, ensalada fría de papa en cuadritos con zanahoria, arveja y habichuela en salsa blanca, y sorbete de mango.",
    calorias: 610,
    imagen: IMG("1432139555190-58524dae6a55"),
    estado: "publicado"
  },
  {
    semana: 2,
    dia: "Viernes",
    jornada: "Refrigerio",
    platillo: "Frijoles guisados con zapallo y plátano maduro con queso doble crema",
    descripcion: "Frijoles guisados tradicionales con zapallo, arroz blanco, tajada de plátano maduro asado con queso doble crema, mandarina y agua de panela con limón.",
    calorias: 420,
    imagen: IMG("1589302168068-964664d93dc0"),
    estado: "publicado"
  },

  // ==========================================
  // SEMANA 3
  // ==========================================
  // Lunes S3
  {
    semana: 3,
    dia: "Lunes",
    jornada: "Almuerzo",
    platillo: "Trozos de cerdo salteados con arroz con cilantro y puré de plátano maduro",
    descripcion: "Trozos de carne de cerdo salteados con zanahoria y habichuela, arroz con cilantro, puré dulce de plátano maduro y sorbete de mango.",
    calorias: 560,
    imagen: IMG("1504674900247-0877df9cc836"),
    estado: "publicado"
  },
  {
    semana: 3,
    dia: "Lunes",
    jornada: "Refrigerio",
    platillo: "Huevos revueltos con papa y arroz atomatado",
    descripcion: "Huevos revueltos con papa en cubitos, arroz atomatado sabroso, mango dulce picado y sorbete de guayaba y maracuyá.",
    calorias: 370,
    imagen: IMG("1525351484163-7529414344d8"),
    estado: "publicado"
  },
  // Martes S3
  {
    semana: 3,
    dia: "Martes",
    jornada: "Almuerzo",
    platillo: "Fajitas de pollo en salsa criolla con blanquillos guisados y papa criolla",
    descripcion: "Fajitas de pollo en salsa criolla tradicional, blanquillos guisados caseros, arroz blanco, papa criolla dorada con romero y ajo, ensalada de tomate y lechuga con limón, y jugo de guayaba en agua.",
    calorias: 570,
    imagen: IMG("1543353071-873f17a7a088"),
    estado: "publicado"
  },
  {
    semana: 3,
    dia: "Martes",
    jornada: "Refrigerio",
    platillo: "Pechuga de pollo salteada con arroz verde y papa chorreada",
    descripcion: "Pechuga de pollo salteada jugosa, arroz verde al perejil, papa chorreada con salsa criolla de queso, piña picada y sorbete de fresa.",
    calorias: 420,
    imagen: IMG("1594998893017-36147cbcae05"),
    estado: "publicado"
  },
  // Miercoles S3
  {
    semana: 3,
    dia: "Miercoles",
    jornada: "Almuerzo",
    platillo: "Trozos de cerdo salteados con papa en salsa blanca y verduras",
    descripcion: "Trozos de carne de cerdo salteados, arroz con fideos dorados, papa en salsa blanca con cilantro y margarina, verduras salteadas (brócoli, cebolla y zanahoria), y sorbete de fresa.",
    calorias: 580,
    imagen: IMG("1598515214211-89d3c73ae83b"),
    estado: "publicado"
  },
  {
    semana: 3,
    dia: "Miercoles",
    jornada: "Refrigerio",
    platillo: "Fajitas de carne de res con frijoles guisados y plátano maduro",
    descripcion: "Fajitas de carne de res asada, frijoles guisados con zapallo, arroz blanco, tajada de plátano maduro asado con queso doble crema y jugo de maracuyá en agua.",
    calorias: 450,
    imagen: IMG("1589301760014-d929f3979dbc"),
    estado: "publicado"
  },
  // Jueves S3
  {
    semana: 3,
    dia: "Jueves",
    jornada: "Almuerzo",
    platillo: "Huevos revueltos con arvejas guisadas y moneditas de plátano",
    descripcion: "Huevos revueltos suaves, arvejas guisadas con papa en cubitos, arroz blanco, moneditas de plátano crocantes, ensalada tropical (piña calada, repollo y zanahoria), y jugo de maracuyá en agua.",
    calorias: 530,
    imagen: IMG("1541832676-9b763b0239ab"),
    estado: "publicado"
  },
  {
    semana: 3,
    dia: "Jueves",
    jornada: "Refrigerio",
    platillo: "Hamburguesa de carne de cerdo con queso y papas a la francesa",
    descripcion: "Hamburguesa de carne de cerdo con queso fundido, lechuga y tomate en pan tierno, acompañada de papas a la francesa y agua de panela con limón.",
    calorias: 460,
    imagen: IMG("1565299624946-b28f40a0ae38"),
    estado: "publicado"
  },
  // Viernes S3
  {
    semana: 3,
    dia: "Viernes",
    jornada: "Almuerzo",
    platillo: "Fajitas de pollo con espinaca y pimentón con puré de papa criolla",
    descripcion: "Fajitas de pechuga de pollo salteadas con espinaca, cebolla y pimentón, arroz blanco, puré suave de papa criolla y sorbete de guayaba.",
    calorias: 540,
    imagen: IMG("1604908176997-125f25cc6f3d"),
    estado: "publicado"
  },
  {
    semana: 3,
    dia: "Viernes",
    jornada: "Refrigerio",
    platillo: "Lentejas guisadas con arroz blanco y moneditas de plátano",
    descripcion: "Lentejas guisadas caseras, arroz blanco, moneditas de plátano crocantes, ensalada de lechuga, zanahoria y mango, y sorbete de guayaba.",
    calorias: 390,
    imagen: IMG("1547592166-23ac45744acd"),
    estado: "publicado"
  },

  // ==========================================
  // SEMANA 4
  // ==========================================
  // Lunes S4
  {
    semana: 4,
    dia: "Lunes",
    jornada: "Almuerzo",
    platillo: "Fajitas de carne de cerdo asada con arroz verde y papa chorreada",
    descripcion: "Fajitas de carne de cerdo asada, arroz verde al perejil, papa chorreada en salsa criolla, ensalada tropical con piña calada, repollo y zanahoria, y sorbete de mango.",
    calorias: 570,
    imagen: IMG("1544025162-d76694265947"),
    estado: "publicado"
  },
  {
    semana: 4,
    dia: "Lunes",
    jornada: "Refrigerio",
    platillo: "Huevos pericos con tortas de papa, brócoli y queso",
    descripcion: "Huevos pericos tradicionales, arroz blanco, tortas horneadas de papa con brócoli y queso fundido, manzana fresca y sorbete de banano.",
    calorias: 380,
    imagen: IMG("1546069901-ba9599a7e63c"),
    estado: "publicado"
  },
  // Martes S4
  {
    semana: 4,
    dia: "Martes",
    jornada: "Almuerzo",
    platillo: "Huevos pericos con lentejas guisadas y papas a la francesa",
    descripcion: "Huevos pericos campesinos, lentejas guisadas caseras, arroz blanco, papas a la francesa doradas, ensalada de lechuga, tomate y cilantro, y jugo de piña en agua.",
    calorias: 540,
    imagen: IMG("1547592166-23ac45744acd"),
    estado: "publicado"
  },
  {
    semana: 4,
    dia: "Martes",
    jornada: "Refrigerio",
    platillo: "Fajitas de pollo guisadas con habichuela y zanahoria",
    descripcion: "Fajitas de pechuga de pollo guisadas con habichuela y zanahoria en su jugo, arroz blanco, piña picada y sorbete de maracuyá-mango.",
    calorias: 390,
    imagen: IMG("1563379091339-03b21ab4a4f8"),
    estado: "publicado"
  },
  // Miercoles S4
  {
    semana: 4,
    dia: "Miercoles",
    jornada: "Almuerzo",
    platillo: "Fajitas de carne de res asada con arroz primavera y puré de papa criolla",
    descripcion: "Fajitas de carne de res asada a la plancha, arroz primavera (zanahoria y arveja), puré cremoso de papa criolla, verduras entre el cereal acompañante, y sorbete de guayaba.",
    calorias: 560,
    imagen: IMG("1555939594-58d7cb561ad1"),
    estado: "publicado"
  },
  {
    semana: 4,
    dia: "Miercoles",
    jornada: "Refrigerio",
    platillo: "Pechuga de pollo salteada con arroz con fideos",
    descripcion: "Pechuga de pollo salteada jugosa, arroz con fideos dorados, ensalada fresca de lechuga, zanahoria y mango, y sorbete de guanábana.",
    calorias: 410,
    imagen: IMG("1532550907401-a500c9a57435"),
    estado: "publicado"
  },
  // Jueves S4
  {
    semana: 4,
    dia: "Jueves",
    jornada: "Almuerzo",
    platillo: "Trozos de cerdo salteados con frijoles guisados y plátano maduro",
    descripcion: "Trozos de carne de cerdo salteados, frijoles guisados con zapallo, arroz blanco, tajada de plátano maduro asado, ensalada de tomate, aguacate y lechuga con limón, y jugo de tomate de árbol en agua.",
    calorias: 590,
    imagen: IMG("1589301760014-d929f3979dbc"),
    estado: "publicado"
  },
  {
    semana: 4,
    dia: "Jueves",
    jornada: "Refrigerio",
    platillo: "Fajitas de cerdo con zapallo y arveja con papa criolla dorada",
    descripcion: "Fajitas de carne de cerdo salteadas con zapallo y arveja, arroz blanco, papa criolla dorada con queso fundido y jugo de piña en agua.",
    calorias: 430,
    imagen: IMG("1543339308-43e59d6b73a6"),
    estado: "publicado"
  },
  // Viernes S4
  {
    semana: 4,
    dia: "Viernes",
    jornada: "Almuerzo",
    platillo: "Pechuga de pollo desmechada en salsa blanca con espaguetis salteados",
    descripcion: "Pechuga de pollo desmechada en salsa blanca con hierbas, espaguetis salteados, arroz blanco, ensalada de lechuga, zanahoria y mango, y sorbete de fresa.",
    calorias: 580,
    imagen: IMG("1567620832903-9fc6debc209f"),
    estado: "publicado"
  },
  {
    semana: 4,
    dia: "Viernes",
    jornada: "Refrigerio",
    platillo: "Espaguetis en salsa criolla con queso y ensalada de aguacate",
    descripcion: "Espaguetis en salsa criolla con queso rallado, arroz blanco, ensalada fresca de aguacate, lechuga, maíz tierno y manzana, y sorbete de guayaba.",
    calorias: 400,
    imagen: IMG("1621996346565-e3dbc646d9a9"),
    estado: "publicado"
  }
];

async function sembrar() {
  console.log("Iniciando reemplazo de menús semilla por los oficiales del PAE Cali 2026...");
  const sb = getSupabase();

  // 1. Eliminar datos existentes en menus (las dependencias en valoraciones y favoritos tienen cascade)
  const { error: errDelVal } = await sb.from("valoraciones").delete().neq("id", 0);
  if (errDelVal) console.warn("Aviso al limpiar valoraciones:", errDelVal.message);

  const { error: errDelFav } = await sb.from("favoritos").delete().neq("id", 0);
  if (errDelFav) console.warn("Aviso al limpiar favoritos:", errDelFav.message);

  const { error: errDelMenus } = await sb.from("menus").delete().neq("id", 0);
  if (errDelMenus) {
    throw new Error(`Error al eliminar menús viejos: ${errDelMenus.message}`);
  }
  console.log("✅ Menús semilla anteriores eliminados correctamente.");

  // 2. Insertar los 40 menús oficiales en lotes de 10
  for (let i = 0; i < MENUS_OFICIALES.length; i += 10) {
    const lote = MENUS_OFICIALES.slice(i, i + 10);
    const { data, error } = await sb.from("menus").insert(lote).select("id, semana, dia, jornada, platillo");
    if (error) {
      throw new Error(`Error insertando lote ${i / 10 + 1}: ${error.message}`);
    }
    console.log(`✅ Lote ${i / 10 + 1}/4 insertado (${data.length} platos).`);
  }

  // 3. Verificación final
  const { count, error: errCount } = await sb.from("menus").select("*", { count: "exact", head: true });
  if (errCount) console.warn("Aviso al contar menús:", errCount.message);
  console.log(`\n🎉 Operación exitosa. Total menús en la base de datos: ${count}`);
}

sembrar().catch((e) => {
  console.error("❌ Error en sembrador:", e);
  process.exit(1);
});
