import Storage from "expo-sqlite/kv-store";

const CLAVE_SOLO_ABIERTOS = "preferencia-solo-abiertos";
const CLAVE_RUBRO = "preferencia-rubro-seleccionado";

export async function guardarPreferenciaSoloAbiertos(
  valor: boolean,
): Promise<void> {
  await Storage.setItem(CLAVE_SOLO_ABIERTOS, JSON.stringify(valor));
}

export async function obtenerPreferenciaSoloAbiertos(): Promise<boolean> {
  const valor = await Storage.getItem(CLAVE_SOLO_ABIERTOS);

  if (valor === null) {
    return false;
  }

  return JSON.parse(valor) as boolean;
}

export async function guardarRubroSeleccionado(
  rubroId: string | null,
): Promise<void> {
  if (rubroId === null) {
    await Storage.removeItem(CLAVE_RUBRO);
    return;
  }

  await Storage.setItem(CLAVE_RUBRO, rubroId);
}

export async function obtenerRubroSeleccionado(): Promise<string | null> {
  return Storage.getItem(CLAVE_RUBRO);
}

export async function limpiarPreferenciasComercios(): Promise<void> {
  await Storage.removeItem(CLAVE_SOLO_ABIERTOS);
  await Storage.removeItem(CLAVE_RUBRO);
}
