import Ionicons from "@react-native-vector-icons/ionicons";
import { Tabs } from "expo-router";

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerTitleAlign: "center",
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Comercios",
          tabBarIcon: ({ color }) => (
            <Ionicons name="storefront-outline" size={22} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="promociones"
        options={{
          title: "Promos",
          tabBarIcon: ({ color }) => (
            <Ionicons name="pricetag-outline" size={22} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="mapa"
        options={{
          title: "Mapa",
          tabBarIcon: ({ color }) => (
            <Ionicons name="map-outline" size={22} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="perfil"
        options={{
          title: "Yo",
          tabBarIcon: ({ color }) => (
            <Ionicons name="person-outline" size={22} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
