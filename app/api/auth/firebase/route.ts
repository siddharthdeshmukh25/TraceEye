import { NextResponse } from "next/server";
import { db } from "@/lib/mongodb";
import { badRequest } from "@/lib/api";
import { generateToken } from "@/lib/token";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const { uid, email, displayName, photoURL } = await request.json();
    
    if (!uid || !email) {
      return badRequest("uid and email are required");
    }
    
    const users = (await db()).collection("users");
    
    // Update or create user
    await users.updateOne(
      { google_subject: uid }, 
      { 
        $set: { 
          full_name: displayName ?? "TraceEye member", 
          email: email, 
          avatar_url: photoURL ?? null, 
          updated_at: new Date() 
        }, 
        $setOnInsert: { 
          google_subject: uid, 
          created_at: new Date() 
        } 
      }, 
      { upsert: true }
    );
    
    const user = await users.findOne({ google_subject: uid }, { projection: { full_name: 1, email: 1, avatar_url: 1 } });
    
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
    console.error("Firebase auth error:", error);
    return NextResponse.json({ detail: "Firebase authentication failed" }, { status: 500 });
  }
}