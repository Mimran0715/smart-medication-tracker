"use client";
import medicationData from "@/data/fhir_medication_example.json";
import {useState} from "react";

function getMedicationDisplayNew(med: any){
  return {
    name: med.name,
    status: med.status,
    dosage: med.dosage,
  };
}
function buildMedicationList(entries: any[]) {
  const medicationMap: Record<string, any> = {};
  const knowledgeMap: Record<string, any> = {};
  const statements: any[] = [];

  entries.forEach((entry: any) => {
    const res = entry.resource;
    if (res.resourceType === "Medication") {
      medicationMap[res.id] = res;
    }
    if (res.resourceType === "MedicationKnowledge") {
      const name = res?.code?.text;
      if (name) knowledgeMap[name] = res;
    }
    if (res.resourceType === "MedicationStatement") {
      statements.push(res);
    }
  });

  const medications = statements.map((stmt) => {
    const ref = stmt?.medicationReference?.reference;
    const medId = ref?.split("/")[1];
    const medication = medicationMap[medId];

    const name =
      medication?.code?.text ||
      stmt?.medicationCodeableConcept?.text ||
      "Unknown Medication";

    const knowledge =
      knowledgeMap[name] ||
      Object.values(knowledgeMap).find((k: any) =>
        name.includes(k.code?.text)
      );

    return {
      name,
      status: stmt.status,
      dosage: stmt?.dosage?.map((d: any) => d.text).join("; ") || "No dosage",
      route: stmt?.dosage
        ?.map((d: any) => d.route?.text)
        .filter(Boolean)
        .join(", "),
      doseForm: knowledge?.doseForm?.text,
      guidance:
        knowledge?.administrationGuidelines?.[0]?.dosage?.text,
    };
  });
  return medications;
}

export default function MedicationsPage() {
  const medications = buildMedicationList(medicationData.entry);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const selectedMed = medications[selectedIndex];

  return (
    <div className="flex h-screen border overflow-hidden">
      {/* medication list */}
      <div className="w-1/3 border-r bg-gray-50 flex flex-col">
        <div className="p-4 font-semibold text-lg">Medications</div>
        <div className="flex-1 overflow-y-auto scroll-smooth">
          {medications.map((med, index) => {
            const display = getMedicationDisplayNew(med);
            return (
              <div
                key={index}
                onClick={() => setSelectedIndex(index)}
                className={`p-4 cursor-pointer border-b hover:bg-gray-100 ${
                  selectedIndex === index ? "bg-white" : ""
                }`}
              >
                <div className="flex justify-between items-center">
                  <span className="font-medium">{display.name}</span>
                  <span className="text-sm text-gray-500">{display.status}</span>
                </div>
                <div className="text-sm text-gray-500">{display.dosage}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* medication information */}
      <div className="flex-1 p-6 overflow-y-auto">
        {selectedMed ? (
          <div>
            <h2 className="text-2xl font-bold mb-2">{selectedMed.name}</h2>
            <p className="mb-1">
              <span className="font-semibold">Status:</span> {selectedMed.status}
            </p>
            <p className="mb-1">
              <span className="font-semibold">Dosage:</span> {selectedMed.dosage}
            </p>
            {selectedMed.route && (
              <p className="mb-1">
                <span className="font-semibold">Route:</span> {selectedMed.route}
              </p>
            )}
            {selectedMed.doseForm && (
              <p className="mb-1">
                <span className="font-semibold">Form:</span> {selectedMed.doseForm}
              </p>
            )}
            {selectedMed.guidance && (
              <p className="mb-1">
                <span className="font-semibold">Guidance:</span> {selectedMed.guidance}
              </p>
            )}
          </div>
        ) : (
          <p>Select a medication to see details</p>
        )}
      </div>
    </div>
  );
}
