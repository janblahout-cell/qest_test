# Automation Integration Guide

This guide shows how to integrate the calendar consent app with external automation tools like Zapier, n8n, or Make.

## Overview

The app provides an API endpoint that automation tools can call to retrieve Google Calendar tokens for users who have granted consent.

## API Endpoint

### Get User Tokens

```
GET /api/user/{email}/tokens
```

**Authentication:** API Key (query param or header)

**Example Request:**

```bash
curl "http://localhost:3000/api/user/john@qest.cz/tokens?apiKey=my-super-secret-automation-key-123"
```

Or with header:

```bash
curl -H "x-api-key: my-super-secret-automation-key-123" \
  "http://localhost:3000/api/user/john@qest.cz/tokens"
```

**Success Response (200):**

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

**Error Responses:**

```json
// 401 - Unauthorized
{
  "error": "Unauthorized - Invalid API key"
}

// 404 - User not found
{
  "error": "User not found"
}

// 403 - No consent
{
  "error": "User has not granted consent"
}

// 404 - No tokens
{
  "error": "User tokens not found - user needs to re-authenticate"
}
```

## Setup

### 1. Environment Variables

Add to your `.env` file:

```env
API_SECRET_KEY="your-secure-random-key-here"
```

Generate a secure key:

```bash
openssl rand -base64 32
```

### 2. Security Best Practices

- **Never** commit your `API_SECRET_KEY` to version control
- Use different keys for development and production
- Rotate keys periodically
- Only share the key with authorized automation tools

## Integration Examples

### Zapier

**Trigger:** External service (e.g., Slack message, form submission)

**Action: Webhooks by Zapier - GET Request**

1. URL: `https://yourdomain.com/api/user/{{email}}/tokens`
2. Query String: `apiKey=YOUR_API_SECRET_KEY`
3. Parse the response JSON
4. Use `accessToken` in next step (Google Calendar API)

**Next Action: Google Calendar - Create Event**

1. Auth: Custom (use the accessToken from previous step)
2. Configure event details

### n8n

**HTTP Request Node:**

```json
{
  "method": "GET",
  "url": "https://yourdomain.com/api/user/{{ $json.email }}/tokens",
  "authentication": "genericCredentialType",
  "genericAuthType": "queryAuth",
  "sendQuery": true,
  "queryParameters": {
    "parameters": [
      {
        "name": "apiKey",
        "value": "={{ $env.API_SECRET_KEY }}"
      }
    ]
  }
}
```

**Google Calendar Node:**

```json
{
  "resource": "event",
  "operation": "create",
  "authentication": "oAuth2",
  "oAuth2": {
    "accessToken": "={{ $json.accessToken }}"
  }
}
```

### Make (Integromat)

**HTTP Module - Make a Request:**

1. URL: `https://yourdomain.com/api/user/{{email}}/tokens?apiKey=YOUR_KEY`
2. Method: GET
3. Parse response
4. Map `accessToken` to next module

**Google Calendar - Create an Event:**

1. Connection: Use custom OAuth
2. Access Token: Use the token from HTTP response

## Using the Tokens

### Direct Google Calendar API

Once you have the tokens, use them with Google Calendar API v3:

**Example: Create Calendar Event**

```javascript
// Using the tokens from our API
const { accessToken, refreshToken } = response;

// Call Google Calendar API
const calendarResponse = await fetch(
  'https://www.googleapis.com/calendar/v3/calendars/primary/events',
  {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      summary: 'Meeting Title',
      description: 'Meeting description',
      start: {
        dateTime: '2024-10-05T14:00:00+02:00',
        timeZone: 'Europe/Prague',
      },
      end: {
        dateTime: '2024-10-05T15:00:00+02:00',
        timeZone: 'Europe/Prague',
      },
      attendees: [
        { email: 'attendee@qest.cz' }
      ],
    }),
  }
);
```

### Token Refresh

Google access tokens expire after 1 hour. Use the `refreshToken` to get a new access token:

```bash
curl -X POST https://oauth2.googleapis.com/token \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "client_id=${GOOGLE_CLIENT_ID}" \
  -d "client_secret=${GOOGLE_CLIENT_SECRET}" \
  -d "refresh_token=${REFRESH_TOKEN}" \
  -d "grant_type=refresh_token"
```

Response:

```json
{
  "access_token": "ya29.new_token...",
  "expires_in": 3599,
  "scope": "https://www.googleapis.com/auth/calendar.events",
  "token_type": "Bearer"
}
```

## Workflow Examples

### Example 1: Slack to Calendar

**Trigger:** Slack slash command `/meeting @john@qest.cz Tomorrow 2pm`

**Steps:**
1. Parse Slack message
2. Extract email: `john@qest.cz`
3. Call: `GET /api/user/john@qest.cz/tokens`
4. Use tokens to create Google Calendar event
5. Reply in Slack: "✅ Event created"

### Example 2: Form Submission to Calendar

**Trigger:** User submits booking form

**Steps:**
1. Form includes: user email, meeting time, duration
2. Call: `GET /api/user/{email}/tokens`
3. Create calendar event using Google Calendar API
4. Send confirmation email

### Example 3: Batch Calendar Updates

**Trigger:** Daily cron job

**Steps:**
1. Read list of users from CSV/database
2. For each user:
   - Call: `GET /api/user/{email}/tokens`
   - Create/update calendar events
   - Log results
3. Send summary report

## Troubleshooting

### "Unauthorized - Invalid API key"

- Check `API_SECRET_KEY` is set correctly in `.env`
- Verify the key matches in your automation tool
- Ensure key is passed as query param `?apiKey=xxx` or header `x-api-key`

### "User not found"

- User hasn't visited `/consent` page yet
- Email address typo
- User email is not `@qest.cz`

### "User has not granted consent"

- User visited consent page but didn't complete OAuth
- User denied calendar permissions
- Ask user to visit `/consent` again

### "User tokens not found"

- User needs to re-authenticate (tokens may have been revoked)
- User needs to visit `/consent` page

### Token expired errors

- Access tokens expire after 1 hour
- Implement token refresh logic using the `refreshToken`
- Or ask user to re-authenticate

## Security Considerations

1. **HTTPS Only:** Always use HTTPS in production
2. **API Key Rotation:** Change `API_SECRET_KEY` periodically
3. **Rate Limiting:** Consider adding rate limits to the API
4. **Logging:** Log API access for security auditing
5. **IP Whitelist:** Optionally restrict API access to specific IPs
6. **Token Storage:** Never log or expose tokens in plain text

## Production Deployment

Update environment variables in production:

```env
NEXTAUTH_URL="https://yourdomain.com"
API_SECRET_KEY="production-key-different-from-dev"
```

Update automation tools to use production URLs:

```
https://yourdomain.com/api/user/{email}/tokens
```

## Support

For issues or questions:
- Check error messages in automation tool logs
- Verify API key is correct
- Ensure user has granted consent
- Check database for user tokens
