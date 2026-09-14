import { useEffect, useState } from "react";

import { EstadoRed, obtenerEstadoRed } from "../servicios/red";

const ESTADO_INICIAL: EstadoRed = {
  conectado: true,
  tieneInternet: true,
};

export function useEstadoRed() {
  const [estadoRed, setEstadoRed] = useState<EstadoRed>(ESTADO_INICIAL);

  useEffect(() => {
    let activo = true;

    async function actualizarEstado() {
      try {
        const estado = await obtenerEstadoRed();

        if (activo) {
          setEstadoRed(estado);
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

    actualizarEstado();

    const intervalo = setInterval(actualizarEstado, 5000);

    return () => {
      activo = false;
      clearInterval(intervalo);
    };
  }, []);

  return estadoRed;
}
