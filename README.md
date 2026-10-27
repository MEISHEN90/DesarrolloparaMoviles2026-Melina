# Cambios 

---

## 1. Resumen cuantitativo

| Métrica | Base (`testbasico`) | Actual |
|---|---|---|
| Tests | 14 (lógica pura: horarios, distancias, QR) | **38** (+24: reseñas y componentes) |
| Servicios conectados a la API | 0 | **4** (comercios, rubros, autenticación, reseñas) |
| Componentes de reseñas | 0 (inline en la ficha, solo lectura) | **3** (tarjeta + 2 formularios) |
| Hooks propios | 1 (`use-estado-red`) | **3** (+ sincronización de reseñas; + ficha usa `useFocusEffect`) |
| Utilerías de reseñas (`utils/`) | — | **4 funciones puras** testeadas |
| Tablas SQLite | 4 | **6** (+ `resenas_locales`, `resenas_cache`) |
| Documentación de la parte | — | `GUIA-RESENAS.md` (mapa de archivos, decisiones, guion de defensa) |

---

## 2. Archivos NUEVOS (no existían en la base)

| Archivo | Qué hace |
|---|---|
| `src/servicios/api.ts` | **Cliente HTTP de la API**: arma las URLs desde `extra.apiUrl` (app.json), agrega `Authorization: Bearer` desde Secure Store, desenvuelve `{datos, meta}` y convierte `{error}` en `ErrorApi` (con `codigo`) / `ErrorRed`. Es la puerta única que usan los 4 servicios migrados. |
| `src/utils/resenas.ts` | Lógica pura de reseñas: `ordenarResenas` (más nueva primero, sin mutar), `calcularPromedio` (0 con lista vacía, nunca NaN), `miResenaDeLista`, `validarResena` (mismas reglas que la API: 1-5 estrellas, comentario 1-1000). |
| `src/hooks/use-sincronizacion-resenas.ts` | Sube las reseñas pendientes cuando **vuelve la conexión** (paso sin-red → con-red) y cuando la app **vuelve a primer plano** (`AppState`). Se monta recién cuando la base SQLite está lista. |
| `src/components/resenas/tarjeta-resena.tsx` | Tarjeta de reseña: acciones según el rol (propia → Editar/Borrar; ajena → Reportar; dueño del comercio → Responder solo si no tiene respuesta), chip "Pendiente de enviar", bloque "Respuesta del comercio". |
| `src/components/resenas/formulario-resena.tsx` | Alta y edición de reseña: estrellas táctiles 1-5, comentario con contador (0/1000), validación compartida con `validarResena`, estados de guardado y error. |
| `src/components/resenas/formulario-respuesta.tsx` | Modal de respuesta del comercio (una sola vez por reseña, como pide el PRD), con la regla explicada al usuario. |
| `__tests__/resenas-test.ts` | 13 tests de lógica pura: orden, promedio, mi reseña, validación. |
| `__tests__/tarjeta-resena-test.tsx` | 7 tests de componente: qué acciones ve cada rol, chip de pendiente, respuesta visible. |
| `__tests__/formulario-resena-test.tsx` | 4 tests de componente: títulos crear/editar, precargado en edición, validación visible, contador. |
| `GUIA-RESENAS.md` | Documentación de la parte: mapa de archivos, diseño offline, endpoints, decisiones, guion de demo para la defensa. |

**Dependencias agregadas:** `test-renderer` (requerido por Testing Library v14 con React 19) y `expo-asset` (lo pide `expo-font` en el entorno de test). `@testing-library/react-native` ya venía en la base pero **sin usarse** — ahora tiene 11 tests.

---

## 3. Archivos REESCRITOS (misma firma pública, motor nuevo)

### `src/servicios/resenas.ts` — el cambio más grande (45 → ~350 líneas)
- **Base:** solo lectura sobre `resenasMock`, con retardo simulado. Sin crear, editar, borrar, reportar ni responder.
- **Actual:** consuma `GET /comercios/:id/resenas` de la API, **cachea en SQLite**, mezcla las locales pendientes y reporta `desdeCache` (para el aviso de datos viejos). Agrega `crearResena` (guarda local con **id generado por el teléfono**, intenta el POST, maneja `RESENA_YA_EXISTE`), `editarResena` y `borrarResena` (local o contra API según esté sincronizada), `reportarResena`, `responderResena` y `sincronizarResenasPendientes` (cola offline: reenvía con el mismo id, que la API no duplica).
- Sin API, sin cache y sin pendientes: **lanza error de carga** (la ficha muestra "Reintentar"), distinto de "sin reseñas".

### `src/servicios/comercios.ts` — de mocks a la API (requisito para reseñar)
- **Base:** leía `comerciosMock`. **Actual:** `GET /comercios?porPagina=1000` cacheado en SQLite, `GET /comercios/:id` para el detalle. Mismo filtrado local de búsqueda/rubro/"abierto ahora".
- *Por qué era urgente:* con el listado sobre mocks, los ids (`com-001`…) no existían en la API y reseñar daba `404 COMERCIO_NO_ENCONTRADO`.

### `src/servicios/rubros.ts` — de mocks a la API
- **Base:** 9 rubros inventados con ids `rubro-001…`. **Actual:** `GET /rubros` (ids `rub-gastronomia`…), guardados en memoria por sesión. Sin esto, los chips de filtro y el rubro de la ficha quedaban desparejados con los comercios reales.

### `src/servicios/autenticacion.ts` — de mocks a la API real
- **Base:** contraseñas en memoria (`123456` para todos), token falso `token-usr-…`. **Actual:** `POST /auth/ingreso` y `POST /auth/registro` con el campo **`contrasena`** (sin ñ; la API rechaza `password`), token real de 30 días que `sesion.ts` guarda en Secure Store. Suma `obtenerUsuarioActual()` (`GET /yo`). Queda `obtenerUsuarioPorId` sobre mocks mientras migra el resto (nombres de autores).

---

## 4. Archivos MODIFICADOS

| Archivo | Cambio |
|---|---|
| `src/servicios/base-datos.ts` | +2 tablas: `resenas_locales` (cola offline con `sincronizada`) y `resenas_cache` (por comercio). |
| `src/servicios/cache.ts` | `obtenerComerciosCache` ahora **degrada a vacío** si la cache está dañada (verificado en vivo: una muerte abrupta del emulador corrompió la cache y tumbaba la ficha). |
| `app/(tabs)/perfil.tsx` | El perfil se trae con `GET /yo` vía `obtenerUsuarioActual()` (antes buscaba el id de sesión en los mocks). |
| `app/comercio/[id].tsx` | Integración completa de reseñas: botón según sesión ("Iniciá sesión…" → `/login`; "Editar mi reseña" si ya existe), tarjetas con acciones por rol, modales de reseña y de respuesta, **error de reseñas con Reintentar**, aviso "datos guardados pueden estar desactualizados" cuando viene del cache, **`useFocusEffect`** para refrescar al volver al foco y **pull-to-refresh** (`RefreshControl`). Se quitó la búsqueda de autores sobre mocks. |
| `app.json` | `extra.apiUrl` (default `http://localhost:3000`; en teléfono físico va la IP de la compu). |
| `package.json` | + `test-renderer`, `expo-asset`; scripts de test intactos (`jest-expo`). |

---

## 5. Archivo ELIMINADO

| Archivo | Motivo |
|---|---|
| `src/mocks/resenas.ts` | Código muerto: tras la reescritura nadie lo importaba. Las reseñas viven en la API. (Los mocks de comercios/promos/rubros/usuarios siguen: los tres primeros hasta que el grupo migre esas secciones; `usuarios` alimenta los nombres de autores.) |

---

## 6. Lo que quedó demostrado y verificado en vivo (emulador + API real)

1. **Flujo completo de reseña** con cuenta real: crear → editar → borrar (verificado contra el servidor con `curl`).
2. **`RESENA_YA_EXISTE`**: Marta ya reseñó El Tornillo → la ficha ofrece "Editar mi reseña" y descarta la local en vez de fallar.
3. **Offline de punta a punta**: API caída → crear reseña → chip "Pendiente de enviar" → reseñas cacheadas visibles con aviso amarillo → API arriba → al volver a primer plano **la cola sube sola** (comprobado en el servidor: `res-lmvmw8zc6x0sswx`).
4. **Respuesta del comercio**: login `tornillo@demo.ar` → botón "Responder" solo en su comercio → respuesta persistida y visible bajo la reseña.
5. **Error ≠ vacío**: comercio sin cache con la API caída muestra "No se pudieron cargar las reseñas." + Reintentar; con cache muestra las guardadas + aviso.
6. **Pull-to-refresh** verificado con spinner en pantalla (usando `X-Simular: demora-2500` de la propia API para ralentizar).
7. **Bug encontrado por un test y corregido**: la tarjeta mostraba "Responder" en reseñas que ya tenían respuesta (habría dado 409); hoy el test lo cubre.

---
