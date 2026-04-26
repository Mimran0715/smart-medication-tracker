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
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    async function fetchNotifications() {
      try {
        const res = await fetch("/api/notifications");
        const data = await res.json();

        const unread = data.find((n: Notification) => !n.is_read);

        if (unread) {
          setNotification(unread);

          // allow mount → then animate in
          setTimeout(() => setVisible(true), 50);
        }
      } catch (err) {
        console.error("Failed to fetch notifications", err);
      }
    }

    fetchNotifications();
  }, []);

  async function handleClose() {
    // trigger slide-out
    setVisible(false);

    // wait for animation then unmount
    setTimeout(() => {
      setNotification(null);
    }, 300);
  }

  if (!notification) return null;

  return (
    <div
      className={`
        fixed bottom-6 right-6 w-80 z-50
        transition-all duration-300 ease-in-out
        ${visible ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"}
      `}
    >
      <div className="bg-white shadow-xl rounded-xl p-4 border">
        <h3 className="font-semibold mb-2">{notification.title}</h3>

        <p className="text-sm text-gray-600 mb-4">
          {notification.body}
        </p>

        <div className="flex justify-end gap-2">
          <button
            className="px-3 py-1 text-sm rounded border"
            onClick={handleClose}
          >
            Dismiss
          </button>

          <button
            className="px-3 py-1 text-sm rounded bg-green-500 text-white"
            onClick={async () => {
              await fetch(`/api/notifications/${notification.id}/read`, {
                method: "POST",
              });

              handleClose();
            }}
          >
            Mark as read
          </button>
        </div>
      </div>
    </div>
  );
}