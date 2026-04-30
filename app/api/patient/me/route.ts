import { NextRequest } from "next/server";
import { getOrCreatePatientId } from "@/lib/auth";
import { getPatientById } from "@/lib/data";

export async function GET(req: NextRequest) {
  let patientId: string;

  try {
    patientId = await getOrCreatePatientId(req);
  } catch (err: any) {
    if (err.message === "UNAUTHORIZED") {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
      });
    }

    return new Response(JSON.stringify({ error: "Auth failure" }), {
      status: 500,
    });
  }

  try {
    const patient = await getPatientById(patientId);

    if (!patient) {
      return new Response(JSON.stringify({ error: "Patient not found" }), {
        status: 404,
      });
    }

    return Response.json({
      firstName: patient.first_name,
      lastName: patient.last_name,
      fullName: `${patient.first_name} ${patient.last_name}`,
    });
  } catch (err) {
    console.error("Fetch patient error:", err);
    return new Response(JSON.stringify({ error: "Server error" }), {
      status: 500,
    });
  }
}