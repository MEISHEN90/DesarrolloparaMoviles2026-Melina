import { Directory, File, Paths } from "expo-file-system";

import { ErrorApi, ErrorRed, obtenerUrlBaseApi } from "./api";
import { obtenerTokenSesion } from "./sesion";

const CARPETA_APP = new Directory(Paths.document, "directorio-comercios");
const CARPETA_MULTIMEDIA = new Directory(CARPETA_APP, "multimedia");

export interface ArchivoSubido {
  url: string;
  tipo: string;
  bytes: number;
}

export interface MultimediaComercioLocal {
  imagenes: string[];
  videoUrl: string | null;
}

export function asegurarCarpetaApp(): void {
  if (!CARPETA_APP.exists) {
    CARPETA_APP.create();
  }
}

function asegurarCarpetaMultimedia(): void {
  asegurarCarpetaApp();

  if (!CARPETA_MULTIMEDIA.exists) {
    CARPETA_MULTIMEDIA.create();
  }
}

export function guardarArchivoLocal(
  uriOrigen: string,
  nombreArchivo: string,
): string {
  asegurarCarpetaApp();

  const origen = new File(uriOrigen);
  const destino = new File(CARPETA_APP, nombreArchivo);

  origen.copy(destino);

  return destino.uri;
}

export function obtenerArchivoLocal(nombreArchivo: string): string | null {
  asegurarCarpetaApp();

  const archivo = new File(CARPETA_APP, nombreArchivo);

  if (!archivo.exists) {
    return null;
  }

  return archivo.uri;
}

export function eliminarArchivoLocal(nombreArchivo: string): void {
  asegurarCarpetaApp();

  const archivo = new File(CARPETA_APP, nombreArchivo);

  if (archivo.exists) {
    archivo.delete();
  }
}

export function listarArchivosLocales(): string[] {
  asegurarCarpetaApp();

  return CARPETA_APP.list()
    .filter((item) => item instanceof File)
    .map((item) => item.uri);
}

function hashTexto(valor: string): string {
  let hash = 0;

  for (let indice = 0; indice < valor.length; indice += 1) {
    hash = (hash * 31 + valor.charCodeAt(indice)) >>> 0;
  }

  return hash.toString(16);
}

function extensionDesdeUrl(url: string, respaldo: string): string {
  const ruta = url.split("?")[0].toLowerCase();
  const coincidencia = ruta.match(/\.([a-z0-9]+)$/);

  if (!coincidencia) {
    return respaldo;
  }

  const extension = coincidencia[1];

  if (["jpg", "jpeg", "png", "webp", "mp4"].includes(extension)) {
    return extension;
  }

  return respaldo;
}

async function obtenerArchivoRemotoLocal(
  url: string,
  nombreArchivo: string,
): Promise<string> {
  if (!url.startsWith("http://") && !url.startsWith("https://")) {
    return url;
  }

  asegurarCarpetaMultimedia();

  const destino = new File(CARPETA_MULTIMEDIA, nombreArchivo);

  if (destino.exists) {
    return destino.uri;
  }

  try {
    const descargado = await File.downloadFileAsync(url, destino);
    return descargado.uri;
  } catch {
    return url;
  }
}

export async function prepararMultimediaComercio(
  comercioId: string,
  imagenes: string[],
  videoUrl: string | null,
): Promise<MultimediaComercioLocal> {
  const imagenesLocales = await Promise.all(
    imagenes.map((url, indice) => {
      const extension = extensionDesdeUrl(url, "jpg");
      const nombre = `comercio-${comercioId}-foto-${indice}-${hashTexto(url)}.${extension}`;

      return obtenerArchivoRemotoLocal(url, nombre);
    }),
  );

  let videoLocal: string | null = null;

  if (videoUrl) {
    const extension = extensionDesdeUrl(videoUrl, "mp4");
    const nombre = `comercio-${comercioId}-video-${hashTexto(videoUrl)}.${extension}`;

    videoLocal = await obtenerArchivoRemotoLocal(videoUrl, nombre);
  }

  return {
    imagenes: imagenesLocales,
    videoUrl: videoLocal,
  };
}

export async function subirArchivo(
  uri: string,
  nombre: string,
  tipoMime: string,
): Promise<ArchivoSubido> {
  const token = await obtenerTokenSesion();

  if (!token) {
    throw new ErrorApi(
      "NO_AUTENTICADO",
      "Tenés que iniciar sesión para subir archivos.",
    );
  }

  const formulario = new FormData();

  formulario.append(
    "archivo",
    {
      uri,
      name: nombre,
      type: tipoMime,
    } as unknown as Blob,
  );

  let respuesta: Response;

  try {
    respuesta = await fetch(`${obtenerUrlBaseApi()}/archivos`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formulario,
    });
  } catch {
    throw new ErrorRed();
  }

  const sobre = (await respuesta.json().catch(() => null)) as
    | { datos: ArchivoSubido; meta: unknown }
    | { error: { codigo: string; mensaje: string } }
    | null;

  if (!sobre) {
    throw new ErrorApi(
      "RESPUESTA_INVALIDA",
      "La respuesta de la API no es válida.",
    );
  }

  if ("error" in sobre) {
    throw new ErrorApi(sobre.error.codigo, sobre.error.mensaje);
  }

  return sobre.datos;
}
