import { describe, expect, it } from "vitest";
import {
  GRADOS,
  horarioGrado,
  horaFinReserva,
  estadoReserva,
} from "./horarios";

describe("horaFinReserva", () => {
  it("devuelve el fin del turno general cuando no hay grado", () => {
    expect(horaFinReserva("Almuerzo")).toBe("11:30");
    expect(horaFinReserva("Refrigerio")).toBe("16:00");
  });

  it("usa el horario del grado para el refrigerio", () => {
    expect(horaFinReserva("Refrigerio", "9-1")).toBe("13:45");
    expect(horaFinReserva("Refrigerio", "11-2")).toBe("14:15");
  });

  it("cae al horario general si el grado no existe", () => {
    expect(horaFinReserva("Refrigerio", "7-1")).toBe("16:00");
    expect(horaFinReserva("Almuerzo", "9-1")).toBe("11:30");
  });

  it("devuelve 23:59 si el turno es desconocido", () => {
    expect(horaFinReserva("Cena")).toBe("23:59");
  });
});

describe("horarioGrado", () => {
  it("formatea el horario del grado", () => {
    expect(horarioGrado("10-1")).toBe("13:45 - 14:00");
  });

  it("devuelve null para grados no configurados", () => {
    expect(horarioGrado("7-1")).toBeNull();
  });
});

describe("GRADOS", () => {
  it("lista todos los grados configurados ordenados", () => {
    expect(GRADOS).toEqual(["10-1", "10-2", "11-1", "11-2", "9-1", "9-2"]);
  });
});

describe("estadoReserva", () => {
  it("marca completada si ya asistio", () => {
    expect(
      estadoReserva({ fecha: "2099-01-01", turno: "Almuerzo", asistio: true })
    ).toBe("completada");
  });

  it("marca pendiente si el turno no termino", () => {
    // fecha futura con almuerzo aun en curso
    expect(
      estadoReserva({ fecha: "2099-01-01", turno: "Almuerzo", asistio: false })
    ).toBe("pendiente");
  });

  it("marca completada cuando la hora de fin ya paso", () => {
    // fecha en el pasado con asistencia no marcada
    expect(
      estadoReserva({ fecha: "2020-01-01", turno: "Almuerzo", asistio: false })
    ).toBe("completada");
  });

  it("respeta el horario del grado en refrigerio", () => {
    const fechaPasada = "2020-01-01";
    expect(
      estadoReserva({
        fecha: fechaPasada,
        turno: "Refrigerio",
        grado: "9-1",
        asistio: false,
      })
    ).toBe("completada");
  });
});
