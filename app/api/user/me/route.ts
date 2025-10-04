import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

export async function GET() {
  try {
    const session = await auth()

    console.log("Session in /api/user/me:", session)

    if (!session?.user?.email) {
      console.log("No session or email found")
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      )
    }

    const user = await prisma.users.findUnique({
      where: { email: session.user.email },
    })

    if (!user) {
      console.log("User not found in database:", session.user.email)
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      )
    }

    console.log("Found user:", { id: Number(user.id), email: user.email })
    return NextResponse.json({
      id: Number(user.id),
      email: user.email,
    })
  } catch (error) {
    console.error("Error fetching user:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
