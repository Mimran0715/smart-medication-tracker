type MedicationRow = {
  med: string;
  avgGlucose?: number;
  adherence?: number;
};

type Props = {
  data: MedicationRow[];
  onSelectMed: (med: string) => void;
};

export default function Table({ data, onSelectMed }: Props) {
  return (
    <div className="w-full overflow-x-auto">
      <table className="w-full border-collapse text-left">
        
        <thead>
          <tr className="border-b bg-gray-50">
            <th className="py-3 px-6 font-semibold text-gray-700">
              Medication
            </th>
            <th className="py-3 px-6 font-semibold text-gray-700">
              Avg Glucose
            </th>
            <th className="py-3 px-6 font-semibold text-gray-700">
              Adherence
            </th>
          </tr>
        </thead>

        <tbody>
          {data.map((row) => (
            <tr
              key={row.med}
              onClick={() => onSelectMed(row.med)}
              className="border-b hover:bg-gray-50 cursor-pointer transition"
            >
              <td className="py-4 px-6 font-medium">
                {row.med}
              </td>

              <td className="py-4 px-6">
                {row.avgGlucose !== undefined
                  ? row.avgGlucose.toFixed(1)
                  : "—"}
              </td>

              <td className="py-4 px-6">
                {row.adherence !== undefined
                  ? `${row.adherence}%`
                  : "—"}
              </td>
            </tr>
          ))}
        </tbody>

      </table>
    </div>
  );
}