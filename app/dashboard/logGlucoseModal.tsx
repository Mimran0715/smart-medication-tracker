"use client";

import { useState } from "react";

type LogGlucoseModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

export default function LogGlucoseModal({
  isOpen,
  onClose,
}: LogGlucoseModalProps) {
  const [glucose, setGlucose] = useState("");
  const [datetime, setDatetime] = useState("");
  const [mealContext, setMealContext] = useState("fasting");
  const [notes, setNotes] = useState("");

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!glucose || !datetime || !mealContext) {
      alert("Please fill out all required fields.");
      return;
    }

    try {
      await fetch("/api/quick-actions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        type: "log_glucose",
        patientId: "demo-patient-id", 
        glucose: Number(glucose),
        recordedAt: datetime,
        mealContext,
        notes,
      }),
    });

      // reset + close
      setGlucose("");
      setDatetime("");
      setMealContext("fasting");
      setNotes("");
      onClose();
    } catch (err) {
      console.error("Failed to save glucose:", err);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40"
      onClick={onClose}
    >
      {/* modal box */}
      <div
        className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-xl font-semibold mb-4">Log Glucose</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* glucose input */}
          <label className="block">
            <span className="text-gray-700">Glucose (mg/dL)</span>
            <input
              type="number"
              value={glucose}
              onChange={(e) => setGlucose(e.target.value)}
              placeholder="e.g. 110"
              className="mt-1 w-full border rounded-md p-2"
              required
            />
          </label>

          {/* datetime input */}
          <label className="block">
            <span className="text-gray-700">Date & Time</span>
            <input
              type="datetime-local"
              value={datetime}
              onChange={(e) => setDatetime(e.target.value)}
              className="mt-1 w-full border rounded-md p-2"
              required
            />
          </label>

          {/* meal context dropdown */}
          <label className="block">
            <span className="text-gray-700">Meal Context</span>
            <select
              value={mealContext}
              onChange={(e) => setMealContext(e.target.value)}
              className="mt-1 w-full border rounded-md p-2"
              required
            >
              <option value="fasting">Fasting</option>
              <option value="pre_meal">Pre-meal</option>
              <option value="post_meal">Post-meal</option>
              <option value="bedtime">Bedtime</option>
              <option value="other">Other</option>
            </select>
          </label>

          {/* notes textarea */}
          <label className="block">
            <span className="text-gray-700">Notes (optional)</span>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any notes..."
              className="mt-1 w-full border rounded-md p-2"
              rows={3}
            />
          </label>

          {/* actions */}
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-100"
            >
              Cancel
            </button>

            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-[#1AA1E3] text-white hover:bg-blue-600"
            >
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}