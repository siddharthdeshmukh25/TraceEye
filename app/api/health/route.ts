import { NextResponse } from "next/server";
import { db } from "@/lib/mongodb";

export const runtime = "nodejs";

// Track uptime and errors
let startTime = Date.now();
let errorCount = 0;

export async function GET() {
  try {
    await (await db()).command({ ping: 1 });
    return NextResponse.json({
      status: "ok",
      database: "connected",
      service: "traceeye-next-api",
      uptime: Date.now() - startTime,
      errorCount: errorCount,
    });
  } catch (error) {
    errorCount++;
    return NextResponse.json(
      {
        status: "error",
        database: "disconnected",
        detail: error instanceof Error ? error.message : "MongoDB is unavailable",
        uptime: Date.now() - startTime,
        errorCount: errorCount,
      },
      { status: 503 },
    );
  }
}
