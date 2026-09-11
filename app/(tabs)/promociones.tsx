import { Link } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";

export default function PromocionesScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Promociones</Text>

      <Text style={styles.subtitle}>
        Consultá las promociones disponibles en los comercios.
      </Text>

      <Link href="/promocion/pro-001" asChild>
        <Pressable style={styles.card}>
          <Text style={styles.cardTitle}>20% de descuento</Text>

          <Text style={styles.cardText}>Promoción de prueba</Text>

          <Text style={styles.linkText}>Ver promoción</Text>
        </Pressable>
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    gap: 16,
  },

  title: {
    fontSize: 26,
    fontWeight: "700",
  },

  subtitle: {
    fontSize: 16,
  },

  card: {
    padding: 18,
    borderWidth: 1,
    borderRadius: 12,
    gap: 6,
  },

  cardTitle: {
    fontSize: 18,
    fontWeight: "600",
  },

  cardText: {
    fontSize: 14,
  },

  linkText: {
    marginTop: 8,
    fontWeight: "600",
  },
});
