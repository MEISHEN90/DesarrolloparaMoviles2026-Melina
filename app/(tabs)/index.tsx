import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { Link } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { useEstadoRed } from "../../src/hooks/use-estado-red";
import { buscarComercios } from "../../src/servicios/comercios";
import {
  guardarPreferenciaSoloAbiertos,
  guardarRubroSeleccionado,
  obtenerPreferenciaSoloAbiertos,
  obtenerRubroSeleccionado,
} from "../../src/servicios/preferencias";
import { obtenerRubros } from "../../src/servicios/rubros";
import { Comercio, Rubro } from "../../src/tipos/modelos";
import { estaAbiertoAhora } from "../../src/utils/horarios";

const COLORES = {
  primario: "#2457A6",
  primarioOscuro: "#173A70",
  fondo: "#F5F7FA",
  tarjeta: "#FFFFFF",
  borde: "#D9DEE7",
  texto: "#1B1D21",
  secundario: "#667085",
  abierto: "#2E7D32",
  abiertoFondo: "#EAF7EE",
  cerrado: "#B42318",
  cerradoFondo: "#FDECEC",
  aviso: "#8A4B00",
  avisoFondo: "#FFF4E5",
};

function EstadoComercio({ abierto }: { abierto: boolean }) {
  return (
    <View
      style={[
        styles.estadoChip,
        abierto ? styles.estadoAbierto : styles.estadoCerrado,
      ]}
    >
      <View
        style={[
          styles.estadoPunto,
          abierto ? styles.estadoPuntoAbierto : styles.estadoPuntoCerrado,
        ]}
      />
      <Text
        style={[
          styles.estadoChipTexto,
          abierto ? styles.estadoTextoAbierto : styles.estadoTextoCerrado,
        ]}
      >
        {abierto ? "Abierto ahora" : "Cerrado ahora"}
      </Text>
    </View>
  );
}

export default function ComerciosScreen() {
  const [comercios, setComercios] = useState<Comercio[]>([]);
  const [rubros, setRubros] = useState<Rubro[]>([]);
  const [textoBusqueda, setTextoBusqueda] = useState("");
  const [rubroSeleccionado, setRubroSeleccionado] = useState<string | null>(
    null,
  );
  const [soloAbiertos, setSoloAbiertos] = useState(false);
  const [preferenciasCargadas, setPreferenciasCargadas] = useState(false);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const estadoRed = useEstadoRed();

  const rubrosPorId = useMemo(
    () => new Map(rubros.map((rubro) => [rubro.id, rubro.nombre])),
    [rubros],
  );

  useEffect(() => {
    async function cargarDatosIniciales() {
      try {
        setCargando(true);
        setError(null);

        const [datosRubros, preferenciaRubro, preferenciaSoloAbiertos] =
          await Promise.all([
            obtenerRubros(),
            obtenerRubroSeleccionado(),
            obtenerPreferenciaSoloAbiertos(),
          ]);

        setRubros(datosRubros);
        setRubroSeleccionado(preferenciaRubro);
        setSoloAbiertos(preferenciaSoloAbiertos);
      } catch {
        setError("No fue posible cargar la configuración inicial.");
      } finally {
        setPreferenciasCargadas(true);
      }
    }

    cargarDatosIniciales();
  }, []);

  useEffect(() => {
    if (!preferenciasCargadas) {
      return;
    }

    async function cargarComercios() {
      try {
        setCargando(true);
        setError(null);

        const datos = await buscarComercios(
          textoBusqueda,
          rubroSeleccionado,
          soloAbiertos,
        );

        setComercios(datos);
      } catch {
        setError("No fue posible cargar los comercios.");
      } finally {
        setCargando(false);
      }
    }

    cargarComercios();
  }, [textoBusqueda, rubroSeleccionado, soloAbiertos, preferenciasCargadas]);

  async function seleccionarRubro(rubroId: string | null) {
    setRubroSeleccionado(rubroId);

    try {
      await guardarRubroSeleccionado(rubroId);
    } catch {
      setError("No fue posible guardar la preferencia de rubro.");
    }
  }

  async function alternarSoloAbiertos() {
    const nuevoValor = !soloAbiertos;
    setSoloAbiertos(nuevoValor);

    try {
      await guardarPreferenciaSoloAbiertos(nuevoValor);
    } catch {
      setError("No fue posible guardar la preferencia de comercios abiertos.");
    }
  }

  function limpiarFiltros() {
    setTextoBusqueda("");
    void seleccionarRubro(null);

    if (soloAbiertos) {
      void alternarSoloAbiertos();
    }
  }

  const sinConexion = !estadoRed.conectado || !estadoRed.tieneInternet;

  return (
    <View style={styles.container}>
      <View style={styles.encabezado}>
        <Text style={styles.title}>Directorio de Comercios</Text>
        <Text style={styles.subtitle}>
          Encontrá lo que necesitás en Concepción del Uruguay.
        </Text>
      </View>

      {sinConexion && (
        <View style={styles.avisoSinConexion}>
          <Ionicons name="cloud-offline-outline" size={20} color={COLORES.aviso} />
          <View style={styles.avisoContenido}>
            <Text style={styles.avisoSinConexionTitulo}>Sin conexión</Text>
            <Text style={styles.avisoSinConexionTexto}>
              Mostrando la información disponible en el dispositivo.
            </Text>
          </View>
        </View>
      )}

      <View style={styles.buscador}>
        <Ionicons name="search-outline" size={20} color={COLORES.secundario} />
        <TextInput
          value={textoBusqueda}
          onChangeText={setTextoBusqueda}
          placeholder="Buscar por nombre o producto"
          placeholderTextColor="#98A2B3"
          style={styles.input}
          accessibilityLabel="Buscar comercios"
        />
        {textoBusqueda.length > 0 ? (
          <Pressable
            onPress={() => setTextoBusqueda("")}
            accessibilityRole="button"
            accessibilityLabel="Limpiar búsqueda"
            hitSlop={8}
          >
            <Ionicons name="close-circle" size={20} color={COLORES.secundario} />
          </Pressable>
        ) : null}
      </View>

      <ScrollView
        horizontal
        style={styles.rubrosScroll}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.rubrosContainer}
      >
        <Pressable
          onPress={() => seleccionarRubro(null)}
          style={[
            styles.chip,
            rubroSeleccionado === null && styles.chipSeleccionado,
          ]}
        >
          <Text
            style={[
              styles.chipTexto,
              rubroSeleccionado === null && styles.chipTextoSeleccionado,
            ]}
          >
            Todos
          </Text>
        </Pressable>

        {rubros.map((rubro) => (
          <Pressable
            key={rubro.id}
            onPress={() => seleccionarRubro(rubro.id)}
            style={[
              styles.chip,
              rubroSeleccionado === rubro.id && styles.chipSeleccionado,
            ]}
          >
            <Text
              style={[
                styles.chipTexto,
                rubroSeleccionado === rubro.id && styles.chipTextoSeleccionado,
              ]}
            >
              {rubro.nombre}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      <View style={styles.filtrosFila}>
        <Pressable
          onPress={alternarSoloAbiertos}
          style={[
            styles.filtroAbierto,
            soloAbiertos && styles.filtroAbiertoSeleccionado,
          ]}
          accessibilityRole="button"
          accessibilityState={{ selected: soloAbiertos }}
          accessibilityLabel="Filtrar comercios abiertos ahora"
        >
          <Ionicons
            name={soloAbiertos ? "checkmark-circle" : "time-outline"}
            size={18}
            color={soloAbiertos ? "#FFFFFF" : COLORES.primario}
          />
          <Text
            style={[
              styles.filtroAbiertoTexto,
              soloAbiertos && styles.filtroAbiertoTextoSeleccionado,
            ]}
          >
            Abierto ahora
          </Text>
        </Pressable>

        {(textoBusqueda || rubroSeleccionado || soloAbiertos) && (
          <Pressable onPress={limpiarFiltros} accessibilityRole="button">
            <Text style={styles.limpiarTexto}>Limpiar filtros</Text>
          </Pressable>
        )}
      </View>

      {cargando ? (
        <View style={styles.estadoContainer}>
          <ActivityIndicator size="large" color={COLORES.primario} />
          <Text style={styles.estadoTitulo}>Buscando comercios</Text>
          <Text style={styles.estadoTexto}>Esto puede tardar unos segundos.</Text>
        </View>
      ) : error ? (
        <View style={styles.estadoContainer}>
          <View style={styles.estadoIconoError}>
            <Ionicons name="alert-circle-outline" size={32} color={COLORES.cerrado} />
          </View>
          <Text style={styles.estadoTitulo}>No pudimos cargar los comercios</Text>
          <Text style={styles.estadoTexto}>{error}</Text>
        </View>
      ) : comercios.length === 0 ? (
        <View style={styles.estadoContainer}>
          <View style={styles.estadoIcono}>
            <Ionicons name="search-outline" size={30} color={COLORES.primario} />
          </View>
          <Text style={styles.estadoTitulo}>No encontramos comercios</Text>
          <Text style={styles.estadoTexto}>
            Probá cambiar el rubro, la búsqueda o desactivar “Abierto ahora”.
          </Text>
          <Pressable onPress={limpiarFiltros} style={styles.botonLimpiar}>
            <Text style={styles.botonLimpiarTexto}>Limpiar filtros</Text>
          </Pressable>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.lista}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.resultadosTexto}>
            {comercios.length} {comercios.length === 1 ? "comercio" : "comercios"}
          </Text>

          {comercios.map((comercio) => {
            const abierto = estaAbiertoAhora(comercio.horarios);
            const rubro = rubrosPorId.get(comercio.rubroId) ?? "Comercio";
            const imagen = comercio.imagenes[0] ?? null;

            return (
              <Link
                key={comercio.id}
                href={{
                  pathname: "/comercio/[id]",
                  params: { id: comercio.id },
                }}
                asChild
              >
                <Pressable style={styles.card}>
                  {imagen ? (
                    <Image
                      source={{ uri: imagen }}
                      style={styles.cardImagen}
                      contentFit="cover"
                      transition={150}
                    />
                  ) : (
                    <View style={styles.cardImagenVacia}>
                      <Ionicons
                        name="storefront-outline"
                        size={28}
                        color={COLORES.primario}
                      />
                    </View>
                  )}

                  <View style={styles.cardContenido}>
                    <View style={styles.cardCabecera}>
                      <View style={styles.cardTituloContenedor}>
                        <Text style={styles.cardTitle} numberOfLines={1}>
                          {comercio.nombre}
                        </Text>
                        <Text style={styles.rubroTexto}>{rubro}</Text>
                      </View>
                      <Ionicons
                        name="chevron-forward"
                        size={20}
                        color={COLORES.secundario}
                      />
                    </View>

                    <EstadoComercio abierto={abierto} />

                    <Text style={styles.cardText} numberOfLines={2}>
                      {comercio.descripcion}
                    </Text>

                    <View style={styles.cardMeta}>
                      <View style={styles.metaItem}>
                        <Ionicons name="star" size={15} color="#B7791F" />
                        <Text style={styles.metaTexto}>
                          {comercio.puntaje.toFixed(1)} · {comercio.cantidadResenas} reseñas
                        </Text>
                      </View>

                      <View style={styles.metaItem}>
                        <Ionicons
                          name="location-outline"
                          size={15}
                          color={COLORES.secundario}
                        />
                        <Text style={styles.direccion} numberOfLines={1}>
                          {comercio.direccion}
                        </Text>
                      </View>
                    </View>
                  </View>
                </Pressable>
              </Link>
            );
          })}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORES.fondo,
    paddingHorizontal: 18,
    paddingTop: 18,
  },
  encabezado: {
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: COLORES.texto,
    letterSpacing: -0.4,
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 21,
    color: COLORES.secundario,
    marginTop: 5,
  },
  avisoSinConexion: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    backgroundColor: COLORES.avisoFondo,
    borderRadius: 14,
    padding: 13,
    marginBottom: 12,
  },
  avisoContenido: {
    flex: 1,
  },
  avisoSinConexionTitulo: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORES.aviso,
    marginBottom: 2,
  },
  avisoSinConexionTexto: {
    fontSize: 13,
    lineHeight: 18,
    color: COLORES.aviso,
  },
  buscador: {
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    backgroundColor: COLORES.tarjeta,
    borderWidth: 1,
    borderColor: COLORES.borde,
    borderRadius: 14,
    paddingHorizontal: 13,
    minHeight: 48,
    marginBottom: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: COLORES.texto,
    paddingVertical: 10,
  },
  rubrosScroll: {
    flexGrow: 0,
    minHeight: 44,
    maxHeight: 44,
    marginBottom: 12,
  },
  rubrosContainer: {
    alignItems: "center",
    gap: 8,
    paddingRight: 8,
  },
  chip: {
    minHeight: 36,
    borderWidth: 1,
    borderColor: COLORES.borde,
    backgroundColor: COLORES.tarjeta,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    justifyContent: "center",
  },
  chipSeleccionado: {
    backgroundColor: COLORES.primario,
    borderColor: COLORES.primario,
  },
  chipTexto: {
    fontSize: 14,
    color: COLORES.texto,
  },
  chipTextoSeleccionado: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
  filtrosFila: {
    minHeight: 42,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  filtroAbierto: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderWidth: 1,
    borderColor: COLORES.primario,
    backgroundColor: COLORES.tarjeta,
    borderRadius: 20,
    paddingHorizontal: 13,
    paddingVertical: 8,
  },
  filtroAbiertoSeleccionado: {
    backgroundColor: COLORES.primario,
  },
  filtroAbiertoTexto: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORES.primario,
  },
  filtroAbiertoTextoSeleccionado: {
    color: "#FFFFFF",
  },
  limpiarTexto: {
    fontSize: 13,
    fontWeight: "700",
    color: COLORES.primario,
  },
  lista: {
    gap: 12,
    paddingBottom: 28,
  },
  resultadosTexto: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORES.secundario,
    marginBottom: 2,
  },
  card: {
    flexDirection: "row",
    backgroundColor: COLORES.tarjeta,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORES.borde,
    padding: 12,
    gap: 12,
  },
  cardImagen: {
    width: 92,
    height: 108,
    borderRadius: 12,
    backgroundColor: "#E9EEF5",
  },
  cardImagenVacia: {
    width: 92,
    height: 108,
    borderRadius: 12,
    backgroundColor: "#EAF0F8",
    alignItems: "center",
    justifyContent: "center",
  },
  cardContenido: {
    flex: 1,
    gap: 7,
  },
  cardCabecera: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 6,
  },
  cardTituloContenedor: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: COLORES.texto,
  },
  rubroTexto: {
    fontSize: 12,
    color: COLORES.secundario,
    marginTop: 2,
  },
  estadoChip: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  estadoAbierto: {
    backgroundColor: COLORES.abiertoFondo,
  },
  estadoCerrado: {
    backgroundColor: COLORES.cerradoFondo,
  },
  estadoPunto: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  estadoPuntoAbierto: {
    backgroundColor: COLORES.abierto,
  },
  estadoPuntoCerrado: {
    backgroundColor: COLORES.cerrado,
  },
  estadoChipTexto: {
    fontSize: 11,
    fontWeight: "700",
  },
  estadoTextoAbierto: {
    color: COLORES.abierto,
  },
  estadoTextoCerrado: {
    color: COLORES.cerrado,
  },
  cardText: {
    fontSize: 13,
    lineHeight: 18,
    color: "#475467",
  },
  cardMeta: {
    gap: 5,
    marginTop: 1,
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  metaTexto: {
    fontSize: 12,
    color: COLORES.secundario,
  },
  direccion: {
    flex: 1,
    fontSize: 12,
    color: COLORES.secundario,
  },
  estadoContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 28,
    paddingBottom: 80,
  },
  estadoIcono: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#EAF0F8",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  estadoIconoError: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORES.cerradoFondo,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  estadoTitulo: {
    fontSize: 18,
    fontWeight: "800",
    color: COLORES.texto,
    textAlign: "center",
    marginTop: 8,
  },
  estadoTexto: {
    fontSize: 14,
    lineHeight: 20,
    color: COLORES.secundario,
    textAlign: "center",
    marginTop: 6,
  },
  botonLimpiar: {
    marginTop: 16,
    backgroundColor: COLORES.primario,
    borderRadius: 12,
    paddingHorizontal: 18,
    paddingVertical: 11,
  },
  botonLimpiarTexto: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 14,
  },
});
