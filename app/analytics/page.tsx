"use client"
import Filters from "./filters"
import {Charts} from "./charts"
import Table from "./table"
import { Line } from "react-chartjs-2";
import { useState, useEffect } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

export default function AnalyticsPage() {
  const [filters, setFilters] = useState({
    medications: ["insulin", "metformin", "ozempic"],
    metrics: ['glucose'],
  });

  // Chart data
  const glucoseData = [120, 130, 115, 140, 125, 135, 128];
  const adherence = 88;
  const sideEffectData = [150, 155, 152, 160, 159, 157];

  const glucoseChartData = {
    labels: glucoseData.map((_, i) => `Day ${i + 1}`),
    datasets: [
      {
        label: "Glucose Level",
        data: glucoseData,
        borderColor: "#1AA1E3",
        backgroundColor: "rgba(26, 161, 227, 0.2)",
      },
    ],
  };

  const sideEffectChartData = {
    labels: sideEffectData.map((_, i) => `Week ${i + 1}`),
    datasets: [
      {
        label: "Weight",
        data: sideEffectData,
        borderColor: "#1AA1E3",
        backgroundColor: "rgba(26, 161, 227, 0.2)",
      },
    ],
  };

  const data = {
  timeseries: [
    { date: "2026-04-01", metformin: 130, insulin: 160, ozempic: 150 },
    { date: "2026-04-02", metformin: 125, insulin: 155, ozempic: 148 },
    { date: "2026-04-03", metformin: 120, insulin: 150, ozempic: 145 },
    { date: "2026-04-04", metformin: 118, insulin: 148, ozempic: 140 },
    { date: "2026-04-05", metformin: 115, insulin: 145, ozempic: 138 },
    { date: "2026-04-06", metformin: 112, insulin: 140, ozempic: 135 },
    { date: "2026-04-07", metformin: 110, insulin: 138, ozempic: 132 },
  ],

  summary: [
    {
      med: "metformin",
      avgGlucose: 118,
      adherence: 0.93,
      weightChange: -2.1,
      topSideEffect: "nausea",
    },
    {
      med: "insulin",
      avgGlucose: 148,
      adherence: 0.87,
      weightChange: +1.4,
      topSideEffect: "hypoglycemia",
    },
    {
      med: "ozempic",
      avgGlucose: 141,
      adherence: 0.9,
      weightChange: -3.5,
      topSideEffect: "loss of appetite",
    },
  ],
};
  return (
      <div className="space-y-6 p-6">
      {/* Filters */}
      <div className="bg-white rounded-2xl shadow-sm border p-4">
         <h2 className="text-lg font-semibold mb-3">Filters</h2>
        <Filters filters={filters} setFilters={setFilters} />
      </div>

      {/* Charts */}
      <div className="bg-white rounded-2xl shadow-sm border p-4">
       <h2 className="text-lg font-semibold mb-4">Trends</h2>  
        <Charts data={data} filters={filters} />
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border p-4">

        <h2 className="text-lg font-semibold mb-3">Medication Summary</h2>
        <Table 
          data={data.summary} 
          onSelectMed={(med: any) =>
            setFilters(f => ({ ...f, medications: [med] }))
          } 
        />
      </div>

  </div>
  );
}