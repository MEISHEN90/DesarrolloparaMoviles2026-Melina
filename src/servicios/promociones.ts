import { promocionesMock } from "../mocks/promociones";
import { Promocion } from "../tipos/modelos";
import { guardarPromocionesCache, obtenerPromocionesCache } from "./cache";
import { obtenerEstadoRed } from "./red";

const RETARDO_SIMULADO = 500;

function esperar(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function obtenerFuentePromociones(): Promise<Promocion[]> {
  const estadoRed = await obtenerEstadoRed();

  const hayConexion = estadoRed.conectado && estadoRed.tieneInternet;

  if (hayConexion) {
    await esperar(RETARDO_SIMULADO);

    const promocionesActivas = promocionesMock.filter(
      (promocion) => promocion.activa,
    );

    await guardarPromocionesCache(promocionesActivas);

    return promocionesActivas;
  }

  const promocionesGuardadas = await obtenerPromocionesCache();

  if (promocionesGuardadas.length > 0) {
    return promocionesGuardadas;
  }

  return [];
}

export async function obtenerPromociones(): Promise<Promocion[]> {
  return obtenerFuentePromociones();
}

export async function obtenerPromocionPorId(
  id: string,
): Promise<Promocion | null> {
  const promociones = await obtenerFuentePromociones();

  const promocion = promociones.find((item) => item.id === id);

  return promocion ?? null;
}

export async function obtenerPromocionesPorComercio(
  comercioId: string,
): Promise<Promocion[]> {
  const promociones = await obtenerFuentePromociones();

  return promociones.filter(
    (promocion) => promocion.comercioId === comercioId && promocion.activa,
  );
}
