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
