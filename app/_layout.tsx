import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import "react-native-reanimated";

import { useColorScheme } from "@/hooks/use-color-scheme";
import { useSincronizacionResenas } from "../src/hooks/use-sincronizacion-resenas";
import { inicializarBaseDatos } from "../src/servicios/base-datos";
import { configurarNotificaciones } from "../src/servicios/notificaciones";

export const unstable_settings = {
  anchor: "(tabs)",
};

function SincronizadorResenas() {
  useSincronizacionResenas();
  return null;
}

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [baseLista, setBaseLista] = useState(false);
  const [errorBase, setErrorBase] = useState<string | null>(null);

  useEffect(() => {
    async function prepararAplicacion() {
      try {
        await inicializarBaseDatos();
        await configurarNotificaciones();
        setBaseLista(true);
      } catch (errorDesconocido) {
        if (errorDesconocido instanceof Error) {
          setErrorBase(errorDesconocido.message);
        } else {
          setErrorBase("No fue posible inicializar la base de datos local.");
        }
      }
    }

    prepararAplicacion();
  }, []);

  if (errorBase) {
    return (
      <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
        <View style={styles.estadoContainer}>
          <Text style={styles.titulo}>Error al iniciar la aplicación</Text>
          <Text style={styles.descripcion}>{errorBase}</Text>
        </View>
        <StatusBar style="auto" />
      </ThemeProvider>
    );
  }

  if (!baseLista) {
    return (
      <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
        <View style={styles.estadoContainer}>
          <ActivityIndicator size="large" />
          <Text style={styles.descripcion}>Preparando datos locales...</Text>
        </View>
        <StatusBar style="auto" />
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
      <SincronizadorResenas />

      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="login" options={{ title: "Iniciar sesión" }} />
        <Stack.Screen name="registro" options={{ title: "Crear cuenta" }} />
        <Stack.Screen name="escanear-qr" options={{ title: "Escanear QR" }} />
        <Stack.Screen name="mi-comercio" options={{ title: "Mi comercio" }} />
        <Stack.Screen
          name="imagen-comercio"
          options={{ title: "Imagen del comercio" }}
        />
        <Stack.Screen name="comercio/[id]" options={{ title: "Comercio" }} />
        <Stack.Screen name="promocion/[id]" options={{ title: "Promoción" }} />
      </Stack>

      <StatusBar style="auto" />
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  estadoContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    gap: 12,
  },
  titulo: {
    fontSize: 22,
    fontWeight: "700",
    textAlign: "center",
  },
  descripcion: {
    fontSize: 16,
    textAlign: "center",
  },
});
