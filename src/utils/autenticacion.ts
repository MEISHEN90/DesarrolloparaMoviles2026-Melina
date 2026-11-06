import { Usuario } from "../tipos/modelos";

const FORMATO_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const LARGO_MINIMO_CONTRASENA = 8;
export const LARGO_MAXIMO_CONTRASENA = 100;

export function validarIngreso(
  email: string,
  contrasena: string,
): string | null {
  if (email.trim().length === 0) {
    return "Falta el email.";
  }

  if (contrasena.length === 0) {
    return "Falta la contraseña.";
  }

  return null;
}

export function validarRegistro(
  nombre: string,
  email: string,
  contrasena: string,
  confirmacion: string,
): string | null {
  const nombreLimpio = nombre.trim();

  if (nombreLimpio.length === 0) {
    return "Falta tu nombre.";
  }

  if (nombreLimpio.length > 80) {
    return "El nombre tiene que tener entre 1 y 80 letras.";
  }

  const emailLimpio = email.trim();

  if (emailLimpio.length === 0) {
    return "Falta el email.";
  }

  if (emailLimpio.length > 254 || !FORMATO_EMAIL.test(emailLimpio)) {
    return "El email no es válido.";
  }

  if (contrasena.length < LARGO_MINIMO_CONTRASENA) {
    return `La contraseña tiene que tener al menos ${LARGO_MINIMO_CONTRASENA} caracteres.`;
  }

  if (contrasena.length > LARGO_MAXIMO_CONTRASENA) {
    return `La contraseña puede tener como máximo ${LARGO_MAXIMO_CONTRASENA} caracteres.`;
  }

  if (contrasena !== confirmacion) {
    return "Las contraseñas no coinciden.";
  }

  return null;
}

export type AccesoEscaneo = "permitido" | "sin-sesion" | "no-comercio";

export function decidirAccesoEscaneo(usuario: Usuario | null): AccesoEscaneo {
  if (!usuario) {
    return "sin-sesion";
  }

  return usuario.rol === "comercio" ? "permitido" : "no-comercio";
}
