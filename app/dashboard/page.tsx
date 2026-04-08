import { getUpcomingEvents } from "@/lib/calendar";

function formatWhen(event: any) {
  const value = event.start?.dateTime || event.start?.date;
  if (!value) return "No date";

  const date = new Date(value);

  if (event.start?.date) {
    return date.toLocaleDateString();
  }

  return date.toLocaleString();
}

export default async function DashboardPage() {
  const events = await getUpcomingEvents();

  return (
    <main className="mx-auto max-w-4xl p-8">
      <h1 className="mb-2 text-3xl font-semibold">Upcoming meetings</h1>
      <p className="mb-6 text-gray-600">
        Your next 10 Google Calendar events
      </p>

      {events.length === 0 ? (
        <div className="rounded-2xl border p-4">No upcoming events found.</div>
      ) : (
        <div className="space-y-4">
          {events.map((event: any) => (
            <div key={event.id} className="rounded-2xl border p-4 shadow-sm">
              <div className="text-lg font-medium">
                {event.summary || "Untitled event"}
              </div>
              <div className="mt-1 text-sm text-gray-600">
                {formatWhen(event)}
              </div>
              {event.organizer?.email ? (
                <div className="mt-2 text-sm">
                  Organizer: {event.organizer.email}
                </div>
              ) : null}
            </div>
          ))}
        </div>
      )}
    </main>
  );
}