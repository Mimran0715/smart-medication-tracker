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

  // Placing a filter on the summary data to only include medications that are currently selected in the filters.
  // This ensures that downstream components like tables and charts are reflecting the user selections
  // and dynamically update based on the active filter state.
  const filteredSummary = data.summary.filter((med) =>
    filters.medications.includes(med.med)
  );

  // Next, this will be basic analytics and associated summary metrics for display
  const totalMeds = filteredSummary.length;

  // Identify the medication with the lowest average glucode using array reduction, this will be used to generate insights 
  // and highlight the most effective medication in terms of glucose control based on the current filtered dataset.
  const bestMed = 
    filteredSummary.length > 0
      ? filteredSummary.reduce((best, med) =>
          med.avgGlucose < best.avgGlucose ? med : best
        )
      : null;

// The medication with the highest adherence rate, this will be used to generate insights and highlight 
// which medication has the best patient adherence based on the current filtered dataset.
  const bestAdherence =
    filteredSummary.length > 0
      ? filteredSummary.reduce((best, med) =>
          med.adherence > best.adherence ? med : best
        )
      : null;

  // Generating insights only for the medications that are currently filtered, this will keep the
  // insights panel consistent with the filters that have been user-selected
  // which in turn ensures that the summaries that are displayed will reflect the same subset of data in the
  // table and charts, creating a cohesive and unified user experience across the analytics dashboard.
  const insights = filteredSummary.map((med) => {
    return {
      med: med.med,
      text: `${med.med} shows avg glucose ${med.avgGlucose}, adherence ${(med.adherence * 100).toFixed(0)}%, and ${med.weightChange > 0 ? "weight gain" : "weight loss"} of ${Math.abs(med.weightChange)} lbs.`,
    };
  });

  return (
    <div className="p-6 grid grid-cols-1 lg:grid-cols-4 gap-6">
      {/* MAIN CONTENT */}
      <div className="lg:col-span-3 space-y-6">
        {/* Filters */}
        <div className="bg-white rounded-2xl shadow-sm border p-4">
          <h2 className="text-lg font-semibold mb-3">Filters</h2>
          <Filters filters={filters} setFilters={setFilters} />
        </div>

        {/* Analytics Overview */}
        <div className="bg-white rounded-2xl shadow-sm border p-4">
          <h2 className="text-lg font-semibold mb-2">Analytics Overview</h2>
          <p className="text-sm text-gray-600">
            Total Medications: {totalMeds}
          </p>

          <p className="text-sm text-gray-600 capitalize">
            Best Glucose Control:{bestMed?.med}
            </p>
          
          <p className="text-sm text-gray-600 capitalize">
            Best Adherence: {bestAdherence?.med}
          </p>
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
            data={filteredSummary}
            onSelectMed={(med: any) =>
              setFilters((f) => ({ ...f, medications: [med] }))
            }
          />
        </div>
      </div>

      {/* INSIGHTS SIDEBAR */}
      <div className="bg-white rounded-2xl shadow-sm border p-4 h-fit sticky top-6">
        <h2 className="text-lg font-semibold mb-4">Insights</h2>

        <ul className="space-y-3 text-sm text-gray-700">
          {insights.map((item, idx) => (
            <li key={idx} className="p-3 bg-gray-50 rounded-lg">
              <span className="font-medium capitalize">{item.med}</span>: {item.text}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}