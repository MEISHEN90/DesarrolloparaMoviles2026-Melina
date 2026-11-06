import { pedir, ErrorApi, ErrorRed } from "./api";
import { obtenerBaseDatos } from "./base-datos";
import { obtenerUsuarioSesionId } from "./sesion";
import { Resena } from "../tipos/modelos";
import { ordenarResenas, calcularPromedio } from "../utils/resenas";

interface FilaResenaLocal {
  id: string;
  comercio_id: string;
  usuario_id: string;
  estrellas: number;
  comentario: string;
  respuesta: string | null;
  reportada: number;
  creada_en: string;
  sincronizada: number;
}

function aResena(fila: FilaResenaLocal): Resena {
  const estrellas = Math.min(5, Math.max(1, fila.estrellas)) as 1 | 2 | 3 | 4 | 5;

  return {
    id: fila.id,
    comercioId: fila.comercio_id,
    usuarioId: fila.usuario_id,
    estrellas,
    comentario: fila.comentario,
    respuesta: fila.respuesta,
    reportada: Boolean(fila.reportada),
    creadaEn: fila.creada_en,
    sincronizada: Boolean(fila.sincronizada),
  };
}

function generarIdLocal(): string {
  return `res-l${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
}

async function leerLocales(comercioId: string): Promise<Resena[]> {
  const db = await obtenerBaseDatos();
  const filas = await db.getAllAsync<FilaResenaLocal>(
    "SELECT * FROM resenas_locales WHERE comercio_id = ?",
    comercioId,
  );
  return filas.map(aResena);
}

async function insertarLocal(resena: Resena): Promise<void> {
  const db = await obtenerBaseDatos();
  await db.runAsync(
    `INSERT OR REPLACE INTO resenas_locales
      (id, comercio_id, usuario_id, estrellas, comentario, respuesta, reportada, creada_en, sincronizada)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    resena.id,
    resena.comercioId,
    resena.usuarioId,
    resena.estrellas,
    resena.comentario,
    resena.respuesta,
    resena.reportada ? 1 : 0,
    resena.creadaEn,
    resena.sincronizada ? 1 : 0,
  );
}

async function borrarLocal(id: string): Promise<void> {
  const db = await obtenerBaseDatos();
  await db.runAsync("DELETE FROM resenas_locales WHERE id = ?", id);
}

async function marcarSincronizada(id: string): Promise<void> {
  const db = await obtenerBaseDatos();
  await db.runAsync("UPDATE resenas_locales SET sincronizada = 1 WHERE id = ?", id);
}

async function guardarCache(comercioId: string, resenas: Resena[]): Promise<void> {
  const db = await obtenerBaseDatos();
  const actualizadoEn = new Date().toISOString();

  await db.withTransactionAsync(async () => {
    await db.runAsync("DELETE FROM resenas_cache WHERE comercio_id = ?", comercioId);

    for (const resena of resenas) {
      await db.runAsync(
        `INSERT OR REPLACE INTO resenas_cache (id, comercio_id, datos, actualizado_en)
         VALUES (?, ?, ?, ?)`,
        resena.id,
        comercioId,
        JSON.stringify(resena),
        actualizadoEn,
      );
    }
  });
}

async function leerCache(comercioId: string): Promise<Resena[]> {
  const db = await obtenerBaseDatos();
  const filas = await db.getAllAsync<{ datos: string }>(
    "SELECT datos FROM resenas_cache WHERE comercio_id = ?",
    comercioId,
  );
  return filas.map((fila) => JSON.parse(fila.datos) as Resena);
}

async function quitarDelCache(id: string): Promise<void> {
  const db = await obtenerBaseDatos();
  await db.runAsync("DELETE FROM resenas_cache WHERE id = ?", id);
}

export async function obtenerResenasPorComercio(
  comercioId: string,
): Promise<{ resenas: Resena[]; desdeCache: boolean }> {
  let delServidor: Resena[];
  let desdeCache = false;

  try {
    delServidor = await pedir<Resena[]>(
      `/comercios/${comercioId}/resenas?porPagina=100`,
    );
    await guardarCache(comercioId, delServidor);
  } catch {
    desdeCache = true;
    delServidor = await leerCache(comercioId);
    const localesEnEspera = await leerLocales(comercioId);

    if (delServidor.length === 0 && localesEnEspera.length === 0) {
      throw new Error("No se pudieron cargar las reseñas.");
    }
  }

  const locales = await leerLocales(comercioId);
  const idsServidor = new Set(delServidor.map((resena) => resena.id));
  const pendientes = locales.filter(
    (resena) => !resena.sincronizada && !idsServidor.has(resena.id),
  );

  return {
    resenas: ordenarResenas(
      [...delServidor, ...pendientes].filter((resena) => !resena.reportada),
    ),
    desdeCache,
  };
}

export async function obtenerPromedioResenas(
  comercioId: string,
): Promise<number> {
  const { resenas } = await obtenerResenasPorComercio(comercioId);
  return calcularPromedio(resenas);
}

export async function obtenerCantidadResenas(
  comercioId: string,
): Promise<number> {
  const { resenas } = await obtenerResenasPorComercio(comercioId);
  return resenas.length;
}

export async function crearResena(
  comercioId: string,
  estrellas: 1 | 2 | 3 | 4 | 5,
  comentario: string,
): Promise<Resena> {
  const usuarioId = await obtenerUsuarioSesionId();

  if (!usuarioId) {
    throw new Error("Necesitás iniciar sesión para dejar una reseña.");
  }

  const resena: Resena = {
    id: generarIdLocal(),
    comercioId,
    usuarioId,
    estrellas,
    comentario: comentario.trim(),
    respuesta: null,
    reportada: false,
    creadaEn: new Date().toISOString(),
    sincronizada: false,
  };

  await insertarLocal(resena);

  try {
    await pedir(`/comercios/${comercioId}/resenas`, {
      metodo: "POST",
      conSesion: true,
      cuerpo: {
        id: resena.id,
        estrellas,
        comentario: resena.comentario,
        creadaEn: resena.creadaEn,
      },
    });

    await marcarSincronizada(resena.id);
    return { ...resena, sincronizada: true };
  } catch (error) {
    if (error instanceof ErrorRed) {
      return resena;
    }

    if (error instanceof ErrorApi && error.codigo === "RESENA_YA_EXISTE") {
      await borrarLocal(resena.id);
      throw error;
    }

    await borrarLocal(resena.id);
    throw error;
  }
}

export async function editarResena(
  id: string,
  estrellas: 1 | 2 | 3 | 4 | 5,
  comentario: string,
): Promise<void> {
  const db = await obtenerBaseDatos();
  const fila = await db.getFirstAsync<FilaResenaLocal>(
    "SELECT * FROM resenas_locales WHERE id = ?",
    id,
  );

  if (fila && !fila.sincronizada) {
    await db.runAsync(
      "UPDATE resenas_locales SET estrellas = ?, comentario = ? WHERE id = ?",
      estrellas,
      comentario.trim(),
      id,
    );
    return;
  }

  await pedir(`/resenas/${id}`, {
    metodo: "PATCH",
    conSesion: true,
    cuerpo: { estrellas, comentario: comentario.trim() },
  });

  if (fila) {
    await db.runAsync(
      "UPDATE resenas_locales SET estrellas = ?, comentario = ? WHERE id = ?",
      estrellas,
      comentario.trim(),
      id,
    );
  }
}

export async function borrarResena(id: string): Promise<void> {
  const db = await obtenerBaseDatos();
  const fila = await db.getFirstAsync<FilaResenaLocal>(
    "SELECT * FROM resenas_locales WHERE id = ?",
    id,
  );

  if (fila && !fila.sincronizada) {
    await borrarLocal(id);
    return;
  }

  await pedir(`/resenas/${id}`, { metodo: "DELETE", conSesion: true });

  if (fila) {
    await borrarLocal(id);
  }

  await quitarDelCache(id);
}

export async function reportarResena(id: string): Promise<void> {
  await pedir(`/resenas/${id}/reportes`, { metodo: "POST", conSesion: true });
  await quitarDelCache(id);
}

export async function responderResena(id: string, texto: string): Promise<void> {
  await pedir(`/resenas/${id}/respuesta`, {
    metodo: "POST",
    conSesion: true,
    cuerpo: { respuesta: texto.trim() },
  });

  await quitarDelCache(id);
}

export async function sincronizarResenasPendientes(): Promise<number> {
  const db = await obtenerBaseDatos();
  const filas = await db.getAllAsync<FilaResenaLocal>(
    "SELECT * FROM resenas_locales WHERE sincronizada = 0",
  );

  let subidas = 0;

  for (const fila of filas) {
    try {
      await pedir(`/comercios/${fila.comercio_id}/resenas`, {
        metodo: "POST",
        conSesion: true,
        cuerpo: {
          id: fila.id,
          estrellas: aResena(fila).estrellas,
          comentario: fila.comentario,
          creadaEn: fila.creada_en,
        },
      });

      await marcarSincronizada(fila.id);
      subidas += 1;
    } catch (error) {
      if (error instanceof ErrorApi && error.codigo === "RESENA_YA_EXISTE") {
        await borrarLocal(fila.id);
        continue;
      }
    }
  }

  return subidas;
}
