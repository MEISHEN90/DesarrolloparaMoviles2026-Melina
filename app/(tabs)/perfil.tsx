import { StyleSheet, Text, View } from "react-native";

export default function PerfilScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Mi perfil</Text>

      <Text style={styles.text}>
        El acceso y la autenticación se incorporarán en una etapa posterior.
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
