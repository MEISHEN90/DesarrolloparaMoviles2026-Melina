import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from "react";
import { useColorScheme } from "react-native";

import {
  guardarPreferenciaTema,
  obtenerPreferenciaTema,
  PreferenciaTema,
} from "../servicios/preferencias";

export type TemaEfectivo = "light" | "dark";

export interface ColoresTema {
  primario: string;
  primarioOscuro: string;
  fondo: string;
  tarjeta: string;
  superficie: string;
  borde: string;
  texto: string;
  secundario: string;
  peligro: string;
  peligroFondo: string;
  comercioFondo: string;
  vecinoFondo: string;
  vecino: string;
  abierto: string;
  abiertoFondo: string;
  cerrado: string;
  cerradoFondo: string;
  promo: string;
  promoFondo: string;
  aviso: string;
  avisoFondo: string;
  estrellas: string;
}

const coloresClaro: ColoresTema = {
  primario: "#2457A6",
  primarioOscuro: "#173A70",
  fondo: "#F5F7FA",
  tarjeta: "#FFFFFF",
  superficie: "#FAFBFC",
  borde: "#D9DEE7",
  texto: "#1B1D21",
  secundario: "#667085",
  peligro: "#B42318",
  peligroFondo: "#FDECEC",
  comercioFondo: "#EAF0F8",
  vecinoFondo: "#EAF7EE",
  vecino: "#2E7D32",
  abierto: "#2E7D32",
  abiertoFondo: "#EAF7EE",
  cerrado: "#B42318",
  cerradoFondo: "#FDECEC",
  promo: "#B54708",
  promoFondo: "#FFF4E5",
  aviso: "#8A4B00",
  avisoFondo: "#FFF4E5",
  estrellas: "#B7791F",
};

const coloresOscuro: ColoresTema = {
  primario: "#78A9FF",
  primarioOscuro: "#AFCBFF",
  fondo: "#0F1115",
  tarjeta: "#171A21",
  superficie: "#1E222B",
  borde: "#2B3240",
  texto: "#F5F7FA",
  secundario: "#AAB3C2",
  peligro: "#FF8A80",
  peligroFondo: "#351A1D",
  comercioFondo: "#1C2B42",
  vecinoFondo: "#173322",
  vecino: "#78D89A",
  abierto: "#78D89A",
  abiertoFondo: "#173322",
  cerrado: "#FF8A80",
  cerradoFondo: "#351A1D",
  promo: "#FFB86B",
  promoFondo: "#332515",
  aviso: "#FFB86B",
  avisoFondo: "#332515",
  estrellas: "#F4C15D",
};

interface TemaContexto {
  preferencia: PreferenciaTema;
  tema: TemaEfectivo;
  colores: ColoresTema;
  cambiarTema: (tema: PreferenciaTema) => Promise<void>;
  cargado: boolean;
}

const TemaContext = createContext<TemaContexto | null>(null);

export function TemaProvider({ children }: { children: ReactNode }) {
  const sistema = useColorScheme();
  const [preferencia, setPreferencia] = useState<PreferenciaTema>("system");
  const [cargado, setCargado] = useState(false);

  useEffect(() => {
    async function cargarTema() {
      const temaGuardado = await obtenerPreferenciaTema();
      setPreferencia(temaGuardado);
      setCargado(true);
    }

    void cargarTema();
  }, []);

  const tema: TemaEfectivo =
    preferencia === "system"
      ? sistema === "dark"
        ? "dark"
        : "light"
      : preferencia;

  const colores = tema === "dark" ? coloresOscuro : coloresClaro;

  async function cambiarTema(nuevoTema: PreferenciaTema) {
    setPreferencia(nuevoTema);
    await guardarPreferenciaTema(nuevoTema);
  }

  const valor = useMemo(
    () => ({ preferencia, tema, colores, cambiarTema, cargado }),
    [preferencia, tema, colores, cargado],
  );

  return <TemaContext.Provider value={valor}>{children}</TemaContext.Provider>;
}

export function useTema(): TemaContexto {
  const contexto = useContext(TemaContext);

  if (!contexto) {
    throw new Error("useTema debe utilizarse dentro de TemaProvider.");
  }

  return contexto;
}
