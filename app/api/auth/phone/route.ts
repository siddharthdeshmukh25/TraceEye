import { NextResponse } from "next/server";
import { db } from "@/lib/mongodb";
import { badRequest, id, publicId } from "@/lib/api";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { phone_number, firebase_uid, display_name, email } = body;
    
    if (!phone_number || !firebase_uid) {
      return badRequest("Phone number and Firebase UID are required");
    }
    
    const database = await db();
    
    // Check if user exists with this phone number or Firebase UID
    let user = await database.collection("users").findOne({
      $or: [
        { phone_number: phone_number },
        { firebase_uid: firebase_uid }
      ]
    });
    
    if (user) {
      // Update existing user
      await database.collection("users").updateOne(
        { _id: user._id },
        {
          $set: {
            phone_number: phone_number,
            firebase_uid: firebase_uid,
            display_name: display_name || user.display_name,
            email: email || user.email,
            auth_provider: "phone",
            updated_at: new Date()
          }
        }
      );
    } else {
      // Create new user
      const newUser = {
        phone_number: phone_number,
        firebase_uid: firebase_uid,
        display_name: display_name || "Farmer",
        email: email || null,
        auth_provider: "phone",
        created_at: new Date(),
        updated_at: new Date()
      };
      
      const result = await database.collection("users").insertOne(newUser);
      user = { ...newUser, _id: result.insertedId };
    }
    
    // Generate JWT token
    const token = generateJWT(user._id.toString(), user.firebase_uid);
    
    return NextResponse.json({
      user: {
        id: user._id.toString(),
        phone_number: user.phone_number,
        display_name: user.display_name,
        email: user.email,
        auth_provider: user.auth_provider
      },
      token
    }, { status: 200 });
    
  } catch (error) {
    console.error("Phone auth error:", error);
    return NextResponse.json(
      { detail: error instanceof Error ? error.message : "Phone authentication failed" },
      { status: 500 }
    );
  }
}

// Simple JWT generation (in production, use proper library)
function generateJWT(userId: string, firebaseUid: string): string {
  // This is a simplified version - in production use proper JWT library
  const header = {
    alg: "HS256",
    typ: "JWT"
  };
  
  const payload = {
    id: userId,
    firebase_uid: firebaseUid,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + (60 * 60 * 24) // 24 hours
  };
  
  // In production, use proper JWT signing
  // For now, return a base64 encoded version (NOT SECURE - for demo only)
  const encodedHeader = Buffer.from(JSON.stringify(header)).toString('base64');
  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString('base64');
  const signature = Buffer.from(`${encodedHeader}.${encodedPayload}`).toString('base64');
  
  return `${encodedHeader}.${encodedPayload}.${signature}`;
}