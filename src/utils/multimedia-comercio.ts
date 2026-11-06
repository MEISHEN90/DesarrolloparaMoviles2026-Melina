export const MAX_VIDEO_BYTES = 30 * 1024 * 1024;
export const MAX_VIDEO_DURACION_MS = 30_000;

export interface VideoComercioValidable {
  duration?: number | null;
  fileSize?: number;
  fileName?: string | null;
  mimeType?: string | null;
}

export function validarVideoComercio(
  video: VideoComercioValidable,
): string | null {
  if (
    video.duration !== null &&
    video.duration !== undefined &&
    video.duration > MAX_VIDEO_DURACION_MS
  ) {
    return "El video debe durar como máximo 30 segundos.";
  }

  if (video.fileSize !== undefined && video.fileSize > MAX_VIDEO_BYTES) {
    return "El video supera el máximo de 30 MB permitido por la API.";
  }

  const nombre = video.fileName ?? "";
  const esMp4 =
    video.mimeType === "video/mp4" ||
    nombre.toLowerCase().endsWith(".mp4");

  if (!esMp4) {
    return "La API admite videos en formato MP4.";
  }

  return null;
}
