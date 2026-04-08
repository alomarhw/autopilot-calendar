import { getUpcomingEvents } from "@/lib/calendar";
import GenerateBriefButton from "./generate-brief-button";

function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function getEventDate(event: any) {
  const value = event.start?.dateTime || event.start?.date;
  return value ? new Date(value) : null;
}

function groupEvents(events: any[]) {
  const now = new Date();
  const tomorrow = new Date();
  tomorrow.setDate(now.getDate() + 1);

  const today: any[] = [];
  const tomorrowEvents: any[] = [];
  const later: any[] = [];

  for (const event of events) {
    const date = getEventDate(event);
    if (!date) {
      later.push(event);
      continue;
    }

    if (isSameDay(date, now)) {
      today.push(event);
    } else if (isSameDay(date, tomorrow)) {
      tomorrowEvents.push(event);
    } else {
      later.push(event);
    }
  }

  return [
    { title: "Today", events: today },
    { title: "Tomorrow", events: tomorrowEvents },
    { title: "Later", events: later },
  ];
}

function formatWhen(event: any) {
  const value = event.start?.dateTime || event.start?.date;
  if (!value) return "No date";

  const date = new Date(value);

  if (event.start?.date) {
    return date.toLocaleDateString(undefined, {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }

  return date.toLocaleString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function getAttendeeCount(event: any) {
  return event.attendees?.length ?? 0;
}

function getStatus(event: any) {
  const date = getEventDate(event);
  if (!date) return { label: "Scheduled", className: "bg-gray-100 text-gray-700" };

  const now = new Date();
  const diffMs = date.getTime() - now.getTime();
  const diffHours = diffMs / (1000 * 60 * 60);

  if (diffHours < 0) {
    return { label: "Past", className: "bg-gray-100 text-gray-700" };
  }

  if (diffHours <= 3) {
    return { label: "Soon", className: "bg-red-100 text-red-700" };
  }

  if (diffHours <= 24) {
    return { label: "Today", className: "bg-blue-100 text-blue-700" };
  }

  if (diffHours <= 48) {
    return { label: "Tomorrow", className: "bg-amber-100 text-amber-700" };
  }

  return { label: "Upcoming", className: "bg-green-100 text-green-700" };
}

function Section({
  title,
  events,
}: {
  title: string;
  events: any[];
}) {
  if (events.length === 0) return null;

  return (
    <section className="mb-10">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-2xl font-semibold text-gray-900">{title}</h2>
        <div className="text-sm text-gray-500">
          {events.length} meeting{events.length === 1 ? "" : "s"}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-2">
        {events.map((event: any) => {
          const status = getStatus(event);

          return (
            <div
              key={event.id}
              className="rounded-3xl border bg-white p-6 shadow-sm transition hover:shadow-md"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">
                    {event.summary || "Untitled event"}
                  </h3>
                  <p className="mt-2 text-sm text-gray-600">
                    {formatWhen(event)}
                  </p>
                </div>

                <div className="flex flex-col items-end gap-2">
                  <div
                    className={`rounded-full px-3 py-1 text-xs font-medium ${status.className}`}
                  >
                    {status.label}
                  </div>

                  <div className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700">
                    {getAttendeeCount(event)} attendees
                  </div>
                </div>
              </div>

              <div className="mt-4 space-y-2 text-sm text-gray-700">
                {event.organizer?.email ? (
                  <div>
                    <span className="font-medium text-gray-900">Organizer:</span>{" "}
                    {event.organizer.email}
                  </div>
                ) : null}

                {event.location ? (
                  <div>
                    <span className="font-medium text-gray-900">Location:</span>{" "}
                    {event.location}
                  </div>
                ) : null}
              </div>

              <div className="mt-6 border-t pt-4">
                <GenerateBriefButton eventId={event.id!} />
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

export default async function DashboardPage() {
  const events = await getUpcomingEvents();
  const groups = groupEvents(events);

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-7xl px-6 py-10">
        <div className="mb-8">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900">
            AutoPilot Calendar
          </h1>
          <p className="mt-2 text-gray-600">
            View your upcoming meetings and generate AI briefs instantly.
          </p>
        </div>

        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-2xl border bg-white p-5 shadow-sm">
            <div className="text-sm text-gray-500">Upcoming meetings</div>
            <div className="mt-2 text-3xl font-semibold text-gray-900">
              {events.length}
            </div>
          </div>

          <div className="rounded-2xl border bg-white p-5 shadow-sm">
            <div className="text-sm text-gray-500">Brief generation</div>
            <div className="mt-2 text-3xl font-semibold text-gray-900">
              Ready
            </div>
          </div>

          <div className="rounded-2xl border bg-white p-5 shadow-sm">
            <div className="text-sm text-gray-500">Primary source</div>
            <div className="mt-2 text-3xl font-semibold text-gray-900">
              Google
            </div>
          </div>
        </div>

        {events.length === 0 ? (
          <div className="rounded-2xl border bg-white p-6 shadow-sm">
            <div className="text-lg font-medium text-gray-900">
              No upcoming events found
            </div>
            <p className="mt-2 text-gray-600">
              Your next meetings will appear here once they are available in Google Calendar.
            </p>
          </div>
        ) : (
          groups.map((group) => (
            <Section key={group.title} title={group.title} events={group.events} />
          ))
        )}
      </div>
    </main>
  );
}