type Props = {
  title: string;
  body: string;
  createdAt: string;
  isRead: boolean;
  onMarkRead?: () => void;
};

export default function NotificationCard({
  title,
  body,
  createdAt,
  isRead,
  onMarkRead,
}: Props) {
  return (
    <div className="p-3 border rounded-lg bg-white shadow-sm hover:shadow transition">
      <div className="flex justify-between items-start">
        <h3 className="font-semibold text-sm">{title}</h3>

        <span className="text-xs text-gray-500">
          {new Date(createdAt).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </span>
      </div>

      <p className="text-sm text-gray-700 mt-1">{body}</p>

      <button
        onClick={onMarkRead}
        disabled={isRead}
        className={`mt-3 text-xs px-2 py-1 rounded ${
          isRead
            ? "bg-green-100 text-green-600"
            : "bg-blue-600 text-white"
        }`}
      >
        {isRead ? "Read" : "Mark as read"}
      </button>
    </div>
  );
}