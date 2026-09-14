import { comerciosMock } from "../mocks/comercios";
import { Comercio } from "../tipos/modelos";
import { estaAbiertoAhora } from "../utils/horarios";
import { guardarComerciosCache, obtenerComerciosCache } from "./cache";
import { obtenerEstadoRed } from "./red";

const RETARDO_SIMULADO = 500;

function esperar(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function normalizarTexto(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function filtrarComercios(
  comercios: Comercio[],
  texto: string,
  rubroId: string | null,
  soloAbiertos: boolean,
): Comercio[] {
  const termino = normalizarTexto(texto);

  return comercios.filter((comercio) => {
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

async function obtenerFuenteComercios(): Promise<Comercio[]> {
  const estadoRed = await obtenerEstadoRed();

  const hayConexion = estadoRed.conectado && estadoRed.tieneInternet;

  if (hayConexion) {
    await esperar(RETARDO_SIMULADO);

    const comerciosActivos = comerciosMock.filter(
      (comercio) => comercio.activo,
    );

    await guardarComerciosCache(comerciosActivos);

    return comerciosActivos;
  }

  const comerciosGuardados = await obtenerComerciosCache();

  if (comerciosGuardados.length > 0) {
    return comerciosGuardados;
  }

  return [];
}

export async function obtenerComercios(): Promise<Comercio[]> {
  return obtenerFuenteComercios();
}

export async function obtenerComercioPorId(
  id: string,
): Promise<Comercio | null> {
  const comercios = await obtenerFuenteComercios();

  const comercio = comercios.find((item) => item.id === id);

  return comercio ?? null;
}

export async function obtenerComerciosPorRubro(
  rubroId: string,
): Promise<Comercio[]> {
  const comercios = await obtenerFuenteComercios();

  return comercios.filter(
    (comercio) => comercio.rubroId === rubroId && comercio.activo,
  );
}

export async function buscarComercios(
  texto: string,
  rubroId: string | null,
  soloAbiertos: boolean,
): Promise<Comercio[]> {
  const comercios = await obtenerFuenteComercios();

  return filtrarComercios(comercios, texto, rubroId, soloAbiertos);
}
