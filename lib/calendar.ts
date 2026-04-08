import { google } from "googleapis";
import { getGoogleOAuthClient } from "@/lib/google";
import { getCurrentUser } from "@/lib/auth";

export async function getCalendarClient() {
  const user = await getCurrentUser();

  if (!user?.googleAccount) {
    throw new Error("Google account not connected");
  }

  const client = getGoogleOAuthClient();
  client.setCredentials({
    access_token: user.googleAccount.accessToken,
    refresh_token: user.googleAccount.refreshToken ?? undefined,
  });

  return google.calendar({ version: "v3", auth: client });
}

export async function getUpcomingEvents() {
  const calendar = await getCalendarClient();
  const now = new Date().toISOString();

  const result = await calendar.events.list({
    calendarId: "primary",
    timeMin: now,
    maxResults: 10,
    singleEvents: true,
    orderBy: "startTime",
  });

  return result.data.items ?? [];
}