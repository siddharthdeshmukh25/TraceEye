import { NextResponse } from "next/server";
import { db } from "@/lib/mongodb";
import { notFound } from "@/lib/api";
import { verifyHashChain } from "@/lib/hash-chain";

export const runtime = "nodejs";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ publicId: string }> }
) {
  try {
    const { publicId } = await params;
    const database = await db();
    
    // Get batch
    const batch = await database.collection("batches").findOne({ 
      public_id: publicId 
    });
    
    if (!batch) {
      return notFound();
    }
    
    // Get all handovers for this batch
    const handovers = await database.collection("handovers")
      .find({ batch_id: batch._id })
      .sort({ created_at: 1 })
      .toArray();
    
    // Get sensor readings for additional events
    const readings = await database.collection("sensor_readings")
      .find({ batch_id: batch._id })
      .sort({ recorded_at: 1 })
      .toArray();
    
    // Create unified event chain
    const eventChain = [];
    
    // Add batch creation as first event
    eventChain.push({
      _id: batch._id,
      batch_id: batch.public_id,
      event_type: 'batch_created',
      created_at: batch.created_at,
      handler: 'system',
      location: batch.origin_name,
      weight_kg: batch.initial_quantity_kg,
      integrity_hash: batch.integrity_hash,
      previous_hash: null
    });
    
    // Add handovers
    handovers.forEach(handover => {
      eventChain.push({
        _id: handover._id,
        batch_id: batch.public_id,
        event_type: handover.status || 'handover',
        created_at: handover.created_at,
        handler: handover.receiver,
        location: handover.location,
        weight_kg: handover.weight_kg,
        temperature: handover.temperature,
        humidity: handover.humidity,
        integrity_hash: handover.integrity_hash,
        previous_hash: handover.previous_hash
      });
    });
    
    // Add sensor readings as events
    readings.forEach((reading, index) => {
      const previousEvent = eventChain[eventChain.length - 1];
      eventChain.push({
        _id: reading._id,
        batch_id: batch.public_id,
        event_type: 'sensor_reading',
        created_at: reading.recorded_at,
        handler: 'iot_sensor',
        location: 'storage',
        temperature: reading.temperature_c,
        humidity: reading.humidity_pct,
        integrity_hash: null, // Sensor readings don't have hash chain yet
        previous_hash: previousEvent?.integrity_hash || null
      });
    });
    
    // Verify hash chain (only for events that have hashes)
    const hashedEvents = eventChain.filter(e => e.integrity_hash !== null);
    const verificationResult = hashedEvents.length > 0 
      ? verifyHashChain(hashedEvents)
      : { valid: true, breakPoint: null, details: [] };
    
    return NextResponse.json({
      batch_id: publicId,
      product_name: batch.product_name,
      total_events: eventChain.length,
      hashed_events: hashedEvents.length,
      integrity_verified: verificationResult.valid,
      break_point: verificationResult.breakPoint,
      verification_details: verificationResult.details,
      event_chain: eventChain.map(e => ({
        id: e._id?.toString(),
        event_type: e.event_type,
        timestamp: e.created_at,
        handler: e.handler,
        location: e.location,
        integrity_hash: e.integrity_hash,
        has_hash: e.integrity_hash !== null
      }))
    });
    
  } catch (error) {
    console.error("Integrity verification error:", error);
    return NextResponse.json(
      { detail: error instanceof Error ? error.message : "Integrity verification failed" },
      { status: 500 }
    );
  }
}