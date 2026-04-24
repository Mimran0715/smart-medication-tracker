import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  Label,
  ResponsiveContainer,
} from "recharts";

const lineColors = {
  insulin: "#2563eb",
  metformin: "#16a34a",
  ozempic: "#dc2626",
};

export function Charts({ data, filters }) {
  return (
    <div className="w-full">
      {/* Only render the glucose chart if the glucose metric is selected */}
      {filters.metrics.includes("glucose") && (
        <div>
          <h3 className="text-2xl font-bold text-center mb-6">Glucose Trends Over Time</h3>

          {/* Responsive container allows the chart to grow with the page width */}
          <ResponsiveContainer width="100%" height={550}>
            <LineChart
              data={data.timeseries}
              margin={{ top: 20, right: 30, left: 40, bottom: 60 }}
            >
              {/* Background grid improves readability across time points */}
              <CartesianGrid strokeDasharray="3 3" />

              {/* Legend helps distinguish medication trend lines */}
              <Legend verticalAlign="top" height={36} />

              {/* X-axis maps to date values and preserves all labels */}
              <XAxis
                dataKey="date"
                interval={0}
                tick={{ fontSize: 12 }}
                angle={-20}
                textAnchor="end"
                height={60}
              >
                <Label 
                value="Observation/Measurement Date (MM-DD-YYYY)" 
                position="bottom" 
                offset={10} 
                style={{ fontWeight: "bold", fontSize: 14 }}
                />
              </XAxis>

              {/* Y-axis displays glucose values with units */}
              <YAxis width={60}tick={{ fontSize: 12 }}>
                <Label
                  value="Glucose Level (mg/dL)"
                  angle={-90}
                  position="insideLeft"
                  style={{ textAnchor: "middle",
                  fontWeight: "bold", 
                  fontSize: 14 
                  }}
                />
              </YAxis>

              {/* Tooltip shows exact values for a hovered point */}
              <Tooltip />

              {/* Render one line per selected medication with distinct colors */}
              {filters.medications.map((med: any) => (
                <Line
                  key={med}
                  dataKey={med}
                  type="monotone"
                  stroke={lineColors[med] || "#6b7280"}
                  strokeWidth={3}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}