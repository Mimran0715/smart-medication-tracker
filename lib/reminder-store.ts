export interface ReminderInstance {
  medicationName: string;
  time: string;
  date: string;
  status: "pending" | "sent" | "failed" | "completed";
  sentAt?: string;
  completedAt?: string;
  error?: string;
}

// In-memory store — resets on server restart, fine for testing
const store = new Map<string, ReminderInstance>();

function makeKey(medicationName: string, time: string, date: string): string {
  return `${medicationName}-${time}-${date}`;
}

export function wasSentToday(
  medicationName: string,
  time: string,
  date: string
): boolean {
  const instance = store.get(makeKey(medicationName, time, date));
  return instance?.status === "sent" || instance?.status === "completed";
}

export function markSent(
  medicationName: string,
  time: string,
  date: string
): void {
  store.set(makeKey(medicationName, time, date), {
    medicationName,
    time,
    date,
    status: "sent",
    sentAt: new Date().toISOString(),
  });
}

export function markFailed(
  medicationName: string,
  time: string,
  date: string,
  error: string
): void {
  store.set(makeKey(medicationName, time, date), {
    medicationName,
    time,
    date,
    status: "failed",
    error,
  });
}

export function markCompleted(
  medicationName: string,
  time: string,
  date: string
): void {
  const key = makeKey(medicationName, time, date);
  const existing = store.get(key);
  store.set(key, {
    medicationName,
    time,
    date,
    status: "completed",
    sentAt: existing?.sentAt,
    completedAt: new Date().toISOString(),
  });
}

export function getAllReminders(): ReminderInstance[] {
  return Array.from(store.values());
}
