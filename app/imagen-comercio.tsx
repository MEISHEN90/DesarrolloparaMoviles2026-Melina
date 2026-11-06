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
import { useVideoPlayer, VideoView } from "expo-video";

import {
  guardarArchivoLocal,
  subirArchivo,
} from "../src/servicios/archivos";
import {
  actualizarMiComercio,
  obtenerMiComercio,
} from "../src/servicios/mi-comercio";

const MAX_VIDEO_BYTES = 30 * 1024 * 1024;
const MAX_VIDEO_DURACION_MS = 30_000;

function VideoPublicado({ uri }: { uri: string }) {
  const player = useVideoPlayer(uri, (instancia) => {
    instancia.loop = false;
  });

  return (
    <VideoView
      style={styles.video}
      player={player}
      nativeControls
      contentFit="contain"
      fullscreenOptions={{ enable: true }}
    />
  );
}

export default function ImagenComercioScreen() {
  const [imagenes, setImagenes] = useState<string[]>([]);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [imagenLocal, setImagenLocal] = useState<string | null>(null);
  const [videoLocal, setVideoLocal] = useState<string | null>(null);

  const [cargando, setCargando] = useState(true);
  const [subiendo, setSubiendo] = useState(false);
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function cargar() {
      try {
        setCargando(true);
        setError(null);

        const comercio = await obtenerMiComercio();

        setImagenes(comercio.imagenes);
        setVideoUrl(comercio.videoUrl);
      } catch (errorDesconocido) {
        setError(
          errorDesconocido instanceof Error
            ? errorDesconocido.message
            : "No fue posible cargar el contenido del comercio.",
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

      const archivo = await subirArchivo(uriGuardada, nombreArchivo, tipo);

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

  async function procesarVideo(asset: ImagePicker.ImagePickerAsset) {
    if (asset.duration !== null && asset.duration > MAX_VIDEO_DURACION_MS) {
      setError("El video debe durar como máximo 30 segundos.");
      return;
    }

    if (asset.fileSize !== undefined && asset.fileSize > MAX_VIDEO_BYTES) {
      setError("El video supera el máximo de 30 MB permitido por la API.");
      return;
    }

    const nombreOriginal = asset.fileName ?? "";
    const esMp4 =
      asset.mimeType === "video/mp4" ||
      nombreOriginal.toLowerCase().endsWith(".mp4");

    if (!esMp4) {
      setError("La API admite videos en formato MP4.");
      return;
    }

    try {
      setSubiendo(true);
      setMensaje(null);
      setError(null);

      const nombreArchivo = `video-comercio-${Date.now()}.mp4`;
      const uriGuardada = guardarArchivoLocal(asset.uri, nombreArchivo);

      setVideoLocal(uriGuardada);

      const archivo = await subirArchivo(
        uriGuardada,
        nombreArchivo,
        "video/mp4",
      );

      const actualizado = await actualizarMiComercio({
        videoUrl: archivo.url,
      });

      setVideoUrl(actualizado.videoUrl);
      setMensaje("El video se subió y quedó publicado en la ficha del comercio.");
    } catch (errorDesconocido) {
      setError(
        errorDesconocido instanceof Error
          ? errorDesconocido.message
          : "No fue posible subir el video.",
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

    if (resultado.canceled) return;

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

    if (resultado.canceled) return;

    const foto = resultado.assets[0];

    await procesarImagen(foto.uri, foto.fileName, foto.mimeType);
  }

  async function seleccionarVideo() {
    setMensaje(null);
    setError(null);

    const permiso = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permiso.granted) {
      setError(
        "Se necesita permiso para acceder a los videos del dispositivo.",
      );
      return;
    }

    const resultado = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["videos"],
      allowsEditing: false,
    });

    if (resultado.canceled) return;

    await procesarVideo(resultado.assets[0]);
  }

  async function grabarVideo() {
    setMensaje(null);
    setError(null);

    const permiso = await ImagePicker.requestCameraPermissionsAsync();

    if (!permiso.granted) {
      setError("Se necesita permiso para usar la cámara.");
      return;
    }

    const resultado = await ImagePicker.launchCameraAsync({
      mediaTypes: ["videos"],
      allowsEditing: false,
      videoMaxDuration: 30,
    });

    if (resultado.canceled) return;

    await procesarVideo(resultado.assets[0]);
  }

  async function quitarVideo() {
    try {
      setSubiendo(true);
      setMensaje(null);
      setError(null);

      const actualizado = await actualizarMiComercio({
        videoUrl: null,
      });

      setVideoUrl(actualizado.videoUrl);
      setMensaje("El video fue quitado de la ficha del comercio.");
    } catch (errorDesconocido) {
      setError(
        errorDesconocido instanceof Error
          ? errorDesconocido.message
          : "No fue posible quitar el video.",
      );
    } finally {
      setSubiendo(false);
    }
  }

  if (cargando) {
    return (
      <View style={styles.estado}>
        <ActivityIndicator size="large" />
        <Text>Cargando contenido...</Text>
      </View>
    );
  }

  return (
    <>
      <Stack.Screen options={{ title: "Fotos y video" }} />

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

        <View style={styles.separador} />

        <Text style={styles.titulo}>Video de presentación</Text>

        <Text style={styles.descripcion}>
          El video debe ser MP4, durar hasta 30 segundos y pesar como máximo
          30 MB.
        </Text>

        <Pressable
          onPress={grabarVideo}
          disabled={subiendo}
          style={[styles.boton, subiendo && styles.deshabilitado]}
          accessibilityRole="button"
        >
          <Text style={styles.botonTexto}>Grabar video</Text>
        </Pressable>

        <Pressable
          onPress={seleccionarVideo}
          disabled={subiendo}
          style={[styles.boton, subiendo && styles.deshabilitado]}
          accessibilityRole="button"
        >
          <Text style={styles.botonTexto}>Seleccionar video</Text>
        </Pressable>

        {videoUrl ? (
          <>
            <Text style={styles.subtitulo}>Video publicado</Text>
            <VideoPublicado uri={videoUrl} />

            <Pressable
              onPress={quitarVideo}
              disabled={subiendo}
              style={[styles.botonQuitar, subiendo && styles.deshabilitado]}
              accessibilityRole="button"
            >
              <Text style={styles.botonQuitarTexto}>Quitar video</Text>
            </Pressable>
          </>
        ) : (
          <Text style={styles.vacio}>
            Todavía no hay un video de presentación publicado.
          </Text>
        )}

        {videoLocal ? (
          <Text style={styles.local}>
            El último video también quedó guardado en el dispositivo.
          </Text>
        ) : null}

        {subiendo ? (
          <View style={styles.progreso}>
            <ActivityIndicator />
            <Text>Guardando y publicando...</Text>
          </View>
        ) : null}

        {error ? <Text style={styles.error}>{error}</Text> : null}
        {mensaje ? <Text style={styles.mensaje}>{mensaje}</Text> : null}

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
  botonQuitar: {
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
    marginTop: 12,
  },
  botonQuitarTexto: {
    fontSize: 15,
    fontWeight: "700",
  },
  deshabilitado: { opacity: 0.6 },
  botonTexto: { fontSize: 16, fontWeight: "700" },
  progreso: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 16,
  },
  error: {
    marginTop: 12,
    fontSize: 15,
    fontWeight: "600",
  },
  mensaje: {
    marginTop: 12,
    fontSize: 15,
    fontWeight: "600",
  },
  galeria: { gap: 10, paddingRight: 4 },
  imagen: {
    width: 240,
    height: 170,
    borderRadius: 12,
  },
  video: {
    width: "100%",
    aspectRatio: 16 / 9,
    backgroundColor: "#000",
    borderRadius: 12,
    overflow: "hidden",
  },
  vacio: {
    marginTop: 12,
    fontSize: 15,
  },
  local: {
    marginTop: 12,
    fontSize: 13,
    opacity: 0.7,
  },
  separador: {
    height: 1,
    backgroundColor: "#D0D0D0",
    marginVertical: 28,
  },
  botonSecundario: {
    marginTop: 28,
    paddingVertical: 12,
    alignItems: "center",
  },
  botonSecundarioTexto: {
    fontSize: 15,
    fontWeight: "600",
  },
});
