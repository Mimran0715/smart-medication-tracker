"use client";

import { useState, useEffect } from "react";

export default function ReminderPopup() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // show after 1 second (simulate real reminder)
    const timer = setTimeout(() => setVisible(true), 1000);
    return () => clearTimeout(timer);
  }, []);

  if (!visible) return null;

  return (
    <div className="fixed bottom-6 right-6 bg-white shadow-xl rounded-xl p-4 w-80 border z-50">
      <h3 className="font-semibold mb-2">Medication Reminder</h3>
      <p className="text-sm text-gray-600 mb-4">
        Did you take <span className="font-medium">Metformin</span> today?
      </p>

      <div className="flex justify-end gap-2">
        <button
          className="px-3 py-1 text-sm rounded border"
          onClick={() => setVisible(false)}
        >
          Dismiss
        </button>
        <button
          className="px-3 py-1 text-sm rounded bg-green-500 text-white"
          onClick={() => {
            alert("Marked as taken");
            setVisible(false);
          }}
        >
          Yes
        </button>
      </div>
    </div>
  );
}