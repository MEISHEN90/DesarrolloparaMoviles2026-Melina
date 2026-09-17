import { Ionicons } from "@expo/vector-icons";
import { Stack, useLocalSearchParams } from "expo-router";
import { useVideoPlayer, VideoView } from "expo-video";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { obtenerComercioPorId } from "../../src/servicios/comercios";
import { obtenerRubroPorId } from "../../src/servicios/rubros";
import { Comercio, Rubro } from "../../src/tipos/modelos";
import { estaAbiertoAhora } from "../../src/utils/horarios";

const nombresDias = [
  "Domingo",
  "Lunes",
  "Martes",
  "Miércoles",
  "Jueves",
  "Viernes",
  "Sábado",
];

function VideoComercio({ videoUrl }: { videoUrl: string }) {
  const player = useVideoPlayer(videoUrl, (player) => {
    player.loop = false;
  });

  return (
    <View style={styles.seccion}>
      <Text style={styles.seccionTitulo}>Video de presentación</Text>

      <VideoView
        style={styles.video}
        player={player}
        nativeControls
        contentFit="contain"
        fullscreenOptions={{
          enable: true,
        }}
      />
    </View>
  );
}

export default function ComercioDetalleScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  const [comercio, setComercio] = useState<Comercio | null>(null);
  const [rubro, setRubro] = useState<Rubro | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function cargarComercio() {
      try {
        setCargando(true);
        setError(null);

        const datos = await obtenerComercioPorId(id);

        if (!datos) {
          setComercio(null);
          return;
        }

        setComercio(datos);

        const rubroDatos = await obtenerRubroPorId(datos.rubroId);
        setRubro(rubroDatos);
      } catch {
        setError("No fue posible cargar el comercio.");
      } finally {
        setCargando(false);
      }
    }

    cargarComercio();
  }, [id]);

  const horariosAgrupados = useMemo(() => {
    if (!comercio) {
      return [];
    }

    const grupos = new Map<number, string[]>();

    comercio.horarios.forEach((horario) => {
      const franjas = grupos.get(horario.dia) ?? [];

      franjas.push(`${horario.abre} - ${horario.cierra}`);

      grupos.set(horario.dia, franjas);
    });

    return Array.from(grupos.entries())
      .sort(([diaA], [diaB]) => diaA - diaB)
      .map(([dia, franjas]) => ({
        dia,
        franjas,
      }));
  }, [comercio]);

  async function llamar() {
    if (!comercio?.telefono) return;

    await Linking.openURL(`tel:${comercio.telefono}`);
  }

  async function abrirWhatsApp() {
    if (!comercio?.whatsapp) return;

    await Linking.openURL(`https://wa.me/${comercio.whatsapp}`);
  }

  async function abrirMapa() {
    if (!comercio) return;

    const { latitud, longitud } = comercio.coordenadas;

    const url =
      `https://www.google.com/maps/search/?api=1&query=` +
      `${latitud},${longitud}`;

    await Linking.openURL(url);
  }

  async function abrirInstagram() {
    if (!comercio?.instagram) return;

    const usuario = comercio.instagram.replace("@", "");

    await Linking.openURL(`https://www.instagram.com/${usuario}/`);
  }

  if (cargando) {
    return (
      <View style={styles.estadoContainer}>
        <ActivityIndicator size="large" />
        <Text style={styles.estadoTexto}>Cargando comercio...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.estadoContainer}>
        <Text style={styles.errorTexto}>{error}</Text>
      </View>
    );
  }

  if (!comercio) {
    return (
      <View style={styles.estadoContainer}>
        <Text style={styles.estadoTexto}>Comercio no encontrado.</Text>
      </View>
    );
  }

  const abierto = estaAbiertoAhora(comercio.horarios);

  return (
    <>
      <Stack.Screen
        options={{
          title: comercio.nombre,
        }}
      />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.container}
      >
        <View style={styles.encabezado}>
          <Text style={styles.title}>{comercio.nombre}</Text>

          <Text style={styles.rubro}>
            {rubro?.nombre ?? "Rubro no informado"}
          </Text>

          <View style={styles.estadoFila}>
            <View
              style={[
                styles.estadoChip,
                abierto ? styles.estadoAbierto : styles.estadoCerrado,
              ]}
            >
              <Text style={styles.estadoChipTexto}>
                {abierto ? "Abierto ahora" : "Cerrado ahora"}
              </Text>
            </View>

            <Text style={styles.valoracion}>
              ★ {comercio.puntaje.toFixed(1)} · {comercio.cantidadResenas}{" "}
              reseñas
            </Text>
          </View>
        </View>

        {comercio.videoUrl ? (
          <VideoComercio videoUrl={comercio.videoUrl} />
        ) : null}

        <View style={styles.seccion}>
          <Text style={styles.seccionTitulo}>Sobre el comercio</Text>
          <Text style={styles.descripcion}>{comercio.descripcion}</Text>
        </View>

        <View style={styles.seccion}>
          <Text style={styles.seccionTitulo}>Contacto y ubicación</Text>

          <Text style={styles.label}>Dirección</Text>
          <Text style={styles.text}>{comercio.direccion}</Text>

          <View style={styles.acciones}>
            <Pressable
              style={[
                styles.botonAccion,
                !comercio.telefono && styles.botonDeshabilitado,
              ]}
              onPress={llamar}
              disabled={!comercio.telefono}
              accessibilityRole="button"
              accessibilityLabel="Llamar al comercio"
            >
              <View style={styles.botonContenido}>
                <Ionicons name="call-outline" size={18} />
                <Text style={styles.botonAccionTexto}>Llamar</Text>
              </View>
            </Pressable>

            <Pressable
              style={[
                styles.botonAccion,
                !comercio.whatsapp && styles.botonDeshabilitado,
              ]}
              onPress={abrirWhatsApp}
              disabled={!comercio.whatsapp}
              accessibilityRole="button"
              accessibilityLabel="Abrir WhatsApp del comercio"
            >
              <View style={styles.botonContenido}>
                <Ionicons name="logo-whatsapp" size={18} />
                <Text style={styles.botonAccionTexto}>WhatsApp</Text>
              </View>
            </Pressable>

            <Pressable
              style={styles.botonAccion}
              onPress={abrirMapa}
              accessibilityRole="button"
              accessibilityLabel="Cómo llegar al comercio"
            >
              <View style={styles.botonContenido}>
                <Ionicons name="navigate-outline" size={18} />
                <Text style={styles.botonAccionTexto}>Cómo llegar</Text>
              </View>
            </Pressable>
          </View>

          {comercio.instagram ? (
            <>
              <Text style={styles.label}>Instagram</Text>

              <Pressable
                onPress={abrirInstagram}
                accessibilityRole="link"
                accessibilityLabel={`Abrir Instagram ${comercio.instagram}`}
              >
                <View style={styles.instagramFila}>
                  <Ionicons name="logo-instagram" size={18} />
                  <Text style={styles.enlace}>{comercio.instagram}</Text>
                </View>
              </Pressable>
            </>
          ) : null}
        </View>

        <View style={styles.seccion}>
          <Text style={styles.seccionTitulo}>Horarios</Text>

          {horariosAgrupados.length === 0 ? (
            <Text style={styles.text}>Horarios no informados.</Text>
          ) : (
            horariosAgrupados.map(({ dia, franjas }) => (
              <View key={dia} style={styles.horarioFila}>
                <Text style={styles.horarioDia}>{nombresDias[dia]}</Text>

                <View style={styles.horarioFranjas}>
                  {franjas.map((franja) => (
                    <Text key={franja} style={styles.horarioHora}>
                      {franja}
                    </Text>
                  ))}
                </View>
              </View>
            ))
          )}
        </View>

        <View style={styles.seccion}>
          <Text style={styles.seccionTitulo}>Medios de pago</Text>

          <View style={styles.chipsContainer}>
            {comercio.mediosDePago.map((medio) => (
              <View key={medio} style={styles.chip}>
                <Text style={styles.chipTexto}>{medio}</Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
  },

  container: {
    padding: 20,
    paddingBottom: 40,
    gap: 20,
  },

  encabezado: {
    gap: 6,
  },

  title: {
    fontSize: 26,
    fontWeight: "700",
  },

  rubro: {
    fontSize: 15,
  },

  estadoFila: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 4,
  },

  estadoChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },

  estadoAbierto: {
    backgroundColor: "#E6F4EA",
  },

  estadoCerrado: {
    backgroundColor: "#FCE8E6",
  },

  estadoChipTexto: {
    fontSize: 13,
    fontWeight: "700",
  },

  valoracion: {
    fontSize: 14,
  },

  seccion: {
    gap: 8,
  },

  seccionTitulo: {
    fontSize: 18,
    fontWeight: "700",
  },

  descripcion: {
    fontSize: 15,
    lineHeight: 21,
  },

  video: {
    width: "100%",
    aspectRatio: 16 / 9,
    backgroundColor: "#000",
    borderRadius: 12,
    overflow: "hidden",
  },

  label: {
    fontSize: 14,
    fontWeight: "700",
    marginTop: 4,
  },

  text: {
    fontSize: 15,
    lineHeight: 21,
  },

  enlace: {
    fontSize: 15,
    lineHeight: 21,
    textDecorationLine: "underline",
  },

  acciones: {
    flexDirection: "row",
    gap: 8,
    marginTop: 8,
    marginBottom: 4,
  },

  botonContenido: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },

  instagramFila: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },

  botonAccion: {
    flex: 1,
    minHeight: 46,
    borderWidth: 1,
    borderColor: "#444",
    borderRadius: 10,
    paddingHorizontal: 6,
    alignItems: "center",
    justifyContent: "center",
  },

  botonDeshabilitado: {
    opacity: 0.4,
  },

  botonAccionTexto: {
    fontSize: 13,
    fontWeight: "700",
    textAlign: "center",
  },

  horarioFila: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 16,
    paddingVertical: 5,
  },

  horarioDia: {
    flex: 1,
    fontSize: 15,
    fontWeight: "600",
  },

  horarioFranjas: {
    flex: 1,
    alignItems: "flex-end",
    gap: 3,
  },

  horarioHora: {
    fontSize: 15,
    textAlign: "right",
  },

  chipsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },

  chip: {
    borderWidth: 1,
    borderColor: "#999",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },

  chipTexto: {
    fontSize: 13,
  },

  estadoContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    gap: 12,
  },

  estadoTexto: {
    fontSize: 16,
    textAlign: "center",
  },

  errorTexto: {
    fontSize: 16,
    textAlign: "center",
    fontWeight: "600",
  },
});
