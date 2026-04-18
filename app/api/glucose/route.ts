import { NextRequest, NextResponse } from "next/server";
import { db} from "@/lib/db";
import { randomUUID } from "crypto";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const {
      type,
      value,
      unit,
      patientId,
      recordedAt,
    } = body;

    if (!type || !value || !unit || !patientId) {
      return NextResponse.json(
        { error: "Missing fields" },
        { status: 400 }
      );
    }

    const codeMap: Record<string, string> = {
      glucose: "Blood Glucose",
      bp: "Blood Pressure",
      weight: "Weight",
      hba1c: "HbA1c",
      cholesterol: "Cholesterol Total",
      triglycerides: "Triglycerides",
    };

    await db.query(
      `INSERT INTO observations (id, patient_id, status, code, value, unit)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        randomUUID(),
        patientId,
        "final",
        codeMap[type] ?? type,
        value,
        unit,
      ]
    );

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Server error" },
      { status: 500 }
    );
  }
}


// import { NextRequest, NextResponse } from "next/server";
// import { db } from "@/lib/db";

// export async function POST(req: NextRequest) {
//   try {
//     const body = await req.json();
//     const { glucose, recordedAt } = body;

//     if (!glucose || !recordedAt) {
//       return NextResponse.json(
//         { error: "Missing fields" },
//         { status: 400 }
//       );
//     }

//     await db.query(
//       `INSERT INTO glucose_logs (glucose, recorded_at)
//        VALUES ($1, $2)`,
//       [glucose, recordedAt]
//     );

//     return NextResponse.json({ success: true });
//   } catch (err) {
//     console.error(err);
//     return NextResponse.json(
//       { error: "Server error" },
//       { status: 500 }
//     );
//   }
// }