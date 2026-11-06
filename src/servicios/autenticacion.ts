import { ErrorApi, pedir } from "./api";
import { cerrarSesion } from "./sesion";
import { usuariosMock } from "../mocks/usuarios";
import { Usuario } from "../tipos/modelos";

interface ResultadoLogin {
  usuario: Usuario;
  token: string;
}

interface DatosRegistro {
  nombre: string;
  email: string;
  password: string;
}

interface RespuestaSesion {
  token: string;
  usuario: Usuario;
}

function normalizarEmail(email: string): string {
  return email.trim().toLowerCase();
}

export async function iniciarSesion(
  email: string,
  password: string,
): Promise<ResultadoLogin> {
  const datos = await pedir<RespuestaSesion>("/auth/ingreso", {
    metodo: "POST",
    cuerpo: {
      email: normalizarEmail(email),
      contrasena: password,
    },
  });

  return { usuario: datos.usuario, token: datos.token };
}

export async function registrarUsuario(
  datos: DatosRegistro,
): Promise<ResultadoLogin> {
  const respuesta = await pedir<RespuestaSesion>("/auth/registro", {
    metodo: "POST",
    cuerpo: {
      nombre: datos.nombre.trim(),
      email: normalizarEmail(datos.email),
      contrasena: datos.password,
    },
  });

  return { usuario: respuesta.usuario, token: respuesta.token };
}

export async function obtenerUsuarioActual(): Promise<Usuario | null> {
  try {
    return await pedir<Usuario>("/yo", { conSesion: true });
  } catch (error) {
    if (error instanceof ErrorApi && error.codigo === "NO_AUTENTICADO") {
      await cerrarSesion();
    }

    return null;
  }
}

export async function obtenerUsuarioPorId(id: string): Promise<Usuario | null> {
  return usuariosMock.find((usuario) => usuario.id === id) ?? null;
}
