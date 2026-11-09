interface Coordenadas {
  latitud: number;
  longitud: number;
}

const RADIO_TIERRA_KM = 6371;

function convertirARadianes(grados: number): number {
  return grados * (Math.PI / 180);
}

export function calcularDistanciaKm(
  origen: Coordenadas,
  destino: Coordenadas,
): number {
  const latitudOrigen = convertirARadianes(origen.latitud);

  const latitudDestino = convertirARadianes(destino.latitud);

  const diferenciaLatitud = convertirARadianes(
    destino.latitud - origen.latitud,
  );

  const diferenciaLongitud = convertirARadianes(
    destino.longitud - origen.longitud,
  );

  const a =
    Math.sin(diferenciaLatitud / 2) ** 2 +
    Math.cos(latitudOrigen) *
      Math.cos(latitudDestino) *
      Math.sin(diferenciaLongitud / 2) ** 2;

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return RADIO_TIERRA_KM * c;
}

export function formatearDistancia(distanciaKm: number): string {
  if (distanciaKm < 1) {
    return `${Math.round(distanciaKm * 1000)} m`;
  }

  return `${distanciaKm.toFixed(1)} km`;
}
