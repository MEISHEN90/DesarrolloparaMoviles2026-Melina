import { CameraView, useCameraPermissions } from "expo-camera";
import { router, Stack } from "expo-router";
import { useRef, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import {
  confirmarAccionExitosa,
  informarError,
} from "../src/servicios/haptica";
import { notificarPromocionRegistrada } from "../src/servicios/notificaciones";
import { obtenerPromocionPorId } from "../src/servicios/promociones";
import { validarCodigoPromocion } from "../src/servicios/usos-promociones";
import { Promocion, UsoDePromocion } from "../src/tipos/modelos";

type EstadoQr =
  | "escaneando"
  | "validando"
  | "valido"
  | "invalido"
  | "confirmado";

export default function EscanearQrScreen() {
  const [permiso, solicitarPermiso] = useCameraPermissions();

  const [estadoQr, setEstadoQr] = useState<EstadoQr>("escaneando");
  const [codigoLeido, setCodigoLeido] = useState<string | null>(null);
  const bloqueoLectura = useRef(false);
  const [usoRegistrado, setUsoRegistrado] = useState<UsoDePromocion | null>(null);
  const [promocion, setPromocion] = useState<Promocion | null>(null);
  const [mensajeError, setMensajeError] = useState<string | null>(null);
  const [confirmando, setConfirmando] = useState(false);

  if (!permiso) {
    return (
      <View style={styles.estadoContainer}>
        <ActivityIndicator size="large"  />
        <Text style={styles.estadoTexto}>Verificando permiso de cámara...</Text>
      </View>
    );
  }

  if (!permiso.granted) {
    return (
      <>
        <Stack.Screen options={{ title: "Escanear QR" }} />

        <View style={styles.estadoContainer}>
          <Text style={styles.titulo}>Acceso a la cámara</Text>

          <Text style={styles.estadoTexto}>
            Para leer el código QR de una promoción, la aplicación necesita
            permiso para usar la cámara.
          </Text>

          <Pressable
            onPress={solicitarPermiso}
            style={styles.boton}
            accessibilityRole="button"
          >
            <Text style={styles.botonTexto}>Permitir cámara</Text>
          </Pressable>

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

  async function manejarCodigoLeido({ data }: { data: string }) {
    if (bloqueoLectura.current || estadoQr !== "escaneando") return;
    bloqueoLectura.current = true;
    const codigo = data.trim();
    setCodigoLeido(codigo);
    setMensajeError(null);
    if (!/^CCU-[A-Z0-9]{4}-[A-Z0-9]{4}$/.test(codigo)) {
      setEstadoQr("invalido");
      setMensajeError(codigo.startsWith("PROMO|")
        ? "Este QR pertenece al formato anterior. Volvé a generar el código desde la promoción con la app actualizada."
        : "El código no tiene el formato de una promoción. Debe comenzar con CCU-.");
      await informarError().catch(() => {});
      return;
    }
    // La API valida y registra en una sola operación al confirmar.
    setEstadoQr("valido");
  }

  async function manejarConfirmarUso() {
    if (!codigoLeido || confirmando) return;
    try {
      setConfirmando(true);
      setMensajeError(null);
      const uso = await validarCodigoPromocion(codigoLeido);
      setUsoRegistrado(uso);
      setEstadoQr("confirmado");
      // Una falla de detalle, vibración o notificación no revierte el canje exitoso.
      const detalle = await obtenerPromocionPorId(uso.promocionId).catch(() => null);
      setPromocion(detalle);
      await confirmarAccionExitosa().catch(() => {});
      await notificarPromocionRegistrada(detalle?.titulo ?? "Promoción", uso.usuarioId).catch(() => {});
    } catch (error) {
      setEstadoQr("invalido");
      setMensajeError(error instanceof Error ? error.message : "No fue posible validar el código.");
      await informarError().catch(() => {});
    } finally { setConfirmando(false); }
  }

  function volverAEscanear() {
    setEstadoQr("escaneando");
    setCodigoLeido(null);
    bloqueoLectura.current = false;
    setUsoRegistrado(null);
    setPromocion(null);
    setMensajeError(null);
  }

  return (
    <>
      <Stack.Screen options={{ title: "Escanear QR" }} />

      <View style={styles.container}>
        {estadoQr === "escaneando" && (
          <>
            <CameraView
              style={styles.camara}
              facing="back"
              barcodeScannerSettings={{
                barcodeTypes: ["qr"],
              }}
              onBarcodeScanned={manejarCodigoLeido}
            />

            <View style={styles.instrucciones}>
              <Text style={styles.instruccionesTitulo}>Escanear código QR</Text>

              <Text style={styles.instruccionesTexto}>
                Ubicá el código dentro de la cámara. La lectura se realizará
                automáticamente.
              </Text>
            </View>
          </>
        )}

        {estadoQr === "validando" && (
          <View style={styles.estadoContainer}>
            <ActivityIndicator size="large"  />
            <Text style={styles.estadoTexto}>Validando código...</Text>
          </View>
        )}

        {estadoQr === "valido" && (
          <View style={styles.resultadoContainer}>
            <Text style={styles.titulo}>Código leído</Text>
            <Text style={styles.valor}>{codigoLeido}</Text>
            <Text style={styles.estadoTexto}>Al confirmar, el servidor verificará el código y registrará el uso si corresponde a su comercio y sigue vigente.</Text>

            {mensajeError && <Text style={styles.error}>{mensajeError}</Text>}

            <Pressable
              onPress={manejarConfirmarUso}
              disabled={confirmando}
              style={[styles.boton, confirmando && styles.botonDeshabilitado]}
              accessibilityRole="button"
            >
              {confirmando ? (
                <ActivityIndicator  />
              ) : (
                <Text style={styles.botonTexto}>
                  Confirmar uso de promoción
                </Text>
              )}
            </Pressable>

            <Pressable
              onPress={volverAEscanear}
              style={styles.botonSecundario}
              accessibilityRole="button"
            >
              <Text style={styles.botonSecundarioTexto}>
                Escanear otro código
              </Text>
            </Pressable>
          </View>
        )}

        {estadoQr === "invalido" && (
          <View style={styles.resultadoContainer}>
            <Text style={styles.titulo}>Código QR no válido</Text>

            <Text style={styles.error}>
              {mensajeError ?? "El código escaneado no es válido."}
            </Text>

            {codigoLeido && (
              <>
                <Text style={styles.label}>Contenido detectado</Text>
                <Text style={styles.valor}>{codigoLeido}</Text>
              </>
            )}

            <Pressable
              onPress={volverAEscanear}
              style={styles.boton}
              accessibilityRole="button"
            >
              <Text style={styles.botonTexto}>Escanear otro código</Text>
            </Pressable>

            <Pressable
              onPress={() => router.back()}
              style={styles.botonSecundario}
              accessibilityRole="button"
            >
              <Text style={styles.botonSecundarioTexto}>Finalizar</Text>
            </Pressable>
          </View>
        )}

        {estadoQr === "confirmado" && usoRegistrado && (
          <View style={styles.resultadoContainer}>
            <Text style={styles.titulo}>Promoción registrada</Text>

            <Text style={styles.exito}>
              El uso de la promoción fue registrado correctamente.
            </Text>

            <Text style={styles.label}>Promoción</Text>
            <Text style={styles.valor}>{promocion?.titulo ?? usoRegistrado?.promocionId}</Text>

            <Text style={styles.label}>Cliente</Text>
            <Text style={styles.valor}>{usoRegistrado.usuarioId}</Text>

            <Pressable
              onPress={volverAEscanear}
              style={styles.boton}
              accessibilityRole="button"
            >
              <Text style={styles.botonTexto}>Escanear otro código</Text>
            </Pressable>

            <Pressable
              onPress={() => router.back()}
              style={styles.botonSecundario}
              accessibilityRole="button"
            >
              <Text style={styles.botonSecundarioTexto}>Finalizar</Text>
            </Pressable>
          </View>
        )}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  camara: {
    flex: 1,
  },

  instrucciones: {
    padding: 18,
  },

  instruccionesTitulo: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 6,
  },

  instruccionesTexto: {
    fontSize: 15,
    lineHeight: 21,
  },

  estadoContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    gap: 14,
  },

  estadoTexto: {
    fontSize: 16,
    lineHeight: 22,
    textAlign: "center",
  },

  resultadoContainer: {
    flex: 1,
    justifyContent: "center",
    padding: 24,
  },

  titulo: {
    fontSize: 26,
    fontWeight: "700",
    marginBottom: 20,
  },

  label: {
    fontSize: 14,
    fontWeight: "700",
    marginTop: 10,
    marginBottom: 4,
  },

  valor: {
    fontSize: 16,
    marginBottom: 8,
  },

  error: {
    fontSize: 15,
    lineHeight: 21,
    marginVertical: 12,
  },

  exito: {
    fontSize: 16,
    lineHeight: 22,
    marginBottom: 16,
  },

  boton: {
    marginTop: 18,
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
    paddingVertical: 14,
    alignItems: "center",
  },

  botonSecundarioTexto: {
    fontSize: 15,
    fontWeight: "600",
  },
});

