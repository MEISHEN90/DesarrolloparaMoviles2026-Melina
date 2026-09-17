import Storage from "expo-sqlite/kv-store";

import { obtenerUsuarioSesionId } from "./sesion";

function construirClave(usuarioId: string): string {
  return `favoritos-comercios-${usuarioId}`;
}

async function obtenerUsuarioActual(): Promise<string | null> {
  return obtenerUsuarioSesionId();
}

export async function obtenerFavoritos(): Promise<string[]> {
  const usuarioId = await obtenerUsuarioActual();

  if (!usuarioId) {
    return [];
  }

  const clave = construirClave(usuarioId);
  const valor = await Storage.getItem(clave);

  if (!valor) {
    return [];
  }

  try {
    return JSON.parse(valor) as string[];
  } catch {
    return [];
  }
}

export async function esFavorito(comercioId: string): Promise<boolean> {
  const favoritos = await obtenerFavoritos();

  return favoritos.includes(comercioId);
}

export async function agregarFavorito(comercioId: string): Promise<void> {
  const usuarioId = await obtenerUsuarioActual();

  if (!usuarioId) {
    return;
  }

  const clave = construirClave(usuarioId);
  const favoritos = await obtenerFavoritos();

  if (favoritos.includes(comercioId)) {
    return;
  }

  await Storage.setItem(clave, JSON.stringify([...favoritos, comercioId]));
}

export async function quitarFavorito(comercioId: string): Promise<void> {
  const usuarioId = await obtenerUsuarioActual();

  if (!usuarioId) {
    return;
  }

  const clave = construirClave(usuarioId);
  const favoritos = await obtenerFavoritos();

  const nuevosFavoritos = favoritos.filter((id) => id !== comercioId);

  await Storage.setItem(clave, JSON.stringify(nuevosFavoritos));
}

export async function alternarFavorito(comercioId: string): Promise<boolean> {
  const favoritoActual = await esFavorito(comercioId);

  if (favoritoActual) {
    await quitarFavorito(comercioId);
    return false;
  }

  await agregarFavorito(comercioId);
  return true;
}
