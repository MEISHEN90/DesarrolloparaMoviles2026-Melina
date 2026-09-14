import { interpretarQrPromocion } from "../src/utils/qr";

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
