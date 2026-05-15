# Mis Eventos — Backend MVP

Backend profesional construido con **FastAPI**, **SQLModel**, **PostgreSQL**, **Alembic**, **JWT**, **Pytest** y **Docker**. Incluye sistema de roles RBAC (Admin, Organizer, Attendee) con control de acceso por rol y gestión de perfiles por administrador.

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
│       └── token.py                   # Token JWT
├── tests/
│   ├── conftest.py                    # Fixtures: session, client, test_user, organizer, superuser
│   ├── test_auth.py                   # Tests de autenticación (8)
│   ├── test_events.py                 # Tests de eventos CRUD (11)
│   ├── test_sessions.py               # Tests de sesiones (6)
│   ├── test_registrations.py          # Tests de registros (8)
│   ├── test_admin.py                  # Tests de admin (4)
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
- Backward-compatible: usuarios con `is_superuser=True` siempre pasan los checks de rol
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
- Paginación con `skip` / `limit`
- Validación de status: `Literal["draft", "published", "cancelled"]`
- Validación de capacidad: `ge=0`

### Sesiones de Eventos
- CRUD anidado bajo `/events/{id}/sessions`
- Validación `start_datetime < end_datetime`
- Detección de solapamiento de horarios dentro del mismo evento
- Paginación en listado

### Registro de Asistentes
- Registro con validación de capacidad máxima
- 409 Conflict para registro duplicado
- `UniqueConstraint` en DB como segunda línea de defensa
- Listado de registros propios
- Cancelación de registro con validación de existencia

### Administración (solo admin)
- `GET /api/v1/admin/users` — listar usuarios con paginación
- `GET /api/v1/admin/users/{id}` — perfil individual
- `PATCH /api/v1/admin/users/{id}/role` — cambiar rol
- `PATCH /api/v1/admin/users/{id}/active` — activar/desactivar usuario

### Testing
- **49/49 tests pasando** sobre SQLite en memoria (sin dependencias externas)
- Fixtures: `test_user` (attendee), `organizer_user`, `superuser`, sus tokens y `inactive_user`
- Cobertura: auth, eventos, sesiones, registros, admin y RBAC

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

## API Endpoints

### Health
| Método | Ruta | Auth | Descripción |
|---|---|---|---|
| GET | `/api/v1/health` | — | Estado del servicio |

### Autenticación
| Método | Ruta | Auth | Descripción |
|---|---|---|---|
| POST | `/api/v1/auth/register` | — | Registrar usuario (rol: attendee) |
| POST | `/api/v1/auth/login` | — | Obtener token JWT |

### Eventos
| Método | Ruta | Auth | Descripción |
|---|---|---|---|
| GET | `/api/v1/events` | — | Listar eventos (búsqueda + paginación) |
| GET | `/api/v1/events/{id}` | — | Obtener evento con sus sesiones |
| POST | `/api/v1/events` | organizer / admin | Crear evento |
| PUT | `/api/v1/events/{id}` | organizer-dueño / admin | Actualizar evento |
| DELETE | `/api/v1/events/{id}` | organizer-dueño / admin | Eliminar evento |

### Sesiones
| Método | Ruta | Auth | Descripción |
|---|---|---|---|
| GET | `/api/v1/events/{id}/sessions` | — | Listar sesiones |
| POST | `/api/v1/events/{id}/sessions` | organizer / admin | Crear sesión |
| PUT | `/api/v1/events/{id}/sessions/{sid}` | organizer / admin | Actualizar sesión |
| DELETE | `/api/v1/events/{id}/sessions/{sid}` | organizer / admin | Eliminar sesión |

### Registros
| Método | Ruta | Auth | Descripción |
|---|---|---|---|
| POST | `/api/v1/events/{id}/register` | activo | Registrarse a evento |
| GET | `/api/v1/my-registrations` | activo | Ver mis registros |
| DELETE | `/api/v1/events/{id}/unregister` | activo | Cancelar registro |

### Admin (solo admin)
| Método | Ruta | Descripción |
|---|---|---|
| GET | `/api/v1/admin/users` | Listar usuarios (paginado) |
| GET | `/api/v1/admin/users/{id}` | Perfil de usuario |
| PATCH | `/api/v1/admin/users/{id}/role` | Cambiar rol |
| PATCH | `/api/v1/admin/users/{id}/active` | Activar / desactivar |

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

Yerlys Castellar — MVP backend profesional para Mis Eventos.
