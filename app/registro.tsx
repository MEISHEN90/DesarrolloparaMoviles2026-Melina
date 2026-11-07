import { Ionicons } from "@expo/vector-icons";
import { router, Stack } from "expo-router";
import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
} from "react-native";

import { useTema } from "../src/contexto/tema";
import { registrarUsuario } from "../src/servicios/autenticacion";
import { guardarSesion } from "../src/servicios/sesion";
import { validarRegistro } from "../src/utils/autenticacion";

export default function RegistroScreen() {
  const { colores } = useTema();
  const styles = useMemo(() => crearEstilos(colores), [colores]);
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmarPassword, setConfirmarPassword] = useState("");
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function manejarRegistro() {
    const errorDeValidacion = validarRegistro(
      nombre,
      email,
      password,
      confirmarPassword,
    );

    if (errorDeValidacion) {
      setError(errorDeValidacion);
      return;
    }

    try {
      setCargando(true);
      setError(null);

      const resultado = await registrarUsuario({ nombre, email, password });
      await guardarSesion(resultado.token, resultado.usuario.id);

      router.replace("/(tabs)/perfil");
    } catch (errorDesconocido) {
      if (errorDesconocido instanceof Error) {
        setError(errorDesconocido.message);
      } else {
        setError("No fue posible registrar el usuario.");
      }
    } finally {
      setCargando(false);
    }
  }

  return (
    <>
      <Stack.Screen options={{ title: "Crear cuenta" }} />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        <Ionicons name="person-add-outline" size={34} color={colores.primario} />

        <Text style={styles.title}>Crear cuenta</Text>

        <Text style={styles.subtitle}>
          Registrate para acceder a favoritos, reseñas y promociones.
        </Text>

        <Text style={styles.label}>Nombre</Text>
        <TextInput
          value={nombre}
          onChangeText={setNombre}
          placeholder="Nombre y apellido"
          placeholderTextColor={colores.secundario}
          autoCapitalize="words"
          style={styles.input}
          accessibilityLabel="Nombre"
        />

        <Text style={styles.label}>Correo electrónico</Text>
        <TextInput
          value={email}
          onChangeText={setEmail}
          placeholder="correo@ejemplo.com"
          placeholderTextColor={colores.secundario}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          style={styles.input}
          accessibilityLabel="Correo electrónico"
        />

        <Text style={styles.label}>Contraseña</Text>
        <TextInput
          value={password}
          onChangeText={setPassword}
          placeholder="Mínimo 8 caracteres"
          placeholderTextColor={colores.secundario}
          secureTextEntry
          autoCapitalize="none"
          style={styles.input}
          accessibilityLabel="Contraseña"
        />

        <Text style={styles.label}>Confirmar contraseña</Text>
        <TextInput
          value={confirmarPassword}
          onChangeText={setConfirmarPassword}
          placeholder="Repetir contraseña"
          placeholderTextColor={colores.secundario}
          secureTextEntry
          autoCapitalize="none"
          style={styles.input}
          accessibilityLabel="Confirmar contraseña"
        />

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <Pressable
          onPress={manejarRegistro}
          disabled={cargando}
          style={[styles.boton, cargando && styles.botonDeshabilitado]}
          accessibilityRole="button"
          accessibilityLabel="Crear cuenta"
        >
          {cargando ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.botonTexto}>Crear cuenta</Text>
          )}
        </Pressable>

        <Pressable
          onPress={() => router.back()}
          style={styles.botonSecundario}
          accessibilityRole="button"
          accessibilityLabel="Volver al inicio de sesión"
        >
          <Text style={styles.botonSecundarioTexto}>Ya tengo una cuenta</Text>
        </Pressable>
      </ScrollView>
    </>
  );
}

function crearEstilos(colores: ReturnType<typeof useTema>["colores"]) {
  return StyleSheet.create({
    scroll: {
      flex: 1,
      backgroundColor: colores.fondo,
    },
    container: {
      padding: 24,
      paddingBottom: 36,
    },
    title: {
      fontSize: 28,
      fontWeight: "800",
      color: colores.texto,
      marginTop: 14,
      marginBottom: 5,
    },
    subtitle: {
      fontSize: 16,
      lineHeight: 22,
      color: colores.secundario,
      marginBottom: 18,
    },
    label: {
      fontSize: 14,
      fontWeight: "700",
      color: colores.texto,
      marginTop: 10,
      marginBottom: 7,
    },
    input: {
      minHeight: 48,
      borderWidth: 1,
      borderColor: colores.borde,
      borderRadius: 12,
      paddingHorizontal: 14,
      paddingVertical: 12,
      fontSize: 16,
      color: colores.texto,
      backgroundColor: colores.tarjeta,
    },
    error: {
      marginTop: 10,
      fontSize: 14,
      fontWeight: "600",
      color: colores.peligro,
    },
    boton: {
      marginTop: 20,
      minHeight: 48,
      borderRadius: 12,
      backgroundColor: colores.primario,
      paddingVertical: 14,
      alignItems: "center",
      justifyContent: "center",
    },
    botonDeshabilitado: {
      opacity: 0.6,
    },
    botonTexto: {
      color: "#FFFFFF",
      fontSize: 16,
      fontWeight: "700",
    },
    botonSecundario: {
      marginTop: 6,
      paddingVertical: 12,
      alignItems: "center",
    },
    botonSecundarioTexto: {
      color: colores.primario,
      fontSize: 15,
      fontWeight: "700",
    },
  });
}
