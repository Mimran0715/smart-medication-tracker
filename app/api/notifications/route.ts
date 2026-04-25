import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/pool.ts"; 

const MOCK_PATIENT_ID = "00000000-0000-0000-0000-000000000001";

export async function GET() {
  try {
    const result = await pool.query(
      `
      SELECT id, title, body, is_read, created_at
      FROM notifications
      WHERE patient_id = $1
      ORDER BY created_at DESC
      LIMIT 5
      `,
      [MOCK_PATIENT_ID]
    );

    return NextResponse.json(result.rows);
  } catch (err) {
    console.error("GET /notifications error:", err);
    return NextResponse.json(
      { error: "Failed to fetch notifications" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
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
      [MOCK_PATIENT_ID, title, message]
    );

    return NextResponse.json(result.rows[0]);
  } catch (err) {
    console.error("POST /notifications error:", err);
    return NextResponse.json(
      { error: "Failed to create notification" },
      { status: 500 }
    );
  }
}