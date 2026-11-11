import { Ionicons } from "@expo/vector-icons";
import { Stack, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { FormularioPromocion } from "../src/components/promociones/formulario-promocion";
import { useTema } from "../src/contexto/tema";
import { confirmarAccionExitosa } from "../src/servicios/haptica";
import {
  CuerpoPromocionComercio,
  crearPromocionComercio,
  darDeBajaPromocionComercio,
  editarPromocionComercio,
  listarMisPromociones,
} from "../src/servicios/mi-comercio";
import { obtenerUsuarioActual } from "../src/servicios/autenticacion";
import { Promocion } from "../src/tipos/modelos";
import { estadoDePromocion } from "../src/utils/promociones";

function formatearFecha(fecha: string): string {
  return new Date(fecha).toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export default function MisPromocionesScreen() {
  const { colores } = useTema();
  const styles = useMemo(() => crearEstilos(colores), [colores]);
  const router = useRouter();

  const [promociones, setPromociones] = useState<Promocion[]>([]);
  const [esComercio, setEsComercio] = useState(true);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refrescando, setRefrescando] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [promocionEditando, setPromocionEditando] = useState<Promocion | null>(
    null,
  );

  const cargarPromociones = useCallback(async () => {
    try {
      setError(null);

      const usuario = await obtenerUsuarioActual();

      if (usuario?.rol !== "comercio") {
        setEsComercio(false);
        setPromociones([]);

        return;
      }

      setEsComercio(true);

      const datos = await listarMisPromociones();

      setPromociones(datos);
    } catch {
      setError("No fue posible cargar tus promociones.");
    }
  }, []);

  useEffect(() => {
    async function cargar() {
      await cargarPromociones();
      setCargando(false);
    }

    void cargar();
  }, [cargarPromociones]);

  async function recargar() {
    setRefrescando(true);

    try {
      await cargarPromociones();
    } finally {
      setRefrescando(false);
    }
  }

  function abrirAlta() {
    setPromocionEditando(null);
    setModalVisible(true);
  }

  function abrirEdicion(promocion: Promocion) {
    setPromocionEditando(promocion);
    setModalVisible(true);
  }

  async function guardarPromocion(cuerpo: CuerpoPromocionComercio) {
    if (promocionEditando) {
      await editarPromocionComercio(promocionEditando.id, cuerpo);
    } else {
      await crearPromocionComercio(cuerpo);
    }

    await confirmarAccionExitosa();

    setModalVisible(false);
    setPromocionEditando(null);
    await cargarPromociones();
  }

  function pedirBaja(promocion: Promocion) {
    Alert.alert(
      "Dar de baja",
      `«${promocion.titulo}» deja de verse en la app, pero queda en tu historial con sus usos.`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Dar de baja",
          style: "destructive",
          onPress: () => {
            void (async () => {
              try {
                await darDeBajaPromocionComercio(promocion.id);
                await confirmarAccionExitosa();
                await cargarPromociones();
              } catch (e) {
                Alert.alert(
                  "No se pudo dar de baja",
                  e instanceof Error ? e.message : "Intentá de nuevo.",
                );
              }
            })();
          },
        },
      ],
    );
  }

  const ahora = new Date();

  if (cargando) {
    return (
      <View style={styles.estadoContainer}>
        <ActivityIndicator size="large" color={colores.primario} />
        <Text style={styles.estadoTitulo}>Cargando promociones</Text>
        <Text style={styles.estadoTexto}>Traemos tu panel de beneficios.</Text>
      </View>
    );
  }

  if (!esComercio) {
    return (
      <>
        <Stack.Screen options={{ title: "Mis promociones" }} />
        <View style={styles.estadoContainer}>
          <Ionicons
            name="storefront-outline"
            size={32}
            color={colores.secundario}
          />
          <Text style={styles.estadoTitulo}>Panel de comercio</Text>
          <Text style={styles.estadoTexto}>
            Esta sección es para cuentas de comercio. Iniciá sesión con tu
            cuenta de socio.
          </Text>
          <Pressable
            onPress={() => router.push("/login")}
            style={styles.botonPrincipal}
            accessibilityRole="button"
            accessibilityLabel="Iniciar sesión"
          >
            <Text style={styles.botonPrincipalTexto}>Iniciá sesión</Text>
          </Pressable>
        </View>
      </>
    );
  }

  return (
    <>
      <Stack.Screen options={{ title: "Mis promociones" }} />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refrescando}
            onRefresh={recargar}
            colors={[colores.primario]}
            tintColor={colores.primario}
          />
        }
      >
        <Pressable
          onPress={abrirAlta}
          style={styles.botonPrincipal}
          accessibilityRole="button"
          accessibilityLabel="Crear nueva promoción"
        >
          <Ionicons name="add-circle-outline" size={20} color="#FFFFFF" />
          <Text style={styles.botonPrincipalTexto}>Nueva promoción</Text>
        </Pressable>

        {error ? (
          <View style={styles.estadoVacio}>
            <Ionicons
              name="cloud-offline-outline"
              size={32}
              color={colores.secundario}
            />
            <Text style={styles.estadoTitulo}>
              No pudimos cargar tus promociones
            </Text>
            <Text style={styles.estadoTexto}>{error}</Text>

            <Pressable
              onPress={() => void recargar()}
              style={styles.botonSecundario}
              accessibilityRole="button"
              accessibilityLabel="Reintentar cargar promociones"
            >
              <Text style={styles.botonSecundarioTexto}>Reintentar</Text>
            </Pressable>
          </View>
        ) : promociones.length === 0 ? (
          <View style={styles.estadoVacio}>
            <Ionicons
              name="pricetag-outline"
              size={32}
              color={colores.secundario}
            />
            <Text style={styles.estadoTitulo}>
              Todavía no cargaste promociones
            </Text>
            <Text style={styles.estadoTexto}>
              Creá la primera y aparece al instante en la pestaña Promos de
              los vecinos.
            </Text>
          </View>
        ) : (
          <View style={styles.lista}>
            {promociones.map((promocion) => {
              const estado = estadoDePromocion(promocion, ahora);

              return (
                <View key={promocion.id} style={styles.card}>
                  <View style={styles.cardEncabezado}>
                    <View style={styles.cardIcono}>
                      <Ionicons
                        name="pricetag-outline"
                        size={18}
                        color={colores.promo}
                      />
                    </View>
                    <Text style={styles.cardTitulo}>{promocion.titulo}</Text>

                    <View
                      style={[
                        styles.estadoChip,
                        estado === "activa" && styles.chipActiva,
                        estado === "vencida" && styles.chipVencida,
                        estado === "baja" && styles.chipBaja,
                      ]}
                    >
                      <Text style={styles.estadoChipTexto}>
                        {estado === "activa"
                          ? "Activa"
                          : estado === "vencida"
                            ? "Vencida"
                            : "Dada de baja"}
                      </Text>
                    </View>
                  </View>

                  <Text style={styles.cardDetalle} numberOfLines={2}>
                    {promocion.detalle}
                  </Text>

                  <View style={styles.datosFila}>
                    {promocion.descuento !== null ? (
                      <View style={styles.descuentoChip}>
                        <Text style={styles.descuentoTexto}>
                          {promocion.descuento}% OFF
                        </Text>
                      </View>
                    ) : null}

                    <View style={styles.usosChip}>
                      <Ionicons
                        name="people-outline"
                        size={13}
                        color={colores.primarioOscuro}
                      />
                      <Text style={styles.usosTexto}>
                        {promocion.usos}{" "}
                        {promocion.usos === 1 ? "uso" : "usos"}
                      </Text>
                    </View>

                    {promocion.soloApp ? (
                      <View style={styles.soloAppChip}>
                        <Ionicons
                          name="qr-code-outline"
                          size={13}
                          color={colores.promo}
                        />
                        <Text style={styles.soloAppTexto}>Sólo app</Text>
                      </View>
                    ) : null}
                  </View>

                  <View style={styles.vigenciaFila}>
                    <Ionicons
                      name="calendar-outline"
                      size={14}
                      color={colores.secundario}
                    />
                    <Text style={styles.vigenciaTexto}>
                      Del {formatearFecha(promocion.desde)} al{" "}
                      {formatearFecha(promocion.hasta)}
                    </Text>
                  </View>

                  {estado === "baja" ? (
                    <Text style={styles.textoBaja}>
                      Dada de baja: no se muestra a los vecinos, pero queda
                      en tu historial.
                    </Text>
                  ) : (
                    <View style={styles.accionesFila}>
                      <Pressable
                        onPress={() => abrirEdicion(promocion)}
                        style={styles.accion}
                        accessibilityRole="button"
                        accessibilityLabel={`Editar ${promocion.titulo}`}
                      >
                        <Ionicons
                          name="create-outline"
                          size={16}
                          color={colores.primario}
                        />
                        <Text style={styles.accionTexto}>Editar</Text>
                      </Pressable>

                      <Pressable
                        onPress={() => pedirBaja(promocion)}
                        style={styles.accion}
                        accessibilityRole="button"
                        accessibilityLabel={`Dar de baja ${promocion.titulo}`}
                      >
                        <Ionicons
                          name="trash-outline"
                          size={16}
                          color={colores.cerrado}
                        />
                        <Text style={[styles.accionTexto, styles.accionBaja]}>
                          Dar de baja
                        </Text>
                      </Pressable>
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>

      <FormularioPromocion
        visible={modalVisible}
        promocionExistente={promocionEditando}
        colores={colores}
        onGuardar={guardarPromocion}
        onCancelar={() => {
          setModalVisible(false);
          setPromocionEditando(null);
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
    botonPrincipal: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      backgroundColor: colores.primario,
      borderRadius: 13,
      minHeight: 48,
      paddingVertical: 12,
    },
    botonPrincipalTexto: {
      color: "#FFFFFF",
      fontSize: 15,
      fontWeight: "700",
    },
    botonSecundario: {
      borderWidth: 1,
      borderColor: colores.primario,
      borderRadius: 12,
      paddingHorizontal: 24,
      paddingVertical: 10,
      marginTop: 6,
    },
    botonSecundarioTexto: {
      color: colores.primario,
      fontWeight: "700",
      fontSize: 14,
    },
    lista: {
      gap: 12,
    },
    card: {
      backgroundColor: colores.tarjeta,
      borderWidth: 1,
      borderColor: colores.borde,
      borderRadius: 16,
      padding: 16,
      gap: 10,
    },
    cardEncabezado: {
      flexDirection: "row",
      alignItems: "center",
      gap: 9,
    },
    cardIcono: {
      width: 34,
      height: 34,
      borderRadius: 10,
      backgroundColor: colores.promoFondo,
      alignItems: "center",
      justifyContent: "center",
    },
    cardTitulo: {
      flex: 1,
      fontSize: 16,
      fontWeight: "800",
      color: colores.texto,
    },
    estadoChip: {
      paddingHorizontal: 9,
      paddingVertical: 5,
      borderRadius: 999,
    },
    chipActiva: {
      backgroundColor: colores.abiertoFondo,
    },
    chipVencida: {
      backgroundColor: colores.promoFondo,
    },
    chipBaja: {
      backgroundColor: colores.superficie,
    },
    estadoChipTexto: {
      fontSize: 11,
      fontWeight: "800",
      color: colores.texto,
    },
    cardDetalle: {
      fontSize: 14,
      lineHeight: 20,
      color: colores.secundario,
    },
    datosFila: {
      flexDirection: "row",
      alignItems: "center",
      flexWrap: "wrap",
      gap: 8,
    },
    descuentoChip: {
      backgroundColor: colores.promoFondo,
      borderRadius: 999,
      paddingHorizontal: 10,
      paddingVertical: 5,
    },
    descuentoTexto: {
      fontSize: 12,
      fontWeight: "800",
      color: colores.promo,
    },
    usosChip: {
      flexDirection: "row",
      alignItems: "center",
      gap: 5,
      backgroundColor: colores.comercioFondo,
      borderRadius: 999,
      paddingHorizontal: 10,
      paddingVertical: 5,
    },
    usosTexto: {
      fontSize: 12,
      fontWeight: "800",
      color: colores.primarioOscuro,
    },
    soloAppChip: {
      flexDirection: "row",
      alignItems: "center",
      gap: 5,
      borderWidth: 1,
      borderColor: colores.promo,
      borderRadius: 999,
      paddingHorizontal: 10,
      paddingVertical: 5,
    },
    soloAppTexto: {
      fontSize: 12,
      fontWeight: "700",
      color: colores.promo,
    },
    vigenciaFila: {
      flexDirection: "row",
      alignItems: "center",
      gap: 5,
    },
    vigenciaTexto: {
      fontSize: 12,
      color: colores.secundario,
    },
    textoBaja: {
      fontSize: 13,
      lineHeight: 18,
      color: colores.secundario,
      fontStyle: "italic",
    },
    accionesFila: {
      flexDirection: "row",
      gap: 18,
      marginTop: 2,
    },
    accion: {
      flexDirection: "row",
      alignItems: "center",
      gap: 5,
      paddingVertical: 4,
    },
    accionTexto: {
      fontSize: 14,
      fontWeight: "600",
      color: colores.primario,
    },
    accionBaja: {
      color: colores.cerrado,
    },
    estadoVacio: {
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 40,
      gap: 8,
    },
    estadoContainer: {
      flex: 1,
      backgroundColor: colores.fondo,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 28,
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
