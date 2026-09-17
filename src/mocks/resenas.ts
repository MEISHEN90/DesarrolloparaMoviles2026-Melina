import { Resena } from "../tipos/modelos";

export const resenasMock: Resena[] = [
  {
    id: "res-001",
    comercioId: "com-001",
    usuarioId: "usr-001",
    estrellas: 5,
    comentario:
      "Muy buena atención y variedad de productos. Encontré todo lo que necesitaba.",
    respuesta: "Muchas gracias por tu comentario. Te esperamos nuevamente.",
    reportada: false,
    creadaEn: "2026-09-10T15:30:00",
    sincronizada: true,
  },
  {
    id: "res-002",
    comercioId: "com-001",
    usuarioId: "usr-001",
    estrellas: 4,
    comentario: "Buena atención. Los precios fueron claros y tenían stock.",
    respuesta: null,
    reportada: false,
    creadaEn: "2026-09-05T11:20:00",
    sincronizada: true,
  },
  {
    id: "res-003",
    comercioId: "com-002",
    usuarioId: "usr-001",
    estrellas: 5,
    comentario: "Excelente café y muy buena atención. El lugar es cómodo.",
    respuesta: null,
    reportada: false,
    creadaEn: "2026-09-12T09:15:00",
    sincronizada: true,
  },
];
