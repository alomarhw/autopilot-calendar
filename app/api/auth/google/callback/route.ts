import { NextRequest, NextResponse } from "next/server";
import { getGoogleOAuthClient } from "@/lib/google";
import { prisma } from "@/lib/db";
import { google } from "googleapis";

export async function GET(req: NextRequest) {
  try {
    const code = req.nextUrl.searchParams.get("code");

    if (!code) {
      return NextResponse.redirect(new URL("/?error=missing_code", req.url));
    }

    const client = getGoogleOAuthClient();
    const { tokens } = await client.getToken(code);
    client.setCredentials(tokens);

    const oauth2 = google.oauth2({ version: "v2", auth: client });
    const me = await oauth2.userinfo.get();

    const email = me.data.email;
    const googleSub = me.data.id;

    if (!email || !googleSub) {
      return NextResponse.redirect(
        new URL("/?error=missing_google_user", req.url)
      );
    }

    const user = await prisma.user.upsert({
      where: { email },
      update: {
        name: me.data.name ?? undefined,
        image: me.data.picture ?? undefined,
      },
      create: {
        email,
        name: me.data.name ?? undefined,
        image: me.data.picture ?? undefined,
      },
    });

    await prisma.googleAccount.upsert({
      where: { userId: user.id },
      update: {
        googleSub,
        accessToken: tokens.access_token ?? "",
        refreshToken: tokens.refresh_token ?? undefined,
        expiryDate: tokens.expiry_date
          ? new Date(tokens.expiry_date)
          : undefined,
        scope: tokens.scope ?? undefined,
      },
      create: {
        userId: user.id,
        googleSub,
        accessToken: tokens.access_token ?? "",
        refreshToken: tokens.refresh_token ?? undefined,
        expiryDate: tokens.expiry_date
          ? new Date(tokens.expiry_date)
          : undefined,
        scope: tokens.scope ?? undefined,
      },
    });

    const res = NextResponse.redirect(new URL("/dashboard", req.url));
    res.cookies.set("app_user_email", email, {
      httpOnly: true,
      sameSite: "lax",
      secure: false,
      path: "/",
    });

    return res;
      } catch (error: any) {
    console.error("OAuth callback error:", error);

    let message = "oauth_callback_failed";

    const raw =
      error?.message ||
      error?.cause?.message ||
      String(error);

    if (raw.includes("self-signed certificate")) {
      message = "database_tls_error";
    } else if (raw.includes("Can't reach database server")) {
      message = "database_not_reachable";
    } else if (raw.includes("DatabaseNotReachable")) {
      message = "database_not_reachable";
    } else if (error?.response?.data?.error) {
      message = error.response.data.error;
    }

    return NextResponse.redirect(
      new URL(`/?error=${encodeURIComponent(message)}`, req.url)
    );
  }
}