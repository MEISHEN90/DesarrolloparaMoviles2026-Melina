import Constants from "expo-constants";

import { obtenerTokenSesion } from "./sesion";

/*
 * Cliente HTTP de la API de la cátedra.
 * Toda respuesta viene en un sobre:
 *   éxito  → { datos: ..., meta: ... | null }
 *   error  → { error: { codigo, mensaje } }
 * pedir() devuelve sólo los `datos` y lanza ErrorApi con el código y el
 * mensaje del sobre de error (el mensaje está pensado para mostrarse tal cual).
 */

const URL_BASE =
  process.env.EXPO_PUBLIC_API_URL ??
  Constants.expoConfig?.extra?.apiUrl ??
  "http://10.0.2.2:3000";

export class ErrorApi extends Error {
  codigo: string;

  constructor(codigo: string, mensaje: string) {
    super(mensaje);

    this.codigo = codigo;
    this.name = "ErrorApi";
  }
}

/** Error de red: no se pudo llegar a la API (sin conexión, API caída). */
export class ErrorRed extends Error {
  constructor() {
    super("Sin conexión a internet.");

    this.name = "ErrorRed";
  }
}

interface OpcionesPedido {
  metodo?: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
  cuerpo?: unknown;
  /** Agrega Authorization: Bearer <token> si hay sesión. */
  conSesion?: boolean;
}

export async function pedir<T>(
  ruta: string,
  opciones: OpcionesPedido = {},
): Promise<T> {
  const cabeceras: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (opciones.conSesion) {
    const token = await obtenerTokenSesion();

    if (token) {
      cabeceras.Authorization = `Bearer ${token}`;
    }
  }

  let respuesta: Response;

  try {
    respuesta = await fetch(`${URL_BASE}${ruta}`, {
      method: opciones.metodo ?? "GET",
      headers: cabeceras,
      body:
        opciones.cuerpo === undefined
          ? undefined
          : JSON.stringify(opciones.cuerpo),
    });
  } catch {
    throw new ErrorRed();
  }

  if (respuesta.status === 204) {
    return undefined as T;
  }

  const sobre = (await respuesta.json().catch(() => null)) as
    | { datos: T; meta: unknown }
    | { error: { codigo: string; mensaje: string } }
    | null;

  if (!sobre) {
    throw new ErrorApi(
      "RESPUESTA_INVALIDA",
      "La respuesta de la API no es válida.",
    );
  }

  if ("error" in sobre) {
    throw new ErrorApi(sobre.error.codigo, sobre.error.mensaje);
  }

  return sobre.datos;
}
