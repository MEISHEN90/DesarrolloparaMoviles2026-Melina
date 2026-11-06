import { Comercio, Horario } from "../tipos/modelos";
import { pedir } from "./api";

export interface DatosEditablesComercio {
  nombre: string;
  descripcion: string;
  direccion: string;
  telefono: string | null;
  whatsapp: string | null;
  instagram: string | null;
  horarios: Horario[];
  imagenes: string[];
  videoUrl: string | null;
}

export async function obtenerMiComercio(): Promise<Comercio> {
  return pedir<Comercio>("/mi-comercio", {
    conSesion: true,
  });
}

export async function actualizarMiComercio(
  cambios: Partial<DatosEditablesComercio>,
): Promise<Comercio> {
  return pedir<Comercio>("/mi-comercio", {
    metodo: "PATCH",
    cuerpo: cambios,
    conSesion: true,
  });
}
