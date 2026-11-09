import { render, screen, userEvent } from "@testing-library/react-native";

import { FormularioResena } from "../src/components/resenas/formulario-resena";

describe("FormularioResena", () => {
  test("muestra el título para crear una reseña nueva", async () => {
    await render(
      <FormularioResena
        visible={true}
        onGuardar={jest.fn()}
        onCancelar={jest.fn()}
      />,
    );

    expect(screen.getByText("Escribir una reseña")).toBeVisible();
  });

  test("muestra el título para editar cuando hay reseña existente", async () => {
    await render(
      <FormularioResena
        visible={true}
        resenaExistente={{
          id: "res-1",
          comercioId: "com-118",
          usuarioId: "usr-512",
          estrellas: 3,
          comentario: "Mi comentario original",
          respuesta: null,
          reportada: false,
          creadaEn: "2026-10-15T10:00:00-03:00",
          sincronizada: true,
        }}
        onGuardar={jest.fn()}
        onCancelar={jest.fn()}
      />,
    );

    expect(screen.getByText("Editar mi reseña")).toBeVisible();
    expect(screen.getByDisplayValue("Mi comentario original")).toBeVisible();
  });

  test("guardar sin comentario muestra el error de validación", async () => {
    const usuario = userEvent.setup();

    await render(
      <FormularioResena
        visible={true}
        onGuardar={jest.fn()}
        onCancelar={jest.fn()}
      />,
    );

    await usuario.press(screen.getByText("Guardar"));

    expect(
      await screen.findByText("Escribí un comentario para la reseña."),
    ).toBeVisible();
  });

  test("el contador refleja lo escrito", async () => {
    const usuario = userEvent.setup();

    await render(
      <FormularioResena
        visible={true}
        onGuardar={jest.fn()}
        onCancelar={jest.fn()}
      />,
    );

    const campo = screen.getByLabelText("Comentario de la reseña");
    await usuario.type(campo, "Hola");

    expect(screen.getByText("4/1000")).toBeVisible();
  });
});
