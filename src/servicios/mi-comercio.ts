import { Comercio, Horario, Promocion } from "../tipos/modelos";
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

export interface CuerpoPromocionComercio {
  titulo: string;
  detalle: string;
  descuento: number | null;
  desde?: string;
  hasta: string;
  soloApp: boolean;
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

/*
 * Panel de promociones del comercio. GET trae TODAS las propias — incluidas
 * las vencidas y las dadas de baja — con su contador de usos; la baja es
 * lógica (DELETE → activa: false), así que la lista es la historia completa.
 */
export async function listarMisPromociones(): Promise<Promocion[]> {
  return pedir<Promocion[]>("/mi-comercio/promociones?porPagina=100", {
    conSesion: true,
  });
}

export async function crearPromocionComercio(
  cuerpo: CuerpoPromocionComercio,
): Promise<Promocion> {
  return pedir<Promocion>("/mi-comercio/promociones", {
    metodo: "POST",
    cuerpo,
    conSesion: true,
  });
}

export async function editarPromocionComercio(
  id: string,
  cambios: Partial<CuerpoPromocionComercio>,
): Promise<Promocion> {
  return pedir<Promocion>(
    `/mi-comercio/promociones/${encodeURIComponent(id)}`,
    {
      metodo: "PATCH",
      cuerpo: cambios,
      conSesion: true,
    },
  );
}

export async function darDeBajaPromocionComercio(id: string): Promise<void> {
  await pedir<void>(
    `/mi-comercio/promociones/${encodeURIComponent(id)}`,
    {
      metodo: "DELETE",
      conSesion: true,
    },
  );
}
