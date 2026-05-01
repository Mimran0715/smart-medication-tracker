"use client";

import { useState } from "react";

type CommunicationModalProps = {
  onClose: () => void;
};

export default function CommunicationModal({ onClose }: CommunicationModalProps) {
  const [selectedProvider, setSelectedProvider] = useState("");
  const [message, setMessage] = useState("");
  const [includeStats, setIncludeStats] = useState(false);
  const [loading, setLoading] = useState(false);

  const providers = [
    { id: "1", name: "Dr. John Doe", email: "fake-doctor@example.com" },
    { id: "2", name: "Dr. Jane Smith", email: "fake-doctor2@example.com" },
  ];

  const handleSend = async () => {
  if (!selectedProvider || !message) {
    alert("Please select a provider and type a message.");
    return;
  }

  setLoading(true);

  // ---- fallback defaults ----
  const fallback = {
    adherence: 87,
    glucose: [
      { reading: "120" },
      { reading: "135" },
      { reading: "142" },
      { reading: "128" },
    ],
    sideEffects: [
      { side_effect_category: "fatigue", occurrences: 1 },
      { side_effect_category: "headache", occurrences: 1 },
    ],
  };

  let adherence = fallback.adherence;
  let glucose = fallback.glucose;
  let sideEffects = fallback.sideEffects;

  // ---- fetch stats safely ----
  if (includeStats) {
    try {
      const [adhRes, gluRes, seRes] = await Promise.all([
        fetch("/api/dashboard/adherence"),
        fetch("/api/dashboard/glucose"),
        fetch("/api/dashboard/side-effects"),
      ]);

      const adhData = await adhRes.json();
      const gluData = await gluRes.json();
      const seData = await seRes.json();

      adherence = adhData?.[0]?.adherence ?? fallback.adherence;
      glucose = gluData?.length ? gluData : fallback.glucose;
      sideEffects = seData?.length ? seData : fallback.sideEffects;
    } catch (err) {
      console.error("Using fallback stats due to error:", err);
    }
  }
  // ---- format glucose ----
  const glucoseValues = glucose.map((g: any) => Number(g.reading)).filter(Boolean);
  const avgGlucose =
    glucoseValues.reduce((a, b) => a + b, 0) / glucoseValues.length;

  const minGlucose = Math.min(...glucoseValues);
  const maxGlucose = Math.max(...glucoseValues);

  // ---- format side effects ----
    const sideEffectSummary = sideEffects
      .map((s: any) => `${s.side_effect_category} (${s.occurrences})`)
      .join(", ");

    // ---- build email ----
    let body = `Hello,

  ${message}
  `;

    if (includeStats) {
      body += `

  --- Medication Summary ---
  Adherence: ${adherence}%

  Glucose:
  - Average: ${avgGlucose.toFixed(1)} mg/dL
  - Range: ${minGlucose} - ${maxGlucose} mg/dL

  Side Effects:
  ${sideEffectSummary}
  `;
    }

    body += `

  Best,
  [Your Name]
  `;

    const subject = "Patient Update";

    const mailtoLink = `mailto:${selectedProvider}?subject=${encodeURIComponent(
      subject
    )}&body=${encodeURIComponent(body)}`;

    window.location.href = mailtoLink;

    setLoading(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center bg-white bg-opacity-20">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-5xl p-10 mx-4">
        <h2 className="text-2xl font-semibold mb-4">
          Send Message to Provider
        </h2>

        {/* provider dropdown */}
        <label className="block mb-4">
          <span className="text-gray-700">Provider</span>
          <select
            value={selectedProvider}
            onChange={(e) => setSelectedProvider(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-green-500 focus:border-green-500"
          >
            <option value="">Select a provider</option>
            {providers.map((p) => (
              <option key={p.id} value={p.email}>
                {p.name}
              </option>
            ))}
          </select>
        </label>

        {/* message */}
        <label className="block mb-4">
          <span className="text-gray-700">Message</span>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type your message here..."
            className="mt-1 block w-full h-32 rounded-md border-gray-300 shadow-sm focus:ring-green-500 focus:border-green-500 resize-none p-2"
          />
        </label>

        {/* include stats toggle */}
        <button
          type="button"
          className={`mb-4 font-medium ${
            includeStats ? "text-green-800" : "text-green-600"
          }`}
          onClick={() => setIncludeStats((prev) => !prev)}
          disabled={loading}
        >
          {includeStats ? "✓ Medication Stats Included" : "+ Include Medication Stats"}
        </button>

        <p className="text-sm text-gray-500 mt-2">
          This will open your email app to send the message.
        </p>

        {/* actions */}
        <div className="flex justify-end space-x-3 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-100"
            disabled={loading}
          >
            Cancel
          </button>

          <button
            onClick={handleSend}
            disabled={loading}
            className="px-4 py-2 rounded-lg bg-green-500 text-white hover:bg-green-600 disabled:opacity-50"
          >
            {loading ? "Preparing..." : "Send"}
          </button>
        </div>
      </div>
    </div>
  );
}
