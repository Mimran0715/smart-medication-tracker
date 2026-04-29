import { NextRequest } from "next/server";
import { adminAuth } from "@/lib/firebase-admin";
import { getPatientByFirebaseUid } from "@/lib/data";
import { getSideEffectsDashboard } from "@/lib/dashboard";

export async function GET(request: NextRequest) {
  const sessionCookie = request.cookies.get("__session")?.value;

  if (!sessionCookie) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  }

  try {
    const decoded = await adminAuth.verifyIdToken(sessionCookie);
    const patientId = await getPatientByFirebaseUid(decoded.uid);

    if (!patientId) {
      return new Response(JSON.stringify({ error: "Patient not found" }), { status: 404 });
    }

    const sideEffects = await getSideEffectsDashboard(patientId);

    return new Response(JSON.stringify(sideEffects), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  }
}