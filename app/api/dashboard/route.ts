import { NextRequest } from "next/server";
import { adminAuth } from "@/lib/firebase-admin";
import { getPatientByFirebaseUid } from "@/lib/data";
import {
  getAdherenceDashboard,
  getGlucoseDashboard,
  getSideEffectsDashboard,
} from "@/lib/dashboard";

export async function GET(request: NextRequest) {
  const sessionCookie = request.cookies.get("__session")?.value;

  if (!sessionCookie) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  }

  let patientId: string;

  try {
    const decoded = await adminAuth.verifyIdToken(sessionCookie);
    const resolvedId = await getPatientByFirebaseUid(decoded.uid);

    if (!resolvedId) {
      return new Response(JSON.stringify({ error: "Patient not found" }), { status: 404 });
    }

    patientId = resolvedId;
  } catch {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  }

  const medication = "Metformin";
  const category = "Fatigue";

  const [adherence, glucose, sideEffects] = await Promise.all([
    getAdherenceDashboard(patientId, medication),
    getGlucoseDashboard(patientId),
    getSideEffectsDashboard(patientId, category),
  ]);

  return new Response(
    JSON.stringify({
      adherence,
      glucose,
      sideEffects,
      patientId,
    }),
    {
      status: 200,
      headers: { "Content-Type": "application/json" },
    }
  );
}