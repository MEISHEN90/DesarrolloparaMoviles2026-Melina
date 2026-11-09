import { Ionicons } from "@expo/vector-icons";
import { useEffect, useMemo, useState } from "react";
import {
  Modal,
  Pressable,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";

import { ColoresTema } from "../../contexto/tema";
import { Promocion } from "../../tipos/modelos";
import {
  armarCuerpoPromocion,
  BorradorPromocion,
  CuerpoPromocionComercio,
  parteFechaIso,
  validarBorradorPromocion,
} from "../../utils/promociones";

interface PropsFormularioPromocion {
  visible: boolean;
  /** Promo a editar; null o undefined = alta. */
  promocionExistente?: Promocion | null;
  colores?: ColoresTema;
  onGuardar: (cuerpo: CuerpoPromocionComercio) => Promise<void>;
  onCancelar: () => void;
}

export function FormularioPromocion({
  visible,
  promocionExistente,
  colores,
  onGuardar,
  onCancelar,
}: PropsFormularioPromocion) {
  const estilos = useMemo(() => crearEstilos(colores), [colores]);
  const [borrador, setBorrador] = useState<BorradorPromocion>({
    titulo: "",
    detalle: "",
    descuentoTexto: "",
    desdeTexto: "",
    hastaTexto: "",
    soloApp: false,
  });
  const [error, setError] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);

  /*
   * El modal vive montado aunque esté cerrado: cada vez que se abre,
   * sincronizamos con la promo a editar (o vaciamos para el alta).
   */
  useEffect(() => {
    if (visible) {
      setBorrador({
        titulo: promocionExistente?.titulo ?? "",
        detalle: promocionExistente?.detalle ?? "",
        descuentoTexto:
          promocionExistente?.descuento != null
            ? String(promocionExistente.descuento)
            : "",
        desdeTexto: promocionExistente
          ? parteFechaIso(promocionExistente.desde)
          : "",
        hastaTexto: promocionExistente
          ? parteFechaIso(promocionExistente.hasta)
          : "",
        soloApp: promocionExistente?.soloApp ?? false,
      });
      setError(null);
    }
  }, [visible, promocionExistente]);

  function cambiar(cambios: Partial<BorradorPromocion>) {
    setBorrador((previo) => ({ ...previo, ...cambios }));
    setError(null);
  }

  async function guardar() {
    const errorDeValidacion = validarBorradorPromocion(borrador, new Date());

    if (errorDeValidacion) {
      setError(errorDeValidacion);
      return;
    }

    try {
      setGuardando(true);
      setError(null);
      await onGuardar(armarCuerpoPromocion(borrador));
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo guardar la promoción.");
    } finally {
      setGuardando(false);
    }
  }

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onCancelar}>
      <View style={estilos.contenedor}>
        <Text style={estilos.titulo}>
          {promocionExistente
            ? "Editar promoción"
            : "Nueva promoción"}
        </Text>

        <Text style={estilos.etiqueta}>Título</Text>
        <TextInput
          value={borrador.titulo}
          onChangeText={(titulo) => cambiar({ titulo })}
          placeholder="15% en pinturas"
          placeholderTextColor={colores?.secundario}
          maxLength={120}
          style={estilos.entrada}
          accessibilityLabel="Título de la promoción"
        />

        <Text style={estilos.etiqueta}>Detalle y condiciones</Text>
        <TextInput
          value={borrador.detalle}
          onChangeText={(detalle) => cambiar({ detalle })}
          placeholder="Válido en pinturas de todas las marcas."
          placeholderTextColor={colores?.secundario}
          multiline
          maxLength={2000}
          style={[estilos.entrada, estilos.entradaAlta]}
          accessibilityLabel="Detalle de la promoción"
        />

        <View style={estilos.fila}>
          <View style={estilos.filaMitad}>
            <Text style={estilos.etiqueta}>Descuento % (opcional)</Text>
            <TextInput
              value={borrador.descuentoTexto}
              onChangeText={(descuentoTexto) => cambiar({ descuentoTexto })}
              placeholder="15"
              placeholderTextColor={colores?.secundario}
              keyboardType="number-pad"
              style={estilos.entrada}
              accessibilityLabel="Porcentaje de descuento"
            />
          </View>

          <View style={estilos.filaMitad}>
            <Text style={estilos.etiqueta}>Termina (AAAA-MM-DD)</Text>
            <TextInput
              value={borrador.hastaTexto}
              onChangeText={(hastaTexto) => cambiar({ hastaTexto })}
              placeholder="2026-11-30"
              placeholderTextColor={colores?.secundario}
              autoCapitalize="none"
              style={estilos.entrada}
              accessibilityLabel="Fecha de fin de la promoción"
            />
          </View>
        </View>

        <Text style={estilos.etiqueta}>Arranca (AAAA-MM-DD, opcional)</Text>
        <TextInput
          value={borrador.desdeTexto}
          onChangeText={(desdeTexto) => cambiar({ desdeTexto })}
          placeholder="Hoy, si lo dejás vacío"
          placeholderTextColor={colores?.secundario}
          autoCapitalize="none"
          style={estilos.entrada}
          accessibilityLabel="Fecha de inicio de la promoción"
        />

        <View style={estilos.filaInterruptor}>
          <View style={estilos.interruptorTextoBloque}>
            <Text style={estilos.etiqueta}>Sólo con la app</Text>
            <Text style={estilos.ayuda}>
              El vecino genera un código y el comercio lo valida en el
              mostrador.
            </Text>
          </View>
          <Switch
            value={borrador.soloApp}
            onValueChange={(soloApp) => cambiar({ soloApp })}
            accessibilityLabel="Promoción sólo con la app"
          />
        </View>

        {error ? <Text style={estilos.error}>{error}</Text> : null}

        <View style={estilos.botones}>
          <Pressable
            onPress={onCancelar}
            style={estilos.botonCancelar}
            disabled={guardando}
          >
            <Text style={estilos.textoCancelar}>Cancelar</Text>
          </Pressable>

          <Pressable
            onPress={guardar}
            style={[estilos.botonGuardar, guardando && estilos.botonDeshabilitado]}
            disabled={guardando}
            accessibilityRole="button"
            accessibilityLabel="Guardar promoción"
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
    titulo: { fontSize: 24, fontWeight: "700", marginBottom: 4, color: colores?.texto },
    etiqueta: { fontSize: 15, fontWeight: "600", color: colores?.texto },
    entrada: {
      borderWidth: 1,
      borderColor: colores?.borde ?? "#CCC",
      borderRadius: 10,
      padding: 12,
      fontSize: 15,
      color: colores?.texto,
    },
    entradaAlta: { minHeight: 90, textAlignVertical: "top" },
    fila: { flexDirection: "row", gap: 12 },
    filaMitad: { flex: 1, gap: 12 },
    filaInterruptor: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      padding: 12,
      borderWidth: 1,
      borderColor: colores?.borde ?? "#CCC",
      borderRadius: 10,
    },
    interruptorTextoBloque: { flex: 1, gap: 4 },
    ayuda: { fontSize: 13, lineHeight: 18, color: colores?.secundario ?? "#666" },
    error: { color: "#B3261E", fontWeight: "600" },
    botones: { flexDirection: "row", gap: 12, marginTop: 8 },
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
