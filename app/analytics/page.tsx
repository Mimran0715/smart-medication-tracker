"use client"
import Filters from "./filters"
import Charts from "./charts"
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
    medications: [],
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
  return (
    <div className="space-y-6">
      <Filters filters={filters} setFilters={setFilters} />
      <Charts data={data} filters={filters} />
      <Table data={data.summary} onSelectMed={(med) =>
        setFilters(f => ({ ...f, medications: [med] }))
      } />
    </div>
  );
}