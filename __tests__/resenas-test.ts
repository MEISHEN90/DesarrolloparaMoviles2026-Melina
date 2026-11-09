import { Resena } from "../src/tipos/modelos";
import {
  calcularPromedio,
  miResenaDeLista,
  ordenarResenas,
  validarResena,
} from "../src/utils/resenas";

function resenaDePrueba(sobre: Partial<Resena> = {}): Resena {
  return {
    id: sobre.id ?? "res-test",
    comercioId: "com-118",
    usuarioId: "usr-512",
    estrellas: 5,
    comentario: "Comentario de prueba",
    respuesta: null,
    reportada: false,
    creadaEn: "2026-10-01T10:00:00-03:00",
    sincronizada: true,
    ...sobre,
  };
}

describe("ordenarResenas", () => {
  test("devuelve la más nueva primero", () => {
    const ordenadas = ordenarResenas([
      resenaDePrueba({ id: "vieja", creadaEn: "2026-09-01T10:00:00-03:00" }),
      resenaDePrueba({ id: "nueva", creadaEn: "2026-10-20T10:00:00-03:00" }),
      resenaDePrueba({ id: "media", creadaEn: "2026-09-15T10:00:00-03:00" }),
    ]);

    expect(ordenadas.map((resena) => resena.id)).toEqual(["nueva", "media", "vieja"]);
  });

  test("no muta la lista que entra", () => {
    const original = [
      resenaDePrueba({ id: "vieja", creadaEn: "2026-09-01T10:00:00-03:00" }),
      resenaDePrueba({ id: "nueva", creadaEn: "2026-10-20T10:00:00-03:00" }),
    ];

    ordenarResenas(original);
    expect(original[0].id).toBe("vieja");
  });

  test("una lista vacía queda vacía", () => {
    expect(ordenarResenas([])).toEqual([]);
  });
});

describe("calcularPromedio", () => {
  test("lista vacía da 0, no NaN", () => {
    expect(calcularPromedio([])).toBe(0);
  });

  test("promedio simple de estrellas", () => {
    expect(calcularPromedio([
      resenaDePrueba({ id: "a", estrellas: 5 }),
      resenaDePrueba({ id: "b", estrellas: 3 }),
    ])).toBe(4);
  });

  test("promedio con decimales", () => {
    expect(calcularPromedio([
      resenaDePrueba({ id: "a", estrellas: 5 }),
      resenaDePrueba({ id: "b", estrellas: 4 }),
      resenaDePrueba({ id: "c", estrellas: 4 }),
    ])).toBeCloseTo(4.33, 2);
  });
});

describe("miResenaDeLista", () => {
  test("encuentra la reseña del usuario", () => {
    const resenas = [
      resenaDePrueba({ id: "de-otro", usuarioId: "usr-999" }),
      resenaDePrueba({ id: "mia", usuarioId: "usr-512" }),
    ];
    expect(miResenaDeLista(resenas, "usr-512")?.id).toBe("mia");
  });

  test("sin sesión devuelve null", () => {
    expect(miResenaDeLista([resenaDePrueba()], null)).toBeNull();
  });

  test("si el usuario no reseñó, devuelve null", () => {
    expect(miResenaDeLista([resenaDePrueba()], "usr-inexistente")).toBeNull();
  });
});

describe("validarResena", () => {
  test("una reseña bien cargada no da error", () => {
    expect(validarResena(4, "Muy buena atención.")).toBeNull();
  });

  test("estrellas fuera de rango", () => {
    expect(validarResena(0, "Algo")).toBe("Falta elegir las estrellas, de 1 a 5.");
    expect(validarResena(6, "Algo")).toBe("Falta elegir las estrellas, de 1 a 5.");
  });

  test("comentario vacío", () => {
    expect(validarResena(3, "")).toBe("Escribí un comentario para la reseña.");
    expect(validarResena(3, "    ")).toBe("Escribí un comentario para la reseña.");
  });

  test("comentario demasiado largo", () => {
    expect(validarResena(3, "a".repeat(1001))).toBe(
      "El comentario tiene que tener entre 1 y 1000 letras.",
    );
  });
});
