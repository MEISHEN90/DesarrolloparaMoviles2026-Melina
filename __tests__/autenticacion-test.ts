import { Usuario } from "../src/tipos/modelos";
import {
  decidirAccesoEscaneo,
  validarIngreso,
  validarRegistro,
} from "../src/utils/autenticacion";

describe("validarIngreso", () => {
  it("acepta email y contraseña completos", () => {
    expect(validarIngreso("marta@mail.com", "demo1234")).toBeNull();
  });

  it("pide el email si está vacío o solo tiene espacios", () => {
    expect(validarIngreso("   ", "demo1234")).toBe("Falta el email.");
  });

  it("pide la contraseña si está vacía", () => {
    expect(validarIngreso("marta@mail.com", "")).toBe("Falta la contraseña.");
  });
});

describe("validarRegistro", () => {
  const ok = ["Marta Giménez", "marta@mail.com", "demo1234", "demo1234"] as const;

  it("acepta datos válidos", () => {
    expect(validarRegistro(...ok)).toBeNull();
  });

  it("pide el nombre", () => {
    expect(validarRegistro("  ", ok[1], ok[2], ok[3])).toBe("Falta tu nombre.");
  });

  it("rechaza un nombre de más de 80 letras", () => {
    expect(validarRegistro("a".repeat(81), ok[1], ok[2], ok[3])).toContain("entre 1 y 80");
  });

  it("rechaza un email mal formado", () => {
    expect(validarRegistro(ok[0], "marta@", ok[2], ok[3])).toBe("El email no es válido.");
  });

  it("rechaza una contraseña de menos de 8 caracteres (regla de la API)", () => {
    expect(validarRegistro(ok[0], ok[1], "corta12", "corta12")).toContain("al menos 8");
  });

  it("rechaza una contraseña de más de 100 caracteres", () => {
    const larga = "x".repeat(101);
    expect(validarRegistro(ok[0], ok[1], larga, larga)).toContain("máximo 100");
  });

  it("rechaza si la confirmación no coincide", () => {
    expect(validarRegistro(ok[0], ok[1], "demo1234", "demo12345")).toBe("Las contraseñas no coinciden.");
  });
});

describe("decidirAccesoEscaneo", () => {
  const usuario = (rol: Usuario["rol"]): Usuario => ({
    id: "usr-test",
    nombre: "Prueba",
    email: "prueba@mail.com",
    rol,
    comercioId: rol === "comercio" ? "com-001" : null,
    favoritos: [],
    rubrosDeInteres: [],
    avisosActivos: true,
  });

  it("deja pasar a una cuenta de comercio", () => {
    expect(decidirAccesoEscaneo(usuario("comercio"))).toBe("permitido");
  });

  it("rechaza a un vecino", () => {
    expect(decidirAccesoEscaneo(usuario("vecino"))).toBe("no-comercio");
  });

  it("pide iniciar sesión si no hay usuario", () => {
    expect(decidirAccesoEscaneo(null)).toBe("sin-sesion");
  });
});
