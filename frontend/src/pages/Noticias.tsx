// ============================================================
// Pagina "Noticias"
// Muestra los avisos y novedades del programa.
// ============================================================

const NOTICIAS = [
  {
    fecha: "06 de junio",
    titulo: "Suspensión del servicio",
    texto:
      "Viernes 6 de junio no habrá servicio por jornada pedagógica. Las minutas se reprogramarán para la siguiente semana.",
  },
  {
    fecha: "12 de junio",
    titulo: "Reunión informativa",
    texto:
      "Jueves 12 de junio a las 8:00 a.m. en el auditorio de la Institución. Asistencia de representantes de grado.",
  },
  {
    fecha: "Permanente",
    titulo: "Actualización de datos",
    texto:
      "Recuerda mantener actualizada la información de los estudiantes para garantizar el acceso al programa.",
  },
  {
    fecha: "Novedad",
    titulo: "Reserva de minutas ahora en línea",
    texto:
      "Ya puedes reservar tu comida desde la aplicación para que la cocina prepare la cantidad exacta y evitemos el desperdicio.",
  },
];

function Noticias() {
  return (
    <section className="pagina-simple">
      <h1>Noticias y avisos</h1>
      <p className="subtitulo">
        Novedades y comunicados importantes del programa.
      </p>

      <div className="lista-noticias">
        {NOTICIAS.map((noticia) => (
          <article key={noticia.titulo} className="tarjeta-noticia">
            <span className="noticia-fecha">{noticia.fecha}</span>
            <h3>{noticia.titulo}</h3>
            <p>{noticia.texto}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

export default Noticias;
