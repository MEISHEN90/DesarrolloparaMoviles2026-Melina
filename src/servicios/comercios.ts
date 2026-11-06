import { pedir } from "./api";
import { Comercio } from "../tipos/modelos";
import { filtrarComercios } from "../utils/comercios";
import { guardarComerciosCache, obtenerComerciosCache } from "./cache";

async function obtenerFuenteComercios(): Promise<Comercio[]> {
  try {
    const comercios = await pedir<Comercio[]>("/comercios?porPagina=1000");
    await guardarComerciosCache(comercios);
    return comercios;
  } catch {
    return obtenerComerciosCache();
  }
}

export async function obtenerComercios(): Promise<Comercio[]> {
  const comercios = await obtenerFuenteComercios();
  return comercios.filter((comercio) => comercio.activo);
}

export async function obtenerComercioPorId(
  id: string,
): Promise<Comercio | null> {
  try {
    return await pedir<Comercio>(`/comercios/${id}`);
  } catch {
    const guardados = await obtenerComerciosCache();
    return guardados.find((comercio) => comercio.id === id) ?? null;
  }
}

export async function obtenerComerciosPorRubro(
  rubroId: string,
): Promise<Comercio[]> {
  const comercios = await obtenerComercios();
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
