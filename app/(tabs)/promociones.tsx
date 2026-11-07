import { Ionicons } from "@expo/vector-icons";
import { Link } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { useTema } from "../../src/contexto/tema";
import { useEstadoRed } from "../../src/hooks/use-estado-red";
import { obtenerPromociones } from "../../src/servicios/promociones";
import { Promocion } from "../../src/tipos/modelos";

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
  const [promociones, setPromociones] = useState<Promocion[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const estadoRed = useEstadoRed();
  const sinConexion = !estadoRed.conectado || !estadoRed.tieneInternet;

  useEffect(() => {
    async function cargarPromociones() {
      try {
        setCargando(true);
        setError(null);
        const datos = await obtenerPromociones();
        setPromociones(datos);
      } catch {
        setError("No fue posible cargar las promociones.");
      } finally {
        setCargando(false);
      }
    }

    void cargarPromociones();
  }, [estadoRed.conectado, estadoRed.tieneInternet]);

  if (cargando) {
    return (
      <View style={styles.estadoContainer}>
        <ActivityIndicator size="large" color={colores.primario} />
        <Text style={styles.estadoTitulo}>Cargando promociones</Text>
        <Text style={styles.estadoTexto}>Buscando beneficios disponibles.</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.estadoContainer}>
        <Ionicons name="alert-circle-outline" size={34} color={colores.peligro} />
        <Text style={styles.estadoTitulo}>No pudimos cargar las promociones</Text>
        <Text style={styles.errorTexto}>{error}</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.title}>Promociones</Text>
      <Text style={styles.subtitle}>
        Consultá las promociones disponibles en los comercios.
      </Text>

      {sinConexion ? (
        <View style={styles.avisoSinConexion}>
          <Ionicons name="cloud-offline-outline" size={20} color={colores.promo} />
          <Text style={styles.avisoSinConexionTexto}>
            Sin conexión. Se mostrarán las promociones disponibles localmente.
          </Text>
        </View>
      ) : null}

      {promociones.length === 0 ? (
        <View style={styles.estadoVacio}>
          <Ionicons name="pricetag-outline" size={32} color={colores.secundario} />
          <Text style={styles.estadoTitulo}>No hay promociones disponibles</Text>
          <Text style={styles.estadoTexto}>Volvé a consultar más tarde.</Text>
        </View>
      ) : (
        promociones.map((promocion) => (
          <Link
            key={promocion.id}
            href={{ pathname: "/promocion/[id]", params: { id: promocion.id } }}
            asChild
          >
            <Pressable style={styles.card}>
              <View style={styles.cardEncabezado}>
                <View style={styles.cardIcono}>
                  <Ionicons name="pricetag-outline" size={18} color={colores.promo} />
                </View>
                <Text style={styles.cardTitle}>{promocion.titulo}</Text>
                <Ionicons name="chevron-forward" size={20} color={colores.secundario} />
              </View>

              <Text style={styles.cardText}>{promocion.detalle}</Text>

              {promocion.descuento !== null ? (
                <View style={styles.descuentoChip}>
                  <Text style={styles.descuento}>
                    {promocion.descuento}% de descuento
                  </Text>
                </View>
              ) : null}

              <View style={styles.vigenciaFila}>
                <Ionicons name="calendar-outline" size={15} color={colores.secundario} />
                <Text style={styles.vigencia}>
                  Vigente hasta {formatearFecha(promocion.hasta)}
                </Text>
              </View>
            </Pressable>
          </Link>
        ))
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
    avisoSinConexion: {
      flexDirection: "row",
      alignItems: "center",
      gap: 9,
      backgroundColor: colores.promoFondo,
      borderRadius: 14,
      padding: 13,
    },
    avisoSinConexionTexto: { flex: 1, fontSize: 13, lineHeight: 18, color: colores.promo, fontWeight: "600" },
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
    descuentoChip: {
      alignSelf: "flex-start",
      backgroundColor: colores.promoFondo,
      borderRadius: 999,
      paddingHorizontal: 10,
      paddingVertical: 6,
    },
    descuento: { fontSize: 13, fontWeight: "800", color: colores.promo },
    vigenciaFila: { flexDirection: "row", alignItems: "center", gap: 5 },
    vigencia: { fontSize: 12, color: colores.secundario },
    estadoContainer: {
      flex: 1,
      backgroundColor: colores.fondo,
      alignItems: "center",
      justifyContent: "center",
      padding: 24,
      gap: 8,
    },
    estadoVacio: { alignItems: "center", justifyContent: "center", paddingVertical: 50, gap: 8 },
    estadoTitulo: { fontSize: 18, fontWeight: "800", color: colores.texto, textAlign: "center" },
    estadoTexto: { fontSize: 14, lineHeight: 20, color: colores.secundario, textAlign: "center" },
    errorTexto: { fontSize: 14, lineHeight: 20, color: colores.secundario, textAlign: "center" },
  });
}
