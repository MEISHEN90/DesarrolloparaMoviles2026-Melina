import { StyleSheet, Text, View } from "react-native";

export default function MapaScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Mapa</Text>

      <Text style={styles.text}>
        Próximamente se mostrarán aquí los comercios cercanos.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },

  title: {
    fontSize: 26,
    fontWeight: "700",
    marginBottom: 12,
  },

  text: {
    fontSize: 16,
  },
});
