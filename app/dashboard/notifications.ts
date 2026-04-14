import type { MedicationReminder } from "@/types/medication";

export const mockNotifications: MedicationReminder[] = [
  {
    id: "1",
    medicationName: "Metformin",
    message: "Did you take Metformin today?",
    time: "8:00 AM",
    isCompleted: false,
  },
  {
    id: "2",
    medicationName: "Ibuprofen",
    message: "Did you take Ibuprofen after food?",
    time: "12:00 PM",
    isCompleted: true,
  },
];