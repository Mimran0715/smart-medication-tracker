"use client";
import { Line } from "react-chartjs-2";
import { useState, useEffect, useRef } from "react";
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
import medicationData from "@/data/fhir_medication_example.json";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const SCHEDULE_KEY = "med-schedules";
const ACTIVE_MEDS_KEY = "active-medications";

interface MedSchedule {
  [medName: string]: string[];
}

interface MedicationInfo {
  name: string;
  dosage: string;
}

function buildMedicationNames(entries: any[]): MedicationInfo[] {
  const medicationMap: Record<string, any> = {};
  const statements: any[] = [];

  entries.forEach((entry: any) => {
    const res = entry.resource;
    if (res.resourceType === "Medication") {
      medicationMap[res.id] = res;
    }
    if (res.resourceType === "MedicationStatement") {
      statements.push(res);
    }
  });

  return statements.map((stmt) => {
    const ref = stmt?.medicationReference?.reference;
    const medId = ref?.split("/")[1];
    const medication = medicationMap[medId];
    const name =
      medication?.code?.text ||
      stmt?.medicationCodeableConcept?.text ||
      "Unknown Medication";
    const dosage = stmt?.dosage?.map((d: any) => d.text).join("; ") || "No dosage";
    return { name, dosage };
  });
}

// Medications from FHIR data (provider-managed)
const allMedications = buildMedicationNames(medicationData.entry);

const DEFAULT_ACTIVE_MEDS: MedicationInfo[] = [
  { name: "Metformin 500mg", dosage: "Take 1 tablet twice daily" },
  { name: "Insulin Glargine 10 units", dosage: "Inject 10 units subcutaneously once daily" },
];

const DEFAULT_SCHEDULES: MedSchedule = {
  Metformin: ["06:00"],
  Insulin: ["07:00"],
};

function loadActiveMeds(): MedicationInfo[] {
  if (typeof window === "undefined") return DEFAULT_ACTIVE_MEDS;
  try {
    const saved = localStorage.getItem(ACTIVE_MEDS_KEY);
    if (saved) return JSON.parse(saved);
  } catch {}
  return DEFAULT_ACTIVE_MEDS;
}

function saveActiveMeds(meds: MedicationInfo[]) {
  localStorage.setItem(ACTIVE_MEDS_KEY, JSON.stringify(meds));
}

function loadSchedules(): MedSchedule {
  if (typeof window === "undefined") return DEFAULT_SCHEDULES;
  try {
    const saved = localStorage.getItem(SCHEDULE_KEY);
    if (saved) return JSON.parse(saved);
  } catch {}
  return DEFAULT_SCHEDULES;
}

function saveSchedules(schedules: MedSchedule) {
  localStorage.setItem(SCHEDULE_KEY, JSON.stringify(schedules));
}

function formatTime(t: string): string {
  const [h, m] = t.split(":");
  const hour = parseInt(h);
  const ampm = hour >= 12 ? "PM" : "AM";
  const h12 = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  return `${h12}:${m} ${ampm}`;
}

function getScheduleKey(medName: string): string {
  return medName.split(" ")[0];
}

export default function Dashboard() {
  const [activeMeds, setActiveMeds] = useState<MedicationInfo[]>(DEFAULT_ACTIVE_MEDS);
  const [schedules, setSchedules] = useState<MedSchedule>(DEFAULT_SCHEDULES);
  const [editingMed, setEditingMed] = useState<string | null>(null);
  const [editingActiveMed, setEditingActiveMed] = useState<MedicationInfo | null>(null);
  const [editDosageValue, setEditDosageValue] = useState("");
  const [showSchedulePicker, setShowSchedulePicker] = useState(false);
  const [reminderStatus, setReminderStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [isModalOpen, setIsModalOpen] = useState(false); // com request
  const [reminderResult, setReminderResult] = useState("");
  const schedulePickerRef = useRef<HTMLDivElement>(null);

 const [dashboardData, setDashboardData] = useState<{
  adherence: { adherence: number }[];
  glucose: { reading: number }[];
  sideEffects: { date: string; occurrences: number }[];
} | null>(null);

  useEffect(() => {
    const loadedMeds = loadActiveMeds();
    setActiveMeds(loadedMeds);

    const loadedSchedules = loadSchedules();
    // Sync schedules with active meds
    let changed = false;
    const activeKeys = loadedMeds.map((m) => getScheduleKey(m.name));
    for (const key of activeKeys) {
      if (!loadedSchedules[key] || loadedSchedules[key].length === 0) {
        loadedSchedules[key] = DEFAULT_SCHEDULES[key] || ["08:00"];
        changed = true;
      }
    }
    // Remove orphaned schedules
    for (const key of Object.keys(loadedSchedules)) {
      if (!activeKeys.includes(key)) {
        delete loadedSchedules[key];
        changed = true;
      }
    }
    if (changed) saveSchedules(loadedSchedules);
    setSchedules(loadedSchedules);
  }, []);

  useEffect(() => {
    async function fetchData() {
      const res = await fetch('/api/dashboard');
      const data = await res.json();
      setDashboardData(data);
    }
    fetchData();
  }, []);

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (schedulePickerRef.current && !schedulePickerRef.current.contains(e.target as Node)) {
        setShowSchedulePicker(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!dashboardData) return <div>Loading...</div>;

  const adherenceValue = dashboardData.adherence?.[0]?.adherence ?? 0;
  const glucose = dashboardData.glucose.map((g) => g.reading);
  const sideEffects = dashboardData.sideEffects;

  // --- Medications component handlers ---

  function handleRemoveActiveMed(med: MedicationInfo) {
    const updated = activeMeds.filter((m) => m.name !== med.name);
    setActiveMeds(updated);
    saveActiveMeds(updated);
    // Remove schedule entry
    const key = getScheduleKey(med.name);
    const updatedSchedules = { ...schedules };
    delete updatedSchedules[key];
    setSchedules(updatedSchedules);
    saveSchedules(updatedSchedules);
  }

  function handleStartEditActiveMed(med: MedicationInfo) {
    setEditingActiveMed(med);
    setEditDosageValue(med.dosage);
  }

  function handleSaveEditActiveMed() {
    if (!editingActiveMed) return;
    const updated = activeMeds.map((m) =>
      m.name === editingActiveMed.name ? { ...m, dosage: editDosageValue } : m
    );
    setActiveMeds(updated);
    saveActiveMeds(updated);
    setEditingActiveMed(null);
    setEditDosageValue("");
  }

  // --- Schedule handlers ---

  function handleSaveSchedule(medName: string, times: string[]) {
    const updated = { ...schedules, [medName]: times };
    setSchedules(updated);
    saveSchedules(updated);
    setEditingMed(null);
  }

  function handleAddSchedule(medName: string) {
    const key = getScheduleKey(medName);
    // Ensure the medication has a schedule entry, then open the time editor
    if (!schedules[key]) {
      const updated = { ...schedules, [key]: ["08:00"] };
      setSchedules(updated);
      saveSchedules(updated);
    }
    setShowSchedulePicker(false);
    setEditingMed(key);
  }

  async function handleSendReminders() {
    setReminderStatus("loading");
    setReminderResult("");

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
  labels: sideEffects.map((s) => s.date),
  datasets: [
    {
      label: "Occurrences",
      data: sideEffects.map((s) => s.occurrences),
      borderColor: "#FF4D4F",
      backgroundColor: "rgba(255, 77, 79, 0.2)",
    },
  ],
  };

  function logGlucose(glucose: number): void {
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
          <div className="text-4xl font-bold text-[#1AA1E3]">{adherenceValue}%</div>
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
        {/* Medication Schedule */}
        <div className="bg-white rounded shadow p-4">
          <div className="flex justify-between items-center mb-2">
            <h3 className="font-bold">Medication Schedule</h3>
            <div className="relative" ref={schedulePickerRef}>
              <button
                className="text-sm px-3 py-1 rounded bg-green-500 text-white hover:bg-green-600"
                onClick={() => setShowSchedulePicker(!showSchedulePicker)}
              >
                + Add
              </button>
              {showSchedulePicker && (
                <div className="absolute right-0 top-full mt-1 bg-white border rounded shadow-lg z-10 w-64">
                  {activeMeds.map((med) => (
                    <button
                      key={med.name}
                      className="block w-full text-left px-4 py-2 hover:bg-gray-100 text-sm"
                      onClick={() => handleAddSchedule(med.name)}
                    >
                      {med.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
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
                <button
                  className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600"
                  onClick={() => setEditingMed(medName)}
                >
                  Edit
                </button>
              </li>
            ))}
          </ul>
        </div>

        {/* Medications */}
        <div className="bg-white rounded shadow p-4">
          <h3 className="font-bold mb-2">Medications</h3>
          <ul className="divide-y divide-gray-200">
            {activeMeds.map((med, index) => (
              <li key={index} className="flex justify-between items-center px-4 py-2">
                <span>
                  {med.name}{" "}
                  <span className="text-gray-500 text-sm">{med.dosage}</span>
                </span>
                <div className="flex gap-2">
                  <button
                    className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600"
                    onClick={() => handleStartEditActiveMed(med)}
                  >
                    Edit
                  </button>
                  <button
                    className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
                    onClick={() => handleRemoveActiveMed(med)}
                  >
                    Remove
                  </button>
                </div>
              </li>
            ))}
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

      {/* Schedule Edit Modal */}
      {editingMed && (
        <MedicationModal
          medicationName={editingMed}
          times={schedules[editingMed] || []}
          onSave={(times) => handleSaveSchedule(editingMed, times)}
          onClose={() => setEditingMed(null)}
        />
      )}

      {/* Medication Edit Modal */}
      {editingActiveMed && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Edit Medication</h2>
              <button
                onClick={() => setEditingActiveMed(null)}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                &times;
              </button>
            </div>
            <p className="text-gray-600 mb-4">
              <span className="font-medium">{editingActiveMed.name}</span>
            </p>
            <div className="mb-4">
              <label className="text-sm font-medium text-gray-700 block mb-1">
                Dosage
              </label>
              <input
                type="text"
                value={editDosageValue}
                onChange={(e) => setEditDosageValue(e.target.value)}
                className="border rounded px-3 py-2 w-full"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleSaveEditActiveMed}
                className="bg-[#1AA1E3] text-white px-4 py-2 rounded hover:bg-blue-600 flex-1"
              >
                Save
              </button>
              <button
                onClick={() => setEditingActiveMed(null)}
                className="border border-gray-300 px-4 py-2 rounded hover:bg-gray-50 flex-1"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
