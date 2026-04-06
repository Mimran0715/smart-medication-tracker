import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/tokens";

export async function POST(request: NextRequest) {
  try {
    const { token } = await request.json();

    if (!token) {
      return NextResponse.json({ error: "Token required" }, { status: 400 });
    }

    const payload = verifyToken(token);
    return NextResponse.json(payload);
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Invalid token";
    return NextResponse.json({ error: message }, { status: 401 });
  }
}
