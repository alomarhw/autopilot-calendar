import { NextResponse } from "next/server";
import { getUpcomingEvents } from "@/lib/calendar";

export async function GET() {
  try {
    const events = await getUpcomingEvents();
    return NextResponse.json({ events });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}