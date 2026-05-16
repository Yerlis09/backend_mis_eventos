# Mis Eventos — Backend MVP

Backend construido con **FastAPI**, **SQLModel**, **PostgreSQL**, **Alembic**, **JWT**, **Pytest** y **Docker**. Incluye sistema de roles RBAC (Admin, Organizer, Attendee) con control de acceso por rol y gestión de perfiles por administrador.

---

## Estructura del Proyecto

```
backend_mis_eventos/
├── app/
│   ├── main.py                        # Punto de entrada FastAPI + CORS
│   ├── api/
│   │   └── api_v1/
│   │       ├── endpoints/
│   │       │   ├── auth.py            # Registro y login
│   │       │   ├── events.py          # CRUD de eventos (con ownership)
│   │       │   ├── sessions.py        # CRUD de sesiones
│   │       │   ├── registrations.py   # Registro de asistentes
│   │       │   ├── admin.py           # Gestión de usuarios (solo admin)
│   │       │   └── health.py          # Health check
│   │       └── routes.py              # Enrutador principal v1
│   ├── core/
│   │   ├── config.py                  # Settings con Pydantic v2
│   │   ├── security.py                # Hashing bcrypt
│   │   ├── jwt.py                     # Generación de tokens JWT
│   │   ├── deps.py                    # Cadena de dependencias de auth
│   │   └── permissions.py             # Capa RBAC reutilizable
│   ├── db/
│   │   ├── models.py                  # Modelos SQLModel + UserRole enum
│   │   └── session.py                 # Engine y get_session
│   └── schemas/
│       ├── user.py                    # UserCreate, UserRead, UserRoleUpdate, UserActiveUpdate
│       ├── event.py                   # EventCreate/Read/Update, SessionCreate/Read/Update
│       ├── registration.py            # RegistrationRead
│       ├── pagination.py              # Page[T] — respuesta paginada genérica
│       └── token.py                   # Token JWT
├── tests/
│   ├── conftest.py                    # Fixtures: session, client, test_user, organizer, superuser
│   ├── test_auth.py                   # Tests de autenticación (11)
│   ├── test_events.py                 # Tests de eventos CRUD (13)
│   ├── test_sessions.py               # Tests de sesiones (14)
│   ├── test_registrations.py          # Tests de registros (9)
│   ├── test_admin.py                  # Tests de admin (6)
│   └── test_rbac.py                   # Tests de permisos RBAC (12)
├── alembic/
│   ├── env.py
│   └── versions/
│       ├── d9717679c952_initial_tables.py
│       ├── e3f2a1b5c8d0_add_unique_constraint_registration.py
│       ├── f1a2b3c4d5e6_add_role_to_user.py
│       └── a2b3c4d5e6f7_add_creator_id_to_event.py
├── entrypoint.sh                      # Ejecuta migraciones antes de arrancar uvicorn
├── Dockerfile
├── docker-compose.yml
├── pyproject.toml
├── alembic.ini
└── .env.example
```

---

## Características Implementadas

### Autenticación y Seguridad
- Registro de usuarios con validación de email y contraseña (min 8 / max 128 caracteres)
- Login con JWT (HS256) — payload incluye `sub`, `user_id` y `role`
- Hashing de contraseñas con bcrypt
- Cadena de dependencias: `get_current_user → get_current_active_user → get_current_superuser`

### Sistema de Roles RBAC
- `UserRole` enum con tres niveles: `attendee`, `organizer`, `admin`
- Capa de permisos reutilizable (`permissions.py`) con factory `require_roles(*roles)`
- Ownership de eventos: el organizer solo puede editar/borrar los eventos que creó

| Acción | Attendee | Organizer (propio) | Organizer (ajeno) | Admin |
|---|:---:|:---:|:---:|:---:|
| Ver eventos y sesiones | ✅ | ✅ | ✅ | ✅ |
| Registrarse a eventos | ✅ | ✅ | ✅ | ✅ |
| Crear eventos/sesiones | ❌ | ✅ | ✅ | ✅ |
| Editar / borrar evento | ❌ | ✅ | ❌ | ✅ |
| Gestión de usuarios | ❌ | ❌ | ❌ | ✅ |

### Gestión de Eventos
- CRUD completo con `creator_id` para control de ownership
- Búsqueda por nombre (`ilike`, case-insensitive)
- Paginación con `page` / `size` — respuesta `Page[EventRead]`
- Validación de status: `Literal["draft", "published", "cancelled"]`
- Validación de capacidad: `ge=0`

### Sesiones de Eventos
- CRUD anidado bajo `/events/{id}/sessions`
- Validación `start_datetime < end_datetime`
- Detección de solapamiento de horarios dentro del mismo evento
- Paginación con `page` / `size` — respuesta `Page[EventSessionRead]`

### Registro de Asistentes
- Registro con validación de capacidad máxima
- 409 Conflict para registro duplicado
- `UniqueConstraint` en DB como segunda línea de defensa
- Listado paginado de registros propios — `Page[RegistrationRead]`
- Cancelación de registro con validación de existencia

### Paginación
- Schema genérico `Page[T]` reutilizable en todos los endpoints de listado
- Parámetros: `page` (≥1) y `size` (≥1, max 100)
- Respuesta consistente en todos los endpoints:
```json
{
  "items": [...],
  "total": 15,
  "page": 1,
  "size": 10,
  "pages": 2
}
```

### Administración (solo admin)
- `GET /api/v1/admin/users` — listar usuarios paginados (`Page[UserRead]`)
- `GET /api/v1/admin/users/{id}` — perfil individual
- `PATCH /api/v1/admin/users/{id}/role` — cambiar rol
- `PATCH /api/v1/admin/users/{id}/active` — activar/desactivar usuario

### Testing
- **65/65 tests pasando** — cobertura **99%** sobre SQLite en memoria (sin dependencias externas)
- Fixtures: `test_user` (attendee), `organizer_user`, `superuser`, sus tokens y `inactive_user`
- Cobertura: auth, eventos, sesiones, registros, admin, RBAC y rutas de error (404, 401, 403)

---

## Instalación y Ejecución

### Opción 1: Docker (Recomendado)

```bash
# Construir imagen
docker compose build

# Levantar servicios (PostgreSQL + Backend)
# Las migraciones se aplican automáticamente al arrancar
docker compose up

# Backend: http://localhost:8000
# Swagger: http://localhost:8000/docs
```

> **Nota de puertos:** PostgreSQL está mapeado en `5433:5432` en el host para evitar conflictos
> con instalaciones locales de PostgreSQL. Dentro de Docker el backend usa `db:5432`.

### Opción 2: Local con Poetry

```bash
# Instalar dependencias
poetry install

# Configurar variables de entorno
cp .env.example .env
# Editar .env con tus valores

# Aplicar migraciones
poetry run alembic upgrade head

# Iniciar servidor
poetry run uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

---

## Variables de Entorno

```env
DATABASE_URL=postgresql+psycopg://miseventos:miseventos@localhost:5433/miseventos
SECRET_KEY=tu-clave-secreta-larga-y-aleatoria
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
```

---

## Consumo de APIs

> **Base URL:** `http://localhost:8000/api/v1`
>
> **Documentación interactiva:** `http://localhost:8000/docs` (Swagger UI)
>
> **Flujo obligatorio:** Registrar usuario → Login → usar el `access_token` en el header `Authorization: Bearer <token>`

---

### 1. Health Check

Verifica que el servidor está activo. No requiere autenticación.

```
GET /health
```

**Respuesta 200:**
```json
{ "status": "ok" }
```

---

### 2. Autenticación

#### 2.1 Registrar usuario

Todos los usuarios nuevos reciben el rol `attendee` por defecto.

```
POST /auth/register
```

**Body:**
```json
{
  "email": "yerlis@email.com",
  "password": "mipassword123",
  "full_name": "Yerlis Castellar"
}
```

**Respuesta 201:**
```json
{
  "id": 1,
  "email": "yerlis@email.com",
  "full_name": "Yerlis Castellar",
  "is_active": true,
  "role": "attendee"
}
```

**Errores:**
| Código | Motivo |
|---|---|
| 400 | Email ya registrado |
| 422 | Contraseña menor a 8 caracteres o email inválido |

---

#### 2.2 Login

```
POST /auth/login
```

**Body:**
```json
{
  "email": "yerlis@email.com",
  "password": "mipassword123"
}
```

**Respuesta 200:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer"
}
```

**Errores:**
| Código | Motivo |
|---|---|
| 401 | Credenciales incorrectas |
| 400 | Usuario inactivo |

> Guarda el `access_token`. Úsalo en todas las rutas protegidas:
> ```
> Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
> ```

---

### 3. Eventos

#### 3.1 Listar eventos

Endpoint público. Soporta búsqueda y paginación.

```
GET /events?page=1&size=10
GET /events?search=python&page=1&size=10
```

| Query param | Tipo | Default | Descripción |
|---|---|---|---|
| `page` | int ≥ 1 | 1 | Número de página |
| `size` | int 1-100 | 10 | Items por página |
| `search` | string | — | Filtra por nombre (case-insensitive) |

> **Importante:** la base de datos de Docker está vacía al inicio. Debes crear eventos primero antes de buscarlos.

**Respuesta 200:**
```json
{
  "items": [
    {
      "id": 1,
      "name": "Python Conference 2026",
      "description": "La mejor conferencia de Python",
      "capacity": 200,
      "status": "published",
      "creator_id": 2,
      "sessions": []
    }
  ],
  "total": 1,
  "page": 1,
  "size": 10,
  "pages": 1
}
```

---

#### 3.2 Ver evento por ID

Endpoint público.

```
GET /events/{id}
```

**Respuesta 200:**
```json
{
  "id": 1,
  "name": "Python Conference 2026",
  "description": "La mejor conferencia de Python",
  "capacity": 200,
  "status": "published",
  "creator_id": 2,
  "sessions": [
    {
      "id": 1,
      "title": "Apertura",
      "speaker": "John Doe",
      "start_datetime": "2026-06-01T09:00:00",
      "end_datetime": "2026-06-01T10:00:00",
      "capacity": 50
    }
  ]
}
```

**Errores:**
| Código | Motivo |
|---|---|
| 404 | Evento no encontrado |

---

#### 3.3 Crear evento

Requiere rol `organizer` o `admin`.

```
POST /events
Authorization: Bearer <token>
```

**Body:**
```json
{
  "name": "Python Conference 2026",
  "description": "La mejor conferencia de Python",
  "capacity": 200,
  "status": "draft"
}
```

| Campo | Tipo | Requerido | Valores válidos |
|---|---|---|---|
| `name` | string | ✅ | cualquier texto |
| `description` | string | ❌ | cualquier texto |
| `capacity` | int ≥ 0 | ✅ | número de cupos |
| `status` | string | ❌ | `draft`, `published`, `cancelled` |

**Respuesta 201:** objeto evento creado con `creator_id` asignado

**Errores:**
| Código | Motivo |
|---|---|
| 403 | Usuario con rol `attendee` |
| 422 | Capacidad negativa o status inválido |

---

#### 3.4 Actualizar evento

Solo el creador del evento o un `admin`. Todos los campos son opcionales.

```
PUT /events/{id}
Authorization: Bearer <token>
```

**Body (solo los campos a modificar):**
```json
{
  "name": "Python Conference 2026 — Edición especial",
  "status": "published",
  "capacity": 300
}
```

**Respuesta 200:** objeto evento actualizado

**Errores:**
| Código | Motivo |
|---|---|
| 403 | Organizer intentando editar el evento de otro organizer |
| 404 | Evento no encontrado |

---

#### 3.5 Eliminar evento

Solo el creador del evento o un `admin`.

```
DELETE /events/{id}
Authorization: Bearer <token>
```

**Respuesta 204:** sin body

**Errores:**
| Código | Motivo |
|---|---|
| 403 | No es el dueño ni admin |
| 404 | Evento no encontrado |

---

### 4. Sesiones

#### 4.1 Listar sesiones de un evento

Endpoint público.

```
GET /events/{id}/sessions?page=1&size=50
```

| Query param | Tipo | Default | Descripción |
|---|---|---|---|
| `page` | int ≥ 1 | 1 | Número de página |
| `size` | int 1-100 | 50 | Items por página |

**Respuesta 200:**
```json
{
  "items": [
    {
      "id": 1,
      "title": "Apertura",
      "speaker": "John Doe",
      "start_datetime": "2026-06-01T09:00:00",
      "end_datetime": "2026-06-01T10:00:00",
      "capacity": 50
    }
  ],
  "total": 1,
  "page": 1,
  "size": 50,
  "pages": 1
}
```

**Errores:**
| Código | Motivo |
|---|---|
| 404 | Evento no encontrado |

---

#### 4.2 Crear sesión

Requiere rol `organizer` o `admin`.

```
POST /events/{id}/sessions
Authorization: Bearer <token>
```

**Body:**
```json
{
  "title": "Keynote de apertura",
  "speaker": "John Doe",
  "start_datetime": "2026-06-01T09:00:00",
  "end_datetime": "2026-06-01T10:00:00",
  "capacity": 50
}
```

| Campo | Tipo | Requerido | Descripción |
|---|---|---|---|
| `title` | string | ✅ | Título de la sesión |
| `speaker` | string | ✅ | Nombre del ponente |
| `start_datetime` | datetime | ✅ | Inicio (ISO 8601) |
| `end_datetime` | datetime | ✅ | Fin (ISO 8601) — debe ser mayor a start |
| `capacity` | int ≥ 0 | ✅ | Cupos de la sesión |

**Respuesta 201:** objeto sesión creado

**Errores:**
| Código | Motivo |
|---|---|
| 400 | `start_datetime` ≥ `end_datetime` |
| 400 | Horario se solapa con otra sesión del mismo evento |
| 403 | Sin permisos |
| 404 | Evento no encontrado |

---

#### 4.3 Actualizar sesión

Requiere rol `organizer` o `admin`. Todos los campos son opcionales.

```
PUT /events/{id}/sessions/{session_id}
Authorization: Bearer <token>
```

**Body (solo los campos a modificar):**
```json
{
  "title": "Keynote principal",
  "start_datetime": "2026-06-01T09:30:00",
  "end_datetime": "2026-06-01T10:30:00"
}
```

**Respuesta 200:** objeto sesión actualizado

**Errores:**
| Código | Motivo |
|---|---|
| 400 | Horarios inválidos o solapamiento |
| 404 | Evento o sesión no encontrado |

---

#### 4.4 Eliminar sesión

Requiere rol `organizer` o `admin`.

```
DELETE /events/{id}/sessions/{session_id}
Authorization: Bearer <token>
```

**Respuesta 204:** sin body

**Errores:**
| Código | Motivo |
|---|---|
| 403 | Sin permisos |
| 404 | Evento o sesión no encontrado |

---

### 5. Registros de Asistentes

#### 5.1 Registrarse a un evento

Requiere usuario activo (cualquier rol). No lleva body.

```
POST /events/{id}/register
Authorization: Bearer <token>
```

**Respuesta 201:**
```json
{
  "id": 1,
  "user_id": 3,
  "event_id": 1,
  "registered_at": "2026-05-15T14:30:00"
}
```

**Errores:**
| Código | Motivo |
|---|---|
| 400 | Evento sin cupos disponibles |
| 404 | Evento no encontrado |
| 409 | Ya estás registrado a este evento |

---

#### 5.2 Ver mis registros

Devuelve los eventos a los que el usuario autenticado está inscrito.

```
GET /my-registrations?page=1&size=20
Authorization: Bearer <token>
```

| Query param | Tipo | Default | Descripción |
|---|---|---|---|
| `page` | int ≥ 1 | 1 | Número de página |
| `size` | int 1-100 | 20 | Items por página |

**Respuesta 200:**
```json
{
  "items": [
    {
      "id": 1,
      "user_id": 3,
      "event_id": 1,
      "registered_at": "2026-05-15T14:30:00"
    }
  ],
  "total": 1,
  "page": 1,
  "size": 20,
  "pages": 1
}
```

---

#### 5.3 Cancelar registro

Requiere usuario activo. No lleva body.

```
DELETE /events/{id}/unregister
Authorization: Bearer <token>
```

**Respuesta 204:** sin body

**Errores:**
| Código | Motivo |
|---|---|
| 404 | Evento no encontrado o no estás registrado |

---

### 6. Administración

Todos los endpoints de esta sección requieren rol `admin`.

#### 6.1 Asignar el primer admin (solo una vez)

El primer usuario admin debe asignarse directamente en la base de datos, ya que no existe aún ningún admin para hacer el cambio vía API.

```bash
# Con Docker
docker compose exec db psql -U miseventos -d miseventos \
  -c "UPDATE \"user\" SET role='admin' WHERE email='tu@email.com';"
```

Luego vuelve a hacer login para obtener un token con el nuevo rol.

---

#### 6.2 Listar usuarios

```
GET /admin/users?page=1&size=50
Authorization: Bearer <token_admin>
```

| Query param | Tipo | Default | Descripción |
|---|---|---|---|
| `page` | int ≥ 1 | 1 | Número de página |
| `size` | int 1-200 | 50 | Items por página |

**Respuesta 200:**
```json
{
  "items": [
    {
      "id": 1,
      "email": "yerlis@email.com",
      "full_name": "Yerlis Castellar",
      "is_active": true,
      "role": "attendee"
    }
  ],
  "total": 5,
  "page": 1,
  "size": 50,
  "pages": 1
}
```

**Errores:**
| Código | Motivo |
|---|---|
| 403 | No es admin |

---

#### 6.3 Ver perfil de un usuario

```
GET /admin/users/{id}
Authorization: Bearer <token_admin>
```

**Respuesta 200:**
```json
{
  "id": 3,
  "email": "organizer@email.com",
  "full_name": "Organizer User",
  "is_active": true,
  "role": "organizer"
}
```

**Errores:**
| Código | Motivo |
|---|---|
| 404 | Usuario no encontrado |

---

#### 6.4 Cambiar rol de un usuario

```
PATCH /admin/users/{id}/role
Authorization: Bearer <token_admin>
```

**Body:**
```json
{ "role": "organizer" }
```

| Valor | Descripción |
|---|---|
| `attendee` | Usuario estándar (solo lectura y registro) |
| `organizer` | Puede crear y gestionar sus propios eventos |
| `admin` | Acceso total al sistema |

**Respuesta 200:** objeto usuario con rol actualizado

**Errores:**
| Código | Motivo |
|---|---|
| 404 | Usuario no encontrado |
| 422 | Rol inválido |

---

#### 6.5 Activar o desactivar usuario

```
PATCH /admin/users/{id}/active
Authorization: Bearer <token_admin>
```

**Body:**
```json
{ "is_active": false }
```

**Respuesta 200:** objeto usuario actualizado

**Errores:**
| Código | Motivo |
|---|---|
| 404 | Usuario no encontrado |

---

### Códigos de respuesta HTTP

| Código | Significado |
|---|---|
| 200 | Consulta o actualización exitosa |
| 201 | Recurso creado exitosamente |
| 204 | Eliminación exitosa (sin body) |
| 400 | Regla de negocio violada (capacidad, horarios, usuario inactivo) |
| 401 | Token inválido o expirado |
| 403 | Token válido pero sin permisos para esa acción |
| 404 | Recurso no encontrado |
| 409 | Conflicto (registro duplicado) |
| 422 | Campo inválido según el schema Pydantic |

---

## Ejecutar Tests

```bash
# Todas las pruebas
poetry run pytest -v

# Con cobertura
poetry run pytest --cov=app --cov-report=term-missing

# Un módulo específico
poetry run pytest tests/test_rbac.py -v
```

---

## Migraciones (Alembic)

Las migraciones se aplican automáticamente en Docker. Para entorno local:

```bash
# Aplicar todas las migraciones
poetry run alembic upgrade head

# Ver estado actual
poetry run alembic current

# Historial de migraciones
poetry run alembic history

# Crear nueva migración
poetry run alembic revision --autogenerate -m "descripcion"
```

**Cadena de migraciones:**
1. `d9717679` — tablas iniciales
2. `e3f2a1b5` — UniqueConstraint en registration(user_id, event_id)
3. `f1a2b3c4` — columna `role` en user (server_default: attendee)
4. `a2b3c4d5` — columna `creator_id` en event (nullable, FK → user)
5. `b3c4d5e6` — eliminación de columna legada (RBAC completo)

---

## Arquitectura Técnica

| Componente | Tecnología |
|---|---|
| Framework | FastAPI 0.111 |
| ORM | SQLModel 0.0.22 (SQLAlchemy 2.0 + Pydantic v2) |
| Base de datos (prod) | PostgreSQL 16 |
| Base de datos (tests) | SQLite en memoria |
| Autenticación | JWT — python-jose |
| Hashing | bcrypt — passlib |
| Migraciones | Alembic 1.14 |
| Testing | pytest 8 + httpx |
| Contenedorización | Docker + Docker Compose |
| Python | 3.12 |

---

## Roles del Sistema

El sistema usa RBAC (Role-Based Access Control) puro. La autorización se basa **exclusivamente** en el campo `role` del usuario.

### ADMIN
- Acceso total a todos los endpoints
- Puede crear, editar y eliminar cualquier evento (propio o ajeno)
- Gestión completa de usuarios: ver perfiles, cambiar roles, activar/desactivar
- Único rol que puede acceder a `/api/v1/admin/*`

### ORGANIZER
- Puede crear eventos y sesiones
- Puede editar y eliminar únicamente los eventos que creó (`creator_id`)
- No tiene acceso a la gestión de usuarios

### ATTENDEE (rol por defecto)
- Puede ver eventos y sesiones (endpoints públicos)
- Puede registrarse y cancelar registro en eventos
- No puede crear ni modificar eventos ni sesiones

### Cadena de autorización

```
HTTPBearer
    └── get_current_user         (JWT válido + usuario existe)
            └── get_current_active_user   (is_active=True)
                    ├── require_organizer_or_admin  (role in {organizer, admin})
                    └── get_current_superuser       (role == admin)
```

---

## Estándares Aplicados

- Separación de responsabilidades en capas (models → schemas → endpoints → core)
- Pydantic v2 (`model_dump`, `SettingsConfigDict`, `Literal`, `Field(ge=0)`)
- Python 3.12 (`datetime.now(timezone.utc)`, `dict[str, Any]`, `list[T]` nativo)
- Validaciones en frontera de API (schemas) + integridad en DB (constraints)
- RBAC con factory de dependencias reutilizable y sin duplicar lógica de auth
- HTTP semánticamente correcto: 201 Created, 204 No Content, 409 Conflict, 403 Forbidden
- Migraciones aditivas y seguras (`server_default`, `nullable=True`)
- Tests independientes, sin estado compartido, sin mocks de DB

---

## Documentación Interactiva

Con el servidor corriendo:

- **Swagger UI:** `http://localhost:8000/docs`
- **ReDoc:** `http://localhost:8000/redoc`

---

## Autor

Yerlys Castellar — MVP backend para Mis Eventos.
