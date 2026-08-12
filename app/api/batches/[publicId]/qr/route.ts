import { NextResponse } from "next/server";
import QRCode from "qrcode";
import { db } from "@/lib/mongodb";

export const runtime = "nodejs";

export async function GET(
  _: Request,
  { params }: { params: { publicId: string } }
) {
  try {
    const database = await db();
    const batch = await database.collection("batches").findOne({ 
      public_id: params.publicId 
    });
    
    if (!batch) {
      return NextResponse.json({ detail: "Batch not found" }, { status: 404 });
    }

    const web = process.env.NEXT_PUBLIC_WEB_URL || "http://localhost:3000";
    const traceUrl = `${web}/trace/${batch.public_id}`;
    
    // Generate QR code - white background with dark patterns
    const qrCode = await QRCode.toBuffer(traceUrl, {
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