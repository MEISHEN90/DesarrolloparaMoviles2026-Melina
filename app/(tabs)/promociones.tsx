import { Link } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { useEstadoRed } from "../../src/hooks/use-estado-red";
import { obtenerPromociones } from "../../src/servicios/promociones";
import { Promocion } from "../../src/tipos/modelos";

export default function PromocionesScreen() {
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

    cargarPromociones();
  }, [estadoRed.conectado, estadoRed.tieneInternet]);

  if (cargando) {
    return (
      <View style={styles.estadoContainer}>
        <ActivityIndicator size="large" />

        <Text style={styles.estadoTexto}>Cargando promociones...</Text>
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

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Promociones</Text>

      <Text style={styles.subtitle}>
        Consultá las promociones disponibles en los comercios.
      </Text>

      {sinConexion && (
        <View style={styles.avisoSinConexion}>
          <Text style={styles.avisoSinConexionTexto}>
            Sin conexión. Se mostrarán las promociones disponibles localmente.
          </Text>
        </View>
      )}

      {promociones.length === 0 ? (
        <View style={styles.estadoContainer}>
          <Text style={styles.estadoTexto}>
            No hay promociones disponibles.
          </Text>
        </View>
      ) : (
        promociones.map((promocion) => (
          <Link
            key={promocion.id}
            href={{
              pathname: "/promocion/[id]",
              params: {
                id: promocion.id,
              },
            }}
            asChild
          >
            <Pressable style={styles.card}>
              <Text style={styles.cardTitle}>{promocion.titulo}</Text>

              <Text style={styles.cardText}>{promocion.detalle}</Text>

              {promocion.descuento !== null && (
                <Text style={styles.descuento}>
                  {promocion.descuento}% de descuento
                </Text>
              )}

              <Text style={styles.vigencia}>
                Vigente hasta: {promocion.hasta}
              </Text>

              <Text style={styles.linkText}>Ver promoción</Text>
            </Pressable>
          </Link>
        ))
      )}
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

  avisoSinConexion: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
  },

  avisoSinConexionTexto: {
    fontSize: 14,
    fontWeight: "600",
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

  descuento: {
    fontSize: 15,
    fontWeight: "700",
  },

  vigencia: {
    fontSize: 13,
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
