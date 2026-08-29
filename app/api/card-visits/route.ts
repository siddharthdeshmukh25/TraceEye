import { NextResponse } from "next/server";
import { db } from "@/lib/mongodb";
import { badRequest, id } from "@/lib/api";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    console.log("Card visit request:", body);

    const { batch_public_id, latitude, longitude, location_name, device_info } = body;

    if (!batch_public_id || latitude === undefined || longitude === undefined) {
      return badRequest("Missing required fields: batch_public_id, latitude, longitude");
    }

    const database = await db();

    // Find the batch by public_id
    const batch = await database.collection("batches").findOne({ public_id: batch_public_id });
    if (!batch) {
      return NextResponse.json({ detail: "Batch not found" }, { status: 404 });
    }

    // Get visitor IP from headers
    const visitor_ip = request.headers.get("x-forwarded-for") || 
                       request.headers.get("x-real-ip") || 
                       "unknown";

    // Record the card visit
    const visit = {
      batch_id: batch._id,
      batch_public_id,
      visitor_ip,
      latitude: Number(latitude),
      longitude: Number(longitude),
      location_name: location_name || null,
      device_info: device_info || request.headers.get("user-agent") || "unknown",
      visited_at: new Date()
    };

    console.log("Recording card visit:", visit);
    const result = await database.collection("card_visits").insertOne(visit);
    console.log("Card visit recorded:", result);

    return NextResponse.json({ 
      id: result.insertedId.toString(),
      message: "Visit recorded successfully" 
    }, { status: 201 });
  } catch (error) {
    console.error("Card visit recording error:", error);
    return NextResponse.json({ 
      detail: error instanceof Error ? error.message : "Failed to record visit" 
    }, { status: 500 });
  }
}
