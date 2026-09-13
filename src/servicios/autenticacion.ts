import { usuariosMock } from "../mocks/usuarios";
import { Usuario } from "../tipos/modelos";

const RETARDO_SIMULADO = 500;

interface ResultadoLogin {
  usuario: Usuario;
  token: string;
}

interface DatosRegistro {
  nombre: string;
  email: string;
  password: string;
}

/*
 * Mientras trabajamos con mocks, guardamos temporalmente
 * las contraseñas en memoria.
 *
 * Los usuarios iniciales de usuariosMock usan "123456".
 * Los usuarios registrados durante la ejecución conservan
 * la contraseña que eligieron.
 *
 * Más adelante esto será reemplazado por la API real.
 */
const credencialesMock = new Map<string, string>();

for (const usuario of usuariosMock) {
  credencialesMock.set(usuario.id, "123456");
}

function esperar(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function normalizarEmail(email: string): string {
  return email.trim().toLowerCase();
}

export async function iniciarSesion(
  email: string,
  password: string,
): Promise<ResultadoLogin> {
  await esperar(RETARDO_SIMULADO);

  const emailNormalizado = normalizarEmail(email);

  const usuario = usuariosMock.find(
    (item) => normalizarEmail(item.email) === emailNormalizado,
  );

  if (!usuario) {
    throw new Error("Credenciales inválidas.");
  }

  const passwordGuardada = credencialesMock.get(usuario.id);

  if (!passwordGuardada || password !== passwordGuardada) {
    throw new Error("Credenciales inválidas.");
  }

  return {
    usuario,
    token: `token-${usuario.id}`,
  };
}

export async function registrarUsuario(
  datos: DatosRegistro,
): Promise<ResultadoLogin> {
  await esperar(RETARDO_SIMULADO);

  const nombre = datos.nombre.trim();
  const email = normalizarEmail(datos.email);
  const password = datos.password;

  if (!nombre || !email || !password.trim()) {
    throw new Error("Debe completar todos los campos.");
  }

  if (password.length < 6) {
    throw new Error("La contraseña debe tener al menos 6 caracteres.");
  }

  const emailYaRegistrado = usuariosMock.some(
    (item) => normalizarEmail(item.email) === email,
  );

  if (emailYaRegistrado) {
    throw new Error("Ya existe una cuenta con ese correo electrónico.");
  }

  const nuevoUsuario: Usuario = {
    id: `usr-${Date.now()}`,
    nombre,
    email,
    rol: "vecino",
    comercioId: null,
    favoritos: [],
    rubrosDeInteres: [],
    avisosActivos: true,
  };

  usuariosMock.push(nuevoUsuario);

  credencialesMock.set(nuevoUsuario.id, password);

  return {
    usuario: nuevoUsuario,
    token: `token-${nuevoUsuario.id}`,
  };
}

export async function obtenerUsuarioPorId(id: string): Promise<Usuario | null> {
  await esperar(RETARDO_SIMULADO);

  const usuario = usuariosMock.find((item) => item.id === id);

  return usuario ?? null;
}
