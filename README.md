# DesarrolloparaMoviles2026

Aplicacion para la materia Desarrollo para Móviles, UNER.

# OBJETIVO:

● Desarrollar y entregar la versión final de la aplicación móvil que pidió el
cliente en el PRD asignado al grupo, construida con React Native y Expo.
La aplicación tiene que integrar servicios del dispositivo, consumo de la API
de la cátedra, persistencia local y resguardo de credenciales, y entregarse
como un build instalable, no como código para compilar.

# CONSIGNAS DE ENTREGA:

1. Formato y modalidad
   a. Grupal, con los mismos integrantes declarados en la.
   b. Se carga en la sección correspondiente del Campus Virtual UNER,
   con estas dos cosas:

- Link del build. APK de release generado con el perfil preview:
  eas build --platform android --profile preview. Tiene
  que poder instalarse y usarse sin Metro y sin la computadora
  de nadie.
- Código fuente. Repositorio Git (preferido) o archivo .zip. Incluir
  eas.json y app.json. No incluir node_modules.
  c. Fecha límite: la informada en el Campus Virtual.
  d. Hagan el primer build de preview al menos una semana antes. El
  primer build siempre falla por algo —un permiso, un asset, un
  identificador— y el cupo mensual es limitado.

2. Defensa oral (obligatoria)
   a. Instancia grupal de 15 a 20 minutos, en la fecha que informe la
   cátedra.
   b. Se demuestra la app funcionando en un teléfono, con Expo Go o con
   el APK entregado. Lo que se mira es la app andando, no desde dónde
   corre.
   c. Cada integrante explica la parte que desarrolló y responde
   preguntas sobre su código.
   d. Se pueden usar asistentes de IA durante el desarrollo. En la defensa
   no. Lo que se evalúa es que puedan explicar cada línea de lo que
   entregaron.
   e. Sin defensa no hay integrador aprobado, aunque la entrega esté
   completa.

# EJERCICIO:

Aplicación final
Requisitos mínimos. Cada uno de estos puntos se verifica sobre la app entregada.
No son ejemplos ni sugerencias.

1. Pantallas y navegación. Las pantallas que haga falta para cubrir lo que pide
   el PRD, conectadas con Expo Router. El alcance lo fija el cliente, no un
   número mínimo.

2. Autenticación. Registro e ingreso, con sesión que sobrevive al cierre de la
   app. El token va en expo-secure-store. El reingreso se resuelve con expo
   local-authentication (huella o rostro), con alternativa para el dispositivo
   que no la tenga.

3. Consumo de la API. La aplicación consume la API provista por la cátedra
   detrás de una capa de servicios propia. Los estados de carga, vacío y error
   tienen que verse en pantalla.

4. Cámara y sistema de archivos. Uso de expo-camera —foto y lectura de
   códigos QR cuando el PRD lo pida— o expo-image-picker, y guardado y
   lectura en el dispositivo con la API nueva de expo-file-system (File,
   Directory, Paths).

5. Ubicación y mapas. expo-location junto con react-native-maps. Si el
   usuario niega el permiso, la app tiene que seguir siendo usable.

6. Notificaciones locales. Con expo-notifications, disparadas por un
   hecho real de la aplicación, no por un botón de prueba.

7. Persistencia y conectividad. expo-sqlite para los datos y expo
   sqlite/kv-store para preferencias y sesión. La app tiene que abrir y
   mostrar algo sin conexión, y avisar el estado de la red con expo-network.

8. Sensores o háptica. Al menos un uso justificado de expo-sensors o expo
   haptics, que aporte algo a la experiencia.

9. Multimedia. Cuando el PRD pida audio o video —audioguías, grabaciones,
   clips—, se resuelve con expo-audio o expo-video, con controles de
   reproducción a la vista.

10. Identidad de la aplicación. Ícono y pantalla de presentación propios, y
    nombre del producto. El ícono va en PNG cuadrado de 1024×1024, sin
    transparencias.

Sobre las dudas. El PRD tiene huecos y contradicciones, igual que un pedido real.
Preguntar a tiempo es parte del trabajo y suma; suponer en silencio y entregar otra
cosa, no.

# CONDICIONES DE APROBACIÓN:

● El integrador se aprueba o no se aprueba: no lleva nota. Se aprueba
cuando la app resuelve lo que pide el PRD, están los diez requisitos mínimos
y todos los integrantes defendieron su parte. Una entrega que no llega se
puede rehacer una vez.

---

# Directorio de Comercios

Aplicación móvil desarrollada como Trabajo Integrador Final de la asignatura
**Desarrollo para Móviles - 2026**.

La aplicación tiene como objetivo implementar un directorio de comercios,
permitiendo consultar establecimientos, promociones, ubicación y funcionalidades
asociadas a los usuarios y comercios.

## Rama de desarrollo

Desarrollo realizado actualmente sobre:

`Melina-Casco---Test`

## Estado del desarrollo

### ✅ Etapa 1 - Navegación y estructura base

- [x] Configuración inicial con Expo y React Native.
- [x] Navegación implementada con Expo Router.
- [x] Navegación principal mediante Tabs.
- [x] Pantalla principal de Comercios.
- [x] Pantalla de Promociones.
- [x] Pantalla de Mapa.
- [x] Pantalla de Perfil.
- [x] Ruta dinámica para detalle de comercio: `/comercio/[id]`.
- [x] Ruta dinámica para detalle de promoción: `/promocion/[id]`.
- [x] Verificación de parámetros dinámicos.
- [x] Navegación de retorno mediante Stack.
- [x] Pruebas iniciales realizadas en emulador Android.

### ✅ Etapa 2 - Tipos, mocks y capa de servicios

- [x] Definición de modelos y tipos TypeScript.
- [x] Modelo Comercio.
- [x] Modelo Rubro.
- [x] Modelo Horario.
- [x] Modelo Promoción.
- [x] Modelo Reseña.
- [x] Modelo Usuario.
- [x] Datos simulados en mocks.
- [x] Servicios asíncronos.
- [x] Estados de carga, vacío y error.
- [x] Listado de comercios consumiendo servicios.
- [x] Listado de promociones consumiendo servicios.
- [x] Detalle de comercio por ID.
- [x] Detalle de promoción por ID.
- [x] Filtro de comercios por rubro.
- [x] Integración visual de rubros en la pantalla principal.
- [x] Búsqueda de comercios por nombre y descripción.
- [x] Búsqueda tolerante a mayúsculas, minúsculas y tildes.
- [x] Cálculo dinámico de comercios abiertos según día y horario.
- [x] Soporte para horarios partidos.
- [x] Filtro "Abierto ahora".

### ✅ Etapa 3 - Autenticación y sesión

- [x] Registro de usuario.
- [x] Inicio de sesión.
- [x] Persistencia de sesión.
- [x] Secure Store.
- [x] Autenticación biométrica.
- [x] Alternativa para dispositivos sin biometría.

### ✅ Etapa 4 - Ubicación y mapa

- [x] Permisos de ubicación.
- [x] Ubicación actual del usuario.
- [x] Integración con react-native-maps.
- [x] Marcadores de comercios en el mapa.
- [x] Comercios cercanos ordenados por distancia.
- [x] Cálculo y formato de distancias.
- [x] Funcionamiento alternativo sin permiso de ubicación.

### ✅ Etapa 5 - Cámara y archivos

- [x] Uso de cámara con `expo-camera`.
- [x] Lectura real de códigos QR.
- [x] Interpretación y validación de QR de promociones.
- [x] Validación de promoción y usuario asociados al QR.
- [x] Registro del uso de una promoción.
- [x] Prevención de usos duplicados durante la ejecución.
- [x] Selección de imágenes desde la galería con `expo-image-picker`.
- [x] Captura de fotografías con cámara.
- [x] Recorte de imágenes.
- [x] Guardado local con la API nueva de `expo-file-system`.
- [x] Uso de `File`, `Directory` y `Paths`.
- [x] Vista previa de archivos almacenados localmente.

### ✅ Etapa 6 - Persistencia y conectividad

- [x] Inicialización de base de datos local con `expo-sqlite`.
- [x] Persistencia de usos de promociones en SQLite.
- [x] Prevención persistente de usos duplicados de promociones.
- [x] Preferencias locales mediante `expo-sqlite/kv-store`.
- [x] Persistencia del rubro seleccionado.
- [x] Persistencia del filtro "Abierto ahora".
- [x] Caché local de comercios.
- [x] Caché local de promociones.
- [x] Funcionamiento offline de comercios.
- [x] Funcionamiento offline de promociones.
- [x] Detección del estado de red con `expo-network`.
- [x] Actualización automática ante cambios de conectividad.
- [x] Aviso visual cuando la aplicación está sin conexión.

### 🟡 Etapa 7 — Notificaciones, háptica y multimedia

- [x] Integración de `expo-haptics`.
- [x] Háptica asociada al flujo real de promociones.
- [x] Integración de `expo-notifications`.
- [x] Notificación local disparada por el registro real de una promoción.
- [x] Validación funcional de notificaciones locales en Android.
- [ ] Determinación e implementación multimedia según corresponda al PRD.

### ⏳ Etapa 8 - API de la cátedra

- [ ] Integración de API.
- [ ] Reemplazo progresivo de mocks por servicios reales.
- [ ] Manejo de errores de comunicación.

### ⏳ Etapa 9 - Testing y revisión

- [x] Configuración de Jest con jest-expo.
- [x] Primera prueba unitaria sobre lógica propia.
- [x] Validación de horarios partidos.
- [x] Validación de comercio abierto por la mañana.
- [x] Validación de cierre durante el corte del mediodía.
- [x] Validación de reapertura por la tarde.
- [x] Validación de horario fuera de atención.
- [x] Validación de día sin horarios.
- [x] Pruebas unitarias del cálculo de distancias.
- [x] Pruebas unitarias del formato de distancias.
- [x] Verificación TypeScript con `npx tsc --noEmit`.
- [x] Verificación de código con `npm run lint`.
- [x] Pruebas unitarias de interpretación y validación de códigos QR.
- [ ] Pruebas de funcionalidades principales restantes.
- [ ] Pruebas de estados vacío y error.
- [ ] Pruebas de validaciones de formularios.
- [ ] Revisión integral de navegación.

### ⏳ Etapa 10 - Entrega final

- [ ] Ícono propio.
- [ ] Splash screen.
- [ ] Nombre definitivo de la aplicación.
- [ ] Build Android Preview.
- [ ] APK instalable.
- [ ] Pruebas en dispositivo físico.
- [ ] Preparación de defensa oral.

## Ejecución local del proyecto

Con Android Studio abierto y un emulador Android iniciado:

```bash
npm install
npx expo start
a

## Comprobar TypeScript:

npx tsc --noEmit

## Comprobar lint:

npm run lint

## Ejecutar pruebas:

npm test
```

## Credenciales de testeo

Email: "marta@mail.com"
Contraseña: 123456
Rol: Vecino

Email: "comercio@eltornillo.com"
Contraseña: 123456
Rol: Comerciante
