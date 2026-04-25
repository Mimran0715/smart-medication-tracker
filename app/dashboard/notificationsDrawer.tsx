"use client";

import { useEffect, useState } from "react";
import NotificationCard from "./notificationsCard";

type Props = {
  isOpen: boolean;
  onClose: () => void;
};

type Notification = {
  id: string;
  title: string;
  body: string;
  is_read: boolean;
  created_at: string;
};

export default function DashboardDrawer({ isOpen, onClose }: Props) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    const fetchNotifications = async () => {
      try {
        setLoading(true);

        const res = await fetch("/api/notifications");
        const data = await res.json();

        setNotifications(data);
      } catch (err) {
        console.error("Failed to fetch notifications:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();
  }, [isOpen]);

  const handleMarkRead = async (n: Notification) => {
    try {
      const res = await fetch(`/api/notifications/${n.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          is_read: true,
        }),
      });

      if (!res.ok) throw new Error("Failed to update notification");

      setNotifications((prev) =>
        prev.map((notif) =>
          notif.id === n.id
            ? { ...notif, is_read: true }
            : notif
        )
      );
    } catch (err) {
      console.error("Failed to mark notification as read:", err);
    }
  };

  return (
    <>
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 bg-black/40 z-40"
        />
      )}

      <div
        className={`fixed top-0 right-0 h-full w-64 bg-[#1AA1E3] shadow-lg z-50 transform transition-transform ease-in-out duration-300
        ${isOpen ? "translate-x-0" : "translate-x-full"}`}
      >
        <div className="p-4 flex justify-between items-center border-b">
          <h2 className="text-lg font-semibold text-white">
            Notifications
          </h2>
          <button onClick={onClose}>✕</button>
        </div>

        <div className="p-4 space-y-3">
          {loading && (
            <p className="text-white text-sm">Loading...</p>
          )}

          {!loading && notifications.length === 0 && (
            <p className="text-white text-sm">
              No notifications yet
            </p>
          )}

          {notifications.map((n) => (
            <NotificationCard
              key={n.id}
              title={n.title}
              body={n.body}
              createdAt={n.created_at}
              isRead={n.is_read}
              onMarkRead={() => handleMarkRead(n)}
            />
          ))}
        </div>
      </div>
    </>
  );
}