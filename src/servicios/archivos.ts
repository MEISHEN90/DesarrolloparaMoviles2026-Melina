import { Directory, File, Paths } from "expo-file-system";

const CARPETA_APP = new Directory(Paths.document, "directorio-comercios");

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
