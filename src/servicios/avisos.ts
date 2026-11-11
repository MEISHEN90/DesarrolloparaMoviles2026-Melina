import * as Notifications from "expo-notifications";
import { SchedulableTriggerInputTypes } from "expo-notifications";
import Storage from "expo-sqlite/kv-store";

import { obtenerUsuarioActual } from "./autenticacion";
import { obtenerComerciosCache } from "./cache";
import { obtenerPromociones } from "./promociones";
import {
  estaPorVencer,
  filtrarPromocionesDeInteres,
} from "../utils/promociones";

/*
 * Avisos de promociones como NOTIFICACIONES LOCALES (decisión C6 de la
 * cátedra: los recordatorios son locales del teléfono).
 *
 * Como el envío push del servidor (M10) no está implementado, el aviso de
 * "promo nueva" se genera cuando la app revisa el listado vigente y
 * detecta promociones que no conocía, filtradas por los favoritos y los
 * rubros de interés del usuario. Cubre el mismo comportamiento visible
 * del PRD sin tocar la API.
 *
 * Reglas:
 * - Sólo avisa con sesión activa y avisosActivos en true.
 * - La primera revisión SÓLO siembra las promociones conocidas: si no,
 *   la primera instalación notificaría todo el listado de golpe.
 * - Cada aviso se dispara una sola vez (ids ya notificados en kv-store).
 * - Máximo 3 avisos de nuevas y 2 de por vencer por revisión, para no
 *   llenar la barra del usuario.
 */

const CLAVE_CONOCIDAS = "avisos-promociones-conocidas";
const CLAVE_POR_VENCER_ENVIADAS = "avisos-por-vencer-enviadas";

const MAX_AVISOS_NUEVAS = 3;
const MAX_AVISOS_POR_VENCER = 2;

async function leerIds(clave: string): Promise<string[] | null> {
  try {
    const valor = await Storage.getItem(clave);

    return valor ? (JSON.parse(valor) as string[]) : null;
  } catch {
    return null;
  }
}

async function guardarIds(clave: string, ids: string[]): Promise<void> {
  await Storage.setItem(clave, JSON.stringify(ids));
}

async function notificar(titulo: string, cuerpo: string): Promise<void> {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: titulo,
      body: cuerpo,
    },
    trigger: {
      type: SchedulableTriggerInputTypes.DATE,
      date: new Date(Date.now() + 1000),
      channelId: "promociones",
    },
  });
}

/**
 * Revisa el listado vigente y dispara los avisos que correspondan.
 * Devuelve cuántas notificaciones envió.
 */
export async function revisarAvisosDePromociones(): Promise<number> {
  const usuario = await obtenerUsuarioActual();

  if (!usuario || !usuario.avisosActivos) {
    return 0;
  }

  const vigentes = await obtenerPromociones();

  const idsVigentes = vigentes.map((promocion) => promocion.id);

  const conocidasAntes = await leerIds(CLAVE_CONOCIDAS);

  // Primera vez: sembrar sin notificar nada.
  if (conocidasAntes === null) {
    await guardarIds(CLAVE_CONOCIDAS, idsVigentes);

    return 0;
  }

  let avisos = 0;

  const comercios = await obtenerComerciosCache().catch(() => []);

  const rubroPorComercio = new Map(
    comercios.map((comercio) => [comercio.id, comercio.rubroId]),
  );

  const nombrePorComercio = new Map(
    comercios.map((comercio) => [comercio.id, comercio.nombre]),
  );

  // --- Promo nueva de un favorito o de un rubro de interés ---
  const conocidas = new Set(conocidasAntes);

  const nuevas = vigentes.filter(
    (promocion) => !conocidas.has(promocion.id),
  );

  if (nuevas.length > 0) {
    const deInteres = filtrarPromocionesDeInteres(
      nuevas,
      usuario.favoritos,
      usuario.rubrosDeInteres,
      rubroPorComercio,
    ).slice(0, MAX_AVISOS_NUEVAS);

    for (const promocion of deInteres) {
      const comercio = nombrePorComercio.get(promocion.comercioId) ?? "un comercio";

      await notificar(
        "Nueva promoción",
        `${promocion.titulo} — ${comercio}`,
      );

      avisos += 1;
    }
  }

  // --- Recordatorio: promo de un favorito que está por vencer ---
  const enviadas = new Set((await leerIds(CLAVE_POR_VENCER_ENVIADAS)) ?? []);

  const porVencer = vigentes
    .filter(
      (promocion) =>
        estaPorVencer(promocion.hasta, new Date()) &&
        usuario.favoritos.includes(promocion.comercioId) &&
        !enviadas.has(promocion.id),
    )
    .slice(0, MAX_AVISOS_POR_VENCER);

  for (const promocion of porVencer) {
    const comercio = nombrePorComercio.get(promocion.comercioId) ?? "tu comercio favorito";

    await notificar(
      "Tu promoción está por vencer",
      `${promocion.titulo} (${comercio}) vence el ${new Date(promocion.hasta).toLocaleDateString("es-AR")}.`,
    );

    enviadas.add(promocion.id);

    avisos += 1;
  }

  await guardarIds(CLAVE_POR_VENCER_ENVIADAS, [...enviadas]);
  await guardarIds(CLAVE_CONOCIDAS, idsVigentes);

  return avisos;
}
