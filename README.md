# Yépez Rehab Backend

Backend del sistema web interno de gestión de citas para Yépez Rehab Center.

## Tecnologías

- NestJS
- TypeORM
- PostgreSQL
- Docker
- JWT
- bcrypt
- GitHub Actions

## Requisitos

- Node.js 20
- npm
- Docker Desktop
- PostgreSQL mediante Docker

## Variables de entorno

Crear un archivo `.env` en la raíz del proyecto.

```env
APP_PORT=3000
NODE_ENV=development

DB_HOST=localhost
DB_PORT=5433
DB_USERNAME=postgres
DB_PASSWORD=root
DB_DATABASE=yepez_rehab_db

JWT_SECRET=change_this_secret_dev
JWT_EXPIRES_IN=1d

ADMIN_FIRST_NAME=Steven
ADMIN_LAST_NAME=Alama
ADMIN_EMAIL=admin@yepezrehab.com
ADMIN_PASSWORD=Admin123*
