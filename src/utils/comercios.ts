import { Comercio } from "../tipos/modelos";
import { estaAbiertoAhora } from "./horarios";

export function normalizarTextoComercio(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

export function filtrarComercios(
  comercios: Comercio[],
  texto: string,
  rubroId: string | null,
  soloAbiertos: boolean,
  fechaActual: Date = new Date(),
): Comercio[] {
  const termino = normalizarTextoComercio(texto);

  return comercios.filter((comercio) => {
    if (!comercio.activo) {
      return false;
    }

    const coincideRubro = rubroId === null || comercio.rubroId === rubroId;
    const nombreNormalizado = normalizarTextoComercio(comercio.nombre);
    const descripcionNormalizada = normalizarTextoComercio(
      comercio.descripcion,
    );

    const coincideTexto =
      termino.length === 0 ||
      nombreNormalizado.includes(termino) ||
      descripcionNormalizada.includes(termino);

    const coincideAbierto =
      !soloAbiertos || estaAbiertoAhora(comercio.horarios, fechaActual);

    return coincideRubro && coincideTexto && coincideAbierto;
  });
}
