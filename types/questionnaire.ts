export const SYMPTOM_OPTIONS = [
  "fatigue",
  "dizziness",
  "nausea",
  "headache",
  "blurred vision",
  "other",
] as const;

export type Symptom = (typeof SYMPTOM_OPTIONS)[number];

export interface SymptomEntry {
  name: string;
  severity: number; // 1–5
}

export interface QuestionnairePayload {
  token: string;
  medicationTaken: boolean;
  doseTime?: string;
  glucoseMgDl: number;
  weightLbs: number;
  exercisedToday: boolean;
  symptoms: SymptomEntry[];
  notes?: string;
}

export interface FieldErrors {
  medicationTaken?: string;
  glucoseMgDl?: string;
  weightLbs?: string;
  exercisedToday?: string;
  symptomSeverity?: string;
  otherSymptom?: string;
  notes?: string;
}
