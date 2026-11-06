import { Stack } from "expo-router";
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

import {
  actualizarMiComercio,
  obtenerMiComercio,
} from "../src/servicios/mi-comercio";

function vacioANull(valor: string): string | null {
  const limpio = valor.trim();
  return limpio.length === 0 ? null : limpio;
}

export default function MiComercioScreen() {
  const [nombre, setNombre] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [direccion, setDireccion] = useState("");
  const [telefono, setTelefono] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [instagram, setInstagram] = useState("");

  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mensaje, setMensaje] = useState<string | null>(null);

  useEffect(() => {
    async function cargar() {
      try {
        setCargando(true);
        setError(null);

        const comercio = await obtenerMiComercio();

        setNombre(comercio.nombre);
        setDescripcion(comercio.descripcion);
        setDireccion(comercio.direccion);
        setTelefono(comercio.telefono ?? "");
        setWhatsapp(comercio.whatsapp ?? "");
        setInstagram(comercio.instagram ?? "");
      } catch (errorDesconocido) {
        setError(
          errorDesconocido instanceof Error
            ? errorDesconocido.message
            : "No fue posible cargar los datos del comercio.",
        );
      } finally {
        setCargando(false);
      }
    }

    cargar();
  }, []);

  async function guardar() {
    if (!nombre.trim() || !descripcion.trim() || !direccion.trim()) {
      setError("Nombre, descripción y dirección son obligatorios.");
      return;
    }

    try {
      setGuardando(true);
      setError(null);
      setMensaje(null);

      const actualizado = await actualizarMiComercio({
        nombre: nombre.trim(),
        descripcion: descripcion.trim(),
        direccion: direccion.trim(),
        telefono: vacioANull(telefono),
        whatsapp: vacioANull(whatsapp),
        instagram: vacioANull(instagram),
      });

      setNombre(actualizado.nombre);
      setDescripcion(actualizado.descripcion);
      setDireccion(actualizado.direccion);
      setTelefono(actualizado.telefono ?? "");
      setWhatsapp(actualizado.whatsapp ?? "");
      setInstagram(actualizado.instagram ?? "");

      setMensaje("Los datos del comercio se actualizaron correctamente.");
    } catch (errorDesconocido) {
      setError(
        errorDesconocido instanceof Error
          ? errorDesconocido.message
          : "No fue posible guardar los cambios.",
      );
    } finally {
      setGuardando(false);
    }
  }

  if (cargando) {
    return (
      <View style={styles.estado}>
        <ActivityIndicator size="large" />
        <Text>Cargando datos del comercio...</Text>
      </View>
    );
  }

  return (
    <>
      <Stack.Screen options={{ title: "Mi comercio" }} />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.title}>Editar mi comercio</Text>

        <Text style={styles.descripcion}>
          Estos datos son los que ven los vecinos en la ficha pública.
        </Text>

        <Text style={styles.label}>Nombre</Text>
        <TextInput
          value={nombre}
          onChangeText={setNombre}
          style={styles.input}
          accessibilityLabel="Nombre del comercio"
        />

        <Text style={styles.label}>Descripción</Text>
        <TextInput
          value={descripcion}
          onChangeText={setDescripcion}
          style={[styles.input, styles.area]}
          multiline
          textAlignVertical="top"
          accessibilityLabel="Descripción del comercio"
        />

        <Text style={styles.label}>Dirección</Text>
        <TextInput
          value={direccion}
          onChangeText={setDireccion}
          style={styles.input}
          accessibilityLabel="Dirección del comercio"
        />

        <Text style={styles.label}>Teléfono</Text>
        <TextInput
          value={telefono}
          onChangeText={setTelefono}
          style={styles.input}
          keyboardType="phone-pad"
          accessibilityLabel="Teléfono del comercio"
        />

        <Text style={styles.label}>WhatsApp</Text>
        <TextInput
          value={whatsapp}
          onChangeText={setWhatsapp}
          style={styles.input}
          keyboardType="phone-pad"
          accessibilityLabel="WhatsApp del comercio"
        />

        <Text style={styles.label}>Instagram</Text>
        <TextInput
          value={instagram}
          onChangeText={setInstagram}
          style={styles.input}
          autoCapitalize="none"
          accessibilityLabel="Instagram del comercio"
        />

        {error ? <Text style={styles.error}>{error}</Text> : null}
        {mensaje ? <Text style={styles.mensaje}>{mensaje}</Text> : null}

        <Pressable
          onPress={guardar}
          disabled={guardando}
          style={[styles.boton, guardando && styles.botonDeshabilitado]}
          accessibilityRole="button"
          accessibilityLabel="Guardar cambios del comercio"
        >
          {guardando ? (
            <ActivityIndicator />
          ) : (
            <Text style={styles.botonTexto}>Guardar cambios</Text>
          )}
        </Pressable>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
  },
  container: {
    padding: 24,
    paddingBottom: 40,
  },
  estado: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    padding: 24,
  },
  title: {
    fontSize: 26,
    fontWeight: "700",
    marginBottom: 8,
  },
  descripcion: {
    fontSize: 15,
    lineHeight: 21,
    marginBottom: 18,
  },
  label: {
    fontSize: 14,
    fontWeight: "700",
    marginTop: 12,
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
  },
  area: {
    minHeight: 110,
  },
  error: {
    marginTop: 16,
    fontSize: 14,
    fontWeight: "600",
  },
  mensaje: {
    marginTop: 16,
    fontSize: 14,
    fontWeight: "600",
  },
  boton: {
    marginTop: 24,
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center",
  },
  botonDeshabilitado: {
    opacity: 0.6,
  },
  botonTexto: {
    fontSize: 16,
    fontWeight: "700",
  },
});
