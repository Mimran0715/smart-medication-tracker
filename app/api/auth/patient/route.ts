import { NextRequest, NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebase-admin";
import { getPatientByFirebaseUid, assignRandomPatient, getPatientName } from "@/lib/data";

async function getFirebaseUid(request: NextRequest): Promise<string | null> {
  const sessionCookie = request.cookies.get("__session")?.value;
  if (!sessionCookie) return null;

  try {
    const decoded = await adminAuth.verifyIdToken(sessionCookie);
    return decoded.uid;
  } catch {
    return null;
  }
}

export async function GET(request: NextRequest) {
  const uid = await getFirebaseUid(request);
  if (!uid) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const patientId = await getPatientByFirebaseUid(uid);
  if (!patientId) {
    return NextResponse.json({ error: "No patient mapped" }, { status: 404 });
  }

  const patientName = await getPatientName(patientId);
  return NextResponse.json({ patientId, patientName });
}

export async function POST(request: NextRequest) {
  const uid = await getFirebaseUid(request);
  if (!uid) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const existing = await getPatientByFirebaseUid(uid);
  if (existing) {
    const patientName = await getPatientName(existing);
    return NextResponse.json({ patientId: existing, patientName });
  }

  try {
    const patientId = await assignRandomPatient(uid);
    const patientName = await getPatientName(patientId);
    return NextResponse.json({ patientId, patientName }, { status: 201 });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to assign patient" },
      { status: 500 }
    );
  }
}
