import ReminderQuestionnaireForm from "@/components/ReminderQuestionnaireForm";
import { verifyToken } from "@/lib/tokens";

interface Props {
  params: Promise<{ token: string }>;
}

export default async function ReminderPage({ params }: Props) {
  const { token } = await params;

  // Validate token server-side
  let medicationName: string | null = null;
  let time: string | null = null;
  let tokenError: string | null = null;

  try {
    const payload = verifyToken(token);
    medicationName = payload.medicationName;
    time = payload.time;
  } catch (err: unknown) {
    tokenError = err instanceof Error ? err.message : "Invalid or expired link";
  }

  if (tokenError) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center px-4">
        <div className="text-center flex flex-col gap-4">
          <h1 className="text-xl font-bold text-red-600">Invalid Link</h1>
          <p className="text-sm text-stone-500">{tokenError}</p>
          <a
            href="/dashboard"
            className="bg-[#1AA1E3] text-white py-2 px-4 rounded hover:bg-blue-600 transition-all"
          >
            Go to Dashboard
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex items-start justify-center px-4 py-10">
      <div className="w-full max-w-md flex flex-col gap-4">
        <div className="text-center flex flex-col gap-1">
          <h1 className="text-xl font-bold text-stone-800">
            Daily Medication Check-In
          </h1>
          {medicationName && (
            <p className="text-sm font-medium text-[#1AA1E3]">
              {medicationName} {time ? `at ${time}` : ""}
            </p>
          )}
          <p className="text-sm text-stone-500">
            Fill out today&apos;s check-in below.
          </p>
        </div>

        <ReminderQuestionnaireForm token={token} />
      </div>
    </div>
  );
}
