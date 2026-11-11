import { Ionicons } from "@expo/vector-icons";
import { Stack, useLocalSearchParams, router } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import QRCode from "react-native-qrcode-svg";

import { useTema } from "../../src/contexto/tema";
import { obtenerComercioPorId } from "../../src/servicios/comercios";
import { obtenerUsuarioActual } from "../../src/servicios/autenticacion";
import {
  generarUsoPromocion,
  obtenerUsosPromocion,
} from "../../src/servicios/usos-promociones";
import { obtenerPromocionPorId } from "../../src/servicios/promociones";
import { Comercio, Promocion, UsoDePromocion } from "../../src/tipos/modelos";

function formatearFecha(fecha: string): string {
  return new Date(fecha).toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export default function PromocionDetalleScreen() {
  const { colores } = useTema();
  const styles = useMemo(() => crearEstilos(colores), [colores]);
  const { id } = useLocalSearchParams<{ id: string }>();

  const [promocion, setPromocion] = useState<Promocion | null>(null);
  const [comercio, setComercio] = useState<Comercio | null>(null);
  const [usuarioAutenticado, setUsuarioAutenticado] = useState(false);
  const [esVecino, setEsVecino] = useState(false);
  const [usoPromocion, setUsoPromocion] = useState<UsoDePromocion | null>(null);
  const [codigoVisible, setCodigoVisible] = useState(false);
  const [generandoCodigo, setGenerandoCodigo] = useState(false);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function cargarPromocion() {
      try {
        setCargando(true);
        setError(null);

        const [datos, usuarioActual] = await Promise.all([
          obtenerPromocionPorId(id),
          obtenerUsuarioActual(),
        ]);

        setPromocion(datos);
        setUsuarioAutenticado(usuarioActual !== null);
        setEsVecino(usuarioActual?.rol === "vecino");

        if (datos) {
          obtenerComercioPorId(datos.comercioId)
            .then(setComercio)
            .catch(() => setComercio(null));
        }

        if (datos && usuarioActual?.rol === "vecino") {
          const usos = await obtenerUsosPromocion();
          const usoPropio = usos.find((uso) => uso.promocionId === datos.id) ?? null;
          setUsoPromocion(usoPropio);
        }
      } catch {
        setError("No fue posible cargar la promoción.");
      } finally {
        setCargando(false);
      }
    }

    cargarPromocion();
  }, [id]);

  if (cargando) {
    return (
      <View style={styles.estadoContainer}>
        <ActivityIndicator size="large" color={colores.primario} />
        <Text style={styles.estadoTitulo}>Cargando promoción</Text>
        <Text style={styles.estadoTexto}>
          Estamos buscando el detalle del beneficio.
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
        <Text style={styles.estadoTitulo}>No pudimos cargar la promoción</Text>
        <Text style={styles.estadoTexto}>{error}</Text>
      </View>
    );
  }

  if (!promocion) {
    return (
      <View style={styles.estadoContainer}>
        <View style={styles.estadoIcono}>
          <Ionicons name="pricetag-outline" size={30} color={colores.primario} />
        </View>
        <Text style={styles.estadoTitulo}>Promoción no encontrada</Text>
        <Text style={styles.estadoTexto}>
          Es posible que ya no esté disponible.
        </Text>
      </View>
    );
  }

  const codigoPromocion = usoPromocion?.codigo ?? null;
  const fechaDeUso = usoPromocion?.validadoEn ?? null;
  const promoUsada = fechaDeUso !== null;

  async function alternarCodigo() {
    if (!promocion) {
      return;
    }

    if (codigoVisible) {
      setCodigoVisible(false);
      return;
    }

    try {
      setGenerandoCodigo(true);
      setError(null);

      let uso = usoPromocion;

      if (!uso) {
        uso = await generarUsoPromocion(promocion.id);
        setUsoPromocion(uso);
      }

      setCodigoVisible(true);
    } catch (errorDesconocido) {
      setError(
        errorDesconocido instanceof Error
          ? errorDesconocido.message
          : "No fue posible generar el código.",
      );
    } finally {
      setGenerandoCodigo(false);
    }
  }

  return (
    <>
      <Stack.Screen options={{ title: promocion.titulo }} />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.hero}>
          <View style={styles.promoTituloFila}>
            <View style={styles.promoIcono}>
              <Ionicons name="pricetag-outline" size={20} color={colores.promo} />
            </View>
            <Text style={styles.title}>{promocion.titulo}</Text>
          </View>

          <Text style={styles.detalle}>{promocion.detalle}</Text>

          <View style={styles.datosFila}>
            {promocion.descuento !== null ? (
              <View style={styles.descuentoChip}>
                <Text style={styles.descuentoTexto}>
                  {promocion.descuento}% OFF
                </Text>
              </View>
            ) : null}

            <View style={styles.estadoChip}>
              <View
                style={[
                  styles.estadoPunto,
                  promocion.activa
                    ? styles.estadoPuntoActivo
                    : styles.estadoPuntoInactivo,
                ]}
              />
              <Text style={styles.estadoChipTexto}>
                {promocion.activa ? "Activa" : "Inactiva"}
              </Text>
            </View>
          </View>

          <View style={styles.filaDato}>
            <Ionicons name="calendar-outline" size={16} color={colores.promo} />
            <Text style={styles.textoDato}>
              Desde {formatearFecha(promocion.desde)} hasta{" "}
              {formatearFecha(promocion.hasta)}
            </Text>
          </View>
        </View>

        {comercio ? (
          <Pressable
            onPress={() => router.push(`/comercio/${comercio.id}`)}
            style={styles.tarjetaComercio}
            accessibilityRole="button"
            accessibilityLabel={`Ver ficha de ${comercio.nombre}`}
          >
            <Ionicons
              name="storefront-outline"
              size={20}
              color={colores.primario}
            />
            <View style={styles.comercioTextoBloque}>
              <Text style={styles.comercioNombre}>{comercio.nombre}</Text>
              <Text style={styles.comercioDireccion}>{comercio.direccion}</Text>
            </View>
            <Ionicons
              name="chevron-forward-outline"
              size={18}
              color={colores.secundario}
            />
          </Pressable>
        ) : null}

        <View style={styles.tarjetaDatos}>
          <View style={styles.filaDato}>
            <Ionicons name="phone-portrait-outline" size={16} color={colores.secundario} />
            <Text style={styles.textoDato}>
              {promocion.soloApp
                ? "Exclusiva de la app: sólo con este código."
                : "Podés usarla aunque no tengas la app."}
            </Text>
          </View>

          <View style={styles.filaDato}>
            <Ionicons name="people-outline" size={16} color={colores.secundario} />
            <Text style={styles.textoDato}>
              {promocion.usos} {promocion.usos === 1 ? "uso registrado" : "usos registrados"}
            </Text>
          </View>
        </View>

        {promocion.soloApp && esVecino ? (
          promoUsada ? (
            <View style={styles.tarjetaSeccion}>
              <View style={styles.seccionEncabezado}>
                <View style={styles.seccionIcono}>
                  <Ionicons
                    name="checkmark-circle-outline"
                    size={18}
                    color={colores.abierto}
                  />
                </View>
                <Text style={styles.seccionTitulo}>Promoción ya utilizada</Text>
              </View>
              <Text style={styles.text}>
                La usaste el{" "}
                {fechaDeUso
                  ? `${formatearFecha(fechaDeUso)}. Cada vecino puede usar esta promoción una sola vez.`
                  : "una vez. Cada vecino puede usar esta promoción una sola vez."}
              </Text>
            </View>
          ) : (
            <View style={styles.tarjetaSeccion}>
              <View style={styles.seccionEncabezado}>
                <View style={styles.seccionIcono}>
                  <Ionicons
                    name="qr-code-outline"
                    size={18}
                    color={colores.primario}
                  />
                </View>
                <Text style={styles.seccionTitulo}>Tu código exclusivo</Text>
              </View>

              <Pressable
                onPress={alternarCodigo}
                disabled={generandoCodigo}
                style={[styles.botonCodigo, generandoCodigo && { opacity: 0.6 }]}
                accessibilityRole="button"
                accessibilityLabel={
                  codigoVisible ? "Ocultar mi código" : "Mostrar mi código"
                }
              >
                <Ionicons
                  name={codigoVisible ? "eye-off-outline" : "qr-code-outline"}
                  size={18}
                  color="#FFFFFF"
                />
                <Text style={styles.botonCodigoTexto}>
                  {generandoCodigo
                    ? "Generando código..."
                    : codigoVisible
                      ? "Ocultar mi código"
                      : "Mostrar mi código"}
                </Text>
              </Pressable>

              {codigoVisible ? (
                <View style={styles.bloqueCodigo}>
                  <View style={styles.panelQr}>
                    <QRCode
                      value={codigoPromocion ?? ""}
                      size={210}
                      color="#111111"
                      backgroundColor="#FFFFFF"
                    />
                  </View>

                  <Text style={styles.codigoTexto}>{codigoPromocion}</Text>

                  <Text style={styles.ayudaCodigo}>
                    Mostrale este código al comercio en el mostrador. Lo puede
                    escanear desde su perfil, o verificarlo con el código
                    escrito si la cámara no funciona.
                  </Text>
                </View>
              ) : (
                <Text style={styles.text}>
                  Generá tu código y presentalo en el local para que el
                  comercio registre el uso. Cada vecino puede usar esta
                  promoción una sola vez.
                </Text>
              )}
            </View>
          )
        ) : null}

        {promocion.soloApp && !usuarioAutenticado ? (
          <View style={styles.tarjetaSeccion}>
            <View style={styles.seccionEncabezado}>
              <View style={styles.seccionIcono}>
                <Ionicons
                  name="lock-closed-outline"
                  size={18}
                  color={colores.promo}
                />
              </View>
              <Text style={styles.seccionTitulo}>Beneficio exclusivo</Text>
            </View>
            <Text style={styles.text}>
              Esta promoción es exclusiva de la app. Iniciá sesión para
              generar tu código y usarla en el local.
            </Text>

            <Pressable
              onPress={() => router.push("/login")}
              style={styles.botonSecundario}
              accessibilityRole="button"
              accessibilityLabel="Iniciar sesión para usar la promoción"
            >
              <Text style={styles.botonSecundarioTexto}>Iniciá sesión</Text>
            </Pressable>
          </View>
        ) : null}
      </ScrollView>
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
    backgroundColor: colores.promoFondo,
    borderWidth: 1,
    borderColor: colores.promo,
    borderRadius: 18,
    padding: 18,
    gap: 10,
  },
  promoTituloFila: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  promoIcono: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: colores.tarjeta,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    flex: 1,
    fontSize: 24,
    fontWeight: "800",
    color: colores.texto,
    letterSpacing: -0.3,
  },
  detalle: {
    fontSize: 15,
    lineHeight: 22,
    color: colores.secundario,
  },
  datosFila: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 8,
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
  estadoChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: colores.tarjeta,
  },
  estadoPunto: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  estadoPuntoActivo: {
    backgroundColor: colores.abierto,
  },
  estadoPuntoInactivo: {
    backgroundColor: colores.cerrado,
  },
  estadoChipTexto: {
    fontSize: 12,
    fontWeight: "700",
    color: colores.secundario,
  },
  filaDato: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },
  textoDato: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
    color: colores.secundario,
  },
  tarjetaComercio: {
    backgroundColor: colores.tarjeta,
    borderWidth: 1,
    borderColor: colores.borde,
    borderRadius: 18,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  comercioTextoBloque: {
    flex: 1,
  },
  comercioNombre: {
    fontSize: 16,
    fontWeight: "700",
    color: colores.texto,
  },
  comercioDireccion: {
    fontSize: 13,
    color: colores.secundario,
    marginTop: 2,
  },
  tarjetaDatos: {
    backgroundColor: colores.tarjeta,
    borderWidth: 1,
    borderColor: colores.borde,
    borderRadius: 18,
    padding: 16,
    gap: 10,
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
  text: {
    fontSize: 14,
    lineHeight: 20,
    color: colores.secundario,
  },
  botonCodigo: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: colores.primario,
    borderRadius: 13,
    minHeight: 48,
    paddingVertical: 12,
  },
  botonCodigoTexto: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
  },
  bloqueCodigo: {
    alignItems: "center",
    gap: 12,
    paddingVertical: 6,
  },
  panelQr: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 18,
  },
  codigoTexto: {
    fontSize: 15,
    fontWeight: "700",
    color: colores.texto,
    letterSpacing: 1,
    textAlign: "center",
  },
  ayudaCodigo: {
    fontSize: 13,
    lineHeight: 19,
    color: colores.secundario,
    textAlign: "center",
    paddingHorizontal: 6,
  },
  botonSecundario: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    minHeight: 48,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: colores.primario,
    paddingVertical: 12,
  },
  botonSecundarioTexto: {
    color: colores.primario,
    fontSize: 15,
    fontWeight: "700",
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
