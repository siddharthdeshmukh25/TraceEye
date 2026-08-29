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

    // Get user info (the person who created this account)
    let userName = producer?.name || "Unknown"; // Default to organization name
    let userEmail = producer?.contact_email;
    if (batch.user_id) {
      const user = await database.collection("users").findOne({ 
        _id: batch.user_id 
      });
      if (user) {
        userName = user.full_name || user.name || producer?.name || "Unknown";
        userEmail = user.email || userEmail;
      }
    }

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
      producer_email: userEmail || "contact@traceeye.com",
      producer_location: producer?.location_name || null,
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