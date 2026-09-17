import { resenasMock } from "../mocks/resenas";
import { Resena } from "../tipos/modelos";

const RETARDO_SIMULADO = 300;

function esperar(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function obtenerResenasPorComercio(
  comercioId: string,
): Promise<Resena[]> {
  await esperar(RETARDO_SIMULADO);

  return resenasMock
    .filter((resena) => resena.comercioId === comercioId && !resena.reportada)
    .sort(
      (a, b) => new Date(b.creadaEn).getTime() - new Date(a.creadaEn).getTime(),
    );
}

export async function obtenerPromedioResenas(
  comercioId: string,
): Promise<number> {
  const resenas = await obtenerResenasPorComercio(comercioId);

  if (resenas.length === 0) {
    return 0;
  }

  const total = resenas.reduce(
    (acumulado, resena) => acumulado + resena.estrellas,
    0,
  );

  return total / resenas.length;
}

export async function obtenerCantidadResenas(
  comercioId: string,
): Promise<number> {
  const resenas = await obtenerResenasPorComercio(comercioId);

  return resenas.length;
}
