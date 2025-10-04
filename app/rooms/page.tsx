"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"

interface Room {
  id: number
  name: string
  totalSeats: number
  reservedSeats: number
  availableSeats: number
}

export default function RoomsPage() {
  const router = useRouter()
  const { data: session } = useSession()
  const [rooms, setRooms] = useState<Room[]>([])
  const [loading, setLoading] = useState(true)
  const [randomLoading, setRandomLoading] = useState(false)
  const [currentUserId, setCurrentUserId] = useState<number | null>(null)
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  )

  const fetchRooms = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/rooms?date=${selectedDate}`)
      if (response.ok) {
        const data = await response.json()
        setRooms(data)
      }
    } catch (error) {
      console.error("Error fetching rooms:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const fetchCurrentUser = async () => {
      if (!session?.user?.email) return

      try {
        const response = await fetch("/api/user/me")
        if (response.ok) {
          const data = await response.json()
          setCurrentUserId(data.id)
        }
      } catch (error) {
        console.error("Error fetching current user:", error)
      }
    }

    if (session) {
      fetchCurrentUser()
    }
  }, [session])

  useEffect(() => {
    fetchRooms()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDate])

  const handleRandomSeat = async () => {
    if (!currentUserId) {
      alert("Please log in to make a reservation")
      router.push("/consent")
      return
    }

    setRandomLoading(true)
    try {
      const response = await fetch("/api/seats/random", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: currentUserId,
          date: selectedDate,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        alert(`Reserved seat ${data.seat_id} in ${data.room_name}!`)
        router.push(`/rooms/${data.room_id}`)
      } else {
        const error = await response.json()
        alert(error.error || "Failed to reserve random seat")
      }
    } catch {
      alert("Error reserving random seat")
    } finally {
      setRandomLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen p-8 bg-gray-50">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
          <h1 className="text-3xl font-bold">Available Rooms</h1>
          <div className="flex gap-3">
            <button
              onClick={handleRandomSeat}
              disabled={randomLoading}
              className="px-6 py-2 text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {randomLoading ? "Finding..." : "🎲 Random Seat"}
            </button>
            <Link
              href="/"
              className="px-4 py-2 text-sm bg-gray-200 hover:bg-gray-300 rounded-lg transition-colors"
            >
              ← Back to Home
            </Link>
          </div>
        </div>

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

        {/* Rooms grid */}
        {rooms.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            No rooms available
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {rooms.map((room) => {
              const occupancyPercentage =
                room.totalSeats > 0
                  ? (room.reservedSeats / room.totalSeats) * 100
                  : 0

              return (
                <Link
                  key={room.id}
                  href={`/rooms/${room.id}`}
                  className="block p-6 bg-white rounded-lg shadow-lg hover:shadow-xl transition-shadow border-2 border-gray-100 hover:border-blue-300"
                >
                  <h2 className="text-2xl font-semibold mb-4 text-gray-800">
                    {room.name}
                  </h2>

                  <div className="space-y-3">
                    {/* Total seats */}
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Total Seats:</span>
                      <span className="text-lg font-medium">{room.totalSeats}</span>
                    </div>

                    {/* Available seats */}
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Available:</span>
                      <span className="text-lg font-medium text-green-600">
                        {room.availableSeats}
                      </span>
                    </div>

                    {/* Reserved seats */}
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Reserved:</span>
                      <span className="text-lg font-medium text-gray-500">
                        {room.reservedSeats}
                      </span>
                    </div>

                    {/* Occupancy bar */}
                    <div className="mt-4">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-gray-500">Occupancy</span>
                        <span className="text-xs font-medium text-gray-700">
                          {occupancyPercentage.toFixed(0)}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full transition-all ${
                            occupancyPercentage > 80
                              ? "bg-red-500"
                              : occupancyPercentage > 50
                              ? "bg-yellow-500"
                              : "bg-green-500"
                          }`}
                          style={{ width: `${occupancyPercentage}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>

                  {/* Status badge */}
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    {room.availableSeats === 0 ? (
                      <span className="inline-block px-3 py-1 text-xs font-medium bg-red-100 text-red-700 rounded-full">
                        Fully Booked
                      </span>
                    ) : room.availableSeats <= 2 ? (
                      <span className="inline-block px-3 py-1 text-xs font-medium bg-yellow-100 text-yellow-700 rounded-full">
                        Almost Full
                      </span>
                    ) : (
                      <span className="inline-block px-3 py-1 text-xs font-medium bg-green-100 text-green-700 rounded-full">
                        Available
                      </span>
                    )}
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
