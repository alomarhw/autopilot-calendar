import { google } from "googleapis";

const GOOGLE_SCOPES = [
  "openid",
  "email",
  "profile",
  "https://www.googleapis.com/auth/calendar.readonly",
  "https://www.googleapis.com/auth/gmail.readonly",
];

export function getGoogleOAuthClient() {
  console.log("GOOGLE_CLIENT_ID loaded:", !!process.env.GOOGLE_CLIENT_ID);
  console.log("GOOGLE_CLIENT_SECRET loaded:", !!process.env.GOOGLE_CLIENT_SECRET);
  console.log("GOOGLE_REDIRECT_URI:", process.env.GOOGLE_REDIRECT_URI);

  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );
}

export function getGoogleAuthUrl() {
  const client = getGoogleOAuthClient();

  return client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: GOOGLE_SCOPES,
  });
}