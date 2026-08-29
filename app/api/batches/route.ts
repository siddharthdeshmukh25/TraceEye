import { NextResponse } from "next/server";
import { db } from "@/lib/mongodb";
import { dbWrapper } from "@/lib/database-wrapper";
import { badRequest, id, publicId } from "@/lib/api";
import { verifyToken } from "@/lib/token";
import { createInitialBatchHash } from "@/lib/hash-chain";

export const runtime = "nodejs";

// Middleware to verify token
function verifyAuth(request: Request): string | null {
  const authHeader = request.headers.get("authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }
  const token = authHeader.substring(7);
  const payload = verifyToken(token);
  return payload?.id || null;
}

export async function GET(request: Request) {
  try {
    const userId = verifyAuth(request);
    if (!userId) {
      return NextResponse.json({ detail: "Unauthorized" }, { status: 401 });
    }
    
    // Use database wrapper with fallback
    const result = await dbWrapper.getDataWithFallback(
      "batches",
      { user_id: userId },
      "traceeye_cache_batches"
    );
    
    if (result.error && result.source === 'fallback') {
      return NextResponse.json({ 
        detail: "Database unavailable - no cached data available",
        usingCache: false,
        systemStatus: "degraded"
      }, { status: 503 });
    }
    
    const batches = result.data || [];
    
    // Try to get producers, with fallback
    let producers = [];
    try {
      const database = await db();
      producers = await database.collection("organizations").find({ _id: { $in: batches.map((batch) => batch.producer_id) } }).toArray();
    } catch (error) {
      console.error("Error fetching producers:", error);
      // Continue with empty producers array
    }
    
    const producerNames = new Map(producers.map((producer) => [producer._id.toString(), producer.name]));
    
    const batchData = batches.map((batch) => ({ 
      id: batch._id?.toString() || batch.id, 
      public_id: batch.public_id, 
      product_name: batch.product_name, 
      producer_name: producerNames.get(batch.producer_id?.toString()) ?? "Unknown producer", 
      origin_name: batch.origin_name, 
      initial_quantity_kg: batch.initial_quantity_kg, 
      quality_grade: batch.quality_grade, 
      storage_min_c: batch.storage_min_c, 
      storage_max_c: batch.storage_max_c, 
      current_status: batch.current_status, 
      created_at: batch.created_at 
    }));
    
    const response = NextResponse.json(batchData);
    
    // Add warning header if using cache
    if (result.source === 'cache') {
      response.headers.set('X-System-Status', 'degraded');
      response.headers.set('X-Data-Source', 'cache');
    }
    
    return response;
    
  } catch (error) { 
    return NextResponse.json({ 
      detail: error instanceof Error ? error.message : "Database unavailable",
      systemStatus: "critical"
    }, { status: 503 }); 
  }
}

export async function POST(request: Request) {
  try {
    const userId = verifyAuth(request);
    if (!userId) {
      return NextResponse.json({ detail: "Unauthorized" }, { status: 401 });
    }
    
    const body = await request.json(); 
    console.log("Batch creation request:", body);
    
    const producerId = id(body.producer_id);
    if (!producerId || !body.product_name || !body.origin_name || !body.initial_quantity_kg || !body.quality_grade) return badRequest("Missing or invalid batch fields");
    
    const database = await db(); 
    if (!await database.collection("organizations").findOne({ _id: producerId })) return badRequest("Producer not found");
    
    const public_id = publicId(); 
    const createdAt = new Date();
    
    // Create initial hash for the batch (hash chain genesis)
    const initialHash = createInitialBatchHash({
      publicId,
      productName: body.product_name,
      originName: body.origin_name,
      quantity: Number(body.initial_quantity_kg),
      qualityGrade: body.quality_grade,
      createdAt
    });
    
    const item = { 
      public_id, 
      product_name: body.product_name, 
      producer_id: producerId, 
      origin_name: body.origin_name, 
      latitude: body.latitude ?? null, 
      longitude: body.longitude ?? null, 
      initial_quantity_kg: Number(body.initial_quantity_kg), 
      quality_grade: body.quality_grade, 
      storage_min_c: Number(body.storage_min_c ?? 0), 
      storage_max_c: Number(body.storage_max_c ?? 8), 
      ingredient_batch_ids: (body.ingredient_batch_ids ?? []).map(id).filter(Boolean), 
      current_status: "safe", 
      user_id: userId, // Use authenticated user ID
      integrity_hash: initialHash, // Add initial hash for chain
      created_at: createdAt 
    };
    
    console.log("Inserting batch:", item);
    const result = await database.collection("batches").insertOne(item); 
    console.log("Batch inserted:", result);
    
    const web = process.env.NEXT_PUBLIC_WEB_URL || "http://localhost:3000";
    return NextResponse.json({ 
      id: result.insertedId.toString(), 
      public_id, 
      trace_url: `${web}/trace/${public_id}`, 
      qr_url: `/api/batches/${publicId}/qr`,
      secure_qr_url: `/api/batches/${publicId}/qr?encrypted=true`
    }, { status: 201 });
  } catch (error) {
    console.error("Batch creation error:", error);
    return NextResponse.json({ detail: error instanceof Error ? error.message : "Batch creation failed" }, { status: 500 });
  }
}
