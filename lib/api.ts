import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";

export const badRequest = (message: string) => NextResponse.json({ detail: message }, { status: 400 });
export const notFound = (message = "Batch not found") => NextResponse.json({ detail: message }, { status: 404 });
export const id = (value: string) => ObjectId.isValid(value) ? new ObjectId(value) : null;
export const serialize = <T>(value: T): T => JSON.parse(JSON.stringify(value));
export const publicId = () => `TE-${new Date().toISOString().slice(0, 10).replaceAll("-", "")}-${Math.random().toString(16).slice(2, 8).toUpperCase()}`;

export function risk(readings: { temperature_c: number; humidity_pct: number; marker_status: string }[], min: number, max: number) {
  const reasons: string[] = [];
  const tampered = readings.some((r) => ["tampered", "missing", "anomaly"].includes(r.marker_status.toLowerCase()));
  const outOfRange = readings.filter((r) => r.temperature_c < min || r.temperature_c > max);
  const severe = readings.some((r) => r.temperature_c > max + 5 || r.temperature_c < min - 5);
  const humid = readings.some((r) => r.humidity_pct > 90);
  if (tampered) reasons.push("Tamper-evident visual marker anomaly detected.");
  if (outOfRange.length) reasons.push(`${outOfRange.length} temperature reading(s) outside the approved storage range.`);
  if (humid) reasons.push("Humidity exceeded the 90% safety threshold.");
  if (tampered || severe || outOfRange.length >= 3) return { status: "critical", reasons };
  if (outOfRange.length || humid) return { status: "at_risk", reasons };
  return { status: "safe", reasons: ["All available sensor and marker checks are within policy."] };
}
