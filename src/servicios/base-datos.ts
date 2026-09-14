import * as SQLite from "expo-sqlite";

let baseDatos: SQLite.SQLiteDatabase | null = null;

export async function obtenerBaseDatos(): Promise<SQLite.SQLiteDatabase> {
  if (baseDatos) {
    return baseDatos;
  }

  baseDatos = await SQLite.openDatabaseAsync("directorio-comercios.db");

  return baseDatos;
}

export async function inicializarBaseDatos(): Promise<void> {
  const db = await obtenerBaseDatos();

  await db.execAsync(`
    PRAGMA journal_mode = WAL;

    CREATE TABLE IF NOT EXISTS usos_promociones (
      id TEXT PRIMARY KEY NOT NULL,
      promocion_id TEXT NOT NULL,
      usuario_id TEXT NOT NULL,
      codigo TEXT NOT NULL,
      validado_en TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS preferencias (
      clave TEXT PRIMARY KEY NOT NULL,
      valor TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS comercios_cache (
      id TEXT PRIMARY KEY NOT NULL,
      datos TEXT NOT NULL,
      actualizado_en TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS promociones_cache (
      id TEXT PRIMARY KEY NOT NULL,
      datos TEXT NOT NULL,
      actualizado_en TEXT NOT NULL
    );
  `);
}
