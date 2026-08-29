import { NextResponse } from "next/server";
import { dbWrapper } from "@/lib/database-wrapper";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { backupData } = body;
    
    if (!backupData) {
      return NextResponse.json({
        success: false,
        message: 'Backup data is required'
      }, { status: 400 });
    }
    
    const restored = await dbWrapper.restoreFromBackup(backupData);
    
    if (restored) {
      return NextResponse.json({
        success: true,
        message: 'Data restored successfully from backup',
        timestamp: Date.now()
      });
    } else {
      return NextResponse.json({
        success: false,
        message: 'Failed to restore data from backup'
      }, { status: 500 });
    }
    
  } catch (error) {
    console.error('Restore error:', error);
    
    return NextResponse.json({
      success: false,
      message: 'Failed to restore from backup',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}