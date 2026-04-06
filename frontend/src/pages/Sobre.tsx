// ============================================================
// Pagina "Sobre el PAE"
// Explica que es el programa y como funciona la reserva de comida.
// ============================================================

function Sobre() {
  return (
    <section className="pagina-simple">
      <h1>Sobre el PAE</h1>
      <p className="subtitulo">
        ¿Qué es el Programa de Alimentación Escolar y cómo funciona?
      </p>

      <div className="tarjetas-info">
        <article className="tarjeta-info">
          <h3>¿Qué es?</h3>
          <p>
            El PAE es un programa que garantiza alimentación saludable a los
            estudiantes durante la jornada escolar, mejorando su bienestar,
            concentración y rendimiento académico.
          </p>
        </article>

        <article className="tarjeta-info">
          <h3>¿Cómo funciona?</h3>
          <p>
            Cada estudiante puede confirmar que recibirá su minuta mediante la
            opción "Reservar comida". Con esas reservas, la cocina prepara
            exactamente la cantidad necesaria y se reduce el desperdicio.
          </p>
        </article>

        <article className="tarjeta-info">
          <h3>Nuestro compromiso</h3>
          <p>
            Alimentación sana, justa y sin desperdicio. Cada minuta preparada
            corresponde a un estudiante que confirmó que la recibirá.
          </p>
        </article>
      </div>
    </section>
  );
}

export default Sobre;
