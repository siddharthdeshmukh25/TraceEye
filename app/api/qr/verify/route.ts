import { NextResponse } from "next/server";
import { parseQRPayload, verifyIntegrity } from "@/lib/encryption";
import { db } from "@/lib/mongodb";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const { encryptedData } = await request.json();

    if (!encryptedData) {
      return NextResponse.json(
        { detail: "encryptedData is required" },
        { status: 400 }
      );
    }

    // First check if the data can be decrypted (integrity check)
    if (!verifyIntegrity(encryptedData)) {
      return NextResponse.json({
        valid: false,
        reason: "QR integrity check failed - data may be tampered",
        batchId: null
      }, { status: 200 });
    }

    // Parse the QR payload
    const payload = parseQRPayload(encryptedData);

    // Verify the batch exists in database
    const database = await db();
    const batch = await database.collection("batches").findOne({
      public_id: payload.batchId
    });

    if (!batch) {
      return NextResponse.json({
        valid: false,
        reason: "Batch not found in database",
        batchId: payload.batchId
      }, { status: 200 });
    }

    // Return successful verification
    return NextResponse.json({
      valid: true,
      batchId: payload.batchId,
      timestamp: payload.timestamp,
      version: payload.version,
      traceUrl: `/trace/${payload.batchId}`,
      batchExists: true
    }, { status: 200 });

  } catch (error) {
    console.error("QR verification error:", error);
    
    // Return invalid response for any decryption/parsing errors
    return NextResponse.json({
      valid: false,
      reason: error instanceof Error ? error.message : "QR verification failed",
      batchId: null
    }, { status: 200 });
  }
}