import { Promocion } from "../tipos/modelos";

/*
 * Lógica pura de avisos de promociones: entra dato, sale dato.
 * Sin notificaciones, sin red, sin React — es la parte testeable.
 */

/**
 * De las promociones nuevas, se queda con las que le interesan al usuario:
 * las de un comercio favorito, o las de un comercio cuyo rubro está en
 * sus rubros de interés (el rubro de cada comercio viene del mapa que
 * arma el que llama, a partir de la cache de comercios).
 */
export function filtrarPromocionesDeInteres(
  nuevas: Promocion[],
  favoritos: string[],
  rubrosDeInteres: string[],
  rubroPorComercio: Map<string, string>,
): Promocion[] {
  const favoritosSet = new Set(favoritos);
  const rubrosSet = new Set(rubrosDeInteres);

  return nuevas.filter((promocion) => {
    if (favoritosSet.has(promocion.comercioId)) {
      return true;
    }

    const rubro = rubroPorComercio.get(promocion.comercioId);

    return rubro !== undefined && rubrosSet.has(rubro);
  });
}

/**
 * Una promoción está "por vencer" cuando falta 3 días o menos y todavía
 * no venció. Es el mismo criterio que usa la API para su filtro
 * ?estado=por-vencer, pero calculado en el teléfono.
 */
export function estaPorVencer(
  hasta: string,
  ahora: Date,
  dias: number = 3,
): boolean {
  const faltanMs = new Date(hasta).getTime() - ahora.getTime();

  const msTresDias = dias * 24 * 60 * 60 * 1000;

  return faltanMs >= 0 && faltanMs <= msTresDias;
}

/*
 * Alta y edición de promociones del comercio: la validación es lógica
 * pura (entra texto del formulario, sale el primer error o null) para
 * poder probarla sin React y para que el formulario no decida reglas.
 */

export interface BorradorPromocion {
  titulo: string;
  detalle: string;
  /** "" o texto no numérico = sin descuento; la API espera entero 1-100 o null. */
  descuentoTexto: string;
  /** "" = arranca ahora. Formato AAAA-MM-DD (o ISO completo). */
  desdeTexto: string;
  /** Formato AAAA-MM-DD: se interpreta hasta el final de ese día. */
  hastaTexto: string;
  soloApp: boolean;
}

export interface CuerpoPromocionComercio {
  titulo: string;
  detalle: string;
  descuento: number | null;
  desde?: string;
  hasta: string;
  soloApp: boolean;
}

function parsearFechaFlexible(
  texto: string,
  finDelDia: boolean,
): Date | null {
  const limpio = texto.trim();

  if (limpio.length === 0) {
    return null;
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(limpio)) {
    const hora = finDelDia ? "23:59:59" : "00:00:00";

    return new Date(`${limpio}T${hora}-03:00`);
  }

  const comoFecha = new Date(limpio);

  return Number.isNaN(comoFecha.getTime()) ? null : comoFecha;
}

export function validarBorradorPromocion(
  borrador: BorradorPromocion,
  ahora: Date,
): string | null {
  const titulo = borrador.titulo.trim();

  if (titulo.length < 1 || titulo.length > 120) {
    return "El título tiene que tener entre 1 y 120 letras.";
  }

  const detalle = borrador.detalle.trim();

  if (detalle.length < 1 || detalle.length > 2000) {
    return "El detalle tiene que tener entre 1 y 2000 letras.";
  }

  const descuentoTexto = borrador.descuentoTexto.trim();

  if (descuentoTexto.length > 0) {
    const descuento = Number(descuentoTexto);

    if (!Number.isInteger(descuento) || descuento < 1 || descuento > 100) {
      return "El descuento tiene que ser un número entero de 1 a 100, o vacío.";
    }
  }

  const desde = parsearFechaFlexible(borrador.desdeTexto, false);

  if (borrador.desdeTexto.trim().length > 0 && desde === null) {
    return "La fecha de inicio no es válida (usá AAAA-MM-DD).";
  }

  const hasta = parsearFechaFlexible(borrador.hastaTexto, true);

  if (hasta === null) {
    return "Falta la fecha en que termina la promoción (usá AAAA-MM-DD).";
  }

  if (hasta.getTime() <= ahora.getTime()) {
    return "La fecha de fin tiene que ser posterior a este momento.";
  }

  if (desde !== null && hasta.getTime() <= desde.getTime()) {
    return "La fecha de fin tiene que ser posterior a la de inicio.";
  }

  return null;
}

export function armarCuerpoPromocion(
  borrador: BorradorPromocion,
): CuerpoPromocionComercio {
  const descuentoTexto = borrador.descuentoTexto.trim();
  const desde = parsearFechaFlexible(borrador.desdeTexto, false);
  const hasta = parsearFechaFlexible(borrador.hastaTexto, true) as Date;

  const cuerpo: CuerpoPromocionComercio = {
    titulo: borrador.titulo.trim(),
    detalle: borrador.detalle.trim(),
    descuento: descuentoTexto.length === 0 ? null : Number(descuentoTexto),
    hasta: hasta.toISOString(),
    soloApp: borrador.soloApp,
  };

  if (desde !== null) {
    cuerpo.desde = desde.toISOString();
  }

  return cuerpo;
}

/**
 * El panel del comercio muestra las promociones en tres estados: activas
 * (vigentes), vencidas (terminaron solas) o dadas de baja (DELETE lógico).
 */
export type EstadoDePromocion = "activa" | "vencida" | "baja";

export function estadoDePromocion(
  promocion: Pick<Promocion, "activa" | "hasta">,
  ahora: Date,
): EstadoDePromocion {
  if (!promocion.activa) {
    return "baja";
  }

  if (new Date(promocion.hasta).getTime() < ahora.getTime()) {
    return "vencida";
  }

  return "activa";
}

/**
 * El formulario precisa la parte de fecha de una promoción existente para
 * precargar los campos: "2026-11-30T23:59:00-03:00" → "2026-11-30".
 */
export function parteFechaIso(fecha: string): string {
  return fecha.slice(0, 10);
}
