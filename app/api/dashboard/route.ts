import { NextRequest } from "next/server";
import { adminAuth } from "@/lib/firebase-admin";
import {getPatientByFirebaseUid } from "@/lib/data";
import { getAdherenceDashboard, getGlucoseDashboard, getSideEffectsDashboard } from  "@/lib/dashboard";

export async function GET(request: NextRequest) {
  // Extract patient context from auth cookie
  //let patientId: string | null = null;
   let patientId: string | null = null;
   let medication = "Metformin";
   let category = "Dizziness";
  const sessionCookie = request.cookies.get("__session")?.value;
  if (sessionCookie) {
    try {
      const decoded = await adminAuth.verifyIdToken(sessionCookie);
      patientId = await getPatientByFirebaseUid(decoded.uid);
    } catch {
      // Continue with default data if auth fails
    }
  }
  if (!patientId) {
  return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });  
  }

  // TODO: Pass patientId to data functions once they query real DB
  const [adherence, glucose, sideEffects] = await Promise.all([
    getAdherenceDashboard(patientId!, medication),
    getGlucoseDashboard(patientId!),
    getSideEffectsDashboard(patientId!, category),
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
