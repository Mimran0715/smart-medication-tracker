"use client";

import { useState } from "react";

interface MedicationModalProps {
  medicationName: string;
  times: string[];
  onSave: (times: string[]) => void;
  onClose: () => void;
}

export default function MedicationModal({
  medicationName,
  times: initialTimes,
  onSave,
  onClose,
}: MedicationModalProps) {
  const [times, setTimes] = useState<string[]>(
    initialTimes.length > 0 ? [...initialTimes] : ["08:00"]
  );
  const [error, setError] = useState("");

  // Test email state
  const [testEmail, setTestEmail] = useState("");
  const [emailStatus, setEmailStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [emailError, setEmailError] = useState("");

  function addTime() {
    setTimes([...times, "08:00"]);
    setError("");
  }

  function removeTime(index: number) {
    if (times.length <= 1) {
      setError("At least one time is required");
      return;
    }
    setTimes(times.filter((_, i) => i !== index));
    setError("");
  }

  function updateTime(index: number, value: string) {
    const updated = [...times];
    updated[index] = value;
    setTimes(updated);
    setError("");
  }

  function handleSave() {
    // Validate no duplicates
    const unique = new Set(times);
    if (unique.size !== times.length) {
      setError("Duplicate times are not allowed");
      return;
    }
    if (times.length === 0) {
      setError("At least one time is required");
      return;
    }
    onSave(times);
  }

  async function handleTestEmail() {
    if (!testEmail) {
      setEmailError("Please enter an email address");
      return;
    }
    if (times.length === 0) {
      setEmailError("Add at least one time first");
      return;
    }

    setEmailStatus("loading");
    setEmailError("");

    try {
      const res = await fetch("/api/email/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: testEmail,
          medicationName,
          time: formatTime(times[0]),
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to send");
      }

      setEmailStatus("success");
    } catch (err: unknown) {
      setEmailStatus("error");
      setEmailError(
        err instanceof Error ? err.message : "Failed to send test email"
      );
    }
  }

  function formatTime(t: string): string {
    const [h, m] = t.split(":");
    const hour = parseInt(h);
    const ampm = hour >= 12 ? "PM" : "AM";
    const h12 = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    return `${h12}:${m} ${ampm}`;
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Edit Schedule</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl"
          >
            &times;
          </button>
        </div>

        <p className="text-gray-600 mb-4">
          <span className="font-medium">{medicationName}</span>
        </p>

        {/* Time slots */}
        <div className="space-y-2 mb-4">
          <label className="text-sm font-medium text-gray-700">
            Scheduled Times
          </label>
          {times.map((time, index) => (
            <div key={index} className="flex items-center gap-2">
              <input
                type="time"
                value={time}
                onChange={(e) => updateTime(index, e.target.value)}
                className="border rounded px-3 py-2 flex-1"
              />
              <button
                onClick={() => removeTime(index)}
                className="text-red-500 hover:text-red-700 px-2 py-1"
              >
                Remove
              </button>
            </div>
          ))}
          <button
            onClick={addTime}
            className="text-[#1AA1E3] hover:text-blue-700 text-sm font-medium"
          >
            + Add Time
          </button>
        </div>

        {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

        <div className="flex gap-2 mb-6">
          <button
            onClick={handleSave}
            className="bg-[#1AA1E3] text-white px-4 py-2 rounded hover:bg-blue-600 flex-1"
          >
            Save Schedule
          </button>
          <button
            onClick={onClose}
            className="border border-gray-300 px-4 py-2 rounded hover:bg-gray-50 flex-1"
          >
            Cancel
          </button>
        </div>

        {/* Test Email Section */}
        <div className="border-t pt-4">
          <h3 className="font-medium text-sm text-gray-700 mb-2">
            Send Test Email
          </h3>
          <div className="flex gap-2">
            <input
              type="email"
              placeholder="your@email.com"
              value={testEmail}
              onChange={(e) => {
                setTestEmail(e.target.value);
                setEmailStatus("idle");
                setEmailError("");
              }}
              className="border rounded px-3 py-2 flex-1 text-sm"
            />
            <button
              onClick={handleTestEmail}
              disabled={emailStatus === "loading"}
              className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 text-sm disabled:opacity-50"
            >
              {emailStatus === "loading" ? "Sending..." : "Send Test"}
            </button>
          </div>
          {emailStatus === "success" && (
            <p className="text-green-600 text-sm mt-2">
              Test email sent successfully!
            </p>
          )}
          {emailError && (
            <p className="text-red-500 text-sm mt-2">{emailError}</p>
          )}
        </div>
      </div>
    </div>
  );
}
