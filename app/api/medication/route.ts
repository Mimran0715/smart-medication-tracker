import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { medication, dose, unit, recordedAt } = body;

    if (!medication || !dose || !unit || !recordedAt) {
      return NextResponse.json(
        { error: "Missing fields" },
        { status: 400 }
      );
    }

    await db.query(
      `INSERT INTO medication_logs 
        (medication, dose, unit, recorded_at)
       VALUES ($1, $2, $3, $4)`,
      [medication, dose, unit, recordedAt]
    );

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Server error" },
      { status: 500 }
    );
  }
}