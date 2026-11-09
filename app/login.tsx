import { Ionicons } from "@expo/vector-icons";
import { router, Stack } from "expo-router";
import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { useTema } from "../src/contexto/tema";
import { iniciarSesion } from "../src/servicios/autenticacion";
import { guardarSesion } from "../src/servicios/sesion";
import { validarIngreso } from "../src/utils/autenticacion";

export default function LoginScreen() {
  const { colores } = useTema();
  const styles = useMemo(() => crearEstilos(colores), [colores]);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function manejarLogin() {
    const errorDeValidacion = validarIngreso(email, password);

    if (errorDeValidacion) {
      setError(errorDeValidacion);
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
      <Stack.Screen options={{ title: "Iniciar sesión" }} />

      <View style={styles.container}>
        <View style={styles.icono}>
          <Ionicons name="person-circle-outline" size={34} color={colores.primario} />
        </View>

        <Text style={styles.title}>Iniciar sesión</Text>

        <Text style={styles.subtitle}>
          Ingresá para acceder a tus favoritos, reseñas y promociones.
        </Text>

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
          placeholder="Contraseña"
          placeholderTextColor={colores.secundario}
          secureTextEntry
          autoCapitalize="none"
          style={styles.input}
          accessibilityLabel="Contraseña"
        />

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <Pressable
          onPress={manejarLogin}
          disabled={cargando}
          style={[styles.boton, cargando && styles.botonDeshabilitado]}
          accessibilityRole="button"
          accessibilityLabel="Iniciar sesión"
        >
          {cargando ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <>
              <Ionicons name="log-in-outline" size={19} color="#FFFFFF" />
              <Text style={styles.botonTexto}>Iniciar sesión</Text>
            </>
          )}
        </Pressable>

        <Pressable
          onPress={() => router.push("/registro")}
          style={styles.botonSecundario}
          accessibilityRole="button"
          accessibilityLabel="Crear una cuenta"
        >
          <Text style={styles.botonSecundarioTexto}>Crear una cuenta</Text>
        </Pressable>

        <Pressable
          onPress={() => router.back()}
          style={styles.botonSecundario}
          accessibilityRole="button"
          accessibilityLabel="Continuar sin iniciar sesión"
        >
          <Text style={styles.botonSecundarioTexto}>
            Continuar sin iniciar sesión
          </Text>
        </Pressable>
      </View>
    </>
  );
}

function crearEstilos(colores: ReturnType<typeof useTema>["colores"]) {
  return StyleSheet.create({
    container: {
      flex: 1,
      padding: 24,
      backgroundColor: colores.fondo,
    },
    icono: {
      width: 58,
      height: 58,
      borderRadius: 29,
      backgroundColor: colores.comercioFondo,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 18,
    },
    title: {
      fontSize: 28,
      fontWeight: "800",
      color: colores.texto,
      marginBottom: 5,
    },
    subtitle: {
      fontSize: 16,
      lineHeight: 22,
      color: colores.secundario,
      marginBottom: 20,
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
      minHeight: 48,
      marginTop: 20,
      borderRadius: 12,
      backgroundColor: colores.primario,
      paddingVertical: 14,
      alignItems: "center",
      justifyContent: "center",
      flexDirection: "row",
      gap: 8,
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
