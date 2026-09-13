import * as SecureStore from "expo-secure-store";

const CLAVE_TOKEN = "tokenSesion";
const CLAVE_USUARIO_ID = "usuarioSesionId";

export async function guardarSesion(
  token: string,
  usuarioId: string,
): Promise<void> {
  await SecureStore.setItemAsync(CLAVE_TOKEN, token);
  await SecureStore.setItemAsync(CLAVE_USUARIO_ID, usuarioId);
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

export async function cerrarSesion(): Promise<void> {
  await SecureStore.deleteItemAsync(CLAVE_TOKEN);
  await SecureStore.deleteItemAsync(CLAVE_USUARIO_ID);
}
