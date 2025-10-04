# Room Reservation System - Setup Guide

## Step 1: Create Mordor Room in Database (1 minute)

Go to **Supabase Dashboard → SQL Editor** and run:

```sql
-- Create room type if needed
INSERT INTO room_types (type)
VALUES ('Office')
ON CONFLICT (type) DO NOTHING;

-- Create Mordor room
INSERT INTO rooms (name, room_type_id)
VALUES ('Mordor', (SELECT id FROM room_types WHERE type = 'Office' LIMIT 1))
RETURNING id, name;

-- Save the room ID from the output above, then create 4 seats
-- Replace {ROOM_ID} with the actual ID
INSERT INTO seats (room_id)
VALUES
  ({ROOM_ID}),
  ({ROOM_ID}),
  ({ROOM_ID}),
  ({ROOM_ID})
RETURNING id, room_id;
```

**Or use the automated script:**

Copy the content from `create-mordor-room.sql` and run it in Supabase SQL Editor.

## Step 2: Get Room ID

After creating the room, find its ID:

```sql
SELECT id, name FROM rooms WHERE name = 'Mordor';
```

Note the `id` - you'll need it for the URL.

## Step 3: Start the App

```bash
npm run dev
```

## Step 4: View the Room

Open your browser to:
```
http://localhost:3000/rooms/{ROOM_ID}
```

Replace `{ROOM_ID}` with the actual room ID from Step 2.

**Example:** If room ID is `1`:
```
http://localhost:3000/rooms/1
```

## How to Use

### Reserve a Seat
1. Select a date (default: today)
2. Click on a **green** (available) seat
3. Seat turns **blue** (your reservation)

### Cancel Your Reservation
1. Click on a **blue** (your) seat
2. Confirm deletion
3. Seat turns **green** (available)

### View Others' Reservations
- **Gray seats** = reserved by others
- Click to see who reserved it

## Features

✅ **Color-coded seats:**
- 🟢 Green = Available
- 🔵 Blue = Your Reservation
- ⚫ Gray = Reserved by Others

✅ **Date selector** - View/reserve seats for any date

✅ **Click to reserve** - One click to book

✅ **Click to cancel** - One click to cancel your own reservation

## Current User

The app uses **hardcoded user ID = 1** for testing.

To change the user ID, edit:
```typescript
// app/rooms/[id]/page.tsx line 25
const currentUserId = 1  // Change this
```

## API Endpoints

### Get Room with Seats
```
GET /api/rooms/{id}?date=2024-10-04
```

### Reserve Seat
```
POST /api/seats/{seatId}/reserve
Body: { "user_id": 1, "date": "2024-10-04" }
```

### Delete Reservation
```
DELETE /api/reservations/{reservationId}
```

### Update Reservation Date
```
PATCH /api/reservations/{reservationId}
Body: { "date": "2024-10-05" }
```

## Database Schema

```
rooms
├── id
├── name ("Mordor")
└── room_type_id

seats
├── id
└── room_id (links to rooms)

seat_reservations
├── id
├── seat_id (links to seats)
├── user_id (links to users)
└── date_of_reservation (unique per seat+date)
```

## Troubleshooting

### "Room not found"
- Check room ID in URL matches database
- Run: `SELECT * FROM rooms;` to see all rooms

### "Seat already reserved"
- Someone else reserved it first
- Try a different seat or date

### API errors
- Check browser console (F12)
- Check terminal for server errors
- Verify Prisma Client is generated: `npx prisma generate`

### No seats showing
- Make sure you created seats in Step 1
- Run: `SELECT * FROM seats WHERE room_id = {ROOM_ID};`

## Next Steps

### Add Real Authentication
Replace hardcoded `currentUserId` with actual session:
- Use NextAuth
- Get user from session
- Pass user ID from backend

### Add More Rooms
```sql
INSERT INTO rooms (name, room_type_id)
VALUES ('The Shire', (SELECT id FROM room_types WHERE type = 'Office'));
```

### Add Room List Page
Create `/app/rooms/page.tsx` to show all rooms

### Add Seat Names
Modify `seats` table to add `name` column:
```sql
ALTER TABLE seats ADD COLUMN name VARCHAR(50);
UPDATE seats SET name = 'Seat ' || id::text;
```

Enjoy your room reservation system! 🎉
