"use client";

import { useState } from "react";

type CommunicationModalProps = {
  onClose: () => void;
};

export default function CommunicationModal({ onClose }: CommunicationModalProps) {
  const [selectedProvider, setSelectedProvider] = useState("");
  const [message, setMessage] = useState("");
  const [includeStats, setIncludeStats] = useState(false); // com request

  //sample data change later
  const providers = [
    { id: "1", name: "Dr. John Doe", email: "fake-doctor@example.com" },
    { id: "2", name: "Dr. Jane Smith", email: "fake-doctor2@example.com" },
  ];

  // const handleSend = () => {
  //   if (!selectedProvider || !message) {
  //     alert("Please select a provider and type a message.");
  //     return;
  //   }
  //   //change later
  //   console.log(`Sending message to ${selectedProvider}: ${message}`);
  //   onClose();
  // };

  const handleSend = async () => {
      if (!selectedProvider || !message) {
        alert("Please select a provider and type a message.");
        return;
      }

      const res = await fetch("/api/communication/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          providerEmail: selectedProvider,
          message,
          includeStats,
        }),
      });

      if (!res.ok) {
        alert("Failed to send message");
        return;
      }

      onClose();
    };

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center bg-white bg-opacity-20">
      {/* box */}
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-5xl p-10 mx-4">
        <h2 className="text-2xl font-semibold mb-4">Send Message to Provider</h2>

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

        {/* text box */}
        <label className="block mb-4">
          <span className="text-gray-700">Message</span>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type your message here..."
            className="mt-1 block w-full h-32 rounded-md border-gray-300 shadow-sm focus:ring-green-500 focus:border-green-500 resize-none p-2"
          />
        </label>

        {/* meds button */}
        <button
          type="button"
          className={`mb-4 font-medium ${
            includeStats ? "text-green-800" : "text-green-600"
          }`}
          onClick={() => setIncludeStats((prev) => !prev)}
        >
          {includeStats ? "✓ Medication Stats Included" : "+ Include Medication Stats"}
        </button>

        {/* action buttons */}
        <div className="flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-100"
          >
            Cancel
          </button>
          <button
            onClick={handleSend}
            className="px-4 py-2 rounded-lg bg-green-500 text-white hover:bg-green-600"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}