import medicationData from "@/data/fhir_medication_example.json";

export default function MedicationsPage() {
  const medications = medicationData.entry || [];

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Medications</h1>

      <ul>
        {medications.map((entry: any, index: number) => {
          const med = entry.resource;

          const medicationName =
            med?.medicationCodeableConcept?.text ||
            med?.medicationReference?.display ||
            med?.code?.text ||
            "Unknown Medication";

          const status = med?.status || "Unknown Status";

          return (
            <li key={index}>
              {medicationName} — {status}
            </li>
          );
        })}
      </ul>
    </div>
  );
}