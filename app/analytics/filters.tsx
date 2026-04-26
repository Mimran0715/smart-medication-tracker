const SIDE_EFFECT_CATEGORIES = [
  "fatigue",
  "dizziness",
  "nausea",
  "headache",
  "blurred_vision",
  "other",
];

export default function Filters({ filters, setFilters }) {
  const allMedications = [
    "Metformin",
    "Insulin",
    "Glipizide",
    "Pioglitazone",
    "Acarbose",
  ];

  const formatLabel = (s: string) =>
    s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

  return (
    <div className="flex flex-col gap-4 p-3 border rounded-lg bg-white shadow-sm w-full max-w-md">
      
      {/* MEDICATIONS */}
      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-gray-600">
          Medications
        </label>
        <select
          multiple
          value={filters.medications}
          onChange={(e) => {
            const meds = Array.from(e.target.selectedOptions).map(
              (o) => o.value
            );
            setFilters((f) => ({ ...f, medications: meds }));
          }}
          className="border rounded p-2 h-28"
        >
          {allMedications.map((med) => (
            <option key={med} value={med}>
              {med}
            </option>
          ))}
        </select>
      </div>

      {/* METRICS */}
      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-gray-600">
          Metric
        </label>
        <select
          value={filters.metrics?.[0] || "glucose"}
          onChange={(e) =>
            setFilters((f) => ({
              ...f,
              metrics: [e.target.value],
            }))
          }
          className="border rounded p-2"
        >
          <option value="glucose">Glucose</option>
          <option value="side_effects">Side Effects</option>
        </select>
      </div>

      {/* SIDE EFFECTS (NEW) */}
      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-gray-600">
          Side Effects
        </label>
        <select
          multiple
          value={filters.sideEffects || []}
          onChange={(e) => {
            const values = Array.from(e.target.selectedOptions).map(
              (o) => o.value
            );
            setFilters((f) => ({ ...f, sideEffects: values }));
          }}
          className="border rounded p-2 h-28"
        >
          {SIDE_EFFECT_CATEGORIES.map((s) => (
            <option key={s} value={s}>
              {formatLabel(s)}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}