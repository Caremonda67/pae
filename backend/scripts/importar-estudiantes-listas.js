// Script para importar estudiantes de los listados oficiales 2026:
// - Noveno 2 (Jornada Tarde -> Turno Refrigerio, Grado 9-2)
// - Décimo 1 (Jornada Única -> Turno Almuerzo, Grado 10-1)
// - Décimo 2 (Jornada Única -> Turno Almuerzo, Grado 10-2)
// - Noveno 1 (Jornada Tarde -> Turno Refrigerio, Grado 9-1)
// Sede: Institución Educativa Ciudad Cordoba Sede Enrique Olaya Herrera

import { getSupabase } from "../src/config/supabase.js";
import { hashClave } from "../src/config/password.js";

const SEDE = "Institución Educativa Ciudad Cordoba Sede Enrique Olaya Herrera";

export const ESTUDIANTES_NUEVOS = [
  // ==========================================
  // GRUPO: NOVENO 2 (Jornada Tarde -> Refrigerio, Grado 9-2)
  // Director de Grupo: Gloria Esneda Gallego Torres
  // ==========================================
  { documento: "1112050773", nombre: "Aguirre Rada Juan Estevan", grado: "9-2", turno: "Refrigerio" },
  { documento: "1143955146", nombre: "Altamiranda Riascos Jaime Andres", grado: "9-2", turno: "Refrigerio" },
  { documento: "1234202281", nombre: "Aragon Cufi Maikel", grado: "9-2", turno: "Refrigerio" },
  { documento: "1061210854", nombre: "Caicedo Valenzuela Leidy Tatiana", grado: "9-2", turno: "Refrigerio" },
  { documento: "1111554111", nombre: "Castillo Cufi Angelly Vanessa", grado: "9-2", turno: "Refrigerio" },
  { documento: "1066842693", nombre: "Garcia Saa Beyda Melisa", grado: "9-2", turno: "Refrigerio" },
  { documento: "1150940931", nombre: "Garcia Sinisterra Karen Michel", grado: "9-2", turno: "Refrigerio" },
  { documento: "1012409601", nombre: "Gonzalez Morales Carlos Andres", grado: "9-2", turno: "Refrigerio" },
  { documento: "1110299258", nombre: "Grisales Granada Luis Alfonso", grado: "9-2", turno: "Refrigerio" },
  { documento: "1085550594", nombre: "Grueso Hurtado Jhon Jadinson", grado: "9-2", turno: "Refrigerio" },
  { documento: "1071789700", nombre: "Gutierrez Castaño Jenssy Miley", grado: "9-2", turno: "Refrigerio" },
  { documento: "1111551924", nombre: "Hernandez Cerquera Danna Valentina", grado: "9-2", turno: "Refrigerio" },
  { documento: "1109924896", nombre: "Hernandez Pulgarin Caridahiana", grado: "9-2", turno: "Refrigerio" },
  { documento: "1087197961", nombre: "Landazury Cortes Hanny Jazmin", grado: "9-2", turno: "Refrigerio" },
  { documento: "1111553126", nombre: "Leon Quiñoes Michell Andrea", grado: "9-2", turno: "Refrigerio" },
  { documento: "1143963978", nombre: "Lopez Mondragon Kimberlyn", grado: "9-2", turno: "Refrigerio" },
  { documento: "1111685352", nombre: "Marin Gonzalez Maria Valentina", grado: "9-2", turno: "Refrigerio" },
  { documento: "5364829", nombre: "Martinez Amundarayn Maximo Ony", grado: "9-2", turno: "Refrigerio" },
  { documento: "5066739", nombre: "Matos Matos Frenyelis Elimar", grado: "9-2", turno: "Refrigerio" },
  { documento: "1111791795", nombre: "Mina Rodriguez Shadainy", grado: "9-2", turno: "Refrigerio" },
  { documento: "1111685247", nombre: "Moncayo Valencia Sara Sofia", grado: "9-2", turno: "Refrigerio" },
  { documento: "1087818182", nombre: "Monsalve Belalcazar Kelly Alexandra", grado: "9-2", turno: "Refrigerio" },
  { documento: "1191216062", nombre: "Montaño Puerto Carrero Joel", grado: "9-2", turno: "Refrigerio" },
  { documento: "1111685311", nombre: "Moreno Hinestroza Juan Pablo", grado: "9-2", turno: "Refrigerio" },
  { documento: "1089907166", nombre: "Muñoz Araujo Darwin Emilio", grado: "9-2", turno: "Refrigerio" },
  { documento: "1089801749", nombre: "Obando Salcedo Michael Stiwar", grado: "9-2", turno: "Refrigerio" },
  { documento: "1150944489", nombre: "Ortega Hurtado Dayan Camila", grado: "9-2", turno: "Refrigerio" },
  { documento: "1111552079", nombre: "Peña Quintero Danna Michel", grado: "9-2", turno: "Refrigerio" },
  { documento: "1150944418", nombre: "Perlaza Garcia Jeyner David", grado: "9-2", turno: "Refrigerio" },
  { documento: "1028821363", nombre: "Quiñones Angulo Arianne Angelik", grado: "9-2", turno: "Refrigerio" },
  { documento: "1148687402", nombre: "Quiñones Sinisterra Erbis Jadier", grado: "9-2", turno: "Refrigerio" },
  { documento: "1150942747", nombre: "Riascos Garcia Maria Ysabell", grado: "9-2", turno: "Refrigerio" },
  { documento: "1196213027", nombre: "Ruiz Hurtado Mary Joely", grado: "9-2", turno: "Refrigerio" },
  { documento: "1105375524", nombre: "Tellez Pretel Lizeth Dayana", grado: "9-2", turno: "Refrigerio" },
  { documento: "1111679876", nombre: "Uribe Silva Melany", grado: "9-2", turno: "Refrigerio" },
  { documento: "1106519577", nombre: "Valencia Camayo Jose Luis", grado: "9-2", turno: "Refrigerio" },
  { documento: "1111789049", nombre: "Viveros Castillo Jhaira Nikol", grado: "9-2", turno: "Refrigerio" },
  { documento: "1085550054", nombre: "Yesquen Gamboa Mafer Yulisa", grado: "9-2", turno: "Refrigerio" },

  // ==========================================
  // GRUPO: DÉCIMO 1 (Jornada Única -> Almuerzo, Grado 10-1)
  // Director de Grupo: Alba Marina Chicunque Angrino
  // ==========================================
  { documento: "1060126553", nombre: "Acosta Perez Cristian David", grado: "10-1", turno: "Almuerzo" },
  { documento: "1108647008", nombre: "Agudelo Angulo Juan Sebastian", grado: "10-1", turno: "Almuerzo" },
  { documento: "1139835446", nombre: "Angulo Tenorio Dana Carolina", grado: "10-1", turno: "Almuerzo" },
  { documento: "1190463232", nombre: "Arboleda Ortiz Luna Brichel", grado: "10-1", turno: "Almuerzo" },
  { documento: "1076822009", nombre: "Asprilla Mosquera Heidy Lorena", grado: "10-1", turno: "Almuerzo" },
  { documento: "1191215696", nombre: "Castillo Toloza Keyner Felipe", grado: "10-1", turno: "Almuerzo" },
  { documento: "1107860357", nombre: "Ceballos Talaga Maria Fernanda", grado: "10-1", turno: "Almuerzo" },
  { documento: "1123327335", nombre: "Cordoba Quiñones Jerson Felipe", grado: "10-1", turno: "Almuerzo" },
  { documento: "1111554908", nombre: "Cortez Ruiz Nicol Katherine", grado: "10-1", turno: "Almuerzo" },
  { documento: "1081058451", nombre: "Diaz Getial Juan Carlos", grado: "10-1", turno: "Almuerzo" },
  { documento: "1111549519", nombre: "Escobar Agudelo Jean Sebastian", grado: "10-1", turno: "Almuerzo" },
  { documento: "1150938664", nombre: "Hinestroza Cuero Miller", grado: "10-1", turno: "Almuerzo" },
  { documento: "1111680805", nombre: "Hurtado Angulo Monica Alejandra", grado: "10-1", turno: "Almuerzo" },
  { documento: "1114245037", nombre: "Hurtado Herrera Karol Jiney", grado: "10-1", turno: "Almuerzo" },
  { documento: "1196713143", nombre: "Mantilla Gamboa Marlon Yazeth", grado: "10-1", turno: "Almuerzo" },
  { documento: "1104807453", nombre: "Marquez Silva Yeferson", grado: "10-1", turno: "Almuerzo" },
  { documento: "1061209523", nombre: "Montaño Segura Juan Camilo", grado: "10-1", turno: "Almuerzo" },
  { documento: "1111780053", nombre: "Palacios Amu Iris Marisol", grado: "10-1", turno: "Almuerzo" },
  { documento: "1111781324", nombre: "Perea Castro Ana Michel", grado: "10-1", turno: "Almuerzo" },
  { documento: "1108337486", nombre: "Pino Payan Nicole Dayan", grado: "10-1", turno: "Almuerzo" },
  { documento: "N38184611884", nombre: "Piñero Canache Maria Jose", grado: "10-1", turno: "Almuerzo" },
  { documento: "1087824208", nombre: "Pulla Sinisterra Loren Michel", grado: "10-1", turno: "Almuerzo" },
  { documento: "1110298768", nombre: "Tellez Gomez Juan Jose", grado: "10-1", turno: "Almuerzo" },
  { documento: "1105373250", nombre: "Toloza Preciado Yeiso", grado: "10-1", turno: "Almuerzo" },
  { documento: "1111547104", nombre: "Toro Botina Brayan Andres", grado: "10-1", turno: "Almuerzo" },
  { documento: "1148690829", nombre: "Tovar Tovar Charol Liset", grado: "10-1", turno: "Almuerzo" },
  { documento: "1106518145", nombre: "Valencia Camayo Brenda Isabella", grado: "10-1", turno: "Almuerzo" },
  { documento: "1111550722", nombre: "Valencia Reza Jhon Arley", grado: "10-1", turno: "Almuerzo" },
  { documento: "1111678421", nombre: "Vasquez Valdes Lady Yuliana", grado: "10-1", turno: "Almuerzo" },
  { documento: "1087815763", nombre: "Viveros Mosquera Leidy Alejandra", grado: "10-1", turno: "Almuerzo" },
  { documento: "1082949417", nombre: "Yepes Cuadro Danna Elisa", grado: "10-1", turno: "Almuerzo" },

  // ==========================================
  // GRUPO: DÉCIMO 2 (Jornada Única -> Almuerzo, Grado 10-2)
  // Director de Grupo: Viviana Esperanza Murillo Tovar
  // ==========================================
  { documento: "1120361021", nombre: "Aguirre Mina Wilder Orlando", grado: "10-2", turno: "Almuerzo" },
  { documento: "1109923273", nombre: "Angulo Mora Dana Isabella", grado: "10-2", turno: "Almuerzo" },
  { documento: "1111681604", nombre: "Banguera Naranjo Jhoniel David", grado: "10-2", turno: "Almuerzo" },
  { documento: "1111788876", nombre: "Betancour Ibarguen Jesus David", grado: "10-2", turno: "Almuerzo" },
  { documento: "1111682281", nombre: "Carabali Pisso Eilyn Sofia", grado: "10-2", turno: "Almuerzo" },
  { documento: "1111483412", nombre: "Carlosama Londoño Mariana", grado: "10-2", turno: "Almuerzo" },
  { documento: "1111550725", nombre: "Castillo Araujo Breiner Esti", grado: "10-2", turno: "Almuerzo" },
  { documento: "1061211158", nombre: "Castillo Orobio Danna Michell", grado: "10-2", turno: "Almuerzo" },
  { documento: "1087186112", nombre: "Cifuentes Garces Eimy Liseth", grado: "10-2", turno: "Almuerzo" },
  { documento: "1089003434", nombre: "Cortes Huila Sharel Lorena", grado: "10-2", turno: "Almuerzo" },
  { documento: "1111550541", nombre: "Cortes Torres Valery Sofia", grado: "10-2", turno: "Almuerzo" },
  { documento: "1026284689", nombre: "Duque Escobar Ashly Nicole", grado: "10-2", turno: "Almuerzo" },
  { documento: "1086196317", nombre: "Estupiñan Estupiñan Deisy Lorenny", grado: "10-2", turno: "Almuerzo" },
  { documento: "1108646016", nombre: "Gil Chanis Jean Piert", grado: "10-2", turno: "Almuerzo" },
  { documento: "1111548045", nombre: "Gomez Vallecilla Melani", grado: "10-2", turno: "Almuerzo" },
  { documento: "1113368047", nombre: "Gonzalez Salcedo Sheyla Yaleza", grado: "10-2", turno: "Almuerzo" },
  { documento: "1117352665", nombre: "Hernandez Pulgarin Maria Isabella", grado: "10-2", turno: "Almuerzo" },
  { documento: "1111548960", nombre: "Jaramillo Varela Dilan Adrian", grado: "10-2", turno: "Almuerzo" },
  { documento: "1107865103", nombre: "Jimenez Rubio Juan Pablo", grado: "10-2", turno: "Almuerzo" },
  { documento: "1087812654", nombre: "Landazury Quiñonez Jose Stiward", grado: "10-2", turno: "Almuerzo" },
  { documento: "1191216136", nombre: "Lucumi Perea Sarith Nicole", grado: "10-2", turno: "Almuerzo" },
  { documento: "6695601", nombre: "Marcano Lopez Ysabella Valentina", grado: "10-2", turno: "Almuerzo" },
  { documento: "1087810209", nombre: "Marquinez Rivera Laura Sofia", grado: "10-2", turno: "Almuerzo" },
  { documento: "1147953007", nombre: "Montaño Hurtado Maira Soney", grado: "10-2", turno: "Almuerzo" },
  { documento: "1111789726", nombre: "Montaño Murillo Madison Daniela", grado: "10-2", turno: "Almuerzo" },
  { documento: "1111551754", nombre: "Narvaez Ramirez Maria Jose", grado: "10-2", turno: "Almuerzo" },
  { documento: "1111681502", nombre: "Perez Guzman Darlin Eliana", grado: "10-2", turno: "Almuerzo" },
  { documento: "1111683872", nombre: "Quiñones Ramirez Gisell", grado: "10-2", turno: "Almuerzo" },
  { documento: "1108337669", nombre: "Reyes Suarez Sergio Jose", grado: "10-2", turno: "Almuerzo" },
  { documento: "1151445367", nombre: "Riascos Ortiz Sharon Valentina", grado: "10-2", turno: "Almuerzo" },
  { documento: "1107863846", nombre: "Sanchez Zapata Miguel Angel", grado: "10-2", turno: "Almuerzo" },
  { documento: "1107858460", nombre: "Timaran Agudelo Carmen Andrea", grado: "10-2", turno: "Almuerzo" },
  { documento: "1149444341", nombre: "Torres Murillo Denis Yamir", grado: "10-2", turno: "Almuerzo" },
  { documento: "1089512932", nombre: "Urrutia Mosquera Brenda Elizabeth", grado: "10-2", turno: "Almuerzo" },
  { documento: "1144110493", nombre: "Valencia Guerrero Jhonaider Jose", grado: "10-2", turno: "Almuerzo" },
  { documento: "1061211714", nombre: "Vasquez Perlaza Ashly Valeria", grado: "10-2", turno: "Almuerzo" },

  // ==========================================
  // GRUPO: NOVENO 1 (Jornada Tarde -> Refrigerio, Grado 9-1)
  // Director de Grupo: Carmen Aydee Gonzalez Ortega
  // ==========================================
  { documento: "1111801171", nombre: "Angulo Mondragon Deilin Yoleicy", grado: "9-1", turno: "Refrigerio" },
  { documento: "1122130862", nombre: "Angulo Rodriguez Melani Sofia", grado: "9-1", turno: "Refrigerio" },
  { documento: "1139854021", nombre: "Arcos Ortiz Linda Saray", grado: "9-1", turno: "Refrigerio" },
  { documento: "1087817653", nombre: "Arroyo Guerrero Anabel", grado: "9-1", turno: "Refrigerio" },
  { documento: "1061763496", nombre: "Astaiza Gutierrez Angel Stiven", grado: "9-1", turno: "Refrigerio" },
  { documento: "7605817", nombre: "Bustos Cortes Johanan Gadiel", grado: "9-1", turno: "Refrigerio" },
  { documento: "1109193276", nombre: "Caicedo Mariana Andrea", grado: "9-1", turno: "Refrigerio" },
  { documento: "1113367579", nombre: "Caicedo Rodriguez Deiner", grado: "9-1", turno: "Refrigerio" },
  { documento: "1061210162", nombre: "Caicedo Valenzuela Heidy Lorena", grado: "9-1", turno: "Refrigerio" },
  { documento: "1107859444", nombre: "Canizales Vivas Luis Stevan", grado: "9-1", turno: "Refrigerio" },
  { documento: "1111553392", nombre: "Castillo Araujo Sara Mayerli", grado: "9-1", turno: "Refrigerio" },
  { documento: "1107078918", nombre: "Castillo Puerto Carrero Darwin Stiven", grado: "9-1", turno: "Refrigerio" },
  { documento: "6313640", nombre: "Castillo Vilera Jeffreys Isaias", grado: "9-1", turno: "Refrigerio" },
  { documento: "1139835115", nombre: "Ceballos Silva Valeryn Dayana", grado: "9-1", turno: "Refrigerio" },
  { documento: "1089544696", nombre: "Chiriboga Bolaños Helen Dayana", grado: "9-1", turno: "Refrigerio" },
  { documento: "1089003744", nombre: "Cortes Huila Valery", grado: "9-1", turno: "Refrigerio" },
  { documento: "1234193549", nombre: "Cortes Rosales Sthefany De Los Angeles", grado: "9-1", turno: "Refrigerio" },
  { documento: "1111683913", nombre: "Dominguez Ceballos Darlin Liceth", grado: "9-1", turno: "Refrigerio" },
  { documento: "1206216307", nombre: "Duque Escobar Cristopher Matias", grado: "9-1", turno: "Refrigerio" },
  { documento: "1106519827", nombre: "Duque Quintero Yasni Beyonse", grado: "9-1", turno: "Refrigerio" },
  { documento: "6764173", nombre: "Frido Barreto Victor Gabriel", grado: "9-1", turno: "Refrigerio" },
  { documento: "1111548412", nombre: "Guanga Herrera Nicol Dayana", grado: "9-1", turno: "Refrigerio" },
  { documento: "1111552221", nombre: "Hernandez Martinez Gabriela", grado: "9-1", turno: "Refrigerio" },
  { documento: "1107068153", nombre: "Leon Angulo Kevin Yovani", grado: "9-1", turno: "Refrigerio" },
  { documento: "1111554508", nombre: "Lucumi Riascos Janier Stiven", grado: "9-1", turno: "Refrigerio" },
  { documento: "1062301387", nombre: "Marquez Silva Treicy Marlobi", grado: "9-1", turno: "Refrigerio" },
  { documento: "1085550877", nombre: "Micolta Mancilla Ruth Estela", grado: "9-1", turno: "Refrigerio" },
  { documento: "1191216061", nombre: "Montaño Puerto Carrero Jerson", grado: "9-1", turno: "Refrigerio" },
  { documento: "1111552763", nombre: "Montealegre Cuero Merlin Dayan", grado: "9-1", turno: "Refrigerio" },
  { documento: "1110297461", nombre: "Mora Moreno Naire Yelary", grado: "9-1", turno: "Refrigerio" },
  { documento: "1085550869", nombre: "Olaya Chalare William Andres", grado: "9-1", turno: "Refrigerio" },
  { documento: "1061206042", nombre: "Orobio Mancilla Rober Stiven", grado: "9-1", turno: "Refrigerio" },
  { documento: "1111552776", nombre: "Ospina Valencia Maria Camila", grado: "9-1", turno: "Refrigerio" },
  { documento: "1086051993", nombre: "Perlaza Franco Marlon Alexis", grado: "9-1", turno: "Refrigerio" },
  { documento: "1148949833", nombre: "Quiñones Gonzalez Elias", grado: "9-1", turno: "Refrigerio" },
  { documento: "1087812704", nombre: "Quiñones Quiñones Michell Mariana", grado: "9-1", turno: "Refrigerio" },
  { documento: "1111681563", nombre: "Rodriguez Angulo Rosana", grado: "9-1", turno: "Refrigerio" },
  { documento: "1086051940", nombre: "Salas Cuero Maria Yorely", grado: "9-1", turno: "Refrigerio" },
  { documento: "1109548401", nombre: "Toro Botina Brandon Stiven", grado: "9-1", turno: "Refrigerio" },
  { documento: "1111678988", nombre: "Valencia Paz Maria Alejandra", grado: "9-1", turno: "Refrigerio" },
  { documento: "1087704087", nombre: "Velasco Salcedo Yuliana", grado: "9-1", turno: "Refrigerio" },
  { documento: "1111680342", nombre: "Viveros Quiñones Yojan Alveiro", grado: "9-1", turno: "Refrigerio" },
];

async function importar() {
  console.log(`Iniciando importación de ${ESTUDIANTES_NUEVOS.length} estudiantes...`);
  const sb = getSupabase();

  // 1. Preparar datos para 'beneficiarios'
  const listaBeneficiarios = ESTUDIANTES_NUEVOS.map((e) => ({
    documento: e.documento.trim(),
    nombre: e.nombre.trim(),
    sede: SEDE,
    turno: e.turno,
    grado: e.grado,
  }));

  // 2. Preparar datos para 'usuarios' (PIN por defecto: 1234)
  const pinHash = hashClave("1234");
  const listaUsuarios = ESTUDIANTES_NUEVOS.map((e) => ({
    nombre: e.nombre.trim(),
    usuario: e.documento.trim(),
    clave_hash: pinHash,
    rol: "estudiante",
    activo: true,
  }));

  // 3. Upsert en lotes para beneficiarios
  let benGuardados = 0;
  for (let i = 0; i < listaBeneficiarios.length; i += 25) {
    const lote = listaBeneficiarios.slice(i, i + 25);
    const { data, error } = await sb
      .from("beneficiarios")
      .upsert(lote, { onConflict: "documento" })
      .select("id, documento");

    if (error) {
      throw new Error(`Error en lote beneficiarios (${i}): ${error.message}`);
    }
    benGuardados += data.length;
    console.log(`  Beneficiarios: lote ${Math.floor(i / 25) + 1} guardado (${data.length} registros).`);
  }

  // 4. Upsert en lotes para usuarios
  let usuGuardados = 0;
  for (let i = 0; i < listaUsuarios.length; i += 25) {
    const lote = listaUsuarios.slice(i, i + 25);
    const { data, error } = await sb
      .from("usuarios")
      .upsert(lote, { onConflict: "usuario" })
      .select("id, usuario");

    if (error) {
      throw new Error(`Error en lote usuarios (${i}): ${error.message}`);
    }
    usuGuardados += data.length;
    console.log(`  Usuarios: lote ${Math.floor(i / 25) + 1} guardado (${data.length} registros).`);
  }

  // 5. Verificación final de conteos
  const { count: totalBen } = await sb.from("beneficiarios").select("*", { count: "exact", head: true });
  const { count: totalUsu } = await sb.from("usuarios").select("*", { count: "exact", head: true });

  console.log(`\n🎉 Importación finalizada con éxito:`);
  console.log(`- Estudiantes procesados en esta tanda: ${ESTUDIANTES_NUEVOS.length}`);
  console.log(`- Total beneficiarios en base de datos: ${totalBen}`);
  console.log(`- Total usuarios en base de datos: ${totalUsu}`);
}

importar().catch((err) => {
  console.error("❌ Error en importación:", err);
  process.exit(1);
});
