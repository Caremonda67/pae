// Barra de busqueda reutilizable para el panel de administrador.
// Filtra las listas por texto: al escribir, se resaltan solo los
// elementos que coinciden con el termino (numero de documento,
// nombre, comida, etc).

interface BuscadorProps {
  valor: string;
  alCambiar: (valor: string) => void;
  placeholder?: string;
}

function Buscador({ valor, alCambiar, placeholder = "Buscar…" }: BuscadorProps) {
  return (
    <div className="buscador-admin">
      <span className="buscador-admin-icono" aria-hidden="true">
        🔍
      </span>
      <input
        type="text"
        value={valor}
        onChange={(e) => alCambiar(e.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
      />
      {valor && (
        <button
          type="button"
          className="buscador-admin-limpiar"
          onClick={() => alCambiar("")}
          aria-label="Limpiar búsqueda"
        >
          ✕
        </button>
      )}
    </div>
  );
}

export default Buscador;
