import { Horario } from "../src/tipos/modelos";
import { estaAbiertoAhora } from "../src/utils/horarios";

const horariosFerreteria: Horario[] = [
  { dia: 1, abre: "08:00", cierra: "12:30" },
  { dia: 1, abre: "16:00", cierra: "20:00" },
];

describe("estaAbiertoAhora", () => {
  test("devuelve true durante el turno de la mañana", () => {
    const lunes0930 = new Date(2026, 8, 14, 9, 30);

    expect(estaAbiertoAhora(horariosFerreteria, lunes0930)).toBe(true);
  });

  test("devuelve false durante el corte del mediodía", () => {
    const lunes1400 = new Date(2026, 8, 14, 14, 0);

    expect(estaAbiertoAhora(horariosFerreteria, lunes1400)).toBe(false);
  });

  test("devuelve true durante el turno de la tarde", () => {
    const lunes1700 = new Date(2026, 8, 14, 17, 0);

    expect(estaAbiertoAhora(horariosFerreteria, lunes1700)).toBe(true);
  });

  test("devuelve false fuera del horario de atención", () => {
    const lunes2200 = new Date(2026, 8, 14, 22, 0);

    expect(estaAbiertoAhora(horariosFerreteria, lunes2200)).toBe(false);
  });

  test("devuelve false en un día sin horarios", () => {
    const domingo1000 = new Date(2026, 8, 13, 10, 0);

    expect(estaAbiertoAhora(horariosFerreteria, domingo1000)).toBe(false);
  });
});
