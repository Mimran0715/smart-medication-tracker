import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/tokens";
import { markCompleted } from "@/lib/reminder-store";
import { adminAuth } from "@/lib/firebase-admin";
import { getPatientByFirebaseUid } from "@/lib/data";
import { pool } from "@/lib/pool";
import type { QuestionnairePayload } from "@/types/questionnaire";

// Map questionnaire symptom names to DB constraint values
const symptomCategoryMap: Record<string, string> = {
  fatigue: "fatigue",
  dizziness: "dizziness",
  nausea: "nausea",
  headache: "headache",
  "blurred vision": "blurred_vision",
  other: "other",
};

export async function POST(request: NextRequest) {
  try {
    const body: QuestionnairePayload = await request.json();

    if (!body.token) {
      return NextResponse.json({ error: "Token required" }, { status: 400 });
    }

    const payload = verifyToken(body.token);

    // get patient_id from email
    if (!payload.email) {
      return NextResponse.json({ error: "No email in token" }, { status: 400 });
    }

    const firebaseUser = await adminAuth.getUserByEmail(payload.email);
    const patientId = await getPatientByFirebaseUid(firebaseUser.uid);

    if (!patientId) {
      return NextResponse.json({ error: "No patient mapped to this account" }, { status: 404 });
    }

    const today = payload.date || new Date().toISOString().split("T")[0];
    const now = new Date().toLocaleTimeString("en-US", { hour12: false });

    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      // insert glucose reading
      await client.query(
        `INSERT INTO glucose (patient_id, reading, date, time_taken, notes)
         VALUES ($1, $2, $3, $4, $5)`,
        [patientId, body.glucoseMgDl, today, now, body.notes || null]
      );

      // insert weight
      await client.query(
        `INSERT INTO weight (patient_id, weight, date)
         VALUES ($1, $2, $3)`,
        [patientId, body.weightLbs, today]
      );

      // insert exercise
      await client.query(
        `INSERT INTO exercise (patient_id, exercised, date)
         VALUES ($1, $2, $3)`,
        [patientId, body.exercisedToday, today]
      );

      // insert adherence if medication was taken
      if (body.medicationTaken) {
        await client.query(
          `INSERT INTO adherence (patient_id, medication_id, medication_name, date)
           VALUES ($1, $2, $3, $4)`,
          [patientId, 0, payload.medicationName, today]
        );
      }

      // Insert side effects 
      for (const symptom of body.symptoms) {
        const category = symptomCategoryMap[symptom.name] || "other";
        const notes = category === "other" ? symptom.name : null;

        await client.query(
          `INSERT INTO side_effects (patient_id, side_effect_category, side_effect_severity, side_effect_notes, date)
           VALUES ($1, $2, $3, $4, $5)`,
          [patientId, category, symptom.severity, notes, today]
        );
      }

      await client.query("COMMIT");
    } catch (dbError) {
      await client.query("ROLLBACK");
      throw dbError;
    } finally {
      client.release();
    }

    // Mark the reminder instance as completed
    markCompleted(payload.medicationName, payload.time, payload.date);

    // Log the submission for testing visibility
    // console.log("Questionnaire submitted:", {
    //   medication: payload.medicationName,
    //   time: payload.time,
    //   date: payload.date,
    //   medicationTaken: body.medicationTaken,
    //   glucoseMgDl: body.glucoseMgDl,
    //   weightLbs: body.weightLbs,
    //   exercisedToday: body.exercisedToday,
    //   symptoms: body.symptoms,
    //   notes: body.notes,
    // });

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Submission failed";
    console.error("Questionnaire submit error:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
