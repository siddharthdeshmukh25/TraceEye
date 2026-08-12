import { NextResponse } from "next/server";
import { db } from "@/lib/mongodb";
import { badRequest } from "@/lib/api";
import { verifyToken } from "@/lib/token";

export const runtime = "nodejs";

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
    console.log("Producer creation request:", body);
    
    if (!body.name || !body.contact_email) return badRequest("name and contact_email are required");
    
    const item = { 
      name: body.name, 
      role: "producer", 
      contact_email: body.contact_email, 
      location_name: body.location_name ?? null, 
      user_id: userId, // Use authenticated user ID
      created_at: new Date() 
    };
    
    const organizations = (await db()).collection("organizations");
    const existing = await organizations.findOne({ contact_email: item.contact_email });
    
    if (existing) {
      console.log("Producer already exists:", existing);
      return NextResponse.json({ ...item, id: existing._id.toString() });
    }
    
    console.log("Inserting producer:", item);
    const result = await organizations.insertOne(item); 
    console.log("Producer inserted:", result);
    
    return NextResponse.json({ ...item, id: result.insertedId.toString() }, { status: 201 });
  } catch (error) {
    console.error("Producer creation error:", error);
    return NextResponse.json({ detail: error instanceof Error ? error.message : "Producer creation failed" }, { status: 500 });
  }
}
