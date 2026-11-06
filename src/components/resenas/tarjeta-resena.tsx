import { Ionicons } from "@expo/vector-icons";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";

import { Resena } from "../../tipos/modelos";

interface PropsTarjetaResena {
  resena: Resena;
  esPropia: boolean;
  puedeResponder?: boolean;
  onEditar: (resena: Resena) => void;
  onBorrar: (resena: Resena) => void;
  onReportar: (resena: Resena) => void;
  onResponder?: (resena: Resena) => void;
}

function formatearFecha(fecha: string): string {
  return new Date(fecha).toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function Estrellas({ cantidad }: { cantidad: number }) {
  return (
    <View style={styles.estrellasFila}>
      {[1, 2, 3, 4, 5].map((estrella) => (
        <Ionicons
          key={estrella}
          name={estrella <= cantidad ? "star" : "star-outline"}
          size={16}
          color="#E8A33D"
        />
      ))}
    </View>
  );
}

export function TarjetaResena({
  resena,
  esPropia,
  puedeResponder = false,
  onEditar,
  onBorrar,
  onReportar,
  onResponder,
}: PropsTarjetaResena) {
  function confirmarBorrado() {
    Alert.alert("Borrar reseña", "¿Seguro que querés borrar tu reseña?", [
      { text: "Cancelar", style: "cancel" },
      { text: "Borrar", style: "destructive", onPress: () => onBorrar(resena) },
    ]);
  }

  function confirmarReporte() {
    Alert.alert(
      "Reportar reseña",
      "Vas a reportar esta reseña como ofensiva. Dejará de verse para vos.",
      [
        { text: "Cancelar", style: "cancel" },
        { text: "Reportar", style: "destructive", onPress: () => onReportar(resena) },
      ],
    );
  }

  return (
    <View style={styles.card}>
      <View style={styles.encabezado}>
        <View style={styles.autorContainer}>
          <View style={styles.avatar}>
            <Ionicons name="person-outline" size={18} />
          </View>

          <View>
            <Text style={styles.autor}>{esPropia ? "Tu reseña" : "Vecino/a"}</Text>
            <Text style={styles.fecha}>{formatearFecha(resena.creadaEn)}</Text>
          </View>
        </View>

        <Estrellas cantidad={resena.estrellas} />
      </View>

      <Text style={styles.comentario}>{resena.comentario}</Text>

      {!resena.sincronizada && (
        <View style={styles.pendiente}>
          <Ionicons name="cloud-offline-outline" size={14} />
          <Text style={styles.pendienteTexto}>
            Pendiente de enviar — se sube cuando haya conexión
          </Text>
        </View>
      )}

      {resena.respuesta ? (
        <View style={styles.respuesta}>
          <View style={styles.respuestaTituloFila}>
            <Ionicons name="storefront-outline" size={16} />
            <Text style={styles.respuestaTitulo}>Respuesta del comercio</Text>
          </View>
          <Text style={styles.respuestaTexto}>{resena.respuesta}</Text>
        </View>
      ) : null}

      <View style={styles.acciones}>
        {esPropia ? (
          <>
            <Pressable onPress={() => onEditar(resena)} style={styles.accion} accessibilityRole="button" accessibilityLabel="Editar mi reseña">
              <Ionicons name="create-outline" size={16} />
              <Text style={styles.accionTexto}>Editar</Text>
            </Pressable>

            <Pressable onPress={confirmarBorrado} style={styles.accion} accessibilityRole="button" accessibilityLabel="Borrar mi reseña">
              <Ionicons name="trash-outline" size={16} />
              <Text style={styles.accionTexto}>Borrar</Text>
            </Pressable>
          </>
        ) : (
          <Pressable onPress={confirmarReporte} style={styles.accion} accessibilityRole="button" accessibilityLabel="Reportar reseña como ofensiva">
            <Ionicons name="flag-outline" size={16} />
            <Text style={styles.accionTexto}>Reportar</Text>
          </Pressable>
        )}

        {puedeResponder && !esPropia && !resena.respuesta ? (
          <Pressable onPress={() => onResponder?.(resena)} style={styles.accion} accessibilityRole="button" accessibilityLabel="Responder esta reseña">
            <Ionicons name="chatbubble-outline" size={16} />
            <Text style={styles.accionTexto}>Responder</Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderWidth: 1, borderColor: "#E0E0E0", borderRadius: 12, padding: 16, gap: 10, marginBottom: 12 },
  encabezado: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 10 },
  autorContainer: { flexDirection: "row", alignItems: "center", gap: 10 },
  avatar: { width: 34, height: 34, borderRadius: 17, backgroundColor: "#EEE", alignItems: "center", justifyContent: "center" },
  autor: { fontWeight: "600", fontSize: 15 },
  fecha: { fontSize: 12, color: "#888" },
  estrellasFila: { flexDirection: "row", gap: 2 },
  comentario: { fontSize: 15, lineHeight: 21 },
  pendiente: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: "#FFF6DE", borderRadius: 8, padding: 8 },
  pendienteTexto: { fontSize: 13, color: "#8A6D1F" },
  respuesta: { backgroundColor: "#F5F5F5", borderRadius: 8, padding: 10, gap: 4 },
  respuestaTituloFila: { flexDirection: "row", alignItems: "center", gap: 6 },
  respuestaTitulo: { fontSize: 13, fontWeight: "600" },
  respuestaTexto: { fontSize: 14, lineHeight: 19 },
  acciones: { flexDirection: "row", gap: 16 },
  accion: { flexDirection: "row", alignItems: "center", gap: 4, paddingVertical: 4 },
  accionTexto: { fontSize: 14, color: "#555" },
});
