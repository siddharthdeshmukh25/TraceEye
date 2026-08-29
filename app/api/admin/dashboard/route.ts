import { NextResponse } from "next/server";
import { db } from "@/lib/mongodb";
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

export async function GET(request: Request) {
  try {
    const userId = verifyAuth(request);
    if (!userId) {
      return NextResponse.json({ detail: "Unauthorized" }, { status: 401 });
    }
    
    const database = await db();
    
    // Get comprehensive dashboard statistics
    const [
      totalBatches,
      safeBatches,
      atRiskBatches,
      criticalBatches,
      quarantinedBatches,
      activeAlerts,
      resolvedAlerts,
      totalHandovers,
      totalReadings,
      totalVerifications
    ] = await Promise.all([
      database.collection("batches").countDocuments(),
      database.collection("batches").countDocuments({ current_status: "safe" }),
      database.collection("batches").countDocuments({ current_status: "at_risk" }),
      database.collection("batches").countDocuments({ current_status: "critical" }),
      database.collection("batches").countDocuments({ current_status: "quarantined" }),
      database.collection("alerts").countDocuments({ resolved_at: null }),
      database.collection("alerts").countDocuments({ resolved_at: { $ne: null } }),
      database.collection("handovers").countDocuments(),
      database.collection("sensor_readings").countDocuments(),
      database.collection("visual_verifications").countDocuments()
    ]);
    
    // Get recent activity
    const recentBatches = await database.collection("batches")
      .find({})
      .sort({ created_at: -1 })
      .limit(5)
      .toArray();
    
    const recentAlerts = await database.collection("alerts")
      .find({})
      .sort({ created_at: -1 })
      .limit(5)
      .toArray();
    
    // Get temperature excursion statistics
    const allReadings = await database.collection("sensor_readings")
      .find({})
      .project({ temperature_c: 1, batch_id: 1 })
      .toArray();
    
    // Get batches with storage ranges for excursion analysis
    const batchesWithRanges = await database.collection("batches")
      .find({})
      .project({ _id: 1, storage_min_c: 1, storage_max_c: 1 })
      .toArray();
    
    const batchMap = new Map(batchesWithRanges.map(b => [b._id.toString(), b]));
    
    let excursionCount = 0;
    let criticalExcursions = 0;
    
    allReadings.forEach(reading => {
      const batch = batchMap.get(reading.batch_id.toString());
      if (batch) {
        const isExcursion = reading.temperature_c < batch.storage_min_c || 
                           reading.temperature_c > batch.storage_max_c;
        if (isExcursion) {
          excursionCount++;
          const isCritical = reading.temperature_c > batch.storage_max_c + 5 || 
                           reading.temperature_c < batch.storage_min_c - 5;
          if (isCritical) criticalExcursions++;
        }
      }
    });
    
    // Get seal verification statistics
    const verifications = await database.collection("visual_verifications")
      .find({})
      .project({ verification_status: 1 })
      .toArray();
    
    const sealIssues = verifications.filter(v => 
      v.verification_status === 'verified_tampered' || 
      v.verification_status === 'flagged_review'
    ).length;
    
    // Calculate trends (simple comparison with last 7 days)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    
    const [
      newBatchesThisWeek,
      newAlertsThisWeek,
      newCriticalBatchesThisWeek
    ] = await Promise.all([
      database.collection("batches").countDocuments({ created_at: { $gte: sevenDaysAgo } }),
      database.collection("alerts").countDocuments({ created_at: { $gte: sevenDaysAgo } }),
      database.collection("batches").countDocuments({ 
        current_status: "critical",
        created_at: { $gte: sevenDaysAgo }
      })
    ]);
    
    return NextResponse.json({
      overview: {
        total_batches: totalBatches,
        safe_batches: safeBatches,
        at_risk_batches: atRiskBatches,
        critical_batches: criticalBatches,
        quarantined_batches: quarantinedBatches,
        active_alerts: activeAlerts,
        resolved_alerts: resolvedAlerts
      },
      operational_metrics: {
        total_handovers: totalHandovers,
        total_readings: totalReadings,
        total_verifications: totalVerifications,
        temperature_excursions: excursionCount,
        critical_excursions: criticalExcursions,
        seal_issues: sealIssues
      },
      trends: {
        new_batches_this_week: newBatchesThisWeek,
        new_alerts_this_week: newAlertsThisWeek,
        new_critical_this_week: newCriticalBatchesThisWeek
      },
      recent_activity: {
        recent_batches: recentBatches.map(b => ({
          public_id: b.public_id,
          product_name: b.product_name,
          current_status: b.current_status,
          created_at: b.created_at
        })),
        recent_alerts: recentAlerts.map(a => ({
          severity: a.severity,
          title: a.title,
          created_at: a.created_at,
          resolved: a.resolved_at !== null
        }))
      },
      health_indicators: {
        system_health: calculateSystemHealth(safeBatches, totalBatches, activeAlerts),
        data_completeness: calculateDataCompleteness(totalBatches, totalReadings, totalHandovers),
        risk_level: calculateOverallRiskLevel(criticalBatches, atRiskBatches, totalBatches)
      },
      metadata: {
        generated_at: new Date(),
        user_id: userId
      }
    });
    
  } catch (error) {
    console.error("Admin dashboard error:", error);
    return NextResponse.json(
      { detail: error instanceof Error ? error.message : "Failed to fetch dashboard data" },
      { status: 500 }
    );
  }
}

function calculateSystemHealth(safeBatches: number, totalBatches: number, activeAlerts: number): string {
  if (totalBatches === 0) return 'unknown';
  
  const safePercentage = (safeBatches / totalBatches) * 100;
  
  if (safePercentage > 90 && activeAlerts === 0) return 'excellent';
  if (safePercentage > 75 && activeAlerts < 5) return 'good';
  if (safePercentage > 50) return 'fair';
  return 'poor';
}

function calculateDataCompleteness(totalBatches: number, totalReadings: number, totalHandovers: number): number {
  if (totalBatches === 0) return 0;
  
  const readingsPerBatch = totalReadings / totalBatches;
  const handoversPerBatch = totalHandovers / totalBatches;
  
  // Calculate completeness based on expected activity
  const expectedReadingsPerBatch = 10; // Expected average readings per batch
  const expectedHandoversPerBatch = 2; // Expected average handovers per batch
  
  const readingScore = Math.min(100, (readingsPerBatch / expectedReadingsPerBatch) * 100);
  const handoverScore = Math.min(100, (handoversPerBatch / expectedHandoversPerBatch) * 100);
  
  return Math.round((readingScore + handoverScore) / 2);
}

function calculateOverallRiskLevel(criticalBatches: number, atRiskBatches: number, totalBatches: number): string {
  if (totalBatches === 0) return 'low';
  
  const riskPercentage = ((criticalBatches * 2) + atRiskBatches) / totalBatches * 100;
  
  if (riskPercentage > 30) return 'critical';
  if (riskPercentage > 15) return 'high';
  if (riskPercentage > 5) return 'medium';
  return 'low';
}