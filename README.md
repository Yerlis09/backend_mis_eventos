# Mis Eventos

Aplicación web Full Stack para la gestión y descubrimiento de eventos. Permite crear eventos, programar sesiones, registrar asistentes y administrar usuarios con un sistema de roles (Admin, Organizador, Asistente).

---

## Stack

| Capa | Tecnología |
|---|---|
| Backend | FastAPI · SQLModel · PostgreSQL · Alembic · JWT |
| Frontend | React 19 · TypeScript · Vite · Zustand · Axios |
| Infraestructura | Docker · Docker Compose |

---

## Levantar todo con Docker

Desde esta carpeta raíz, un solo comando levanta los tres servicios:

```bash
docker compose up --build
```

| Servicio | URL |
|---|---|
| Frontend | http://localhost:3000 |
| Backend API | http://localhost:8000 |
| Swagger UI | http://localhost:8000/docs |
| PostgreSQL | localhost:5433 |

Las migraciones de base de datos se aplican automáticamente al iniciar.

---

## Estructura del repositorio

```
pt_mis_eventos/
├── docker-compose.yml          # Orquesta db + backend + frontend
├── backend_mis_eventos/        # API REST (FastAPI)
│   └── README.md               # Configuración, endpoints y tests del backend
└── frontend_mis_eventos/       # Aplicación web (React)
    └── README.md               # Configuración, rutas y tests del frontend
```

---

## Documentación detallada

- [Backend →](backend_mis_eventos/README.md) instalación local, endpoints, variables de entorno, tests, migraciones
- [Frontend →](frontend_mis_eventos/README.md) instalación local, rutas, estado, variables de entorno, tests
