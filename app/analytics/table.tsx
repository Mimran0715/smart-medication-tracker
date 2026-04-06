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
        {data.map((row) => (
          <tr key={row.med} onClick={() => onSelectMed(row.med)}>
            <td>{row.med}</td>
            <td>{row.avgGlucose}</td>
            <td>{row.adherence}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}