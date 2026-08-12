import { NextResponse } from "next/server";
import { db } from "@/lib/mongodb";
import { notFound } from "@/lib/api";
export const runtime = "nodejs";
export async function GET(_: Request, { params }: { params: { publicId: string } }) {
  const database = await db(); const batch = await database.collection("batches").findOne({ public_id: params.publicId }); if (!batch) return notFound();
  const [producer, handovers, ingredients] = await Promise.all([
    database.collection("organizations").findOne({ _id: batch.producer_id }), database.collection("handovers").find({ batch_id: batch._id }).sort({ created_at: 1 }).toArray(),
    database.collection("batches").find({ _id: { $in: batch.ingredient_batch_ids ?? [] } }, { projection: { public_id: 1, product_name: 1 } }).toArray()
  ]);
  const receivers = await database.collection("organizations").find({ _id: { $in: handovers.map((h) => h.receiver_id) } }).toArray(); const names = new Map(receivers.map((r) => [r._id.toString(), r]));
  return NextResponse.json({ public_id: batch.public_id, product_name: batch.product_name, origin_name: batch.origin_name, initial_quantity_kg: batch.initial_quantity_kg, quality_grade: batch.quality_grade, current_status: batch.current_status, created_at: batch.created_at, producer_name: producer?.name ?? "Unknown producer", handovers: handovers.map((h) => ({ created_at: h.created_at, status: h.status, weight_kg: h.weight_kg, receiver: names.get(h.receiver_id.toString())?.name ?? "Unknown receiver", location: names.get(h.receiver_id.toString())?.location_name ?? null, integrity_hash: h.integrity_hash ?? null })), ingredients: ingredients.map((i) => ({ public_id: i.public_id, product_name: i.product_name })) });
}
