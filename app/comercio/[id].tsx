import Ionicons from "@react-native-vector-icons/ionicons";
import { Image } from "expo-image";
import {
  Stack,
  useFocusEffect,
  useLocalSearchParams,
  router,
} from "expo-router";
import { useVideoPlayer, VideoView } from "expo-video";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Linking,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { FormularioResena } from "../../src/components/resenas/formulario-resena";
import { FormularioRespuesta } from "../../src/components/resenas/formulario-respuesta";
import { TarjetaResena } from "../../src/components/resenas/tarjeta-resena";
import { useTema } from "../../src/contexto/tema";
import {
  obtenerUsuarioActual,
  obtenerUsuarioPorId,
} from "../../src/servicios/autenticacion";
import { prepararMultimediaComercio } from "../../src/servicios/archivos";
import { ErrorApi } from "../../src/servicios/api";
import { obtenerComercioPorId } from "../../src/servicios/comercios";
import { alternarFavorito, esFavorito } from "../../src/servicios/favoritos";
import { obtenerPromocionesPorComercio } from "../../src/servicios/promociones";
import {
  borrarResena,
  crearResena,
  editarResena,
  obtenerResenasConEstado,
  reportarResena,
  responderResena,
} from "../../src/servicios/resenas";
import { obtenerRubroPorId } from "../../src/servicios/rubros";
import { obtenerUsuarioSesionId } from "../../src/servicios/sesion";
import {
  Comercio,
  Promocion,
  Resena,
  Rubro,
  Usuario,
} from "../../src/tipos/modelos";
import { estaAbiertoAhora } from "../../src/utils/horarios";
import { miResenaDeLista } from "../../src/utils/resenas";

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
  const { colores } = useTema();
  const styles = useMemo(() => crearEstilos(colores), [colores]);
  const player = useVideoPlayer(videoUrl, (instancia) => {
    instancia.loop = false;
  });

  return (
    <View style={styles.tarjetaSeccion}>
      <View style={styles.seccionEncabezado}>
        <View style={styles.seccionIcono}>
          <Ionicons name="videocam-outline" size={18} color={colores.primario} />
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
  const { colores } = useTema();
  const styles = useMemo(() => crearEstilos(colores), [colores]);

  return (
    <View style={styles.tarjetaSeccion}>
      <View style={styles.seccionEncabezado}>
        <View style={styles.seccionIcono}>
          <Ionicons name="images-outline" size={18} color={colores.primario} />
        </View>
        <Text style={styles.seccionTitulo}>Fotos</Text>
      </View>

      {imagenes.length === 0 ? (
        <View style={styles.fotosVacias}>
          <Ionicons name="images-outline" size={28} color={colores.secundario} />
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

function formatearFecha(fecha: string): string {
  return new Date(fecha).toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export default function ComercioDetalleScreen() {
  const { colores } = useTema();
  const styles = useMemo(() => crearEstilos(colores), [colores]);
  const { id } = useLocalSearchParams<{ id: string }>();

  const [comercio, setComercio] = useState<Comercio | null>(null);
  const [rubro, setRubro] = useState<Rubro | null>(null);
  const [promocionVigente, setPromocionVigente] = useState<Promocion | null>(null);
  const [favorito, setFavorito] = useState(false);
  const [usuarioActual, setUsuarioActual] = useState<Usuario | null>(null);
  const [resenas, setResenas] = useState<ResenaConAutor[]>([]);
  const [imagenesFicha, setImagenesFicha] = useState<string[]>([]);
  const [videoFicha, setVideoFicha] = useState<string | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // --- Reseñas: sesión, formularios y acciones ---
  const [usuarioSesionId, setUsuarioSesionId] = useState<string | null>(null);
  const [modalResenaVisible, setModalResenaVisible] = useState(false);
  const [resenaEditando, setResenaEditando] = useState<Resena | null>(null);
  const [errorResena, setErrorResena] = useState<string | null>(null);
  const [errorResenas, setErrorResenas] = useState<string | null>(null);
  const [resenasDesdeCache, setResenasDesdeCache] = useState(false);
  const [refrescando, setRefrescando] = useState(false);
  const [modalRespuestaVisible, setModalRespuestaVisible] = useState(false);
  const [resenaAResponder, setResenaAResponder] = useState<Resena | null>(null);

  const esVecino = usuarioActual?.rol === "vecino";

  const miResena = useMemo(
    () =>
      miResenaDeLista(
        resenas.map(({ resena }) => resena),
        usuarioSesionId,
      ),
    [resenas, usuarioSesionId],
  );

  // El PRD: el comercio da su versión. Sólo el dueño de ESTE comercio puede
  // responder sus reseñas (la API igual lo verifica con 403).
  const esDueno =
    usuarioActual?.rol === "comercio" &&
    comercio !== null &&
    usuarioActual.comercioId === comercio.id;

  const cargarResenas = useCallback(async (comercioId: string) => {
    try {
      setErrorResenas(null);

      const { resenas: datos, desdeCache } = await obtenerResenasConEstado(comercioId);

      const conAutor = await Promise.all(
        datos.map(async (resena) => {
          const usuario = await obtenerUsuarioPorId(resena.usuarioId);

          return {
            resena,
            autor: usuario?.nombre ?? "Vecino/a",
          };
        }),
      );

      setResenas(conAutor);
      setResenasDesdeCache(desdeCache);
    } catch {
      // Distinto de "sin reseñas": la API falló y no había datos guardados.
      setResenas([]);
      setResenasDesdeCache(false);
      setErrorResenas("No se pudieron cargar las reseñas.");
    }
  }, []);

  useEffect(() => {
    obtenerUsuarioSesionId().then(setUsuarioSesionId);
    obtenerUsuarioActual().then(setUsuarioActual);
  }, []);

  /*
   * La ficha sigue montada cuando se apila otra pantalla encima y vuelve:
   * el useEffect de arriba no se re-ejecuta. useFocusEffect refresca las
   * reseñas cada vez que la pantalla recupera el foco — salvo la primera,
   * porque el montaje ya las cargó.
   */
  const esElPrimerFoco = useRef(true);

  useFocusEffect(
    useCallback(() => {
      if (esElPrimerFoco.current) {
        esElPrimerFoco.current = false;

        return;
      }

      if (typeof id === "string") {
        cargarResenas(id);
      }
    }, [id, cargarResenas]),
  );

  // Tirar para abajo refresca las reseñas: el vecino revisa si hay novedades
  // sin salir de la ficha.
  async function recargarResenas() {
    if (!comercio) {
      return;
    }

    setRefrescando(true);

    try {
      await cargarResenas(comercio.id);
    } finally {
      setRefrescando(false);
    }
  }

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

        // Mostramos la multimedia remota de inmediato y la copiamos en segundo plano.
        // Así la ficha no queda bloqueada esperando la descarga del video.
        setImagenesFicha(datos.imagenes);
        setVideoFicha(datos.videoUrl);

        void prepararMultimediaComercio(
          datos.id,
          datos.imagenes,
          datos.videoUrl,
        ).then((multimedia) => {
          setImagenesFicha(multimedia.imagenes);
          setVideoFicha(multimedia.videoUrl);
        });

        const [rubroDatos, favoritoActual, promociones] = await Promise.all([
          obtenerRubroPorId(datos.rubroId),
          esFavorito(datos.id),
          obtenerPromocionesPorComercio(datos.id),
        ]);

        setRubro(rubroDatos);
        setFavorito(favoritoActual);
        setPromocionVigente(promociones[0] ?? null);

        await cargarResenas(datos.id);
      } catch {
        setError("No fue posible cargar el comercio.");
      } finally {
        setCargando(false);
      }
    }

    cargarComercio();
  }, [id, cargarResenas]);

  function abrirFormularioResena(editando: Resena | null) {
    if (!usuarioSesionId) {
      // Sin sesión no se reseña: el PRD manda a loguearse primero.
      router.push("/login");

      return;
    }

    setErrorResena(null);
    setResenaEditando(editando);
    setModalResenaVisible(true);
  }

  async function guardarResena(
    estrellas: 1 | 2 | 3 | 4 | 5,
    comentario: string,
  ) {
    if (!comercio) {
      return;
    }

    try {
      if (resenaEditando) {
        await editarResena(resenaEditando.id, estrellas, comentario);
      } else {
        await crearResena(comercio.id, estrellas, comentario);
      }

      setModalResenaVisible(false);
      setResenaEditando(null);
      await cargarResenas(comercio.id);
    } catch (e) {
      const mensaje =
        e instanceof Error ? e.message : "No se pudo guardar la reseña.";

      // Si el servidor ya tenía una reseña nuestra, refrescamos y ofrecemos editar.
      if (e instanceof ErrorApi && e.codigo === "RESENA_YA_EXISTE") {
        setModalResenaVisible(false);
        setResenaEditando(null);
        setErrorResena(mensaje);
        await cargarResenas(comercio.id);

        return;
      }

      throw new Error(mensaje);
    }
  }

  async function manejarBorrado(resena: Resena) {
    if (!comercio) {
      return;
    }

    try {
      await borrarResena(resena.id);
      await cargarResenas(comercio.id);
    } catch (e) {
      setErrorResena(e instanceof Error ? e.message : "No se pudo borrar.");
    }
  }

  async function manejarReporte(resena: Resena) {
    if (!comercio) {
      return;
    }

    try {
      await reportarResena(resena.id);
      await cargarResenas(comercio.id);
    } catch (e) {
      setErrorResena(e instanceof Error ? e.message : "No se pudo reportar.");
    }
  }

  function abrirFormularioRespuesta(resena: Resena) {
    setErrorResena(null);
    setResenaAResponder(resena);
    setModalRespuestaVisible(true);
  }

  async function enviarRespuesta(texto: string) {
    if (!resenaAResponder || !comercio) {
      return;
    }

    try {
      await responderResena(resenaAResponder.id, texto);

      setModalRespuestaVisible(false);
      setResenaAResponder(null);
      await cargarResenas(comercio.id);
    } catch (e) {
      // El formulario muestra el mensaje tal cual (incluye RESENA_YA_RESPONDIDA).
      throw new Error(
        e instanceof Error ? e.message : "No se pudo enviar la respuesta.",
      );
    }
  }

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
        <ActivityIndicator size="large" color={colores.primario} />
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
          <Ionicons name="alert-circle-outline" size={32} color={colores.cerrado} />
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
          <Ionicons name="storefront-outline" size={30} color={colores.primario} />
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
        refreshControl={
          <RefreshControl
            refreshing={refrescando}
            onRefresh={recargarResenas}
            colors={[colores.primario]}
            tintColor={colores.primario}
          />
        }
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
                  color={favorito ? colores.peligro : colores.primario}
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
              <Ionicons name="star" size={16} color={colores.estrellas} />
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
              <Ionicons name="call-outline" size={20} color={colores.primario} />
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
                color={colores.primario}
              />
              <Text style={styles.accionSecundariaTexto}>Cómo llegar</Text>
            </Pressable>
          </View>

          <View style={styles.ubicacionFila}>
            <Ionicons
              name="location-outline"
              size={18}
              color={colores.secundario}
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
              <Ionicons name="logo-instagram" size={18} color={colores.primario} />
              <Text style={styles.enlace}>{comercio.instagram}</Text>
            </Pressable>
          ) : null}
        </View>

        <GaleriaComercio imagenes={imagenesFicha} />

        {promocionVigente ? (
          <View style={styles.promocionCard}>
            <View style={styles.promocionEncabezado}>
              <View style={styles.promocionTituloFila}>
                <View style={styles.promoIcono}>
                  <Ionicons name="pricetag-outline" size={18} color={colores.promo} />
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
              <Ionicons name="calendar-outline" size={15} color={colores.promo} />
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
                color={colores.primario}
              />
            </View>
            <Text style={styles.seccionTitulo}>Sobre el comercio</Text>
          </View>
          <Text style={styles.descripcion}>{comercio.descripcion}</Text>
        </View>

        {videoFicha ? <VideoComercio videoUrl={videoFicha} /> : null}

        <View style={styles.tarjetaSeccion}>
          <View style={styles.seccionEncabezado}>
            <View style={styles.seccionIcono}>
              <Ionicons name="time-outline" size={18} color={colores.primario} />
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
              <Ionicons name="card-outline" size={18} color={colores.primario} />
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
                color={colores.primario}
              />
            </View>
            <Text style={styles.seccionTitulo}>Reseñas</Text>
          </View>

          <Pressable
            onPress={() => abrirFormularioResena(miResena)}
            style={styles.botonResena}
            accessibilityRole="button"
            accessibilityLabel={
              miResena ? "Editar mi reseña" : "Escribir una reseña"
            }
          >
            <Ionicons
              name={miResena ? "create-outline" : "chatbubble-ellipses-outline"}
              size={18}
              color="#FFFFFF"
            />

            <Text style={styles.botonResenaTexto}>
              {miResena
                ? "Editar mi reseña"
                : usuarioSesionId
                  ? "Escribir una reseña"
                  : "Iniciá sesión para reseñar"}
            </Text>
          </Pressable>

          {errorResena ? (
            <Text style={styles.errorResena}>{errorResena}</Text>
          ) : null}

          {errorResenas ? (
            <View style={styles.errorResenasBloque}>
              <Text style={styles.errorResena}>{errorResenas}</Text>

              <Pressable
                onPress={() => comercio && cargarResenas(comercio.id)}
                style={styles.botonReintentar}
                accessibilityRole="button"
                accessibilityLabel="Reintentar cargar reseñas"
              >
                <Text style={styles.botonReintentarTexto}>Reintentar</Text>
              </Pressable>
            </View>
          ) : (
            <>
              {resenasDesdeCache && resenas.length > 0 ? (
                <View style={styles.avisoDatosViejos}>
                  <Ionicons
                    name="cloud-offline-outline"
                    size={14}
                    color={colores.promo}
                  />

                  <Text style={styles.avisoDatosViejosTexto}>
                    Sin conexión: estás viendo reseñas guardadas, pueden estar
                    desactualizadas.
                  </Text>
                </View>
              ) : null}

              {resenas.length === 0 ? (
                <View style={styles.resenaVacia}>
                  <Ionicons
                    name="chatbubble-outline"
                    size={26}
                    color={colores.secundario}
                  />
                  <Text style={styles.estadoTexto}>
                    Este comercio todavía no tiene reseñas disponibles.
                  </Text>
                </View>
              ) : (
                <View style={styles.resenasLista}>
                  {resenas.map(({ resena, autor }) => (
                    <TarjetaResena
                      key={resena.id}
                      resena={resena}
                      autor={autor}
                      colores={colores}
                      esPropia={resena.usuarioId === usuarioSesionId}
                      puedeResponder={esDueno}
                      onEditar={(r) => abrirFormularioResena(r)}
                      onBorrar={manejarBorrado}
                      onReportar={manejarReporte}
                      onResponder={abrirFormularioRespuesta}
                    />
                  ))}
                </View>
              )}
            </>
          )}
        </View>
      </ScrollView>

      <FormularioResena
        visible={modalResenaVisible}
        resenaExistente={resenaEditando}
        colores={colores}
        onGuardar={guardarResena}
        onCancelar={() => {
          setModalResenaVisible(false);
          setResenaEditando(null);
        }}
      />

      <FormularioRespuesta
        visible={modalRespuestaVisible}
        nombreComercio={comercio?.nombre ?? "el comercio"}
        colores={colores}
        onEnviar={enviarRespuesta}
        onCancelar={() => {
          setModalRespuestaVisible(false);
          setResenaAResponder(null);
        }}
      />
    </>
  );
}

function crearEstilos(colores: ReturnType<typeof useTema>["colores"]) {
  return StyleSheet.create({
  scroll: {
    flex: 1,
    backgroundColor: colores.fondo,
  },
  container: {
    padding: 18,
    paddingBottom: 40,
    gap: 14,
  },
  hero: {
    backgroundColor: colores.tarjeta,
    borderWidth: 1,
    borderColor: colores.borde,
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
    color: colores.texto,
    letterSpacing: -0.4,
  },
  rubro: {
    fontSize: 14,
    color: colores.secundario,
    marginTop: 4,
  },
  favoritoBoton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colores.comercioFondo,
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
    backgroundColor: colores.abiertoFondo,
  },
  estadoCerrado: {
    backgroundColor: colores.cerradoFondo,
  },
  estadoPunto: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  estadoPuntoAbierto: {
    backgroundColor: colores.abierto,
  },
  estadoPuntoCerrado: {
    backgroundColor: colores.cerrado,
  },
  estadoChipTexto: {
    fontSize: 12,
    fontWeight: "700",
  },
  estadoTextoAbierto: {
    color: colores.abierto,
  },
  estadoTextoCerrado: {
    color: colores.cerrado,
  },
  valoracionFila: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  valoracion: {
    fontSize: 13,
    color: colores.secundario,
  },
  tarjetaSeccion: {
    backgroundColor: colores.tarjeta,
    borderWidth: 1,
    borderColor: colores.borde,
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
    backgroundColor: colores.comercioFondo,
    alignItems: "center",
    justifyContent: "center",
  },
  seccionTitulo: {
    fontSize: 18,
    fontWeight: "800",
    color: colores.texto,
  },
  descripcion: {
    fontSize: 15,
    lineHeight: 22,
    color: colores.secundario,
  },
  text: {
    fontSize: 14,
    lineHeight: 20,
    color: colores.secundario,
  },
  acciones: {
    flexDirection: "row",
    gap: 8,
  },
  accionPrincipal: {
    flex: 1,
    minHeight: 50,
    borderRadius: 13,
    backgroundColor: colores.primario,
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
    borderColor: colores.primario,
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  accionSecundariaTexto: {
    color: colores.primario,
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
    color: colores.secundario,
  },
  instagramFila: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },
  enlace: {
    fontSize: 14,
    color: colores.primario,
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
    backgroundColor: colores.superficie,
  },
  fotosVacias: {
    minHeight: 105,
    borderRadius: 14,
    backgroundColor: colores.superficie,
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
    backgroundColor: colores.promoFondo,
    borderWidth: 1,
    borderColor: colores.promo,
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
    backgroundColor: colores.promoFondo,
    alignItems: "center",
    justifyContent: "center",
  },
  promocionTitulo: {
    fontSize: 17,
    fontWeight: "800",
    color: colores.texto,
  },
  descuentoChip: {
    backgroundColor: colores.tarjeta,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  descuentoTexto: {
    fontSize: 12,
    fontWeight: "800",
    color: colores.promo,
  },
  promocionPie: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  promocionVigencia: {
    fontSize: 12,
    fontWeight: "600",
    color: colores.promo,
  },
  horarioFila: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 16,
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colores.borde,
  },
  horarioDia: {
    flex: 1,
    fontSize: 14,
    fontWeight: "700",
    color: colores.texto,
  },
  horarioFranjas: {
    flex: 1,
    alignItems: "flex-end",
    gap: 3,
  },
  horarioHora: {
    fontSize: 14,
    color: colores.secundario,
    textAlign: "right",
  },
  chipsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  chip: {
    backgroundColor: colores.comercioFondo,
    borderRadius: 999,
    paddingHorizontal: 11,
    paddingVertical: 7,
  },
  chipTexto: {
    fontSize: 13,
    fontWeight: "600",
    color: colores.primarioOscuro,
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
  botonResena: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: colores.primario,
    borderRadius: 13,
    minHeight: 48,
    paddingVertical: 12,
  },
  botonResenaTexto: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
  },
  errorResena: {
    color: colores.cerrado,
    fontWeight: "600",
    fontSize: 14,
  },
  errorResenasBloque: {
    alignItems: "center",
    gap: 12,
    paddingVertical: 12,
  },
  botonReintentar: {
    borderWidth: 1,
    borderColor: colores.cerrado,
    borderRadius: 10,
    paddingHorizontal: 24,
    paddingVertical: 10,
  },
  botonReintentarTexto: {
    color: colores.cerrado,
    fontWeight: "700",
    fontSize: 14,
  },
  avisoDatosViejos: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: colores.promoFondo,
    borderRadius: 10,
    padding: 10,
    marginBottom: 4,
  },
  avisoDatosViejosTexto: {
    fontSize: 13,
    color: colores.promo,
    flex: 1,
    lineHeight: 18,
  },
  respuestaComercio: {
    gap: 6,
    padding: 11,
    borderRadius: 10,
    backgroundColor: colores.comercioFondo,
  },
  respuestaTituloFila: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  respuestaTitulo: {
    fontSize: 13,
    fontWeight: "700",
    color: colores.primarioOscuro,
  },
  respuestaTexto: {
    fontSize: 13,
    lineHeight: 19,
    color: colores.secundario,
  },
  estadoContainer: {
    flex: 1,
    backgroundColor: colores.fondo,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 28,
  },
  estadoIcono: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colores.comercioFondo,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  estadoIconoError: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colores.cerradoFondo,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  estadoTitulo: {
    fontSize: 19,
    fontWeight: "800",
    color: colores.texto,
    textAlign: "center",
    marginTop: 8,
  },
  estadoTexto: {
    fontSize: 14,
    lineHeight: 20,
    color: colores.secundario,
    textAlign: "center",
    marginTop: 4,
  },
  });
}
