import { describe, expect, it } from "vitest";
import { validarFecha } from "../config/fechas";

// Fecha YYYY-MM-DD del dia de la semana buscado, desde hoy.
// 0 = domingo, 6 = sabado. Devuelve la proxima ocurrencia futura.
function proximoDia(diaSemana: number): string {
  const ahora = new Date();
  const hoy = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate());
  let diferencia = (diaSemana - hoy.getDay() + 7) % 7;
  if (diferencia === 0) diferencia = 7;
  const f = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate() + diferencia);
  return `${f.getFullYear()}-${String(f.getMonth() + 1).padStart(2, "0")}-${String(f.getDate()).padStart(2, "0")}`;
}

describe("validarFecha", () => {
  it("rechaza los fines de semana", () => {
    expect(validarFecha(proximoDia(6))).toMatch(/sábados y domingos/i);
    expect(validarFecha(proximoDia(0))).toMatch(/sábados y domingos/i);
  });

  it("acepta un dia habil dentro del rango", () => {
    expect(validarFecha(proximoDia(1))).toBeNull();
  });

  it("sigue rechazando fechas del pasado", () => {
    expect(validarFecha("2000-01-03")).toMatch(/anterior a hoy/i);
  });
});
