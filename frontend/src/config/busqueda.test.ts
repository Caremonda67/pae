import { describe, expect, it } from "vitest";
import { coincide } from "./busqueda";

describe("coincide", () => {
  it("coincide ignorando mayusculas y minusculas", () => {
    expect(coincide("Maria Gomez", "maria")).toBe(true);
    expect(coincide("Maria Gomez", "GOMEZ")).toBe(true);
  });

  it("coincide ignorando tildes", () => {
    expect(coincide("Menú del día", "menu")).toBe(true);
    expect(coincide("Arroz con pollo", "pól")).toBe(true);
  });

  it("recorta espacios alrededor del termino", () => {
    expect(coincide("Juan Perez", "  juan  ")).toBe(true);
  });

  it("no coincide cuando el termino no aparece", () => {
    expect(coincide("Juan Perez", "Carlos")).toBe(false);
  });

  it("termino vacio coincide con cualquier texto", () => {
    expect(coincide("Cualquier cosa", "")).toBe(true);
  });
});
