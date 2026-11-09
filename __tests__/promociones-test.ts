import { Promocion } from "../src/tipos/modelos";
import {
  armarCuerpoPromocion,
  estadoDePromocion,
  estaPorVencer,
  filtrarPromocionesDeInteres,
  parteFechaIso,
  validarBorradorPromocion,
} from "../src/utils/promociones";

function promoDePrueba(sobre: Partial<Promocion> = {}): Promocion {
  return {
    id: "pro-test",
    comercioId: "com-118",
    titulo: "15% en pinturas",
    detalle: "Promoción de prueba",
    descuento: 15,
    desde: "2026-10-01T00:00:00-03:00",
    hasta: "2026-12-31T23:59:00-03:00",
    imagenUrl: null,
    soloApp: true,
    usos: 0,
    activa: true,
    ...sobre,
  };
}

const RUBRO_POR_COMERCIO = new Map<string, string>([
  ["com-118", "rub-ferreteria"],
  ["com-201", "rub-gastronomia"],
  ["com-999", "rub-libreria"],
]);

describe("filtrarPromocionesDeInteres", () => {
  test("incluye la promo de un comercio favorito", () => {
    const nuevas = [promoDePrueba({ id: "pro-1", comercioId: "com-118" })];

    const deInteres = filtrarPromocionesDeInteres(
      nuevas,
      ["com-118"],
      [],
      RUBRO_POR_COMERCIO,
    );

    expect(deInteres).toHaveLength(1);
  });

  test("incluye la promo de un comercio cuyo rubro es de interés", () => {
    const nuevas = [promoDePrueba({ id: "pro-2", comercioId: "com-201" })];

    const deInteres = filtrarPromocionesDeInteres(
      nuevas,
      [],
      ["rub-gastronomia"],
      RUBRO_POR_COMERCIO,
    );

    expect(deInteres).toHaveLength(1);
  });

  test("no incluye promos de comercios sin relación con el usuario", () => {
    const nuevas = [promoDePrueba({ id: "pro-3", comercioId: "com-999" })];

    const deInteres = filtrarPromocionesDeInteres(
      nuevas,
      ["com-118"],
      ["rub-gastronomia"],
      RUBRO_POR_COMERCIO,
    );

    expect(deInteres).toHaveLength(0);
  });

  test("una promo cuyo comercio no está en la cache no matchea por rubro", () => {
    const nuevas = [promoDePrueba({ id: "pro-4", comercioId: "com-desconocido" })];

    const deInteres = filtrarPromocionesDeInteres(
      nuevas,
      [],
      ["rub-gastronomia"],
      RUBRO_POR_COMERCIO,
    );

    expect(deInteres).toHaveLength(0);
  });
});

describe("estaPorVencer", () => {
  const ahora = new Date(2026, 9, 24, 12, 0, 0); // 24/10/2026 12:00

  function conVencimientoEn(dias: number): string {
    const fecha = new Date(ahora.getTime() + dias * 24 * 60 * 60 * 1000);

    return fecha.toISOString();
  }

  test("que vence en 2 días está por vencer", () => {
    expect(estaPorVencer(conVencimientoEn(2), ahora)).toBe(true);
  });

  test("que vence en 3 días exactos está por vencer", () => {
    expect(estaPorVencer(conVencimientoEn(3), ahora)).toBe(true);
  });

  test("que vence en 10 días NO está por vencer", () => {
    expect(estaPorVencer(conVencimientoEn(10), ahora)).toBe(false);
  });

  test("una promo ya vencida NO está por vencer", () => {
    expect(estaPorVencer(conVencimientoEn(-1), ahora)).toBe(false);
  });
});

describe("validarBorradorPromocion", () => {
  const ahora = new Date(2026, 10, 9, 12, 0, 0); // 9/11/2026 12:00

  function borrador(sobre: Partial<Parameters<typeof validarBorradorPromocion>[0]> = {}) {
    return {
      titulo: "10% en buloneria",
      detalle: "Solo hasta fin de mes.",
      descuentoTexto: "10",
      desdeTexto: "",
      hastaTexto: "2026-11-30",
      soloApp: false,
      ...sobre,
    };
  }

  test("un borrador completo y vigente pasa", () => {
    expect(validarBorradorPromocion(borrador(), ahora)).toBeNull();
  });

  test("rechaza título vacío", () => {
    expect(validarBorradorPromocion(borrador({ titulo: "   " }), ahora)).toMatch(
      /título/i,
    );
  });

  test("rechaza detalle vacío", () => {
    expect(validarBorradorPromocion(borrador({ detalle: "" }), ahora)).toMatch(
      /detalle/i,
    );
  });

  test("rechaza un descuento fuera de rango", () => {
    expect(
      validarBorradorPromocion(borrador({ descuentoTexto: "150" }), ahora),
    ).toMatch(/descuento/i);
  });

  test("rechaza un descuento con decimales (el PRD pide entero)", () => {
    expect(
      validarBorradorPromocion(borrador({ descuentoTexto: "12.5" }), ahora),
    ).toMatch(/descuento/i);
  });

  test("acepta descuento vacío (promo sin descuento)", () => {
    expect(
      validarBorradorPromocion(borrador({ descuentoTexto: "" }), ahora),
    ).toBeNull();
  });

  test("rechaza que la promo termine en el pasado", () => {
    expect(
      validarBorradorPromocion(borrador({ hastaTexto: "2026-11-01" }), ahora),
    ).toMatch(/posterior a este momento/i);
  });

  test("rechaza que termine antes de arrancar", () => {
    expect(
      validarBorradorPromocion(
        borrador({ desdeTexto: "2026-12-01", hastaTexto: "2026-11-30" }),
        ahora,
      ),
    ).toMatch(/posterior a la de inicio/i);
  });

  test("rechaza una fecha de inicio sin formato", () => {
    expect(
      validarBorradorPromocion(borrador({ desdeTexto: "mañana" }), ahora),
    ).toMatch(/inicio/i);
  });
});

describe("armarCuerpoPromocion", () => {
  const ahora = new Date(2026, 10, 9, 12, 0, 0);

  test("arma el cuerpo con descuento y fechas ISO", () => {
    const cuerpo = armarCuerpoPromocion({
      titulo: "  10% en buloneria  ",
      detalle: "Solo hasta fin de mes.",
      descuentoTexto: "10",
      desdeTexto: "2026-11-10",
      hastaTexto: "2026-11-30",
      soloApp: true,
    });

    expect(cuerpo.titulo).toBe("10% en buloneria");
    expect(cuerpo.descuento).toBe(10);
    expect(cuerpo.soloApp).toBe(true);
    expect(cuerpo.desde).toContain("2026-11-10");
    expect(new Date(cuerpo.hasta).getTime()).toBeGreaterThan(
      new Date(cuerpo.desde ?? "").getTime(),
    );
  });

  test("sin descuento manda null y sin desde omite el campo (la API usa ahora)", () => {
    const cuerpo = armarCuerpoPromocion({
      titulo: "Beneficio especial",
      detalle: "Sin porcentaje.",
      descuentoTexto: "",
      desdeTexto: "",
      hastaTexto: "2026-12-31",
      soloApp: false,
    });

    expect(cuerpo.descuento).toBeNull();
    expect(cuerpo.desde).toBeUndefined();
    expect(validarBorradorPromocion({ ...{
      titulo: "Beneficio especial",
      detalle: "Sin porcentaje.",
      descuentoTexto: "",
      desdeTexto: "",
      hastaTexto: "2026-12-31",
      soloApp: false,
    } }, ahora)).toBeNull();
  });

  test("parteFechaIso deja sólo el día para precargar el formulario", () => {
    expect(parteFechaIso("2026-11-30T23:59:00-03:00")).toBe("2026-11-30");
  });
});

describe("estadoDePromocion", () => {
  const ahora = new Date(2026, 10, 9, 12, 0, 0); // 9/11/2026 12:00

  test("activa y con fecha futura está activa", () => {
    expect(
      estadoDePromocion({ activa: true, hasta: "2026-11-30T23:59:00-03:00" }, ahora),
    ).toBe("activa");
  });

  test("activa pero con fecha pasada está vencida", () => {
    expect(
      estadoDePromocion({ activa: true, hasta: "2026-11-01T23:59:00-03:00" }, ahora),
    ).toBe("vencida");
  });

  test("dada de baja es baja aunque la fecha no haya pasado", () => {
    expect(
      estadoDePromocion({ activa: false, hasta: "2026-11-30T23:59:00-03:00" }, ahora),
    ).toBe("baja");
  });
});
