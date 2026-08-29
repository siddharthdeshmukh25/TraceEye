import { NextResponse } from "next/server";
import { db } from "@/lib/mongodb";
import { dbWrapper } from "@/lib/database-wrapper";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const user_id = searchParams.get("user_id");
    
    if (!user_id) {
      return NextResponse.json({ detail: "user_id is required" }, { status: 400 });
    }

    // Use database wrapper with fallback for each collection
    const [batchesResult, alertsResult] = await Promise.all([
      dbWrapper.getDataWithFallback("batches", { user_id }, "traceeye_cache_batches"),
      dbWrapper.getDataWithFallback("alerts", { user_id }, "traceeye_cache_alerts")
    ]);

    const batches = batchesResult.data || [];
    const alerts = alertsResult.data || [];

    // Calculate summary statistics with fallback
    const summary = {
      total_batches: batches.length,
      safe_batches: batches.filter((b: any) => b.current_status === 'safe').length,
      risk_batches: batches.filter((b: any) => b.current_status === 'at_risk' || b.current_status === 'critical').length,
      open_alerts: alerts.length,
      recentActivity: batches.slice(0, 5).map((b: any) => ({
        id: b.public_id,
        product: b.product_name,
        status: b.current_status,
        timestamp: b.created_at
      })),
      systemStatus: {
        database: batchesResult.error ? 'degraded' : 'healthy',
        usingCache: batchesResult.source === 'cache',
        lastUpdated: batchesResult.timestamp
      }
    };

    const response = NextResponse.json(summary);

    // Add system status headers
    if (batchesResult.source === 'cache') {
      response.headers.set('X-System-Status', 'degraded');
      response.headers.set('X-Data-Source', 'cache');
    } else if (batchesResult.error) {
      response.headers.set('X-System-Status', 'critical');
    } else {
      response.headers.set('X-System-Status', 'healthy');
    }

    return response;

  } catch (error) {
    console.error("Dashboard summary error:", error);
    
    // Return minimal fallback data
    return NextResponse.json({
      total_batches: 0,
      safe_batches: 0,
      risk_batches: 0,
      open_alerts: 0,
      recentActivity: [],
      systemStatus: {
        database: 'critical',
        usingCache: false,
        lastUpdated: Date.now()
      },
      error: error instanceof Error ? error.message : 'System unavailable'
    }, { 
      status: 503,
      headers: {
        'X-System-Status': 'critical'
      }
    });
  }
}