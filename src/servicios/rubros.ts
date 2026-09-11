import { rubrosMock } from "../mocks/rubros";
import { Rubro } from "../tipos/modelos";

const RETARDO_SIMULADO = 300;

function esperar(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function obtenerRubros(): Promise<Rubro[]> {
  await esperar(RETARDO_SIMULADO);

  return [...rubrosMock].sort((a, b) => a.orden - b.orden);
}

export async function obtenerRubroPorId(id: string): Promise<Rubro | null> {
  await esperar(RETARDO_SIMULADO);

  const rubro = rubrosMock.find((item) => item.id === id);

  return rubro ?? null;
}
