import { NextResponse } from "next/server";
import { db } from "@/lib/mongodb";
import { verifyToken } from "@/lib/token";

export const runtime = "nodejs";

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
    
    const database = await db();
    
    // Filter alerts by user_id
    const filter = { user_id: userId, resolved_at: null };
    
    const alerts = await database.collection("alerts").find(filter).sort({ created_at: -1 }).limit(20).toArray();
    const batches = await database.collection("batches").find({ _id: { $in: alerts.map((alert) => alert.batch_id) } }, { projection: { public_id: 1, product_name: 1 } }).toArray(); 
    const batchMap = new Map(batches.map((batch) => [batch._id.toString(), batch]));
    
    const alertData = alerts.map((alert) => ({ 
      id: alert._id.toString(), 
      severity: alert.severity, 
      title: alert.title, 
      message: alert.message, 
      affected_locations: alert.affected_locations, 
      created_at: alert.created_at, 
      batch: batchMap.get(alert.batch_id.toString()) ?? null 
    }));
    
    return NextResponse.json(alertData);
  } catch (error) { return NextResponse.json({ detail: error instanceof Error ? error.message : "Database unavailable" }, { status: 503 }); }
}
