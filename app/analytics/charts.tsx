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
  glipizide: "#f59e0b",
  pioglitazone: "#8b5cf6",
  acarbose: "#0ea5e9",
};

const sideEffectColors = {
  fatigue: "#6366f1",
  dizziness: "#f59e0b",
  nausea: "#ef4444",
  headache: "#10b981",
  blurred_vision: "#8b5cf6",
  other: "#6b7280",
};

export function Charts({ data, filters }) {
  const metrics = filters?.metrics || [];
  const medications = filters?.medications || [];
  const sideEffects = filters?.sideEffects || [];

  return (
    <div className="w-full flex flex-col gap-12">

      {/* ---------------- GLUCOSE ---------------- */}
      {metrics.includes("glucose") && (
        <div>
          <h3 className="text-2xl font-bold text-center mb-3">
            Glucose Trends Over Time
          </h3>

          <p className="text-sm text-gray-600 text-center mb-8">
            Tracks glucose levels over time for selected medications. 
            Useful for identifying trends, comparing treatment effects, 
            and evaluating overall glucose control.
          </p>

          <ResponsiveContainer width="100%" height={550}>
            <LineChart
              data={data.timeseries}
              margin={{ top: 20, right: 30, left: 40, bottom: 60 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <Legend verticalAlign="top" height={36} />

              <XAxis
                dataKey="date"
                interval={0}
                tick={{ fontSize: 12 }}
                angle={-20}
                textAnchor="end"
                height={60}
              >
                <Label
                  value="ObservationDate"
                  position="bottom"
                  offset={10}
                  style={{ fontWeight: "bold", fontSize: 14 }}
                />
              </XAxis>

              <YAxis width={60} tick={{ fontSize: 12 }}>
                <Label
                  value="Glucose (mg/dL)"
                  angle={-90}
                  position="insideLeft"
                  style={{
                    textAnchor: "middle",
                    fontWeight: "bold",
                    fontSize: 14,
                  }}
                />
              </YAxis>

              <Tooltip />

              {medications.map((med: string) => (
                <Line
                  key={med}
                  dataKey={med}
                  type="monotone"
                  stroke={lineColors[med.toLowerCase()] || "#6b7280"}
                  strokeWidth={3}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* ---------------- SIDE EFFECTS ---------------- */}
      {metrics.includes("side_effects") && (
        <div>
          <h3 className="text-2xl font-bold text-center mb-3">
            Side Effects Over Time
          </h3>

          <p className="text-sm text-gray-600 text-center mb-8">
            Displays when selected side effects were reported over time. Each point represents a recorded occurrence.
          </p>

          <ResponsiveContainer width="100%" height={450}>
            <LineChart
              data={data.sideEffectsTimeseries}
              margin={{ top: 20, right: 30, left: 40, bottom: 60 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <Legend verticalAlign="top" height={36} />

              <XAxis
                dataKey="date"
                tick={{ fontSize: 12 }}
                angle={-20}
                textAnchor="end"
                height={60}
              >
                <Label
                  value="Observation Date"
                  position="bottom"
                  offset={10}
                  style={{ fontWeight: "bold", fontSize: 14 }}
                />
              </XAxis>

              <YAxis
                domain={[0, 1]}
                ticks={[0, 1]}
                width={80}
              >
                <Label
                  value="Occurrence (0 = none, 1 = reported)"
                  angle={-90}
                  position="insideLeft"
                  offset={-5}
                  style={{
                    textAnchor: "middle",
                    fontWeight: "bold",
                    fontSize: 14,
                  }}
                />
              </YAxis>

              <Tooltip />

              {/* If nothing selected → show all */}
              {(sideEffects.length === 0
                ? Object.keys(sideEffectColors)
                : sideEffects
              ).map((se: string) => (
                <Line
                  key={se}
                  dataKey={se}
                  type="monotone"
                  stroke={sideEffectColors[se] || "#6b7280"}
                  strokeWidth={0}
                  dot={{ r: 3 }}
                  activeDot={{ r: 5 }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}