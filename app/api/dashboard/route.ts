import { NextRequest } from "next/server";
import { adminAuth } from "@/lib/firebase-admin";
import { getAdherenceDashboard, getGlucoseDashboard, getSideEffectDashboard, getPatientByFirebaseUid } from "@/lib/data";

export async function GET(request: NextRequest) {
  // Extract patient context from auth cookie
  let patientId: string | null = null;
  const sessionCookie = request.cookies.get("__session")?.value;
  if (sessionCookie) {
    try {
      const decoded = await adminAuth.verifyIdToken(sessionCookie);
      patientId = await getPatientByFirebaseUid(decoded.uid);
    } catch {
      // Continue with default data if auth fails
    }
  }

  // TODO: Pass patientId to data functions once they query real DB
  const [adherence, glucose, sideEffects] = await Promise.all([
    getAdherenceDashboard(),
    getGlucoseDashboard(),
    getSideEffectDashboard(),
  ]);

  return new Response(JSON.stringify({
    adherence,
    glucose,
    sideEffects,
    patientId,
  }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}
