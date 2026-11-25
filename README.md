# Atlas RAM · App móvil

App en React Native (Expo SDK 58) del sistema de vigilancia de resistencia antimicrobiana **Atlas RAM**. Consume la API REST de [`atlas-ram-backend`](https://github.com/alvaroquispec-code/atlas-ram-backend).

| | |
|---|---|
| **APK (Android)** | https://github.com/alvaroquispec-code/atlas-ram-mobile/releases/latest/download/atlas-ram.apk |
| **API** | https://3-85-201-152.sslip.io/api/v1 |
| **Web** | https://atlas-ram-web.vercel.app |

**Cuentas de demostración.** Cualquiera puede crear una cuenta desde *Registrarse*; el servidor siempre le asigna el rol de solo lectura. Las cuentas con rol de laboratorio, epidemiología, farmacia o administración del despliegue público tienen una contraseña privada que se entrega a los evaluadores a pedido. En un entorno local, el seed del backend crea esas cuentas con la contraseña indicada en [`db/seed/CALIBRACION.md`](https://github.com/alvaroquispec-code/atlas-ram-backend/blob/main/db/seed/CALIBRACION.md).

## Integrantes y participación

El porcentaje indica cuánto cumplió cada integrante de sus responsabilidades en cada fase (100 % = cumplimiento completo).

| Integrante | Principales aportes | Fase 1 (API) | Fase 2 (web, móvil y despliegue) |
|---|---|:---:|:---:|
| Álvaro Felipe Quispe Carrillo | Modelo de dominio y lógica de la API; despliegue completo (AWS EC2, RDS, HTTPS con Caddy, Vercel, EAS); web: panel de resistencia, aislamientos, usuarios y catálogo; base de la app móvil | 100 % | 100 % |
| Joaquim Alexander Carrión Díaz | Fase 1: autenticación JWT con refresh tokens y autorización por rol (#5). Fase 2: web, con login y registro, cliente API con interceptores y rutas protegidas | 100 % | 100 % |
| Adriano Alonso Cosme Salazar | Fase 1: ingesta asíncrona de CSV, eventos de dominio y notificaciones (#8). Fase 2: app móvil, con escáner QR, registro de aislamientos y publicación del APK con EAS | 100 % | 100 % |
| Fabian Isaias Sanchez Zedano | Fase 1: excepciones propias, manejo global de errores y endpoints de la API (#6). No participó en la fase 2 | 100 % | 0 % |

## Funcionalidades

| Pantalla | Qué hace | Backend / sensores |
|---|---|---|
| Login y registro | Inicio de sesión con validación en tiempo real | `POST /auth/login`, `POST /auth/register`, `GET /auth/me` |
| Mi zona | Detecta tu distrito y muestra qué antibióticos fallan más ahí. Si el distrito no reúne 30 resultados por combinación (CLSI M39), muestra la resistencia de los **hospitales donde se atienden sus pacientes** (`GET /antibiogram/referral`) y, si ni así alcanza, la de Lima y Callao. Nunca inventa un porcentaje con pocos casos. El selector manual de distrito tiene buscador (ignora tildes y mayúsculas) | **GPS** (expo-location) + **Nominatim** (API externa) + `GET /antibiogram?districtId=` |
| Tratamiento | El médico elige el síndrome (bacteriemia, urinaria, respiratoria, piel, meningitis) y ve la probabilidad de que cada esquema empírico cubra el germen, con su intervalo creíble al 95 % y la probabilidad de ser el mejor (WISCA bayesiano). Es apoyo a la decisión, no una indicación | `GET /antibiogram/wisca` |
| Alertas | Alertas de brote de los hospitales del usuario: % resistente de las últimas 4 semanas frente a los 12 meses previos y valor p. Solo la ven técnicos, epidemiólogos y administradores (la pestaña se oculta para el resto); deslizar hacia abajo recarga | `GET /alerts?status` |
| Aislamientos | Lista con scroll infinito; filtros combinables por microorganismo y tipo de muestra, orden por fecha e "Ir al aislamiento N.º"; agitar el teléfono recarga | `GET /isolates?page&size&sort&microorganismId&specimen` + **acelerómetro** (expo-sensors) |
| Detalle | Datos del aislamiento y su antibiograma; un ADMIN puede eliminarlo | `GET /isolates/{id}`, `GET /isolates/{id}/results`, `DELETE /isolates/{id}` |
| Escanear | Lee el QR de la etiqueta de la muestra y abre su detalle | **Cámara** (expo-camera) |
| Registrar | Formulario para técnicos de laboratorio | `POST /isolates` |
| Perfil | Datos del usuario y cierre de sesión | — |

Cada sensor tiene una alternativa: si niegas el GPS eliges el distrito a mano, si no hay cámara escribes el número del aislamiento, y si no hay acelerómetro se recarga deslizando hacia abajo.

## Arquitectura

```
src/
  app/          pantallas (expo-router: cada archivo es una ruta)
  components/   UI reutilizable (Button, TextField, ChipSelect, IsolateCard…)
  contexts/     AuthContext (sesión) y ToastContext (mensajes)
  hooks/        useAuth, useFetch, usePaginatedList, useForm, useShake, useCurrentDistrict
  services/     apiClient (axios + interceptores), servicios por recurso, Nominatim
  types/        tipos de la API
  utils/        errores, validadores, etiquetas, tema
```

- **Tokens:** se guardan cifrados con `expo-secure-store`. El interceptor de request agrega `Authorization: Bearer`. El de response renueva el token con `/auth/refresh` ante un 401 y repite la petición.
- **Rutas protegidas:** `Stack.Protected` en `src/app/_layout.tsx`.
- **Errores:** `utils/apiError.ts` traduce cada código HTTP, timeout o falta de conexión a un mensaje claro. Las pantallas muestran carga, error con *Reintentar* y estados vacíos. Además, un `GET` que falla por red, timeout o 5xx se reintenta solo hasta 2 veces con espera exponencial (500 ms y 1 s); los `POST` y `DELETE` no, para no duplicar registros.

## Correr en local

```bash
npm install
cp .env.example .env      # y pon la URL del backend
npx expo start            # escanea el QR con Expo Go
```

`EXPO_PUBLIC_API_URL` apunta al backend. En `.env` va la URL para desarrollo; para los builds está en `eas.json`.

Para probar el escáner, abre `docs/qr-demo.png` en otra pantalla y apunta la cámara.

## Publicación

```bash
npx eas-cli@latest login
npx eas-cli@latest build -p android --profile preview   # genera un APK instalable
```
