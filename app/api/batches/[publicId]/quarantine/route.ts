import { NextResponse } from "next/server";
import { db } from "@/lib/mongodb";
import { notFound, id } from "@/lib/api";
import { verifyToken } from "@/lib/token";

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

export async function POST(
  request: Request,
  { params }: { params: Promise<{ publicId: string }> }
) {
  try {
    const userId = verifyAuth(request);
    if (!userId) {
      return NextResponse.json({ detail: "Unauthorized" }, { status: 401 });
    }
    
    const { publicId } = await params;
    const body = await request.json();
    const { reason, severity = 'critical' } = body;
    
    if (!reason) {
      return NextResponse.json({ detail: "Quarantine reason is required" }, { status: 400 });
    }
    
    const database = await db();
    const batch = await database.collection("batches").findOne({ 
      public_id: publicId 
    });
    
    if (!batch) {
      return notFound();
    }
    
    // Check if already quarantined
    if (batch.current_status === 'quarantined') {
      return NextResponse.json({ 
        detail: "Batch is already quarantined" 
      }, { status: 400 });
    }
    
    // Update batch to quarantined status
    const quarantineAt = new Date();
    await database.collection("batches").updateOne(
      { _id: batch._id },
      {
        $set: {
          current_status: 'quarantined',
          quarantine_reason: reason,
          quarantine_at: quarantineAt,
          quarantine_by: id(userId)
        }
      }
    );
    
    // Create quarantine alert
    const handovers = await database.collection("handovers")
      .find({ batch_id: batch._id })
      .toArray();
    
    const receivers = await database.collection("organizations")
      .find({ _id: { $in: handovers.map((h) => h.receiver_id).filter(Boolean) } })
      .toArray();
    
    const locations = [...new Set(receivers.map((r) => r.location_name).filter(Boolean))];
    
    await database.collection("alerts").insertOne({
      batch_id: batch._id,
      user_id: id(userId),
      severity: severity,
      title: `Batch ${publicId} Quarantined`,
      message: `Quarantine reason: ${reason}`,
      affected_locations: locations,
      resolved_at: null,
      created_at: new Date()
    });
    
    return NextResponse.json({
      batch_id: publicId,
      status: 'quarantined',
      quarantine_reason: reason,
      quarantine_at: quarantineAt,
    quarantined_by: userId,
      affected_locations: locations,
      message: "Batch successfully quarantined and blocked from normal supply chain progression"
    }, { status: 200 });
    
  } catch (error) {
    console.error("Quarantine error:", error);
    return NextResponse.json(
      { detail: error instanceof Error ? error.message : "Quarantine failed" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ publicId: string }> }
) {
  try {
    const userId = verifyAuth(request);
    if (!userId) {
      return NextResponse.json({ detail: "Unauthorized" }, { status: 401 });
    }
    
    const { publicId } = await params;
    const body = await request.json();
    const { releaseReason } = body;
    
    if (!releaseReason) {
      return NextResponse.json({ detail: "Release reason is required" }, { status: 400 });
    }
    
    const database = await db();
    const batch = await database.collection("batches").findOne({ 
      public_id: publicId 
    });
    
    if (!batch) {
      return notFound();
    }
    
    // Check if batch is quarantined
    if (batch.current_status !== 'quarantined') {
      return NextResponse.json({ 
        detail: "Batch is not quarantined" 
      }, { status: 400 });
    }
    
    // Assess risk before releasing
    const readings = await database.collection("sensor_readings")
      .find({ batch_id: batch._id })
      .sort({ recorded_at: -1 })
      .limit(50)
      .toArray();
    
    // Basic risk assessment for release decision
    const hasCriticalIssues = readings.some(r => 
      r.temperature_c > batch.storage_max_c + 5 || 
      r.temperature_c < batch.storage_min_c - 5 ||
      r.marker_status === 'tampered'
    );
    
    if (hasCriticalIssues) {
      return NextResponse.json({ 
        detail: "Cannot release batch: Critical safety issues remain. Address issues before release.",
        requires_manual_review: true
      }, { status: 400 });
    }
    
    // Release from quarantine (revert to at_risk for monitoring)
    await database.collection("batches").updateOne(
      { _id: batch._id },
      {
        $set: {
          current_status: 'at_risk', // Start with at_risk for monitoring
          quarantine_reason: null,
          quarantine_at: null,
          quarantine_by: null
        }
      }
    );
    
    // Resolve quarantine alert
    await database.collection("alerts").updateOne(
      {
        batch_id: batch._id,
        title: { $regex: /Quarantined/i },
        resolved_at: null
      },
      {
        $set: {
          resolved_at: new Date(),
          message: `Batch released from quarantine. Reason: ${releaseReason}`
        }
      }
    );
    
    return NextResponse.json({
      batch_id: publicId,
      status: 'at_risk',
      message: "Batch released from quarantine and set to monitoring status",
      release_reason: releaseReason,
      released_at: new Date()
    }, { status: 200 });
    
  } catch (error) {
    console.error("Quarantine release error:", error);
    return NextResponse.json(
      { detail: error instanceof Error ? error.message : "Quarantine release failed" },
      { status: 500 }
    );
  }
}