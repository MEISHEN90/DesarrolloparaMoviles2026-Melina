import { CameraView, useCameraPermissions } from "expo-camera";
import { router, Stack } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { obtenerUsuarioPorId } from "../src/servicios/autenticacion";
import {
  confirmarAccionExitosa,
  informarError,
} from "../src/servicios/haptica";
import { notificarPromocionRegistrada } from "../src/servicios/notificaciones";
import { obtenerPromocionPorId } from "../src/servicios/promociones";
import { registrarUsoPromocion } from "../src/servicios/usos-promociones";
import { Promocion, Usuario } from "../src/tipos/modelos";
import { DatosQrPromocion, interpretarQrPromocion } from "../src/utils/qr";

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
  const [datosQr, setDatosQr] = useState<DatosQrPromocion | null>(null);
  const [promocion, setPromocion] = useState<Promocion | null>(null);
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [mensajeError, setMensajeError] = useState<string | null>(null);
  const [confirmando, setConfirmando] = useState(false);

  if (!permiso) {
    return (
      <View style={styles.estadoContainer}>
        <ActivityIndicator size="large" />
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
    if (estadoQr !== "escaneando") {
      return;
    }

    setEstadoQr("validando");
    setCodigoLeido(data);
    setMensajeError(null);

    const datosInterpretados = interpretarQrPromocion(data);

    if (!datosInterpretados) {
      await informarError();

      setEstadoQr("invalido");
      setMensajeError("El código QR no corresponde a una promoción válida.");
      return;
    }

    try {
      const [promocionEncontrada, usuarioEncontrado] = await Promise.all([
        obtenerPromocionPorId(datosInterpretados.promocionId),
        obtenerUsuarioPorId(datosInterpretados.usuarioId),
      ]);

      if (!promocionEncontrada) {
        await informarError();

        setEstadoQr("invalido");
        setMensajeError("La promoción indicada en el código no existe.");
        return;
      }

      if (!promocionEncontrada.activa) {
        await informarError();

        setEstadoQr("invalido");
        setMensajeError("La promoción ya no se encuentra activa.");
        return;
      }

      if (!usuarioEncontrado) {
        await informarError();

        setEstadoQr("invalido");
        setMensajeError("El usuario indicado en el código no existe.");
        return;
      }

      setDatosQr(datosInterpretados);
      setPromocion(promocionEncontrada);
      setUsuario(usuarioEncontrado);
      setEstadoQr("valido");
    } catch {
      await informarError();

      setEstadoQr("invalido");
      setMensajeError("No fue posible validar el código QR.");
    }
  }

  async function manejarConfirmarUso() {
    if (!datosQr || !promocion || !usuario || !codigoLeido) {
      return;
    }

    try {
      setConfirmando(true);
      setMensajeError(null);

      await registrarUsoPromocion(promocion.id, usuario.id, codigoLeido);

      await confirmarAccionExitosa();

      await notificarPromocionRegistrada(promocion.titulo, usuario.nombre);

      setEstadoQr("confirmado");
    } catch (errorDesconocido) {
      await informarError();

      if (errorDesconocido instanceof Error) {
        setMensajeError(errorDesconocido.message);
      } else {
        setMensajeError("No fue posible registrar el uso de la promoción.");
      }
    } finally {
      setConfirmando(false);
    }
  }

  function volverAEscanear() {
    setEstadoQr("escaneando");
    setCodigoLeido(null);
    setDatosQr(null);
    setPromocion(null);
    setUsuario(null);
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
            <ActivityIndicator size="large" />
            <Text style={styles.estadoTexto}>Validando código...</Text>
          </View>
        )}

        {estadoQr === "valido" && promocion && usuario && (
          <View style={styles.resultadoContainer}>
            <Text style={styles.titulo}>Código válido</Text>

            <Text style={styles.label}>Promoción</Text>
            <Text style={styles.valor}>{promocion.titulo}</Text>

            <Text style={styles.label}>Detalle</Text>
            <Text style={styles.valor}>{promocion.detalle}</Text>

            <Text style={styles.label}>Cliente</Text>
            <Text style={styles.valor}>{usuario.nombre}</Text>

            <Text style={styles.label}>Correo electrónico</Text>
            <Text style={styles.valor}>{usuario.email}</Text>

            {mensajeError && <Text style={styles.error}>{mensajeError}</Text>}

            <Pressable
              onPress={manejarConfirmarUso}
              disabled={confirmando}
              style={[styles.boton, confirmando && styles.botonDeshabilitado]}
              accessibilityRole="button"
            >
              {confirmando ? (
                <ActivityIndicator />
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

        {estadoQr === "confirmado" && promocion && usuario && (
          <View style={styles.resultadoContainer}>
            <Text style={styles.titulo}>Promoción registrada</Text>

            <Text style={styles.exito}>
              El uso de la promoción fue registrado correctamente.
            </Text>

            <Text style={styles.label}>Promoción</Text>
            <Text style={styles.valor}>{promocion.titulo}</Text>

            <Text style={styles.label}>Cliente</Text>
            <Text style={styles.valor}>{usuario.nombre}</Text>

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
