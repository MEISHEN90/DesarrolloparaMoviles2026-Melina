import { router } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import MapView, { Marker, Region } from "react-native-maps";

import { obtenerComercios } from "../../src/servicios/comercios";
import {
  obtenerUbicacionActual,
  UbicacionUsuario,
} from "../../src/servicios/ubicacion";
import { Comercio } from "../../src/tipos/modelos";
import {
  calcularDistanciaKm,
  formatearDistancia,
} from "../../src/utils/distancias";

const REGION_CONCEPCION: Region = {
  latitude: -32.484,
  longitude: -58.231,
  latitudeDelta: 0.03,
  longitudeDelta: 0.03,
};

interface ComercioConDistancia {
  comercio: Comercio;
  distanciaKm: number;
}

export default function MapaScreen() {
  const [comercios, setComercios] = useState<Comercio[]>([]);

  const [ubicacionUsuario, setUbicacionUsuario] =
    useState<UbicacionUsuario | null>(null);

  const [permisoDenegado, setPermisoDenegado] = useState(false);

  const [cargando, setCargando] = useState(true);

  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function cargarMapa() {
      try {
        setCargando(true);
        setError(null);
        setPermisoDenegado(false);

        const comerciosObtenidos = await obtenerComercios();

        setComercios(comerciosObtenidos);

        const ubicacion = await obtenerUbicacionActual();

        if (!ubicacion) {
          setPermisoDenegado(true);
          return;
        }

        setUbicacionUsuario(ubicacion);
      } catch {
        setError("No fue posible cargar la información del mapa.");
      } finally {
        setCargando(false);
      }
    }

    cargarMapa();
  }, []);

  const comerciosCercanos = useMemo<ComercioConDistancia[]>(() => {
    if (!ubicacionUsuario) {
      return [];
    }

    return comercios
      .map((comercio) => ({
        comercio,
        distanciaKm: calcularDistanciaKm(
          ubicacionUsuario,
          comercio.coordenadas,
        ),
      }))
      .sort((a, b) => a.distanciaKm - b.distanciaKm);
  }, [comercios, ubicacionUsuario]);

  if (cargando) {
    return (
      <View style={styles.estadoContainer}>
        <ActivityIndicator size="large" />

        <Text style={styles.estadoTexto}>Cargando mapa...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.estadoContainer}>
        <Text style={styles.error}>{error}</Text>
      </View>
    );
  }

  const regionInicial: Region = ubicacionUsuario
    ? {
        latitude: ubicacionUsuario.latitud,
        longitude: ubicacionUsuario.longitud,
        latitudeDelta: 0.02,
        longitudeDelta: 0.02,
      }
    : REGION_CONCEPCION;

  return (
    <View style={styles.container}>
      <MapView
        style={styles.mapa}
        initialRegion={regionInicial}
        showsUserLocation={ubicacionUsuario !== null}
        showsMyLocationButton={ubicacionUsuario !== null}
      >
        {comercios.map((comercio) => (
          <Marker
            key={comercio.id}
            coordinate={{
              latitude: comercio.coordenadas.latitud,
              longitude: comercio.coordenadas.longitud,
            }}
            title={comercio.nombre}
            description={comercio.direccion}
            onCalloutPress={() => router.push(`/comercio/${comercio.id}`)}
          />
        ))}
      </MapView>

      <View style={styles.panel}>
        <Text style={styles.panelTitulo}>Comercios cercanos</Text>

        {permisoDenegado ? (
          <Text style={styles.avisoTexto}>
            No pudimos obtener tu ubicación. El mapa sigue disponible y podés
            consultar todos los comercios.
          </Text>
        ) : comerciosCercanos.length === 0 ? (
          <Text style={styles.avisoTexto}>No hay comercios disponibles.</Text>
        ) : (
          <ScrollView contentContainerStyle={styles.listaContenido}>
            {comerciosCercanos.map(({ comercio, distanciaKm }) => (
              <Pressable
                key={comercio.id}
                style={styles.comercioItem}
                onPress={() => router.push(`/comercio/${comercio.id}`)}
                accessibilityRole="button"
                accessibilityLabel={`Abrir ${comercio.nombre}`}
              >
                <View style={styles.comercioInformacion}>
                  <Text style={styles.comercioNombre}>{comercio.nombre}</Text>

                  <Text style={styles.comercioDireccion}>
                    {comercio.direccion}
                  </Text>
                </View>

                <Text style={styles.comercioDistancia}>
                  {formatearDistancia(distanciaKm)}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  mapa: {
    flex: 3,
  },

  panel: {
    flex: 2,
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 8,
    backgroundColor: "white",
  },

  panelTitulo: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 10,
  },

  listaContenido: {
    paddingBottom: 12,
    gap: 8,
  },

  comercioItem: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },

  comercioInformacion: {
    flex: 1,
  },

  comercioNombre: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 4,
  },

  comercioDireccion: {
    fontSize: 13,
  },

  comercioDistancia: {
    fontSize: 15,
    fontWeight: "700",
  },

  estadoContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    gap: 12,
  },

  estadoTexto: {
    fontSize: 16,
  },

  error: {
    fontSize: 16,
    textAlign: "center",
  },

  avisoTexto: {
    fontSize: 15,
    lineHeight: 21,
  },
});
