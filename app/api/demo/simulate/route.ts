import { NextResponse } from "next/server";
import { db } from "@/lib/mongodb";
import { id } from "@/lib/api";
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

const DEMO_SCENARIOS = {
  normal: {
    name: "Normal Operation",
    description: "Standard cold-chain operation with all parameters within safe ranges",
    temperature_range: [4, 6],
    humidity_range: [60, 70],
    seal_status: "intact",
    expected_status: "safe"
  },
  temperature_excursion: {
    name: "Temperature Excursion",
    description: "Simulates a temperature breach with gradual recovery",
    temperature_range: [6, 11],
    humidity_range: [65, 75],
    seal_status: "intact",
    expected_status: "at_risk"
  },
  seal_tamper: {
    name: "Seal Tampering",
    description: "Simulates physical seal integrity compromise",
    temperature_range: [4, 6],
    humidity_range: [60, 70],
    seal_status: "tampered",
    expected_status: "critical"
  },
  trace_integrity_failure: {
    name: "Trace Integrity Failure",
    description: "Simulates supply chain data tampering detection",
    temperature_range: [4, 6],
    humidity_range: [60, 70],
    seal_status: "intact",
    expected_status: "critical",
    corrupt_hash: true
  },
  recall: {
    name: "Full Recall Scenario",
    description: "Complete critical failure requiring immediate recall",
    temperature_range: [6, 13],
    humidity_range: [70, 85],
    seal_status: "tampered",
    expected_status: "critical",
    trigger_quarantine: true
  },
  data_conflict: {
    name: "Data Conflict (Sensor Fraud)",
    description: "Simulates fake safe temperature but a tampered physical seal.",
    temperature_range: [4, 6],
    humidity_range: [60, 70],
    seal_status: "tampered",
    expected_status: "quarantined",
    trigger_quarantine: true
  }
};

export async function POST(request: Request) {
  try {
    const userId = verifyAuth(request);
    if (!userId) {
      return NextResponse.json({ detail: "Unauthorized" }, { status: 401 });
    }
    
    const body = await request.json();
    const { 
      scenario, 
      batch_id, 
      duration_minutes = 60,
      clear_previous = false 
    } = body;
    
    if (!scenario || !DEMO_SCENARIOS[scenario as keyof typeof DEMO_SCENARIOS]) {
      return NextResponse.json({ 
        detail: "Invalid scenario. Available: " + Object.keys(DEMO_SCENARIOS).join(", ")
      }, { status: 400 });
    }
    
    const database = await db();
    const scenarioConfig = DEMO_SCENARIOS[scenario as keyof typeof DEMO_SCENARIOS];
    
    // If batch_id provided, use existing batch, otherwise create demo batch
    let batch;
    if (batch_id) {
      batch = await database.collection("batches").findOne({ 
        _id: id(batch_id) 
      });
      if (!batch) {
        return NextResponse.json({ detail: "Batch not found" }, { status: 404 });
      }
      
      // Clear previous demo data if requested
      if (clear_previous) {
        await database.collection("sensor_readings").deleteMany({ batch_id: batch._id });
        await database.collection("visual_verifications").deleteMany({ batch_id: batch._id });
        await database.collection("alerts").deleteMany({ batch_id: batch._id, demo: true });
        
        // Reset batch status
        await database.collection("batches").updateOne(
          { _id: batch._id },
          { 
            $set: { 
              current_status: "safe",
              quarantine_reason: null,
              quarantine_at: null,
              quarantine_by: null
            }
          }
        );
      }
    } else {
      // Create demo batch
      const demoBatch = {
        public_id: `DEMO-${Date.now().toString(16).toUpperCase()}`,
        product_name: "Demo Product",
        producer_id: null,
        origin_name: "Demo Location",
        latitude: null,
        longitude: null,
        initial_quantity_kg: 100,
        quality_grade: "A",
        storage_min_c: 2,
        storage_max_c: 8,
        ingredient_batch_ids: [],
        current_status: "safe",
        user_id: id(userId),
        integrity_hash: null,
        demo: true,
        created_at: new Date()
      };
      
      const result = await database.collection("batches").insertOne(demoBatch);
      batch = { ...demoBatch, _id: result.insertedId };
    }
    
    // Generate simulated sensor readings based on scenario
    const readings = generateSimulatedReadings(
      batch._id,
      scenarioConfig,
      duration_minutes
    );
    
    // Insert readings
    await database.collection("sensor_readings").insertMany(readings);
    
    // Generate visual verification if needed
    if (scenarioConfig.seal_status === "tampered") {
      await database.collection("visual_verifications").insertOne({
        batch_id: batch._id,
        batch_public_id: batch.public_id,
        image_url: "/demo/tampered-seal.jpg",
        verification_status: "verified_tampered",
        ai_confidence: 0.85,
        verification_method: "ai_opencv",
        verification_notes: "Demo: Simulated tamper detection",
        demo: true,
        created_at: new Date(),
        verified_at: new Date()
      });
    }
    
    // Corrupt hash chain if scenario requires
    if (scenarioConfig.corrupt_hash) {
      const handovers = await database.collection("handovers")
        .find({ batch_id: batch._id })
        .toArray();
      
      if (handovers.length > 0) {
        // Corrupt the latest handover hash
        await database.collection("handovers").updateOne(
          { _id: handovers[handovers.length - 1]._id },
          { $set: { integrity_hash: "corrupted_hash_for_demo" } }
        );
      }
    }
    
    // Trigger quarantine if scenario requires
    if (scenarioConfig.trigger_quarantine) {
      const quarantineReason = scenario === "data_conflict"
        ? "DATA CONFLICT ANOMALY: Hardware sensor reports safe conditions (4°C), but the physical seal is compromised. Suspected sensor tampering."
        : "Demo: Simulated critical failure";

      await database.collection("batches").updateOne(
        { _id: batch._id },
        {
          $set: {
            current_status: "quarantined",
            quarantine_reason: quarantineReason,
            quarantine_at: new Date(),
            quarantine_by: id(userId)
          }
        }
      );

      // Create demo alert
      await database.collection("alerts").insertOne({
        batch_id: batch._id,
        user_id: id(userId),
        severity: "critical",
        title: scenario === "data_conflict" ? "DATA CONFLICT ANOMALY" : "DEMO: Smart Recall Initiated",
        message: quarantineReason,
        affected_locations: ["Demo Location 1", "Demo Location 2"],
        resolved_at: null,
        demo: true,
        created_at: new Date()
      });
    } else {
      // Update batch status based on scenario
      await database.collection("batches").updateOne(
        { _id: batch._id },
        { $set: { current_status: scenarioConfig.expected_status } }
      );
    }
    
    return NextResponse.json({
      success: true,
      scenario: scenarioConfig.name,
      batch_id: batch._id.toString(),
      public_id: batch.public_id,
      expected_status: scenarioConfig.expected_status,
      simulated_data: {
        readings_count: readings.length,
        temperature_range: scenarioConfig.temperature_range,
        humidity_range: scenarioConfig.humidity_range,
        seal_status: scenarioConfig.seal_status
      },
      warning: "⚠️ DEMO MODE: This is simulated data for demonstration purposes only",
      instructions: [
        "View the batch dashboard to see simulated effects",
        "Check cold-chain intelligence for excursion analysis",
        "Examine risk assessment for explainable factors",
        "Review timeline for simulated events",
        "Use 'clear_previous: true' to reset and try different scenarios"
      ]
    });
    
  } catch (error) {
    console.error("Demo simulation error:", error);
    return NextResponse.json(
      { detail: error instanceof Error ? error.message : "Demo simulation failed" },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    const userId = verifyAuth(request);
    if (!userId) {
      return NextResponse.json({ detail: "Unauthorized" }, { status: 401 });
    }
    
    return NextResponse.json({
      available_scenarios: Object.keys(DEMO_SCENARIOS).map(key => ({
        id: key,
        ...DEMO_SCENARIOS[key as keyof typeof DEMO_SCENARIOS]
      })),
      usage_instructions: {
        endpoint: "POST /api/demo/simulate",
        required_fields: ["scenario"],
        optional_fields: ["batch_id", "duration_minutes", "clear_previous"],
        example: {
          scenario: "temperature_excursion",
          batch_id: "existing_batch_id_or_omit_for_new",
          duration_minutes: 120,
          clear_previous: false
        }
      },
      warning: "⚠️ DEMO MODE: All simulated data is clearly marked and separated from production data"
    });
    
  } catch (error) {
    console.error("Demo scenarios error:", error);
    return NextResponse.json(
      { detail: error instanceof Error ? error.message : "Failed to fetch demo scenarios" },
      { status: 500 }
    );
  }
}

function generateSimulatedReadings(
  batchId: any,
  scenario: any,
  durationMinutes: number
): any[] {
  const readings = [];
  const interval = 5; // Reading every 5 minutes
  const readingsCount = Math.floor(durationMinutes / interval);
  
  const [minTemp, maxTemp] = scenario.temperature_range;
  const [minHumidity, maxHumidity] = scenario.humidity_range;
  
  for (let i = 0; i < readingsCount; i++) {
    const progress = i / readingsCount;
    
    // Generate temperature with some variation
    let temperature;
    if (scenario.expected_status === "safe") {
      temperature = minTemp + Math.random() * (maxTemp - minTemp);
    } else {
      // Simulate excursion pattern
      if (progress < 0.3) {
        temperature = minTemp + Math.random() * 2; // Normal start
      } else if (progress < 0.7) {
        temperature = maxTemp + Math.random() * 2; // Excursion peak
      } else {
        temperature = minTemp + Math.random() * 3; // Recovery
      }
    }
    
    // Generate humidity
    const humidity = minHumidity + Math.random() * (maxHumidity - minHumidity);
    
    // Determine marker status
    let markerStatus = "intact";
    if (scenario.seal_status === "tampered" && progress > 0.5) {
      markerStatus = "tampered";
    }
    
    readings.push({
      batch_id: batchId,
      temperature_c: parseFloat(temperature.toFixed(1)),
      humidity_pct: parseFloat(humidity.toFixed(1)),
      marker_status: markerStatus,
      recorded_at: new Date(Date.now() - (readingsCount - i) * interval * 60000),
      demo: true
    });
  }
  
  return readings;
}