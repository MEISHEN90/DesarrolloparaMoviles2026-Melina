import { Resena } from "../tipos/modelos";

export function ordenarResenas(resenas: Resena[]): Resena[] {
  return [...resenas].sort(
    (a, b) => new Date(b.creadaEn).getTime() - new Date(a.creadaEn).getTime(),
  );
}

export function calcularPromedio(resenas: Resena[]): number {
  if (resenas.length === 0) {
    return 0;
  }

  const total = resenas.reduce((suma, resena) => suma + resena.estrellas, 0);
  return total / resenas.length;
}

export function miResenaDeLista(
  resenas: Resena[],
  usuarioId: string | null,
): Resena | null {
  if (!usuarioId) {
    return null;
  }

  return resenas.find((resena) => resena.usuarioId === usuarioId) ?? null;
}

export function validarResena(
  estrellas: number,
  comentario: string,
): string | null {
  if (!Number.isInteger(estrellas) || estrellas < 1 || estrellas > 5) {
    return "Falta elegir las estrellas, de 1 a 5.";
  }

  const texto = comentario.trim();

  if (texto.length === 0) {
    return "Escribí un comentario para la reseña.";
  }

  if (texto.length > 1000) {
    return "El comentario tiene que tener entre 1 y 1000 letras.";
  }

  return null;
}
