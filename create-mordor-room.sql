-- Create Mordor room with 4 seats
-- Run this in Supabase SQL Editor

-- First, check if room_type exists, if not create a default one
INSERT INTO room_types (type)
VALUES ('Office')
ON CONFLICT (type) DO NOTHING;

-- Create Mordor room
INSERT INTO rooms (name, room_type_id)
VALUES ('Mordor', (SELECT id FROM room_types WHERE type = 'Office' LIMIT 1))
ON CONFLICT DO NOTHING
RETURNING id, name;

-- Create 4 seats in Mordor
INSERT INTO seats (room_id)
SELECT id FROM rooms WHERE name = 'Mordor'
UNION ALL
SELECT id FROM rooms WHERE name = 'Mordor'
UNION ALL
SELECT id FROM rooms WHERE name = 'Mordor'
UNION ALL
SELECT id FROM rooms WHERE name = 'Mordor'
RETURNING id, room_id;

-- Verify creation
SELECT r.id as room_id, r.name as room_name, COUNT(s.id) as seat_count
FROM rooms r
LEFT JOIN seats s ON s.room_id = r.id
WHERE r.name = 'Mordor'
GROUP BY r.id, r.name;
