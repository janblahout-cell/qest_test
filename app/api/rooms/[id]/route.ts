import { NextRequest, NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const roomId = parseInt(id)
    const searchParams = request.nextUrl.searchParams
    const date = searchParams.get("date") || new Date().toISOString().split("T")[0]

    // Fetch room with seats and reservations for the selected date
    const room = await prisma.rooms.findUnique({
      where: { id: BigInt(roomId) },
      include: {
        seats: {
          include: {
            seat_reservations: {
              where: {
                date_of_reservation: new Date(date),
              },
              include: {
                users: {
                  select: {
                    id: true,
                    email: true,
                  },
                },
              },
            },
          },
        },
      },
    })

    if (!room) {
      return NextResponse.json({ error: "Room not found" }, { status: 404 })
    }

    // Format response
    const formattedRoom = {
      id: Number(room.id),
      name: room.name,
      seats: room.seats.map((seat) => ({
        id: Number(seat.id),
        reservation: seat.seat_reservations[0]
          ? {
              id: Number(seat.seat_reservations[0].id),
              user_id: Number(seat.seat_reservations[0].user_id),
              user_email: seat.seat_reservations[0].users.email,
              date_of_reservation:
                seat.seat_reservations[0].date_of_reservation.toISOString(),
            }
          : null,
      })),
    }

    return NextResponse.json(formattedRoom)
  } catch (error) {
    console.error("Error fetching room:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
