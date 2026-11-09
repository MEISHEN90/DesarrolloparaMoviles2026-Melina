import { Usuario } from "../tipos/modelos";

export const usuariosMock: Usuario[] = [
  {
    id: "usr-001",
    nombre: "Marta Giménez",
    email: "marta@mail.com",
    rol: "vecino",
    comercioId: null,
    favoritos: ["com-001"],
    rubrosDeInteres: ["rubro-003"],
    avisosActivos: true,
  },
  {
    id: "usr-002",
    nombre: "Ferretería El Tornillo",
    email: "comercio@eltornillo.com",
    rol: "comercio",
    comercioId: "com-001",
    favoritos: [],
    rubrosDeInteres: [],
    avisosActivos: true,
  },
];
