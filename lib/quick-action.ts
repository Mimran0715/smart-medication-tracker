import { pool } from "./pool.ts";
import {
  MEDICATION_ID_MAP,
  MEDICATION_NAME_MAP,
} from "./constants/medications";

type LogGlucoseParams = {
  patientId: string;
  glucose: number;
  recordedAt: string; 
  mealContext: string;
  notes?: string;
};

export async function logGlucose({
  patientId,
  glucose,
  recordedAt,
  mealContext,
  notes,
}: LogGlucoseParams) {
  const dt = new Date(recordedAt);
  const date = dt.toISOString().split("T")[0];
  const timeTaken = dt.toTimeString().split(" ")[0];

  const result = await pool.query(
    `
    INSERT INTO glucose (
      patient_id,
      reading,
      meal_context,
      notes,
      created_at,
      date,
      time_taken
    )
    VALUES (
      $1,
      $2,
      $3,
      $4,
      NOW(),
      $5,
      $6
    )
    RETURNING *;
    `,
    [
      patientId,
      glucose,
      mealContext,
      notes || null,
      date,
      timeTaken,
    ]
  );

  return result.rows[0];
}

export async function markMedicationTaken(
  patientId: string,
  medicationKey: string
) {
  const medicationId =
    MEDICATION_ID_MAP[medicationKey.toLowerCase()];

  if (!medicationId) {
    throw new Error("Invalid medication key");
  }

  const medicationName =
    MEDICATION_NAME_MAP[medicationId];

  const today = new Date().toISOString().split("T")[0];

  const result = await pool.query(
    `
    INSERT INTO adherence (
      patient_id,
      medication_id,
      medication_name,
      created_at,
      date
    )
    VALUES (
      $1,
      $2,
      $3,
      NOW(),
      $4
    )
    RETURNING *;
    `,
    [
      patientId,
      medicationId,
      medicationName, // ✅ FIXED (this was null)
      today,
    ]
  );

  return result.rows[0];
}