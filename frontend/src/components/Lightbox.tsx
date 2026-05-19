// Lightbox: muestra una imagen en grande sobre un fondo oscuro.
// Se usa en la galeria (pagina y Home) para ver las fotos completas.
// Cierra con el boton, la tecla Escape o tocando el fondo.

import { useEffect, useRef } from "react";

interface LightboxProps {
  imagen: string;
  titulo: string;
  descripcion?: string;
  alCerrar: () => void;
}

function Lightbox({ imagen, titulo, descripcion, alCerrar }: LightboxProps) {
  const botonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    // Guardamos el elemento que tenia el foco para devolverselo
    // cuando se cierre el lightbox (accesibilidad con teclado).
    const previo = document.activeElement as HTMLElement | null;

    // Movemos el foco al boton de cerrar al abrir
    botonRef.current?.focus();

    const alPulsarTecla = (e: KeyboardEvent) => {
      if (e.key === "Escape") alCerrar();
    };
    window.addEventListener("keydown", alPulsarTecla);
    return () => {
      window.removeEventListener("keydown", alPulsarTecla);
      previo?.focus?.();
    };
  }, [alCerrar]);

  return (
    <div
      className="lightbox"
      role="dialog"
      aria-modal="true"
      aria-label={`Foto: ${titulo}`}
      onClick={alCerrar}
    >
      <button
        ref={botonRef}
        type="button"
        className="lightbox-cerrar"
        onClick={alCerrar}
        aria-label="Cerrar imagen"
      >
        ✕
      </button>
      <figure className="lightbox-contenido" onClick={(e) => e.stopPropagation()}>
        <img src={imagen} alt={titulo} />
        <figcaption>
          <span className="galeria-titulo">{titulo}</span>
          {descripcion && (
            <span className="galeria-descripcion">{descripcion}</span>
          )}
        </figcaption>
      </figure>
    </div>
  );
}

export default Lightbox;
