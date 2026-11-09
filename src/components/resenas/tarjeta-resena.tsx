import { Ionicons } from "@expo/vector-icons";
import { useMemo } from "react";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";

import { ColoresTema } from "../../contexto/tema";
import { Resena } from "../../tipos/modelos";

interface PropsTarjetaResena {
  resena: Resena;
  esPropia: boolean;
  puedeResponder?: boolean;
  /** Nombre a mostrar; si no llega, se muestra el rótulo genérico. */
  autor?: string;
  /** Paleta del tema activo; sin ella la tarjeta usa su aspecto original. */
  colores?: ColoresTema;
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

function Estrellas({
  cantidad,
  colores,
}: {
  cantidad: number;
  colores?: ColoresTema;
}) {
  const estilos = useMemo(() => crearEstilos(colores), [colores]);

  return (
    <View style={estilos.estrellasFila}>
      {[1, 2, 3, 4, 5].map((estrella) => (
        <Ionicons
          key={estrella}
          name={estrella <= cantidad ? "star" : "star-outline"}
          size={16}
          color={estrella <= cantidad ? colores?.estrellas ?? "#E8A33D" : colores?.borde ?? "#999"}
        />
      ))}
    </View>
  );
}

export function TarjetaResena({
  resena,
  esPropia,
  puedeResponder = false,
  autor,
  colores,
  onEditar,
  onBorrar,
  onReportar,
  onResponder,
}: PropsTarjetaResena) {
  const estilos = useMemo(() => crearEstilos(colores), [colores]);

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
    <View style={estilos.card}>
      <View style={estilos.encabezado}>
        <View style={estilos.autorContainer}>
          <View style={estilos.avatar}>
            <Ionicons
              name="person-outline"
              size={18}
              color={colores?.primario}
            />
          </View>

          <View>
            <Text style={estilos.autor}>
              {esPropia ? "Tu reseña" : autor ?? "Vecino/a"}
            </Text>
            <Text style={estilos.fecha}>{formatearFecha(resena.creadaEn)}</Text>
          </View>
        </View>

        <Estrellas cantidad={resena.estrellas} colores={colores} />
      </View>

      <Text style={estilos.comentario}>{resena.comentario}</Text>

      {!resena.sincronizada && (
        <View style={estilos.pendiente}>
          <Ionicons
            name="cloud-offline-outline"
            size={14}
            color={colores?.promo}
          />
          <Text style={estilos.pendienteTexto}>
            Pendiente de enviar — se sube cuando haya conexión
          </Text>
        </View>
      )}

      {resena.respuesta ? (
        <View style={estilos.respuesta}>
          <View style={estilos.respuestaTituloFila}>
            <Ionicons
              name="storefront-outline"
              size={16}
              color={colores?.primario}
            />
            <Text style={estilos.respuestaTitulo}>Respuesta del comercio</Text>
          </View>
          <Text style={estilos.respuestaTexto}>{resena.respuesta}</Text>
        </View>
      ) : null}

      <View style={estilos.acciones}>
        {esPropia ? (
          <>
            <Pressable onPress={() => onEditar(resena)} style={estilos.accion} accessibilityRole="button" accessibilityLabel="Editar mi reseña">
              <Ionicons name="create-outline" size={16} color={colores?.secundario} />
              <Text style={estilos.accionTexto}>Editar</Text>
            </Pressable>

            <Pressable onPress={confirmarBorrado} style={estilos.accion} accessibilityRole="button" accessibilityLabel="Borrar mi reseña">
              <Ionicons name="trash-outline" size={16} color={colores?.secundario} />
              <Text style={estilos.accionTexto}>Borrar</Text>
            </Pressable>
          </>
        ) : (
          <Pressable onPress={confirmarReporte} style={estilos.accion} accessibilityRole="button" accessibilityLabel="Reportar reseña como ofensiva">
            <Ionicons name="flag-outline" size={16} color={colores?.secundario} />
            <Text style={estilos.accionTexto}>Reportar</Text>
          </Pressable>
        )}

        {puedeResponder && !esPropia && !resena.respuesta ? (
          <Pressable onPress={() => onResponder?.(resena)} style={estilos.accion} accessibilityRole="button" accessibilityLabel="Responder esta reseña">
            <Ionicons name="chatbubble-outline" size={16} color={colores?.secundario} />
            <Text style={estilos.accionTexto}>Responder</Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

function crearEstilos(colores?: ColoresTema) {
  return StyleSheet.create({
    card: {
      borderWidth: 1,
      borderColor: colores?.borde ?? "#E0E0E0",
      backgroundColor: colores?.superficie,
      borderRadius: 12,
      padding: 16,
      gap: 10,
      marginBottom: 12,
    },
    encabezado: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 10 },
    autorContainer: { flexDirection: "row", alignItems: "center", gap: 10 },
    avatar: {
      width: 34,
      height: 34,
      borderRadius: 17,
      backgroundColor: colores?.comercioFondo ?? "#EEE",
      alignItems: "center",
      justifyContent: "center",
    },
    autor: { fontWeight: "600", fontSize: 15, color: colores?.texto },
    fecha: { fontSize: 12, color: colores?.secundario ?? "#888" },
    estrellasFila: { flexDirection: "row", gap: 2 },
    comentario: { fontSize: 15, lineHeight: 21, color: colores?.texto },
    pendiente: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: "#FFF6DE", borderRadius: 8, padding: 8 },
    pendienteTexto: { fontSize: 13, color: "#8A6D1F", flex: 1 },
    respuesta: {
      backgroundColor: colores?.comercioFondo ?? "#F5F5F5",
      borderRadius: 8,
      padding: 10,
      gap: 4,
    },
    respuestaTituloFila: { flexDirection: "row", alignItems: "center", gap: 6 },
    respuestaTitulo: { fontSize: 13, fontWeight: "600", color: colores?.primarioOscuro },
    respuestaTexto: { fontSize: 14, lineHeight: 19, color: colores?.secundario },
    acciones: { flexDirection: "row", gap: 16 },
    accion: { flexDirection: "row", alignItems: "center", gap: 4, paddingVertical: 4 },
    accionTexto: { fontSize: 14, color: colores?.secundario ?? "#555" },
  });
}
