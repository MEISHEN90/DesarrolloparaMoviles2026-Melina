import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { Resena } from "../../tipos/modelos";
import { validarResena } from "../../utils/resenas";

interface PropsFormularioResena {
  visible: boolean;
  resenaExistente?: Resena | null;
  cerradoHacePoco?: boolean;
  onGuardar: (estrellas: 1 | 2 | 3 | 4 | 5, comentario: string) => Promise<void>;
  onCancelar: () => void;
}

const MAX_COMENTARIO = 1000;

export function FormularioResena({
  visible,
  resenaExistente,
  cerradoHacePoco = false,
  onGuardar,
  onCancelar,
}: PropsFormularioResena) {
  const [estrellas, setEstrellas] = useState<1 | 2 | 3 | 4 | 5>(
    resenaExistente?.estrellas ?? 5,
  );
  const [comentario, setComentario] = useState(resenaExistente?.comentario ?? "");
  const [error, setError] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);

  async function guardar() {
    const errorDeValidacion = validarResena(estrellas, comentario);

    if (errorDeValidacion) {
      setError(errorDeValidacion);
      return;
    }

    try {
      setGuardando(true);
      setError(null);
      await onGuardar(estrellas, comentario.trim());
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo guardar la reseña.");
    } finally {
      setGuardando(false);
    }
  }

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onCancelar}>
      <View style={styles.contenedor}>
        <Text style={styles.titulo}>
          {resenaExistente ? "Editar mi reseña" : "Escribir una reseña"}
        </Text>

        {cerradoHacePoco && (
          <Text style={styles.aviso}>
            Escribís una reseña que quedó pendiente: se va a subir cuando haya
            conexión.
          </Text>
        )}

        <Text style={styles.etiqueta}>¿Cuántas estrellas le das?</Text>

        <View style={styles.estrellasFila}>
          {([1, 2, 3, 4, 5] as const).map((estrella) => (
            <Pressable
              key={estrella}
              onPress={() => setEstrellas(estrella)}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel={`Elegir ${estrella} estrellas`}
            >
              <Ionicons
                name={estrella <= estrellas ? "star" : "star-outline"}
                size={40}
                color={estrella <= estrellas ? "#E8A33D" : "#999"}
              />
            </Pressable>
          ))}
        </View>

        <Text style={styles.etiqueta}>Tu comentario</Text>

        <TextInput
          value={comentario}
          onChangeText={(texto) => {
            setComentario(texto);
            setError(null);
          }}
          placeholder="Contá cómo te atendieron…"
          multiline
          maxLength={MAX_COMENTARIO}
          style={styles.entrada}
          accessibilityLabel="Comentario de la reseña"
        />

        <Text style={styles.contador}>{comentario.length}/{MAX_COMENTARIO}</Text>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <View style={styles.botones}>
          <Pressable onPress={onCancelar} style={styles.botonCancelar} disabled={guardando}>
            <Text style={styles.textoCancelar}>Cancelar</Text>
          </Pressable>

          <Pressable
            onPress={guardar}
            style={[styles.botonGuardar, guardando && styles.botonDeshabilitado]}
            disabled={guardando}
            accessibilityRole="button"
            accessibilityLabel="Guardar reseña"
          >
            <Text style={styles.textoGuardar}>
              {guardando ? "Guardando…" : "Guardar"}
            </Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  contenedor: { flex: 1, padding: 24, paddingTop: 48, gap: 12 },
  titulo: { fontSize: 24, fontWeight: "700", marginBottom: 8 },
  aviso: { fontSize: 14, color: "#8A6D1F", backgroundColor: "#FFF6DE", borderRadius: 10, padding: 12 },
  etiqueta: { fontSize: 16, fontWeight: "600" },
  estrellasFila: { flexDirection: "row", gap: 8 },
  entrada: { borderWidth: 1, borderColor: "#CCC", borderRadius: 10, padding: 14, fontSize: 16, minHeight: 120, textAlignVertical: "top" },
  contador: { fontSize: 12, color: "#888", textAlign: "right" },
  error: { color: "#B3261E", fontWeight: "600" },
  botones: { flexDirection: "row", gap: 12, marginTop: 12 },
  botonGuardar: { flex: 1, backgroundColor: "#222", borderRadius: 10, paddingVertical: 14, alignItems: "center" },
  botonDeshabilitado: { opacity: 0.6 },
  textoGuardar: { color: "#FFF", fontWeight: "600", fontSize: 16 },
  botonCancelar: { flex: 1, borderWidth: 1, borderColor: "#CCC", borderRadius: 10, paddingVertical: 14, alignItems: "center" },
  textoCancelar: { fontSize: 16 },
});
