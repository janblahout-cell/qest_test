import { NextRequest, NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const date = searchParams.get("date") || new Date().toISOString().split("T")[0]

    // Fetch all rooms with seats and reservations for the selected date
    const rooms = await prisma.rooms.findMany({
      include: {
        seats: {
          include: {
            seat_reservations: {
              where: {
                date_of_reservation: new Date(date),
              },
            },
          },
        },
      },
    })

    // Format response with seat counts
    const formattedRooms = rooms.map((room) => {
      const totalSeats = room.seats.length
      const reservedSeats = room.seats.filter(
        (seat) => seat.seat_reservations.length > 0
      ).length
      const availableSeats = totalSeats - reservedSeats

      return {
        id: Number(room.id),
        name: room.name,
        totalSeats,
        reservedSeats,
        availableSeats,
      }
    })

    return NextResponse.json(formattedRooms)
  } catch (error) {
    console.error("Error fetching rooms:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
