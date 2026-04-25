import { pool } from "./pool.ts";

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
  medicationId: string
) {
  const result = await pool.query(
    `
    INSERT INTO adherence (
      id,
      patient_id,
      medication_id,
      taken_at,
      created_at
    )
    VALUES (
      gen_random_uuid(),
      $1,
      $2,
      NOW(),
      NOW()
    )
    RETURNING *;
    `,
    [patientId, medicationId]
  );

  return result.rows[0];
}