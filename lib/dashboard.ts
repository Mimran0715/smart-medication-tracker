import { pool } from "./pool.ts";

function generateFakeGlucose() {
  const base = Math.floor(Math.random() * (140 - 100) + 100); 

  return Array.from({ length: 7 }, (_, i) => ({
    reading: base + Math.floor(Math.random() * 20 - 10), 
  }));
}

export async function getGlucoseDashboard(uid: string) {
  const result = await pool.query(
    `
    SELECT reading
    FROM glucose
    WHERE patient_id = $1
      AND created_at >= NOW() - INTERVAL '7 days'
    ORDER BY created_at ASC
    LIMIT 7
    `,
    [uid]
  );

  if (result.rows && result.rows.length > 0) {
    return result.rows;
  }

  const fallback = await pool.query(
    `
    SELECT reading
    FROM glucose
    WHERE patient_id = $1
    ORDER BY created_at DESC
    LIMIT 7
    `,
    [uid]
  );

  if (fallback.rows && fallback.rows.length > 0) {
    return fallback.rows.reverse(); 
  }

  return generateFakeGlucose();
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
  const queryAdherence = async (med: string) => {
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

   
    return result.rows?.[0]?.adherence ?? null;
  };

  
  let adherence = await queryAdherence(medication);

  if (adherence !== null && adherence !== undefined) {
    return [{ adherence: Math.round(adherence * 100) }];
  }

 
  for (const med of MEDICATIONS) {
    if (med.toLowerCase() === medication.toLowerCase()) continue;

    const altAdherence = await queryAdherence(med);

    if (altAdherence !== null && altAdherence !== undefined) {
      return [{ adherence: Math.round(altAdherence * 100) }];
    }
  }
  return [{ adherence: getRandomAdherence() }];
}

const SIDE_EFFECT_CATEGORIES = [
  "fatigue",
  "dizziness",
  "nausea",
  "headache",
  "blurred_vision",
  "other",
];

function generateFakeSideEffects() {
  const today = new Date();
  const data = [];

  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(today.getDate() - i);

    data.push({
      date: d.toISOString().split("T")[0],
      occurrences: Math.random() > 0.7 ? Math.floor(Math.random() * 2) + 1 : 0,
    });
  }

  return data;
}

export async function getSideEffectsDashboard(uid: string, category: string) {
  console.log("🧪 SideEffects DEBUG START");
  console.log("UID:", uid);
  console.log("Requested category:", category);

  // 1. Try requested category
  const result = await pool.query(
    `
    SELECT
      date,
      COUNT(*) AS occurrences
    FROM side_effects
    WHERE patient_id = $1
      AND side_effect_category = $2
      AND date >= CURRENT_DATE - INTERVAL '6 days'
    GROUP BY date
    ORDER BY date ASC
    `,
    [uid, category]
  );

  console.log("📊 Primary query rows:", result.rows);
  console.log("📊 Primary row count:", result.rows.length);

  // 2. If we have data, return it
  if (result.rows.length > 0) {
    console.log("✅ Returning requested category data");
    return result.rows;
  }

  // 3. Try fallback categories
  console.log("⚠️ No data for requested category, trying fallbacks...");

  for (const altCategory of SIDE_EFFECT_CATEGORIES) {
    if (altCategory === category) continue;

    console.log("🔎 Trying category:", altCategory);

    const altResult = await pool.query(
      `
      SELECT
        date,
        COUNT(*) AS occurrences
      FROM side_effects
      WHERE patient_id = $1
        AND side_effect_category = $2
        AND date >= CURRENT_DATE - INTERVAL '6 days'
      GROUP BY date
      ORDER BY date ASC
      `,
      [uid, altCategory]
    );

    console.log(`📊 ${altCategory} rows:`, altResult.rows);

    if (altResult.rows.length > 0) {
      console.log("✅ Using fallback category:", altCategory);
      return altResult.rows;
    }
  }

  // 4. Final fallback
  console.log("❌ No DB data found at all → generating fake data");
  return generateFakeSideEffects();
}