import {
  MAX_VIDEO_BYTES,
  validarVideoComercio,
} from "../src/utils/multimedia-comercio";

describe("validación de video del comercio", () => {
  test("acepta un MP4 válido de menos de 30 segundos y 30 MB", () => {
    expect(
      validarVideoComercio({
        duration: 7_000,
        fileSize: 5 * 1024 * 1024,
        fileName: "presentacion.mp4",
        mimeType: "video/mp4",
      }),
    ).toBeNull();
  });

  test("rechaza videos de más de 30 segundos", () => {
    expect(
      validarVideoComercio({
        duration: 31_000,
        fileSize: 5 * 1024 * 1024,
        fileName: "presentacion.mp4",
        mimeType: "video/mp4",
      }),
    ).toBe("El video debe durar como máximo 30 segundos.");
  });

  test("rechaza videos de más de 30 MB", () => {
    expect(
      validarVideoComercio({
        duration: 20_000,
        fileSize: MAX_VIDEO_BYTES + 1,
        fileName: "presentacion.mp4",
        mimeType: "video/mp4",
      }),
    ).toBe("El video supera el máximo de 30 MB permitido por la API.");
  });

  test("rechaza formatos que no sean MP4", () => {
    expect(
      validarVideoComercio({
        duration: 20_000,
        fileSize: 5 * 1024 * 1024,
        fileName: "presentacion.mov",
        mimeType: "video/quicktime",
      }),
    ).toBe("La API admite videos en formato MP4.");
  });

  test("acepta MP4 por extensión si el dispositivo no informa MIME", () => {
    expect(
      validarVideoComercio({
        duration: undefined,
        fileSize: undefined,
        fileName: "presentacion.MP4",
        mimeType: null,
      }),
    ).toBeNull();
  });
});
