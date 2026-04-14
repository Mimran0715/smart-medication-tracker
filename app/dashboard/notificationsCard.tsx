type Props = {
  medicationName: string;
  message: string;
  time: string;
  isCompleted: boolean;
  onComplete?: () => void;
};

export default function NotificationCard({
  medicationName,
  message,
  time,
  isCompleted,
  onComplete,
}: Props) {
  return (
    <div className="p-3 border rounded-lg bg-white shadow-sm hover:shadow transition">
      <div className="flex justify-between items-start">
        <h3 className="font-semibold text-sm">
          {medicationName} Reminder
        </h3>

        <span className="text-xs text-gray-500">{time}</span>
      </div>

      <p className="text-sm text-gray-700 mt-1">{message}</p>

      <button
        onClick={onComplete}
        disabled={isCompleted}
        className={`mt-3 text-xs px-2 py-1 rounded ${
          isCompleted
            ? "bg-green-100 text-green-600"
            : "bg-blue-600 text-white"
        }`}
      >
        {isCompleted ? "Completed" : "Mark as done"}
      </button>
    </div>
  );
}