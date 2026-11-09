import * as SecureStore from "expo-secure-store";

const CLAVE_TOKEN = "tokenSesion";
const CLAVE_USUARIO_ID = "usuarioSesionId";

let sesionDesbloqueadaEnEjecucion = false;

export async function guardarSesion(
  token: string,
  usuarioId: string,
): Promise<void> {
  await SecureStore.setItemAsync(CLAVE_TOKEN, token);
  await SecureStore.setItemAsync(CLAVE_USUARIO_ID, usuarioId);
  sesionDesbloqueadaEnEjecucion = true;
}

export async function obtenerTokenSesion(): Promise<string | null> {
  return SecureStore.getItemAsync(CLAVE_TOKEN);
}

export async function obtenerUsuarioSesionId(): Promise<string | null> {
  return SecureStore.getItemAsync(CLAVE_USUARIO_ID);
}

export async function haySesionActiva(): Promise<boolean> {
  const token = await obtenerTokenSesion();

  return token !== null;
}

export function estaSesionDesbloqueada(): boolean {
  return sesionDesbloqueadaEnEjecucion;
}

export function marcarSesionDesbloqueada(): void {
  sesionDesbloqueadaEnEjecucion = true;
}

export async function cerrarSesion(): Promise<void> {
  await SecureStore.deleteItemAsync(CLAVE_TOKEN);
  await SecureStore.deleteItemAsync(CLAVE_USUARIO_ID);
  sesionDesbloqueadaEnEjecucion = false;
}
