import { NextResponse } from "next/server";
import { db } from "@/lib/mongodb";

export const runtime = "nodejs";

export async function GET(
  _: Request,
  { params }: { params: { publicId: string } }
) {
  try {
    const database = await db();
    const batch = await database.collection("batches").findOne({ 
      public_id: params.publicId 
    });
    
    if (!batch) {
      return NextResponse.json({ detail: "Batch not found" }, { status: 404 });
    }

    // Get producer info
    const producer = await database.collection("organizations").findOne({ 
      _id: batch.producer_id 
    });

    // Get handovers for this batch
    const handovers = await database.collection("handovers")
      .find({ batch_id: batch._id })
      .sort({ created_at: 1 })
      .toArray();

    // Get ingredients if any
    const ingredients = [];
    if (batch.ingredient_batch_ids && batch.ingredient_batch_ids.length > 0) {
      const ingredientBatches = await database.collection("batches")
        .find({ _id: { $in: batch.ingredient_batch_ids } })
        .project({ public_id: 1, product_name: 1 })
        .toArray();
      ingredients.push(...ingredientBatches);
    }

    return NextResponse.json({
      public_id: batch.public_id,
      product_name: batch.product_name,
      origin_name: batch.origin_name,
      initial_quantity_kg: batch.initial_quantity_kg,
      quality_grade: batch.quality_grade,
      current_status: batch.current_status,
      created_at: batch.created_at,
      producer_name: producer?.name || "Unknown producer",
      handovers: handovers.map((h) => ({
        created_at: h.created_at,
        status: h.status,
        weight_kg: h.weight_kg,
        receiver: h.receiver,
        location: h.location,
        integrity_hash: h.integrity_hash
      })),
      ingredients: ingredients.map((i) => ({
        public_id: i.public_id,
        product_name: i.product_name
      }))
    });
  } catch (error) {
    console.error("Public batch error:", error);
    return NextResponse.json(
      { detail: "Failed to fetch batch" },
      { status: 500 }
    );
  }
}