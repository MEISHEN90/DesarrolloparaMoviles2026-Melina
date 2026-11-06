# Consolidación del Trabajo Integrador

Rama de continuidad: `Integracion-Final`

Esta rama fue creada a partir de `Melina-Casco---Test` y consolida los avances
relevantes de la base original, el módulo de reseñas desarrollado por Matías y
los ajustes posteriores de autenticación realizados por José.

## Criterio de integración

- Se mantiene **Expo SDK 54**.
- `Melina-Casco---Test` queda intacta como respaldo.
- La API oficial de la cátedra pasa a ser la fuente de datos para los módulos ya migrados.
- Los mocks se conservan solamente donde todavía hay módulos pendientes de migración.
- SQLite sigue siendo la base de persistencia/cache/offline.
- Los cambios se incorporaron por bloques para evitar un merge masivo difícil de revertir.

## Integrado

### Cliente API

Se agregó `src/servicios/api.ts`:

- URL base configurable.
- Bearer token desde Secure Store.
- Manejo del sobre `{ datos, meta }`.
- Errores `ErrorApi` y `ErrorRed`.
- URL por defecto para Android Emulator: `http://10.0.2.2:3000`.
- Puede sobreescribirse con `EXPO_PUBLIC_API_URL`.

### Autenticación

- `POST /auth/ingreso`.
- `POST /auth/registro`.
- `GET /yo`.
- Cierre de sesión cuando la API responde `NO_AUTENTICADO`.
- Validaciones locales alineadas al contrato de la API.
- Contraseña: 8 a 100 caracteres.
- Tests de autenticación y control de acceso al escáner.

### Comercios y rubros

- Comercios desde `GET /comercios?porPagina=1000`.
- Detalle desde `GET /comercios/:id`.
- Rubros desde `GET /rubros`.
- Cache SQLite para comercios.
- Búsqueda, rubro y `Abierto ahora` continúan calculándose localmente.

### Reseñas

Servicio completo incorporado:

- listar;
- crear;
- editar;
- borrar;
- reportar;
- responder como comercio;
- cache local;
- cola offline;
- sincronización automática al recuperar conexión o volver al primer plano;
- id local idempotente;
- manejo de `RESENA_YA_EXISTE`.

También se agregaron:

- `FormularioResena`;
- `FormularioRespuesta`;
- `TarjetaResena`;
- utilidades puras;
- tests de lógica;
- tests de componentes.

Durante la integración se mantiene compatibilidad con la ficha actual mediante
`obtenerResenasPorComercio()`, y la nueva API con información de cache queda
disponible en `obtenerResenasConEstado()`.

## Integrado parcialmente / siguiente paso

### Interfaz completa de reseñas

El motor y los componentes están incorporados. Resta reemplazar la sección
actual de la ficha de comercio por la versión completa que permite crear,
editar, borrar, reportar y responder desde la misma pantalla.

### Favoritos

Actualmente siguen persistiendo localmente con `expo-sqlite/kv-store`.

La API oficial dispone de endpoints de favoritos; deben migrarse para que el
servidor sea la fuente principal y el almacenamiento local actúe como apoyo.

### Promociones y canje QR

La funcionalidad previa se conserva, pero todavía debe adaptarse por completo
al contrato oficial de la API de promociones/canje.

### Mapa

La lógica de ubicación y mapas continúa disponible. Debe verificarse con los
ids y coordenadas provenientes de los comercios reales de la API.

### Panel de comercio y archivos

Pendiente completar la gestión de la ficha comercial, promociones, imágenes y
video contra los endpoints oficiales.

## Tests incorporados

Además de los tests ya existentes de horarios, distancias y QR:

- autenticación;
- validación de registro/login;
- acceso al escáner por rol;
- orden y promedio de reseñas;
- detección de reseña propia;
- validación de reseñas;
- formulario de reseña;
- tarjeta y acciones por rol;
- estado de sincronización.

## API local

La API de la cátedra escucha en el puerto 3000.

Android Emulator:

```text
http://10.0.2.2:3000
```

Teléfono físico:

```text
http://IP_DE_LA_COMPUTADORA:3000
```

Puede configurarse sin modificar código:

```bash
EXPO_PUBLIC_API_URL=http://192.168.0.10:3000 npx expo start
```

## Verificación recomendada antes de continuar

```bash
npm ci
npx tsc --noEmit
npm run lint
npm test -- --runInBand
npx expo-doctor@latest
```

## Rama de respaldo

No eliminar ni sobrescribir:

```text
Melina-Casco---Test
```

La continuidad del Trabajo Integrador debe realizarse desde:

```text
Integracion-Final
```
