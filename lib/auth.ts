import { cookies } from "next/headers";
import { prisma } from "@/lib/db";

export async function getCurrentUser() {
  const cookieStore = await cookies();
  const email = cookieStore.get("app_user_email")?.value;

  if (!email) return null;

  return prisma.user.findUnique({
    where: { email },
    include: { googleAccount: true },
  });
}