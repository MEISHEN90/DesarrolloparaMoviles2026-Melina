import Ionicons from "@react-native-vector-icons/ionicons";
import { Link } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { useTema } from "../../src/contexto/tema";
import { useEstadoRed } from "../../src/hooks/use-estado-red";
import { obtenerComercios } from "../../src/servicios/comercios";
import { obtenerRubros } from "../../src/servicios/rubros";
import {
  EstadoPromociones,
  obtenerPromocionesPorEstado,
} from "../../src/servicios/promociones";
import { Comercio, Promocion, Rubro } from "../../src/tipos/modelos";

type Categoria = {
  id: EstadoPromociones;
  etiqueta: string;
  vacio: string;
};

const CATEGORIAS: Categoria[] = [
  {
    id: "vigentes",
    etiqueta: "Vigentes",
    vacio: "No hay promociones vigentes por ahora.",
  },
  {
    id: "proximas",
    etiqueta: "Próximas",
    vacio: "No hay promociones que arraquen pronto.",
  },
  {
    id: "por-vencer",
    etiqueta: "Por vencer",
    vacio: "No hay promociones por vencer en los próximos días.",
  },
];

function formatearFecha(fecha: string): string {
  return new Date(fecha).toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export default function PromocionesScreen() {
  const { colores } = useTema();
  const styles = useMemo(() => crearEstilos(colores), [colores]);

  const [categoria, setCategoria] = useState<EstadoPromociones>("vigentes");
  const [porCategoria, setPorCategoria] = useState<
    Partial<Record<EstadoPromociones, Promocion[]>>
  >({});
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refrescando, setRefrescando] = useState(false);

  const [rubros, setRubros] = useState<Rubro[]>([]);
  const [comercios, setComercios] = useState<Comercio[]>([]);
  const [rubroFiltro, setRubroFiltro] = useState<string | null>(null);

  const estadoRed = useEstadoRed();
  const sinConexion = !estadoRed.conectado || !estadoRed.tieneInternet;

  const cargarComerciosYRubros = useCallback(async () => {
    try {
      const [listaComercios, listaRubros] = await Promise.all([
        obtenerComercios(),
        obtenerRubros(),
      ]);

      setComercios(listaComercios);
      setRubros(listaRubros);
    } catch {
      // Sin el mapa de comercios no hay filtro de rubro ni nombre en las
      // tarjetas, pero la lista de promociones sigue siendo usable.
    }
  }, []);

  const cargarCategoria = useCallback(
    async (estado: EstadoPromociones) => {
      try {
        setCargando(true);
        setError(null);

        const datos = await obtenerPromocionesPorEstado(estado);

        setPorCategoria((previo) => ({ ...previo, [estado]: datos }));
      } catch {
        setError("No fue posible cargar las promociones.");
        setPorCategoria((previo) => ({ ...previo, [estado]: [] }));
      } finally {
        setCargando(false);
      }
    },
    [],
  );

  useEffect(() => {
    void cargarComerciosYRubros();
  }, [cargarComerciosYRubros]);

  useEffect(() => {
    if (porCategoria[categoria] === undefined) {
      void cargarCategoria(categoria);
    }
  }, [categoria, porCategoria, cargarCategoria]);

  async function recargar() {
    setRefrescando(true);

    try {
      await cargarCategoria(categoria);
    } finally {
      setRefrescando(false);
    }
  }

  const comerciosPorId = useMemo(() => {
    const mapa = new Map<string, Comercio>();

    comercios.forEach((comercio) => mapa.set(comercio.id, comercio));

    return mapa;
  }, [comercios]);

  const promocionesFiltradas = useMemo(() => {
    const promociones = porCategoria[categoria] ?? [];

    if (!rubroFiltro) {
      return promociones;
    }

    return promociones.filter(
      (promocion) =>
        comerciosPorId.get(promocion.comercioId)?.rubroId === rubroFiltro,
    );
  }, [porCategoria, categoria, rubroFiltro, comerciosPorId]);

  const categoriaActual =
    CATEGORIAS.find((unaCategoria) => unaCategoria.id === categoria) ??
    CATEGORIAS[0];

  function textoVigencia(promocion: Promocion): string {
    if (categoria === "proximas") {
      return `Arranca el ${formatearFecha(promocion.desde)}`;
    }

    if (categoria === "por-vencer") {
      return `Termina el ${formatearFecha(promocion.hasta)}`;
    }

    return `Vigente hasta ${formatearFecha(promocion.hasta)}`;
  }

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refrescando}
          onRefresh={recargar}
          colors={[colores.primario]}
          tintColor={colores.primario}
        />
      }
    >
      <Text style={styles.title}>Promociones</Text>
      <Text style={styles.subtitle}>
        Beneficios vigentes, los que arrancan pronto y los que están por
        terminar.
      </Text>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filaChips}
      >
        {CATEGORIAS.map((unaCategoria) => {
          const seleccionada = unaCategoria.id === categoria;

          return (
            <Pressable
              key={unaCategoria.id}
              onPress={() => setCategoria(unaCategoria.id)}
              style={[
                styles.chipCategoria,
                seleccionada && styles.chipSeleccionado,
              ]}
              accessibilityRole="button"
              accessibilityState={{ selected: seleccionada }}
              accessibilityLabel={`Ver promociones ${unaCategoria.etiqueta}`}
            >
              <Text
                style={[
                  styles.chipCategoriaTexto,
                  seleccionada && styles.chipSeleccionadoTexto,
                ]}
              >
                {unaCategoria.etiqueta}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {rubros.length > 0 ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filaChips}
        >
          <Pressable
            onPress={() => setRubroFiltro(null)}
            style={[
              styles.chipRubro,
              rubroFiltro === null && styles.chipRubroSeleccionado,
            ]}
            accessibilityRole="button"
            accessibilityState={{ selected: rubroFiltro === null }}
            accessibilityLabel="Filtrar por todos los rubros"
          >
            <Text
              style={[
                styles.chipRubroTexto,
                rubroFiltro === null && styles.chipRubroSeleccionadoTexto,
              ]}
            >
              Todos los rubros
            </Text>
          </Pressable>

          {rubros.map((rubro) => {
            const seleccionado = rubroFiltro === rubro.id;

            return (
              <Pressable
                key={rubro.id}
                onPress={() => setRubroFiltro(seleccionado ? null : rubro.id)}
                style={[
                  styles.chipRubro,
                  seleccionado && styles.chipRubroSeleccionado,
                ]}
                accessibilityRole="button"
                accessibilityState={{ selected: seleccionado }}
                accessibilityLabel={`Filtrar por rubro ${rubro.nombre}`}
              >
                <Text
                  style={[
                    styles.chipRubroTexto,
                    seleccionado && styles.chipRubroSeleccionadoTexto,
                  ]}
                >
                  {rubro.nombre}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      ) : null}

      {sinConexion && categoria === "vigentes" ? (
        <View style={styles.avisoSinConexion}>
          <Ionicons name="cloud-offline-outline" size={20} color={colores.promo} />
          <Text style={styles.avisoSinConexionTexto}>
            Sin conexión. Se muestran las promociones guardadas en el
            teléfono.
          </Text>
        </View>
      ) : null}

      {cargando ? (
        <View style={styles.estadoVacio}>
          <ActivityIndicator size="large" color={colores.primario} />
          <Text style={styles.estadoTexto}>Cargando promociones...</Text>
        </View>
      ) : error !== null ? (
        <View style={styles.estadoVacio}>
          <Ionicons
            name="cloud-offline-outline"
            size={32}
            color={colores.secundario}
          />
          <Text style={styles.estadoTitulo}>
            No pudimos cargar esta categoría
          </Text>
          <Text style={styles.estadoTexto}>{error}</Text>

          <Pressable
            onPress={() => void cargarCategoria(categoria)}
            style={styles.botonReintentar}
            accessibilityRole="button"
            accessibilityLabel="Reintentar cargar promociones"
          >
            <Text style={styles.botonReintentarTexto}>Reintentar</Text>
          </Pressable>
        </View>
      ) : promocionesFiltradas.length === 0 ? (
        <View style={styles.estadoVacio}>
          <Ionicons
            name="pricetag-outline"
            size={32}
            color={colores.secundario}
          />
          <Text style={styles.estadoTitulo}>
            {rubroFiltro
              ? `Nada de ese rubro en ${categoriaActual.etiqueta.toLowerCase()}`
              : categoriaActual.vacio}
          </Text>
          <Text style={styles.estadoTexto}>
            Tirá la lista hacia abajo para actualizar.
          </Text>
        </View>
      ) : (
        <View style={styles.lista}>
          {promocionesFiltradas.map((promocion) => {
            const comercio = comerciosPorId.get(promocion.comercioId);

            return (
              <Link
                key={promocion.id}
                href={{
                  pathname: "/promocion/[id]",
                  params: { id: promocion.id },
                }}
                asChild
              >
                <Pressable style={styles.card}>
                  <View style={styles.cardEncabezado}>
                    <View style={styles.cardIcono}>
                      <Ionicons
                        name="pricetag-outline"
                        size={18}
                        color={colores.promo}
                      />
                    </View>
                    <Text style={styles.cardTitle}>{promocion.titulo}</Text>
                    <Ionicons
                      name="chevron-forward"
                      size={20}
                      color={colores.secundario}
                    />
                  </View>

                  <Text style={styles.cardText}>{promocion.detalle}</Text>

                  <View style={styles.datosFila}>
                    {promocion.descuento !== null ? (
                      <View style={styles.descuentoChip}>
                        <Text style={styles.descuento}>
                          {promocion.descuento}% de descuento
                        </Text>
                      </View>
                    ) : null}

                    {comercio ? (
                      <View style={styles.comercioChip}>
                        <Ionicons
                          name="storefront-outline"
                          size={13}
                          color={colores.secundario}
                        />
                        <Text style={styles.comercioChipTexto} numberOfLines={1}>
                          {comercio.nombre}
                        </Text>
                      </View>
                    ) : null}
                  </View>

                  <View style={styles.vigenciaFila}>
                    <Ionicons
                      name="calendar-outline"
                      size={15}
                      color={colores.secundario}
                    />
                    <Text style={styles.vigencia}>{textoVigencia(promocion)}</Text>
                  </View>
                </Pressable>
              </Link>
            );
          })}
        </View>
      )}
    </ScrollView>
  );
}

function crearEstilos(colores: ReturnType<typeof useTema>["colores"]) {
  return StyleSheet.create({
    scroll: { flex: 1, backgroundColor: colores.fondo },
    container: { padding: 18, paddingBottom: 32, gap: 14 },
    title: { fontSize: 28, fontWeight: "800", color: colores.texto },
    subtitle: { fontSize: 15, lineHeight: 21, color: colores.secundario, marginBottom: 2 },
    filaChips: { gap: 8, paddingRight: 8 },
    chipCategoria: {
      paddingHorizontal: 14,
      paddingVertical: 9,
      borderRadius: 999,
      borderWidth: 1,
      borderColor: colores.borde,
      backgroundColor: colores.tarjeta,
    },
    chipCategoriaTexto: { fontSize: 13, fontWeight: "700", color: colores.secundario },
    chipSeleccionado: {
      backgroundColor: colores.primario,
      borderColor: colores.primario,
    },
    chipSeleccionadoTexto: { color: "#FFFFFF" },
    chipRubro: {
      paddingHorizontal: 12,
      paddingVertical: 7,
      borderRadius: 999,
      borderWidth: 1,
      borderColor: colores.borde,
      backgroundColor: colores.tarjeta,
    },
    chipRubroTexto: { fontSize: 12, fontWeight: "600", color: colores.secundario },
    chipRubroSeleccionado: {
      backgroundColor: colores.comercioFondo,
      borderColor: colores.primario,
    },
    chipRubroSeleccionadoTexto: { color: colores.primarioOscuro, fontWeight: "700" },
    avisoSinConexion: {
      flexDirection: "row",
      alignItems: "center",
      gap: 9,
      backgroundColor: colores.promoFondo,
      borderRadius: 14,
      padding: 13,
    },
    avisoSinConexionTexto: { flex: 1, fontSize: 13, lineHeight: 18, color: colores.promo, fontWeight: "600" },
    lista: { gap: 12 },
    card: {
      padding: 16,
      borderWidth: 1,
      borderColor: colores.borde,
      borderRadius: 16,
      gap: 10,
      backgroundColor: colores.tarjeta,
    },
    cardEncabezado: { flexDirection: "row", alignItems: "center", gap: 9 },
    cardIcono: {
      width: 34,
      height: 34,
      borderRadius: 10,
      backgroundColor: colores.promoFondo,
      alignItems: "center",
      justifyContent: "center",
    },
    cardTitle: { flex: 1, fontSize: 17, fontWeight: "800", color: colores.texto },
    cardText: { fontSize: 14, lineHeight: 20, color: colores.secundario },
    datosFila: {
      flexDirection: "row",
      alignItems: "center",
      flexWrap: "wrap",
      gap: 8,
    },
    descuentoChip: {
      alignSelf: "flex-start",
      backgroundColor: colores.promoFondo,
      borderRadius: 999,
      paddingHorizontal: 10,
      paddingVertical: 6,
    },
    descuento: { fontSize: 13, fontWeight: "800", color: colores.promo },
    comercioChip: {
      flexDirection: "row",
      alignItems: "center",
      gap: 5,
      backgroundColor: colores.comercioFondo,
      borderRadius: 999,
      paddingHorizontal: 10,
      paddingVertical: 6,
      flexShrink: 1,
    },
    comercioChipTexto: {
      fontSize: 12,
      fontWeight: "600",
      color: colores.primarioOscuro,
      flexShrink: 1,
    },
    vigenciaFila: { flexDirection: "row", alignItems: "center", gap: 5 },
    vigencia: { fontSize: 12, color: colores.secundario },
    botonReintentar: {
      borderWidth: 1,
      borderColor: colores.primario,
      borderRadius: 12,
      paddingHorizontal: 24,
      paddingVertical: 10,
      marginTop: 6,
    },
    botonReintentarTexto: {
      color: colores.primario,
      fontWeight: "700",
      fontSize: 14,
    },
    estadoVacio: { alignItems: "center", justifyContent: "center", paddingVertical: 40, gap: 8 },
    estadoTitulo: { fontSize: 18, fontWeight: "800", color: colores.texto, textAlign: "center" },
    estadoTexto: { fontSize: 14, lineHeight: 20, color: colores.secundario, textAlign: "center" },
    errorTexto: { fontSize: 14, lineHeight: 20, color: colores.secundario, textAlign: "center" },
  });
}
