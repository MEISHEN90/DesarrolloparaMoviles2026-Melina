import * as Network from "expo-network";

export interface EstadoRed {
  conectado: boolean;
  tieneInternet: boolean;
}

export async function obtenerEstadoRed(): Promise<EstadoRed> {
  const estado = await Network.getNetworkStateAsync();

  return {
    conectado: estado.isConnected ?? false,
    tieneInternet: estado.isInternetReachable ?? false,
  };
}
