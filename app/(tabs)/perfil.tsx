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
  autenticarConBiometria,
  biometriaDisponible,
} from "../../src/servicios/biometria";
import {
  cerrarSesion,
  obtenerUsuarioSesionId,
} from "../../src/servicios/sesion";
import { Usuario } from "../../src/tipos/modelos";

export default function PerfilScreen() {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [cargando, setCargando] = useState(true);

  const [requiereBiometria, setRequiereBiometria] = useState(false);

  const [autenticando, setAutenticando] = useState(false);

  const [usuarioSesionId, setUsuarioSesionId] = useState<string | null>(null);

  const cargarUsuario = useCallback(async (id: string) => {
    const usuarioEncontrado = await obtenerUsuarioPorId(id);

    setUsuario(usuarioEncontrado);
  }, []);

  const verificarSesion = useCallback(async () => {
    try {
      setCargando(true);
      setUsuario(null);
      setRequiereBiometria(false);

      const usuarioId = await obtenerUsuarioSesionId();

      setUsuarioSesionId(usuarioId);

      if (!usuarioId) {
        return;
      }

      const disponible = await biometriaDisponible();

      if (!disponible) {
        await cargarUsuario(usuarioId);
        return;
      }

      setRequiereBiometria(true);
    } finally {
      setCargando(false);
    }
  }, [cargarUsuario]);

  useFocusEffect(
    useCallback(() => {
      verificarSesion();
    }, [verificarSesion]),
  );

  async function manejarBiometria() {
    if (!usuarioSesionId) {
      return;
    }

    try {
      setAutenticando(true);

      const autenticado = await autenticarConBiometria();

      if (!autenticado) {
        return;
      }

      await cargarUsuario(usuarioSesionId);

      setRequiereBiometria(false);
    } finally {
      setAutenticando(false);
    }
  }

  async function manejarCerrarSesion() {
    await cerrarSesion();

    setUsuario(null);
    setUsuarioSesionId(null);
    setRequiereBiometria(false);
  }

  if (cargando) {
    return (
      <View style={styles.estadoContainer}>
        <ActivityIndicator size="large" />

        <Text style={styles.descripcion}>Verificando sesión...</Text>
      </View>
    );
  }

  if (usuarioSesionId && requiereBiometria && !usuario) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Confirmar identidad</Text>

        <Text style={styles.descripcion}>
          Tenés una sesión iniciada. Confirmá tu identidad para acceder a los
          datos de tu cuenta.
        </Text>

        <Pressable
          onPress={manejarBiometria}
          disabled={autenticando}
          style={[styles.boton, autenticando && styles.botonDeshabilitado]}
          accessibilityRole="button"
          accessibilityLabel="Ingresar con biometría"
        >
          {autenticando ? (
            <ActivityIndicator />
          ) : (
            <Text style={styles.botonTexto}>Ingresar con biometría</Text>
          )}
        </Pressable>

        <Pressable
          onPress={manejarCerrarSesion}
          style={styles.botonSecundario}
          accessibilityRole="button"
        >
          <Text style={styles.botonSecundarioTexto}>Cerrar sesión</Text>
        </Pressable>
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

  botonDeshabilitado: {
    opacity: 0.6,
  },

  botonTexto: {
    fontSize: 16,
    fontWeight: "700",
  },

  botonSecundario: {
    marginTop: 8,
    paddingVertical: 12,
    alignItems: "center",
  },

  botonSecundarioTexto: {
    fontSize: 15,
    fontWeight: "600",
  },
});
