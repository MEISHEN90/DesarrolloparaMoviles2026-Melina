import { Comercio, Promocion } from "../tipos/modelos";
import { obtenerBaseDatos } from "./base-datos";

export async function guardarComerciosCache(
  comercios: Comercio[],
): Promise<void> {
  const db = await obtenerBaseDatos();
  const actualizadoEn = new Date().toISOString();

  await db.withTransactionAsync(async () => {
    await db.runAsync("DELETE FROM comercios_cache");

    for (const comercio of comercios) {
      await db.runAsync(
        `
          INSERT INTO comercios_cache (
            id,
            datos,
            actualizado_en
          )
          VALUES (?, ?, ?)
        `,
        comercio.id,
        JSON.stringify(comercio),
        actualizadoEn,
      );
    }
  });
}

export async function obtenerComerciosCache(): Promise<Comercio[]> {
  const db = await obtenerBaseDatos();

  const filas = await db.getAllAsync<{
    datos: string;
  }>(
    `
      SELECT datos
      FROM comercios_cache
      ORDER BY actualizado_en DESC
    `,
  );

  return filas.map((fila) => JSON.parse(fila.datos) as Comercio);
}

export async function guardarPromocionesCache(
  promociones: Promocion[],
): Promise<void> {
  const db = await obtenerBaseDatos();
  const actualizadoEn = new Date().toISOString();

  await db.withTransactionAsync(async () => {
    await db.runAsync("DELETE FROM promociones_cache");

    for (const promocion of promociones) {
      await db.runAsync(
        `
          INSERT INTO promociones_cache (
            id,
            datos,
            actualizado_en
          )
          VALUES (?, ?, ?)
        `,
        promocion.id,
        JSON.stringify(promocion),
        actualizadoEn,
      );
    }
  });
}

export async function obtenerPromocionesCache(): Promise<Promocion[]> {
  const db = await obtenerBaseDatos();

  const filas = await db.getAllAsync<{
    datos: string;
  }>(
    `
      SELECT datos
      FROM promociones_cache
      ORDER BY actualizado_en DESC
    `,
  );

  return filas.map((fila) => JSON.parse(fila.datos) as Promocion);
}
