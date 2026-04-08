export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;
  const error = params.error;

  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col items-center justify-center p-8">
      <h1 className="mb-4 text-4xl font-bold">AutoPilot Calendar</h1>
      <p className="mb-8 text-center text-gray-600">
        Connect Google Calendar and Gmail to see upcoming meetings.
      </p>

      {error ? (
        <div className="mb-6 rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">
          Google sign-in failed: {error}
        </div>
      ) : null}

      <a
        href="/api/auth/google/start"
        className="rounded-xl border px-5 py-3 shadow-sm hover:shadow-md"
      >
        Connect Google
      </a>
    </main>
  );
}