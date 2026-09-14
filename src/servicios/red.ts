import * as Network from "expo-network";

export interface EstadoRed {
  conectado: boolean;
  tieneInternet: boolean;
}

export async function obtenerEstadoRed(): Promise<EstadoRed> {
  const estado = await Network.getNetworkStateAsync();

  const conectado = estado.isConnected ?? false;

  return {
    conectado,
    tieneInternet: estado.isInternetReachable ?? conectado,
  };
}
