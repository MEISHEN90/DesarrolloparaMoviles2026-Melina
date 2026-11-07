import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { useTema } from "../../src/contexto/tema";
import { obtenerUsuarioActual } from "../../src/servicios/autenticacion";
import {
  autenticarConBiometria,
  biometriaDisponible,
} from "../../src/servicios/biometria";
import { PreferenciaTema } from "../../src/servicios/preferencias";
import {
  cerrarSesion,
  estaSesionDesbloqueada,
  marcarSesionDesbloqueada,
  obtenerUsuarioSesionId,
} from "../../src/servicios/sesion";
import { Usuario } from "../../src/tipos/modelos";

function AccesoHerramienta({
  icono,
  titulo,
  descripcion,
  onPress,
}: {
  icono: keyof typeof Ionicons.glyphMap;
  titulo: string;
  descripcion: string;
  onPress: () => void;
}) {
  const { colores } = useTema();
  const styles = useMemo(() => crearEstilos(colores), [colores]);

  return (
    <Pressable
      onPress={onPress}
      style={styles.acceso}
      accessibilityRole="button"
      accessibilityLabel={titulo}
    >
      <View style={styles.accesoIcono}>
        <Ionicons name={icono} size={22} color={colores.primario} />
      </View>

      <View style={styles.accesoTexto}>
        <Text style={styles.accesoTitulo}>{titulo}</Text>
        <Text style={styles.accesoDescripcion}>{descripcion}</Text>
      </View>

      <Ionicons name="chevron-forward" size={20} color={colores.secundario} />
    </Pressable>
  );
}

function SelectorTema({
  valor,
  seleccionado,
  etiqueta,
  icono,
  onPress,
}: {
  valor: PreferenciaTema;
  seleccionado: boolean;
  etiqueta: string;
  icono: keyof typeof Ionicons.glyphMap;
  onPress: (valor: PreferenciaTema) => void;
}) {
  const { colores } = useTema();
  const styles = useMemo(() => crearEstilos(colores), [colores]);

  return (
    <Pressable
      onPress={() => onPress(valor)}
      style={[
        styles.opcionTema,
        seleccionado && styles.opcionTemaSeleccionada,
      ]}
      accessibilityRole="radio"
      accessibilityState={{ selected: seleccionado }}
    >
      <Ionicons
        name={icono}
        size={18}
        color={seleccionado ? "#FFFFFF" : colores.primario}
      />
      <Text
        style={[
          styles.opcionTemaTexto,
          seleccionado && styles.opcionTemaTextoSeleccionado,
        ]}
      >
        {etiqueta}
      </Text>
    </Pressable>
  );
}

export default function PerfilScreen() {
  const { preferencia, cambiarTema, colores } = useTema();
  const styles = useMemo(() => crearEstilos(colores), [colores]);
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [cargando, setCargando] = useState(true);
  const [requiereBiometria, setRequiereBiometria] = useState(false);
  const [autenticando, setAutenticando] = useState(false);
  const [usuarioSesionId, setUsuarioSesionId] = useState<string | null>(null);

  const cargarUsuario = useCallback(async () => {
    const usuarioActual = await obtenerUsuarioActual();
    setUsuario(usuarioActual);
  }, []);

  const verificarSesion = useCallback(async () => {
    try {
      setCargando(true);
      setUsuario(null);
      setRequiereBiometria(false);

      const usuarioId = await obtenerUsuarioSesionId();
      setUsuarioSesionId(usuarioId);

      if (!usuarioId) return;

      if (estaSesionDesbloqueada()) {
        await cargarUsuario();
        return;
      }

      const disponible = await biometriaDisponible();

      if (!disponible) {
        await cargarUsuario();
        return;
      }

      setRequiereBiometria(true);
    } finally {
      setCargando(false);
    }
  }, [cargarUsuario]);

  useFocusEffect(
    useCallback(() => {
      verificarSesion();
    }, [verificarSesion]),
  );

  async function manejarBiometria() {
    if (!usuarioSesionId) return;

    try {
      setAutenticando(true);

      const autenticado = await autenticarConBiometria();

      if (!autenticado) return;

      marcarSesionDesbloqueada();
      await cargarUsuario();
      setRequiereBiometria(false);
    } finally {
      setAutenticando(false);
    }
  }

  async function manejarCerrarSesion() {
    await cerrarSesion();
    setUsuario(null);
    setUsuarioSesionId(null);
    setRequiereBiometria(false);
  }

  function seleccionarTema(valor: PreferenciaTema) {
    void cambiarTema(valor);
  }

  if (cargando) {
    return (
      <View style={styles.estadoContainer}>
        <ActivityIndicator size="large" color={colores.primario} />
        <Text style={styles.estadoTitulo}>Verificando sesión</Text>
        <Text style={styles.estadoTexto}>
          Estamos preparando los datos de tu cuenta.
        </Text>
      </View>
    );
  }

  if (usuarioSesionId && requiereBiometria && !usuario) {
    return (
      <View style={styles.estadoContainer}>
        <View style={styles.biometriaIcono}>
          <Ionicons name="finger-print-outline" size={34} color={colores.primario} />
        </View>

        <Text style={styles.estadoTitulo}>Confirmar identidad</Text>

        <Text style={styles.estadoTexto}>
          Tenés una sesión iniciada. Confirmá tu identidad para acceder a los
          datos de tu cuenta.
        </Text>

        <Pressable
          onPress={manejarBiometria}
          disabled={autenticando}
          style={[
            styles.botonPrincipal,
            styles.botonBiometria,
            autenticando && styles.botonDeshabilitado,
          ]}
          accessibilityRole="button"
          accessibilityLabel="Ingresar con biometría"
        >
          {autenticando ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <>
              <Ionicons name="finger-print-outline" size={20} color="#FFFFFF" />
              <Text style={styles.botonPrincipalTexto}>
                Ingresar con biometría
              </Text>
            </>
          )}
        </Pressable>

        <Pressable
          onPress={manejarCerrarSesion}
          style={styles.botonTextoPlano}
          accessibilityRole="button"
        >
          <Text style={styles.botonTextoPlanoPeligro}>Cerrar sesión</Text>
        </Pressable>
      </View>
    );
  }

  if (!usuario) {
    return (
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.bienvenida}>
          <View style={styles.avatarGrande}>
            <Ionicons name="person-outline" size={34} color={colores.primario} />
          </View>

          <Text style={styles.title}>Mi perfil</Text>

          <Text style={styles.descripcionCentrada}>
            Consultá comercios y promociones sin iniciar sesión. Ingresá para
            acceder a favoritos, reseñas y beneficios asociados a tu cuenta.
          </Text>

          <Pressable
            onPress={() => router.push("/login")}
            style={styles.botonPrincipal}
            accessibilityRole="button"
            accessibilityLabel="Iniciar sesión"
          >
            <Ionicons name="log-in-outline" size={20} color="#FFFFFF" />
            <Text style={styles.botonPrincipalTexto}>Iniciar sesión</Text>
          </Pressable>
        </View>

        <Configuracion
          preferencia={preferencia}
          seleccionarTema={seleccionarTema}
        />
      </ScrollView>
    );
  }

  const esComercio = usuario.rol === "comercio";

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.perfilCard}>
        <View style={styles.perfilSuperior}>
          <View style={styles.avatarGrande}>
            <Ionicons
              name={esComercio ? "storefront-outline" : "person-outline"}
              size={32}
              color={colores.primario}
            />
          </View>

          <View style={styles.perfilDatos}>
            <Text style={styles.title}>{usuario.nombre}</Text>
            <Text style={styles.correo}>{usuario.email}</Text>

            <View
              style={[
                styles.rolChip,
                esComercio ? styles.rolComercio : styles.rolVecino,
              ]}
            >
              <Ionicons
                name={esComercio ? "storefront-outline" : "home-outline"}
                size={14}
                color={esComercio ? colores.primarioOscuro : colores.vecino}
              />
              <Text
                style={[
                  styles.rolTexto,
                  esComercio ? styles.rolTextoComercio : styles.rolTextoVecino,
                ]}
              >
                {esComercio ? "Cuenta comercio" : "Cuenta vecino"}
              </Text>
            </View>
          </View>
        </View>
      </View>

      {esComercio ? (
        <View style={styles.tarjeta}>
          <View style={styles.seccionEncabezado}>
            <View style={styles.seccionIcono}>
              <Ionicons name="construct-outline" size={19} color={colores.primario} />
            </View>
            <View style={styles.seccionTituloBloque}>
              <Text style={styles.seccionTitulo}>Herramientas del comercio</Text>
              <Text style={styles.seccionSubtitulo}>
                Administrá la información pública y las operaciones de tu local.
              </Text>
            </View>
          </View>

          <View style={styles.accesosLista}>
            <AccesoHerramienta
              icono="create-outline"
              titulo="Editar datos del comercio"
              descripcion="Información general y horarios"
              onPress={() => router.push("/mi-comercio")}
            />
            <AccesoHerramienta
              icono="images-outline"
              titulo="Gestionar fotos y video"
              descripcion="Contenido multimedia de la ficha pública"
              onPress={() => router.push("/imagen-comercio")}
            />
            <AccesoHerramienta
              icono="qr-code-outline"
              titulo="Escanear código QR"
              descripcion="Registrar el uso de una promoción"
              onPress={() => router.push("/escanear-qr")}
            />
          </View>
        </View>
      ) : (
        <View style={styles.tarjeta}>
          <View style={styles.seccionEncabezado}>
            <View style={styles.seccionIcono}>
              <Ionicons name="heart-outline" size={19} color={colores.primario} />
            </View>
            <View style={styles.seccionTituloBloque}>
              <Text style={styles.seccionTitulo}>Tu cuenta</Text>
              <Text style={styles.seccionSubtitulo}>
                Tus favoritos, reseñas y promociones están asociados a esta
                cuenta.
              </Text>
            </View>
          </View>
        </View>
      )}

      <Configuracion
        preferencia={preferencia}
        seleccionarTema={seleccionarTema}
      />

      <Pressable
        onPress={manejarCerrarSesion}
        style={styles.botonCerrarSesion}
        accessibilityRole="button"
        accessibilityLabel="Cerrar sesión"
      >
        <Ionicons name="log-out-outline" size={19} color={colores.peligro} />
        <Text style={styles.botonCerrarSesionTexto}>Cerrar sesión</Text>
      </Pressable>
    </ScrollView>
  );
}

function Configuracion({
  preferencia,
  seleccionarTema,
}: {
  preferencia: PreferenciaTema;
  seleccionarTema: (valor: PreferenciaTema) => void;
}) {
  const { colores } = useTema();
  const styles = useMemo(() => crearEstilos(colores), [colores]);

  return (
    <View style={styles.tarjeta}>
      <View style={styles.seccionEncabezado}>
        <View style={styles.seccionIcono}>
          <Ionicons name="settings-outline" size={19} color={colores.primario} />
        </View>
        <View style={styles.seccionTituloBloque}>
          <Text style={styles.seccionTitulo}>Configuración</Text>
          <Text style={styles.seccionSubtitulo}>
            Preferencias generales de la aplicación.
          </Text>
        </View>
      </View>

      <Text style={styles.preferenciaTitulo}>Apariencia</Text>
      <View style={styles.selectorTema}>
        <SelectorTema
          valor="system"
          seleccionado={preferencia === "system"}
          etiqueta="Sistema"
          icono="phone-portrait-outline"
          onPress={seleccionarTema}
        />
        <SelectorTema
          valor="light"
          seleccionado={preferencia === "light"}
          etiqueta="Claro"
          icono="sunny-outline"
          onPress={seleccionarTema}
        />
        <SelectorTema
          valor="dark"
          seleccionado={preferencia === "dark"}
          etiqueta="Oscuro"
          icono="moon-outline"
          onPress={seleccionarTema}
        />
      </View>
    </View>
  );
}

function crearEstilos(colores: ReturnType<typeof useTema>["colores"]) {
  return StyleSheet.create({
    scroll: { flex: 1, backgroundColor: colores.fondo },
    container: { padding: 18, paddingBottom: 34, gap: 14 },
    estadoContainer: {
      flex: 1,
      backgroundColor: colores.fondo,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 30,
    },
    estadoTitulo: {
      fontSize: 22,
      fontWeight: "800",
      color: colores.texto,
      textAlign: "center",
      marginTop: 14,
    },
    estadoTexto: {
      fontSize: 15,
      lineHeight: 21,
      color: colores.secundario,
      textAlign: "center",
      marginTop: 7,
    },
    biometriaIcono: {
      width: 72,
      height: 72,
      borderRadius: 36,
      backgroundColor: colores.comercioFondo,
      alignItems: "center",
      justifyContent: "center",
    },
    bienvenida: {
      backgroundColor: colores.tarjeta,
      borderWidth: 1,
      borderColor: colores.borde,
      borderRadius: 20,
      padding: 22,
      alignItems: "center",
    },
    avatarGrande: {
      width: 64,
      height: 64,
      borderRadius: 32,
      backgroundColor: colores.comercioFondo,
      alignItems: "center",
      justifyContent: "center",
    },
    title: {
      fontSize: 25,
      fontWeight: "800",
      color: colores.texto,
      letterSpacing: -0.3,
    },
    descripcionCentrada: {
      fontSize: 15,
      lineHeight: 22,
      color: colores.secundario,
      textAlign: "center",
      marginTop: 10,
    },
    botonPrincipal: {
      minHeight: 48,
      backgroundColor: colores.primario,
      borderRadius: 13,
      paddingHorizontal: 20,
      paddingVertical: 12,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      marginTop: 18,
    },
    botonBiometria: { width: "100%" },
    botonPrincipalTexto: { color: "#FFFFFF", fontSize: 15, fontWeight: "700" },
    botonDeshabilitado: { opacity: 0.6 },
    botonTextoPlano: { marginTop: 10, paddingVertical: 10, paddingHorizontal: 16 },
    botonTextoPlanoPeligro: { color: colores.peligro, fontSize: 15, fontWeight: "700" },
    perfilCard: {
      backgroundColor: colores.tarjeta,
      borderWidth: 1,
      borderColor: colores.borde,
      borderRadius: 20,
      padding: 18,
    },
    perfilSuperior: { flexDirection: "row", alignItems: "center", gap: 14 },
    perfilDatos: { flex: 1 },
    correo: { fontSize: 14, color: colores.secundario, marginTop: 3 },
    rolChip: {
      alignSelf: "flex-start",
      flexDirection: "row",
      alignItems: "center",
      gap: 5,
      borderRadius: 999,
      paddingHorizontal: 9,
      paddingVertical: 5,
      marginTop: 10,
    },
    rolComercio: { backgroundColor: colores.comercioFondo },
    rolVecino: { backgroundColor: colores.vecinoFondo },
    rolTexto: { fontSize: 12, fontWeight: "700" },
    rolTextoComercio: { color: colores.primarioOscuro },
    rolTextoVecino: { color: colores.vecino },
    tarjeta: {
      backgroundColor: colores.tarjeta,
      borderWidth: 1,
      borderColor: colores.borde,
      borderRadius: 18,
      padding: 16,
    },
    seccionEncabezado: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
    seccionIcono: {
      width: 34,
      height: 34,
      borderRadius: 10,
      backgroundColor: colores.comercioFondo,
      alignItems: "center",
      justifyContent: "center",
    },
    seccionTituloBloque: { flex: 1 },
    seccionTitulo: { fontSize: 18, fontWeight: "800", color: colores.texto },
    seccionSubtitulo: {
      fontSize: 13,
      lineHeight: 18,
      color: colores.secundario,
      marginTop: 3,
    },
    accesosLista: { marginTop: 14, gap: 9 },
    acceso: {
      minHeight: 70,
      flexDirection: "row",
      alignItems: "center",
      gap: 11,
      backgroundColor: colores.superficie,
      borderRadius: 14,
      padding: 12,
    },
    accesoIcono: {
      width: 42,
      height: 42,
      borderRadius: 12,
      backgroundColor: colores.comercioFondo,
      alignItems: "center",
      justifyContent: "center",
    },
    accesoTexto: { flex: 1 },
    accesoTitulo: { fontSize: 15, fontWeight: "700", color: colores.texto },
    accesoDescripcion: {
      fontSize: 12,
      lineHeight: 17,
      color: colores.secundario,
      marginTop: 2,
    },
    preferenciaTitulo: {
      fontSize: 14,
      fontWeight: "700",
      color: colores.texto,
      marginTop: 14,
    },
    selectorTema: { flexDirection: "row", gap: 8, marginTop: 10 },
    opcionTema: {
      flex: 1,
      minHeight: 44,
      borderWidth: 1,
      borderColor: colores.borde,
      borderRadius: 12,
      alignItems: "center",
      justifyContent: "center",
      gap: 4,
      backgroundColor: colores.superficie,
    },
    opcionTemaSeleccionada: {
      backgroundColor: colores.primario,
      borderColor: colores.primario,
    },
    opcionTemaTexto: { fontSize: 12, fontWeight: "700", color: colores.primario },
    opcionTemaTextoSeleccionado: { color: "#FFFFFF" },
    botonCerrarSesion: {
      minHeight: 48,
      borderWidth: 1,
      borderColor: colores.peligro,
      backgroundColor: colores.peligroFondo,
      borderRadius: 13,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      paddingHorizontal: 16,
    },
    botonCerrarSesionTexto: { color: colores.peligro, fontSize: 15, fontWeight: "700" },
  });
}
