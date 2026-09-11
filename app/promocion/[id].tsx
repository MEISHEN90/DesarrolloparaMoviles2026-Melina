import { Stack, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

import { obtenerPromocionPorId } from "../../src/servicios/promociones";
import { Promocion } from "../../src/tipos/modelos";

export default function PromocionDetalleScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  const [promocion, setPromocion] = useState<Promocion | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function cargarPromocion() {
      try {
        setCargando(true);
        setError(null);

        const datos = await obtenerPromocionPorId(id);

        setPromocion(datos);
      } catch {
        setError("No fue posible cargar la promoción.");
      } finally {
        setCargando(false);
      }
    }

    cargarPromocion();
  }, [id]);

  if (cargando) {
    return (
      <View style={styles.estadoContainer}>
        <ActivityIndicator size="large" />
        <Text style={styles.estadoTexto}>Cargando promoción...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.estadoContainer}>
        <Text style={styles.errorTexto}>{error}</Text>
      </View>
    );
  }

  if (!promocion) {
    return (
      <View style={styles.estadoContainer}>
        <Text style={styles.estadoTexto}>Promoción no encontrada.</Text>
      </View>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: promocion.titulo,
        }}
      />

      <View style={styles.container}>
        <Text style={styles.title}>{promocion.titulo}</Text>

        <Text style={styles.detalle}>{promocion.detalle}</Text>

        <Text style={styles.label}>Descuento</Text>
        <Text style={styles.text}>
          {promocion.descuento !== null
            ? `${promocion.descuento}%`
            : "Beneficio especial"}
        </Text>

        <Text style={styles.label}>Vigencia</Text>
        <Text style={styles.text}>
          Desde {promocion.desde} hasta {promocion.hasta}
        </Text>

        <Text style={styles.label}>Exclusiva de la app</Text>
        <Text style={styles.text}>{promocion.soloApp ? "Sí" : "No"}</Text>

        <Text style={styles.label}>Usos registrados</Text>
        <Text style={styles.text}>{promocion.usos}</Text>

        <Text style={styles.label}>Estado</Text>
        <Text style={styles.text}>
          {promocion.activa ? "Activa" : "Inactiva"}
        </Text>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    gap: 8,
  },

  title: {
    fontSize: 26,
    fontWeight: "700",
    marginBottom: 4,
  },

  detalle: {
    fontSize: 16,
    marginBottom: 12,
  },

  label: {
    fontSize: 14,
    fontWeight: "700",
    marginTop: 8,
  },

  text: {
    fontSize: 15,
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
    textAlign: "center",
  },

  errorTexto: {
    fontSize: 16,
    textAlign: "center",
    fontWeight: "600",
  },
});
