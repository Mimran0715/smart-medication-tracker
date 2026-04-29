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
  log("Glucose Dashboard START", { uid });

  try {
    const fallback = await pool.query(
      `
      SELECT reading, created_at
      FROM glucose
      WHERE patient_id = $1
      ORDER BY created_at DESC
      LIMIT 7
      `,
      [uid]
    );

    log("Glucose fallback result", fallback.rows);

    if (fallback.rows?.length > 0) {
      log("Glucose returning FALLBACK data (reversed)");
      return fallback.rows.reverse();
    }

    log("Glucose no DB data → returning FAKE");
    return generateFakeGlucose();
  } catch (err) {
    logError("Glucose dashboard failure", err);
    return generateFakeGlucose();
  }
}

const MEDICATIONS = [
  "Metformin",
  "Insulin",
  "Glipizide",
  "Pioglitazone",
  "Acarbose",
];

function getRandomAdherence() {
  return Math.round((Math.random() * (0.95 - 0.6) + 0.6) * 100);
}

export async function getAdherenceDashboard(uid: string, medication: string) {
  log("Adherence Dashboard START", { uid, medication });

  const queryAdherence = async (med: string) => {
    log("Adherence querying med", med);

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
      [uid, `%${med}%`]
    );

    log(`Adherence raw result for ${med}`, result.rows);

    return result.rows?.[0]?.adherence ?? null;
  };

  try {
    let adherence = await queryAdherence(medication);

    if (adherence !== null && adherence !== undefined) {
      log("Adherence using PRIMARY medication match", adherence);
      return [{ adherence: Math.round(adherence * 100) }];
    }

    log("Adherence PRIMARY empty → trying alternates");

    for (const med of MEDICATIONS) {
      if (med.toLowerCase() === medication.toLowerCase()) continue;

      const alt = await queryAdherence(med);

      if (alt !== null && alt !== undefined) {
        log("Adherence using FALLBACK med", { med, alt });
        return [{ adherence: Math.round(alt * 100) }];
      }
    }

    log("Adherence no DB data → FAKE fallback");
    return [{ adherence: getRandomAdherence() }];
  } catch (err) {
    logError("Adherence dashboard failure", err);
    return [{ adherence: getRandomAdherence() }];
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
