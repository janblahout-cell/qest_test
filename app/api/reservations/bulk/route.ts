import { NextRequest, NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

export async function DELETE(request: NextRequest) {
  try {
    const { requesterId, fromDate, toDate } = await request.json()

    // Validate input
    if (!requesterId || !fromDate || !toDate) {
      return NextResponse.json(
        { error: "requesterId, fromDate, and toDate are required" },
        { status: 400 }
      )
    }

    // Parse dates
    const from = new Date(fromDate)
    const to = new Date(toDate)

    // Validate date range
    if (from > to) {
      return NextResponse.json(
        { error: "fromDate must be before or equal to toDate" },
        { status: 400 }
      )
    }

    // Delete all reservations for the user in the date range
    const result = await prisma.seat_reservations.deleteMany({
      where: {
        user_id: BigInt(requesterId),
        date_of_reservation: {
          gte: from,
          lte: to,
        },
      },
    })

    return NextResponse.json({
      deleted: result.count,
      message: `Deleted ${result.count} reservation${result.count !== 1 ? 's' : ''} for user ${requesterId} from ${fromDate} to ${toDate}`,
      requesterId,
      fromDate,
      toDate,
    })
  } catch (error) {
    console.error("Error deleting bulk reservations:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
