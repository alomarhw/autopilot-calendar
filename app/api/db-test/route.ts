import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const result = await prisma.$queryRaw`SELECT 1 as ok`;
    return NextResponse.json({ success: true, result });
  } catch (error: any) {
    console.error("DB test failed:", error);

    return NextResponse.json(
      {
        success: false,
        message: error?.message || "db_test_failed",
        cause: error?.cause?.message || null,
      },
      { status: 500 }
    );
  }
}