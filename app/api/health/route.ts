import { NextResponse } from "next/server";
import { db } from "@/lib/mongodb";
export const runtime = "nodejs";
export async function GET() {
  try {
    await (await db()).command({ ping: 1 });
    return NextResponse.json({
      status: "ok",
      database: "connected",
      service: "traceeye-next-api",
    });
  } catch (error) {
    return NextResponse.json(
      {
        status: "error",
        database: "disconnected",
        detail:
          error instanceof Error ? error.message : "MongoDB is unavailable",
      },
      { status: 503 },
    );
  }
}
