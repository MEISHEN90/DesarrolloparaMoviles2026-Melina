export interface DatosQrPromocion {
  tipo: "PROMO";
  promocionId: string;
  usuarioId: string;
}

export function interpretarQrPromocion(
  contenido: string,
): DatosQrPromocion | null {
  const partes = contenido.trim().split("|");

  if (partes.length !== 3) {
    return null;
  }

  const [tipo, promocionId, usuarioId] = partes;

  if (tipo !== "PROMO") {
    return null;
  }

  if (!promocionId || !usuarioId) {
    return null;
  }

  if (!promocionId.startsWith("pro-")) {
    return null;
  }

  if (!usuarioId.startsWith("usr-")) {
    return null;
  }

  return {
    tipo: "PROMO",
    promocionId,
    usuarioId,
  };
}
