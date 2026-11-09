import { Promocion } from "../tipos/modelos";

export const promocionesMock: Promocion[] = [
  {
    id: "pro-001",
    comercioId: "com-001",
    titulo: "20% de descuento en pinturas",
    detalle:
      "Descuento válido en pinturas seleccionadas abonando en efectivo o transferencia.",
    descuento: 20,
    desde: "2026-09-01",
    hasta: "2026-09-30",
    imagenUrl: null,
    soloApp: true,
    usos: 14,
    activa: true,
  },
  {
    id: "pro-002",
    comercioId: "com-002",
    titulo: "Café + medialunas",
    detalle: "Promoción especial de desayuno de lunes a viernes.",
    descuento: null,
    desde: "2026-09-01",
    hasta: "2026-10-15",
    imagenUrl: null,
    soloApp: false,
    usos: 32,
    activa: true,
  },
  {
    id: "pro-003",
    comercioId: "com-003",
    titulo: "Liquidación de temporada",
    detalle: "Promoción vencida utilizada para probar estados y filtros.",
    descuento: 30,
    desde: "2026-07-01",
    hasta: "2026-07-31",
    imagenUrl: null,
    soloApp: false,
    usos: 8,
    activa: false,
  },
];
