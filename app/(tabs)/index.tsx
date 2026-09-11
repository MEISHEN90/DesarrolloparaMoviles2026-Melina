import { Link } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { obtenerComercios } from "../../src/servicios/comercios";
import { Comercio } from "../../src/tipos/modelos";

export default function ComerciosScreen() {
  const [comercios, setComercios] = useState<Comercio[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function cargarComercios() {
      try {
        setCargando(true);
        setError(null);

        const datos = await obtenerComercios();

        setComercios(datos);
      } catch {
        setError("No fue posible cargar los comercios.");
      } finally {
        setCargando(false);
      }
    }

    cargarComercios();
  }, []);

  if (cargando) {
    return (
      <View style={styles.estadoContainer}>
        <ActivityIndicator size="large" />
        <Text style={styles.estadoTexto}>Cargando comercios...</Text>
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

  if (comercios.length === 0) {
    return (
      <View style={styles.estadoContainer}>
        <Text style={styles.estadoTexto}>No hay comercios disponibles.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Directorio de Comercios</Text>

      <Text style={styles.subtitle}>
        Encontrá comercios de Concepción del Uruguay.
      </Text>

      {comercios.map((comercio) => (
        <Link
          key={comercio.id}
          href={{
            pathname: "/comercio/[id]",
            params: { id: comercio.id },
          }}
          asChild
        >
          <Pressable style={styles.card}>
            <Text style={styles.cardTitle}>{comercio.nombre}</Text>

            <Text style={styles.cardText}>{comercio.descripcion}</Text>

            <Text style={styles.direccion}>{comercio.direccion}</Text>

            <Text style={styles.puntaje}>
              ★ {comercio.puntaje.toFixed(1)} · {comercio.cantidadResenas}{" "}
              reseñas
            </Text>

            <Text style={styles.linkText}>Ver comercio</Text>
          </Pressable>
        </Link>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    gap: 16,
  },

  title: {
    fontSize: 26,
    fontWeight: "700",
  },

  subtitle: {
    fontSize: 16,
    marginBottom: 4,
  },

  card: {
    padding: 18,
    borderWidth: 1,
    borderRadius: 12,
    gap: 6,
  },

  cardTitle: {
    fontSize: 18,
    fontWeight: "600",
  },

  cardText: {
    fontSize: 14,
  },

  direccion: {
    fontSize: 13,
  },

  puntaje: {
    fontSize: 14,
    fontWeight: "500",
  },

  linkText: {
    marginTop: 8,
    fontWeight: "600",
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
