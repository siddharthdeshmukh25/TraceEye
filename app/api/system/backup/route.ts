import { NextResponse } from "next/server";
import { dbWrapper } from "@/lib/database-wrapper";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const backupData = await dbWrapper.createBackup();
    
    return NextResponse.json({
      success: true,
      message: 'Backup created successfully',
      backup: {
        timestamp: backupData.timestamp,
        version: backupData.version,
        itemCounts: {
          batches: backupData.batches.length,
          producers: backupData.producers.length,
          handovers: backupData.handovers.length,
          alerts: backupData.alerts.length,
          cardVisits: backupData.cardVisits.length
        }
      }
    });
    
  } catch (error) {
    console.error('Backup creation error:', error);
    
    return NextResponse.json({
      success: false,
      message: 'Failed to create backup',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}