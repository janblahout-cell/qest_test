"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"

interface Seat {
  id: number
  reservation: {
    id: number
    user_id: number
    user_email: string
    date_of_reservation: string
  } | null
}

interface Room {
  id: number
  name: string
  seats: Seat[]
}

export default function RoomPage() {
  const params = useParams()
  const roomId = params.id as string
  const [room, setRoom] = useState<Room | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  )

  // Hardcoded user ID for testing - replace with actual auth
  const currentUserId = 1

  const fetchRoom = async () => {
    setLoading(true)
    try {
      const response = await fetch(
        `/api/rooms/${roomId}?date=${selectedDate}`
      )
      if (response.ok) {
        const data = await response.json()
        setRoom(data)
      }
    } catch (error) {
      console.error("Error fetching room:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchRoom()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId, selectedDate])

  const handleSeatClick = async (seat: Seat) => {
    if (seat.reservation) {
      // Seat is reserved
      if (seat.reservation.user_id === currentUserId) {
        // User's own reservation - show delete option
        if (confirm(`Delete your reservation for seat ${seat.id}?`)) {
          await deleteReservation(seat.reservation.id)
        }
      } else {
        // Someone else's reservation
        alert(
          `This seat is reserved by ${seat.reservation.user_email}`
        )
      }
    } else {
      // Seat is available - reserve it
      await reserveSeat(seat.id)
    }
  }

  const reserveSeat = async (seatId: number) => {
    try {
      const response = await fetch(`/api/seats/${seatId}/reserve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: currentUserId,
          date: selectedDate,
        }),
      })

      if (response.ok) {
        fetchRoom() // Refresh
      } else {
        const error = await response.json()
        alert(error.error || "Failed to reserve seat")
      }
    } catch {
      alert("Error reserving seat")
    }
  }

  const deleteReservation = async (reservationId: number) => {
    try {
      const response = await fetch(
        `/api/reservations/${reservationId}`,
        {
          method: "DELETE",
        }
      )

      if (response.ok) {
        fetchRoom() // Refresh
      } else {
        alert("Failed to delete reservation")
      }
    } catch {
      alert("Error deleting reservation")
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    )
  }

  if (!room) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Room not found</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen p-8 bg-gray-50">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">{room.name}</h1>

        {/* Date selector */}
        <div className="mb-6">
          <label className="block text-sm font-medium mb-2">
            Select Date:
          </label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-4 py-2 border rounded-lg"
          />
        </div>

        {/* Seats grid */}
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {room.seats.map((seat) => {
            const isReserved = !!seat.reservation
            const isOwnReservation =
              isReserved && seat.reservation!.user_id === currentUserId

            return (
              <button
                key={seat.id}
                onClick={() => handleSeatClick(seat)}
                className={`
                  p-6 rounded-lg border-2 transition-all hover:scale-105
                  ${
                    !isReserved
                      ? "bg-green-100 border-green-300 hover:bg-green-200"
                      : isOwnReservation
                      ? "bg-blue-100 border-blue-300 hover:bg-blue-200"
                      : "bg-gray-200 border-gray-300 cursor-not-allowed"
                  }
                `}
              >
                <div className="text-lg font-semibold mb-2">
                  Seat {seat.id}
                </div>
                <div className="text-sm">
                  {!isReserved ? (
                    <span className="text-green-700">Available</span>
                  ) : isOwnReservation ? (
                    <span className="text-blue-700">Your Reservation</span>
                  ) : (
                    <span className="text-gray-600">
                      {seat.reservation!.user_email}
                    </span>
                  )}
                </div>
              </button>
            )
          })}
        </div>

        {/* Legend */}
        <div className="mt-8 p-4 bg-white rounded-lg shadow">
          <h3 className="font-semibold mb-2">Legend:</h3>
          <div className="flex gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-green-100 border-2 border-green-300 rounded"></div>
              <span className="text-sm">Available</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-blue-100 border-2 border-blue-300 rounded"></div>
              <span className="text-sm">Your Reservation</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-gray-200 border-2 border-gray-300 rounded"></div>
              <span className="text-sm">Reserved by Others</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
