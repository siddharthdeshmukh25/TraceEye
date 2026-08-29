import { NextResponse } from "next/server";
import { db } from "@/lib/mongodb";
import { notFound } from "@/lib/api";

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
    
    // Get all events in chronological order
    const events: any[] = [];
    
    // 1. Batch Creation
    events.push({
      id: batch._id.toString(),
      event_type: 'batch_created',
      timestamp: batch.created_at,
      location: batch.origin_name,
      handler: 'System',
      details: {
        product_name: batch.product_name,
        quantity: batch.initial_quantity_kg,
        quality_grade: batch.quality_grade,
        integrity_hash: batch.integrity_hash
      },
      status: 'completed',
      icon: '🌾',
      category: 'production'
    });
    
    // 2. Handovers
    const handovers = await database.collection("handovers")
      .find({ batch_id: batch._id })
      .sort({ created_at: 1 })
      .toArray();
    
    for (const handover of handovers) {
      const receiverOrg = await database.collection("organizations").findOne({
        _id: handover.receiver_id
      });
      
      events.push({
        id: handover._id.toString(),
        event_type: 'handover',
        timestamp: handover.created_at,
        location: handover.location,
        handler: receiverOrg?.name || handover.receiver,
        details: {
          weight: handover.weight_kg,
          status: handover.status,
          temperature: handover.temperature,
          humidity: handover.humidity,
          integrity_hash: handover.integrity_hash,
          previous_hash: handover.previous_hash
        },
        status: handover.status === 'verified' ? 'completed' : 'pending',
        icon: '🤝',
        category: 'logistics'
      });
    }
    
    // 3. Sensor Readings (significant ones only - temperature excursions)
    const readings = await database.collection("sensor_readings")
      .find({ batch_id: batch._id })
      .sort({ recorded_at: 1 })
      .toArray();
    
    // Identify significant readings (outside safe range or status changes)
    const significantReadings = readings.filter(reading => {
      const isOutsideRange = reading.temperature_c < batch.storage_min_c || 
                            reading.temperature_c > batch.storage_max_c;
      const isStatusChange = reading.marker_status !== 'intact';
      return isOutsideRange || isStatusChange;
    });
    
    for (const reading of significantReadings) {
      const isExcursion = reading.temperature_c < batch.storage_min_c || 
                         reading.temperature_c > batch.storage_max_c;
      
      events.push({
        id: reading._id.toString(),
        event_type: isExcursion ? 'temperature_excursion' : 'sensor_reading',
        timestamp: reading.recorded_at,
        location: 'Storage',
        handler: 'IoT Sensor',
        details: {
          temperature: reading.temperature_c,
          humidity: reading.humidity_pct,
          marker_status: reading.marker_status,
          safe_range: `${batch.storage_min_c}-${batch.storage_max_c}°C`
        },
        status: isExcursion ? 'alert' : 'completed',
        icon: isExcursion ? '🌡️' : '📊',
        category: 'monitoring'
      });
    }
    
    // 4. Visual Verifications
    const verifications = await database.collection("visual_verifications")
      .find({ batch_id: batch._id })
      .sort({ created_at: 1 })
      .toArray();
    
    for (const verification of verifications) {
      events.push({
        id: verification._id.toString(),
        event_type: 'seal_verification',
        timestamp: verification.created_at,
        location: 'Various',
        handler: verification.verified_by ? 'Manual Review' : 'AI System',
        details: {
          verification_status: verification.verification_status,
          ai_confidence: verification.ai_confidence,
          verification_method: verification.verification_method,
          image_url: verification.image_url
        },
        status: verification.verification_status === 'verified_intact' ? 'completed' : 'alert',
        icon: verification.verification_status === 'verified_intact' ? '✅' : '⚠️',
        category: 'security'
      });
    }
    
    // 5. Risk Status Changes
    // We can infer risk changes from batch status and readings
    if (batch.current_status !== 'safe') {
      // Find when the status might have changed (most recent critical reading)
      const criticalReading = readings.find(r => 
        r.temperature_c > batch.storage_max_c + 5 || 
        r.temperature_c < batch.storage_min_c - 5 ||
        r.marker_status === 'tampered'
      );
      
      if (criticalReading) {
        events.push({
          id: `risk-change-${batch._id}`,
          event_type: 'risk_status_change',
          timestamp: criticalReading.recorded_at,
          location: 'System',
          handler: 'Risk Engine',
          details: {
            previous_status: 'safe',
            current_status: batch.current_status,
            trigger: criticalReading.marker_status === 'tampered' ? 'Seal tamper detected' : 'Temperature excursion'
          },
          status: 'alert',
          icon: '🧠',
          category: 'risk'
        });
      }
    }
    
    // 6. Alerts
    const alerts = await database.collection("alerts")
      .find({ batch_id: batch._id })
      .sort({ created_at: 1 })
      .toArray();
    
    for (const alert of alerts) {
      events.push({
        id: alert._id.toString(),
        event_type: 'alert',
        timestamp: alert.created_at,
        location: 'System',
        handler: 'Alert System',
        details: {
          severity: alert.severity,
          title: alert.title,
          message: alert.message,
          affected_locations: alert.affected_locations,
          resolved: alert.resolved_at !== null
        },
        status: alert.resolved_at ? 'resolved' : 'active',
        icon: alert.severity === 'critical' ? '🚨' : '⚠️',
        category: 'alert'
      });
    }
    
    // 7. Quarantine Events
    if (batch.quarantine_at) {
      events.push({
        id: `quarantine-${batch._id}`,
        event_type: 'quarantine',
        timestamp: batch.quarantine_at,
        location: 'System',
        handler: 'Quality Control',
        details: {
          reason: batch.quarantine_reason,
          initiated_by: batch.quarantine_by
        },
        status: 'active',
        icon: '🔒',
        category: 'compliance'
      });
    }
    
    // Sort all events by timestamp
    events.sort((a, b) => 
      new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );
    
    // Calculate timeline statistics
    const stats = {
      total_events: events.length,
      events_by_category: {},
      events_by_status: {},
      time_span: events.length > 0 ? {
        start: events[0].timestamp,
        end: events[events.length - 1].timestamp,
        duration_hours: Math.round(
          (new Date(events[events.length - 1].timestamp).getTime() - 
           new Date(events[0].timestamp).getTime()) / (1000 * 60 * 60)
        )
      } : null
    };
    
    // Categorize events
    events.forEach(event => {
      stats.events_by_category[event.category] = (stats.events_by_category[event.category] || 0) + 1;
      stats.events_by_status[event.status] = (stats.events_by_status[event.status] || 0) + 1;
    });
    
    return NextResponse.json({
      batch_id: publicId,
      product_name: batch.product_name,
      current_status: batch.current_status,
      timeline: events,
      statistics: stats,
      metadata: {
        generated_at: new Date(),
        total_handovers: handovers.length,
        total_readings: readings.length,
        total_verifications: verifications.length,
        total_alerts: alerts.length
      }
    });
    
  } catch (error) {
    console.error("Timeline generation error:", error);
    return NextResponse.json(
      { detail: error instanceof Error ? error.message : "Timeline generation failed" },
      { status: 500 }
    );
  }
}