import { NextResponse } from "next/server";
import { db } from "@/lib/mongodb";
import { notFound, risk } from "@/lib/api";
import { verifyHashChain } from "@/lib/hash-chain";

export const runtime = "nodejs";

export async function POST(
  request: Request,
  { params }: { params: { publicId: string } }
) {
  try {
    const { publicId } = await params;
    const body = await request.json();
    
    const database = await db();
    const batch = await database.collection("batches").findOne({ 
      public_id: publicId 
    });
    
    if (!batch) {
      return notFound();
    }
    
    // Get recent sensor readings
    const readings = await database.collection("sensor_readings")
      .find({ batch_id: batch._id })
      .sort({ recorded_at: -1 })
      .limit(50)
      .toArray();
    
    // Get visual verifications for seal status
    const visualVerifications = await database.collection("visual_verifications")
      .find({ batch_id: batch._id })
      .sort({ created_at: -1 })
      .limit(5)
      .toArray();
    
    // Determine seal status
    let sealStatus: 'intact' | 'tampered' | 'suspicious' = 'intact';
    if (visualVerifications.length > 0) {
      const latestVerification = visualVerifications[0];
      if (latestVerification.verification_status === 'verified_tampered') {
        sealStatus = 'tampered';
      } else if (latestVerification.verification_status === 'flagged_review') {
        sealStatus = 'suspicious';
      }
    }
    
    // Verify trace integrity
    const handovers = await database.collection("handovers")
      .find({ batch_id: batch._id })
      .sort({ created_at: 1 })
      .toArray();
    
    let traceIntegrityValid = true;
    if (handovers.length > 0) {
      const verificationResult = verifyHashChain(handovers.map(h => ({
        ...h,
        batch_id: batch.public_id,
        event_type: h.status || 'handover',
        integrity_hash: h.integrity_hash,
        previous_hash: h.previous_hash
      })));
      traceIntegrityValid = verificationResult.valid;
    }
    
    // Calculate storage duration
    const storageDuration = batch.created_at 
      ? (Date.now() - new Date(batch.created_at).getTime()) / (1000 * 60 * 60) // hours
      : 0;
    
    // Calculate enhanced risk with additional context
    const result = risk(
      readings.map((reading) => ({
        temperature_c: Number(reading.temperature_c),
        humidity_pct: Number(reading.humidity_pct),
        marker_status: String(reading.marker_status),
        recorded_at: reading.recorded_at
      })),
      batch.storage_min_c,
      batch.storage_max_c,
      {
        sealStatus,
        transportDelay: body.transportDelay, // Optional: can be provided in request
        traceIntegrityValid,
        storageDuration
      }
    );

    // DATA CONFLICT ANOMALY: Check for sensor fraud
    // If temperature is safe (low risk score) but seal is tampered, this is suspicious
    let finalStatus = result.status;
    let quarantineReason = null;

    if (sealStatus === 'tampered' && result.status === 'safe') {
      // Sensor says safe, but physical seal is compromised - potential fraud
      finalStatus = 'quarantined';
      quarantineReason = 'DATA CONFLICT ANOMALY: Hardware sensor reports safe conditions, but the physical seal is compromised. Suspected sensor tampering.';
    }

    // Update batch status
    const updateData: any = { current_status: finalStatus };
    if (quarantineReason) {
      updateData.quarantine_reason = quarantineReason;
      updateData.quarantine_at = new Date();
    }

    await database.collection("batches").updateOne(
      { _id: batch._id },
      { $set: updateData }
    );
    
    // Create alert if critical
    if (result.status === "critical") {
      const receivers = await database.collection("organizations")
        .find({ _id: { $in: handovers.map((h) => h.receiver_id).filter(Boolean) } })
        .toArray();
      
      const locations = [...new Set(receivers.map((r) => r.location_name).filter(Boolean))];
      
      await database.collection("alerts").insertOne({
        batch_id: batch._id,
        severity: "critical",
        title: "Smart recall initiated",
        message: `Critical food-safety risk: ${result.reasons.join(", ")}`,
        affected_locations: locations,
        resolved_at: null,
        created_at: new Date()
      });
    }
    
    return NextResponse.json({
      batch_id: publicId,
      ...result,
      additional_context: {
        sealStatus,
        traceIntegrityValid,
        storageDuration: Math.round(storageDuration),
        handoverCount: handovers.length,
        readingCount: readings.length
      }
    });
    
  } catch (error) {
    console.error("Risk evaluation error:", error);
    return NextResponse.json(
      { detail: error instanceof Error ? error.message : "Risk evaluation failed" },
      { status: 500 }
    );
  }
}
