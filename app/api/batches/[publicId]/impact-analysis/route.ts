import { NextResponse } from "next/server";
import { db } from "@/lib/mongodb";
import { notFound, id } from "@/lib/api";
import { verifyToken } from "@/lib/token";
import { analyzeDownstreamImpact, generateRecallNotification } from "@/lib/impact-analysis";

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

export async function GET(
  request: Request,
  { params }: { params: Promise<{ publicId: string }> }
) {
  try {
    const userId = verifyAuth(request);
    if (!userId) {
      return NextResponse.json({ detail: "Unauthorized" }, { status: 401 });
    }
    
    const { publicId } = await params;
    const database = await db();
    
    const batch = await database.collection("batches").findOne({ 
      public_id: publicId 
    });
    
    if (!batch) {
      return notFound();
    }
    
    // Perform downstream impact analysis
    const impactAnalysis = await analyzeDownstreamImpact(batch._id, database);
    
    // Generate recall notification content
    const recallNotification = generateRecallNotification(impactAnalysis);
    
    return NextResponse.json({
      impact_analysis: impactAnalysis,
      recall_notification: recallNotification,
      analysis_metadata: {
        performed_at: new Date(),
        performed_by: userId,
        batch_status: batch.current_status
      }
    });
    
  } catch (error) {
    console.error("Impact analysis error:", error);
    return NextResponse.json(
      { detail: error instanceof Error ? error.message : "Impact analysis failed" },
      { status: 500 }
    );
  }
}