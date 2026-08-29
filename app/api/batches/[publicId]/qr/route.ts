import { NextResponse } from "next/server";
import QRCode from "qrcode";
import { db } from "@/lib/mongodb";
import { createQRPayload } from "@/lib/encryption";

export const runtime = "nodejs";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ publicId: string }> }
) {
  const { publicId } = await params;
  try {
    const database = await db();
    const batch = await database.collection("batches").findOne({ 
      public_id: publicId 
    });
    
    if (!batch) {
      return NextResponse.json({ detail: "Batch not found" }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const encrypted = searchParams.get('encrypted') === 'true';

    let qrData: string;

    if (encrypted) {
      // Generate encrypted QR payload with scan page URL
      const encryptedPayload = createQRPayload(publicId);
      const web = process.env.NEXT_PUBLIC_WEB_URL || "http://localhost:3000";
      qrData = `${web}/scan?data=${encodeURIComponent(encryptedPayload)}`;
    } else {
      // Legacy QR code with plain URL (for backward compatibility)
      const web = process.env.NEXT_PUBLIC_WEB_URL || "http://localhost:3000";
      qrData = `${web}/trace/${publicId}`;
    }
    
    // Generate QR code - white background with dark patterns
    const qrCode = await QRCode.toBuffer(qrData, {
      width: 150, // Small size like icon
      margin: 1, // Minimal margin
      color: {
        dark: "#1e293b", // dark slate (dark patterns)
        light: "#ffffff" // white background
      }
    });

    // Convert Buffer to Uint8Array for proper BodyInit compatibility
    const qrCodeArray = new Uint8Array(qrCode);

    return new NextResponse(qrCodeArray, {
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch (error) {
    console.error("QR code generation error:", error);
    return NextResponse.json(
      { detail: "Failed to generate QR code" },
      { status: 500 }
    );
  }
}