import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/tokens";
import { markCompleted } from "@/lib/reminder-store";
import type { QuestionnairePayload } from "@/types/questionnaire";

export async function POST(request: NextRequest) {
  try {
    const body: QuestionnairePayload = await request.json();

    if (!body.token) {
      return NextResponse.json({ error: "Token required" }, { status: 400 });
    }

    const payload = verifyToken(body.token);

    // Mark the reminder instance as completed
    markCompleted(payload.medicationName, payload.time, payload.date);

    // Log the submission for testing visibility
    console.log("Questionnaire submitted:", {
      medication: payload.medicationName,
      time: payload.time,
      date: payload.date,
      medicationTaken: body.medicationTaken,
      glucoseMgDl: body.glucoseMgDl,
      weightLbs: body.weightLbs,
      exercisedToday: body.exercisedToday,
      symptoms: body.symptoms,
      notes: body.notes,
    });

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Submission failed";
    console.error("Questionnaire submit error:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
