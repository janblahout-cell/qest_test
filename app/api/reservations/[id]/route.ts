import { NextRequest, NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const reservationId = parseInt(id)

    // Delete reservation
    await prisma.seat_reservations.delete({
      where: { id: BigInt(reservationId) },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting reservation:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const reservationId = parseInt(id)
    const body = await request.json()
    const { date } = body

    if (!date) {
      return NextResponse.json(
        { error: "date is required" },
        { status: 400 }
      )
    }

    // Update reservation date
    const updated = await prisma.seat_reservations.update({
      where: { id: BigInt(reservationId) },
      data: {
        date_of_reservation: new Date(date),
      },
    })

    return NextResponse.json({
      success: true,
      reservation: {
        id: Number(updated.id),
        seat_id: Number(updated.seat_id),
        user_id: Number(updated.user_id),
        date_of_reservation: updated.date_of_reservation.toISOString(),
      },
    })
  } catch (error) {
    console.error("Error updating reservation:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
