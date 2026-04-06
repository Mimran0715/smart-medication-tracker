import { LineChart, Line, XAxis, YAxis, Tooltip } from "recharts";

export function Charts({ data, filters }) {
  return (
    <div>
      {filters.metrics.includes('glucose') && (
        <LineChart width={600} height={300} data={data.timeseries}>
          <XAxis dataKey="date" />
          <YAxis />
          <Tooltip />
          {filters.medications.map((med) => (
            <Line
              key={med}
              dataKey={med}
              type="monotone"
            />
          ))}
        </LineChart>
      )}
    </div>
  );
}