import ReminderQuestionnaireForm from "@/components/ReminderQuestionnaireForm";

interface Props {
  params: Promise<{ token: string }>;
}

export default async function ReminderPage({ params }: Props) {
  const { token } = await params;

  return (
    <div className="min-h-screen bg-white flex items-start justify-center px-4 py-10">
      <div className="w-full max-w-md flex flex-col gap-4">
        <div className="text-center flex flex-col gap-1">
          <h1 className="text-xl font-bold text-stone-800">
            Daily Medication Check-In
          </h1>
          <p className="text-sm text-stone-500">
            Fill out
            today&apos;s check-in below.
          </p>
        </div>

        <ReminderQuestionnaireForm token={token} />
      </div>
    </div>
  );
}
