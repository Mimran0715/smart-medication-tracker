import { NextRequest } from "next/server";
import { adminAuth } from "@/lib/firebase-admin";
import {
  getPatientByFirebaseUid,
  assignRandomPatient,
} from "@/lib/data";

export async function getOrCreatePatientId(req: NextRequest) {
  const sessionCookie = req.cookies.get("__session")?.value;

  if (!sessionCookie) {
    throw new Error("UNAUTHORIZED");
  }

  const decoded = await adminAuth.verifyIdToken(sessionCookie);

  let patientId = await getPatientByFirebaseUid(decoded.uid);

  // 🔥 KEY FIX: auto-create if missing
  if (!patientId) {
    patientId = await assignRandomPatient(decoded.uid);
  }

  return patientId;
}