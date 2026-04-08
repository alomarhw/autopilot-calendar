import { google } from "googleapis";
import { getCurrentUser } from "@/lib/auth";
import { getAuthorizedGoogleOAuthClient } from "@/lib/google";

export async function getCalendarClient() {
  const user = await getCurrentUser();

  if (!user?.googleAccount) {
    throw new Error("Google account not connected");
  }

  const client = await getAuthorizedGoogleOAuthClient(user.googleAccount);

  return google.calendar({ version: "v3", auth: client });
}

export async function getUpcomingEvents() {
  const calendar = await getCalendarClient();
  const now = new Date().toISOString();

  const result = await calendar.events.list({
    calendarId: "primary",
    timeMin: now,
    maxResults: 20,
    singleEvents: true,
    orderBy: "startTime",
  });

  return result.data.items ?? [];
}