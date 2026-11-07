import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
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

import {
  obtenerUsuarioActual,
  obtenerUsuarioPorId,
} from "../../src/servicios/autenticacion";
import { obtenerComercioPorId } from "../../src/servicios/comercios";
import { alternarFavorito, esFavorito } from "../../src/servicios/favoritos";
import { obtenerPromocionesPorComercio } from "../../src/servicios/promociones";
import { obtenerResenasPorComercio } from "../../src/servicios/resenas";
import { obtenerRubroPorId } from "../../src/servicios/rubros";
import { Comercio, Promocion, Resena, Rubro } from "../../src/tipos/modelos";
import { estaAbiertoAhora } from "../../src/utils/horarios";

const COLORES = {
  primario: "#2457A6",
  primarioOscuro: "#173A70",
  fondo: "#F5F7FA",
  tarjeta: "#FFFFFF",
  borde: "#D9DEE7",
  texto: "#1B1D21",
  secundario: "#667085",
  abierto: "#2E7D32",
  abiertoFondo: "#EAF7EE",
  cerrado: "#B42318",
  cerradoFondo: "#FDECEC",
  promo: "#B54708",
  promoFondo: "#FFF4E5",
  estrellas: "#B7791F",
};

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
  const player = useVideoPlayer(videoUrl, (instancia) => {
    instancia.loop = false;
  });

  return (
    <View style={styles.tarjetaSeccion}>
      <View style={styles.seccionEncabezado}>
        <View style={styles.seccionIcono}>
          <Ionicons name="videocam-outline" size={18} color={COLORES.primario} />
        </View>
        <Text style={styles.seccionTitulo}>Video de presentación</Text>
      </View>

      <VideoView
        style={styles.video}
        player={player}
        nativeControls
        contentFit="contain"
        fullscreenOptions={{ enable: true }}
      />
    </View>
  );
}

function GaleriaComercio({ imagenes }: { imagenes: string[] }) {
  return (
    <View style={styles.tarjetaSeccion}>
      <View style={styles.seccionEncabezado}>
        <View style={styles.seccionIcono}>
          <Ionicons name="images-outline" size={18} color={COLORES.primario} />
        </View>
        <Text style={styles.seccionTitulo}>Fotos</Text>
      </View>

      {imagenes.length === 0 ? (
        <View style={styles.fotosVacias}>
          <Ionicons name="images-outline" size={28} color={COLORES.secundario} />
          <Text style={styles.estadoTexto}>
            Este comercio todavía no publicó fotos.
          </Text>
        </View>
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.galeriaContenido}
        >
          {imagenes.map((uri, indice) => (
            <Image
              key={`${uri}-${indice}`}
              source={{ uri }}
              style={styles.fotoComercio}
              contentFit="cover"
              transition={200}
              accessibilityLabel={`Foto ${indice + 1} del comercio`}
            />
          ))}
        </ScrollView>
      )}
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
          size={15}
          color={COLORES.estrellas}
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
  const [promocionVigente, setPromocionVigente] = useState<Promocion | null>(null);
  const [favorito, setFavorito] = useState(false);
  const [esVecino, setEsVecino] = useState(false);
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

        const usuarioActual = await obtenerUsuarioActual();
        const usuarioEsVecino = usuarioActual?.rol === "vecino";

        const [rubroDatos, favoritoActual, promociones, resenasDatos] =
          await Promise.all([
            obtenerRubroPorId(datos.rubroId),
            usuarioEsVecino ? esFavorito(datos.id) : Promise.resolve(false),
            obtenerPromocionesPorComercio(datos.id),
            obtenerResenasPorComercio(datos.id),
          ]);

        setRubro(rubroDatos);
        setEsVecino(usuarioEsVecino);
        setFavorito(favoritoActual);
        setPromocionVigente(promociones[0] ?? null);

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
    if (!comercio) return [];

    const grupos = new Map<number, string[]>();

    comercio.horarios.forEach((horario) => {
      const franjas = grupos.get(horario.dia) ?? [];
      franjas.push(`${horario.abre} - ${horario.cierra}`);
      grupos.set(horario.dia, franjas);
    });

    return Array.from(grupos.entries())
      .sort(([diaA], [diaB]) => diaA - diaB)
      .map(([dia, franjas]) => ({ dia, franjas }));
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
      "https://www.google.com/maps/search/?api=1&query=" +
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
        <ActivityIndicator size="large" color={COLORES.primario} />
        <Text style={styles.estadoTitulo}>Cargando comercio</Text>
        <Text style={styles.estadoTexto}>
          Estamos preparando la información del local.
        </Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.estadoContainer}>
        <View style={styles.estadoIconoError}>
          <Ionicons name="alert-circle-outline" size={32} color={COLORES.cerrado} />
        </View>
        <Text style={styles.estadoTitulo}>No pudimos cargar el comercio</Text>
        <Text style={styles.estadoTexto}>{error}</Text>
      </View>
    );
  }

  if (!comercio) {
    return (
      <View style={styles.estadoContainer}>
        <View style={styles.estadoIcono}>
          <Ionicons name="storefront-outline" size={30} color={COLORES.primario} />
        </View>
        <Text style={styles.estadoTitulo}>Comercio no encontrado</Text>
        <Text style={styles.estadoTexto}>
          Es posible que ya no esté disponible.
        </Text>
      </View>
    );
  }

  const abierto = estaAbiertoAhora(comercio.horarios);

  return (
    <>
      <Stack.Screen options={{ title: comercio.nombre }} />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.hero}>
          <View style={styles.tituloFila}>
            <View style={styles.tituloBloque}>
              <Text style={styles.title}>{comercio.nombre}</Text>
              <Text style={styles.rubro}>{rubro?.nombre ?? "Comercio"}</Text>
            </View>

            {esVecino ? (
              <Pressable
                onPress={cambiarFavorito}
                style={styles.favoritoBoton}
                accessibilityRole="button"
                accessibilityLabel={
                  favorito
                    ? "Quitar comercio de favoritos"
                    : "Agregar comercio a favoritos"
                }
              >
                <Ionicons
                  name={favorito ? "heart" : "heart-outline"}
                  size={24}
                  color={favorito ? "#C62828" : COLORES.primario}
                />
              </Pressable>
            ) : null}
          </View>

          <View style={styles.estadoFila}>
            <View
              style={[
                styles.estadoChip,
                abierto ? styles.estadoAbierto : styles.estadoCerrado,
              ]}
            >
              <View
                style={[
                  styles.estadoPunto,
                  abierto ? styles.estadoPuntoAbierto : styles.estadoPuntoCerrado,
                ]}
              />
              <Text
                style={[
                  styles.estadoChipTexto,
                  abierto ? styles.estadoTextoAbierto : styles.estadoTextoCerrado,
                ]}
              >
                {abierto ? "Abierto ahora" : "Cerrado ahora"}
              </Text>
            </View>

            <View style={styles.valoracionFila}>
              <Ionicons name="star" size={16} color={COLORES.estrellas} />
              <Text style={styles.valoracion}>
                {comercio.puntaje.toFixed(1)} · {comercio.cantidadResenas} reseñas
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.tarjetaSeccion}>
          <View style={styles.acciones}>
            <Pressable
              style={[
                styles.accionPrincipal,
                !comercio.whatsapp && styles.botonDeshabilitado,
              ]}
              onPress={abrirWhatsApp}
              disabled={!comercio.whatsapp}
              accessibilityRole="button"
              accessibilityLabel="Abrir WhatsApp del comercio"
            >
              <Ionicons name="logo-whatsapp" size={20} color="#FFFFFF" />
              <Text style={styles.accionPrincipalTexto}>WhatsApp</Text>
            </Pressable>

            <Pressable
              style={[
                styles.accionSecundaria,
                !comercio.telefono && styles.botonDeshabilitado,
              ]}
              onPress={llamar}
              disabled={!comercio.telefono}
              accessibilityRole="button"
              accessibilityLabel="Llamar al comercio"
            >
              <Ionicons name="call-outline" size={20} color={COLORES.primario} />
              <Text style={styles.accionSecundariaTexto}>Llamar</Text>
            </Pressable>

            <Pressable
              style={styles.accionSecundaria}
              onPress={abrirMapa}
              accessibilityRole="button"
              accessibilityLabel="Cómo llegar al comercio"
            >
              <Ionicons
                name="navigate-outline"
                size={20}
                color={COLORES.primario}
              />
              <Text style={styles.accionSecundariaTexto}>Cómo llegar</Text>
            </Pressable>
          </View>

          <View style={styles.ubicacionFila}>
            <Ionicons
              name="location-outline"
              size={18}
              color={COLORES.secundario}
            />
            <Text style={styles.ubicacionTexto}>{comercio.direccion}</Text>
          </View>

          {comercio.instagram ? (
            <Pressable
              onPress={abrirInstagram}
              style={styles.instagramFila}
              accessibilityRole="link"
              accessibilityLabel={`Abrir Instagram ${comercio.instagram}`}
            >
              <Ionicons name="logo-instagram" size={18} color={COLORES.primario} />
              <Text style={styles.enlace}>{comercio.instagram}</Text>
            </Pressable>
          ) : null}
        </View>

        <GaleriaComercio imagenes={comercio.imagenes} />

        {promocionVigente ? (
          <View style={styles.promocionCard}>
            <View style={styles.promocionEncabezado}>
              <View style={styles.promocionTituloFila}>
                <View style={styles.promoIcono}>
                  <Ionicons name="pricetag-outline" size={18} color={COLORES.promo} />
                </View>
                <Text style={styles.seccionTitulo}>Promoción vigente</Text>
              </View>

              {promocionVigente.descuento !== null ? (
                <View style={styles.descuentoChip}>
                  <Text style={styles.descuentoTexto}>
                    {promocionVigente.descuento}% OFF
                  </Text>
                </View>
              ) : null}
            </View>

            <Text style={styles.promocionTitulo}>{promocionVigente.titulo}</Text>
            <Text style={styles.text}>{promocionVigente.detalle}</Text>

            <View style={styles.promocionPie}>
              <Ionicons name="calendar-outline" size={15} color={COLORES.promo} />
              <Text style={styles.promocionVigencia}>
                Vigente hasta {formatearFecha(promocionVigente.hasta)}
              </Text>
            </View>
          </View>
        ) : null}

        <View style={styles.tarjetaSeccion}>
          <View style={styles.seccionEncabezado}>
            <View style={styles.seccionIcono}>
              <Ionicons
                name="information-circle-outline"
                size={18}
                color={COLORES.primario}
              />
            </View>
            <Text style={styles.seccionTitulo}>Sobre el comercio</Text>
          </View>
          <Text style={styles.descripcion}>{comercio.descripcion}</Text>
        </View>

        {comercio.videoUrl ? (
          <VideoComercio videoUrl={comercio.videoUrl} />
        ) : null}

        <View style={styles.tarjetaSeccion}>
          <View style={styles.seccionEncabezado}>
            <View style={styles.seccionIcono}>
              <Ionicons name="time-outline" size={18} color={COLORES.primario} />
            </View>
            <Text style={styles.seccionTitulo}>Horarios</Text>
          </View>

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

        <View style={styles.tarjetaSeccion}>
          <View style={styles.seccionEncabezado}>
            <View style={styles.seccionIcono}>
              <Ionicons name="card-outline" size={18} color={COLORES.primario} />
            </View>
            <Text style={styles.seccionTitulo}>Medios de pago</Text>
          </View>

          <View style={styles.chipsContainer}>
            {comercio.mediosDePago.map((medio) => (
              <View key={medio} style={styles.chip}>
                <Text style={styles.chipTexto}>{medio}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.tarjetaSeccion}>
          <View style={styles.seccionEncabezado}>
            <View style={styles.seccionIcono}>
              <Ionicons
                name="chatbubble-ellipses-outline"
                size={18}
                color={COLORES.primario}
              />
            </View>
            <Text style={styles.seccionTitulo}>Reseñas</Text>
          </View>

          {resenas.length === 0 ? (
            <View style={styles.resenaVacia}>
              <Ionicons
                name="chatbubble-outline"
                size={26}
                color={COLORES.secundario}
              />
              <Text style={styles.estadoTexto}>
                Este comercio todavía no tiene reseñas disponibles.
              </Text>
            </View>
          ) : (
            <View style={styles.resenasLista}>
              {resenas.map(({ resena, autor }) => (
                <View key={resena.id} style={styles.resenaCard}>
                  <View style={styles.resenaEncabezado}>
                    <View style={styles.resenaAutorContainer}>
                      <View style={styles.avatar}>
                        <Ionicons
                          name="person-outline"
                          size={18}
                          color={COLORES.primario}
                        />
                      </View>

                      <View style={styles.resenaAutorTexto}>
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
                        <Ionicons
                          name="storefront-outline"
                          size={17}
                          color={COLORES.primario}
                        />
                        <Text style={styles.respuestaTitulo}>
                          Respuesta del comercio
                        </Text>
                      </View>
                      <Text style={styles.respuestaTexto}>{resena.respuesta}</Text>
                    </View>
                  ) : null}
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
    backgroundColor: COLORES.fondo,
  },
  container: {
    padding: 18,
    paddingBottom: 40,
    gap: 14,
  },
  hero: {
    backgroundColor: COLORES.tarjeta,
    borderWidth: 1,
    borderColor: COLORES.borde,
    borderRadius: 18,
    padding: 18,
    gap: 10,
  },
  tituloFila: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
  },
  tituloBloque: {
    flex: 1,
  },
  title: {
    fontSize: 27,
    fontWeight: "800",
    color: COLORES.texto,
    letterSpacing: -0.4,
  },
  rubro: {
    fontSize: 14,
    color: COLORES.secundario,
    marginTop: 4,
  },
  favoritoBoton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#EEF3FA",
    alignItems: "center",
    justifyContent: "center",
  },
  estadoFila: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 10,
  },
  estadoChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 999,
  },
  estadoAbierto: {
    backgroundColor: COLORES.abiertoFondo,
  },
  estadoCerrado: {
    backgroundColor: COLORES.cerradoFondo,
  },
  estadoPunto: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  estadoPuntoAbierto: {
    backgroundColor: COLORES.abierto,
  },
  estadoPuntoCerrado: {
    backgroundColor: COLORES.cerrado,
  },
  estadoChipTexto: {
    fontSize: 12,
    fontWeight: "700",
  },
  estadoTextoAbierto: {
    color: COLORES.abierto,
  },
  estadoTextoCerrado: {
    color: COLORES.cerrado,
  },
  valoracionFila: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  valoracion: {
    fontSize: 13,
    color: COLORES.secundario,
  },
  tarjetaSeccion: {
    backgroundColor: COLORES.tarjeta,
    borderWidth: 1,
    borderColor: COLORES.borde,
    borderRadius: 18,
    padding: 16,
    gap: 12,
  },
  seccionEncabezado: {
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
  },
  seccionIcono: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: "#EAF0F8",
    alignItems: "center",
    justifyContent: "center",
  },
  seccionTitulo: {
    fontSize: 18,
    fontWeight: "800",
    color: COLORES.texto,
  },
  descripcion: {
    fontSize: 15,
    lineHeight: 22,
    color: "#475467",
  },
  text: {
    fontSize: 14,
    lineHeight: 20,
    color: "#475467",
  },
  acciones: {
    flexDirection: "row",
    gap: 8,
  },
  accionPrincipal: {
    flex: 1,
    minHeight: 50,
    borderRadius: 13,
    backgroundColor: COLORES.primario,
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  accionPrincipalTexto: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
  },
  accionSecundaria: {
    flex: 1,
    minHeight: 50,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: COLORES.primario,
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  accionSecundariaTexto: {
    color: COLORES.primario,
    fontSize: 12,
    fontWeight: "700",
  },
  botonDeshabilitado: {
    opacity: 0.4,
  },
  ubicacionFila: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 7,
  },
  ubicacionTexto: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
    color: COLORES.secundario,
  },
  instagramFila: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },
  enlace: {
    fontSize: 14,
    color: COLORES.primario,
    fontWeight: "600",
  },
  galeriaContenido: {
    gap: 10,
    paddingRight: 4,
  },
  fotoComercio: {
    width: 275,
    height: 190,
    borderRadius: 14,
    backgroundColor: "#EAEAEA",
  },
  fotosVacias: {
    minHeight: 105,
    borderRadius: 14,
    backgroundColor: "#F8FAFC",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    padding: 16,
  },
  video: {
    width: "100%",
    aspectRatio: 16 / 9,
    backgroundColor: "#000000",
    borderRadius: 14,
    overflow: "hidden",
  },
  promocionCard: {
    backgroundColor: COLORES.promoFondo,
    borderWidth: 1,
    borderColor: "#F7C98B",
    borderRadius: 18,
    padding: 16,
    gap: 9,
  },
  promocionEncabezado: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  promocionTituloFila: {
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    flex: 1,
  },
  promoIcono: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: "#FFE5C2",
    alignItems: "center",
    justifyContent: "center",
  },
  promocionTitulo: {
    fontSize: 17,
    fontWeight: "800",
    color: COLORES.texto,
  },
  descuentoChip: {
    backgroundColor: "#FFFFFF",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  descuentoTexto: {
    fontSize: 12,
    fontWeight: "800",
    color: COLORES.promo,
  },
  promocionPie: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  promocionVigencia: {
    fontSize: 12,
    fontWeight: "600",
    color: COLORES.promo,
  },
  horarioFila: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 16,
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#E6E9EF",
  },
  horarioDia: {
    flex: 1,
    fontSize: 14,
    fontWeight: "700",
    color: COLORES.texto,
  },
  horarioFranjas: {
    flex: 1,
    alignItems: "flex-end",
    gap: 3,
  },
  horarioHora: {
    fontSize: 14,
    color: "#475467",
    textAlign: "right",
  },
  chipsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  chip: {
    backgroundColor: "#EEF3FA",
    borderRadius: 999,
    paddingHorizontal: 11,
    paddingVertical: 7,
  },
  chipTexto: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORES.primarioOscuro,
    textTransform: "capitalize",
  },
  resenaVacia: {
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 18,
  },
  resenasLista: {
    gap: 10,
  },
  resenaCard: {
    gap: 10,
    padding: 14,
    backgroundColor: "#FAFBFC",
    borderRadius: 14,
  },
  resenaEncabezado: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 10,
  },
  resenaAutorContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
  },
  resenaAutorTexto: {
    flex: 1,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#EAF0F8",
    alignItems: "center",
    justifyContent: "center",
  },
  resenaAutor: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORES.texto,
  },
  resenaFecha: {
    fontSize: 12,
    color: COLORES.secundario,
    marginTop: 2,
  },
  estrellasFila: {
    flexDirection: "row",
    gap: 1,
  },
  resenaComentario: {
    fontSize: 14,
    lineHeight: 20,
    color: "#475467",
  },
  respuestaComercio: {
    gap: 6,
    padding: 11,
    borderRadius: 10,
    backgroundColor: "#EEF3FA",
  },
  respuestaTituloFila: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  respuestaTitulo: {
    fontSize: 13,
    fontWeight: "700",
    color: COLORES.primarioOscuro,
  },
  respuestaTexto: {
    fontSize: 13,
    lineHeight: 19,
    color: "#475467",
  },
  estadoContainer: {
    flex: 1,
    backgroundColor: COLORES.fondo,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 28,
  },
  estadoIcono: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#EAF0F8",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  estadoIconoError: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORES.cerradoFondo,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  estadoTitulo: {
    fontSize: 19,
    fontWeight: "800",
    color: COLORES.texto,
    textAlign: "center",
    marginTop: 8,
  },
  estadoTexto: {
    fontSize: 14,
    lineHeight: 20,
    color: COLORES.secundario,
    textAlign: "center",
    marginTop: 4,
  },
});
