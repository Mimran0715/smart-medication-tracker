"use client";

import { useEffect, useState } from "react";

type Notification = {
  id: string;
  title: string;
  body: string;
  created_at: string;
  is_read: boolean;
};

export default function ReminderPopup() {
  const [notification, setNotification] = useState<Notification | null>(null);

  useEffect(() => {
    async function fetchNotifications() {
      try {
        const res = await fetch("/api/notifications");
        const data = await res.json();

        // pick first unread notification
        const unread = data.find((n: Notification) => !n.is_read);

        if (unread) {
          setNotification(unread);
        }
      } catch (err) {
        console.error("Failed to fetch notifications", err);
      }
    }

    fetchNotifications();
  }, []);

  if (!notification) return null;

  return (
    <div className="fixed bottom-6 right-6 bg-white shadow-xl rounded-xl p-4 w-80 border z-50">
      <h3 className="font-semibold mb-2">{notification.title}</h3>

      <p className="text-sm text-gray-600 mb-4">
        {notification.body}
      </p>

      <div className="flex justify-end gap-2">
        <button
          className="px-3 py-1 text-sm rounded border"
          onClick={() => setNotification(null)}
        >
          Dismiss
        </button>

        <button
          className="px-3 py-1 text-sm rounded bg-green-500 text-white"
          onClick={async () => {
            await fetch(`/api/notifications/${notification.id}/read`, {
              method: "POST",
            });

            setNotification(null);
          }}
        >
          Mark as read
        </button>
      </div>
    </div>
  );
}