"use client";

import Filters from "./filters";
import { Charts } from "./charts";
import Table from "./table";
import { useState } from "react";

// Components from recharts are here to build additional visualizations that are relationship-based
// Scatter plot helps compare adherence vs glucose control across medications, this can reveal if higher 
// adherence correlates with better glucose outcomes in the dataset

import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Label,
  Cell,
} from "recharts";

/* -----------------------------
   BACKUP ANALYTICS DATA
------------------------------*/
import {
  glucoseTimeseries,
  sideEffectsTimeseries,
  MEDICATIONS,
} from "./analytics-backup";

export default function AnalyticsPage() {
  const [filters, setFilters] = useState({
    medications: ["Metformin", "Insulin", "Glipizide"],
    metrics: ["glucose", "side_effects"],
    sideEffects: [],
  });

  /* -----------------------------
     FULL DATA OBJECT (MVP SOURCE OF TRUTH)
  ------------------------------*/
  const data = {
    timeseries: glucoseTimeseries,
    sideEffectsTimeseries,
    summary: [
      {
        med: "Metformin",
        avgGlucose: 118,
        adherence: 0.93,
        weightChange: -2.1,
        topSideEffect: "nausea",
      },
      {
        med: "Insulin",
        avgGlucose: 148,
        adherence: 0.87,
        weightChange: +1.4,
        topSideEffect: "hypoglycemia",
      },
      {
        med: "Glipizide",
        avgGlucose: 141,
        adherence: 0.9,
        weightChange: -3.5,
        topSideEffect: "loss of appetite",
      },
    ],
  };

  /* -----------------------------
     FILTER SUMMARY
  ------------------------------*/
  const filteredSummary = data.summary.filter((med) =>
    filters.medications.includes(med.med)
  );

  const totalMeds = filteredSummary.length;

  const bestMed =
    filteredSummary.length > 0
      ? filteredSummary.reduce((best, med) =>
          med.avgGlucose < best.avgGlucose ? med : best
        )
      : null;

  const bestAdherence =
    filteredSummary.length > 0
      ? filteredSummary.reduce((best, med) =>
          med.adherence > best.adherence ? med : best
        )
      : null;

  /* -----------------------------
     SCATTER DATA
  ------------------------------*/
  const effectivenessData = filteredSummary.map((med) => ({
    med: med.med,
    adherence: med.adherence * 100,
    avgGlucose: med.avgGlucose,
    weightChange: med.weightChange,
    sideEffect: med.topSideEffect,
  }));

  /* -----------------------------
     INSIGHTS
  ------------------------------*/
  const insights = filteredSummary.map((med) => ({
    med: med.med,
    text: `${med.med} shows avg glucose ${
      med.avgGlucose
    }, adherence ${(med.adherence * 100).toFixed(0)}%, and ${
      med.weightChange > 0 ? "weight gain" : "weight loss"
    } of ${Math.abs(med.weightChange)} lbs.`,
  }));

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
            Best Glucose Control: {bestMed?.med}
          </p>

          <p className="text-sm text-gray-600 capitalize">
            Best Adherence: {bestAdherence?.med}
          </p>
        </div>

        {/* Charts */}
        <div className="bg-white rounded-2xl shadow-sm border p-4">
          <h2 className="text-2xl font-semibold text-center mb-6">
            Trends
          </h2>

          <Charts data={data} filters={filters} />
        </div>

        {/* Scatter plot */}
        <div className="bg-white rounded-2xl shadow-sm border p-4">
          <h2 className="text-lg font-bold text-center mb-3">
            Medication Effectiveness Map
          </h2>

          <p className="text-sm text-gray-600 mb-4 text-center">
            Comparing adherence vs average glucose for selected medications.
          </p>

          <ResponsiveContainer width="100%" height={550}>
            <ScatterChart margin={{ top: 20, right: 30, left: 50, bottom: 40 }}>
              <CartesianGrid strokeDasharray="3 3" />

              <XAxis
                type="number"
                dataKey="adherence"
                name="Adherence"
                unit="%"
                domain={[80, 100]}
              >
                <Label
                  value="Adherence (%)"
                  position="bottom"
                  offset={10}
                  style={{ fontWeight: "bold", fontSize: 14 }}
                />
              </XAxis>

              <YAxis
                type="number"
                dataKey="avgGlucose"
                name="Average Glucose"
                unit="mg/dL"
                width={80}
              >
                <Label
                  value="Average Glucose (mg/dL)"
                  angle={-90}
                  position="insideLeft"
                  offset={-25}
                  style={{
                    textAnchor: "middle",
                    fontWeight: "bold",
                    fontSize: 14,
                  }}
                />
              </YAxis>

              <Tooltip />

              <Scatter name="Medications" data={effectivenessData}>
                {effectivenessData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={
                      entry.med === "Metformin"
                        ? "#16a34a"
                        : entry.med === "Insulin"
                        ? "#2563eb"
                        : "#dc2626"
                    }
                  />
                ))}
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer>
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl shadow-sm border p-4">
          <h2 className="text-lg font-semibold mb-3">
            Medication Summary
          </h2>

          <Table
            data={filteredSummary}
            onSelectMed={(med: string) =>
              setFilters((f) => ({
                ...f,
                medications: [med],
              }))
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
              <span className="font-medium capitalize">
                {item.med}
              </span>
              : {item.text}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}