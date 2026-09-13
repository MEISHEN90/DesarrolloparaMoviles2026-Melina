import * as LocalAuthentication from "expo-local-authentication";

export async function biometriaDisponible(): Promise<boolean> {
  const tieneHardware = await LocalAuthentication.hasHardwareAsync();

  const tieneBiometriaRegistrada = await LocalAuthentication.isEnrolledAsync();

  return tieneHardware && tieneBiometriaRegistrada;
}

export async function autenticarConBiometria(): Promise<boolean> {
  const disponible = await biometriaDisponible();

  if (!disponible) {
    return false;
  }

  const resultado = await LocalAuthentication.authenticateAsync({
    promptMessage: "Confirmá tu identidad",
    cancelLabel: "Cancelar",
    fallbackLabel: "Usar método del dispositivo",
  });

  return resultado.success;
}
