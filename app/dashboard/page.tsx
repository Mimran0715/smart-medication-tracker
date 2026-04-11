"use client";
import { Line } from "react-chartjs-2";
import { useState, useEffect } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import CommunicationModal from "./communicationModal";
import MedicationModal from "./medicationModal";
import ReminderPopup from "../../components/reminderPopup"

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const STORAGE_KEY = "med-schedules";

interface MedSchedule {
  [medName: string]: string[];
}

async function getDashboard(){
    const res = await fetch('/api/dashboard');
    const { adherence, glucose, sideEffects } = await res.json();
    return {adherence, glucose, sideEffects};
}

const DEFAULT_SCHEDULES: MedSchedule = {
  Metformin: ["06:00"],
  Insulin: ["07:00"],
};

function loadSchedules(): MedSchedule {
  if (typeof window === "undefined") return DEFAULT_SCHEDULES;
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return JSON.parse(saved);
  } catch {}
  return DEFAULT_SCHEDULES;
}

function saveSchedules(schedules: MedSchedule) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(schedules));
}

function formatTime(t: string): string {
  const [h, m] = t.split(":");
  const hour = parseInt(h);
  const ampm = hour >= 12 ? "PM" : "AM";
  const h12 = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  return `${h12}:${m} ${ampm}`;
}

export default function Dashboard() {
  const [schedules, setSchedules] = useState<MedSchedule>(DEFAULT_SCHEDULES);
  const [editingMed, setEditingMed] = useState<string | null>(null);
  const [reminderStatus, setReminderStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [isModalOpen, setIsModalOpen] = useState(false); // com request
  const [reminderResult, setReminderResult] = useState("");

  useEffect(() => {
    setSchedules(loadSchedules());
  }, []);
  const [dashboardData, setDashboardData] = useState<{
    adherence: number[];
    glucose: number[];
    sideEffectData: number[];
  } | null>(null);

  useEffect(() => {
    async function fetchData() {
      const res = await fetch('/api/dashboard');
      const data = await res.json();
      setDashboardData(data);
    }
    fetchData();
  }, []);

  if (!dashboardData) return <div>Loading...</div>;

  const { adherence, glucose, sideEffectData } = dashboardData;
  // const adherence = 88;
  // const glucose = [120, 130, 115, 140, 125, 135, 128];
  const sideEffectBackup = [150, 155, 152, 160, 159, 157];

  function handleSaveSchedule(medName: string, times: string[]) {
    const updated = { ...schedules, [medName]: times };
    setSchedules(updated);
    saveSchedules(updated);
    setEditingMed(null);
  }

  function handleRemoveMed(medName: string) {
    const updated = { ...schedules };
    delete updated[medName];
    setSchedules(updated);
    saveSchedules(updated);
  }

  async function handleSendReminders() {
    setReminderStatus("loading");
    setReminderResult("");

    // Sync schedules to server first
    const email = prompt("Enter email address for reminders:");
    if (!email) {
      setReminderStatus("idle");
      return;
    }

    try {
      const cronSecret = "dev-cron-secret";

      const res = await fetch("/api/cron/send-reminders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-cron-secret": cronSecret,
        },
        body: JSON.stringify({ email, schedules }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to send");

      setReminderStatus("success");
      setReminderResult(
        `Sent: ${data.sent}, Skipped: ${data.skipped}, Failed: ${data.failed}`
      );
    } catch (err: unknown) {
      setReminderStatus("error");
      setReminderResult(
        err instanceof Error ? err.message : "Failed to send reminders"
      );
    }
  }

  const glucoseChartData = {
    labels: glucose.map((_, i) => `Day ${i + 1}`),
    datasets: [
      {
        label: "Glucose Level",
        data: glucose,
        borderColor: "#1AA1E3",
        backgroundColor: "rgba(26, 161, 227, 0.2)",
      },
    ],
  };

  const sideEffectChartData = {
    labels: sideEffectBackup.map((_, i) => `Week ${i + 1}`),
    datasets: [
      {
        label: "Weight",
        data: sideEffectBackup,
        borderColor: "#1AA1E3",
        backgroundColor: "rgba(26, 161, 227, 0.2)",
      },
    ],
  };

  function logGlucose(glucose: int): void {
    return; 
  }

  return (
    <div className="p-6 space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded shadow p-4">
          <h2 className="font-bold mb-2">Glucose Levels</h2>
          <Line data={glucoseChartData} />
        </div>

        <div className="bg-white rounded shadow p-4 flex flex-col items-center justify-center">
          <h2 className="font-bold mb-2">Adherence</h2>
          <div className="text-4xl font-bold text-[#1AA1E3]">{adherence}%</div>
        </div>

        <ReminderPopup />
        <div className="bg-white rounded shadow p-4 flex flex-col justify-center gap-4">
          <h2 className="font-bold mb-2">Quick Actions</h2>
          <button className="bg-[#1AA1E3] text-white py-2 px-4 rounded hover:bg-blue-600">
            Log Glucose
          </button>
          <button className="bg-[#1AA1E3] text-white py-2 px-4 rounded hover:bg-blue-600">
            Log Medication
          </button>
        </div>
      </div>


      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Medication Schedule - dynamic from localStorage */}
        <div className="bg-white rounded shadow p-4">
          <h3 className="font-bold mb-2">Medication Schedule</h3>
          <ul className="divide-y divide-gray-200">
            {Object.entries(schedules).map(([medName, times]) => (
              <li
                key={medName}
                className="flex justify-between items-center px-4 py-2"
              >
                <span>
                  {medName}{" "}
                  <span className="text-gray-500 text-sm">
                    {times.map(formatTime).join(", ")}
                  </span>
                </span>
                <div className="flex gap-2">
                  <button
                    className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600"
                    onClick={() => setEditingMed(medName)}
                  >
                    Edit
                  </button>
                  <button
                    className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
                    onClick={() => handleRemoveMed(medName)}
                  >
                    Remove
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="bg-white rounded shadow p-4">
          <h3 className="font-bold mb-2">Medications</h3>
          <ul className="divide-y divide-gray-200">
            <li className="flex justify-between items-center px-4 py-2">
              <span>Metformin 500mg</span>
              <div className="flex gap-2">
                <button
                  className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600"
                  onClick={() => alert("Edit Med")}
                >
                  Edit
                </button>
                <button
                  className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
                  onClick={() => alert("Remove Med")}
                >
                  Remove
                </button>
              </div>
            </li>
            <li className="flex justify-between items-center px-4 py-2">
              <span>Insulin 20 units</span>
              <div className="flex gap-2">
                <button
                  className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600"
                  onClick={() => alert("Edit Med")}
                >
                  Edit
                </button>
                <button
                  className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
                  onClick={() => alert("Remove Med")}
                >
                  Remove
                </button>
              </div>
            </li>
          </ul>
        </div>

        <div className="bg-white rounded shadow p-4">
          <h3 className="font-bold mb-2">Side Effects</h3>
          <div className="flex gap-6">
            <ul className="list-disc list-inside">
              <li>Nausea after Metformin</li>
            </ul>
            <div className="flex-1">
              <Line data={sideEffectChartData} />
            </div>
          </div>
        </div>
      </div>

      {/* Send Reminders + Communication */}
      
      <div className="flex gap-4 items-center">
        <button
          className="bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600"
          onClick={() => setIsModalOpen(true)}
        >
          Send Message to Provider
        </button>

        {isModalOpen && <CommunicationModal 
          onClose={() => setIsModalOpen(false)} 
          />
        }

        <button
          className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 disabled:opacity-50"
          onClick={handleSendReminders}
          disabled={reminderStatus === "loading"}
        >
          {reminderStatus === "loading"
            ? "Sending..."
            : "Send Reminders Now"}
        </button>

        {reminderStatus === "success" && (
          <span className="text-green-600 text-sm">{reminderResult}</span>
        )}
        {reminderStatus === "error" && (
          <span className="text-red-500 text-sm">{reminderResult}</span>
        )}
      </div>

      {/* Edit Modal */}
      {editingMed && (
        <MedicationModal
          medicationName={editingMed}
          times={schedules[editingMed] || []}
          onSave={(times) => handleSaveSchedule(editingMed, times)}
          onClose={() => setEditingMed(null)}
        />
      )}
    </div>
  );
}
