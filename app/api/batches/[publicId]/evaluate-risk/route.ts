import { NextResponse } from "next/server";
import { db } from "@/lib/mongodb";
import { notFound, risk } from "@/lib/api";
export const runtime = "nodejs";
export async function POST(_: Request, { params }: { params: { publicId: string } }) {
  const database = await db(); const batch = await database.collection("batches").findOne({ public_id: params.publicId }); if (!batch) return notFound();
  const readings = await database.collection("sensor_readings").find({ batch_id: batch._id }).sort({ recorded_at: -1 }).limit(10).toArray(); const result = risk(readings.map((reading) => ({ temperature_c: Number(reading.temperature_c), humidity_pct: Number(reading.humidity_pct), marker_status: String(reading.marker_status) })), batch.storage_min_c, batch.storage_max_c);
  await database.collection("batches").updateOne({ _id: batch._id }, { $set: { current_status: result.status } });
  if (result.status === "critical") { const handovers = await database.collection("handovers").find({ batch_id: batch._id }).toArray(); const receivers = await database.collection("organizations").find({ _id: { $in: handovers.map((h) => h.receiver_id) } }).toArray(); const locations = [...new Set(receivers.map((r) => r.location_name).filter(Boolean))]; await database.collection("alerts").insertOne({ batch_id: batch._id, severity: "critical", title: "Smart recall initiated", message: `Critical food-safety risk: ${result.reasons.join(" ")}`, affected_locations: locations, resolved_at: null, created_at: new Date() }); }
  return NextResponse.json({ batch_id: params.publicId, ...result });
}
