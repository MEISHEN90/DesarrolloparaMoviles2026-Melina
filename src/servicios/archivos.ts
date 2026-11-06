import { Directory, File, Paths } from "expo-file-system";

import { ErrorApi, ErrorRed, obtenerUrlBaseApi } from "./api";
import { obtenerTokenSesion } from "./sesion";

const CARPETA_APP = new Directory(Paths.document, "directorio-comercios");

export interface ArchivoSubido {
  url: string;
  tipo: string;
  bytes: number;
}

export function asegurarCarpetaApp(): void {
  if (!CARPETA_APP.exists) {
    CARPETA_APP.create();
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
