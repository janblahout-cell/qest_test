import { NextRequest, NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

/**
 * API endpoint for external automation tools (Zapier, n8n)
 *
 * GET /api/user/user@qest.cz/tokens?apiKey=YOUR_SECRET_KEY
 *
 * Returns:
 * {
 *   "email": "user@qest.cz",
 *   "accessToken": "ya29.xxx",
 *   "refreshToken": "1//xxx",
 *   "hasConsent": true,
 *   "consentGrantedAt": "2024-10-04T12:00:00.000Z"
 * }
 */

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ email: string }> }
) {
  try {
    // Get API key from query params or header
    const apiKey =
      request.nextUrl.searchParams.get("apiKey") ||
      request.headers.get("x-api-key")

    // Verify API key
    if (!apiKey || apiKey !== process.env.API_SECRET_KEY) {
      return NextResponse.json(
        { error: "Unauthorized - Invalid API key" },
        { status: 401 }
      )
    }

    const { email } = await params

    // Validate email format
    if (!email || !email.includes("@")) {
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 }
      )
    }

    // Decode email from URL (handles encoded @)
    const decodedEmail = decodeURIComponent(email)

    // Fetch user and oauth data from database
    const user = await prisma.users.findUnique({
      where: { email: decodedEmail },
      include: {
        oauth: true,
      },
    })

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      )
    }

    if (!user.oauth) {
      return NextResponse.json(
        { error: "User has not connected OAuth" },
        { status: 404 }
      )
    }

    if (!user.oauth.calendarConsent) {
      return NextResponse.json(
        { error: "User has not granted consent" },
        { status: 403 }
      )
    }

    if (!user.oauth.googleAccessToken || !user.oauth.googleRefreshToken) {
      return NextResponse.json(
        { error: "User tokens not found - user needs to re-authenticate" },
        { status: 404 }
      )
    }

    // Return tokens
    return NextResponse.json({
      email: user.email,
      name: null, // name not stored in users table
      accessToken: user.oauth.googleAccessToken,
      refreshToken: user.oauth.googleRefreshToken,
      hasConsent: user.oauth.calendarConsent,
      consentGrantedAt: user.oauth.consentGrantedAt,
    })

  } catch (error) {
    console.error("Error fetching user tokens:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
