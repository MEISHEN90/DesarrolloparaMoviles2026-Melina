import {
  normalizarCodigoPromocion,
  pareceCodigoPromocion,
} from "../src/utils/qr";

describe("códigos QR de promociones", () => {
  test("reconoce el formato de código generado por la API", () => {
    expect(pareceCodigoPromocion("CCU-7KQ4-M9XH")).toBe(true);
  });

  test("normaliza espacios y minúsculas antes de validar", () => {
    expect(normalizarCodigoPromocion("  ccu-7kq4-m9xh  ")).toBe(
      "CCU-7KQ4-M9XH",
    );
    expect(pareceCodigoPromocion("  ccu-7kq4-m9xh  ")).toBe(true);
  });

  test("rechaza el formato local antiguo", () => {
    expect(pareceCodigoPromocion("PROMO|pro-441|usr-512")).toBe(false);
  });

  test("rechaza texto que no tiene formato de código de promoción", () => {
    expect(pareceCodigoPromocion("texto-cualquiera")).toBe(false);
  });
});
