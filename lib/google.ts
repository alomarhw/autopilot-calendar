import { google } from "googleapis";
import { prisma } from "@/lib/db";

const GOOGLE_SCOPES = [
  "openid",
  "email",
  "profile",
  "https://www.googleapis.com/auth/calendar.readonly",
  "https://www.googleapis.com/auth/gmail.readonly",
];

export function getGoogleOAuthClient() {
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

export async function getAuthorizedGoogleOAuthClient(googleAccount: {
  id: string;
  accessToken: string;
  refreshToken: string | null;
  expiryDate: Date | null;
}) {
  const client = getGoogleOAuthClient();

  client.setCredentials({
    access_token: googleAccount.accessToken,
    refresh_token: googleAccount.refreshToken ?? undefined,
    expiry_date: googleAccount.expiryDate
      ? googleAccount.expiryDate.getTime()
      : undefined,
  });

  const expiresSoon =
    !googleAccount.expiryDate ||
    googleAccount.expiryDate.getTime() - Date.now() < 5 * 60 * 1000;

  if (expiresSoon) {
    if (!googleAccount.refreshToken) {
      throw new Error("Google refresh token missing. Please reconnect Google.");
    }

    const { credentials } = await client.refreshAccessToken();

    client.setCredentials({
      access_token: credentials.access_token ?? googleAccount.accessToken,
      refresh_token: credentials.refresh_token ?? googleAccount.refreshToken,
      expiry_date: credentials.expiry_date ?? googleAccount.expiryDate?.getTime(),
    });

    await prisma.googleAccount.update({
      where: { id: googleAccount.id },
      data: {
        accessToken: credentials.access_token ?? googleAccount.accessToken,
        refreshToken: credentials.refresh_token ?? googleAccount.refreshToken,
        expiryDate: credentials.expiry_date
          ? new Date(credentials.expiry_date)
          : googleAccount.expiryDate,
        scope: credentials.scope ?? undefined,
      },
    });
  }

  return client;
}