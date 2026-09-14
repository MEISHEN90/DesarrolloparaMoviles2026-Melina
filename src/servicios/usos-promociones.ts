import { UsoDePromocion } from "../tipos/modelos";

const RETARDO_SIMULADO = 400;

const usosPromocionesMock: UsoDePromocion[] = [];

function esperar(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function registrarUsoPromocion(
  promocionId: string,
  usuarioId: string,
  codigo: string,
): Promise<UsoDePromocion> {
  await esperar(RETARDO_SIMULADO);

  const usoExistente = usosPromocionesMock.find(
    (uso) => uso.promocionId === promocionId && uso.usuarioId === usuarioId,
  );

  if (usoExistente) {
    throw new Error("Esta promoción ya fue utilizada por este usuario.");
  }

  const nuevoUso: UsoDePromocion = {
    id: `uso-${Date.now()}`,
    promocionId,
    usuarioId,
    codigo,
    validadoEn: new Date().toISOString(),
  };

  usosPromocionesMock.push(nuevoUso);

  return nuevoUso;
}

export async function obtenerUsosPromocion(): Promise<UsoDePromocion[]> {
  await esperar(RETARDO_SIMULADO);

  return [...usosPromocionesMock];
}

export async function promocionYaUtilizada(
  promocionId: string,
  usuarioId: string,
): Promise<boolean> {
  await esperar(RETARDO_SIMULADO);

  return usosPromocionesMock.some(
    (uso) => uso.promocionId === promocionId && uso.usuarioId === usuarioId,
  );
}
