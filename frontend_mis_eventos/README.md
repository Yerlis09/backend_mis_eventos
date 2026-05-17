# Mis Eventos — Frontend

Aplicación web para la gestión y descubrimiento de eventos. Construida con **React 19**, **TypeScript** y **Vite**, consume la API REST del backend FastAPI mediante JWT.

---

## Tecnologías principales

| Categoría | Librería / Herramienta |
|---|---|
| Framework UI | React 19 + TypeScript |
| Build tool | Vite 8 |
| Routing | React Router v7 (lazy loading + Suspense) |
| Estado global | Zustand 5 (con `persist` middleware) |
| HTTP client | Axios (interceptores JWT automáticos) |
| Estilos | CSS Modules + Custom Properties (design tokens) |
| Scroll suave | Lenis |
| Testing | Vitest + Testing Library + MSW v2 |
| Cobertura | @vitest/coverage-v8 |

---

## Características implementadas

### Autenticación
- Login y registro con formulario de doble pestaña
- JWT almacenado en `localStorage`, adjuntado automáticamente a cada request
- Perfil del usuario obtenido desde `GET /auth/me` tras el login
- Logout limpia store y `localStorage`

### Eventos
- Listado paginado con búsqueda en tiempo real (debounce 400 ms)
- Vista de detalle con hero de imagen, stats strip y agenda de sesiones (timeline)
- Formulario de creación/edición con validación
- Eliminación con confirmación (solo admin/organizer propietario)

### Sesiones
- CRUD completo desde la vista de detalle
- Modal con validación de fechas (inicio < fin)
- Actualización optimista del estado local (sin refetch)

### Registro a eventos
- Reservar / cancelar entrada con toast de confirmación
- Estado derivado del hook `useRegisterEvent`

### Panel de administración
- Tabla de usuarios con paginación
- Cambio de rol por select (attendee / organizer / admin)
- Toggle de activación por checkbox
- Acceso restringido: redirige si el rol no es `admin`

### UI / UX
- Navbar fija transparente en home, glassmorphism al hacer scroll
- Avatar dropdown: al hacer clic muestra nombre, email, rol traducido y botón "Cerrar sesión". Se cierra al hacer clic fuera
- Skeleton loader en la vista de detalle (shimmer + scan line animados)
- Sistema de toasts (bottom-right, 4 tipos: success / error / info / warning)
- Scroll suave con Lenis en la homepage
- Contadores animados con easing cuártico
- Marquee de categorías de eventos
- Partículas en canvas en el hero
- Texto gigante de fondo en el hero
- Compartir por WhatsApp + copiar enlace con feedback visual

---

## Estructura del proyecto

```
src/
├── api/               # Clientes HTTP (auth, events, sessions, registrations, admin)
├── components/
│   ├── EventCard/
│   ├── Marquee/
│   ├── NavBar/
│   ├── ParticleCanvas/
│   ├── SessionCard/
│   ├── SessionFormModal/
│   ├── Toast/
│   └── ui/
│       ├── Badge/
│       └── Pagination/
├── hooks/             # useAuth, useEvents, useRegistrations, useAdmin, useDebounce, useCounter, useLenis, useScrollReveal
├── pages/
│   ├── AdminPanel/
│   ├── EventDetail/
│   ├── EventForm/
│   ├── EventsList/
│   ├── Home/
│   ├── Login/
│   └── MyRegistrations/
├── router/            # Rutas lazy con Suspense + guards RequireAuth / RequireAdmin
├── store/             # authStore, eventsStore, toastStore (Zustand)
├── test/              # setup.ts, server.ts (MSW), handlers.ts
├── types/             # index.ts — todas las interfaces TypeScript
└── utils/             # eventImages.ts
```

---

## Docker (recomendado para evaluación)

Desde la raíz del repositorio, levanta todos los servicios con un solo comando:

```bash
docker compose up --build
```

| Servicio | URL |
|---|---|
| Frontend | http://localhost:3000 |
| Backend API | http://localhost:8000 |
| Docs Swagger | http://localhost:8000/docs |

> La imagen del frontend se construye con `VITE_API_URL=http://localhost:8000/api/v1`
> apuntando al backend expuesto en el host. No se requiere configuración adicional.

---

## Requisitos previos (desarrollo local)

- Node.js >= 18
- Backend `backend_mis_eventos` corriendo en `http://localhost:8000`

---

## Instalación y puesta en marcha

```bash
# 1. Instalar dependencias
npm install

# 2. Crear archivo de entorno
cp .env.example .env

# 3. Arrancar en desarrollo
npm run dev
```

La app quedará disponible en `http://localhost:5173`.

---

## Variables de entorno

Copia el archivo de ejemplo y ajusta si es necesario:

```bash
cp .env.example .env
```

| Variable | Valor por defecto | Descripción |
|---|---|---|
| `VITE_API_URL` | `http://localhost:8000/api/v1` | URL base de la API REST del backend |

El cliente Axios (`src/api/client.ts`) lee `VITE_API_URL` para construir la URL base.

---

## Scripts disponibles

| Comando | Descripción |
|---|---|
| `npm run dev` | Servidor de desarrollo con HMR |
| `npm run build` | Compilación TypeScript + Vite para producción |
| `npm run preview` | Previsualizar el build de producción |
| `npm run lint` | Linter ESLint |
| `npm test` | Ejecutar todos los tests una sola vez |
| `npm run test:watch` | Tests en modo watch (re-ejecuta al guardar) |
| `npm run coverage` | Reporte de cobertura con v8 |

---

## Testing

La suite cubre **146 tests** en **22 archivos** organizados por capa:

```
src/
├── api/
│   ├── auth.test.ts
│   ├── events.test.ts
│   ├── sessions.test.ts
│   ├── registrations.test.ts
│   └── admin.test.ts
├── store/
│   ├── authStore.test.ts
│   └── toastStore.test.ts
├── hooks/
│   ├── useAuth.test.ts
│   ├── useCounter.test.ts
│   ├── useDebounce.test.ts
│   ├── useEvents.test.ts
│   ├── useAdmin.test.ts
│   └── useRegistrations.test.ts
└── components/
    ├── ui/Badge/Badge.test.tsx
    ├── ui/Pagination/Pagination.test.tsx
    ├── EventCard/EventCard.test.tsx
    ├── NavBar/NavBar.test.tsx
    ├── Toast/ToastContainer.test.tsx
    ├── SessionFormModal/SessionFormModal.test.tsx
    ├── Login/LoginPage.test.tsx
    ├── EventsList/EventsListPage.test.tsx
    └── AdminPanel/AdminPage.test.tsx
```

### Infraestructura de tests

- **MSW v2** intercepta todas las llamadas HTTP en el entorno Node — no hay llamadas reales al backend durante los tests
- `src/test/handlers.ts` define los handlers mock para todos los endpoints
- `src/test/setup.ts` inicializa `@testing-library/jest-dom` y el ciclo de vida del servidor MSW (`beforeAll / afterEach / afterAll`)
- `vitest.config` usa `jsdom` como entorno y habilita globals (`describe`, `it`, `expect` sin imports)

```bash
# Ejecutar y ver cobertura en terminal
npm run coverage
```

---

## Sistema de roles

| Rol | Permisos en el frontend |
|---|---|
| `attendee` | Ver eventos, registrarse, ver sus registros |
| `organizer` | Lo anterior + crear/editar/eliminar sus propios eventos y sesiones |
| `admin` | Todo lo anterior + panel de administración de usuarios |

La UI oculta/muestra elementos según `user.role` leído desde el store de Zustand.

---

## Protección de rutas

Las rutas que requieren sesión están protegidas en el router con componentes guard que redirigen antes de renderizar la página:

| Guard | Rutas protegidas | Comportamiento si no cumple |
|---|---|---|
| `RequireAuth` | `/events/new`, `/events/:id/edit`, `/my-registrations` | Redirige a `/login` |
| `RequireAdmin` | `/admin` | Redirige a `/login` (si no autenticado) o `/` (si no es admin) |

Ambos guards leen `useAuthStore` — sin librerías adicionales, sin duplicar lógica de auth.

---

## Arquitectura de estado

```
authStore  (persiste en localStorage)
  ├── token, user, isAuthenticated
  └── setAuth() / setUser() / logout()

eventsStore
  ├── eventsPage, searchQuery, currentPage
  └── setEventsPage() / setSearchQuery() / setCurrentPage() / reset()

toastStore
  ├── toasts[]
  ├── push(message, type, duration) / remove(id)
  └── toast.success() / .error() / .info() / .warning()  ← helper de módulo
```

---

## Convenciones de código

- **CSS Modules** para todos los estilos — sin clases globales de utilidad
- **Design tokens** como CSS custom properties en `index.css` (`--color-primary`, `--space-md`, `--radius-lg`, etc.)
- **Lazy loading** en todas las rutas — el bundle inicial es mínimo
- **Actualización optimista** en sesiones: las mutaciones actualizan estado local sin refetch
- **Debounce** de 400 ms en el buscador de eventos para reducir requests al backend

---

## Conexión con el backend

El interceptor de Axios adjunta `Authorization: Bearer <token>` automáticamente en cada request si existe token en `localStorage`.

### Endpoints consumidos

| Método | Endpoint | Descripción |
|---|---|---|
| `POST` | `/auth/login` | Login |
| `POST` | `/auth/register` | Registro de usuario |
| `GET` | `/auth/me` | Perfil del usuario autenticado |
| `GET` | `/events` | Listado paginado + búsqueda (`?search=&page=&size=`) |
| `GET` | `/events/:id` | Detalle de evento |
| `POST` | `/events` | Crear evento |
| `PUT` | `/events/:id` | Editar evento |
| `DELETE` | `/events/:id` | Eliminar evento |
| `GET` | `/events/:id/sessions` | Sesiones de un evento |
| `POST` | `/events/:id/sessions` | Crear sesión |
| `PUT` | `/events/:id/sessions/:sid` | Editar sesión |
| `DELETE` | `/events/:id/sessions/:sid` | Eliminar sesión |
| `POST` | `/events/:id/register` | Registrarse a un evento |
| `DELETE` | `/events/:id/unregister` | Cancelar registro |
| `GET` | `/my-registrations` | Registros del usuario autenticado |
| `GET` | `/admin/users` | Listado de usuarios (solo admin) |
| `PATCH` | `/admin/users/:id/role` | Cambiar rol de usuario |
| `PATCH` | `/admin/users/:id/active` | Activar / desactivar usuario |
