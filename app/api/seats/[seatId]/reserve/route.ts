import { NextRequest, NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ seatId: string }> }
) {
  try {
    const { seatId } = await params
    const body = await request.json()
    const { user_id, date } = body

    if (!user_id || !date) {
      return NextResponse.json(
        { error: "user_id and date are required" },
        { status: 400 }
      )
    }

    // Check if seat is already reserved for this date
    const existing = await prisma.seat_reservations.findFirst({
      where: {
        seat_id: BigInt(seatId),
        date_of_reservation: new Date(date),
      },
    })

    if (existing) {
      return NextResponse.json(
        { error: "Seat is already reserved for this date" },
        { status: 409 }
      )
    }

    // Create reservation
    const reservation = await prisma.seat_reservations.create({
      data: {
        seat_id: BigInt(seatId),
        user_id: BigInt(user_id),
        date_of_reservation: new Date(date),
      },
    })

    return NextResponse.json({
      success: true,
      reservation: {
        id: Number(reservation.id),
        seat_id: Number(reservation.seat_id),
        user_id: Number(reservation.user_id),
        date_of_reservation: reservation.date_of_reservation.toISOString(),
      },
    })
  } catch (error) {
    console.error("Error creating reservation:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
