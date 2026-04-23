"use client";

import { useState } from "react";

type LogMedicationModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

const MEDICATIONS = {
  metformin: { label: "Metformin", dose: 500, unit: "mg" },
  insulin: { label: "Insulin", dose: 10, unit: "units" },
  lisinopril: { label: "Lisinopril", dose: 20, unit: "mg" },
};

export default function LogMedicationModal({
  isOpen,
  onClose,
}: LogMedicationModalProps) {
  const [selectedMed, setSelectedMed] = useState("");
  const [datetime, setDatetime] = useState("");

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedMed || !datetime) {
      alert("Please select a medication and time.");
      return;
    }

    const medData =
      MEDICATIONS[selectedMed as keyof typeof MEDICATIONS];

    await fetch("/api/medication", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        medication: selectedMed,
        dose: medData.dose,
        unit: medData.unit,
        recordedAt: datetime,
      }),
    });

    setSelectedMed("");
    setDatetime("");
    onClose();
  };

  const selectedData =
    selectedMed ? MEDICATIONS[selectedMed as keyof typeof MEDICATIONS] : null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-xl font-semibold mb-4">
          Log Medication
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">

          {/* medication dropdown */}
          <label className="block">
            <span className="text-gray-700">Medication</span>
            <select
              value={selectedMed}
              onChange={(e) => setSelectedMed(e.target.value)}
              className="mt-1 w-full border rounded-md p-2"
              required
            >
              <option value="">Select medication</option>
              {Object.entries(MEDICATIONS).map(([key, med]) => (
                <option key={key} value={key}>
                  {med.label}
                </option>
              ))}
            </select>
          </label>

          {/* auto-preview dose */}
          {selectedData && (
            <div className="text-sm text-gray-600 bg-gray-50 p-2 rounded">
              Dose: <strong>{selectedData.dose}</strong>{" "}
              {selectedData.unit}
            </div>
          )}

          {/* datetime */}
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

          {/* actions */}
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border rounded-lg hover:bg-gray-100"
            >
              Cancel
            </button>

            <button
              type="submit"
              className="px-4 py-2 bg-[#1AA1E3] text-white rounded-lg hover:bg-blue-600"
            >
              Save
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}