import { Horario } from "../tipos/modelos";

function convertirHoraAMinutos(hora: string): number {
  const [horas, minutos] = hora.split(":").map(Number);

  return horas * 60 + minutos;
}

export function estaAbiertoAhora(
  horarios: Horario[],
  fechaActual: Date = new Date(),
): boolean {
  const diaActual = fechaActual.getDay();

  const minutosActuales =
    fechaActual.getHours() * 60 + fechaActual.getMinutes();

  const horariosDelDia = horarios.filter(
    (horario) => horario.dia === diaActual,
  );

  return horariosDelDia.some((horario) => {
    const apertura = convertirHoraAMinutos(horario.abre);

    const cierre = convertirHoraAMinutos(horario.cierra);

    return minutosActuales >= apertura && minutosActuales < cierre;
  });
}
