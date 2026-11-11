# Huecos, contradicciones e interpretaciones del PRD

El cliente pidió explícitamente en su documento: *"Este documento tiene huecos y contradicciones. Cuando las encuentren, avisen: no las resuelvan por su cuenta."* Este archivo es ese aviso, escrito. Cada caso tiene: qué dice el PRD, por qué es hueco/contradicción, y cómo lo resolvimos.

---

## A. Contradicciones internas del PRD

### A1. "Foto para una reseña" que el modelo no soporta

- **Qué dice:** la tabla "Capacidades del dispositivo" (página 5) declara la cámara para *"El comercio escanea el QR del cliente; **foto para una reseña**"*.
- **Por qué es contradicción:** la sección 4 (Las reseñas) **no pide fotos** en ningún punto, y el modelo `Resena` (página 10) no tiene campo de imagen: es `estrellas + comentario + respuesta + reportada + …`. La API de la cátedra replica ese modelo exacto: no hay endpoint para adjuntar una foto a una reseña ni columna donde referenciarla.
- **Qué hicimos:** no la implementamos. Sacar la foto sería factible (la cámara está disponible), pero el archivo quedaría huérfano: sin campo en la entidad, la foto no puede **ser** "para una reseña". La cámara se usa para lo que el modelo sí soporta: el escaneo de QR del cliente.
- **Frase de defensa:** *"La tabla de capacidades menciona 'foto para una reseña', pero el modelo `Resena` del propio PRD no tiene campo de imagen y la API no ofrece endpoint para adjuntarla. La reportamos como inconsistencia en lugar de inventar un almacenamiento huérfano."*

### A2. `expo-sensors` declarado sin caso de uso

- **Qué dice:** la tabla de capacidades lista **`expo-haptics`, `expo-sensors`** como paquetes de la fila "Sensores o háptica".
- **Por qué es hueco:** ninguna sección del PRD describe un uso de sensores (acelerómetro, giroscopio, etc.). El único requisito de vibración está cubierto por `expo-haptics`, y la consigna exige *"al menos un uso justificado de expo-sensors **o** expo-haptics"* — es una disyuntiva.
- **Qué hicimos:** `expo-haptics` con dos usos justificados (confirmación al validar un QR y errores de validación). `expo-sensors` no se instala porque no hay caso que lo justifique — instalarlo sin uso sería lo contrario de "un uso justificado".

---

## B. Pedidos sin soporte en el modelo de datos

### B1. "Promo guardada" que no existe

- **Qué dice:** §5 — *"Recibir un recordatorio cuando una **promo guardada** está por vencer"*.
- **Por qué es hueco:** no existe el concepto de "guardar una promoción" en **ningún** lugar: ni en las entidades (la `Promocion` no tiene flag de guardada, el `Usuario` no tiene lista de promos guardadas), ni en los mockups, ni en la API (no hay endpoint de promos guardadas).
- **Qué hicimos:** lo interpretamos como *"promociones de comercios favoritos que están por vencer"* — que sí tiene soporte completo (favoritos + `estaPorVencer` + notificación local). La interpretación está escrita en los comentarios de `src/servicios/avisos.ts`.
- **Frase de defensa:** *"'Promo guardada' no existe como concepto en el modelo ni en la API; la interpretamos como promos de comercios favoritos y lo dejamos documentado en el código."*

### B2. Horarios de verano imposibles de modelar

- **Qué dice:** §1 — *"Ojo con los horarios… en verano el turno tarde empieza más tarde."*
- **Por qué es hueco:** el modelo `Horario` es `{ dia, abre, cierra }` — horario semanal fijo, **sin variantes de temporada**. La API tampoco las soporta: no hay forma de cargar "horario de verano" como dato distinto.
- **Qué hicimos:** la mitigación que el propio PRD plantea en §6 — el comercio **edita sus horarios desde la app** (`mi-comercio`), así cuando cambia la temporada actualiza sus franjas y "Abierto ahora" vuelve a calcular bien.

### B3. `codigoQr` del comercio: un campo sin comportamiento

- **Qué dice:** la entidad `Comercio` tiene `codigoQr: string | null` ("CCU:com-118").
- **Por qué es hueco:** **ninguna sección del PRD describe para qué se usa** ese QR, y en la app no se referencia (el QR que escanea el comercio es el de la promoción del cliente, `PROMO|pro|usr`; el del comercio no participa en ningún flujo).
- **Qué hicimos:** lo dejamos como dato de la ficha (llega de la API) sin comportamiento propio. Queda disponible por si el centro comercial quiere imprimirlo, pero no hay requerimiento que lo use.

---

## C. Interpretaciones (ambigüedades que resolvimos con una decisión documentada)

### C1. Avisos: locales, no push remota

- **Qué dice:** §5 — *"Recibir un aviso cuando aparece una promoción nueva de un comercio favorito o de un rubro elegido."*
- **Cómo lo resolvimos:** **notificaciones locales** con revisión periódica (al arrancar y al volver a primer plano, máximo cada 5 minutos): la app consulta la API y avisa por las promos que no conocía.
- **Por qué:** el push remoto de Android **no funciona en Expo Go desde el SDK 53** (requiere development build + registro de tokens en la API — la parte que la cátedra dejó como tarea M10, con solución de referencia en su branch `solucion-notificaciones`). El PRD no dice "push"; dice "recibir un aviso", y esto lo cumple disparado por un hecho real.

### C2. "Buscar por nombre o por lo que venden"

- **Cómo lo resolvimos:** búsqueda sobre **nombre + descripción** del comercio (sin distinguir tildes ni mayúsculas). El modelo no tiene una lista de productos separada — la descripción es donde el comercio dice qué vende.

### C3. "Android y iPhone"

- **Cómo lo resolvimos:** código cross-platform (sin APIs exclusivas de Android; mapas, biometría, SQLite, notificaciones y video tienen implementación iOS). **La verificación se hizo solo en Android** (emulador); probar iOS requiere equipo Apple que la entrega no pide (el build exigido por la consigna es el APK Android con EAS).

---

## D. Desviaciones menores del mockup ("Cómo me imagino que se usa" — no es normativo)

1. **"Mostrar mi código"** está en el **detalle de la promoción**, no dentro de la tarjeta de la ficha como dibuja el mockup. Razón: el botón abre QR + código en texto + instrucciones, que no caben bien en la tarjeta; es un toque más de distancia.
2. **El listado principal no muestra "a 300 m"** por tarjeta (el mockup la dibuja). La distancia está en el **mapa**, donde el PRD la exige ("ordenar el listado por distancia"). El listado principal muestra dirección y, como el resto de pantallas, avisa cuando muestra datos guardados sin conexión.
3. La tab que el mockup llama **"Buscar"** se llama **"Comercios"** — describe mejor su contenido.
4. Las tarjetas del listado no muestran la línea **"PROMO: 15% en pinturas"** del mockup (la promo vigente se ve completa al entrar al comercio; el punto de entrada es la pestaña Promos).

---

## E. Corrección aplicada: paquete de íconos

- **Qué dice:** *"Tres cosas que la documentación vieja de internet dice mal" → "Los íconos son `@react-native-vector-icons/ionicons`, no `@expo/vector-icons`."*
- **Qué había:** la app importaba `Ionicons` desde `@expo/vector-icons` en 13 archivos (y tenía el plugin nuevo declarado en `app.json` sin usar los imports).
- **Qué hicimos:** migración completa de los 13 imports a `@react-native-vector-icons/ionicons` (export default, misma API de glifos), con los tipados adaptados al `name` estricto del paquete (`Parameters<typeof Ionicons>[0]["name"]`). Verificado en emulador: todos los íconos renderizan. La excepción consciente es `components/ui/icon-symbol.tsx` (código de plantilla que usa la familia **MaterialIcons**, no ionicons — la nota del PRD refiere a la familia de íconos de la app).
