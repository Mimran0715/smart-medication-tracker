export default function Filters({ filters, setFilters }) {
  const allMedications = ["insulin", "metformin", "ozempic"];
  return (
    <div className="flex gap-4">
      <select
        multiple
        value={filters.medications}
        onChange={(e) => {
          const meds = [...e.target.selectedOptions].map(o => o.value);
          setFilters(f => ({ ...f, medications: meds }));
        }}
        className="border rounded p-2"
      >
      {allMedications.map((med: string) => (
      <option key={med} value={med}>
        {med.charAt(0).toUpperCase() + med.slice(1)}
      </option>
      ))}
      </select>

      <select
        onChange={(e) =>
          setFilters(f => ({ ...f, metrics: [e.target.value] }))
        }
      >
        <option value="glucose">Glucose</option>
        <option value="weight">Weight</option>
      </select>
    </div>
  );
}