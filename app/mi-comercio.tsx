import { Stack } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import {
  actualizarMiComercio,
  obtenerMiComercio,
} from "../src/servicios/mi-comercio";
import { Horario } from "../src/tipos/modelos";

const nombresDias = [
  "Domingo",
  "Lunes",
  "Martes",
  "Miércoles",
  "Jueves",
  "Viernes",
  "Sábado",
];

function vacioANull(valor: string): string | null {
  const limpio = valor.trim();
  return limpio.length === 0 ? null : limpio;
}

function horaValida(valor: string): boolean {
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(valor);
}

export default function MiComercioScreen() {
  const [nombre, setNombre] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [direccion, setDireccion] = useState("");
  const [telefono, setTelefono] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [instagram, setInstagram] = useState("");
  const [horarios, setHorarios] = useState<Horario[]>([]);

  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mensaje, setMensaje] = useState<string | null>(null);

  useEffect(() => {
    async function cargar() {
      try {
        setCargando(true);
        setError(null);

        const comercio = await obtenerMiComercio();

        setNombre(comercio.nombre);
        setDescripcion(comercio.descripcion);
        setDireccion(comercio.direccion);
        setTelefono(comercio.telefono ?? "");
        setWhatsapp(comercio.whatsapp ?? "");
        setInstagram(comercio.instagram ?? "");
        setHorarios(comercio.horarios);
      } catch (errorDesconocido) {
        setError(
          errorDesconocido instanceof Error
            ? errorDesconocido.message
            : "No fue posible cargar los datos del comercio.",
        );
      } finally {
        setCargando(false);
      }
    }

    cargar();
  }, []);

  function actualizarHorario(
    indice: number,
    campo: "abre" | "cierra",
    valor: string,
  ) {
    setHorarios((actuales) =>
      actuales.map((horario, posicion) =>
        posicion === indice ? { ...horario, [campo]: valor } : horario,
      ),
    );
  }

  function quitarHorario(indice: number) {
    setHorarios((actuales) =>
      actuales.filter((_, posicion) => posicion !== indice),
    );
  }

  function agregarHorario(dia: Horario["dia"]) {
    setHorarios((actuales) => [
      ...actuales,
      {
        dia,
        abre: "08:00",
        cierra: "12:00",
      },
    ]);
  }

  async function guardar() {
    if (!nombre.trim() || !descripcion.trim() || !direccion.trim()) {
      setError("Nombre, descripción y dirección son obligatorios.");
      return;
    }

    const horarioInvalido = horarios.find(
      (horario) =>
        !horaValida(horario.abre) ||
        !horaValida(horario.cierra) ||
        horario.abre >= horario.cierra,
    );

    if (horarioInvalido) {
      setError(
        "Revisá los horarios. Deben usar formato HH:MM y la apertura debe ser anterior al cierre.",
      );
      return;
    }

    try {
      setGuardando(true);
      setError(null);
      setMensaje(null);

      const actualizado = await actualizarMiComercio({
        nombre: nombre.trim(),
        descripcion: descripcion.trim(),
        direccion: direccion.trim(),
        telefono: vacioANull(telefono),
        whatsapp: vacioANull(whatsapp),
        instagram: vacioANull(instagram),
        horarios,
      });

      setNombre(actualizado.nombre);
      setDescripcion(actualizado.descripcion);
      setDireccion(actualizado.direccion);
      setTelefono(actualizado.telefono ?? "");
      setWhatsapp(actualizado.whatsapp ?? "");
      setInstagram(actualizado.instagram ?? "");
      setHorarios(actualizado.horarios);

      setMensaje("Los datos y horarios se actualizaron correctamente.");
    } catch (errorDesconocido) {
      setError(
        errorDesconocido instanceof Error
          ? errorDesconocido.message
          : "No fue posible guardar los cambios.",
      );
    } finally {
      setGuardando(false);
    }
  }

  if (cargando) {
    return (
      <View style={styles.estado}>
        <ActivityIndicator size="large" />
        <Text>Cargando datos del comercio...</Text>
      </View>
    );
  }

  return (
    <>
      <Stack.Screen options={{ title: "Mi comercio" }} />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.title}>Editar mi comercio</Text>

        <Text style={styles.descripcion}>
          Estos datos son los que ven los vecinos en la ficha pública.
        </Text>

        <Text style={styles.seccionTitulo}>Datos generales</Text>

        <Text style={styles.label}>Nombre</Text>
        <TextInput
          value={nombre}
          onChangeText={setNombre}
          style={styles.input}
          accessibilityLabel="Nombre del comercio"
        />

        <Text style={styles.label}>Descripción</Text>
        <TextInput
          value={descripcion}
          onChangeText={setDescripcion}
          style={[styles.input, styles.area]}
          multiline
          textAlignVertical="top"
          accessibilityLabel="Descripción del comercio"
        />

        <Text style={styles.label}>Dirección</Text>
        <TextInput
          value={direccion}
          onChangeText={setDireccion}
          style={styles.input}
          accessibilityLabel="Dirección del comercio"
        />

        <Text style={styles.label}>Teléfono</Text>
        <TextInput
          value={telefono}
          onChangeText={setTelefono}
          style={styles.input}
          keyboardType="phone-pad"
          accessibilityLabel="Teléfono del comercio"
        />

        <Text style={styles.label}>WhatsApp</Text>
        <TextInput
          value={whatsapp}
          onChangeText={setWhatsapp}
          style={styles.input}
          keyboardType="phone-pad"
          accessibilityLabel="WhatsApp del comercio"
        />

        <Text style={styles.label}>Instagram</Text>
        <TextInput
          value={instagram}
          onChangeText={setInstagram}
          style={styles.input}
          autoCapitalize="none"
          accessibilityLabel="Instagram del comercio"
        />

        <View style={styles.separador} />

        <Text style={styles.seccionTitulo}>Horarios</Text>
        <Text style={styles.ayuda}>
          Cada fila representa una franja horaria. Los comercios con horario
          cortado pueden tener dos franjas en el mismo día.
        </Text>

        {([0, 1, 2, 3, 4, 5, 6] as Horario["dia"][]).map((dia) => {
          const franjas = horarios
            .map((horario, indice) => ({ horario, indice }))
            .filter(({ horario }) => horario.dia === dia);

          return (
            <View key={dia} style={styles.diaBloque}>
              <View style={styles.diaEncabezado}>
                <Text style={styles.diaNombre}>{nombresDias[dia]}</Text>

                <Pressable
                  onPress={() => agregarHorario(dia)}
                  style={styles.botonAgregar}
                  accessibilityRole="button"
                  accessibilityLabel={`Agregar horario para ${nombresDias[dia]}`}
                >
                  <Text style={styles.botonAgregarTexto}>+ Agregar franja</Text>
                </Pressable>
              </View>

              {franjas.length === 0 ? (
                <Text style={styles.cerradoTexto}>Cerrado</Text>
              ) : (
                franjas.map(({ horario, indice }) => (
                  <View key={`${dia}-${indice}`} style={styles.horarioFila}>
                    <TextInput
                      value={horario.abre}
                      onChangeText={(valor) =>
                        actualizarHorario(indice, "abre", valor)
                      }
                      style={[styles.input, styles.horaInput]}
                      placeholder="08:00"
                      maxLength={5}
                      keyboardType="numbers-and-punctuation"
                      accessibilityLabel={`Apertura ${nombresDias[dia]}`}
                    />

                    <Text style={styles.hasta}>a</Text>

                    <TextInput
                      value={horario.cierra}
                      onChangeText={(valor) =>
                        actualizarHorario(indice, "cierra", valor)
                      }
                      style={[styles.input, styles.horaInput]}
                      placeholder="12:00"
                      maxLength={5}
                      keyboardType="numbers-and-punctuation"
                      accessibilityLabel={`Cierre ${nombresDias[dia]}`}
                    />

                    <Pressable
                      onPress={() => quitarHorario(indice)}
                      style={styles.botonQuitar}
                      accessibilityRole="button"
                      accessibilityLabel={`Quitar horario de ${nombresDias[dia]}`}
                    >
                      <Text style={styles.botonQuitarTexto}>Quitar</Text>
                    </Pressable>
                  </View>
                ))
              )}
            </View>
          );
        })}

        {error ? <Text style={styles.error}>{error}</Text> : null}
        {mensaje ? <Text style={styles.mensaje}>{mensaje}</Text> : null}

        <Pressable
          onPress={guardar}
          disabled={guardando}
          style={[styles.boton, guardando && styles.botonDeshabilitado]}
          accessibilityRole="button"
          accessibilityLabel="Guardar cambios del comercio"
        >
          {guardando ? (
            <ActivityIndicator />
          ) : (
            <Text style={styles.botonTexto}>Guardar cambios</Text>
          )}
        </Pressable>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  container: { padding: 24, paddingBottom: 40 },
  estado: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    padding: 24,
  },
  title: { fontSize: 26, fontWeight: "700", marginBottom: 8 },
  descripcion: { fontSize: 15, lineHeight: 21, marginBottom: 18 },
  seccionTitulo: { fontSize: 20, fontWeight: "700", marginBottom: 8 },
  ayuda: { fontSize: 14, lineHeight: 20, marginBottom: 12 },
  label: {
    fontSize: 14,
    fontWeight: "700",
    marginTop: 12,
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
  },
  area: { minHeight: 110 },
  separador: { height: 1, backgroundColor: "#D0D0D0", marginVertical: 24 },
  diaBloque: { marginBottom: 18, gap: 8 },
  diaEncabezado: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  diaNombre: { fontSize: 16, fontWeight: "700" },
  botonAgregar: { paddingVertical: 6, paddingHorizontal: 8 },
  botonAgregarTexto: { fontSize: 13, fontWeight: "700" },
  cerradoTexto: { fontSize: 14, opacity: 0.65 },
  horarioFila: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexWrap: "wrap",
  },
  horaInput: { width: 86, paddingVertical: 9 },
  hasta: { fontSize: 14 },
  botonQuitar: { paddingVertical: 8, paddingHorizontal: 8 },
  botonQuitarTexto: { fontSize: 13, fontWeight: "600" },
  error: { marginTop: 16, fontSize: 14, fontWeight: "600" },
  mensaje: { marginTop: 16, fontSize: 14, fontWeight: "600" },
  boton: {
    marginTop: 24,
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center",
  },
  botonDeshabilitado: { opacity: 0.6 },
  botonTexto: { fontSize: 16, fontWeight: "700" },
});
