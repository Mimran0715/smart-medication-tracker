export default function Filters({ filters, setFilters }) {
  return (
    <div className="flex gap-4">
      <select
        multiple
        onChange={(e) => {
          const meds = [...e.target.selectedOptions].map(o => o.value);
          setFilters(f => ({ ...f, medications: meds }));
        }}
      >
        <option value="metformin">Metformin</option>
        <option value="insulin">Insulin</option>
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