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
    
    // Filter by authenticated user_id
    const batchFilter = { user_id: userId };
    const alertFilter = { user_id: userId, resolved_at: null };
    
    const [total_batches, safe_batches, risk_batches, open_alerts, recent_batches] = await Promise.all([
      database.collection("batches").countDocuments(batchFilter), 
      database.collection("batches").countDocuments({ ...batchFilter, current_status: "safe" }),
      database.collection("batches").countDocuments({ ...batchFilter, current_status: { $in: ["at_risk", "critical"] } }), 
      database.collection("alerts").countDocuments(alertFilter),
      database.collection("batches").find(batchFilter, { projection: { _id: 0, public_id: 1, product_name: 1, current_status: 1, created_at: 1 } }).sort({ created_at: -1 }).limit(8).toArray()
    ]);
    return NextResponse.json({ total_batches, safe_batches, risk_batches, open_alerts, recent_batches });
  } catch (error) { return NextResponse.json({ detail: error instanceof Error ? error.message : "Database unavailable" }, { status: 503 }); }
}
