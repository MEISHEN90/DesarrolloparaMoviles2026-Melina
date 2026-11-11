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

import {
  confirmarAccionExitosa,
  informarError,
} from "../src/servicios/haptica";
import { notificarPromocionRegistrada } from "../src/servicios/notificaciones";
import { obtenerPromocionPorId } from "../src/servicios/promociones";
import { validarUsoPromocion } from "../src/servicios/usos-promociones";
import { Promocion, UsoDePromocion } from "../src/tipos/modelos";
import {
  normalizarCodigoPromocion,
  pareceCodigoPromocion,
} from "../src/utils/qr";

type EstadoQr =
  | "escaneando"
  | "detectado"
  | "validando"
  | "invalido"
  | "confirmado";

export default function EscanearQrScreen() {
  const [permiso, solicitarPermiso] = useCameraPermissions();

  const [estadoQr, setEstadoQr] = useState<EstadoQr>("escaneando");
  const [codigoLeido, setCodigoLeido] = useState<string | null>(null);
  const [usoConfirmado, setUsoConfirmado] = useState<UsoDePromocion | null>(null);
  const [promocion, setPromocion] = useState<Promocion | null>(null);
  const [mensajeError, setMensajeError] = useState<string | null>(null);

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

    const codigo = normalizarCodigoPromocion(data);
    setCodigoLeido(codigo);
    setMensajeError(null);

    if (!pareceCodigoPromocion(codigo)) {
      await informarError();
      setEstadoQr("invalido");
      setMensajeError("El código QR no tiene el formato de una promoción.");
      return;
    }

    setEstadoQr("detectado");
  }

  async function manejarConfirmarUso() {
    if (!codigoLeido) {
      return;
    }

    try {
      setEstadoQr("validando");
      setMensajeError(null);

      const uso = await validarUsoPromocion(codigoLeido);
      setUsoConfirmado(uso);

      try {
        const promo = await obtenerPromocionPorId(uso.promocionId);
        setPromocion(promo);

        if (promo) {
          await notificarPromocionRegistrada(promo.titulo);
        }
      } catch {
        setPromocion(null);
      }

      await confirmarAccionExitosa();
      setEstadoQr("confirmado");
    } catch (errorDesconocido) {
      await informarError();
      setEstadoQr("invalido");
      setMensajeError(
        errorDesconocido instanceof Error
          ? errorDesconocido.message
          : "No fue posible validar el código QR.",
      );
    }
  }

  function volverAEscanear() {
    setEstadoQr("escaneando");
    setCodigoLeido(null);
    setUsoConfirmado(null);
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
              barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
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

        {estadoQr === "detectado" && codigoLeido && (
          <View style={styles.resultadoContainer}>
            <Text style={styles.titulo}>Código detectado</Text>
            <Text style={styles.estadoTexto}>
              Confirmá para que la API valide y registre el uso de la promoción.
            </Text>

            <Text style={styles.label}>Código</Text>
            <Text style={styles.valor}>{codigoLeido}</Text>

            <Pressable
              onPress={manejarConfirmarUso}
              style={styles.boton}
              accessibilityRole="button"
            >
              <Text style={styles.botonTexto}>Validar promoción</Text>
            </Pressable>

            <Pressable
              onPress={volverAEscanear}
              style={styles.botonSecundario}
              accessibilityRole="button"
            >
              <Text style={styles.botonSecundarioTexto}>Escanear otro código</Text>
            </Pressable>
          </View>
        )}

        {estadoQr === "validando" && (
          <View style={styles.estadoContainer}>
            <ActivityIndicator size="large" />
            <Text style={styles.estadoTexto}>Validando código con la API...</Text>
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

        {estadoQr === "confirmado" && usoConfirmado && (
          <View style={styles.resultadoContainer}>
            <Text style={styles.titulo}>Promoción registrada</Text>

            <Text style={styles.exito}>
              El uso de la promoción fue registrado correctamente en la API.
            </Text>

            {promocion ? (
              <>
                <Text style={styles.label}>Promoción</Text>
                <Text style={styles.valor}>{promocion.titulo}</Text>
              </>
            ) : null}

            <Text style={styles.label}>Código</Text>
            <Text style={styles.valor}>{usoConfirmado.codigo}</Text>

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
  container: { flex: 1 },
  camara: { flex: 1 },
  instrucciones: { padding: 18 },
  instruccionesTitulo: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 6,
  },
  instruccionesTexto: { fontSize: 15, lineHeight: 21 },
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
