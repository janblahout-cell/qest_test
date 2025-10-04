# Calendar Integration Setup Guide

This application allows users with `@qest.cz` email addresses to grant calendar access, which can then be used to create calendar events via Slack.

## Prerequisites

- Node.js 18+ installed
- PostgreSQL database
- Google Cloud Console account
- Slack workspace with admin access

## Setup Steps

### 1. Database Setup

```bash
# Copy environment variables
cp .env.example .env

# Edit .env and set DATABASE_URL
# Example: DATABASE_URL="postgresql://user:password@localhost:5432/myapp"

# Run Prisma migrations
npx prisma migrate dev --name init

# Generate Prisma Client
npx prisma generate
```

### 2. Google Cloud Console Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable **Google Calendar API**:
   - Navigate to "APIs & Services" > "Library"
   - Search for "Google Calendar API"
   - Click "Enable"
4. Create OAuth 2.0 Credentials:
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "OAuth client ID"
   - Application type: "Web application"
   - Add authorized redirect URIs:
     - `http://localhost:3000/api/auth/callback/google` (development)
     - `https://yourdomain.com/api/auth/callback/google` (production)
   - Copy the **Client ID** and **Client Secret**
5. Update `.env` file:
   ```
   GOOGLE_CLIENT_ID="your-client-id.apps.googleusercontent.com"
   GOOGLE_CLIENT_SECRET="your-client-secret"
   ```

### 3. NextAuth Setup

```bash
# Generate a random secret
openssl rand -base64 32

# Add to .env
NEXTAUTH_SECRET="generated-secret-here"
NEXTAUTH_URL="http://localhost:3000"  # Change for production
```

### 4. Slack App Setup

1. Go to [Slack API](https://api.slack.com/apps)
2. Click "Create New App" > "From scratch"
3. Name your app and select workspace
4. Configure **OAuth & Permissions**:
   - Add Bot Token Scopes:
     - `chat:write`
     - `commands`
     - `app_mentions:read`
5. Configure **Slash Commands**:
   - Command: `/calendar`
   - Request URL: `https://yourdomain.com/api/slack/events`
   - Short description: "Create calendar events"
   - Usage hint: `user@qest.cz Event Title - YYYY-MM-DD HH:MM - 1 hour`
6. Configure **Event Subscriptions**:
   - Enable Events
   - Request URL: `https://yourdomain.com/api/slack/events`
   - Subscribe to bot events: `app_mention`
7. Install app to workspace
8. Copy credentials to `.env`:
   ```
   SLACK_SIGNING_SECRET="your-signing-secret"
   SLACK_BOT_TOKEN="xoxb-your-bot-token"
   ```

### 5. Run the Application

```bash
# Install dependencies (already done)
npm install

# Run development server
npm run dev
```

Visit `http://localhost:3000/consent` to test the OAuth flow.

## Usage Flow

### 1. User Authorization

1. User visits `/consent` page
2. Clicks "Connect with Google"
3. Google OAuth prompts for:
   - Email verification (must be `@qest.cz`)
   - Calendar access permission
4. On success, tokens are stored in database with consent flag

### 2. Creating Calendar Events via Slack

**Slash Command Format:**
```
/calendar user@qest.cz Meeting Title - 2024-10-05 14:00 - 1 hour
```

**Alternative format with "tomorrow":**
```
/calendar user@qest.cz Team Sync - tomorrow 10:00 - 2 hours
```

**What happens:**
1. Slack sends request to `/api/slack/events`
2. API parses command and extracts:
   - User email (must be `@qest.cz`)
   - Event title
   - Start date/time
   - Duration
3. System checks if user has granted consent
4. Uses stored Google tokens to create calendar event
5. Responds in Slack with success/error message

### 3. Token Refresh

Google access tokens expire after 1 hour. The system automatically:
- Detects expired tokens
- Uses refresh token to get new access token
- Updates database with new token
- Retries the calendar operation

## Database Schema

```prisma
model User {
  email                String   @unique
  googleAccessToken    String?
  googleRefreshToken   String?
  googleTokenExpiry    DateTime?
  calendarConsent      Boolean  @default(false)
  consentGrantedAt     DateTime?
}
```

## API Endpoints

- `GET/POST /api/auth/[...nextauth]` - NextAuth handlers
- `POST /api/slack/events` - Slack events and slash commands

## Security Considerations

1. **Email Domain Restriction**: Only `@qest.cz` emails can sign in (enforced in `auth.ts:26`)
2. **Token Storage**: OAuth tokens are encrypted by database
3. **Slack Verification**: Implement proper signature verification in production
4. **Environment Variables**: Never commit `.env` file

## Troubleshooting

### "User has not granted calendar consent"
- User needs to visit `/consent` and authorize

### "Invalid request signature" from Slack
- Check `SLACK_SIGNING_SECRET` is correct
- Implement proper signature verification (see Slack docs)

### "Failed to create calendar event"
- Check Google Calendar API is enabled
- Verify user's refresh token is valid
- Check token hasn't been revoked by user

### OAuth redirect not working
- Verify redirect URI in Google Console matches exactly
- Check `NEXTAUTH_URL` is set correctly

## Production Deployment

1. Set production URLs in Google Console redirect URIs
2. Update `NEXTAUTH_URL` in `.env`
3. Use production database
4. Implement proper Slack signature verification
5. Add error monitoring (e.g., Sentry)
6. Set up HTTPS for all endpoints

## File Structure

```
/app
  /api
    /auth/[...nextauth]/route.ts  # NextAuth handlers
    /slack/events/route.ts         # Slack integration
  /consent/page.tsx                # OAuth consent page
  layout.tsx                       # Root layout with SessionProvider
/lib
  google-calendar.ts               # Calendar API utilities
/prisma
  schema.prisma                    # Database schema
auth.ts                            # NextAuth configuration
```
