import { mockNotifications } from "./notifications";
import NotificationCard from "./notificationsCard";

type Props = {
  isOpen: boolean;
  onClose: () => void;
};

export default function DashboardDrawer({ isOpen, onClose }: Props) {
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
          <h2 className="text-lg font-semibold text-white">Notifications</h2>
          <button onClick={onClose}>✕</button>
        </div>

        <div className="p-4 space-y-3">
        {mockNotifications.map((n) => (
            <NotificationCard
            key={n.id}
            medicationName={n.medicationName}
            message={n.message}
            time={n.time}
            isCompleted={n.isCompleted}
            onComplete={() => console.log("complete:", n.id)}
            />
        ))}
        </div>
      </div>
    </>
  );
}