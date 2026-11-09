import { useEffect, useRef } from "react";
import { AppState } from "react-native";

import { revisarAvisosDePromociones } from "../servicios/avisos";
import { useEstadoRed } from "./use-estado-red";

/*
 * Revisa si hay avisos de promociones que disparar (nuevas de favoritos /
 * rubros de interés, o por vencer de favoritos) cuando:
 *   1. la app arranca con conexión, y
 *   2. vuelve a primer plano (AppState → "active").
 *
 * Con un mínimo de 5 minutos entre revisiones para no pedir el listado
 * cada vez que el usuario alterna entre apps. Sin sesión o sin avisos
 * activos, revisarAvisosDePromociones no hace nada.
 */

const MS_ENTRE_REVISIONES = 5 * 60 * 1000;

export function useAvisosPromociones() {
  const estadoRed = useEstadoRed();

  const hayConexion = estadoRed.conectado && estadoRed.tieneInternet;

  const ultimaRevision = useRef(0);

  useEffect(() => {
    if (!hayConexion) {
      return;
    }

    const ahora = Date.now();

    if (ahora - ultimaRevision.current < MS_ENTRE_REVISIONES) {
      return;
    }

    ultimaRevision.current = ahora;

    revisarAvisosDePromociones().catch(() => {});
  }, [hayConexion]);

  useEffect(() => {
    const suscripcion = AppState.addEventListener("change", (estado) => {
      if (estado !== "active" || !hayConexion) {
        return;
      }

      const ahora = Date.now();

      if (ahora - ultimaRevision.current < MS_ENTRE_REVISIONES) {
        return;
      }

      ultimaRevision.current = ahora;

      revisarAvisosDePromociones().catch(() => {});
    });

    return () => suscripcion.remove();
  }, [hayConexion]);
}
