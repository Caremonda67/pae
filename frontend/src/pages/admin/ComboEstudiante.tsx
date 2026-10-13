import { useState, useEffect } from "react";

// Combo para elegir un estudiante del grupo: se escribe y filtra la lista
// al instante, sin tener que recorrer el select de opciones largas.
interface ComboEstudianteProps {
  estudiantes: { documento: string; nombre: string; grado?: string }[];
  value: string;
  onChange: (doc: string) => void;
  placeholder?: string;
}

export default function ComboEstudiante({
  estudiantes,
  value,
  onChange,
  placeholder = "Escribe el nombre del estudiante…",
}: ComboEstudianteProps) {
  const [texto, setTexto] = useState("");
  const [abierto, setAbierto] = useState(false);

  const seleccionado = estudiantes.find((e) => e.documento === value);
  useEffect(() => {
    if (seleccionado) setTexto(seleccionado.nombre);
    else if (value === "") setTexto("");
  }, [seleccionado, value]);

  const filtrados = estudiantes.filter(
    (e) =>
      !texto.trim() ||
      e.nombre.toLowerCase().includes(texto.trim().toLowerCase()) ||
      e.documento.includes(texto.trim())
  );

  return (
    <div className="combo-estudiante">
      <input
        type="text"
        value={texto}
        placeholder={placeholder}
        onChange={(e) => {
          setTexto(e.target.value);
          setAbierto(true);
          if (value) onChange("");
        }}
        onFocus={() => setAbierto(true)}
        onBlur={() => setTimeout(() => setAbierto(false), 150)}
        aria-label="Escribe para filtrar estudiantes"
        autoComplete="off"
      />
      {abierto && (
        <ul className="combo-lista" role="listbox">
          {filtrados.length === 0 ? (
            <li className="combo-vacio">No se encontraron estudiantes</li>
          ) : (
            filtrados.map((e) => (
              <li key={e.documento}>
                <button
                  type="button"
                  role="option"
                  aria-selected={e.documento === value}
                  className={e.documento === value ? "combo-seleccionado" : undefined}
                  onMouseDown={(ev) => {
                    ev.preventDefault();
                    onChange(e.documento);
                    setTexto(e.nombre);
                    setAbierto(false);
                  }}
                >
                  <span>
                    {e.nombre}
                    {e.grado ? ` · Grado ${e.grado}` : ""}
                  </span>
                  <small>Doc {e.documento}</small>
                </button>
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}
