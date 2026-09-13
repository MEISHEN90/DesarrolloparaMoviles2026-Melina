import {
    calcularDistanciaKm,
    formatearDistancia,
} from "../src/utils/distancias";

describe("utilidades de distancia", () => {
  test("devuelve cero cuando origen y destino son iguales", () => {
    const punto = {
      latitud: -32.484,
      longitud: -58.231,
    };

    const distancia = calcularDistanciaKm(punto, punto);

    expect(distancia).toBeCloseTo(0, 5);
  });

  test("calcula una distancia positiva entre dos puntos distintos", () => {
    const origen = {
      latitud: -32.484,
      longitud: -58.231,
    };

    const destino = {
      latitud: -32.4846,
      longitud: -58.2322,
    };

    const distancia = calcularDistanciaKm(origen, destino);

    expect(distancia).toBeGreaterThan(0);
    expect(distancia).toBeLessThan(1);
  });

  test("formatea distancias menores a un kilometro en metros", () => {
    expect(formatearDistancia(0.25)).toBe("250 m");
  });

  test("formatea distancias mayores a un kilometro en kilometros", () => {
    expect(formatearDistancia(1.24)).toBe("1.2 km");
  });
});
