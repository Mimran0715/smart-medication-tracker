import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/pool.ts"; 
import { getOrCreatePatientId } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const patientId = await getOrCreatePatientId(req);

    const result = await pool.query(
      `
      SELECT id, title, body, is_read, created_at
      FROM notifications
      WHERE patient_id = $1
      ORDER BY created_at DESC
      LIMIT 5
      `,
      [patientId]
    );

    return NextResponse.json(result.rows);
  } catch (err: any) {
    if (err.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.error(err);
    return NextResponse.json(
      { error: "Failed to fetch notifications" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const patientId = await getOrCreatePatientId(req);
    const body = await req.json();

    const { title, body: message } = body;

    if (!title || !message) {
      return NextResponse.json(
        { error: "Missing title or body" },
        { status: 400 }
      );
    }

    const result = await pool.query(
      `
      INSERT INTO notifications (patient_id, title, body, is_read)
      VALUES ($1, $2, $3, false)
      RETURNING id, title, body, is_read, created_at
      `,
      [patientId, title, message]
    );

    return NextResponse.json(result.rows[0]);
  } catch (err: any) {
    if (err.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.error(err);
    return NextResponse.json(
      { error: "Failed to create notification" },
      { status: 500 }
    );
  }
}