const crypto = require("crypto");
const fs = require("fs");
const path = require("path");

// Sembrador del menú: completa todas las semanas con 10 platos
// (Lunes-Viernes, Almuerzo + Refrigerio) en el API en producción.
// Uso:
//   node backend/scripts/cargar-menu.cjs
// Requiere el backend arriba y ADMIN_CLAVE/ADMIN_SECRET en backend/.env

const IMG = (id) => `https://images.unsplash.com/photo-${id}?w=400`;

const envPath = path.join(__dirname, "..", ".env");
const env = fs.readFileSync(envPath, "utf8");
const CLAVE = (env.match(/^ADMIN_CLAVE=(.*)$/m) || [])[1]?.trim();
const SECRETO = (env.match(/^ADMIN_SECRET=(.*)$/m) || [])[1]?.trim() || CLAVE;

if (!SECRETO) {
  console.error("Falta ADMIN_CLAVE/ADMIN_SECRET en backend/.env");
  process.exit(1);
}

// Token JWT HMAC igual que el backend (firma con ADMIN_SECRET o ADMIN_CLAVE)
const payload = { sub: "admin", rol: "admin", nombre: "Administrador", exp: Date.now() + 12 * 3600 * 1000 };
const b64 = Buffer.from(JSON.stringify(payload)).toString("base64url");
const firma = crypto.createHmac("sha256", SECRETO).update(b64).digest("base64url");
const token = b64 + "." + firma;

const API = (env.match(/^API_URL=(.*)$/m) || [])[1]?.trim() || "https://pae-api-0s37.onrender.com";
const MENUS_URL = API.replace(/\/$/, "") + "/api/menus";

// Menús oficiales del PAE Cali 2026 (Resolución 335 de 2021)
// Unión Temporal Nutriendo Cali 2026.
// Jornada Única = Almuerzo
// Horario PM / Complemento preparado en sitio = Refrigerio
const platos = [
  // Semana 1
  { semana: 1, dia: "Lunes", jornada: "Almuerzo", platillo: "Fajitas de carne de cerdo asada con arroz primavera y papa criolla al romero", descripcion: "Fajitas de carne de cerdo asada con verduras entre la preparación, arroz primavera (zanahoria y arveja), papa criolla dorada con romero y ajo, y sorbete de guayaba.", calorias: 560, imagen: IMG("1544025162-d76694265947") },
  { semana: 1, dia: "Lunes", jornada: "Refrigerio", platillo: "Huevos pericos con arroz con zanahoria y puré de papa criolla", descripcion: "Huevos pericos acompañados de arroz con zanahoria, puré de papa criolla y sorbete de guayaba con banano.", calorias: 380, imagen: IMG("1525351484163-7529414344d8") },
  { semana: 1, dia: "Martes", jornada: "Almuerzo", platillo: "Fajitas de pechuga de pollo asado con lentejas guisadas y papa chorreada", descripcion: "Fajitas de pechuga de pollo asado, lentejas guisadas caseras, arroz blanco, papa chorreada en salsa criolla, ensalada de tomate, aguacate y lechuga con limón, y jugo de lulo en agua.", calorias: 580, imagen: IMG("1594998893017-36147cbcae05") },
  { semana: 1, dia: "Martes", jornada: "Refrigerio", platillo: "Fajitas de pollo salteado con espaguetis en salsa criolla y arroz", descripcion: "Fajitas de pollo salteado con verduras (cebolla y zanahoria), espaguetis en salsa criolla con queso, arroz blanco, piña picada y jugo de maracuyá en agua.", calorias: 420, imagen: IMG("1563379091339-03b21ab4a4f8") },
  { semana: 1, dia: "Miercoles", jornada: "Almuerzo", platillo: "Estofado de cerdo con papa, arroz con fideos y plátano maduro", descripcion: "Estofado tierno de carne de cerdo con papa, arroz con fideos dorados, tajada de plátano maduro asado, verduras orientales salteadas (repollo, zanahoria y pimentón), y sorbete de guanábana.", calorias: 570, imagen: IMG("1574484284002-952d92456975") },
  { semana: 1, dia: "Miercoles", jornada: "Refrigerio", platillo: "Huevos pericos con frijoles guisados y plátano maduro con queso", descripcion: "Huevos pericos, frijoles guisados con zapallo, arroz blanco, tajada de plátano maduro asado con queso doble crema, mandarina y jugo de lulo en agua.", calorias: 410, imagen: IMG("1589301760014-d929f3979dbc") },
  { semana: 1, dia: "Jueves", jornada: "Almuerzo", platillo: "Huevos pericos con arvejas guisadas, puré de papa y ensalada tropical", descripcion: "Huevos pericos tradicionales, arvejas guisadas, arroz blanco, puré suave de papa común, ensalada tropical (piña calada, repollo y zanahoria), y jugo de piña en agua.", calorias: 520, imagen: IMG("1541832676-9b763b0239ab") },
  { semana: 1, dia: "Jueves", jornada: "Refrigerio", platillo: "Carne de cerdo guisada con cilantro y arroz con verduras", descripcion: "Carne de cerdo guisada al cilantro, arroz blanco con habichuela y zanahoria, chips de papa común, mix de mango y papaya, y sorbete de fresa.", calorias: 430, imagen: IMG("1598515214211-89d3c73ae83b") },
  { semana: 1, dia: "Viernes", jornada: "Almuerzo", platillo: "Fajitas de pollo a la jardinera con arroz verde y plátano melado", descripcion: "Fajitas de pechuga de pollo a la jardinera con verduras entre la preparación, arroz verde al perejil, plátano melado tradicional y sorbete de mango.", calorias: 550, imagen: IMG("1604908176997-125f25cc6f3d") },
  { semana: 1, dia: "Viernes", jornada: "Refrigerio", platillo: "Lentejas guisadas con arroz blanco y papas a la francesa", descripcion: "Lentejas guisadas caseras, arroz blanco, papas a la francesa doradas, ensalada fresca de cebolla, tomate y cilantro, y sorbete de mango.", calorias: 390, imagen: IMG("1547592166-23ac45744acd") },

  // Semana 2
  { semana: 2, dia: "Lunes", jornada: "Almuerzo", platillo: "Chop suey de pechuga de pollo con arroz blanco y plátano maduro", descripcion: "Chop suey de pechuga de pollo salteado con repollo y zanahoria, arroz blanco suelto, tajada de plátano maduro asado y sorbete de guanábana.", calorias: 540, imagen: IMG("1512058564366-18510be2db19") },
  { semana: 2, dia: "Lunes", jornada: "Refrigerio", platillo: "Huevos revueltos con tomate, arroz blanco y plátano maduro", descripcion: "Huevos revueltos con tomate fresco, arroz blanco, tajada de plátano maduro asado, ensalada de lechuga, tomate y aguacate, y sorbete de mango.", calorias: 370, imagen: IMG("1525351484163-7529414344d8") },
  { semana: 2, dia: "Martes", jornada: "Almuerzo", platillo: "Huevos revueltos con lentejas guisadas y papa chorreada", descripcion: "Huevos revueltos suaves, lentejas guisadas caseras, arroz blanco, papa chorreada con salsa de queso y cebolla, ensalada de lechuga, tomate y pepino cohombro, y jugo de piña en agua.", calorias: 530, imagen: IMG("1547592166-23ac45744acd") },
  { semana: 2, dia: "Martes", jornada: "Refrigerio", platillo: "Fajitas de pollo asado con arroz primavera y puré de papa criolla", descripcion: "Fajitas de pollo asado jugoso, arroz primavera (zanahoria y arveja), puré suave de papa criolla, banano fresco y sorbete de guayaba.", calorias: 410, imagen: IMG("1532550907401-a500c9a57435") },
  { semana: 2, dia: "Miercoles", jornada: "Almuerzo", platillo: "Fajitas de cerdo con zapallo y arveja, arroz con fideos y puré criollo", descripcion: "Fajitas de carne de cerdo salteadas con zapallo y arveja, arroz con fideos dorados, puré cremoso de papa criolla y sorbete de fresa.", calorias: 550, imagen: IMG("1543339308-43e59d6b73a6") },
  { semana: 2, dia: "Miercoles", jornada: "Refrigerio", platillo: "Huevos pericos con papa criolla dorada al romero y ajo", descripcion: "Huevos pericos campesinos, arroz blanco, papa criolla dorada con romero y ajo, papaya picada fresca y sorbete de guanábana.", calorias: 360, imagen: IMG("1541832676-9b763b0239ab") },
  { semana: 2, dia: "Jueves", jornada: "Almuerzo", platillo: "Fajitas de carne de res asada con frijoles guisados y moneditas de plátano", descripcion: "Fajitas de carne de res asada a la plancha, frijoles guisados con zapallo, arroz blanco, moneditas de plátano crocantes, ensalada de tomate, aguacate y lechuga con limón, y jugo de guayaba en agua.", calorias: 590, imagen: IMG("1555939594-58d7cb561ad1") },
  { semana: 2, dia: "Jueves", jornada: "Refrigerio", platillo: "Sándwich de pollo apanado con queso y papas a la francesa", descripcion: "Sándwich de pollo apanado con queso derretido, lechuga y tomate en pan fresco, acompañado de papas a la francesa y jugo de maracuyá en agua.", calorias: 440, imagen: IMG("1625813506062-0aeb1d7a094b") },
  { semana: 2, dia: "Viernes", jornada: "Almuerzo", platillo: "Chuleta de cerdo con arroz verde y ensalada fría de papa", descripcion: "Deliciosa chuleta de cerdo dorada, arroz verde al perejil, ensalada fría de papa en cuadritos con zanahoria, arveja y habichuela en salsa blanca, y sorbete de mango.", calorias: 610, imagen: IMG("1432139555190-58524dae6a55") },
  { semana: 2, dia: "Viernes", jornada: "Refrigerio", platillo: "Frijoles guisados con zapallo y plátano maduro con queso doble crema", descripcion: "Frijoles guisados tradicionales con zapallo, arroz blanco, tajada de plátano maduro asado con queso doble crema, mandarina y agua de panela con limón.", calorias: 420, imagen: IMG("1589302168068-964664d93dc0") },

  // Semana 3
  { semana: 3, dia: "Lunes", jornada: "Almuerzo", platillo: "Trozos de cerdo salteados con arroz con cilantro y puré de plátano maduro", descripcion: "Trozos de carne de cerdo salteados con zanahoria y habichuela, arroz con cilantro, puré dulce de plátano maduro y sorbete de mango.", calorias: 560, imagen: IMG("1504674900247-0877df9cc836") },
  { semana: 3, dia: "Lunes", jornada: "Refrigerio", platillo: "Huevos revueltos con papa y arroz atomatado", descripcion: "Huevos revueltos con papa en cubitos, arroz atomatado sabroso, mango dulce picado y sorbete de guayaba y maracuyá.", calorias: 370, imagen: IMG("1525351484163-7529414344d8") },
  { semana: 3, dia: "Martes", jornada: "Almuerzo", platillo: "Fajitas de pollo en salsa criolla con blanquillos guisados y papa criolla", descripcion: "Fajitas de pollo en salsa criolla tradicional, blanquillos guisados caseros, arroz blanco, papa criolla dorada con romero y ajo, ensalada de tomate y lechuga con limón, y jugo de guayaba en agua.", calorias: 570, imagen: IMG("1543353071-873f17a7a088") },
  { semana: 3, dia: "Martes", jornada: "Refrigerio", platillo: "Pechuga de pollo salteada con arroz verde y papa chorreada", descripcion: "Pechuga de pollo salteada jugosa, arroz verde al perejil, papa chorreada con salsa criolla de queso, piña picada y sorbete de fresa.", calorias: 420, imagen: IMG("1594998893017-36147cbcae05") },
  { semana: 3, dia: "Miercoles", jornada: "Almuerzo", platillo: "Trozos de cerdo salteados con papa en salsa blanca y verduras", descripcion: "Trozos de carne de cerdo salteados, arroz con fideos dorados, papa en salsa blanca con cilantro y margarina, verduras salteadas (brócoli, cebolla y zanahoria), y sorbete de fresa.", calorias: 580, imagen: IMG("1598515214211-89d3c73ae83b") },
  { semana: 3, dia: "Miercoles", jornada: "Refrigerio", platillo: "Fajitas de carne de res con frijoles guisados y plátano maduro", descripcion: "Fajitas de carne de res asada, frijoles guisados con zapallo, arroz blanco, tajada de plátano maduro asado con queso doble crema y jugo de maracuyá en agua.", calorias: 450, imagen: IMG("1589301760014-d929f3979dbc") },
  { semana: 3, dia: "Jueves", jornada: "Almuerzo", platillo: "Huevos revueltos con arvejas guisadas y moneditas de plátano", descripcion: "Huevos revueltos suaves, arvejas guisadas con papa en cubitos, arroz blanco, moneditas de plátano crocantes, ensalada tropical (piña calada, repollo y zanahoria), y jugo de maracuyá en agua.", calorias: 530, imagen: IMG("1541832676-9b763b0239ab") },
  { semana: 3, dia: "Jueves", jornada: "Refrigerio", platillo: "Hamburguesa de carne de cerdo con queso y papas a la francesa", descripcion: "Hamburguesa de carne de cerdo con queso fundido, lechuga y tomate en pan tierno, acompañada de papas a la francesa y agua de panela con limón.", calorias: 460, imagen: IMG("1565299624946-b28f40a0ae38") },
  { semana: 3, dia: "Viernes", jornada: "Almuerzo", platillo: "Fajitas de pollo con espinaca y pimentón con puré de papa criolla", descripcion: "Fajitas de pechuga de pollo salteadas con espinaca, cebolla y pimentón, arroz blanco, puré suave de papa criolla y sorbete de guayaba.", calorias: 540, imagen: IMG("1604908176997-125f25cc6f3d") },
  { semana: 3, dia: "Viernes", jornada: "Refrigerio", platillo: "Lentejas guisadas con arroz blanco y moneditas de plátano", descripcion: "Lentejas guisadas caseras, arroz blanco, moneditas de plátano crocantes, ensalada de lechuga, zanahoria y mango, y sorbete de guayaba.", calorias: 390, imagen: IMG("1547592166-23ac45744acd") },

  // Semana 4
  { semana: 4, dia: "Lunes", jornada: "Almuerzo", platillo: "Fajitas de carne de cerdo asada con arroz verde y papa chorreada", descripcion: "Fajitas de carne de cerdo asada, arroz verde al perejil, papa chorreada en salsa criolla, ensalada tropical con piña calada, repollo y zanahoria, y sorbete de mango.", calorias: 570, imagen: IMG("1544025162-d76694265947") },
  { semana: 4, dia: "Lunes", jornada: "Refrigerio", platillo: "Huevos pericos con tortas de papa, brócoli y queso", descripcion: "Huevos pericos tradicionales, arroz blanco, tortas horneadas de papa con brócoli y queso fundido, manzana fresca y sorbete de banano.", calorias: 380, imagen: IMG("1546069901-ba9599a7e63c") },
  { semana: 4, dia: "Martes", jornada: "Almuerzo", platillo: "Huevos pericos con lentejas guisadas y papas a la francesa", descripcion: "Huevos pericos campesinos, lentejas guisadas caseras, arroz blanco, papas a la francesa doradas, ensalada de lechuga, tomate y cilantro, y jugo de piña en agua.", calorias: 540, imagen: IMG("1547592166-23ac45744acd") },
  { semana: 4, dia: "Martes", jornada: "Refrigerio", platillo: "Fajitas de pollo guisadas con habichuela y zanahoria", descripcion: "Fajitas de pechuga de pollo guisadas con habichuela y zanahoria en su jugo, arroz blanco, piña picada y sorbete de maracuyá-mango.", calorias: 390, imagen: IMG("1563379091339-03b21ab4a4f8") },
  { semana: 4, dia: "Miercoles", jornada: "Almuerzo", platillo: "Fajitas de carne de res asada con arroz primavera y puré de papa criolla", descripcion: "Fajitas de carne de res asada a la plancha, arroz primavera (zanahoria y arveja), puré cremoso de papa criolla, verduras entre el cereal acompañante, y sorbete de guayaba.", calorias: 560, imagen: IMG("1555939594-58d7cb561ad1") },
  { semana: 4, dia: "Miercoles", jornada: "Refrigerio", platillo: "Pechuga de pollo salteada con arroz con fideos", descripcion: "Pechuga de pollo salteada jugosa, arroz con fideos dorados, ensalada fresca de lechuga, zanahoria y mango, y sorbete de guanábana.", calorias: 410, imagen: IMG("1532550907401-a500c9a57435") },
  { semana: 4, dia: "Jueves", jornada: "Almuerzo", platillo: "Trozos de cerdo salteados con frijoles guisados y plátano maduro", descripcion: "Trozos de carne de cerdo salteados, frijoles guisados con zapallo, arroz blanco, tajada de plátano maduro asado, ensalada de tomate, aguacate y lechuga con limón, y jugo de tomate de árbol en agua.", calorias: 590, imagen: IMG("1589301760014-d929f3979dbc") },
  { semana: 4, dia: "Jueves", jornada: "Refrigerio", platillo: "Fajitas de cerdo con zapallo y arveja con papa criolla dorada", descripcion: "Fajitas de carne de cerdo salteadas con zapallo y arveja, arroz blanco, papa criolla dorada con queso fundido y jugo de piña en agua.", calorias: 430, imagen: IMG("1543339308-43e59d6b73a6") },
  { semana: 4, dia: "Viernes", jornada: "Almuerzo", platillo: "Pechuga de pollo desmechada en salsa blanca con espaguetis salteados", descripcion: "Pechuga de pollo desmechada en salsa blanca con hierbas, espaguetis salteados, arroz blanco, ensalada de lechuga, zanahoria y mango, y sorbete de fresa.", calorias: 580, imagen: IMG("1567620832903-9fc6debc209f") },
  { semana: 4, dia: "Viernes", jornada: "Refrigerio", platillo: "Espaguetis en salsa criolla con queso y ensalada de aguacate", descripcion: "Espaguetis en salsa criolla con queso rallado, arroz blanco, ensalada fresca de aguacate, lechuga, maíz tierno y manzana, y sorbete de guayaba.", calorias: 400, imagen: IMG("1621996346565-e3dbc646d9a9") },
];

(async () => {
  let ok = 0, err = 0;
  for (const p of platos) {
    try {
      const res = await fetch(MENUS_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: "Bearer " + token },
        body: JSON.stringify(p),
      });
      const datos = await res.json().catch(() => null);
      if (!res.ok) {
        console.log(`ERROR S${p.semana} ${p.dia} ${p.jornada}: ${datos?.error || res.status}`);
        err++;
      } else {
        console.log(`OK S${p.semana} ${p.dia} ${p.jornada} -> #${datos.id} ${p.platillo}`);
        ok++;
      }
    } catch (e) {
      console.log(`FALLO ${p.platillo}: ${e.message}`);
      err++;
    }
  }
  console.log(`\nTotal: ${ok} ok, ${err} errores`);
})().catch((e) => { console.error(e); process.exit(1); });