import { Stack, useLocalSearchParams } from "expo-router";
import { StyleSheet, Text, View } from "react-native";

export default function PromocionDetalleScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  return (
    <>
      <Stack.Screen
        options={{
          title: "Detalle de promoción",
        }}
      />

      <View style={styles.container}>
        <Text style={styles.title}>Promoción</Text>

        <Text style={styles.text}>ID recibido: {id}</Text>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },

  title: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 12,
  },

  text: {
    fontSize: 16,
  },
});
