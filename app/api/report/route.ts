import { NextResponse } from "next/server";
import { renderToBuffer, renderToStream } from "@react-pdf/renderer";
// import { MedicationReport } from "../../dashboard/MedicationReport";
import { createMedicationReport } from "@/app/dashboard/MedicationReport";

export async function GET() {
  // Replace with real DB data
  const data = {
    name: "John Doe",
    adherence: 85,
    meds: [
      { name: "Aspirin", dosage: "100mg", taken: true },
      { name: "Vitamin D", dosage: "2000 IU", taken: false },
    ],
  };

    // const stream = await renderToStream(
    // <MedicationReport data={data} />
    // );

    // const element = React.createElement(MedicationReport, { data });
    const element = createMedicationReport(data);
    const stream = await renderToStream(element);
    const chunks: Buffer[] = [];

    for await (const chunk of stream) {
    chunks.push(Buffer.from(chunk));
    }

    const pdfBuffer = Buffer.concat(chunks);

  return new NextResponse(pdfBuffer, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": "attachment; filename=report.pdf",
    },
  });
}