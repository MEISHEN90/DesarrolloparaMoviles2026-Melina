import { usuariosMock } from "../mocks/usuarios";
import { Usuario } from "../tipos/modelos";

const RETARDO_SIMULADO = 500;

interface ResultadoLogin {
  usuario: Usuario;
  token: string;
}

function esperar(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function iniciarSesion(
  email: string,
  password: string,
): Promise<ResultadoLogin> {
  await esperar(RETARDO_SIMULADO);

  const usuario = usuariosMock.find(
    (item) => item.email.toLowerCase() === email.trim().toLowerCase(),
  );

  if (!usuario || password !== "123456") {
    throw new Error("Credenciales inválidas.");
  }

  return {
    usuario,
    token: `token-${usuario.id}`,
  };
}
export async function obtenerUsuarioPorId(id: string): Promise<Usuario | null> {
  await esperar(RETARDO_SIMULADO);

  const usuario = usuariosMock.find((item) => item.id === id);

  return usuario ?? null;
}
