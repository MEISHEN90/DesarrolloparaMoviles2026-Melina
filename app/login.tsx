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

import { iniciarSesion } from "../src/servicios/autenticacion";
import { guardarSesion } from "../src/servicios/sesion";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function manejarLogin() {
    if (!email.trim() || !password.trim()) {
      setError("Debe completar correo electrónico y contraseña.");
      return;
    }

    try {
      setCargando(true);
      setError(null);

      const resultado = await iniciarSesion(email, password);

      await guardarSesion(resultado.token, resultado.usuario.id);

      router.replace("/(tabs)/perfil");
    } catch (errorDesconocido) {
      if (errorDesconocido instanceof Error) {
        setError(errorDesconocido.message);
      } else {
        setError("No fue posible iniciar sesión.");
      }
    } finally {
      setCargando(false);
    }
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: "Iniciar sesión",
        }}
      />

      <View style={styles.container}>
        <Text style={styles.title}>Iniciar sesión</Text>

        <Text style={styles.subtitle}>
          Ingresá para acceder a tus favoritos, reseñas y promociones.
        </Text>

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
          placeholder="Contraseña"
          secureTextEntry
          autoCapitalize="none"
          style={styles.input}
          accessibilityLabel="Contraseña"
        />

        {error && <Text style={styles.error}>{error}</Text>}

        <Pressable
          onPress={manejarLogin}
          disabled={cargando}
          style={[styles.boton, cargando && styles.botonDeshabilitado]}
          accessibilityRole="button"
        >
          {cargando ? (
            <ActivityIndicator />
          ) : (
            <Text style={styles.botonTexto}>Iniciar sesión</Text>
          )}
        </Pressable>

        <Pressable
          onPress={() => router.back()}
          style={styles.botonSecundario}
          accessibilityRole="button"
        >
          <Text style={styles.botonSecundarioTexto}>
            Continuar sin iniciar sesión
          </Text>
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
