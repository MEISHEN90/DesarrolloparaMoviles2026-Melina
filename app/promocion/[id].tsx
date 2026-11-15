import { Stack, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View, Pressable, ScrollView } from "react-native";

import { obtenerPromocionPorId } from "../../src/servicios/promociones";
import QRCode from "react-native-qrcode-svg";
import { obtenerUsuarioActual } from "../../src/servicios/autenticacion";
import { generarCodigoPromocion, obtenerUsosPromocion } from "../../src/servicios/usos-promociones";
import { Promocion } from "../../src/tipos/modelos";

function formatearFecha(fecha: string): string {
  return new Date(fecha).toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export default function PromocionDetalleScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  const [esVecino, setEsVecino] = useState(false);
  const [codigo, setCodigo] = useState<string | null>(null);
  const [usada, setUsada] = useState(false);
  const [generando, setGenerando] = useState(false);
  const [errorCodigo, setErrorCodigo] = useState<string | null>(null);
  const [promocion, setPromocion] = useState<Promocion | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function cargarPromocion() {
      try {
        setCargando(true);
        setError(null);

        const datos = await obtenerPromocionPorId(id);

        setPromocion(datos);
        setCodigo(null);
        setUsada(false);
        setErrorCodigo(null);
        const usuario = await obtenerUsuarioActual();
        setEsVecino(usuario?.rol === "vecino");
        if (datos?.soloApp && usuario?.rol === "vecino") {
          const usos = await obtenerUsosPromocion().catch(() => []);
          setUsada(usos.some(uso => uso.promocionId === datos.id && uso.validadoEn !== null));
        }
      } catch {
        setError("No fue posible cargar la promoción.");
      } finally {
        setCargando(false);
      }
    }

    cargarPromocion();
  }, [id]);

  async function mostrarCodigo() {
    if (!promocion || generando) return;
    try {
      setGenerando(true);
      setErrorCodigo(null);
      const uso = await generarCodigoPromocion(promocion.id);
      setUsada(uso.validadoEn !== null);
      setCodigo(uso.validadoEn === null ? uso.codigo : null);
    } catch (error) {
      setErrorCodigo(error instanceof Error ? error.message : "No fue posible generar el código.");
    } finally { setGenerando(false); }
  }

  if (cargando) {
    return (
      <View style={styles.estadoContainer}>
        <ActivityIndicator size="large" />
        <Text style={styles.estadoTexto}>Cargando promoción...</Text>
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

  if (!promocion) {
    return (
      <View style={styles.estadoContainer}>
        <Text style={styles.estadoTexto}>Promoción no encontrada.</Text>
      </View>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: promocion.titulo,
        }}
      />

      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>{promocion.titulo}</Text>

        <Text style={styles.detalle}>{promocion.detalle}</Text>

        <Text style={styles.label}>Descuento</Text>
        <Text style={styles.text}>
          {promocion.descuento !== null
            ? `${promocion.descuento}%`
            : "Beneficio especial"}
        </Text>

        <Text style={styles.label}>Vigencia</Text>
        <Text style={styles.text}>
          Desde {formatearFecha(promocion.desde)} hasta{" "}
          {formatearFecha(promocion.hasta)}
        </Text>

        <Text style={styles.label}>Exclusiva de la app</Text>
        <Text style={styles.text}>{promocion.soloApp ? "Sí" : "No"}</Text>

        <Text style={styles.label}>Usos registrados</Text>
        <Text style={styles.text}>{promocion.usos}</Text>

        <Text style={styles.label}>Estado</Text>
        <Text style={styles.text}>
          {promocion.activa ? "Activa" : "Inactiva"}
        </Text>
        {promocion.soloApp && esVecino ? (
          <View>
            {usada ? <Text style={styles.text}>Esta promoción ya fue utilizada.</Text> : (
              <>
                <Pressable onPress={mostrarCodigo} disabled={generando} accessibilityRole="button" style={{ paddingVertical: 16 }}>
                  <Text style={styles.label}>{generando ? "Generando código..." : "Mostrar mi código"}</Text>
                </Pressable>
                {codigo ? <View style={{ alignItems: "center", padding: 16, backgroundColor: "white" }}>
                  <QRCode value={codigo} size={210} color="#111111" backgroundColor="#FFFFFF" />
                  <Text style={{ color: "#111111", marginTop: 12 }}>{codigo}</Text>
                </View> : null}
              </>
            )}
            {errorCodigo ? <Text style={styles.errorTexto}>{errorCodigo}</Text> : null}
          </View>
        ) : null}

      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 20,
    gap: 8,
  },

  title: {
    fontSize: 26,
    fontWeight: "700",
    marginBottom: 4,
  },

  detalle: {
    fontSize: 16,
    marginBottom: 12,
  },

  label: {
    fontSize: 14,
    fontWeight: "700",
    marginTop: 8,
  },

  text: {
    fontSize: 15,
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

