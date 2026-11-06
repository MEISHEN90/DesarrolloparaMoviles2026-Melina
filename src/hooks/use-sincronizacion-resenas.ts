import { useEffect, useRef } from "react";
import { AppState } from "react-native";

import { sincronizarResenasPendientes } from "../servicios/resenas";
import { useEstadoRed } from "./use-estado-red";

export function useSincronizacionResenas() {
  const estadoRed = useEstadoRed();
  const hayConexion = estadoRed.conectado && estadoRed.tieneInternet;
  const conexionAnterior = useRef<boolean | null>(null);

  useEffect(() => {
    if (!hayConexion) {
      conexionAnterior.current = false;
      return;
    }

    if (conexionAnterior.current !== true) {
      sincronizarResenasPendientes().catch(() => {});
    }

    conexionAnterior.current = true;
  }, [hayConexion]);

  useEffect(() => {
    const suscripcion = AppState.addEventListener("change", (estado) => {
      if (estado === "active") {
        sincronizarResenasPendientes().catch(() => {});
      }
    });

    return () => suscripcion.remove();
  }, []);
}
