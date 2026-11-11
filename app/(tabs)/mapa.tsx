import Ionicons from "@react-native-vector-icons/ionicons";
import { router } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import MapView, { Marker, Region } from "react-native-maps";

import { useTema } from "../../src/contexto/tema";
import { obtenerComercios } from "../../src/servicios/comercios";
import { obtenerRubros } from "../../src/servicios/rubros";
import {
  obtenerUbicacionActual,
  UbicacionUsuario,
} from "../../src/servicios/ubicacion";
import { Comercio, Rubro } from "../../src/tipos/modelos";
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

interface ComercioEnMapa {
  comercio: Comercio;
  /** null cuando se negó la ubicación: no se puede calcular distancia. */
  distanciaKm: number | null;
}

export default function MapaScreen() {
  const { colores, tema } = useTema();
  const styles = useMemo(() => crearEstilos(colores), [colores]);
  const [comercios, setComercios] = useState<Comercio[]>([]);
  const [rubros, setRubros] = useState<Rubro[]>([]);
  const [rubroFiltro, setRubroFiltro] = useState<string | null>(null);
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

        // El filtro por rubro vive en el mapa: sin la lista de rubros no hay chips.
        obtenerRubros()
          .then(setRubros)
          .catch(() => setRubros([]));

        // Un problema de ubicación no tiene que tumbar el mapa: sin ubicación
        // la lista muestra todos los comercios sin distancia (aviso arriba).
        try {
          const ubicacion = await obtenerUbicacionActual();

          if (!ubicacion) {
            setPermisoDenegado(true);
            return;
          }

          setUbicacionUsuario(ubicacion);
        } catch {
          setPermisoDenegado(true);
        }
      } catch {
        setError("No fue posible cargar la información del mapa.");
      } finally {
        setCargando(false);
      }
    }

    void cargarMapa();
  }, []);

  const comerciosFiltrados = useMemo(() => {
    if (!rubroFiltro) {
      return comercios;
    }

    return comercios.filter((comercio) => comercio.rubroId === rubroFiltro);
  }, [comercios, rubroFiltro]);

  const comerciosEnMapa = useMemo<ComercioEnMapa[]>(() => {
    return comerciosFiltrados.map((comercio) => ({
      comercio,
      distanciaKm: ubicacionUsuario
        ? calcularDistanciaKm(ubicacionUsuario, comercio.coordenadas)
        : null,
    })).sort((a, b) => (a.distanciaKm ?? Infinity) - (b.distanciaKm ?? Infinity));
  }, [comerciosFiltrados, ubicacionUsuario]);

  // "Ir" del PRD: la app de mapas del teléfono lleva al local, caminando o en
  // auto (el modo lo elige el usuario dentro de Google Maps).
  async function irAComercio(comercio: Comercio) {
    const { latitud, longitud } = comercio.coordenadas;

    await Linking.openURL(
      `https://www.google.com/maps/dir/?api=1&destination=${latitud},${longitud}`,
    );
  }

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
        showsUserLocation={ubicacionUsuario !== null}
        showsMyLocationButton={ubicacionUsuario !== null}
      >
        {comerciosFiltrados.map((comercio) => (
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
        <View style={styles.panelEncabezado}>
          <View style={styles.panelIcono}>
            <Ionicons name="navigate-outline" size={20} color={colores.primario} />
          </View>
          <Text style={styles.panelTitulo}>Comercios cercanos</Text>
        </View>

        {rubros.length > 0 ? (
          <View style={styles.filaChips}>
            <Pressable
              onPress={() => setRubroFiltro(null)}
              style={[styles.chip, rubroFiltro === null && styles.chipSeleccionado]}
              accessibilityRole="button"
              accessibilityState={{ selected: rubroFiltro === null }}
              accessibilityLabel="Filtrar el mapa por todos los rubros"
            >
              <Text
                style={[
                  styles.chipTexto,
                  rubroFiltro === null && styles.chipSeleccionadoTexto,
                ]}
              >
                Todos
              </Text>
            </Pressable>

            {rubros.map((rubro) => {
              const seleccionado = rubroFiltro === rubro.id;

              return (
                <Pressable
                  key={rubro.id}
                  onPress={() => setRubroFiltro(seleccionado ? null : rubro.id)}
                  style={[styles.chip, seleccionado && styles.chipSeleccionado]}
                  accessibilityRole="button"
                  accessibilityState={{ selected: seleccionado }}
                  accessibilityLabel={`Filtrar el mapa por rubro ${rubro.nombre}`}
                >
                  <Text
                    style={[
                      styles.chipTexto,
                      seleccionado && styles.chipSeleccionadoTexto,
                    ]}
                  >
                    {rubro.nombre}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        ) : null}

        {permisoDenegado ? (
          <View style={styles.aviso}>
            <Ionicons name="location-outline" size={20} color={colores.promo} />
            <Text style={styles.avisoTexto}>
              No pudimos obtener tu ubicación. El mapa sigue disponible y podés
              consultar todos los comercios.
            </Text>
          </View>
        ) : comerciosEnMapa.length === 0 ? (
          <Text style={styles.avisoTexto}>
            {rubroFiltro
              ? "No hay comercios de ese rubro en el mapa."
              : "No hay comercios disponibles."}
          </Text>
        ) : (
          <ScrollView contentContainerStyle={styles.listaContenido}>
            {comerciosEnMapa.map(({ comercio, distanciaKm }) => (
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

                {distanciaKm !== null ? (
                  <View style={styles.distanciaChip}>
                    <Text style={styles.comercioDistancia}>
                      {formatearDistancia(distanciaKm)}
                    </Text>
                  </View>
                ) : null}

                <Pressable
                  onPress={() => void irAComercio(comercio)}
                  style={styles.irBoton}
                  accessibilityRole="button"
                  accessibilityLabel={`Cómo llegar a ${comercio.nombre}`}
                >
                  <Ionicons
                    name="navigate-outline"
                    size={16}
                    color="#FFFFFF"
                  />
                  <Text style={styles.irTexto}>Ir</Text>
                </Pressable>
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
    mapa: { flex: 2 },
    panel: {
      flex: 3,
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
    // flexShrink 0: los chips no se comprimen cuando el panel aprieta —
    // la lista de abajo (scrollable) es la que cede espacio.
    filaChips: { flexDirection: "row", flexWrap: "wrap", flexShrink: 0, gap: 8, marginBottom: 10 },
    chip: {
      paddingHorizontal: 12,
      paddingVertical: 7,
      borderRadius: 999,
      borderWidth: 1,
      borderColor: colores.borde,
      backgroundColor: colores.tarjeta,
    },
    chipTexto: { fontSize: 12, fontWeight: "600", color: colores.secundario },
    chipSeleccionado: {
      backgroundColor: colores.primario,
      borderColor: colores.primario,
    },
    chipSeleccionadoTexto: { color: "#FFFFFF", fontWeight: "700" },
    listaContenido: { paddingBottom: 12, gap: 8 },
    comercioItem: {
      borderWidth: 1,
      borderColor: colores.borde,
      borderRadius: 14,
      padding: 12,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 10,
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
    irBoton: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      backgroundColor: colores.primario,
      borderRadius: 999,
      paddingHorizontal: 12,
      paddingVertical: 7,
    },
    irTexto: { fontSize: 12, fontWeight: "800", color: "#FFFFFF" },
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
