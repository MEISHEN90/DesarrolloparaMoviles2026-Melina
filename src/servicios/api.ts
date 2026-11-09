import axios from "axios";
import Constants from "expo-constants";

import { obtenerTokenSesion } from "./sesion";

/*
 * Cliente HTTP de la API de la cátedra, construido sobre axios.
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

export function obtenerUrlBaseApi(): string {
  return URL_BASE;
}

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

interface SobreError {
  error: {
    codigo: string;
    mensaje: string;
  };
}

function esSobreError(cuerpo: unknown): cuerpo is SobreError {
  return (
    typeof cuerpo === "object" &&
    cuerpo !== null &&
    "error" in cuerpo &&
    typeof (cuerpo as SobreError).error?.mensaje === "string"
  );
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

  let respuesta;

  try {
    respuesta = await axios.request<unknown>({
      url: `${URL_BASE}${ruta}`,
      method: opciones.metodo ?? "GET",
      headers: cabeceras,
      data: opciones.cuerpo,
      // Los estados de error los decide el sobre de la API, no axios:
      // un 4xx con { error } se maneja igual que cualquier respuesta.
      validateStatus: () => true,
    });
  } catch {
    // axios sólo entra acá si falló la conexión (sin respuesta del servidor).
    throw new ErrorRed();
  }

  // Un DELETE exitoso responde 204 sin cuerpo.
  if (respuesta.status === 204) {
    return undefined as T;
  }

  const sobre = respuesta.data;

  if (esSobreError(sobre)) {
    throw new ErrorApi(sobre.error.codigo, sobre.error.mensaje);
  }

  if (respuesta.status >= 400 || !esSobreDatos(sobre)) {
    throw new ErrorApi(
      "RESPUESTA_INVALIDA",
      "La respuesta de la API no es válida.",
    );
  }

  return (sobre as { datos: T }).datos;
}

function esSobreDatos(cuerpo: unknown): boolean {
  return typeof cuerpo === "object" && cuerpo !== null && "datos" in cuerpo;
}
