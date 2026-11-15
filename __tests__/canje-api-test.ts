import { pedir } from "../src/servicios/api";
import { generarCodigoPromocion, validarCodigoPromocion, promocionYaUtilizada } from "../src/servicios/usos-promociones";
jest.mock("../src/servicios/api", () => ({ pedir: jest.fn() }));
const pedido = pedir as jest.Mock;
const uso = { id: "uso-test", promocionId: "pro-441", usuarioId: "usr-512", codigo: "CCU-7KQ4-M9XH", validadoEn: null };
beforeEach(() => pedido.mockReset());
test("solicita el código real del vecino a la API con sesión", async () => {
  pedido.mockResolvedValue(uso);
  expect(await generarCodigoPromocion("pro-441")).toEqual(uso);
  expect(pedido).toHaveBeenCalledWith("/promociones/pro-441/usos", { metodo: "POST", conSesion: true });
});
test("envía el código al canje del comercio sin buscar usuarios mock", async () => {
  pedido.mockResolvedValue({ ...uso, validadoEn: "2026-11-15T22:00:00Z" });
  await validarCodigoPromocion(uso.codigo);
  expect(pedido).toHaveBeenCalledWith("/mi-comercio/usos/validar", { metodo: "POST", cuerpo: { codigo: uso.codigo }, conSesion: true });
});
test("un código pendiente no cuenta como utilizado", async () => {
  pedido.mockResolvedValue([uso]);
  expect(await promocionYaUtilizada("pro-441", "usr-512")).toBe(false);
});
test("un código confirmado cuenta como utilizado sólo para su usuario", async () => {
  pedido.mockResolvedValue([{ ...uso, validadoEn: "2026-11-15T22:00:00Z" }]);
  expect(await promocionYaUtilizada("pro-441", "usr-512")).toBe(true);
  expect(await promocionYaUtilizada("pro-441", "usr-nuevo")).toBe(false);
});
test("conserva el error del servidor al rechazar un canje", async () => {
  pedido.mockRejectedValue(new Error("Ese código es de otro comercio."));
  await expect(validarCodigoPromocion(uso.codigo)).rejects.toThrow("Ese código es de otro comercio.");
});
