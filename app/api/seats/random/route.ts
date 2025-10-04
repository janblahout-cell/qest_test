import { NextRequest, NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

export async function POST(request: NextRequest) {
  try {
    const { user_id, date } = await request.json()

    if (!user_id || !date) {
      return NextResponse.json(
        { error: "user_id and date are required" },
        { status: 400 }
      )
    }

    // Find all available seats for the date
    const allSeats = await prisma.seats.findMany({
      include: {
        seat_reservations: {
          where: {
            date_of_reservation: new Date(date),
          },
        },
        rooms: true,
      },
    })

    // Filter to get only available seats (no reservations for this date)
    const availableSeats = allSeats.filter(
      (seat) => seat.seat_reservations.length === 0
    )

    if (availableSeats.length === 0) {
      return NextResponse.json(
        { error: "No available seats for this date" },
        { status: 404 }
      )
    }

    // Pick a random seat
    const randomSeat =
      availableSeats[Math.floor(Math.random() * availableSeats.length)]

    // Create the reservation
    const reservation = await prisma.seat_reservations.create({
      data: {
        seat_id: randomSeat.id,
        user_id: BigInt(user_id),
        date_of_reservation: new Date(date),
      },
      include: {
        seats: {
          include: {
            rooms: true,
          },
        },
      },
    })

    return NextResponse.json({
      reservation_id: Number(reservation.id),
      seat_id: Number(reservation.seat_id),
      room_id: Number(reservation.seats.room_id),
      room_name: reservation.seats.rooms.name,
      date: reservation.date_of_reservation.toISOString(),
    })
  } catch (error) {
    console.error("Error creating random reservation:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
