import { NextResponse } from "next/server";
import { db } from "@/lib/mongodb";
import { verifyToken } from "@/lib/token";
import cloudinary from "@/lib/cloudinary";

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

    const formData = await request.formData();
    const batchPublicId = formData.get("batch_public_id") as string;
    const image = formData.get("image") as File;
    const verificationMethod = (formData.get("verification_method") as string) || "manual";

    if (!batchPublicId || !image) {
      return NextResponse.json({ detail: "Missing batch_public_id or image" }, { status: 400 });
    }

    const database = await db();

    // Find the batch by public_id
    const batch = await database.collection("batches").findOne({ public_id: batchPublicId });
    if (!batch) {
      return NextResponse.json({ detail: "Batch not found" }, { status: 404 });
    }

    // Convert file to buffer for Cloudinary upload
    const bytes = await image.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Upload to Cloudinary
    const uploadResult = await new Promise((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        {
          folder: "traceeye/verifications",
          public_id: `${batchPublicId}_${Date.now()}`,
          resource_type: "auto",
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      ).end(buffer);
    });

    const cloudinaryResult = uploadResult as any;
    const imageUrl = cloudinaryResult.secure_url;

    // Create visual verification record
    const verification = {
      batch_id: batch._id,
      batch_public_id: batchPublicId,
      image_url: imageUrl,
      verification_status: "pending",
      ai_confidence: 0,
      verification_method: verificationMethod,
      verified_by: null,
      verification_notes: "",
      created_at: new Date(),
      verified_at: null
    };

    console.log("Creating visual verification:", verification);
    const result = await database.collection("visual_verifications").insertOne(verification);
    console.log("Visual verification created:", result);

    // If using AI verification, trigger the verification process
    if (verificationMethod === "ai_opencv") {
      // This would trigger OpenCV-based verification
      // For now, we'll mark it as pending for manual review
      console.log("AI verification requested - would trigger OpenCV analysis");
    }

    return NextResponse.json({
      id: result.insertedId.toString(),
      image_url: imageUrl,
      verification_status: "pending",
      message: "Visual verification uploaded successfully"
    }, { status: 201 });
  } catch (error) {
    console.error("Visual verification error:", error);
    return NextResponse.json({
      detail: error instanceof Error ? error.message : "Failed to upload visual verification"
    }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const userId = verifyAuth(request);
    if (!userId) {
      return NextResponse.json({ detail: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const batchPublicId = searchParams.get("batch_public_id");

    const database = await db();

    let filter: any = {};
    
    // If specific batch_id is provided, filter by it
    if (batchPublicId) {
      filter = { batch_public_id: batchPublicId };
    } else {
      // Otherwise, get verifications for user's batches
      const userBatches = await database.collection("batches")
        .find({ user_id: userId })
        .project({ _id: 1, public_id: 1 })
        .toArray();
      const batchIds = userBatches.map(b => b.public_id);
      filter = { batch_public_id: { $in: batchIds } };
    }

    const verifications = await database.collection("visual_verifications")
      .find(filter)
      .sort({ created_at: -1 })
      .limit(50)
      .toArray();

    return NextResponse.json({
      verifications: verifications.map(v => ({
        id: v._id.toString(),
        batch_public_id: v.batch_public_id,
        image_url: v.image_url,
        verification_status: v.verification_status,
        ai_confidence: v.ai_confidence,
        verification_method: v.verification_method,
        verification_notes: v.verification_notes,
        created_at: v.created_at,
        verified_at: v.verified_at
      })),
      total: verifications.length
    });
  } catch (error) {
    console.error("Fetch visual verifications error:", error);
    return NextResponse.json({
      detail: error instanceof Error ? error.message : "Failed to fetch visual verifications"
    }, { status: 500 });
  }
}
