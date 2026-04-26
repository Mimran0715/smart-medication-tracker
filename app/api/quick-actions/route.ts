import { NextRequest } from "next/server";
import { adminAuth } from "@/lib/firebase-admin";
import { getPatientByFirebaseUid } from "@/lib/data";
import { logGlucose, markMedicationTaken } from "@/lib/quick-action";

export async function POST(req: NextRequest) {
  const sessionCookie = req.cookies.get("__session")?.value;

  if (!sessionCookie) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
    });
  }

  let patientId: string;

  try {
    const decoded = await adminAuth.verifyIdToken(sessionCookie);
    const resolvedId = await getPatientByFirebaseUid(decoded.uid);

    if (!resolvedId) {
      return new Response(JSON.stringify({ error: "Patient not found" }), {
        status: 404,
      });
    }

    patientId = resolvedId;
  } catch (err) {
    console.error("Auth error:", err);
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
    });
  }

  let body: any;

  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
      status: 400,
    });
  }

  try {
    switch (body.type) {
      case "log_glucose": {
        const result = await logGlucose({
          patientId,
          glucose: body.glucose,
          recordedAt: body.recordedAt,
          mealContext: body.mealContext,
          notes: body.notes,
        });

        return Response.json(result);
      }
      
      case "mark_med_taken": {
        const result = await markMedicationTaken(
          patientId,
          body.medicationId
        );

        return Response.json(result);
      }
      
      default:
        return new Response(
          JSON.stringify({ error: "Invalid action type" }),
          { status: 400 }
        );
    }
  } catch (err) {
    console.error("Quick action error:", err);
    return new Response(JSON.stringify({ error: "Server error" }), {
      status: 500,
    });
  }
}