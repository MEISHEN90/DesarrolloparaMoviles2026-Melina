# Directorio de Comercios

Aplicación móvil desarrollada como **Trabajo Integrador Final** de la asignatura **Desarrollo para Móviles — 2026**, Universidad Nacional de Entre Ríos (UNER).

El proyecto implementa un directorio móvil de comercios para **Concepción del Uruguay**, con consulta de establecimientos, promociones, ubicación, horarios, favoritos, reseñas y funcionalidades diferenciadas para vecinos y comercios.

---

## Integrantes

| Integrante |
|---|
| Melina Johanna Lisette Casco |
| Daniel Marcelo Cisnero |
| José Ignacio Debuck |
| Marcos Gabriel Gainza |
| María Gabriela Olivares Contreras |
| Matías Vespa |

---

## Repositorio y rama de desarrollo

Repositorio principal del grupo:

[github.com/Ranger9707/DesarrolloparaMoviles2026](https://github.com/Ranger9707/DesarrolloparaMoviles2026)

Rama de desarrollo utilizada actualmente:

[`Melina-Casco---Test`](https://github.com/Ranger9707/DesarrolloparaMoviles2026/tree/Melina-Casco---Test)

Versión casi final de Matías (reseñas, avisos, QR de promos y panel de comercio), sobre `main`:

[`Matias-app-casi-final`](https://github.com/Ranger9707/DesarrolloparaMoviles2026/tree/Matias-app-casi-final)

Cada uno por favor clone o use una nueva rama para ir testeando. Aún no esta colocado nada en MAIN.

---

## Entorno de desarrollo

- **Expo SDK 54**
- **React Native 0.81**
- **React 19**
- **TypeScript**
- **Expo Router**
- **Android Studio / Android Emulator**
- **Node.js + npm**

> El proyecto debe mantenerse en **Expo SDK 54** para conservar compatibilidad entre los integrantes del grupo.

---

## Objetivo

Desarrollar una aplicación móvil que permita descubrir y consultar comercios, acceder a promociones, visualizar ubicaciones y horarios, utilizar funciones asociadas al dispositivo y mantener información útil disponible incluso sin conexión.

La aplicación contempla dos roles principales.

### Vecino

Puede:

- consultar comercios;
- buscar por nombre o producto;
- filtrar por rubro;
- consultar comercios abiertos;
- visualizar establecimientos en el mapa;
- consultar promociones;
- registrarse e iniciar sesión;
- marcar comercios como favoritos;
- consultar y gestionar reseñas;
- acceder a funciones asociadas a su cuenta.

### Comercio

Además de las funcionalidades generales, puede:

- acceder con una cuenta de tipo comercio;
- validar promociones mediante QR;
- registrar el uso de promociones;
- administrar imágenes del comercio;
- utilizar herramientas específicas desde su perfil;
- responder reseñas;
- gestionar información comercial.

---

## Funcionalidades implementadas

### Navegación

- Expo Router.
- Navegación principal mediante Tabs.
- Navegación mediante Stack.
- Rutas dinámicas para comercios y promociones.
- Pantallas específicas para autenticación, registro, QR e imágenes.

### Directorio de comercios

- Listado de comercios.
- Búsqueda por nombre y descripción.
- Búsqueda tolerante a mayúsculas, minúsculas y tildes.
- Filtros por rubro.
- Filtro **Abierto ahora**.
- Soporte para horarios partidos.
- Ficha ampliada de comercio.
- Estado abierto/cerrado calculado localmente.
- Contacto telefónico.
- Acceso a WhatsApp.
- Acceso a Instagram.
- Apertura de ubicación en Google Maps.
- Medios de pago.
- Video de presentación.
- Promoción vigente.
- Favoritos persistentes por usuario.

### Promociones

- Listado de promociones activas.
- Categorías vigentes / próximas / por vencer (estados de la API).
- Filtro de promociones por rubro.
- Pantalla de detalle con enlace al comercio.
- Validación mediante códigos QR.
- Registro del uso de promociones.
- Prevención persistente de usos duplicados.
- Visualización de promoción vigente dentro de la ficha del comercio.
- **Mostrar mi código**: el vecino genera el QR de una promo `soloApp` en su pantalla para que el comercio lo escanee (o lo verifique por el código en texto).
- Panel **Mis promociones** para el comercio: alta, edición y baja lógica de promociones con contador de usos por promo.

Formato utilizado actualmente para QR de promociones:

```text
PROMO|<promocionId>|<usuarioId>
```

Ejemplo:

```text
PROMO|pro-002|usr-001
```

### Autenticación y sesión

- Registro de usuarios.
- Inicio de sesión.
- Roles `vecino` y `comercio`.
- Persistencia de sesión.
- Token protegido mediante `expo-secure-store`.
- Reingreso mediante autenticación biométrica.
- Alternativa para dispositivos sin biometría.

### Ubicación y mapas

- Solicitud de permisos de ubicación.
- Obtención de ubicación actual.
- Integración con `react-native-maps`.
- Marcadores de comercios.
- Cálculo de distancia.
- Comercios ordenados por cercanía.
- Funcionamiento alternativo cuando el permiso de ubicación es rechazado.
- Apertura de Google Maps desde la ficha del comercio.

### Cámara, imágenes y archivos

- Lectura de QR mediante `expo-camera`.
- Selección de imágenes mediante `expo-image-picker`.
- Captura mediante cámara.
- Recorte de imágenes.
- Guardado local con la API moderna de `expo-file-system`.
- Uso de `File`, `Directory` y `Paths`.
- Vista previa de archivos almacenados.

### Persistencia y funcionamiento offline

- Base de datos local mediante `expo-sqlite`.
- Persistencia del uso de promociones.
- Prevención persistente de duplicados.
- Caché local de comercios.
- Caché local de promociones.
- Preferencias mediante `expo-sqlite/kv-store`.
- Persistencia del rubro seleccionado.
- Persistencia del filtro **Abierto ahora**.
- Favoritos persistentes por usuario.
- Detección de conectividad mediante `expo-network`.
- Actualización automática frente a cambios de red.
- Aviso visual de estado sin conexión.

### Háptica

Se utiliza `expo-haptics` como respuesta del dispositivo frente a acciones relevantes:

- confirmación correcta del uso de una promoción;
- errores durante la validación de códigos QR.

### Notificaciones

Se utiliza `expo-notifications` para notificaciones locales asociadas a eventos reales de la aplicación.

- aviso cuando entra una promoción nueva de un comercio favorito o de un rubro de interés;
- recordatorio cuando una promoción de un favorito está por vencer;
- confirmación cuando el comercio registra el uso de una promoción.

Los avisos se pueden apagar todos de una desde el perfil (`avisosActivos`), y los rubros de interés se eligen en la misma sección.

> Expo Go puede mostrar advertencias relacionadas con notificaciones push remotas. El proyecto utiliza notificaciones locales para esta funcionalidad.

### Multimedia

- Integración de `expo-video`.
- Reproducción de video en la ficha del comercio.
- Controles visibles.
- Reproducción/pausa.
- Adelanto y retroceso.
- Pantalla completa.

### Reseñas

Módulo completo e integrado en la ficha del comercio:

- modelo `Resena` con servicio propio (API + caché SQLite + cola offline);
- crear reseña (estrellas + comentario) con sesión activa;
- editar y eliminar la reseña propia;
- reportar reseñas ofensivas;
- respuesta del comercio (una sola vez por reseña, sólo el dueño);
- orden por fecha y promedio;
- sincronización automática de reseñas pendientes al recuperar conexión;
- pull-to-refresh y refresco al volver al foco;
- componentes con tests propios.

---

## Tecnologías y librerías

### Dependencias principales de Expo

| Librería | Uso |
|---|---|
| `expo` | Plataforma base del proyecto |
| `expo-router` | Navegación basada en archivos |
| `expo-camera` | Cámara y lectura de QR |
| `expo-image-picker` | Selección y captura de imágenes |
| `expo-file-system` | Manejo y persistencia de archivos |
| `expo-location` | Geolocalización |
| `expo-secure-store` | Almacenamiento seguro de sesión/token |
| `expo-local-authentication` | Biometría |
| `expo-network` | Estado de conectividad |
| `expo-notifications` | Notificaciones locales |
| `expo-haptics` | Respuesta háptica |
| `expo-sqlite` | Base de datos local y KV Store |
| `expo-video` | Reproducción multimedia |
| `expo-linking` | Apertura de enlaces externos |
| `expo-splash-screen` | Pantalla de inicio |
| `expo-status-bar` | Barra de estado |
| `expo-font` | Gestión de fuentes |
| `expo-image` | Soporte de imágenes |
| `expo-constants` | Acceso a configuración de Expo |
| `expo-system-ui` | Integración visual con el sistema |
| `expo-web-browser` | Apertura de contenido web |
| `@expo/vector-icons` | Iconografía |

### Otras dependencias relevantes

| Librería | Uso |
|---|---|
| `react-native-maps` | Mapas y marcadores |
| `@react-navigation/native` | Infraestructura de navegación |
| `@react-navigation/bottom-tabs` | Navegación por pestañas |
| `react-native-gesture-handler` | Gestos |
| `react-native-reanimated` | Animaciones |
| `react-native-safe-area-context` | Áreas seguras |
| `react-native-screens` | Optimización de navegación |
| `react-native-worklets` | Soporte para ejecución de worklets |
| `jest` / `jest-expo` | Pruebas automatizadas |
| `@testing-library/react-native` | Testing de componentes React Native |

---

## Instalación para integrantes del grupo

### Recomendado: instalar exactamente las dependencias del repositorio

Después de clonar o actualizar la rama:

```bash
npm ci
```

Este comando utiliza `package-lock.json` y mantiene las mismas versiones para todo el equipo.

> En condiciones normales **no es necesario instalar las librerías una por una**. `npm ci` debe ser la primera opción.

### Si se necesita reinstalar los paquetes Expo manualmente

Utilizar `npx expo install` para que Expo seleccione versiones compatibles con **SDK 54**:

```bash
npx expo install expo-camera expo-constants expo-file-system expo-font expo-haptics expo-image expo-image-picker expo-linking expo-local-authentication expo-location expo-network expo-notifications expo-router expo-secure-store expo-splash-screen expo-sqlite expo-status-bar expo-system-ui expo-video expo-web-browser
```

Para mapas:

```bash
npx expo install react-native-maps
```

Para comprobar que todas las versiones sean compatibles:

```bash
npx expo install --check
npx expo-doctor@latest
```

---

## Arquitectura general

```text
app/
├── (tabs)/
├── comercio/
├── promocion/
├── escanear-qr.tsx
├── imagen-comercio.tsx
├── login.tsx
├── registro.tsx
├── mi-comercio.tsx
├── mis-promociones.tsx
└── _layout.tsx

src/
├── components/
├── contexto/
├── hooks/
├── mocks/
├── servicios/
├── tipos/
└── utils/

__tests__/
docs/
```

### `app/`

Contiene las pantallas y rutas gestionadas mediante Expo Router.

### `src/servicios/`

Centraliza la lógica relacionada con:

- autenticación;
- sesión;
- comercios;
- promociones;
- reseñas;
- favoritos;
- SQLite;
- caché;
- ubicación;
- archivos;
- conectividad;
- biometría;
- notificaciones;
- háptica.

### `src/mocks/`

Contiene datos simulados mientras la API de la cátedra no se encuentre disponible.

### `src/tipos/`

Contiene los modelos y tipos TypeScript del dominio.

### `src/utils/`

Contiene funciones reutilizables como horarios, distancias y validación de QR.

### `__tests__/`

Contiene pruebas automatizadas de lógica propia.

---

## Ejecución local

Con Android Studio y un emulador Android iniciado:

```bash
npx expo start
```

Luego presionar:

```text
a
```

Para limpiar caché de Metro:

```bash
npx expo start --clear
```

---

## Verificación del proyecto

### TypeScript

```bash
npx tsc --noEmit
```

### Lint

```bash
npm run lint
```

### Tests

```bash
npm test
```

### Compatibilidad de dependencias Expo

```bash
npx expo install --check
npx expo-doctor@latest
```

---

## Credenciales de desarrollo

> Estas credenciales corresponden únicamente al entorno de pruebas actual (API de la cátedra). Contraseña `demo1234` para todas las cuentas.

### Usuario vecino

```text
Correo: marta@mail.com
Contraseña: demo1234
Rol: Vecino
```

### Usuario comercio

```text
Correo: tornillo@demo.ar
Contraseña: demo1234
Rol: Comercio (Ferretería El Tornillo)
```

---

## Estado del desarrollo

| Etapa | Estado |
|---|---|
| 1. Navegación y estructura base | ✅ Completada |
| 2. Tipos, mocks y servicios | ✅ Completada |
| 3. Autenticación y sesión | ✅ Completada |
| 4. Ubicación y mapas | ✅ Completada |
| 5. Cámara y archivos | ✅ Completada |
| 6. Persistencia y conectividad | ✅ Completada |
| 7. Notificaciones, háptica y multimedia | ✅ Completada |
| 8. API de la cátedra | ✅ Integrada (axios detrás de la capa de servicios) |
| 9. Testing y revisión funcional | 🟡 87 tests en verde; falta revisión visual final |
| 10. Identidad y entrega final | 🟡 Ícono, splash y nombre listos; falta build EAS y pruebas en dispositivo |

### Revisión funcional adicional

- [x] Ficha ampliada de comercio.
- [x] Estado abierto/cerrado.
- [x] Horarios comerciales y horarios partidos.
- [x] Llamada telefónica.
- [x] WhatsApp.
- [x] Instagram.
- [x] Apertura en Google Maps.
- [x] Video de presentación.
- [x] Promoción vigente.
- [x] Favoritos persistentes por usuario.
- [x] Persistencia del favorito luego de reiniciar.
- [x] Base funcional del módulo de reseñas.
- [x] Crear reseñas.
- [x] Editar reseñas propias.
- [x] Eliminar reseñas propias.
- [x] Reportar reseñas.
- [x] Respuesta del comercio.
- [x] Reseñas offline con sincronización automática.
- [x] Categorías de promociones (vigentes / próximas / por vencer).
- [x] Filtro de promociones por rubro.
- [x] Mostrar mi código (QR del vecino para promos sólo app).
- [x] Panel Mis promociones (alta, edición, baja y usos).
- [x] Rubros de interés y apagado de avisos en el perfil.
- [x] Avisos de promociones nuevas y por vencer.
- [ ] Filtro de mapa por rubro.
- [ ] Botón "Ir" en el mapa (cómo llegar).
- [ ] Revisión visual final de todas las pantallas.

---

## API de la cátedra

La API de la cátedra está **integrada**: toda lectura y escritura pasa por la capa de servicios propia (`src/servicios/`) y viaja por **axios**, respetando el sobre de respuestas (`datos` / `error`) y el token Bearer en `expo-secure-store`.

Endpoints en uso: comercios, rubros, promociones (con estados `vigentes` / `proximas` / `por-vencer`), reseñas, `auth/ingreso`, `auth/registro`, `yo` (lectura y edición de rubros de interés y avisos), favoritos y `mi-comercio` (datos y CRUD de promociones).

El comportamiento sin conexión se resuelve con caché SQLite y una cola de reseñas pendientes que se sincroniza sola.

---

## Entrega final pendiente

- [x] Ícono propio (PNG 1024×1024 sin transparencias).
- [x] Splash screen definitivo.
- [x] Nombre definitivo del producto.
- [x] Permisos declarados en `app.json` y `eas.json` con perfil de APK.
- [ ] Build Android Preview.
- [ ] APK instalable.
- [ ] Pruebas en dispositivo físico.
- [ ] Preparación de defensa oral.

Build previsto:

```bash
eas build --platform android --profile preview
```

---

## Consideraciones para el equipo

- Mantener el proyecto en **Expo SDK 54**.
- Antes de trabajar, ejecutar `git pull` sobre la rama correspondiente.
- Usar preferentemente `npm ci` para instalar dependencias.
- Evitar actualizar Expo o React Native de forma individual sin coordinación con el grupo.
- Verificar TypeScript, lint y tests antes de hacer push.
- No incluir `node_modules` en commits.
- Mantener los mocks y la capa de servicios separados para facilitar la futura integración con la API.

---

## Licencia

Consultar el archivo [LICENSE](./LICENSE) incluido en el repositorio.
