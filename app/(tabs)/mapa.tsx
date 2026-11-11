import { Ionicons } from "@expo/vector-icons";
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
import MapView, { Marker, Region, UrlTile } from "react-native-maps";

import { useTema } from "../../src/contexto/tema";
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
  const { colores, tema } = useTema();
  const styles = useMemo(() => crearEstilos(colores), [colores]);
  const [comercios, setComercios] = useState<Comercio[]>([]);
  const [ubicacionUsuario, setUbicacionUsuario] = useState<UbicacionUsuario | null>(null);
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

    void cargarMapa();
  }, []);

  const comerciosCercanos = useMemo<ComercioConDistancia[]>(() => {
    if (!ubicacionUsuario) return [];

    return comercios
      .map((comercio) => ({
        comercio,
        distanciaKm: calcularDistanciaKm(ubicacionUsuario, comercio.coordenadas),
      }))
      .sort((a, b) => a.distanciaKm - b.distanciaKm);
  }, [comercios, ubicacionUsuario]);

  if (cargando) {
    return (
      <View style={styles.estadoContainer}>
        <ActivityIndicator size="large" color={colores.primario} />
        <Text style={styles.estadoTitulo}>Cargando mapa</Text>
        <Text style={styles.estadoTexto}>Buscando comercios cercanos.</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.estadoContainer}>
        <Ionicons name="alert-circle-outline" size={34} color={colores.peligro} />
        <Text style={styles.estadoTitulo}>No pudimos cargar el mapa</Text>
        <Text style={styles.estadoTexto}>{error}</Text>
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
        key={tema}
        style={styles.mapa}
        initialRegion={regionInicial}
        mapType="none"
        showsUserLocation={ubicacionUsuario !== null}
        showsMyLocationButton={ubicacionUsuario !== null}
      >
        <UrlTile
          urlTemplate="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
          maximumZ={19}
          flipY={false}
        />
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
        <View pointerEvents="none" style={styles.osmAtribucion}>
          <Text style={styles.osmAtribucionTexto}>© OpenStreetMap contributors</Text>
        </View>
      </MapView>

      <View style={styles.panel}>
        <View style={styles.panelEncabezado}>
          <View style={styles.panelIcono}>
            <Ionicons name="navigate-outline" size={20} color={colores.primario} />
          </View>
          <Text style={styles.panelTitulo}>Comercios cercanos</Text>
        </View>

        {permisoDenegado ? (
          <View style={styles.aviso}>
            <Ionicons name="location-outline" size={20} color={colores.promo} />
            <Text style={styles.avisoTexto}>
              No pudimos obtener tu ubicación. El mapa sigue disponible y podés
              consultar todos los comercios.
            </Text>
          </View>
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
                  <Text style={styles.comercioDireccion}>{comercio.direccion}</Text>
                </View>

                <View style={styles.distanciaChip}>
                  <Text style={styles.comercioDistancia}>
                    {formatearDistancia(distanciaKm)}
                  </Text>
                </View>
              </Pressable>
            ))}
          </ScrollView>
        )}
      </View>
    </View>
  );
}

function crearEstilos(colores: ReturnType<typeof useTema>["colores"]) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colores.fondo },
    mapa: { flex: 3 },
    osmAtribucion: {
      position: "absolute",
      right: 6,
      bottom: 4,
      backgroundColor: "rgba(255,255,255,0.88)",
      borderRadius: 4,
      paddingHorizontal: 5,
      paddingVertical: 2,
    },
    osmAtribucionTexto: {
      fontSize: 9,
      color: "#444",
    },
    panel: {
      flex: 2,
      paddingHorizontal: 16,
      paddingTop: 14,
      paddingBottom: 8,
      backgroundColor: colores.fondo,
    },
    panelEncabezado: { flexDirection: "row", alignItems: "center", gap: 9, marginBottom: 10 },
    panelIcono: {
      width: 34,
      height: 34,
      borderRadius: 10,
      backgroundColor: colores.comercioFondo,
      alignItems: "center",
      justifyContent: "center",
    },
    panelTitulo: { fontSize: 20, fontWeight: "800", color: colores.texto },
    listaContenido: { paddingBottom: 12, gap: 8 },
    comercioItem: {
      borderWidth: 1,
      borderColor: colores.borde,
      borderRadius: 14,
      padding: 12,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 12,
      backgroundColor: colores.tarjeta,
    },
    comercioInformacion: { flex: 1 },
    comercioNombre: { fontSize: 15, fontWeight: "800", color: colores.texto, marginBottom: 4 },
    comercioDireccion: { fontSize: 12, color: colores.secundario },
    distanciaChip: {
      backgroundColor: colores.comercioFondo,
      borderRadius: 999,
      paddingHorizontal: 9,
      paddingVertical: 6,
    },
    comercioDistancia: { fontSize: 12, fontWeight: "800", color: colores.primario },
    estadoContainer: {
      flex: 1,
      backgroundColor: colores.fondo,
      alignItems: "center",
      justifyContent: "center",
      padding: 24,
      gap: 8,
    },
    estadoTitulo: { fontSize: 18, fontWeight: "800", color: colores.texto, textAlign: "center" },
    estadoTexto: { fontSize: 14, lineHeight: 20, color: colores.secundario, textAlign: "center" },
    aviso: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: 8,
      backgroundColor: colores.promoFondo,
      borderRadius: 12,
      padding: 12,
    },
    avisoTexto: { flex: 1, fontSize: 14, lineHeight: 20, color: colores.secundario },
  });
}
