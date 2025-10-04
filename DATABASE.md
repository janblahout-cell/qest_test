# Database Setup - Quick Start Guide

This guide will help you set up the local PostgreSQL database using Docker.

## Prerequisites

- Docker Desktop installed and running
- Node.js 18+ installed

## Quick Start (3 steps)

### 1. Start the database

```bash
npm run db:up
```

This starts:
- **PostgreSQL** on `localhost:5432`
- **pgAdmin** on `localhost:5050` (optional GUI)

### 2. Run migrations

```bash
npm run db:migrate
```

This creates all database tables based on your Prisma schema.

### 3. (Optional) Seed test data

```bash
npm run db:seed
```

This creates a test user: `test@qest.cz`

## Database Scripts Reference

| Command | Description |
|---------|-------------|
| `npm run db:up` | Start Docker database containers |
| `npm run db:down` | Stop Docker containers |
| `npm run db:reset` | Reset database (down → up → migrate) |
| `npm run db:migrate` | Run Prisma migrations (development) |
| `npm run db:migrate:deploy` | Run migrations (production) |
| `npm run db:generate` | Generate Prisma Client |
| `npm run db:studio` | Open Prisma Studio (database GUI) |
| `npm run db:seed` | Seed database with test data |
| `npm run db:push` | Push schema changes without migration |

## Database Connection Details

From `docker-compose.yml`:

```
Host:     localhost
Port:     5432
Database: myapp_db
Username: myapp_user
Password: myapp_password
```

**Connection URL:**
```
postgresql://myapp_user:myapp_password@localhost:5432/myapp_db
```

## Using pgAdmin (Optional)

pgAdmin provides a web-based GUI for database management.

1. Open http://localhost:5050
2. Login with:
   - Email: `admin@qest.cz`
   - Password: `admin`
3. Add new server:
   - Host: `host.docker.internal` (Mac/Windows) or `172.17.0.1` (Linux)
   - Port: `5432`
   - Database: `myapp_db`
   - Username: `myapp_user`
   - Password: `myapp_password`

## Using Prisma Studio

Prisma Studio is a visual database editor:

```bash
npm run db:studio
```

Opens at http://localhost:5555

## Troubleshooting

### Port 5432 already in use

If you have another PostgreSQL instance running:

```bash
# Stop other PostgreSQL
brew services stop postgresql  # macOS
sudo service postgresql stop   # Linux

# Or change port in docker-compose.yml
ports:
  - '5433:5432'  # Use port 5433 instead

# Then update DATABASE_URL in .env
DATABASE_URL="postgresql://myapp_user:myapp_password@localhost:5433/myapp_db"
```

### Container fails to start

```bash
# Check container logs
docker compose logs postgres

# Remove old volumes and restart
docker compose down -v
docker compose up -d
```

### Migration fails

```bash
# Reset migrations
rm -rf prisma/migrations
npm run db:reset
```

### Can't connect to database

```bash
# Check if containers are running
docker compose ps

# Restart containers
npm run db:down
npm run db:up

# Wait a few seconds for PostgreSQL to initialize
sleep 5

# Try migration again
npm run db:migrate
```

## Data Persistence

Database data is stored in Docker volumes:
- `postgres_data` - Database files
- `pgadmin_data` - pgAdmin configuration

To completely reset (delete all data):

```bash
docker compose down -v  # -v flag removes volumes
npm run db:up
npm run db:migrate
npm run db:seed
```

## Production Considerations

For production, use a managed database service:
- **Vercel Postgres** (if deploying to Vercel)
- **Supabase**
- **Railway**
- **AWS RDS**
- **Google Cloud SQL**

Update `DATABASE_URL` in production environment variables.

## Schema Changes

When you modify `prisma/schema.prisma`:

```bash
# Create a new migration
npm run db:migrate

# Or push changes directly (development only)
npm run db:push
```

## Backup & Restore

### Backup

```bash
docker exec my-app-postgres pg_dump -U myapp_user myapp_db > backup.sql
```

### Restore

```bash
docker exec -i my-app-postgres psql -U myapp_user myapp_db < backup.sql
```

## Environment Variables

Database configuration is in `.env`:

```env
DATABASE_URL="postgresql://myapp_user:myapp_password@localhost:5432/myapp_db"
```

Never commit `.env` file to git (already in `.gitignore`).
