import * as Network from "expo-network";
import { useEffect, useState } from "react";

import { EstadoRed } from "../servicios/red";

const ESTADO_INICIAL: EstadoRed = {
  conectado: true,
  tieneInternet: true,
};

function convertirEstado(estado: Network.NetworkState): EstadoRed {
  const conectado = estado.isConnected ?? false;

  return {
    conectado,
    tieneInternet: estado.isInternetReachable ?? conectado,
  };
}

export function useEstadoRed() {
  const [estadoRed, setEstadoRed] = useState<EstadoRed>(ESTADO_INICIAL);

  useEffect(() => {
    let activo = true;

    async function cargarEstadoInicial() {
      try {
        const estado = await Network.getNetworkStateAsync();

        if (activo) {
          setEstadoRed(convertirEstado(estado));
        }
      } catch {
        if (activo) {
          setEstadoRed({
            conectado: false,
            tieneInternet: false,
          });
        }
      }
    }

    cargarEstadoInicial();

    const suscripcion = Network.addNetworkStateListener((estado) => {
      if (activo) {
        setEstadoRed(convertirEstado(estado));
      }
    });

    return () => {
      activo = false;
      suscripcion.remove();
    };
  }, []);

  return estadoRed;
}
