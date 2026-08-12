import { NextResponse } from "next/server";
import { db } from "@/lib/mongodb";
import { badRequest } from "@/lib/api";
import { generateToken } from "@/lib/token";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const { email, password, name, mode } = await request.json();
  
  if (!email || !password || !mode) {
    return badRequest("email, password, and mode are required");
  }

  if (mode === "signup" && !name) {
    return badRequest("name is required for signup");
  }

  try {
    const users = (await db()).collection("users");
    
    if (mode === "signup") {
      // Check if user already exists
      const existingUser = await users.findOne({ email });
      if (existingUser) {
        return NextResponse.json(
          { detail: "User with this email already exists" },
          { status: 409 }
        );
      }

      // Create new user
      const result = await users.insertOne({
        email,
        password, // Note: In production, you should hash this password!
        name: name.trim(),
        auth_provider: "email",
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
        email: user.email,
        full_name: user.name,
        auth_provider: "email"
      });

      return NextResponse.json({
        token,
        user: {
          id: user._id.toString(),
          full_name: user.name,
          email: user.email,
          auth_provider: "email"
        }
      });
    } else if (mode === "login") {
      // Find user and verify password
      const user = await users.findOne({ email });
      if (!user) {
        return NextResponse.json(
          { detail: "Invalid email or password" },
          { status: 401 }
        );
      }

      if (user.password !== password) {
        return NextResponse.json(
          { detail: "Invalid email or password" },
          { status: 401 }
        );
      }

      // Generate JWT token
      const token = generateToken({
        id: user._id.toString(),
        email: user.email,
        full_name: user.name || "TraceEye member",
        auth_provider: "email"
      });

      return NextResponse.json({
        token,
        user: {
          id: user._id.toString(),
          full_name: user.name || "TraceEye member",
          email: user.email,
          auth_provider: "email"
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
