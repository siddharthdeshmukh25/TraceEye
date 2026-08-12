import { verifyToken } from "./token";
import { NextResponse } from "next/server";

export function withAuth(handler: (request: Request, userId: string) => Promise<NextResponse>) {
  return async (request: Request) => {
    try {
      const authHeader = request.headers.get("authorization");
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return NextResponse.json({ detail: "Unauthorized" }, { status: 401 });
      }

      const token = authHeader.substring(7);
      const payload = verifyToken(token);
      
      if (!payload) {
        return NextResponse.json({ detail: "Invalid or expired token" }, { status: 401 });
      }

      return handler(request, payload.id);
    } catch (error) {
      return NextResponse.json({ detail: "Authentication failed" }, { status: 401 });
    }
  };
}