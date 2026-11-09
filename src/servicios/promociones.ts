import { Promocion } from "../tipos/modelos";
import { pedir } from "./api";
import { guardarPromocionesCache, obtenerPromocionesCache } from "./cache";

async function obtenerFuentePromociones(): Promise<Promocion[]> {
  try {
    const promociones = await pedir<Promocion[]>("/promociones?estado=vigentes");

    await guardarPromocionesCache(promociones);

    return promociones;
  } catch {
    try {
      return await obtenerPromocionesCache();
    } catch {
      return [];
    }
  }
}

export async function obtenerPromociones(): Promise<Promocion[]> {
  return obtenerFuentePromociones();
}

export type EstadoPromociones = "vigentes" | "proximas" | "por-vencer";

/*
 * Los tres estados que el PRD pide ver en la pestaña y que la API distingue
 * con ?estado=. Las vigentes tienen cache local (son las que muestra la app
 * sin conexión); las otras dos necesitan red, y la pantalla resuelve el error.
 */
export async function obtenerPromocionesPorEstado(
  estado: EstadoPromociones,
): Promise<Promocion[]> {
  if (estado === "vigentes") {
    return obtenerPromociones();
  }

  return pedir<Promocion[]>(`/promociones?estado=${estado}`);
}

export async function obtenerPromocionPorId(
  id: string,
): Promise<Promocion | null> {
  try {
    return await pedir<Promocion>(`/promociones/${id}`);
  } catch {
    const promociones = await obtenerPromocionesCache().catch(() => []);
    return promociones.find((promocion) => promocion.id === id) ?? null;
  }
}

export async function obtenerPromocionesPorComercio(
  comercioId: string,
): Promise<Promocion[]> {
  try {
    const promociones = await pedir<Promocion[]>(
      `/promociones?estado=vigentes&comercioId=${encodeURIComponent(comercioId)}`,
    );

    return promociones;
  } catch {
    const promociones = await obtenerPromocionesCache().catch(() => []);

    return promociones.filter(
      (promocion) => promocion.comercioId === comercioId && promocion.activa,
    );
  }
}
