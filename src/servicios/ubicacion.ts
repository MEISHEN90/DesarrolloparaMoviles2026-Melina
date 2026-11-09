import * as Location from "expo-location";

export interface UbicacionUsuario {
  latitud: number;
  longitud: number;
}

const TIEMPO_MAXIMO_UBICACION = 5000;

export async function solicitarPermisoUbicacion(): Promise<boolean> {
  const resultado = await Location.requestForegroundPermissionsAsync();

  return resultado.status === "granted";
}

function esperarTimeout(): Promise<null> {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(null);
    }, TIEMPO_MAXIMO_UBICACION);
  });
}

export async function obtenerUbicacionActual(): Promise<UbicacionUsuario | null> {
  const permisoConcedido = await solicitarPermisoUbicacion();

  if (!permisoConcedido) {
    return null;
  }

  const ultimaUbicacion = await Location.getLastKnownPositionAsync();

  if (ultimaUbicacion) {
    return {
      latitud: ultimaUbicacion.coords.latitude,
      longitud: ultimaUbicacion.coords.longitude,
    };
  }

  const ubicacion = await Promise.race([
    Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    }),
    esperarTimeout(),
  ]);

  if (!ubicacion) {
    return null;
  }

  return {
    latitud: ubicacion.coords.latitude,
    longitud: ubicacion.coords.longitude,
  };
}
