import { promocionesMock } from "../mocks/promociones";
import { Promocion } from "../tipos/modelos";

const RETARDO_SIMULADO = 500;

function esperar(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function obtenerPromociones(): Promise<Promocion[]> {
  await esperar(RETARDO_SIMULADO);

  return promocionesMock.filter((promocion) => promocion.activa);
}

export async function obtenerPromocionPorId(
  id: string,
): Promise<Promocion | null> {
  await esperar(RETARDO_SIMULADO);

  const promocion = promocionesMock.find((item) => item.id === id);

  return promocion ?? null;
}

export async function obtenerPromocionesPorComercio(
  comercioId: string,
): Promise<Promocion[]> {
  await esperar(RETARDO_SIMULADO);

  return promocionesMock.filter(
    (promocion) => promocion.comercioId === comercioId && promocion.activa,
  );
}
