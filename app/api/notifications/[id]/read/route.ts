import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/pool";
import { getOrCreatePatientId } from "@/lib/auth";

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params; 
    const patientId = await getOrCreatePatientId(req);

    await pool.query(
      `
      UPDATE notifications
      SET is_read = true
      WHERE id = $1 AND patient_id = $2
      `,
      [id, patientId] 
    );

    return NextResponse.json({ success: true });
  } catch (err: any) {
    if (err.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.error(err);
    return NextResponse.json(
      { error: "Failed to mark notification as read" },
      { status: 500 }
    );
  }
}