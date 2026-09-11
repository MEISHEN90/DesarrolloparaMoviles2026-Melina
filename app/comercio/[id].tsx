import { Stack, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

import { obtenerComercioPorId } from "../../src/servicios/comercios";
import { Comercio } from "../../src/tipos/modelos";

export default function ComercioDetalleScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  const [comercio, setComercio] = useState<Comercio | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function cargarComercio() {
      try {
        setCargando(true);
        setError(null);

        const datos = await obtenerComercioPorId(id);

        setComercio(datos);
      } catch {
        setError("No fue posible cargar el comercio.");
      } finally {
        setCargando(false);
      }
    }

    cargarComercio();
  }, [id]);

  if (cargando) {
    return (
      <View style={styles.estadoContainer}>
        <ActivityIndicator size="large" />
        <Text style={styles.estadoTexto}>Cargando comercio...</Text>
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

  if (!comercio) {
    return (
      <View style={styles.estadoContainer}>
        <Text style={styles.estadoTexto}>Comercio no encontrado.</Text>
      </View>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: comercio.nombre,
        }}
      />

      <View style={styles.container}>
        <Text style={styles.title}>{comercio.nombre}</Text>

        <Text style={styles.descripcion}>{comercio.descripcion}</Text>

        <Text style={styles.label}>Dirección</Text>
        <Text style={styles.text}>{comercio.direccion}</Text>

        <Text style={styles.label}>Teléfono</Text>
        <Text style={styles.text}>{comercio.telefono ?? "No informado"}</Text>

        <Text style={styles.label}>WhatsApp</Text>
        <Text style={styles.text}>{comercio.whatsapp ?? "No informado"}</Text>

        <Text style={styles.label}>Instagram</Text>
        <Text style={styles.text}>{comercio.instagram ?? "No informado"}</Text>

        <Text style={styles.label}>Medios de pago</Text>
        <Text style={styles.text}>{comercio.mediosDePago.join(", ")}</Text>

        <Text style={styles.label}>Valoración</Text>
        <Text style={styles.text}>
          ★ {comercio.puntaje.toFixed(1)} · {comercio.cantidadResenas} reseñas
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

  descripcion: {
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
