import { comerciosMock } from "../mocks/comercios";
import { Comercio } from "../tipos/modelos";

const RETARDO_SIMULADO = 500;

function esperar(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function obtenerComercios(): Promise<Comercio[]> {
  await esperar(RETARDO_SIMULADO);

  return comerciosMock.filter((comercio) => comercio.activo);
}

export async function obtenerComercioPorId(
  id: string,
): Promise<Comercio | null> {
  await esperar(RETARDO_SIMULADO);

  const comercio = comerciosMock.find((item) => item.id === id);

  return comercio ?? null;
}

export async function obtenerComerciosPorRubro(
  rubroId: string,
): Promise<Comercio[]> {
  await esperar(RETARDO_SIMULADO);

  return comerciosMock.filter(
    (comercio) => comercio.rubroId === rubroId && comercio.activo,
  );
}
