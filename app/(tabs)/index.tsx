import { Link } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { buscarComercios } from "../../src/servicios/comercios";
import { obtenerRubros } from "../../src/servicios/rubros";
import { Comercio, Rubro } from "../../src/tipos/modelos";

export default function ComerciosScreen() {
  const [comercios, setComercios] = useState<Comercio[]>([]);
  const [rubros, setRubros] = useState<Rubro[]>([]);

  const [textoBusqueda, setTextoBusqueda] = useState("");

  const [rubroSeleccionado, setRubroSeleccionado] = useState<string | null>(
    null,
  );

  const [soloAbiertos, setSoloAbiertos] = useState(false);

  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function cargarRubros() {
      try {
        const datos = await obtenerRubros();
        setRubros(datos);
      } catch {
        setError("No fue posible cargar los rubros.");
      }
    }

    cargarRubros();
  }, []);

  useEffect(() => {
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
  }, [textoBusqueda, rubroSeleccionado, soloAbiertos]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Directorio de Comercios</Text>

      <Text style={styles.subtitle}>
        Encontrá comercios de Concepción del Uruguay.
      </Text>

      <TextInput
        value={textoBusqueda}
        onChangeText={setTextoBusqueda}
        placeholder="Buscar por nombre o producto..."
        style={styles.input}
        accessibilityLabel="Buscar comercios"
      />

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.rubrosContainer}
      >
        <Pressable
          onPress={() => setRubroSeleccionado(null)}
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
            onPress={() => setRubroSeleccionado(rubro.id)}
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

      <Pressable
        onPress={() => setSoloAbiertos((valorActual) => !valorActual)}
        style={[
          styles.filtroAbierto,
          soloAbiertos && styles.filtroAbiertoSeleccionado,
        ]}
        accessibilityRole="button"
        accessibilityState={{
          selected: soloAbiertos,
        }}
        accessibilityLabel="Filtrar comercios abiertos ahora"
      >
        <Text
          style={[
            styles.filtroAbiertoTexto,
            soloAbiertos && styles.filtroAbiertoTextoSeleccionado,
          ]}
        >
          {soloAbiertos ? "✓ " : ""}
          Abierto ahora
        </Text>
      </Pressable>

      {cargando ? (
        <View style={styles.estadoContainer}>
          <ActivityIndicator size="large" />
          <Text style={styles.estadoTexto}>Cargando comercios...</Text>
        </View>
      ) : error ? (
        <View style={styles.estadoContainer}>
          <Text style={styles.errorTexto}>{error}</Text>
        </View>
      ) : comercios.length === 0 ? (
        <View style={styles.estadoContainer}>
          <Text style={styles.estadoTexto}>No se encontraron comercios.</Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.lista}
          showsVerticalScrollIndicator={false}
        >
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
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },

  title: {
    fontSize: 26,
    fontWeight: "700",
  },

  subtitle: {
    fontSize: 16,
    marginTop: 6,
    marginBottom: 14,
  },

  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 16,
    marginBottom: 12,
  },

  rubrosContainer: {
    gap: 8,
    paddingBottom: 12,
  },

  chip: {
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },

  chipSeleccionado: {
    backgroundColor: "#222",
  },

  chipTexto: {
    fontSize: 14,
  },

  chipTextoSeleccionado: {
    color: "#fff",
    fontWeight: "600",
  },

  filtroAbierto: {
    alignSelf: "flex-start",
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginBottom: 12,
  },

  filtroAbiertoSeleccionado: {
    backgroundColor: "#222",
  },

  filtroAbiertoTexto: {
    fontSize: 14,
  },

  filtroAbiertoTextoSeleccionado: {
    color: "#fff",
    fontWeight: "600",
  },

  lista: {
    gap: 12,
    paddingBottom: 24,
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
