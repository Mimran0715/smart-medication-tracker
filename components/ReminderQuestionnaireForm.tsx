"use client";

import { useState } from "react";
import {
  SYMPTOM_OPTIONS,
  type Symptom,
  type QuestionnairePayload,
  type FieldErrors,
} from "@/types/questionnaire";

interface Props {
  token: string;
}

export default function ReminderQuestionnaireForm({ token }: Props) {
  const [medicationTaken, setMedicationTaken] = useState<boolean | null>(null);
  const [doseTime, setDoseTime] = useState("");
  const [glucoseMgDl, setGlucoseMgDl] = useState("");
  const [weightLbs, setWeightLbs] = useState("");
  const [exercisedToday, setExercisedToday] = useState<boolean | null>(null);
  const [symptoms, setSymptoms] = useState<Symptom[]>([]);
  const [symptomSeverities, setSymptomSeverities] = useState<Record<string, number>>({});
  const [otherSymptom, setOtherSymptom] = useState("");
  const [notes, setNotes] = useState("");

  const [errors, setErrors] = useState<FieldErrors>({});
  const [submitError, setSubmitError] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  function toggleSymptom(s: Symptom) {
    setSymptoms((prev) => {
      if (prev.includes(s)) {
        setSymptomSeverities((sev) => {
          const next = { ...sev };
          delete next[s];
          return next;
        });
        if (s === "other") setOtherSymptom("");
        return prev.filter((x) => x !== s);
      }
      return [...prev, s];
    });
  }

  function setSeverity(s: string, val: number) {
    setSymptomSeverities((prev) => ({ ...prev, [s]: val }));
  }

  function validate(): FieldErrors {
    const e: FieldErrors = {};

    if (medicationTaken === null) e.medicationTaken = "Required.";

    const g = Number(glucoseMgDl);
    if (!glucoseMgDl) e.glucoseMgDl = "Required.";
    else if (isNaN(g) || g < 40 || g > 500)
      e.glucoseMgDl = "Must be between 40 and 500.";

    const w = Number(weightLbs);
    if (!weightLbs) e.weightLbs = "Required.";
    else if (isNaN(w) || w < 50 || w > 500)
      e.weightLbs = "Must be between 50 and 500.";

    if (exercisedToday === null) e.exercisedToday = "Required.";

    if (symptoms.includes("other") && !otherSymptom.trim())
      e.otherSymptom = "Please describe the symptom.";

    if (symptoms.length > 0 && symptoms.some((s) => !symptomSeverities[s]))
      e.symptomSeverity = "Each symptom needs a severity rating.";

    if (notes.length > 500) e.notes = "Max 500 characters.";

    return e;
  }

  async function handleSubmit(ev: React.FormEvent) {
    ev.preventDefault();
    setSubmitError("");

    const fieldErrors = validate();
    setErrors(fieldErrors);
    if (Object.keys(fieldErrors).length > 0) return;

    const payload: QuestionnairePayload = {
      token,
      medicationTaken: medicationTaken!,
      ...(medicationTaken && doseTime ? { doseTime } : {}),
      glucoseMgDl: Number(glucoseMgDl),
      weightLbs: Number(weightLbs),
      exercisedToday: exercisedToday!,
      symptoms: symptoms.map((s) => ({
        name: s === "other" ? otherSymptom.trim() : s,
        severity: symptomSeverities[s],
      })),
      ...(notes ? { notes } : {}),
    };

    setLoading(true);
    try {
      const res = await fetch("/api/reminder/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Submission failed. Please try again.");
      setSubmitted(true);
    } catch (err: unknown) {
      setSubmitError(
        err instanceof Error ? err.message : "Something went wrong."
      );
    } finally {
      setLoading(false);
    }
  }

  if (submitted) {
    return (
      <div className="bg-white rounded shadow p-6 flex flex-col items-center gap-4 text-center">
        <div className="text-emerald-500 text-4xl">&#10003;</div>
        <h2 className="font-bold text-lg">Check-in submitted!</h2>
        <p className="text-sm text-stone-500">
          Thank you for logging today&apos;s data.
        </p>
        <a
          href="/dashboard"
          className="bg-[#1AA1E3] text-white py-2 px-4 rounded hover:bg-blue-600 transition-all"
        >
          Return to Dashboard
        </a>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded shadow p-6 flex flex-col gap-6">
      {/* Error banner */}
      {submitError && (
        <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg px-4 py-3">
          {submitError}
        </div>
      )}

      {/* Medication taken */}
      <fieldset className="flex flex-col gap-1.5">
        <Label>Medication taken today?</Label>
        <div className="flex gap-3">
          <YesNoButton
            active={medicationTaken === true}
            onClick={() => setMedicationTaken(true)}
          >
            Yes
          </YesNoButton>
          <YesNoButton
            active={medicationTaken === false}
            onClick={() => setMedicationTaken(false)}
          >
            No
          </YesNoButton>
        </div>
        <InlineError msg={errors.medicationTaken} />
      </fieldset>

      {/* Dose time */}
      {medicationTaken && (
        <div className="flex flex-col gap-1.5">
          <Label>Dose time (optional)</Label>
          <input
            type="time"
            value={doseTime}
            onChange={(e) => setDoseTime(e.target.value)}
            className={inputClass}
          />
        </div>
      )}

      {/* Glucose */}
      <div className="flex flex-col gap-1.5">
        <Label>Glucose (mg/dL)</Label>
        <input
          type="number"
          inputMode="numeric"
          value={glucoseMgDl}
          onChange={(e) => setGlucoseMgDl(e.target.value)}
          placeholder="e.g. 120"
          className={inputClass}
        />
        <InlineError msg={errors.glucoseMgDl} />
      </div>

      {/* Weight */}
      <div className="flex flex-col gap-1.5">
        <Label>Weight (lbs)</Label>
        <input
          type="number"
          inputMode="numeric"
          value={weightLbs}
          onChange={(e) => setWeightLbs(e.target.value)}
          placeholder="e.g. 160"
          className={inputClass}
        />
        <InlineError msg={errors.weightLbs} />
      </div>

      {/* Exercised */}
      <fieldset className="flex flex-col gap-1.5">
        <Label>Exercised today?</Label>
        <div className="flex gap-3">
          <YesNoButton
            active={exercisedToday === true}
            onClick={() => setExercisedToday(true)}
          >
            Yes
          </YesNoButton>
          <YesNoButton
            active={exercisedToday === false}
            onClick={() => setExercisedToday(false)}
          >
            No
          </YesNoButton>
        </div>
        <InlineError msg={errors.exercisedToday} />
      </fieldset>

      {/* Symptoms */}
      <fieldset className="flex flex-col gap-2">
        <Label>Symptoms (select all that apply)</Label>
        <div className="flex flex-wrap gap-2">
          {SYMPTOM_OPTIONS.map((s) => (
            <label
              key={s}
              className={`flex items-center gap-2 text-sm px-3 py-1.5 rounded cursor-pointer select-none transition-all ${
                symptoms.includes(s)
                  ? "bg-[#1AA1E3] text-white hover:bg-blue-600"
                  : "bg-gray-200 text-stone-600 hover:bg-gray-300"
              }`}
            >
              <input
                type="checkbox"
                checked={symptoms.includes(s)}
                onChange={() => toggleSymptom(s)}
                className="sr-only"
              />
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </label>
          ))}
        </div>
        {symptoms.includes("other") && (
          <div className="flex flex-col gap-1.5 mt-1">
            <input
              type="text"
              value={otherSymptom}
              onChange={(e) => setOtherSymptom(e.target.value)}
              placeholder="Describe your symptom..."
              className={inputClass}
            />
            <InlineError msg={errors.otherSymptom} />
          </div>
        )}
      </fieldset>

      {/* Per-symptom severity */}
      {symptoms.length > 0 && (
        <fieldset className="flex flex-col gap-3">
          <Label>Symptom severity (1–5)</Label>
          {symptoms.map((s) => (
            <div key={s} className="flex items-center gap-3">
              <span className="text-sm text-stone-600 w-28 capitalize truncate">
                {s === "other" ? (otherSymptom.trim() || "Other") : s}
              </span>
              <div className="flex gap-1.5">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setSeverity(s, n)}
                    className={`w-8 h-8 rounded text-xs font-medium transition-all ${
                      symptomSeverities[s] === n
                        ? "bg-[#1AA1E3] text-white hover:bg-blue-600"
                        : "bg-gray-200 text-stone-600 hover:bg-gray-300"
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>
          ))}
          <InlineError msg={errors.symptomSeverity} />
        </fieldset>
      )}

      {/* Notes */}
      <div className="flex flex-col gap-1.5">
        <Label>Notes (optional)</Label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          maxLength={500}
          rows={3}
          placeholder="Anything else to note..."
          className={`${inputClass} resize-none`}
        />
        <div className="flex justify-between">
          <InlineError msg={errors.notes} />
          <span className="text-xs text-stone-400 ml-auto">
            {notes.length}/500
          </span>
        </div>
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={loading}
        className="w-full bg-[#1AA1E3] text-white py-2 px-4 rounded hover:bg-blue-600 transition-all disabled:opacity-50 disabled:pointer-events-none"
      >
        {loading ? "Submitting..." : "Submit Check-In"}
      </button>
    </form>
  );
}

const inputClass =
  "w-full bg-stone-50 border border-stone-200 rounded-lg px-4 py-2.5 text-sm text-stone-800 placeholder:text-stone-300 focus:outline-none focus:border-[#1AA1E3] focus:ring-2 focus:ring-blue-100 transition-all";

function Label({ children }: { children: React.ReactNode }) {
  return (
    <span className="text-xs font-medium tracking-widest uppercase text-stone-400">
      {children}
    </span>
  );
}

function InlineError({ msg }: { msg?: string }) {
  if (!msg) return null;
  return <p className="text-xs text-red-500">{msg}</p>;
}

function YesNoButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-5 py-2 text-sm rounded transition-all ${
        active
          ? "bg-[#1AA1E3] text-white hover:bg-blue-600"
          : "bg-gray-200 text-stone-600 hover:bg-gray-300"
      }`}
    >
      {children}
    </button>
  );
}
