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
import { Resena } from "../../tipos/modelos";
import { validarResena } from "../../utils/resenas";

interface PropsFormularioResena {
  visible: boolean;
  resenaExistente?: Resena | null;
  cerradoHacePoco?: boolean;
  /** Paleta del tema activo; sin ella el formulario usa su aspecto original. */
  colores?: ColoresTema;
  onGuardar: (estrellas: 1 | 2 | 3 | 4 | 5, comentario: string) => Promise<void>;
  onCancelar: () => void;
}

const MAX_COMENTARIO = 1000;

export function FormularioResena({
  visible,
  resenaExistente,
  cerradoHacePoco = false,
  colores,
  onGuardar,
  onCancelar,
}: PropsFormularioResena) {
  const estilos = useMemo(() => crearEstilos(colores), [colores]);
  const [estrellas, setEstrellas] = useState<1 | 2 | 3 | 4 | 5>(
    resenaExistente?.estrellas ?? 5,
  );
  const [comentario, setComentario] = useState(resenaExistente?.comentario ?? "");
  const [error, setError] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);

  /*
   * El modal vive montado aunque esté cerrado, así que el estado inicial del
   * useState no alcanza: cada vez que se abre, sincronizamos con la reseña
   * a editar (o vacíamos el formulario si es una nueva).
   */
  useEffect(() => {
    if (visible) {
      setEstrellas(resenaExistente?.estrellas ?? 5);
      setComentario(resenaExistente?.comentario ?? "");
      setError(null);
    }
  }, [visible, resenaExistente]);

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
      <View style={estilos.contenedor}>
        <Text style={estilos.titulo}>
          {resenaExistente ? "Editar mi reseña" : "Escribir una reseña"}
        </Text>

        {cerradoHacePoco && (
          <Text style={estilos.aviso}>
            Escribís una reseña que quedó pendiente: se va a subir cuando haya
            conexión.
          </Text>
        )}

        <Text style={estilos.etiqueta}>¿Cuántas estrellas le das?</Text>

        <View style={estilos.estrellasFila}>
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
                color={
                  estrella <= estrellas
                    ? colores?.estrellas ?? "#E8A33D"
                    : colores?.borde ?? "#999"
                }
              />
            </Pressable>
          ))}
        </View>

        <Text style={estilos.etiqueta}>Tu comentario</Text>

        <TextInput
          value={comentario}
          onChangeText={(texto) => {
            setComentario(texto);
            setError(null);
          }}
          placeholder="Contá cómo te atendieron…"
          placeholderTextColor={colores?.secundario}
          multiline
          maxLength={MAX_COMENTARIO}
          style={estilos.entrada}
          accessibilityLabel="Comentario de la reseña"
        />

        <Text style={estilos.contador}>{comentario.length}/{MAX_COMENTARIO}</Text>

        {error ? <Text style={estilos.error}>{error}</Text> : null}

        <View style={estilos.botones}>
          <Pressable onPress={onCancelar} style={estilos.botonCancelar} disabled={guardando}>
            <Text style={estilos.textoCancelar}>Cancelar</Text>
          </Pressable>

          <Pressable
            onPress={guardar}
            style={[estilos.botonGuardar, guardando && estilos.botonDeshabilitado]}
            disabled={guardando}
            accessibilityRole="button"
            accessibilityLabel="Guardar reseña"
          >
            <Text style={estilos.textoGuardar}>
              {guardando ? "Guardando…" : "Guardar"}
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
    titulo: { fontSize: 24, fontWeight: "700", marginBottom: 8, color: colores?.texto },
    aviso: { fontSize: 14, color: "#8A6D1F", backgroundColor: "#FFF6DE", borderRadius: 10, padding: 12 },
    etiqueta: { fontSize: 16, fontWeight: "600", color: colores?.texto },
    estrellasFila: { flexDirection: "row", gap: 8 },
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
    botonGuardar: {
      flex: 1,
      backgroundColor: colores?.primario ?? "#222",
      borderRadius: 10,
      paddingVertical: 14,
      alignItems: "center",
    },
    botonDeshabilitado: { opacity: 0.6 },
    textoGuardar: { color: "#FFF", fontWeight: "600", fontSize: 16 },
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
