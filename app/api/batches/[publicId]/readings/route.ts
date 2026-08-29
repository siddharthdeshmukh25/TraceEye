import { NextResponse } from "next/server";
import { db } from "@/lib/mongodb";
import { badRequest, notFound } from "@/lib/api";
import { analyzeExcursions, getColdChainStatus } from "@/lib/cold-chain";

export const runtime = "nodejs";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ publicId: string }> }
) {
  try {
    const { publicId } = await params;
    const database = await db();
    
    const batch = await database.collection("batches").findOne({ 
      public_id: publicId 
    });
    
    if (!batch) {
      return notFound();
    }
    
    // Get recent readings
    const readings = await database.collection("sensor_readings")
      .find({ batch_id: batch._id })
      .sort({ recorded_at: -1 })
      .limit(50)
      .toArray();
    
    // Analyze excursions
    const excursionAnalysis = analyzeExcursions(
      readings.map(r => ({
        temperature_c: r.temperature_c,
        humidity_pct: r.humidity_pct,
        recorded_at: r.recorded_at,
        marker_status: r.marker_status
      })),
      batch.storage_min_c,
      batch.storage_max_c
    );
    
    // Get current temperature
    const currentReading = readings.length > 0 ? readings[0] : null;
    const currentTemp = currentReading?.temperature_c || 0;
    
    // Get cold chain status
    const coldChainStatus = getColdChainStatus(
      excursionAnalysis,
      currentTemp,
      batch.storage_min_c,
      batch.storage_max_c
    );
    
    return NextResponse.json({
      batch_id: publicId,
      current_temperature: currentTemp,
      current_humidity: currentReading?.humidity_pct || 0,
      last_updated: currentReading?.recorded_at || null,
      storage_range: {
        min: batch.storage_min_c,
        max: batch.storage_max_c
      },
      excursion_analysis: excursionAnalysis,
      cold_chain_status: coldChainStatus,
      total_readings: readings.length,
      recent_readings: readings.slice(0, 10).map(r => ({
        temperature_c: r.temperature_c,
        humidity_pct: r.humidity_pct,
        recorded_at: r.recorded_at,
        marker_status: r.marker_status
      }))
    });
    
  } catch (error) {
    console.error("Readings fetch error:", error);
    return NextResponse.json(
      { detail: error instanceof Error ? error.message : "Failed to fetch readings" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request, { params }: { params: Promise<{ publicId: string }> }) {
  try {
    const { publicId } = await params;
    const body = await request.json();
    
    if (!Number.isFinite(Number(body.temperature_c)) || 
        !Number.isFinite(Number(body.humidity_pct)) || 
        Number(body.humidity_pct) < 0 || 
        Number(body.humidity_pct) > 100) {
      return badRequest("Invalid sensor reading");
    }
    
    const database = await db();
    const batch = await database.collection("batches").findOne({ 
      public_id: publicId 
    });
    
    if (!batch) {
      return notFound();
    }
    
    // Insert new reading
    await database.collection("sensor_readings").insertOne({
      batch_id: batch._id,
      temperature_c: Number(body.temperature_c),
      humidity_pct: Number(body.humidity_pct),
      marker_status: body.marker_status ?? "intact",
      recorded_at: body.recorded_at ? new Date(body.recorded_at) : new Date()
    });
    
    // Get updated readings for analysis
    const readings = await database.collection("sensor_readings")
      .find({ batch_id: batch._id })
      .sort({ recorded_at: -1 })
      .limit(50)
      .toArray();
    
    // Analyze excursions
    const excursionAnalysis = analyzeExcursions(
      readings.map(r => ({
        temperature_c: r.temperature_c,
        humidity_pct: r.humidity_pct,
        recorded_at: r.recorded_at,
        marker_status: r.marker_status
      })),
      batch.storage_min_c,
      batch.storage_max_c
    );
    
    // Update batch status if critical
    if (excursionAnalysis.severity === 'critical') {
      await database.collection("batches").updateOne(
        { _id: batch._id },
        { $set: { current_status: 'critical' } }
      );
    }
    
    return NextResponse.json({ 
      accepted: true,
      excursion_analysis: excursionAnalysis,
      current_status: excursionAnalysis.severity === 'critical' ? 'critical' : batch.current_status
    }, { status: 201 });
    
  } catch (error) {
    console.error("Reading creation error:", error);
    return NextResponse.json(
      { detail: error instanceof Error ? error.message : "Failed to create reading" },
      { status: 500 }
    );
  }
}
