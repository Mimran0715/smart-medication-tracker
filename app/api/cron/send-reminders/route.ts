import { NextRequest, NextResponse } from "next/server";
import { generateToken } from "@/lib/tokens";
import { sendReminderEmail } from "@/lib/email";
import { wasSentToday, markSent, markFailed } from "@/lib/reminder-store";

// In-memory schedule store shared with client via this endpoint
// The dashboard POSTs schedules here, and this GET triggers sends
let savedSchedules: Record<string, string[]> = {};
let savedEmail = "";

export async function PUT(request: NextRequest) {
  // Called by dashboard to sync schedules to the server
  try {
    const { schedules, email } = await request.json();
    if (schedules) savedSchedules = schedules;
    if (email) savedEmail = email;
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const cronSecret = process.env.CRON_SECRET || "dev-cron-secret";
    const authHeader = request.headers.get("x-cron-secret");

    if (authHeader !== cronSecret) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Allow overriding email and schedules from request body
    let email = savedEmail;
    let schedules = savedSchedules;

    try {
      const body = await request.json();
      if (body.email) email = body.email;
      if (body.schedules) schedules = body.schedules;
    } catch {
      // No body provided, use saved values
    }

    if (!email) {
      return NextResponse.json(
        { error: "No email configured. Send schedules via PUT first or include email in body." },
        { status: 400 }
      );
    }

    const today = new Date().toISOString().split("T")[0];
    const results = { sent: 0, skipped: 0, failed: 0, details: [] as string[] };

    for (const [medicationName, times] of Object.entries(schedules)) {
      for (const time of times) {
        if (wasSentToday(medicationName, time, today)) {
          results.skipped++;
          results.details.push(`Skipped ${medicationName} at ${time} (already sent)`);
          continue;
        }

        const token = generateToken({ medicationName, time, date: today, email });

        // Try sending with one retry
        for (let attempt = 0; attempt < 2; attempt++) {
          try {
            await sendReminderEmail(email, medicationName, time, token);
            markSent(medicationName, time, today);
            results.sent++;
            results.details.push(`Sent ${medicationName} at ${time}`);
            break;
          } catch (err: unknown) {
            if (attempt === 1) {
              const msg = err instanceof Error ? err.message : "Unknown error";
              markFailed(medicationName, time, today, msg);
              results.failed++;
              results.details.push(`Failed ${medicationName} at ${time}: ${msg}`);
            }
          }
        }
      }
    }

    console.log("Reminder send results:", results);
    return NextResponse.json(results);
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Scheduler error";
    console.error("Cron send-reminders error:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
