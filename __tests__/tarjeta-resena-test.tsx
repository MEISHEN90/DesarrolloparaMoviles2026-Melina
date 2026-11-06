import { render, screen } from "@testing-library/react-native";

import { TarjetaResena } from "../src/components/resenas/tarjeta-resena";
import { Resena } from "../src/tipos/modelos";

function resenaDePrueba(sobre: Partial<Resena> = {}): Resena {
  return {
    id: "res-test",
    comercioId: "com-118",
    usuarioId: "usr-512",
    estrellas: 4,
    comentario: "Buena atención y buenos precios.",
    respuesta: null,
    reportada: false,
    creadaEn: "2026-10-15T10:00:00-03:00",
    sincronizada: true,
    ...sobre,
  };
}

async function renderTarjeta(
  resena: Resena,
  props: Partial<Parameters<typeof TarjetaResena>[0]> = {},
) {
  return render(
    <TarjetaResena
      resena={resena}
      esPropia={false}
      onEditar={jest.fn()}
      onBorrar={jest.fn()}
      onReportar={jest.fn()}
      {...props}
    />,
  );
}

describe("TarjetaResena — acciones según usuario", () => {
  test("una reseña ajena se reporta, no se edita ni borra", async () => {
    await renderTarjeta(resenaDePrueba());

    expect(screen.getByText("Reportar")).toBeVisible();
    expect(screen.queryByText("Editar")).toBeNull();
    expect(screen.queryByText("Borrar")).toBeNull();
  });

  test("mi reseña se edita y borra, no se reporta", async () => {
    await renderTarjeta(resenaDePrueba(), { esPropia: true });

    expect(screen.getByText("Editar")).toBeVisible();
    expect(screen.getByText("Borrar")).toBeVisible();
    expect(screen.queryByText("Reportar")).toBeNull();
  });

  test("el comercio dueño puede responder una reseña ajena sin respuesta", async () => {
    await renderTarjeta(resenaDePrueba(), { puedeResponder: true });

    expect(screen.getByText("Responder")).toBeVisible();
  });

  test("si ya tiene respuesta no se puede responder de nuevo", async () => {
    await renderTarjeta(
      resenaDePrueba({ respuesta: "¡Gracias por la visita!" }),
      { puedeResponder: true },
    );

    expect(screen.queryByText("Responder")).toBeNull();
    expect(screen.getByText("Respuesta del comercio")).toBeVisible();
  });

  test("el dueño no responde su propia reseña", async () => {
    await renderTarjeta(resenaDePrueba(), {
      esPropia: true,
      puedeResponder: true,
    });

    expect(screen.queryByText("Responder")).toBeNull();
  });
});

describe("TarjetaResena — sincronización", () => {
  test("una reseña pendiente muestra el aviso de envío", async () => {
    await renderTarjeta(
      resenaDePrueba({ sincronizada: false }),
      { esPropia: true },
    );

    expect(
      screen.getByText("Pendiente de enviar — se sube cuando haya conexión"),
    ).toBeVisible();
  });

  test("una reseña sincronizada no muestra el aviso", async () => {
    await renderTarjeta(resenaDePrueba(), { esPropia: true });

    expect(
      screen.queryByText("Pendiente de enviar — se sube cuando haya conexión"),
    ).toBeNull();
  });
});
