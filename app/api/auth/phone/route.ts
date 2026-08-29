import { NextResponse } from "next/server";
import { db } from "@/lib/mongodb";
import { badRequest } from "@/lib/api";
import { generateToken } from "@/lib/token";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const { phone, password, name, mode } = await request.json();
  
  if (!phone || !password || !mode) {
    return badRequest("phone, password, and mode are required");
  }

  if (mode === "signup" && !name) {
    return badRequest("name is required for signup");
  }

  try {
    const users = (await db()).collection("users");
    
    if (mode === "signup") {
      // Check if user already exists
      const existingUser = await users.findOne({ phone });
      if (existingUser) {
        return NextResponse.json(
          { detail: "User with this phone number already exists" },
          { status: 409 }
        );
      }

      // Create new user
      const result = await users.insertOne({
        phone,
        password, // Note: In production, you should hash this password!
        name: name.trim(),
        auth_provider: "phone",
        created_at: new Date(),
        updated_at: new Date(),
      });

      const user = await users.findOne({ _id: result.insertedId });
      if (!user) {
        return NextResponse.json(
          { detail: "Could not create user" },
          { status: 500 }
        );
      }
      
      // Generate JWT token
      const token = generateToken({
        id: user._id.toString(),
        phone: user.phone,
        full_name: user.name,
        auth_provider: "phone"
      });

      return NextResponse.json({
        token,
        user: {
          id: user._id.toString(),
          full_name: user.name,
          phone: user.phone,
          auth_provider: "phone"
        }
      });
    } else if (mode === "login") {
      // Find user and verify password
      const user = await users.findOne({ phone });
      if (!user) {
        return NextResponse.json(
          { detail: "Invalid phone number or password" },
          { status: 401 }
        );
      }

      if (user.password !== password) {
        return NextResponse.json(
          { detail: "Invalid phone number or password" },
          { status: 401 }
        );
      }

      // Generate JWT token
      const token = generateToken({
        id: user._id.toString(),
        phone: user.phone,
        full_name: user.name || "TraceEye member",
        auth_provider: "phone"
      });

      return NextResponse.json({
        token,
        user: {
          id: user._id.toString(),
          full_name: user.name || "TraceEye member",
          phone: user.phone,
          auth_provider: "phone"
        }
      });
    }

    return badRequest("mode must be signup or login");
  } catch (error) {
    return NextResponse.json(
      { detail: "Authentication failed" },
      { status: 500 }
    );
  }
}