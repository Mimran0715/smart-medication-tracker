export default function Table({ data, onSelectMed }) {
  return (
    <table>
      <thead>
        <tr>
          <th>Medication</th>
          <th>Avg Glucose</th>
          <th>Adherence</th>
        </tr>
      </thead>
        <tbody>
          {data.map((row: any) => (
            <tr
              key={row.med}
              onClick={() => onSelectMed(row.med)}
              className="border-b hover:bg-gray-50 cursor-pointer"
            >
              <td className="py-4 px-6">{row.med}</td>
              <td className="py-4 px-6">{row.avgGlucose}</td>
              <td className="py-8 px-10">{row.adherence}</td>
            </tr>
          ))}
        </tbody>
    </table>
  );
}