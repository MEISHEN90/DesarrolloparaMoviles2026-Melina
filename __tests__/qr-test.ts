import {
  construirCodigoPromocion,
  interpretarQrPromocion,
} from "../src/utils/qr";

describe("interpretación de códigos QR", () => {
  test("interpreta correctamente un QR de promoción válido", () => {
    const resultado = interpretarQrPromocion("PROMO|pro-001|usr-001");

    expect(resultado).toEqual({
      tipo: "PROMO",
      promocionId: "pro-001",
      usuarioId: "usr-001",
    });
  });

  test("rechaza un QR con formato incorrecto", () => {
    const resultado = interpretarQrPromocion("texto-cualquiera");

    expect(resultado).toBeNull();
  });

  test("rechaza un tipo de QR desconocido", () => {
    const resultado = interpretarQrPromocion("OTRO|pro-001|usr-001");

    expect(resultado).toBeNull();
  });

  test("rechaza un identificador de promoción inválido", () => {
    const resultado = interpretarQrPromocion("PROMO|abc-001|usr-001");

    expect(resultado).toBeNull();
  });

  test("rechaza un identificador de usuario inválido", () => {
    const resultado = interpretarQrPromocion("PROMO|pro-001|cliente-001");

    expect(resultado).toBeNull();
  });
});

describe("construcción del código de promoción", () => {
  test("el código construido es exactamente lo que el escáner interpreta", () => {
    const codigo = construirCodigoPromocion("pro-441", "usr-512");

    expect(codigo).toBe("PROMO|pro-441|usr-512");

    expect(interpretarQrPromocion(codigo)).toEqual({
      tipo: "PROMO",
      promocionId: "pro-441",
      usuarioId: "usr-512",
    });
  });

  test("dos códigos con distinto usuario no se confunden", () => {
    const deMarta = construirCodigoPromocion("pro-441", "usr-512");
    const deOtro = construirCodigoPromocion("pro-441", "usr-777");

    expect(deMarta).not.toBe(deOtro);
  });
});
