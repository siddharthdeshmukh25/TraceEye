import { NextResponse } from "next/server";
import { db } from "@/lib/mongodb";
import { badRequest } from "@/lib/api";
import { generateToken } from "@/lib/token";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const { credential } = await request.json(); 
    if (!credential) return badRequest("credential is required");
    
    const clientId = process.env.GOOGLE_CLIENT_ID; 
    if (!clientId) return NextResponse.json({ detail: "Google authentication is not configured" }, { status: 503 });
    
    const response = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(credential)}`, { cache: "no-store" });
    if (!response.ok) return NextResponse.json({ detail: "Google credential could not be verified" }, { status: 401 });
    
    const identity = await response.json(); 
    if (identity.aud !== clientId || identity.email_verified !== "true") {
      return NextResponse.json({ detail: "Google credential is not valid for this application" }, { status: 401 });
    }
    
    const users = (await db()).collection("users"); 
    await users.updateOne(
      { google_subject: identity.sub }, 
      { 
        $set: { 
          full_name: identity.name ?? "TraceEye member", 
          email: identity.email, 
          avatar_url: identity.picture ?? null, 
          updated_at: new Date() 
        }, 
        $setOnInsert: { 
          google_subject: identity.sub, 
          created_at: new Date() 
        } 
      }, 
      { upsert: true }
    );
    
    const user = await users.findOne({ google_subject: identity.sub }, { projection: { full_name: 1, email: 1, avatar_url: 1 } });
    
    // Generate JWT token
    const token = generateToken({
      id: user!._id.toString(),
      email: user!.email,
      full_name: user!.full_name,
      auth_provider: "google"
    });
    
    return NextResponse.json({
      token,
      user: {
        id: user!._id.toString(),
        full_name: user!.full_name,
        email: user!.email,
        avatar_url: user!.avatar_url,
        auth_provider: "google"
      }
    });
  } catch (error) {
    console.error("Google auth error:", error);
    return NextResponse.json({ detail: "Google authentication failed" }, { status: 500 });
  }
}
