/**
 * Los códigos de uso de promociones los genera la API de la cátedra.
 * Formato documentado: CCU-XXXX-XXXX.
 */
export function normalizarCodigoPromocion(contenido: string): string {
  return contenido.trim().toUpperCase();
}

export function pareceCodigoPromocion(contenido: string): boolean {
  const codigo = normalizarCodigoPromocion(contenido);

  return /^CCU-[A-Z0-9]{4}-[A-Z0-9]{4}$/.test(codigo);
}
