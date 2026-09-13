import { comerciosMock } from "../mocks/comercios";
import { Comercio } from "../tipos/modelos";
import { estaAbiertoAhora } from "../utils/horarios";

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

function normalizarTexto(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

export async function buscarComercios(
  texto: string,
  rubroId: string | null,
  soloAbiertos: boolean,
): Promise<Comercio[]> {
  await esperar(RETARDO_SIMULADO);

  const termino = normalizarTexto(texto);

  return comerciosMock.filter((comercio) => {
    if (!comercio.activo) {
      return false;
    }

    const coincideRubro = rubroId === null || comercio.rubroId === rubroId;

    const nombreNormalizado = normalizarTexto(comercio.nombre);

    const descripcionNormalizada = normalizarTexto(comercio.descripcion);

    const coincideTexto =
      termino.length === 0 ||
      nombreNormalizado.includes(termino) ||
      descripcionNormalizada.includes(termino);

    const coincideAbierto =
      !soloAbiertos || estaAbiertoAhora(comercio.horarios);

    return coincideRubro && coincideTexto && coincideAbierto;
  });
}
