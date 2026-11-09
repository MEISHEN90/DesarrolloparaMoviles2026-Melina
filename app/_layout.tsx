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

import { TemaProvider, useTema } from "../src/contexto/tema";
import { useAvisosPromociones } from "../src/hooks/use-avisos-promociones";
import { useSincronizacionResenas } from "../src/hooks/use-sincronizacion-resenas";
import { inicializarBaseDatos } from "../src/servicios/base-datos";
import { configurarNotificaciones } from "../src/servicios/notificaciones";

export const unstable_settings = {
  anchor: "(tabs)",
};

/*
 * Efectos globales que necesitan la app ya montada y la base lista:
 * sincronizar reseñas pendientes y revisar avisos de promociones.
 */
function EfectosDeSegundoPlano() {
  useSincronizacionResenas();
  useAvisosPromociones();

  return null;
}

function ContenidoRaiz() {
  const { tema, colores, cargado } = useTema();
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

    void prepararAplicacion();
  }, []);

  const temaNavegacion = tema === "dark" ? DarkTheme : DefaultTheme;

  if (!cargado || !baseLista) {
    return (
      <ThemeProvider value={temaNavegacion}>
        <View style={[styles.estadoContainer, { backgroundColor: colores.fondo }]}>
          <ActivityIndicator size="large" color={colores.primario} />
          <Text style={[styles.descripcion, { color: colores.secundario }]}>
            Preparando datos locales...
          </Text>
        </View>
        <StatusBar style={tema === "dark" ? "light" : "dark"} />
      </ThemeProvider>
    );
  }

  if (errorBase) {
    return (
      <ThemeProvider value={temaNavegacion}>
        <View style={[styles.estadoContainer, { backgroundColor: colores.fondo }]}>
          <Text style={[styles.titulo, { color: colores.texto }]}>
            Error al iniciar la aplicación
          </Text>
          <Text style={[styles.descripcion, { color: colores.secundario }]}>
            {errorBase}
          </Text>
        </View>
        <StatusBar style={tema === "dark" ? "light" : "dark"} />
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider value={temaNavegacion}>
      <EfectosDeSegundoPlano />

      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: colores.tarjeta },
          headerTintColor: colores.texto,
          contentStyle: { backgroundColor: colores.fondo },
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="login" options={{ title: "Iniciar sesión" }} />
        <Stack.Screen name="registro" options={{ title: "Crear cuenta" }} />
        <Stack.Screen name="escanear-qr" options={{ title: "Escanear QR" }} />
        <Stack.Screen name="mi-comercio" options={{ title: "Mi comercio" }} />
        <Stack.Screen
          name="imagen-comercio"
          options={{ title: "Fotos y video" }}
        />
        <Stack.Screen name="comercio/[id]" options={{ title: "Comercio" }} />
        <Stack.Screen name="promocion/[id]" options={{ title: "Promoción" }} />
      </Stack>

      <StatusBar style={tema === "dark" ? "light" : "dark"} />
    </ThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <TemaProvider>
      <ContenidoRaiz />
    </TemaProvider>
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
