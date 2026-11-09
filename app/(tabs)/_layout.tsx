import Ionicons from "@react-native-vector-icons/ionicons";
import { Tabs } from "expo-router";

import { useTema } from "../../src/contexto/tema";

export default function TabsLayout() {
  const { colores } = useTema();

  return (
    <Tabs
      screenOptions={{
        headerTitleAlign: "center",
        headerStyle: {
          backgroundColor: colores.tarjeta,
        },
        headerTintColor: colores.texto,
        tabBarStyle: {
          backgroundColor: colores.tarjeta,
          borderTopColor: colores.borde,
        },
        tabBarActiveTintColor: colores.primario,
        tabBarInactiveTintColor: colores.secundario,
        sceneStyle: {
          backgroundColor: colores.fondo,
        },
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
