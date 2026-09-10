# DesarrolloparaMoviles2026
Aplicacion para la materia Desarrollo para Móviles, UNER.

OBJETIVO: 
● Desarrollar y entregar la versión final de la aplicación móvil que pidió el 
cliente en el PRD asignado al grupo, construida con React Native y Expo. 
La aplicación tiene que integrar servicios del dispositivo, consumo de la API 
de la cátedra, persistencia local y resguardo de credenciales, y entregarse 
como un build instalable, no como código para compilar. 
CONSIGNAS DE ENTREGA: 
1. Formato y modalidad 
a. Grupal, con los mismos integrantes declarados en la. 
b. Se carga en la sección correspondiente del Campus Virtual UNER, 
con estas dos cosas: 
i. 
ii. 
Link del build. APK de release generado con el perfil preview: 
eas build --platform android --profile preview. Tiene 
que poder instalarse y usarse sin Metro y sin la computadora 
de nadie. 
Código fuente. Repositorio Git (preferido) o archivo .zip. Incluir 
eas.json y app.json. No incluir node_modules. 
________________________________________________________________________ 

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
EJERCICIO: 
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
________________________________________________________________________ 

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
CONDICIONES DE APROBACIÓN: 
● El integrador se aprueba o no se aprueba: no lleva nota. Se aprueba 
cuando la app resuelve lo que pide el PRD, están los diez requisitos mínimos 
y todos los integrantes defendieron su parte. Una entrega que no llega se 
puede rehacer una vez.
