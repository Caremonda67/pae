// Filtro de fechas para reportes: permite ver los datos de todo el
// historial, de la semana actual, del mes actual o de un rango
// personalizado (desde / hasta). Se usa tanto en el panel del admin
// como en la pagina publica de reportes.

import { useState } from "react";

interface Props {
  desde: string;
  hasta: string;
  onCambio: (desde: string, hasta: string) => void;
}

// Formatea un Date como YYYY-MM-DD en hora local del navegador
function formatear(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

// Lunes a domingo de la semana actual
function rangoSemana(): { desde: string; hasta: string } {
  const ahora = new Date();
  const diaSemana = (ahora.getDay() + 6) % 7; // lunes = 0
  const lunes = new Date(ahora);
  lunes.setDate(ahora.getDate() - diaSemana);
  const domingo = new Date(lunes);
  domingo.setDate(lunes.getDate() + 6);
  return { desde: formatear(lunes), hasta: formatear(domingo) };
}

// Primer y ultimo dia del mes actual
function rangoMes(): { desde: string; hasta: string } {
  const ahora = new Date();
  const primero = new Date(ahora.getFullYear(), ahora.getMonth(), 1);
  const ultimo = new Date(ahora.getFullYear(), ahora.getMonth() + 1, 0);
  return { desde: formatear(primero), hasta: formatear(ultimo) };
}

function FiltroReportes({ desde, hasta, onCambio }: Props) {
  const [desdeLocal, setDesdeLocal] = useState(desde);
  const [hastaLocal, setHastaLocal] = useState(hasta);

  const aplicarPreset = (tipo: "todo" | "semana" | "mes") => {
    if (tipo === "todo") {
      setDesdeLocal("");
      setHastaLocal("");
      onCambio("", "");
      return;
    }
    const rango = tipo === "semana" ? rangoSemana() : rangoMes();
    setDesdeLocal(rango.desde);
    setHastaLocal(rango.hasta);
    onCambio(rango.desde, rango.hasta);
  };

  const cambiarRango = (tipo: "desde" | "hasta", valor: string) => {
    if (tipo === "desde") setDesdeLocal(valor);
    else setHastaLocal(valor);
    const nuevoDesde = tipo === "desde" ? valor : desdeLocal;
    const nuevoHasta = tipo === "hasta" ? valor : hastaLocal;
    onCambio(nuevoDesde, nuevoHasta);
  };

  return (
    <div className="filtro-fechas">
      <span className="filtro-fechas-etiqueta">Ver:</span>
      <div className="filtro-fechas-botones" role="group" aria-label="Filtrar por periodo">
        <button
          type="button"
          className={`boton boton-secundario ${!desde && !hasta ? "activo" : ""}`}
          onClick={() => aplicarPreset("todo")}
          aria-pressed={!desde && !hasta}
        >
          Todo
        </button>
        <button
          type="button"
          className={`boton boton-secundario ${desde === rangoSemana().desde && hasta === rangoSemana().hasta ? "activo" : ""}`}
          onClick={() => aplicarPreset("semana")}
        >
          Esta semana
        </button>
        <button
          type="button"
          className={`boton boton-secundario ${desde === rangoMes().desde && hasta === rangoMes().hasta ? "activo" : ""}`}
          onClick={() => aplicarPreset("mes")}
        >
          Este mes
        </button>
      </div>
      <div className="filtro-fechas-rango">
        <label htmlFor="filtro-desde">
          Desde
          <input
            id="filtro-desde"
            type="date"
            value={desdeLocal}
            onChange={(e) => cambiarRango("desde", e.target.value)}
          />
        </label>
        <label htmlFor="filtro-hasta">
          Hasta
          <input
            id="filtro-hasta"
            type="date"
            value={hastaLocal}
            onChange={(e) => cambiarRango("hasta", e.target.value)}
          />
        </label>
      </div>
    </div>
  );
}

export default FiltroReportes;
