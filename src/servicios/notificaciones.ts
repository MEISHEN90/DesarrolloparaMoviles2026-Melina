import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export async function configurarNotificaciones(): Promise<void> {
  const permisosActuales = await Notifications.getPermissionsAsync();

  let estadoFinal = permisosActuales.status;

  if (estadoFinal !== "granted") {
    const nuevosPermisos = await Notifications.requestPermissionsAsync();

    estadoFinal = nuevosPermisos.status;
  }

  if (estadoFinal !== "granted") {
    return;
  }

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("promociones", {
      name: "Promociones",
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }
}

export async function notificarPromocionRegistrada(
  tituloPromocion: string,
  nombreCliente: string,
): Promise<void> {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: "Promoción registrada",
      body: `${tituloPromocion} fue registrada para ${nombreCliente}.`,
      sound: true,
    },
    trigger: null,
  });
}
