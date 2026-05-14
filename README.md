# Mis Eventos - Backend MVP

Backend profesional y listo para producción usando **FastAPI**, **SQLModel**, **PostgreSQL**, **Alembic**, **JWT**, **Pytest**, y **Docker**.

## Estructura del Proyecto

```
backend_mis_eventos/
├── app/
│   ├── __init__.py
│   ├── main.py                    # Punto de entrada FastAPI
│   ├── api/                       # Enrutadores por versión
│   │   └── api_v1/
│   │       ├── endpoints/
│   │       │   ├── auth.py        # Registro y login
│   │       │   ├── events.py      # CRUD de eventos
│   │       │   ├── sessions.py    # Gestión de sesiones
│   │       │   ├── registrations.py # Registro de asistentes
│   │       │   └── health.py      # Health check
│   │       └── routes.py          # Enrutador principal
│   ├── core/
│   │   ├── config.py              # Settings (Pydantic)
│   │   ├── security.py            # Hashing y verificación
│   │   ├── jwt.py                 # Generación de JWT
│   │   └── deps.py                # Dependencias (auth, db)
│   ├── db/
│   │   ├── base.py                # Base model
│   │   ├── models.py              # Modelos SQLModel
│   │   └── session.py             # Engine y sesiones
│   └── schemas/                   # DTOs (request/response)
│       ├── user.py                # User schemas
│       ├── event.py               # Event schemas
│       ├── registration.py        # Registration schemas
│       └── token.py               # Token schema
├── tests/
│   ├── conftest.py                # Fixtures pytest compartidas
│   ├── test_auth.py               # Tests de autenticación
│   ├── test_events.py             # Tests de eventos
│   ├── test_sessions.py           # Tests de sesiones
│   └── test_registrations.py      # Tests de registros
├── alembic/                       # Migraciones de BD
│   ├── env.py                     # Configuración Alembic
│   └── versions/                  # Versiones de migraciones
├── pyproject.toml                 # Dependencias Poetry
├── Dockerfile                     # Imagen Docker
├── docker-compose.yml             # Orquestación Docker
├── .env.example                   # Variables de entorno
├── .gitignore                     # Archivos ignorados
└── alembic.ini                    # Configuración Alembic

```

## Características Implementadas

### ✅ Autenticación (Auth)
- Registro de usuarios con validación de email
- Login con JWT (HS256)
- Hashing de contraseñas con bcrypt
- Protección de rutas con autenticación

### ✅ Gestión de Eventos
- CRUD completo (crear, leer, actualizar, eliminar)
- Búsqueda por nombre
- Paginación (skip, limit)
- Validación de capacidad
- Estados de evento (draft, published, etc.)

### ✅ Programación de Sesiones
- Crear y gestionar sesiones dentro de eventos
- Validación de horarios (no solapamiento)
- Asignación de ponentes
- Control de capacidad por sesión

### ✅ Registro de Asistentes
- Registro a eventos con validación de capacidad
- Prevención de registros duplicados
- Listar eventos a los que el usuario está registrado
- Cancelación de registros

### ✅ Testing
- Pruebas unitarias con pytest
- Fixtures compartidas (conftest.py)
- BD SQLite en memoria para tests
- Cobertura de casos críticos

## Instalación y Ejecución

### Opción 1: Con Docker (Recomendado)

```bash
# Compilar imagen
docker-compose build

# Ejecutar servicios (Backend + PostgreSQL)
docker-compose up

# Backend estará en http://localhost:8000
# API docs en http://localhost:8000/docs
```

### Opción 2: Local con Poetry

```bash
# Instalar dependencias
poetry install

# Configurar variables de entorno
cp .env.example .env
# Editar .env con tus valores

# Ejecutar servidor
poetry run uvicorn app.main:app --reload

# Ejecutar tests
poetry run pytest
```

## Variables de Entorno

```env
DATABASE_URL=postgresql+psycopg://user:password@localhost:5432/miseventos
SECRET_KEY=tu-clave-secreta-cambiar-en-produccion
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
```

## API Endpoints

### Health Check
- `GET /api/v1/health` — Verificar disponibilidad

### Autenticación
- `POST /api/v1/auth/register` — Registrar usuario
- `POST /api/v1/auth/login` — Obtener token JWT

### Eventos
- `GET /api/v1/events` — Listar eventos (con búsqueda y paginación)
- `GET /api/v1/events/{id}` — Obtener evento
- `POST /api/v1/events` — Crear evento (requiere auth)
- `PUT /api/v1/events/{id}` — Actualizar evento (requiere auth)
- `DELETE /api/v1/events/{id}` — Eliminar evento (requiere auth)

### Sesiones
- `GET /api/v1/events/{id}/sessions` — Listar sesiones de un evento
- `POST /api/v1/events/{id}/sessions` — Crear sesión (requiere auth)
- `PUT /api/v1/events/{id}/sessions/{sid}` — Actualizar sesión (requiere auth)
- `DELETE /api/v1/events/{id}/sessions/{sid}` — Eliminar sesión (requiere auth)

### Registros de Asistentes
- `POST /api/v1/events/{id}/register` — Registrarse a evento (requiere auth)
- `GET /api/v1/my-registrations` — Ver mis registros (requiere auth)
- `DELETE /api/v1/events/{id}/unregister` — Cancelar registro (requiere auth)

## Documentación Interactiva

Una vez que el servidor esté ejecutándose, accede a:
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

## Ejecutar Pruebas

```bash
# Todas las pruebas
poetry run pytest

# Con cobertura
poetry run pytest --cov=app

# Verbose
poetry run pytest -v

# Un archivo específico
poetry run pytest tests/test_auth.py -v
```

## Migraciones de BD (Alembic)

```bash
# Crear una nueva migración
poetry run alembic revision --autogenerate -m "descripción"

# Aplicar migraciones
poetry run alembic upgrade head

# Ver estado
poetry run alembic current
```

## Arquitectura Técnica

- **Framework**: FastAPI
- **Base de Datos**: PostgreSQL (producción), SQLite (tests)
- **ORM**: SQLModel (SQLAlchemy 2.0 + Pydantic)
- **Autenticación**: JWT (python-jose)
- **Hashing**: bcrypt (passlib)
- **Migraciones**: Alembic
- **Testing**: pytest + httpx
- **Contenedorización**: Docker + Docker Compose

## Estándares Aplicados

- ✅ Separación de responsabilidades (capas clean)
- ✅ Validaciones de negocio robustas
- ✅ Manejo de errores consistente
- ✅ Tipado fuerte con Python 3.11+
- ✅ Código mantenible y documentado
- ✅ Tests unitarios y de integración
- ✅ Listo para producción MVP

## Autor

Desarrollado como MVP profesional siguiendo prácticas de ingeniería backend senior.
