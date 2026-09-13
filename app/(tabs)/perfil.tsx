import { router, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { obtenerUsuarioPorId } from "../../src/servicios/autenticacion";
import {
  cerrarSesion,
  obtenerUsuarioSesionId,
} from "../../src/servicios/sesion";
import { Usuario } from "../../src/tipos/modelos";

export default function PerfilScreen() {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [cargando, setCargando] = useState(true);

  useFocusEffect(
    useCallback(() => {
      let activo = true;

      async function cargarSesion() {
        try {
          setCargando(true);

          const usuarioId = await obtenerUsuarioSesionId();

          if (!activo) {
            return;
          }

          if (!usuarioId) {
            setUsuario(null);
            return;
          }

          const usuarioEncontrado = await obtenerUsuarioPorId(usuarioId);

          if (!activo) {
            return;
          }

          setUsuario(usuarioEncontrado);
        } catch {
          if (activo) {
            setUsuario(null);
          }
        } finally {
          if (activo) {
            setCargando(false);
          }
        }
      }

      cargarSesion();

      return () => {
        activo = false;
      };
    }, []),
  );

  async function manejarCerrarSesion() {
    await cerrarSesion();
    setUsuario(null);
  }

  if (cargando) {
    return (
      <View style={styles.estadoContainer}>
        <ActivityIndicator size="large" />
        <Text style={styles.descripcion}>Cargando sesión...</Text>
      </View>
    );
  }

  if (!usuario) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Mi perfil</Text>

        <Text style={styles.descripcion}>
          Podés consultar comercios y promociones sin iniciar sesión.
        </Text>

        <Text style={styles.descripcion}>
          Iniciá sesión para acceder a favoritos, reseñas y promociones
          asociadas a tu cuenta.
        </Text>

        <Pressable
          onPress={() => router.push("/login")}
          style={styles.boton}
          accessibilityRole="button"
          accessibilityLabel="Iniciar sesión"
        >
          <Text style={styles.botonTexto}>Iniciar sesión</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Mi perfil</Text>

      <Text style={styles.label}>Nombre</Text>
      <Text style={styles.descripcion}>{usuario.nombre}</Text>

      <Text style={styles.label}>Correo electrónico</Text>
      <Text style={styles.descripcion}>{usuario.email}</Text>

      <Text style={styles.label}>Tipo de cuenta</Text>
      <Text style={styles.descripcion}>
        {usuario.rol === "vecino" ? "Vecino" : "Comercio"}
      </Text>

      <Pressable
        onPress={manejarCerrarSesion}
        style={styles.boton}
        accessibilityRole="button"
        accessibilityLabel="Cerrar sesión"
      >
        <Text style={styles.botonTexto}>Cerrar sesión</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
  },

  estadoContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },

  title: {
    fontSize: 26,
    fontWeight: "700",
    marginBottom: 16,
  },

  label: {
    fontSize: 14,
    fontWeight: "700",
    marginTop: 8,
  },

  descripcion: {
    fontSize: 16,
    marginBottom: 12,
  },

  boton: {
    marginTop: 12,
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center",
  },

  botonTexto: {
    fontSize: 16,
    fontWeight: "700",
  },
});
