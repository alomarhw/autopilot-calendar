export function buildMeetingBriefPrompt(input: {
  title: string;
  start: string;
  attendees: string[];
  emailSnippets: string[];
}) {
  return `You are helping a busy professional prepare for a meeting.

Write a concise meeting brief in clean markdown.

Use exactly these section headings in this exact order:

## Purpose
## Relevant Context
## Likely Decisions Needed
## Suggested Agenda
## Open Questions

Rules:
- Do not invent facts.
- If something is uncertain, say "Likely" or "Possibly".
- Be concise, practical, and clear.
- Use bullet points where helpful.
- If there is little context, say that clearly instead of guessing.
- Keep the tone professional and useful.

Meeting title: ${input.title}
Start: ${input.start}
Attendees: ${input.attendees.join(", ") || "Unknown"}
Related email snippets:
${input.emailSnippets.length > 0 ? input.emailSnippets.map((s, i) => `${i + 1}. ${s}`).join("\n") : "No related email snippets found."}
`;
}