import { NextResponse } from "next/server";
import { db } from "@/lib/mongodb";
import { badRequest, notFound } from "@/lib/api";
export const runtime = "nodejs";
export async function POST(request: Request, { params }: { params: { publicId: string } }) {
  const body = await request.json(); if (!Number.isFinite(Number(body.temperature_c)) || !Number.isFinite(Number(body.humidity_pct)) || Number(body.humidity_pct) < 0 || Number(body.humidity_pct) > 100) return badRequest("Invalid sensor reading");
  const database = await db(); const batch = await database.collection("batches").findOne({ public_id: params.publicId }); if (!batch) return notFound();
  await database.collection("sensor_readings").insertOne({ batch_id: batch._id, temperature_c: Number(body.temperature_c), humidity_pct: Number(body.humidity_pct), marker_status: body.marker_status ?? "intact", recorded_at: body.recorded_at ? new Date(body.recorded_at) : new Date() }); return NextResponse.json({ accepted: true }, { status: 201 });
}
