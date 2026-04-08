import { NextRequest, NextResponse } from "next/server";
import { generateToken } from "@/lib/tokens";
import { sendReminderEmail } from "@/lib/email";

export async function POST(request: NextRequest) {
  try {
    const { email, medicationName, time } = await request.json();

    if (!email || !medicationName || !time) {
      return NextResponse.json(
        { error: "email, medicationName, and time are required" },
        { status: 400 }
      );
    }

    const today = new Date().toISOString().split("T")[0];
    const token = generateToken({ medicationName, time, date: today, email });

    await sendReminderEmail(email, medicationName, time, token);

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Failed to send email";
    console.error("Test email error:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
