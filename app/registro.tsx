import { router, Stack } from "expo-router";
import { useState } from "react";
import {
    ActivityIndicator,
    Pressable,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";

import { registrarUsuario } from "../src/servicios/autenticacion";
import { guardarSesion } from "../src/servicios/sesion";

export default function RegistroScreen() {
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmarPassword, setConfirmarPassword] = useState("");

  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function manejarRegistro() {
    if (
      !nombre.trim() ||
      !email.trim() ||
      !password.trim() ||
      !confirmarPassword.trim()
    ) {
      setError("Debe completar todos los campos.");
      return;
    }

    if (password !== confirmarPassword) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    try {
      setCargando(true);
      setError(null);

      const resultado = await registrarUsuario({
        nombre,
        email,
        password,
      });

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
      <Stack.Screen
        options={{
          title: "Crear cuenta",
        }}
      />

      <View style={styles.container}>
        <Text style={styles.title}>Crear cuenta</Text>

        <Text style={styles.subtitle}>
          Registrate para acceder a favoritos, reseñas y promociones.
        </Text>

        <Text style={styles.label}>Nombre</Text>

        <TextInput
          value={nombre}
          onChangeText={setNombre}
          placeholder="Nombre y apellido"
          autoCapitalize="words"
          style={styles.input}
          accessibilityLabel="Nombre"
        />

        <Text style={styles.label}>Correo electrónico</Text>

        <TextInput
          value={email}
          onChangeText={setEmail}
          placeholder="correo@ejemplo.com"
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
          placeholder="Mínimo 6 caracteres"
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
          secureTextEntry
          autoCapitalize="none"
          style={styles.input}
          accessibilityLabel="Confirmar contraseña"
        />

        {error && <Text style={styles.error}>{error}</Text>}

        <Pressable
          onPress={manejarRegistro}
          disabled={cargando}
          style={[styles.boton, cargando && styles.botonDeshabilitado]}
          accessibilityRole="button"
          accessibilityLabel="Crear cuenta"
        >
          {cargando ? (
            <ActivityIndicator />
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
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    gap: 10,
  },

  title: {
    fontSize: 28,
    fontWeight: "700",
    marginBottom: 4,
  },

  subtitle: {
    fontSize: 16,
    marginBottom: 18,
  },

  label: {
    fontSize: 14,
    fontWeight: "600",
    marginTop: 8,
  },

  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
  },

  error: {
    marginTop: 8,
    fontSize: 14,
    fontWeight: "600",
  },

  boton: {
    marginTop: 16,
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

  botonSecundario: {
    marginTop: 4,
    paddingVertical: 12,
    alignItems: "center",
  },

  botonSecundarioTexto: {
    fontSize: 15,
    fontWeight: "600",
  },
});
