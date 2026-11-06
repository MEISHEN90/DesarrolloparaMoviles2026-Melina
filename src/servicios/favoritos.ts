import Storage from "expo-sqlite/kv-store";

import { Usuario } from "../tipos/modelos";
import { pedir } from "./api";
import { obtenerUsuarioSesionId } from "./sesion";

function construirClave(usuarioId: string): string {
  return `favoritos-comercios-${usuarioId}`;
}

async function obtenerUsuarioActual(): Promise<string | null> {
  return obtenerUsuarioSesionId();
}

async function obtenerFavoritosLocales(usuarioId: string): Promise<string[]> {
  const valor = await Storage.getItem(construirClave(usuarioId));

  if (!valor) {
    return [];
  }

  try {
    return JSON.parse(valor) as string[];
  } catch {
    return [];
  }
}

async function guardarFavoritosLocales(
  usuarioId: string,
  favoritos: string[],
): Promise<void> {
  await Storage.setItem(construirClave(usuarioId), JSON.stringify(favoritos));
}

export async function obtenerFavoritos(): Promise<string[]> {
  const usuarioId = await obtenerUsuarioActual();

  if (!usuarioId) {
    return [];
  }

  try {
    const usuario = await pedir<Usuario>("/yo", {
      conSesion: true,
    });

    await guardarFavoritosLocales(usuarioId, usuario.favoritos);

    return usuario.favoritos;
  } catch {
    return obtenerFavoritosLocales(usuarioId);
  }
}

export async function esFavorito(comercioId: string): Promise<boolean> {
  const favoritos = await obtenerFavoritos();
  return favoritos.includes(comercioId);
}

export async function agregarFavorito(comercioId: string): Promise<void> {
  const usuarioId = await obtenerUsuarioActual();

  if (!usuarioId) {
    throw new Error("Tenés que iniciar sesión para guardar favoritos.");
  }

  const usuario = await pedir<Usuario>(
    `/yo/favoritos/${encodeURIComponent(comercioId)}`,
    {
      metodo: "PUT",
      conSesion: true,
    },
  );

  await guardarFavoritosLocales(usuarioId, usuario.favoritos);
}

export async function quitarFavorito(comercioId: string): Promise<void> {
  const usuarioId = await obtenerUsuarioActual();

  if (!usuarioId) {
    throw new Error("Tenés que iniciar sesión para modificar favoritos.");
  }

  await pedir<void>(`/yo/favoritos/${encodeURIComponent(comercioId)}`, {
    metodo: "DELETE",
    conSesion: true,
  });

  const favoritosLocales = await obtenerFavoritosLocales(usuarioId);

  await guardarFavoritosLocales(
    usuarioId,
    favoritosLocales.filter((id) => id !== comercioId),
  );
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
