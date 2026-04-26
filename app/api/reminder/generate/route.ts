import { NextRequest, NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebase-admin";
import { generateToken } from "@/lib/tokens";

export async function POST(request: NextRequest) {
  try {
    const sessionCookie = request.cookies.get("__session")?.value;
    if (!sessionCookie) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const decoded = await adminAuth.verifyIdToken(sessionCookie);
    const email = decoded.email;
    if (!email) {
      return NextResponse.json({ error: "No email on account" }, { status: 400 });
    }

    const { medicationName, time, date } = await request.json();
    const today = date || new Date().toISOString().split("T")[0];
    const now = time || new Date().toLocaleTimeString("en-US", { hour12: false, hour: "2-digit", minute: "2-digit" });

    const token = generateToken({
      medicationName: medicationName || "Daily Check-In",
      time: now,
      date: today,
      email,
    });

    return NextResponse.json({ token });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to generate token";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
