import { NextResponse } from "next/server";
import { db } from "@/lib/mongodb";
import { verifyToken } from "@/lib/token";
import { ObjectId } from "mongodb";

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

    const { searchParams } = new URL(request.url);
    const batchId = searchParams.get("batch_id");
    const limit = parseInt(searchParams.get("limit") || "50");

    const database = await db();

    // Build filter based on user's batches
    const userBatches = await database.collection("batches")
      .find({ user_id: userId })
      .project({ _id: 1, public_id: 1, product_name: 1 })
      .toArray();

    const batchIds = userBatches.map(b => b._id);
    const batchMap = new Map(userBatches.map(b => [b._id.toString(), b]));

    let filter: any = { batch_id: { $in: batchIds } };
    
    // If specific batch_id is provided, filter by it
    if (batchId) {
      filter = { batch_id: new ObjectId(batchId) };
    }

    const visits = await database.collection("card_visits")
      .find(filter)
      .sort({ visited_at: -1 })
      .limit(limit)
      .toArray();

    // Enrich visits with batch information
    const enrichedVisits = visits.map(visit => {
      const batch = batchMap.get(visit.batch_id.toString());
      return {
        id: visit._id.toString(),
        batch_public_id: visit.batch_public_id,
        product_name: batch?.product_name || "Unknown Product",
        latitude: visit.latitude,
        longitude: visit.longitude,
        location_name: visit.location_name,
        visitor_ip: visit.visitor_ip,
        device_info: visit.device_info,
        visited_at: visit.visited_at
      };
    });

    return NextResponse.json({ 
      visits: enrichedVisits,
      total: enrichedVisits.length
    });
  } catch (error) {
    console.error("Card visits fetch error:", error);
    return NextResponse.json({ 
      detail: error instanceof Error ? error.message : "Failed to fetch visits" 
    }, { status: 500 });
  }
}
