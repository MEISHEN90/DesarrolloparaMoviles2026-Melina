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

const MAX_RESPUESTA = 1000;

interface PropsFormularioRespuesta {
  visible: boolean;
  nombreComercio: string;
  onEnviar: (texto: string) => Promise<void>;
  onCancelar: () => void;
}

export function FormularioRespuesta({
  visible,
  nombreComercio,
  onEnviar,
  onCancelar,
}: PropsFormularioRespuesta) {
  const [texto, setTexto] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function enviar() {
    const recortado = texto.trim();

    if (recortado.length === 0) {
      setError("Escribí la respuesta antes de enviarla.");
      return;
    }

    try {
      setEnviando(true);
      setError(null);
      await onEnviar(recortado);
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo enviar la respuesta.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onCancelar}>
      <View style={styles.contenedor}>
        <View style={styles.tituloFila}>
          <Ionicons name="storefront-outline" size={22} />
          <Text style={styles.titulo}>Responder como {nombreComercio}</Text>
        </View>

        <Text style={styles.ayuda}>
          Tu respuesta se va a ver debajo de la reseña. Podés responder una
          sola vez.
        </Text>

        <TextInput
          value={texto}
          onChangeText={(valor) => {
            setTexto(valor);
            setError(null);
          }}
          placeholder="Tu versión de lo ocurrido…"
          multiline
          maxLength={MAX_RESPUESTA}
          style={styles.entrada}
          accessibilityLabel="Respuesta del comercio"
        />

        <Text style={styles.contador}>{texto.length}/{MAX_RESPUESTA}</Text>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <View style={styles.botones}>
          <Pressable onPress={onCancelar} style={styles.botonCancelar} disabled={enviando}>
            <Text style={styles.textoCancelar}>Cancelar</Text>
          </Pressable>

          <Pressable
            onPress={enviar}
            style={[styles.botonEnviar, enviando && styles.botonDeshabilitado]}
            disabled={enviando}
            accessibilityRole="button"
            accessibilityLabel="Enviar respuesta"
          >
            <Text style={styles.textoEnviar}>
              {enviando ? "Enviando…" : "Enviar respuesta"}
            </Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  contenedor: { flex: 1, padding: 24, paddingTop: 48, gap: 12 },
  tituloFila: { flexDirection: "row", alignItems: "center", gap: 8 },
  titulo: { fontSize: 22, fontWeight: "700", flex: 1 },
  ayuda: { fontSize: 14, color: "#666" },
  entrada: { borderWidth: 1, borderColor: "#CCC", borderRadius: 10, padding: 14, fontSize: 16, minHeight: 120, textAlignVertical: "top" },
  contador: { fontSize: 12, color: "#888", textAlign: "right" },
  error: { color: "#B3261E", fontWeight: "600" },
  botones: { flexDirection: "row", gap: 12, marginTop: 12 },
  botonEnviar: { flex: 1, backgroundColor: "#222", borderRadius: 10, paddingVertical: 14, alignItems: "center" },
  botonDeshabilitado: { opacity: 0.6 },
  textoEnviar: { color: "#FFF", fontWeight: "600", fontSize: 16 },
  botonCancelar: { flex: 1, borderWidth: 1, borderColor: "#CCC", borderRadius: 10, paddingVertical: 14, alignItems: "center" },
  textoCancelar: { fontSize: 16 },
});
