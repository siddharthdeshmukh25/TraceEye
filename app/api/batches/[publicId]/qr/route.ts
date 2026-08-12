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
    
    const qrCode = await QRCode.toBuffer(traceUrl, {
      width: 180,
      margin: 1,
      errorCorrectionLevel: "H",
      color: {
        dark: "#0d2b20",
        light: "#f6faee",
      },
    });

    return new NextResponse(new Uint8Array(qrCode), {
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
