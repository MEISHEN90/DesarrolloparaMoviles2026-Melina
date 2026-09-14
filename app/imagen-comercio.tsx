import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { router, Stack } from "expo-router";
import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { guardarArchivoLocal } from "../src/servicios/archivos";

export default function ImagenComercioScreen() {
  const [imagenUri, setImagenUri] = useState<string | null>(null);

  const [mensaje, setMensaje] = useState<string | null>(null);

  function guardarImagen(uri: string, nombreOriginal?: string | null) {
    const extension = nombreOriginal?.split(".").pop() ?? "jpg";

    const nombreArchivo = `comercio-${Date.now()}.${extension}`;

    const uriGuardada = guardarArchivoLocal(uri, nombreArchivo);

    setImagenUri(uriGuardada);
    setMensaje("La imagen fue guardada localmente.");
  }

  async function seleccionarImagen() {
    setMensaje(null);

    const permiso = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permiso.granted) {
      setMensaje(
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

    const imagenSeleccionada = resultado.assets[0];

    guardarImagen(imagenSeleccionada.uri, imagenSeleccionada.fileName);
  }

  async function tomarFoto() {
    setMensaje(null);

    const permiso = await ImagePicker.requestCameraPermissionsAsync();

    if (!permiso.granted) {
      setMensaje("Se necesita permiso para usar la cámara.");
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

    guardarImagen(foto.uri, foto.fileName);
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: "Imagen del comercio",
        }}
      />

      <View style={styles.container}>
        <Text style={styles.titulo}>Imagen del comercio</Text>

        <Text style={styles.descripcion}>
          Podés tomar una foto con la cámara o seleccionar una imagen de la
          galería. La aplicación guardará una copia en su almacenamiento local.
        </Text>

        <Pressable
          onPress={tomarFoto}
          style={styles.boton}
          accessibilityRole="button"
          accessibilityLabel="Tomar foto"
        >
          <Text style={styles.botonTexto}>Tomar foto</Text>
        </Pressable>

        <Pressable
          onPress={seleccionarImagen}
          style={styles.boton}
          accessibilityRole="button"
          accessibilityLabel="Seleccionar imagen"
        >
          <Text style={styles.botonTexto}>Seleccionar imagen</Text>
        </Pressable>

        {mensaje && <Text style={styles.mensaje}>{mensaje}</Text>}

        {imagenUri && (
          <>
            <Text style={styles.subtitulo}>Imagen guardada</Text>

            <Image
              source={{ uri: imagenUri }}
              style={styles.imagen}
              contentFit="cover"
            />

            <Text style={styles.uri}>{imagenUri}</Text>
          </>
        )}

        <Pressable
          onPress={() => router.back()}
          style={styles.botonSecundario}
          accessibilityRole="button"
        >
          <Text style={styles.botonSecundarioTexto}>Volver</Text>
        </Pressable>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
  },

  titulo: {
    fontSize: 26,
    fontWeight: "700",
    marginBottom: 12,
  },

  subtitulo: {
    fontSize: 18,
    fontWeight: "700",
    marginTop: 20,
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

  botonTexto: {
    fontSize: 16,
    fontWeight: "700",
  },

  mensaje: {
    marginTop: 8,
    fontSize: 15,
  },

  imagen: {
    width: "100%",
    height: 220,
    borderRadius: 12,
  },

  uri: {
    fontSize: 12,
    marginTop: 8,
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
