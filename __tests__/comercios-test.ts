import { Comercio } from "../src/tipos/modelos";
import {
  filtrarComercios,
  normalizarTextoComercio,
} from "../src/utils/comercios";

const base: Comercio = {
  id: "com-1",
  nombre: "Ferretería El Tornillo",
  rubroId: "rub-ferreteria",
  descripcion: "Herramientas, pinturas y bulonería.",
  direccion: "9 de Julio 1185",
  coordenadas: { latitud: -32.48, longitud: -58.23 },
  telefono: null,
  whatsapp: null,
  instagram: null,
  imagenes: [],
  videoUrl: null,
  horarios: [
    { dia: 1, abre: "08:00", cierra: "12:00" },
    { dia: 1, abre: "16:30", cierra: "20:30" },
  ],
  mediosDePago: ["efectivo"],
  puntaje: 4.6,
  cantidadResenas: 12,
  codigoQr: null,
  activo: true,
};

describe("filtros de comercios", () => {
  test("normaliza mayúsculas y acentos", () => {
    expect(normalizarTextoComercio("  FerreterÍA  ")).toBe("ferreteria");
  });

  test("busca por nombre ignorando acentos", () => {
    const resultado = filtrarComercios(
      [base],
      "ferreteria",
      null,
      false,
      new Date(2026, 8, 14, 9, 0),
    );

    expect(resultado).toHaveLength(1);
  });

  test("busca por descripción", () => {
    const resultado = filtrarComercios(
      [base],
      "buloneria",
      null,
      false,
      new Date(2026, 8, 14, 9, 0),
    );

    expect(resultado).toHaveLength(1);
  });

  test("filtra por rubro", () => {
    const resultado = filtrarComercios(
      [base],
      "",
      "rub-gastronomia",
      false,
      new Date(2026, 8, 14, 9, 0),
    );

    expect(resultado).toHaveLength(0);
  });

  test("filtra solo abiertos respetando horario partido", () => {
    const abiertoManana = filtrarComercios(
      [base],
      "",
      null,
      true,
      new Date(2026, 8, 14, 9, 0),
    );

    const cerradoMediodia = filtrarComercios(
      [base],
      "",
      null,
      true,
      new Date(2026, 8, 14, 14, 0),
    );

    expect(abiertoManana).toHaveLength(1);
    expect(cerradoMediodia).toHaveLength(0);
  });

  test("excluye comercios inactivos", () => {
    const resultado = filtrarComercios(
      [{ ...base, activo: false }],
      "",
      null,
      false,
      new Date(2026, 8, 14, 9, 0),
    );

    expect(resultado).toHaveLength(0);
  });
});
