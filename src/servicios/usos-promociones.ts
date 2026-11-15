import { UsoDePromocion } from "../tipos/modelos";
import { pedir } from "./api";

export async function generarCodigoPromocion(promocionId: string): Promise<UsoDePromocion> {
  return pedir<UsoDePromocion>(`/promociones/${encodeURIComponent(promocionId)}/usos`, {
    metodo: "POST", conSesion: true,
  });
}

export async function validarCodigoPromocion(codigo: string): Promise<UsoDePromocion> {
  return pedir<UsoDePromocion>("/mi-comercio/usos/validar", {
    metodo: "POST", cuerpo: { codigo }, conSesion: true,
  });
}

export async function obtenerUsosPromocion(): Promise<UsoDePromocion[]> {
  return pedir<UsoDePromocion[]>("/yo/usos", { conSesion: true });
}

export async function promocionYaUtilizada(promocionId: string, usuarioId: string): Promise<boolean> {
  const usos = await obtenerUsosPromocion();
  return usos.some(uso => uso.promocionId === promocionId && uso.usuarioId === usuarioId && uso.validadoEn !== null);
}
