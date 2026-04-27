export const MEDICATIONS = [
  "Metformin",
  "Insulin",
  "Glipizide",
  "Pioglitazone",
  "Acarbose",
];

export const SIDE_EFFECT_CATEGORIES = [
  "fatigue",
  "dizziness",
  "nausea",
  "headache",
  "blurred_vision",
  "other",
];

/* -------------------------------------------------
   GLUCOSE TIMESERIES (expanded + more variance)
--------------------------------------------------*/
export const glucoseTimeseries = [
  {
    date: "2026-04-19",
    Metformin: 118,
    Insulin: 138,
    Glipizide: 145,
    Pioglitazone: 126,
    Acarbose: 112,
  },
  {
    date: "2026-04-20",
    Metformin: 112,
    Insulin: 135,
    Glipizide: 142,
    Pioglitazone: 124,
    Acarbose: 110,
  },
  {
    date: "2026-04-21",
    Metformin: 121,
    Insulin: 140,
    Glipizide: 148,
    Pioglitazone: 129,
    Acarbose: 114,
  },
  {
    date: "2026-04-22",
    Metformin: 116,
    Insulin: 133,
    Glipizide: 144,
    Pioglitazone: 125,
    Acarbose: 109,
  },
  {
    date: "2026-04-23",
    Metformin: 110,
    Insulin: 129,
    Glipizide: 139,
    Pioglitazone: 121,
    Acarbose: 107,
  },
  {
    date: "2026-04-24",
    Metformin: 114,
    Insulin: 131,
    Glipizide: 141,
    Pioglitazone: 123,
    Acarbose: 108,
  },
  {
    date: "2026-04-25",
    Metformin: 117,
    Insulin: 136,
    Glipizide: 146,
    Pioglitazone: 127,
    Acarbose: 111,
  },
];

/* -------------------------------------------------
   WEIGHT TIMESERIES (stronger trend + noise)
--------------------------------------------------*/
export const weightTimeseries = [
  { date: "2026-04-19", weight: 78.8 },
  { date: "2026-04-20", weight: 78.5 },
  { date: "2026-04-21", weight: 78.1 },
  { date: "2026-04-22", weight: 77.9 },
  { date: "2026-04-23", weight: 77.6 },
  { date: "2026-04-24", weight: 77.3 },
  { date: "2026-04-25", weight: 77.0 },
];

/* -------------------------------------------------
   SIDE EFFECTS RAW (expanded density)
--------------------------------------------------*/
export const sideEffectsRaw = [
  // 04-19 (cluster day)
  {
    patient_id: "demo",
    side_effect_category: "blurred_vision",
    side_effect_notes: "morning visual distortion",
    side_effect_severity: 2,
    date: "2026-04-19",
    created_at: "2026-04-19T08:00:00Z",
  },
  {
    patient_id: "demo",
    side_effect_category: "fatigue",
    side_effect_notes: "midday exhaustion",
    side_effect_severity: 3,
    date: "2026-04-19",
    created_at: "2026-04-19T13:00:00Z",
  },

  // 04-20
  {
    patient_id: "demo",
    side_effect_category: "nausea",
    side_effect_notes: "post-meal nausea",
    side_effect_severity: 2,
    date: "2026-04-20",
    created_at: "2026-04-20T09:30:00Z",
  },
  {
    patient_id: "demo",
    side_effect_category: "headache",
    side_effect_notes: "mild tension headache",
    side_effect_severity: 1,
    date: "2026-04-20",
    created_at: "2026-04-20T17:00:00Z",
  },

  // 04-21
  {
    patient_id: "demo",
    side_effect_category: "dizziness",
    side_effect_notes: "standing dizziness",
    side_effect_severity: 2,
    date: "2026-04-21",
    created_at: "2026-04-21T11:00:00Z",
  },
  {
    patient_id: "demo",
    side_effect_category: "fatigue",
    side_effect_notes: "evening crash",
    side_effect_severity: 3,
    date: "2026-04-21",
    created_at: "2026-04-21T19:00:00Z",
  },

  // 04-22
  {
    patient_id: "demo",
    side_effect_category: "headache",
    side_effect_notes: "pressure headache",
    side_effect_severity: 2,
    date: "2026-04-22",
    created_at: "2026-04-22T10:00:00Z",
  },

  // 04-23
  {
    patient_id: "demo",
    side_effect_category: "fatigue",
    side_effect_notes: "low energy day",
    side_effect_severity: 3,
    date: "2026-04-23",
    created_at: "2026-04-23T12:00:00Z",
  },
  {
    patient_id: "demo",
    side_effect_category: "dizziness",
    side_effect_notes: "light dizziness",
    side_effect_severity: 1,
    date: "2026-04-23",
    created_at: "2026-04-23T18:00:00Z",
  },

  // 04-24
  {
    patient_id: "demo",
    side_effect_category: "other",
    side_effect_notes: "general discomfort",
    side_effect_severity: 1,
    date: "2026-04-24",
    created_at: "2026-04-24T14:00:00Z",
  },

  // 04-25
  {
    patient_id: "demo",
    side_effect_category: "blurred_vision",
    side_effect_notes: "short episode after exercise",
    side_effect_severity: 2,
    date: "2026-04-25",
    created_at: "2026-04-25T09:00:00Z",
  },
  {
    patient_id: "demo",
    side_effect_category: "nausea",
    side_effect_notes: "mild morning nausea",
    side_effect_severity: 1,
    date: "2026-04-25",
    created_at: "2026-04-25T10:30:00Z",
  },
];

/* -------------------------------------------------
   SIDE EFFECTS (PIVOTED FOR CHARTS - expanded)
--------------------------------------------------*/
export const sideEffectsTimeseries = [
  {
    date: "2026-04-12",
    fatigue: 1,
  },
  {
    date: "2026-04-13",
    dizziness: 1,
  },
  {
    date: "2026-04-14",
    nausea: 1,
  },
  {
    date: "2026-04-15",
    headache: 1,
    fatigue: 1,
  },
  {
    date: "2026-04-16",
    blurred_vision: 1,
  },
  {
    date: "2026-04-17",
    fatigue: 1,
    dizziness: 1,
  },
  {
    date: "2026-04-18",
    headache: 1,
  },

  // existing window (kept but enriched)
  {
    date: "2026-04-19",
    blurred_vision: 1,
    fatigue: 1,
  },
  {
    date: "2026-04-20",
    nausea: 1,
    headache: 1,
  },
  {
    date: "2026-04-21",
    dizziness: 1,
    fatigue: 1,
  },
  {
    date: "2026-04-22",
    headache: 1,
    nausea: 1,
  },
  {
    date: "2026-04-23",
    fatigue: 1,
    dizziness: 1,
  },
  {
    date: "2026-04-24",
    other: 1,
    fatigue: 1,
  },
  {
    date: "2026-04-25",
    blurred_vision: 1,
    nausea: 1,
    headache: 1,
  },
];

/* -------------------------------------------------
   MASTER ANALYTICS OBJECT
--------------------------------------------------*/
export const analyticsBackup = {
  timeseries: glucoseTimeseries,
  weightTimeseries,
  sideEffectsRaw,
  sideEffectsTimeseries,
};