import { UsoDePromocion } from "../tipos/modelos";
import { pedir } from "./api";

/**
 * Genera (o recupera) el código de una promoción para el vecino autenticado.
 * La API garantiza un único código por vecino y promoción mientras no haya sido validado.
 */
export async function generarUsoPromocion(
  promocionId: string,
): Promise<UsoDePromocion> {
  return pedir<UsoDePromocion>(`/promociones/${promocionId}/usos`, {
    metodo: "POST",
    conSesion: true,
  });
}

/** Devuelve los códigos/usos del vecino autenticado, validados o pendientes. */
export async function obtenerUsosPromocion(): Promise<UsoDePromocion[]> {
  return pedir<UsoDePromocion[]>("/yo/usos?porPagina=1000", {
    conSesion: true,
  });
}

/**
 * Valida en la API el código leído por el comercio y registra el uso.
 * La API controla pertenencia al comercio, vigencia y duplicados.
 */
export async function validarUsoPromocion(
  codigo: string,
): Promise<UsoDePromocion> {
  return pedir<UsoDePromocion>("/mi-comercio/usos/validar", {
    metodo: "POST",
    cuerpo: { codigo: codigo.trim().toUpperCase() },
    conSesion: true,
  });
}

export async function promocionYaUtilizada(
  promocionId: string,
): Promise<boolean> {
  const usos = await obtenerUsosPromocion();
  const uso = usos.find((item) => item.promocionId === promocionId);

  return uso?.validadoEn != null;
}
