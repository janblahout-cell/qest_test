import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <main className="max-w-2xl mx-auto p-8">
        <h1 className="text-4xl font-bold text-center mb-8">
          Welcome to QEST App
        </h1>

        <div className="grid gap-6 md:grid-cols-2">
          <Link
            href="/consent"
            className="block p-8 bg-white rounded-lg shadow-lg hover:shadow-xl transition-shadow border-2 border-indigo-100 hover:border-indigo-300"
          >
            <h2 className="text-2xl font-semibold mb-3 text-indigo-600">
              📅 Calendar Consent
            </h2>
            <p className="text-gray-600">
              Connect your Google Calendar and grant permissions for calendar
              management.
            </p>
          </Link>

          <Link
            href="/rooms/2"
            className="block p-8 bg-white rounded-lg shadow-lg hover:shadow-xl transition-shadow border-2 border-blue-100 hover:border-blue-300"
          >
            <h2 className="text-2xl font-semibold mb-3 text-blue-600">
              🪑 Room Reservations
            </h2>
            <p className="text-gray-600">
              View and reserve seats in available rooms for your desired dates.
            </p>
          </Link>
        </div>
      </main>
    </div>
  );
}
