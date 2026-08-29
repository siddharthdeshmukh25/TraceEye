import { NextResponse } from "next/server";
import { db } from "@/lib/mongodb";
import { notFound } from "@/lib/api";
import { analyzeExcursions, getColdChainStatus } from "@/lib/cold-chain";
import { verifyHashChain } from "@/lib/hash-chain";

export const runtime = "nodejs";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ publicId: string }> }
) {
  try {
    const { publicId } = await params;
    const database = await db();
    
    // Get batch with all related information
    const batch = await database.collection("batches").findOne({ 
      public_id: publicId 
    });
    
    if (!batch) {
      return notFound();
    }
    
    // Get producer information
    const producer = await database.collection("organizations").findOne({ 
      _id: batch.producer_id 
    });
    
    // Get current sensor readings
    const currentReadings = await database.collection("sensor_readings")
      .find({ batch_id: batch._id })
      .sort({ recorded_at: -1 })
      .limit(1)
      .toArray();
    
    const currentReading = currentReadings.length > 0 ? currentReadings[0] : null;
    
    // Get recent readings for analysis
    const recentReadings = await database.collection("sensor_readings")
      .find({ batch_id: batch._id })
      .sort({ recorded_at: -1 })
      .limit(50)
      .toArray();
    
    // Get latest handover to determine current stage
    const latestHandover = await database.collection("handovers")
      .find({ batch_id: batch._id })
      .sort({ created_at: -1 })
      .limit(1)
      .toArray();
    
    // Get latest visual verification
    const latestVerification = await database.collection("visual_verifications")
      .find({ batch_id: batch._id })
      .sort({ created_at: -1 })
      .limit(1)
      .toArray();
    
    // Analyze cold chain status
    const excursionAnalysis = analyzeExcursions(
      recentReadings.map(r => ({
        temperature_c: r.temperature_c,
        humidity_pct: r.humidity_pct,
        recorded_at: r.recorded_at,
        marker_status: r.marker_status
      })),
      batch.storage_min_c,
      batch.storage_max_c
    );
    
    const coldChainStatus = getColdChainStatus(
      excursionAnalysis,
      currentReading?.temperature_c || 0,
      batch.storage_min_c,
      batch.storage_max_c
    );
    
    // Verify trace integrity
    const handovers = await database.collection("handovers")
      .find({ batch_id: batch._id })
      .sort({ created_at: 1 })
      .toArray();
    
    let traceIntegrityValid = true;
    let integrityCheck = null;
    
    if (handovers.length > 0) {
      const verificationResult = verifyHashChain(handovers.map(h => ({
        ...h,
        batch_id: batch.public_id,
        event_type: h.status || 'handover',
        integrity_hash: h.integrity_hash,
        previous_hash: h.previous_hash
      })));
      traceIntegrityValid = verificationResult.valid;
      integrityCheck = {
        valid: verificationResult.valid,
        breakPoint: verificationResult.breakPoint,
        totalEvents: handovers.length
      };
    }
    
    // Determine current stage and location
    let currentStage = 'Production';
    let currentLocation = batch.origin_name;
    
    if (latestHandover.length > 0) {
      const handover = latestHandover[0];
      currentStage = determineStageFromHandover(handover);
      currentLocation = handover.location;
    }
    
    // Calculate current weight (from latest handover or initial)
    const currentWeight = latestHandover.length > 0 
      ? latestHandover[0].weight_kg 
      : batch.initial_quantity_kg;
    
    // Digital Twin Response
    const digitalTwin = {
      batch: {
        public_id: batch.public_id,
        product_name: batch.product_name,
        origin_name: batch.origin_name,
        initial_quantity_kg: batch.initial_quantity_kg,
        quality_grade: batch.quality_grade,
        created_at: batch.created_at
      },
      current_state: {
        stage: currentStage,
        location: currentLocation,
        temperature: currentReading?.temperature_c || null,
        humidity: currentReading?.humidity_pct || null,
        weight: currentWeight,
        last_updated: currentReading?.recorded_at || batch.created_at
      },
      security_status: {
        qr_verified: true, // Always true for digital twin view
        trace_integrity: traceIntegrityValid ? 'verified' : 'failed',
        seal_status: latestVerification.length > 0 
          ? latestVerification[0].verification_status 
          : 'not_verified',
        integrity_check: integrityCheck
      },
      cold_chain_status: {
        current_temperature: currentReading?.temperature_c || null,
        safe_range: {
          min: batch.storage_min_c,
          max: batch.storage_max_c
        },
        excursion_analysis: {
          has_excursion: excursionAnalysis.hasExcursion,
          severity: excursionAnalysis.severity,
          total_excursion_duration: excursionAnalysis.totalExcursionDuration,
          max_temperature: excursionAnalysis.maxTemperature,
          min_temperature: excursionAnalysis.minTemperature
        },
        status: coldChainStatus.status,
        message: coldChainStatus.message
      },
      risk_assessment: {
        overall_status: batch.current_status,
        risk_level: calculateRiskLevel(batch.current_status, excursionAnalysis.severity),
        factors: determineRiskFactors(batch, excursionAnalysis, traceIntegrityValid)
      },
      producer_info: {
        name: producer?.name || 'Unknown',
        location: producer?.location_name || batch.origin_name,
        contact: producer?.contact_email || null
      },
      metadata: {
        generated_at: new Date(),
        data_sources: [
          'batch_records',
          'sensor_readings', 
          'handovers',
          'visual_verifications',
          'integrity_hashes'
        ],
        completeness: calculateDataCompleteness(
          batch,
          currentReading,
          latestHandover,
          latestVerification
        )
      }
    };
    
    return NextResponse.json(digitalTwin);
    
  } catch (error) {
    console.error("Digital twin error:", error);
    return NextResponse.json(
      { detail: error instanceof Error ? error.message : "Digital twin generation failed" },
      { status: 500 }
    );
  }
}

function determineStageFromHandover(handover: any): string {
  const location = handover.location?.toLowerCase() || '';
  const receiver = handover.receiver?.toLowerCase() || '';
  
  if (location.includes('warehouse') || receiver.includes('warehouse')) {
    return 'Warehouse Storage';
  }
  if (location.includes('retail') || receiver.includes('retail') || location.includes('store')) {
    return 'Retail Display';
  }
  if (location.includes('transport') || receiver.includes('transport') || location.includes('transit')) {
    return 'In Transit';
  }
  if (location.includes('distrib') || receiver.includes('distrib')) {
    return 'Distribution Center';
  }
  
  return 'Handover/Transfer';
}

function calculateRiskLevel(batchStatus: string, excursionSeverity: string): string {
  if (batchStatus === 'critical' || batchStatus === 'quarantined') {
    return 'critical';
  }
  if (batchStatus === 'at_risk' || excursionSeverity === 'critical') {
    return 'high';
  }
  if (excursionSeverity === 'high' || excursionSeverity === 'medium') {
    return 'medium';
  }
  return 'low';
}

function determineRiskFactors(
  batch: any, 
  excursionAnalysis: any, 
  traceIntegrityValid: boolean
): string[] {
  const factors: string[] = [];
  
  if (batch.current_status === 'critical') {
    factors.push('Critical safety status');
  }
  if (batch.current_status === 'quarantined') {
    factors.push('Batch under quarantine');
  }
  if (excursionAnalysis.hasExcursion) {
    factors.push(`Temperature excursion (${excursionAnalysis.severity} severity)`);
  }
  if (!traceIntegrityValid) {
    factors.push('Trace integrity concerns');
  }
  if (batch.current_status === 'at_risk') {
    factors.push('Elevated risk status');
  }
  
  return factors.length > 0 ? factors : ['No significant risk factors'];
}

function calculateDataCompleteness(
  batch: any,
  currentReading: any,
  latestHandover: any,
  latestVerification: any
): number {
  let completeness = 0;
  const totalChecks = 5;
  
  // Batch data
  if (batch && batch.public_id) completeness += 1;
  
  // Current readings
  if (currentReading && currentReading.temperature_c) completeness += 1;
  
  // Handover data
  if (latestHandover && latestHandover.length > 0) completeness += 1;
  
  // Visual verification
  if (latestVerification && latestVerification.length > 0) completeness += 1;
  
  // Integrity hash
  if (batch && batch.integrity_hash) completeness += 1;
  
  return Math.round((completeness / totalChecks) * 100);
}