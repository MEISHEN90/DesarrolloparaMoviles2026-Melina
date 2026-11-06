import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { router, Stack } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import {
  guardarArchivoLocal,
  subirArchivo,
} from "../src/servicios/archivos";
import {
  actualizarMiComercio,
  obtenerMiComercio,
} from "../src/servicios/mi-comercio";

export default function ImagenComercioScreen() {
  const [imagenes, setImagenes] = useState<string[]>([]);
  const [imagenLocal, setImagenLocal] = useState<string | null>(null);
  const [cargando, setCargando] = useState(true);
  const [subiendo, setSubiendo] = useState(false);
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function cargar() {
      try {
        setCargando(true);
        const comercio = await obtenerMiComercio();
        setImagenes(comercio.imagenes);
      } catch (errorDesconocido) {
        setError(
          errorDesconocido instanceof Error
            ? errorDesconocido.message
            : "No fue posible cargar las imágenes del comercio.",
        );
      } finally {
        setCargando(false);
      }
    }

    cargar();
  }, []);

  async function procesarImagen(
    uri: string,
    nombreOriginal?: string | null,
    mimeType?: string | null,
  ) {
    try {
      setSubiendo(true);
      setMensaje(null);
      setError(null);

      const extension = nombreOriginal?.split(".").pop() ?? "jpg";
      const nombreArchivo = `comercio-${Date.now()}.${extension}`;
      const tipo = mimeType ?? "image/jpeg";

      const uriGuardada = guardarArchivoLocal(uri, nombreArchivo);
      setImagenLocal(uriGuardada);

      const archivo = await subirArchivo(
        uriGuardada,
        nombreArchivo,
        tipo,
      );

      const nuevasImagenes = [...imagenes, archivo.url];

      const actualizado = await actualizarMiComercio({
        imagenes: nuevasImagenes,
      });

      setImagenes(actualizado.imagenes);
      setMensaje("La foto se subió y quedó publicada en la ficha del comercio.");
    } catch (errorDesconocido) {
      setError(
        errorDesconocido instanceof Error
          ? errorDesconocido.message
          : "No fue posible subir la imagen.",
      );
    } finally {
      setSubiendo(false);
    }
  }

  async function seleccionarImagen() {
    setMensaje(null);
    setError(null);

    const permiso = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permiso.granted) {
      setError(
        "Se necesita permiso para acceder a las imágenes del dispositivo.",
      );
      return;
    }

    const resultado = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      quality: 0.8,
    });

    if (resultado.canceled) {
      return;
    }

    const imagen = resultado.assets[0];

    await procesarImagen(imagen.uri, imagen.fileName, imagen.mimeType);
  }

  async function tomarFoto() {
    setMensaje(null);
    setError(null);

    const permiso = await ImagePicker.requestCameraPermissionsAsync();

    if (!permiso.granted) {
      setError("Se necesita permiso para usar la cámara.");
      return;
    }

    const resultado = await ImagePicker.launchCameraAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      quality: 0.8,
    });

    if (resultado.canceled) {
      return;
    }

    const foto = resultado.assets[0];

    await procesarImagen(foto.uri, foto.fileName, foto.mimeType);
  }

  if (cargando) {
    return (
      <View style={styles.estado}>
        <ActivityIndicator size="large" />
        <Text>Cargando imágenes...</Text>
      </View>
    );
  }

  return (
    <>
      <Stack.Screen options={{ title: "Fotos del comercio" }} />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.container}
      >
        <Text style={styles.titulo}>Fotos del comercio</Text>

        <Text style={styles.descripcion}>
          Podés tomar una foto o elegirla desde la galería. Se guarda una copia
          local y también se publica en la ficha mediante la API.
        </Text>

        <Pressable
          onPress={tomarFoto}
          disabled={subiendo}
          style={[styles.boton, subiendo && styles.deshabilitado]}
          accessibilityRole="button"
        >
          <Text style={styles.botonTexto}>Tomar foto</Text>
        </Pressable>

        <Pressable
          onPress={seleccionarImagen}
          disabled={subiendo}
          style={[styles.boton, subiendo && styles.deshabilitado]}
          accessibilityRole="button"
        >
          <Text style={styles.botonTexto}>Seleccionar imagen</Text>
        </Pressable>

        {subiendo ? (
          <View style={styles.progreso}>
            <ActivityIndicator />
            <Text>Subiendo imagen...</Text>
          </View>
        ) : null}

        {error ? <Text style={styles.error}>{error}</Text> : null}
        {mensaje ? <Text style={styles.mensaje}>{mensaje}</Text> : null}

        {imagenes.length > 0 ? (
          <>
            <Text style={styles.subtitulo}>Fotos publicadas</Text>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.galeria}
            >
              {imagenes.map((uri, indice) => (
                <Image
                  key={`${uri}-${indice}`}
                  source={{ uri }}
                  style={styles.imagen}
                  contentFit="cover"
                />
              ))}
            </ScrollView>
          </>
        ) : (
          <Text style={styles.vacio}>Todavía no hay fotos publicadas.</Text>
        )}

        {imagenLocal ? (
          <Text style={styles.local}>
            La última imagen también quedó guardada en el dispositivo.
          </Text>
        ) : null}

        <Pressable
          onPress={() => router.back()}
          style={styles.botonSecundario}
          accessibilityRole="button"
        >
          <Text style={styles.botonSecundarioTexto}>Volver</Text>
        </Pressable>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  container: { padding: 24, paddingBottom: 40 },
  estado: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  titulo: {
    fontSize: 26,
    fontWeight: "700",
    marginBottom: 12,
  },
  subtitulo: {
    fontSize: 18,
    fontWeight: "700",
    marginTop: 24,
    marginBottom: 10,
  },
  descripcion: {
    fontSize: 16,
    lineHeight: 22,
    marginBottom: 16,
  },
  boton: {
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center",
    marginBottom: 12,
  },
  deshabilitado: { opacity: 0.6 },
  botonTexto: { fontSize: 16, fontWeight: "700" },
  progreso: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 8,
  },
  error: {
    marginTop: 8,
    fontSize: 15,
    fontWeight: "600",
  },
  mensaje: {
    marginTop: 8,
    fontSize: 15,
    fontWeight: "600",
  },
  galeria: { gap: 10, paddingRight: 4 },
  imagen: {
    width: 240,
    height: 170,
    borderRadius: 12,
  },
  vacio: {
    marginTop: 20,
    fontSize: 15,
  },
  local: {
    marginTop: 12,
    fontSize: 13,
    opacity: 0.7,
  },
  botonSecundario: {
    marginTop: 24,
    paddingVertical: 12,
    alignItems: "center",
  },
  botonSecundarioTexto: {
    fontSize: 15,
    fontWeight: "600",
  },
});
