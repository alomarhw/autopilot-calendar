import { NextRequest, NextResponse } from "next/server";
import { getUpcomingEvents } from "@/lib/calendar";
import { findRelevantEmailsForEvent } from "@/lib/gmail";
import { openai } from "@/lib/openai";
import { buildMeetingBriefPrompt } from "@/lib/prompts";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const { eventId, regenerate } = await req.json();
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!regenerate) {
      const existing = await prisma.meetingBrief.findFirst({
        where: {
          userId: user.id,
          eventId,
        },
        orderBy: {
          createdAt: "desc",
        },
      });

      if (existing) {
        return NextResponse.json({
          briefMarkdown: existing.briefMarkdown,
          cached: true,
        });
      }
    }

    const events = await getUpcomingEvents();
    const event = events.find((e) => e.id === eventId);

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    const attendees = (event.attendees ?? [])
  .map((a) => a.email)
  .filter(Boolean) as string[];

const relatedEmails = await findRelevantEmailsForEvent({
  eventTitle: event.summary || "Untitled event",
  attendeeEmails: attendees,
  eventStart: event.start?.dateTime || event.start?.date || undefined,
});

    const prompt = buildMeetingBriefPrompt({
      title: event.summary || "Untitled event",
      start: event.start?.dateTime || event.start?.date || "Unknown",
      attendees,
      emailSnippets: relatedEmails.map(
  (m, i) =>
    `[Match ${i + 1} | score=${m.score} | subject=${m.subject || "No subject"} | from=${m.from || "Unknown"}]\n${m.snippet}`
),
    });

    const response = await openai.responses.create({
      model: "gpt-4o-mini",
      input: prompt,
    });

    const briefMarkdown = response.output_text;

    await prisma.meetingBrief.create({
      data: {
        userId: user.id,
        eventId: event.id!,
        eventTitle: event.summary || "Untitled event",
        eventStart: new Date(
          event.start?.dateTime || event.start?.date || new Date().toISOString()
        ),
        briefMarkdown,
      },
    });

    return NextResponse.json({
      briefMarkdown,
      cached: false,
    });
  } catch (error) {
    console.error("Brief generation error:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Unknown brief generation error",
      },
      { status: 500 }
    );
  }
}