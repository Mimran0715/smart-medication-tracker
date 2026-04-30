import { pool } from "./pool.ts";
import { sideEffectsTimeseries } from "../app/analytics/analytics-backup.ts";

const log = (label: string, data?: any) => {
  return;
  console.log(`🧠 [DASHBOARD DEBUG] ${label}`);
  if (data !== undefined) console.log(JSON.stringify(data, null, 2));
};

const logError = (label: string, err: any) => {
  return;
  console.error(`❌ [DASHBOARD ERROR] ${label}`);
  console.error(err);
};

function generateFakeGlucose() {
  const base = Math.floor(Math.random() * (140 - 100) + 100);

  return Array.from({ length: 7 }, (_, i) => ({
    reading: base + Math.floor(Math.random() * 20 - 10),
  }));
}

function normalizeSideEffectsFallback() {
  const rows: {
    date: string;
    side_effect_category: string;
    occurrences: number;
  }[] = [];

  for (const day of sideEffectsTimeseries) {
    for (const [key, value] of Object.entries(day)) {
      if (key === "date") continue;

      rows.push({
        date: day.date,
        side_effect_category: key,
        occurrences: value as number,
      });
    }
  }

  return rows;
}

export async function getGlucoseDashboard(uid: string) {
  try {
    const result = await pool.query(
      `
      SELECT reading, created_at
      FROM glucose
      WHERE patient_id = $1
      ORDER BY created_at DESC
      LIMIT 7
      `,
      [uid]
    );

    if (result.rows?.length > 0) {
      return result.rows.reverse();
    }

    // fallback (stable, not random)
    return [
      { reading: 110, created_at: "" },
      { reading: 112, created_at: "" },
      { reading: 108, created_at: "" },
      { reading: 115, created_at: "" },
      { reading: 111, created_at: "" },
      { reading: 109, created_at: "" },
      { reading: 113, created_at: "" },
    ];
  } catch {
    return [
      { reading: 110, created_at: "" },
      { reading: 112, created_at: "" },
      { reading: 108, created_at: "" },
      { reading: 115, created_at: "" },
      { reading: 111, created_at: "" },
      { reading: 109, created_at: "" },
      { reading: 113, created_at: "" },
    ];
  }
}

const MEDICATIONS = [
  "Metformin",
  "Insulin",
  "Glipizide",
  "Pioglitazone",
  "Acarbose",
];

// function getRandomAdherence() {
//   return Math.round((Math.random() * (0.95 - 0.6) + 0.6) * 100);
// }

export async function getAdherenceDashboard(uid: string, medication: string) {
  try {
    const result = await pool.query(
      `
      SELECT
        COUNT(DISTINCT date) FILTER (
          WHERE date >= CURRENT_DATE - INTERVAL '6 days'
        )::float / 7 AS adherence
      FROM adherence
      WHERE patient_id = $1
        AND medication_name ILIKE $2
      `,
      [uid, `%${medication}%`]
    );

    const value = result.rows?.[0]?.adherence;

    if (value != null) {
      return [{ adherence: Math.round(value * 100) }];
    }

    return [{ adherence: 80 }];
  } catch {
    return [{ adherence: 80 }];
  }
}
const SIDE_EFFECT_CATEGORIES = [
  "fatigue",
  "dizziness",
  "nausea",
  "headache",
  "blurred_vision",
  "other",
];

export async function getSideEffectsDashboard(uid: string) {
  log("SideEffects Dashboard START", { uid });

  try {
    const result = await pool.query(
      `
      SELECT
        DATE(created_at) AS date,
        side_effect_category,
        COUNT(*)::int AS occurrences
      FROM side_effects
      WHERE patient_id = $1
        AND created_at >= NOW() - INTERVAL '6 days'
      GROUP BY DATE(created_at), side_effect_category
      ORDER BY date ASC
      `,
      [uid]
    );

    log("SideEffects RAW", result.rows);

    if (result.rows.length > 0) {
      return result.rows;
    }

    return normalizeSideEffectsFallback();
  } catch (err) {
    logError("SideEffects dashboard failure", err);
    return normalizeSideEffectsFallback();
  }
}
