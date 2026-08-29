import { NextResponse } from "next/server";
import { db } from "@/lib/mongodb";
import { dbWrapper } from "@/lib/database-wrapper";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const timestamp = Date.now();
  
  try {
    // Check database connectivity
    const database = await db();
    const healthCheck = await database.admin().ping();
    
    // Get health status from wrapper
    const wrapperHealth = dbWrapper.getHealthStatus();
    
    // Get cache statistics
    const cacheStats = dbWrapper.getCacheStats();
    
    // Calculate overall system health
    const databaseHealthy = healthCheck.ok === 1;
    const systemHealthy = databaseHealthy && wrapperHealth.database === 'healthy';
    
    const healthResponse = {
      status: systemHealthy ? 'healthy' : wrapperHealth.database === 'degraded' ? 'degraded' : 'unhealthy',
      timestamp,
      uptime: process.uptime(),
      components: {
        database: {
          status: databaseHealthy ? 'operational' : 'down',
          responseTime: Date.now() - timestamp,
          lastCheck: wrapperHealth.lastCheck,
          errorCount: wrapperHealth.errorCount
        },
        cache: {
          status: 'operational',
          itemCount: Object.values(cacheStats).filter(s => s.exists).length,
          totalSize: Object.values(cacheStats).reduce((acc, s) => acc + (s.size || 0), 0)
        }
      },
      cacheStats,
      recommendations: []
    };
    
    // Add recommendations based on health status
    if (!databaseHealthy) {
      healthResponse.recommendations.push('Database connection failed - using cached data');
    }
    
    if (wrapperHealth.errorCount > 0) {
      healthResponse.recommendations.push(`${wrapperHealth.errorCount} database errors detected - consider checking database health`);
    }
    
    if (Object.values(cacheStats).filter(s => s.exists).length === 0) {
      healthResponse.recommendations.push('No cached data available - system vulnerable to database failures');
    }
    
    return NextResponse.json(healthResponse);
    
  } catch (error) {
    console.error('Health check error:', error);
    
    return NextResponse.json({
      status: 'unhealthy',
      timestamp,
      error: error instanceof Error ? error.message : 'Health check failed',
      components: {
        database: {
          status: 'down',
          error: error instanceof Error ? error.message : 'Unknown error'
        },
        cache: {
          status: 'operational',
          itemCount: Object.values(dbWrapper.getCacheStats()).filter(s => s.exists).length
        }
      },
      recommendations: [
        'System experiencing critical issues',
        'Database connectivity lost',
        'System operating in degraded mode with cached data'
      ]
    }, { status: 503 });
  }
}