# Quick Start Guide - Step by Step

Get your calendar consent app running in 5 minutes.

## Prerequisites

- ✅ Node.js 18+ installed
- ✅ Docker Desktop installed and running
- ✅ Google Cloud account (for OAuth credentials)

## Step 1: Start the Database (2 minutes)

### 1.1 Start Docker containers

```bash
npm run db:up
```

This starts PostgreSQL and pgAdmin. Wait ~10 seconds for containers to initialize.

### 1.2 Verify database is running

```bash
docker ps
```

You should see:
- `my-app-postgres` (running)
- `my-app-pgadmin` (running)

### 1.3 Run database migrations

```bash
npm run db:migrate
```

When prompted, enter a migration name (e.g., `init`)

**Expected output:**
```
✔ Enter a name for the new migration: … init
Applying migration `20241004_init`
Your database is now in sync with your schema.
```

### 1.4 (Optional) Add test data

```bash
npm run db:seed
```

**Expected output:**
```
🌱 Seeding database...
✅ Created test user: test@qest.cz
🌱 Seeding completed!
```

## Step 2: Set Up Google OAuth (5 minutes)

### 2.1 Go to Google Cloud Console

1. Visit: https://console.cloud.google.com/
2. Create new project or select existing one
3. Project name: "Calendar Consent App" (or your choice)

### 2.2 Enable Google Calendar API

1. Go to: **APIs & Services** → **Library**
2. Search: "Google Calendar API"
3. Click **Enable**

### 2.3 Create OAuth Credentials

1. Go to: **APIs & Services** → **Credentials**
2. Click: **Create Credentials** → **OAuth client ID**
3. If prompted, configure OAuth consent screen:
   - User Type: **Internal** (for @qest.cz domain) or **External**
   - App name: "Calendar Consent App"
   - User support email: your email
   - Developer contact: your email
   - Scopes: Add **Google Calendar API** → `.../auth/calendar.events`
   - Save and continue

4. Create OAuth Client ID:
   - Application type: **Web application**
   - Name: "Calendar Consent App"
   - Authorized redirect URIs:
     ```
     http://localhost:3000/api/auth/callback/google
     ```
   - Click **Create**

5. **Copy the credentials:**
   - Client ID: `955710215940-...apps.googleusercontent.com`
   - Client Secret: `GOCSPX-...`

### 2.4 Update your .env file

Your `.env` already has these values, but **replace them** with your actual credentials:

```env
GOOGLE_CLIENT_ID="YOUR_ACTUAL_CLIENT_ID"
GOOGLE_CLIENT_SECRET="YOUR_ACTUAL_CLIENT_SECRET"
```

## Step 3: Generate Prisma Client (30 seconds)

```bash
npm run db:generate
```

**Expected output:**
```
✔ Generated Prisma Client
```

## Step 4: Start the Application (10 seconds)

```bash
npm run dev
```

**Expected output:**
```
▲ Next.js 15.5.4
- Local:        http://localhost:3000
- Ready in 2.3s
```

## Step 5: Test the Application (1 minute)

### 5.1 Open the consent page

```bash
open http://localhost:3000/consent
```

Or visit: http://localhost:3000/consent in your browser

### 5.2 Click "Connect with Google"

You should see Google OAuth screen asking for:
- ✅ Access to your email
- ✅ Access to your calendar

### 5.3 Sign in with @qest.cz email

**Important:** Only emails ending with `@qest.cz` are allowed!

### 5.4 Verify in database

```bash
npm run db:studio
```

This opens Prisma Studio at http://localhost:5555

**Check:**
- Navigate to **User** table
- You should see your user with:
  - `calendarConsent: true`
  - `googleAccessToken` (long string)
  - `googleRefreshToken` (long string)
  - `consentGrantedAt` (timestamp)

## Step 6: Test the API Endpoint (30 seconds)

### 6.1 Get your API key from .env

```bash
cat .env | grep API_SECRET_KEY
```

Copy the value (e.g., `my-super-secret-automation-key-123`)

### 6.2 Test the tokens API

Replace `YOUR_EMAIL` and `YOUR_API_KEY`:

```bash
curl "http://localhost:3000/api/user/YOUR_EMAIL@qest.cz/tokens?apiKey=YOUR_API_KEY"
```

**Example:**
```bash
curl "http://localhost:3000/api/user/john@qest.cz/tokens?apiKey=my-super-secret-automation-key-123"
```

**Expected response:**
```json
{
  "email": "john@qest.cz",
  "name": "John Doe",
  "accessToken": "ya29.a0AfB_byD...",
  "refreshToken": "1//0gQ3X...",
  "hasConsent": true,
  "consentGrantedAt": "2024-10-04T10:30:00.000Z"
}
```

## ✅ You're Done!

Your app is now fully functional:
- ✅ Database running
- ✅ Google OAuth configured
- ✅ Users can grant consent
- ✅ Tokens stored in database
- ✅ API ready for Zapier/n8n

## Common Issues & Solutions

### Issue 1: "Port 5432 already in use"

**Solution:** Another PostgreSQL is running

```bash
# Stop other PostgreSQL
brew services stop postgresql  # macOS
sudo service postgresql stop   # Linux

# Or change port in docker-compose.yml
ports:
  - '5433:5432'  # Use 5433 instead

# Update .env
DATABASE_URL="postgresql://myapp_user:myapp_password@localhost:5433/myapp_db"
```

### Issue 2: "Cannot connect to database"

**Solution:** Docker not running

```bash
# Check if Docker is running
docker ps

# If not, start Docker Desktop
# Then restart database
npm run db:down
npm run db:up
```

### Issue 3: "Google OAuth error: redirect_uri_mismatch"

**Solution:** Redirect URI not configured

1. Go to Google Cloud Console
2. Credentials → Edit your OAuth client
3. Add **exact** redirect URI:
   ```
   http://localhost:3000/api/auth/callback/google
   ```
4. Save and try again

### Issue 4: "User email does not match @qest.cz"

**Solution:** Email domain restriction

- Only `@qest.cz` emails are allowed
- To test with different domain, edit `auth.ts:27`
- Change: `if (!email?.endsWith("@qest.cz"))`
- To: `if (!email?.endsWith("@yourdomain.com"))`

### Issue 5: "Prisma Client not found"

**Solution:** Generate Prisma Client

```bash
npm run db:generate
```

### Issue 6: Database tables don't exist

**Solution:** Run migrations

```bash
npm run db:migrate
```

## Useful Commands

```bash
# Start database
npm run db:up

# Stop database
npm run db:down

# Reset everything (database + migrations)
npm run db:reset

# Open database GUI
npm run db:studio

# View database logs
docker logs my-app-postgres

# Check running containers
docker ps

# Start app
npm run dev
```

## Next Steps

### For Development:
- Customize the consent page (`/app/consent/page.tsx`)
- Add more user fields to schema
- Test API endpoints with Postman

### For Production:
- Deploy to Vercel/Railway/Fly.io
- Use production PostgreSQL (not Docker)
- Update `NEXTAUTH_URL` to production domain
- Add production redirect URI to Google Console
- Rotate `API_SECRET_KEY`

### For Automation:
- See `AUTOMATION.md` for Zapier/n8n integration
- Set up webhook endpoints
- Configure calendar event templates

## Database Management

### View data in pgAdmin (optional):

1. Open: http://localhost:5050
2. Login:
   - Email: `admin@qest.cz`
   - Password: `admin`
3. Add server:
   - Host: `host.docker.internal` (Mac/Windows)
   - Port: `5432`
   - Database: `myapp_db`
   - Username: `myapp_user`
   - Password: `myapp_password`

### Backup database:

```bash
docker exec my-app-postgres pg_dump -U myapp_user myapp_db > backup.sql
```

### Restore database:

```bash
docker exec -i my-app-postgres psql -U myapp_user myapp_db < backup.sql
```

## Support

If you run into issues:
1. Check this guide first
2. Look at error messages carefully
3. Review `DATABASE.md` for database issues
4. Review `AUTOMATION.md` for API integration

## Architecture Overview

```
┌─────────────────┐
│  User Browser   │
│  /consent page  │
└────────┬────────┘
         │ 1. Click "Connect"
         ▼
┌─────────────────┐
│  Google OAuth   │
│  Authorization  │
└────────┬────────┘
         │ 2. Grant permissions
         ▼
┌─────────────────┐
│   Next.js App   │
│    auth.ts      │
└────────┬────────┘
         │ 3. Save tokens
         ▼
┌─────────────────┐
│   PostgreSQL    │
│   (Docker)      │
└────────┬────────┘
         │ 4. Tokens stored
         ▼
┌─────────────────┐
│  API Endpoint   │
│  /api/user/...  │
└────────┬────────┘
         │ 5. Zapier/n8n fetch tokens
         ▼
┌─────────────────┐
│ Google Calendar │
│      API        │
└─────────────────┘
```

Good luck! 🚀
