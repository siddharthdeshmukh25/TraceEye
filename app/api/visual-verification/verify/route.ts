import { NextResponse } from "next/server";
import { db } from "@/lib/mongodb";
import { verifyToken } from "@/lib/token";
import { ObjectId } from "mongodb";

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

export async function POST(request: Request) {
  try {
    const userId = verifyAuth(request);
    if (!userId) {
      return NextResponse.json({ detail: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { verification_id, verification_status, verification_notes } = body;

    if (!verification_id || !verification_status) {
      return NextResponse.json({ detail: "Missing verification_id or verification_status" }, { status: 400 });
    }

    const validStatuses = ["verified_intact", "verified_tampered", "flagged_review"];
    if (!validStatuses.includes(verification_status)) {
      return NextResponse.json({ detail: "Invalid verification_status" }, { status: 400 });
    }

    const database = await db();

    // Update the verification record
    const result = await database.collection("visual_verifications").updateOne(
      { _id: new ObjectId(verification_id) },
      {
        $set: {
          verification_status: verification_status,
          verification_notes: verification_notes || "",
          verified_by: new ObjectId(userId),
          verified_at: new Date()
        }
      }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json({ detail: "Verification not found" }, { status: 404 });
    }

    // If tampered, create an alert for the batch
    if (verification_status === "verified_tampered") {
      const verification = await database.collection("visual_verifications").findOne({ _id: new ObjectId(verification_id) });
      if (verification) {
        await database.collection("alerts").insertOne({
          batch_id: verification.batch_id,
          user_id: new ObjectId(userId),
          severity: "high",
          title: "Tamper-evident seal compromised",
          message: `Visual verification detected tampered seal for batch ${verification.batch_public_id}`,
          affected_locations: [],
          resolved_at: null,
          created_at: new Date()
        });
      }
    }

    return NextResponse.json({
      message: "Verification updated successfully",
      verification_status: verification_status
    });
  } catch (error) {
    console.error("Update visual verification error:", error);
    return NextResponse.json({
      detail: error instanceof Error ? error.message : "Failed to update visual verification"
    }, { status: 500 });
  }
}
