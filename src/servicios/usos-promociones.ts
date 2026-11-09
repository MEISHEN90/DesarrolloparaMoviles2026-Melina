import { UsoDePromocion } from "../tipos/modelos";
import { obtenerBaseDatos } from "./base-datos";

export async function registrarUsoPromocion(
  promocionId: string,
  usuarioId: string,
  codigo: string,
): Promise<UsoDePromocion> {
  const db = await obtenerBaseDatos();

  const usoExistente = await db.getFirstAsync<UsoDePromocion>(
    `
      SELECT
        id,
        promocion_id AS promocionId,
        usuario_id AS usuarioId,
        codigo,
        validado_en AS validadoEn
      FROM usos_promociones
      WHERE promocion_id = ? AND usuario_id = ?
      LIMIT 1
    `,
    promocionId,
    usuarioId,
  );

  if (usoExistente) {
    throw new Error("Esta promoción ya fue utilizada por este usuario.");
  }

  const nuevoUso: UsoDePromocion = {
    id: `uso-${Date.now()}`,
    promocionId,
    usuarioId,
    codigo,
    validadoEn: new Date().toISOString(),
  };

  await db.runAsync(
    `
      INSERT INTO usos_promociones (
        id,
        promocion_id,
        usuario_id,
        codigo,
        validado_en
      )
      VALUES (?, ?, ?, ?, ?)
    `,
    nuevoUso.id,
    nuevoUso.promocionId,
    nuevoUso.usuarioId,
    nuevoUso.codigo,
    nuevoUso.validadoEn,
  );

  return nuevoUso;
}

export async function obtenerUsosPromocion(): Promise<UsoDePromocion[]> {
  const db = await obtenerBaseDatos();

  return db.getAllAsync<UsoDePromocion>(
    `
      SELECT
        id,
        promocion_id AS promocionId,
        usuario_id AS usuarioId,
        codigo,
        validado_en AS validadoEn
      FROM usos_promociones
      ORDER BY validado_en DESC
    `,
  );
}

export async function promocionYaUtilizada(
  promocionId: string,
  usuarioId: string,
): Promise<boolean> {
  const db = await obtenerBaseDatos();

  const resultado = await db.getFirstAsync<{ cantidad: number }>(
    `
      SELECT COUNT(*) AS cantidad
      FROM usos_promociones
      WHERE promocion_id = ? AND usuario_id = ?
    `,
    promocionId,
    usuarioId,
  );

  return (resultado?.cantidad ?? 0) > 0;
}
