import Ionicons from "@react-native-vector-icons/ionicons";
import { useEffect, useMemo, useState } from "react";
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { ColoresTema } from "../../contexto/tema";

const MAX_RESPUESTA = 1000;

interface PropsFormularioRespuesta {
  visible: boolean;
  nombreComercio: string;
  /** Paleta del tema activo; sin ella el formulario usa su aspecto original. */
  colores?: ColoresTema;
  onEnviar: (texto: string) => Promise<void>;
  onCancelar: () => void;
}

export function FormularioRespuesta({
  visible,
  nombreComercio,
  colores,
  onEnviar,
  onCancelar,
}: PropsFormularioRespuesta) {
  const estilos = useMemo(() => crearEstilos(colores), [colores]);
  const [texto, setTexto] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  // El modal vive montado: al abrirlo, siempre arranca vacío.
  useEffect(() => {
    if (visible) {
      setTexto("");
      setError(null);
    }
  }, [visible]);

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
      <View style={estilos.contenedor}>
        <View style={estilos.tituloFila}>
          <Ionicons
            name="storefront-outline"
            size={22}
            color={colores?.primario}
          />
          <Text style={estilos.titulo}>Responder como {nombreComercio}</Text>
        </View>

        <Text style={estilos.ayuda}>
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
          placeholderTextColor={colores?.secundario}
          multiline
          maxLength={MAX_RESPUESTA}
          style={estilos.entrada}
          accessibilityLabel="Respuesta del comercio"
        />

        <Text style={estilos.contador}>{texto.length}/{MAX_RESPUESTA}</Text>

        {error ? <Text style={estilos.error}>{error}</Text> : null}

        <View style={estilos.botones}>
          <Pressable onPress={onCancelar} style={estilos.botonCancelar} disabled={enviando}>
            <Text style={estilos.textoCancelar}>Cancelar</Text>
          </Pressable>

          <Pressable
            onPress={enviar}
            style={[estilos.botonEnviar, enviando && estilos.botonDeshabilitado]}
            disabled={enviando}
            accessibilityRole="button"
            accessibilityLabel="Enviar respuesta"
          >
            <Text style={estilos.textoEnviar}>
              {enviando ? "Enviando…" : "Enviar respuesta"}
            </Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

function crearEstilos(colores?: ColoresTema) {
  return StyleSheet.create({
    contenedor: {
      flex: 1,
      padding: 24,
      paddingTop: 48,
      gap: 12,
      backgroundColor: colores?.fondo ?? "#FFFFFF",
    },
    tituloFila: { flexDirection: "row", alignItems: "center", gap: 8 },
    titulo: { fontSize: 22, fontWeight: "700", flex: 1, color: colores?.texto },
    ayuda: { fontSize: 14, color: colores?.secundario ?? "#666" },
    entrada: {
      borderWidth: 1,
      borderColor: colores?.borde ?? "#CCC",
      borderRadius: 10,
      padding: 14,
      fontSize: 16,
      minHeight: 120,
      textAlignVertical: "top",
      color: colores?.texto,
    },
    contador: { fontSize: 12, color: colores?.secundario ?? "#888", textAlign: "right" },
    error: { color: "#B3261E", fontWeight: "600" },
    botones: { flexDirection: "row", gap: 12, marginTop: 12 },
    botonEnviar: {
      flex: 1,
      backgroundColor: colores?.primario ?? "#222",
      borderRadius: 10,
      paddingVertical: 14,
      alignItems: "center",
    },
    botonDeshabilitado: { opacity: 0.6 },
    textoEnviar: { color: "#FFF", fontWeight: "600", fontSize: 16 },
    botonCancelar: {
      flex: 1,
      borderWidth: 1,
      borderColor: colores?.borde ?? "#CCC",
      borderRadius: 10,
      paddingVertical: 14,
      alignItems: "center",
    },
    textoCancelar: { fontSize: 16, color: colores?.texto },
  });
}
