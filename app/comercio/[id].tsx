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

import { obtenerUsuarioPorId } from "../../src/servicios/autenticacion";
import { obtenerComercioPorId } from "../../src/servicios/comercios";
import { alternarFavorito, esFavorito } from "../../src/servicios/favoritos";
import { obtenerPromocionesPorComercio } from "../../src/servicios/promociones";
import { obtenerResenasPorComercio } from "../../src/servicios/resenas";
import { obtenerRubroPorId } from "../../src/servicios/rubros";
import { Comercio, Promocion, Resena, Rubro } from "../../src/tipos/modelos";
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

interface ResenaConAutor {
  resena: Resena;
  autor: string;
}

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

function Estrellas({ cantidad }: { cantidad: number }) {
  return (
    <View style={styles.estrellasFila}>
      {[1, 2, 3, 4, 5].map((estrella) => (
        <Ionicons
          key={estrella}
          name={estrella <= cantidad ? "star" : "star-outline"}
          size={16}
        />
      ))}
    </View>
  );
}

function formatearFecha(fecha: string): string {
  return new Date(fecha).toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export default function ComercioDetalleScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  const [comercio, setComercio] = useState<Comercio | null>(null);
  const [rubro, setRubro] = useState<Rubro | null>(null);
  const [promocionVigente, setPromocionVigente] = useState<Promocion | null>(
    null,
  );
  const [favorito, setFavorito] = useState(false);
  const [resenas, setResenas] = useState<ResenaConAutor[]>([]);
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

        const [rubroDatos, favoritoActual, promociones, resenasDatos] =
          await Promise.all([
            obtenerRubroPorId(datos.rubroId),
            esFavorito(datos.id),
            obtenerPromocionesPorComercio(datos.id),
            obtenerResenasPorComercio(datos.id),
          ]);

        setRubro(rubroDatos);
        setFavorito(favoritoActual);

        const hoy = new Date();

        const vigente =
          promociones.find((promocion) => {
            const desde = new Date(`${promocion.desde}T00:00:00`);
            const hasta = new Date(`${promocion.hasta}T23:59:59`);

            return hoy >= desde && hoy <= hasta;
          }) ?? null;

        setPromocionVigente(vigente);

        const resenasConAutor = await Promise.all(
          resenasDatos.map(async (resena) => {
            const usuario = await obtenerUsuarioPorId(resena.usuarioId);

            return {
              resena,
              autor: usuario?.nombre ?? "Usuario",
            };
          }),
        );

        setResenas(resenasConAutor);
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

  async function cambiarFavorito() {
    if (!comercio) return;

    const nuevoEstado = await alternarFavorito(comercio.id);

    setFavorito(nuevoEstado);
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
          <View style={styles.tituloFila}>
            <Text style={styles.title}>{comercio.nombre}</Text>

            <Pressable
              onPress={cambiarFavorito}
              accessibilityRole="button"
              accessibilityLabel={
                favorito
                  ? "Quitar comercio de favoritos"
                  : "Agregar comercio a favoritos"
              }
              hitSlop={10}
            >
              <Ionicons name={favorito ? "heart" : "heart-outline"} size={28} />
            </Pressable>
          </View>

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

        {promocionVigente ? (
          <View style={styles.promocionCard}>
            <View style={styles.promocionEncabezado}>
              <Text style={styles.seccionTitulo}>Promoción vigente</Text>

              {promocionVigente.descuento !== null ? (
                <View style={styles.descuentoChip}>
                  <Text style={styles.descuentoTexto}>
                    {promocionVigente.descuento}% OFF
                  </Text>
                </View>
              ) : null}
            </View>

            <Text style={styles.promocionTitulo}>
              {promocionVigente.titulo}
            </Text>

            <Text style={styles.text}>{promocionVigente.detalle}</Text>

            <Text style={styles.promocionVigencia}>
              Vigente hasta {promocionVigente.hasta}
            </Text>
          </View>
        ) : null}

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

        <View style={styles.seccion}>
          <Text style={styles.seccionTitulo}>Reseñas</Text>

          {resenas.length === 0 ? (
            <View style={styles.resenaVacia}>
              <Ionicons name="chatbubble-outline" size={24} />

              <Text style={styles.text}>
                Este comercio todavía no tiene reseñas disponibles.
              </Text>
            </View>
          ) : (
            resenas.map(({ resena, autor }) => (
              <View key={resena.id} style={styles.resenaCard}>
                <View style={styles.resenaEncabezado}>
                  <View style={styles.resenaAutorContainer}>
                    <View style={styles.avatar}>
                      <Ionicons name="person-outline" size={18} />
                    </View>

                    <View>
                      <Text style={styles.resenaAutor}>{autor}</Text>

                      <Text style={styles.resenaFecha}>
                        {formatearFecha(resena.creadaEn)}
                      </Text>
                    </View>
                  </View>

                  <Estrellas cantidad={resena.estrellas} />
                </View>

                <Text style={styles.resenaComentario}>{resena.comentario}</Text>

                {resena.respuesta ? (
                  <View style={styles.respuestaComercio}>
                    <View style={styles.respuestaTituloFila}>
                      <Ionicons name="storefront-outline" size={17} />

                      <Text style={styles.respuestaTitulo}>
                        Respuesta del comercio
                      </Text>
                    </View>

                    <Text style={styles.respuestaTexto}>
                      {resena.respuesta}
                    </Text>
                  </View>
                ) : null}
              </View>
            ))
          )}
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

  tituloFila: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },

  title: {
    flex: 1,
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

  promocionCard: {
    gap: 8,
    padding: 14,
    borderWidth: 1,
    borderColor: "#999",
    borderRadius: 12,
  },

  promocionEncabezado: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },

  promocionTitulo: {
    fontSize: 16,
    fontWeight: "700",
  },

  promocionVigencia: {
    fontSize: 13,
  },

  descuentoChip: {
    borderWidth: 1,
    borderColor: "#666",
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 4,
  },

  descuentoTexto: {
    fontSize: 12,
    fontWeight: "700",
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

  resenaVacia: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 8,
  },

  resenaCard: {
    gap: 10,
    padding: 14,
    borderWidth: 1,
    borderColor: "#C7C7C7",
    borderRadius: 12,
  },

  resenaEncabezado: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
  },

  resenaAutorContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
  },

  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#999",
    alignItems: "center",
    justifyContent: "center",
  },

  resenaAutor: {
    fontSize: 14,
    fontWeight: "700",
  },

  resenaFecha: {
    fontSize: 12,
    marginTop: 2,
  },

  estrellasFila: {
    flexDirection: "row",
    gap: 2,
  },

  resenaComentario: {
    fontSize: 14,
    lineHeight: 20,
  },

  respuestaComercio: {
    gap: 6,
    padding: 10,
    borderRadius: 9,
    backgroundColor: "#F1F1F1",
  },

  respuestaTituloFila: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },

  respuestaTitulo: {
    fontSize: 13,
    fontWeight: "700",
  },

  respuestaTexto: {
    fontSize: 13,
    lineHeight: 19,
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
