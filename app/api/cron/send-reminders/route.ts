import { NextRequest, NextResponse } from "next/server";
import { generateToken } from "@/lib/tokens";
import { sendReminderEmail } from "@/lib/email";
import { wasSentToday, markSent, markFailed } from "@/lib/reminder-store";
import { pool } from "@/lib/pool";

export async function PUT(request: NextRequest) {
  // Called by dashboard to save schedules + email + timezone to DB
  try {
    const { schedules, email, timezone } = await request.json();

    if (!email) {
      return NextResponse.json({ error: "Email required" }, { status: 400 });
    }

    // Upsert: update if email exists, insert if not
    await pool.query(
      `INSERT INTO reminder_config (email, schedules, timezone, updated_at)
       VALUES ($1, $2, $3, NOW())
       ON CONFLICT (email) DO UPDATE
       SET schedules = $2, timezone = $3, updated_at = NOW()`,
      [email, JSON.stringify(schedules || {}), timezone || "America/New_York"]
    );

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("PUT reminder config error:", err);
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

    // Allow overriding from request body
    let email = "";
    let schedules: Record<string, string[]> = {};

    try {
      const body = await request.json();
      if (body.email) email = body.email;
      if (body.schedules) schedules = body.schedules;
    } catch {
      // No body provided, read from DB
    }

    const today = new Date().toISOString().split("T")[0];

    // If email + schedules passed in body, send immediately (manual trigger)
    if (email && Object.keys(schedules).length > 0) {
      const results = await sendReminders(email, schedules, today, null);
      console.log("Reminder send results (manual):", results);
      return NextResponse.json(results);
    }

    // Otherwise, read all configs from DB and only send if current time matches
    const result = await pool.query(
      `SELECT email, schedules, timezone FROM reminder_config`
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: "No reminder configs found. Set up schedules from the dashboard first." },
        { status: 400 }
      );
    }

    const allResults = { sent: 0, skipped: 0, failed: 0, details: [] as string[] };

    for (const row of result.rows) {
      const userEmail = row.email;
      const userSchedules = row.schedules as Record<string, string[]>;
      const userTimezone = row.timezone || "America/New_York";

      // Convert current UTC time to the user's local timezone
      const userLocalTime = new Date().toLocaleTimeString("en-US", {
        hour12: false,
        hour: "2-digit",
        minute: "2-digit",
        timeZone: userTimezone,
      });

      const userResult = await sendReminders(userEmail, userSchedules, today, userLocalTime);
      allResults.sent += userResult.sent;
      allResults.skipped += userResult.skipped;
      allResults.failed += userResult.failed;
      allResults.details.push(...userResult.details);
    }

    console.log("Reminder send results (cron):", allResults);
    return NextResponse.json(allResults);
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Scheduler error";
    console.error("Cron send-reminders error:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

async function sendReminders(
  email: string,
  schedules: Record<string, string[]>,
  today: string,
  currentTime: string | null // null = send all (manual), string = only matching time (cron)
) {
  const results = { sent: 0, skipped: 0, failed: 0, details: [] as string[] };

  for (const [medicationName, times] of Object.entries(schedules)) {
    for (const time of times) {
      // If cron mode, only send if current time matches the scheduled time
      if (currentTime !== null && time !== currentTime) {
        continue;
      }

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

  return results;
}
