import { google } from "googleapis";
import { getCurrentUser } from "@/lib/auth";
import { getAuthorizedGoogleOAuthClient } from "@/lib/google";


type GmailCandidate = {
  id: string;
  threadId?: string | null;
  snippet: string;
  subject: string;
  from: string;
  to: string;
  date: string;
  score: number;
};

function getHeader(
  headers: Array<{ name?: string | null; value?: string | null }> | undefined,
  name: string
) {
  return (
    headers?.find((h) => h.name?.toLowerCase() === name.toLowerCase())?.value ?? ""
  );
}

function normalizeEmail(value: string) {
  const match = value.match(/([A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,})/i);
  return match ? match[1].toLowerCase() : value.toLowerCase().trim();
}

function tokenizeTitle(title: string) {
  return title
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .split(/\s+/)
    .map((t) => t.trim())
    .filter((t) => t.length >= 3)
    .filter(
      (t) =>
        ![
          "the",
          "and",
          "for",
          "with",
          "from",
          "that",
          "this",
          "sync",
          "meeting",
          "check",
          "checkin",
          "standup",
        ].includes(t)
    );
}

function daysAgo(dateString: string) {
  const ts = Date.parse(dateString);
  if (Number.isNaN(ts)) return 9999;
  const diffMs = Date.now() - ts;
  return diffMs / (1000 * 60 * 60 * 24);
}

function scoreMessage(input: {
  eventTitle: string;
  attendeeEmails: string[];
  subject: string;
  from: string;
  to: string;
  snippet: string;
  date: string;
}) {
  let score = 0;

  const title = input.eventTitle.toLowerCase();
  const subject = input.subject.toLowerCase();
  const snippet = input.snippet.toLowerCase();
  const from = normalizeEmail(input.from);
  const to = input.to.toLowerCase();

  // Strong signal: exact/near-exact title in subject
  if (title && subject.includes(title)) score += 8;

  // Keyword overlap from title
  const keywords = tokenizeTitle(input.eventTitle);
  for (const keyword of keywords) {
    if (subject.includes(keyword)) score += 3;
    if (snippet.includes(keyword)) score += 1;
  }

  // Attendee overlap
  for (const attendee of input.attendeeEmails.map(normalizeEmail)) {
    if (from.includes(attendee)) score += 4;
    if (to.includes(attendee)) score += 2;
  }

  // Recency boost
  const ageDays = daysAgo(input.date);
  if (ageDays <= 7) score += 4;
  else if (ageDays <= 30) score += 2;
  else if (ageDays <= 90) score += 1;

  return score;
}

export async function getGmailClient() {
  const user = await getCurrentUser();

  if (!user?.googleAccount) {
    throw new Error("Google account not connected");
  }

  const client = await getAuthorizedGoogleOAuthClient(user.googleAccount);

  return google.gmail({ version: "v1", auth: client });
}

async function listCandidateMessageIds(
  queries: string[],
  maxPerQuery = 10
): Promise<string[]> {
  const gmail = await getGmailClient();
  const ids = new Set<string>();

  for (const q of queries) {
    if (!q.trim()) continue;

    const result = await gmail.users.messages.list({
      userId: "me",
      q,
      maxResults: maxPerQuery,
    });

    for (const msg of result.data.messages ?? []) {
      if (msg.id) ids.add(msg.id);
    }
  }

  return Array.from(ids);
}

export async function findRelevantEmailsForEvent(input: {
  eventTitle: string;
  attendeeEmails: string[];
  eventStart?: string;
}) {
  const gmail = await getGmailClient();

  const titleKeywords = tokenizeTitle(input.eventTitle).slice(0, 5);
  const attendeeQueries = input.attendeeEmails.slice(0, 5).map((email) => {
    const normalized = normalizeEmail(email);
    return `from:${normalized} OR to:${normalized}`;
  });

  const keywordQuery =
    titleKeywords.length > 0 ? titleKeywords.map((k) => `"${k}"`).join(" ") : "";

  const recentWindow = "newer_than:120d";

  const queries = [
    input.eventTitle ? `subject:"${input.eventTitle}" ${recentWindow}` : "",
    keywordQuery ? `${keywordQuery} ${recentWindow}` : "",
    ...attendeeQueries.map((q) => `${q} ${recentWindow}`),
  ];

  const messageIds = await listCandidateMessageIds(queries, 10);

  const messages = await Promise.all(
    messageIds.map((id) =>
      gmail.users.messages.get({
        userId: "me",
        id,
      })
    )
  );

  const scored: GmailCandidate[] = messages.map((r) => {
    const payload = r.data.payload;
    const headers = payload?.headers ?? [];

    const subject = getHeader(headers, "Subject");
    const from = getHeader(headers, "From");
    const to = getHeader(headers, "To");
    const date = getHeader(headers, "Date");
    const snippet = r.data.snippet || "";

    const score = scoreMessage({
      eventTitle: input.eventTitle,
      attendeeEmails: input.attendeeEmails,
      subject,
      from,
      to,
      snippet,
      date,
    });

    return {
      id: r.data.id || "",
      threadId: r.data.threadId,
      snippet,
      subject,
      from,
      to,
      date,
      score,
    };
  });

  return scored
    .filter((m) => m.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);
}