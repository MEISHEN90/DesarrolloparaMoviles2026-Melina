import { Stack, useLocalSearchParams } from "expo-router";
import { StyleSheet, Text, View } from "react-native";

export default function ComercioDetalleScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  return (
    <>
      <Stack.Screen
        options={{
          title: "Detalle del comercio",
        }}
      />

      <View style={styles.container}>
        <Text style={styles.title}>Comercio</Text>

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
