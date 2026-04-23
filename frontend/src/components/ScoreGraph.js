import React from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
} from "recharts";

export default function ScoreGraph({ data }) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 bg-gray-50 rounded-2xl border border-gray-200">
        <p className="text-gray-500">No score history available yet</p>
      </div>
    );
  }

  // Prepare data for chart (reverse to show oldest to newest)
  const chartData = [...data]
    .reverse()
    .map((item, index) => ({
      name: `v${data.length - index}`,
      score: item.ats_score,
      date: new Date(item.created_at).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      }),
      fullDate: new Date(item.created_at).toLocaleDateString(),
    }));

  return (
    <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm">
      <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
        <svg
          className="w-6 h-6 mr-2 text-gray-900"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
          />
        </svg>
        Score Progress Over Time
      </h3>
      <ResponsiveContainer width="100%" height={300}>
        <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#111827" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#111827" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
          <XAxis
            dataKey="name"
            stroke="#9ca3af"
            style={{ fontSize: "12px" }}
            tick={{ fill: "#6b7280" }}
          />
          <YAxis
            domain={[0, 100]}
            stroke="#9ca3af"
            style={{ fontSize: "12px" }}
            tick={{ fill: "#6b7280" }}
            label={{
              value: "Score",
              angle: -90,
              position: "insideLeft",
              style: { textAnchor: "middle", fill: "#6b7280" },
            }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "white",
              border: "1px solid #e5e7eb",
              borderRadius: "8px",
              padding: "8px 12px",
            }}
            labelStyle={{ color: "#111827", fontWeight: "bold", marginBottom: "4px" }}
            formatter={(value, name) => [
              `${value} / 100`,
              "ATS Score",
            ]}
            labelFormatter={(label, payload) => {
              if (payload && payload[0]) {
                return `Version: ${label} - ${payload[0].payload.fullDate}`;
              }
              return label;
            }}
          />
          <Area
            type="monotone"
            dataKey="score"
            stroke="#111827"
            strokeWidth={3}
            fillOpacity={1}
            fill="url(#colorScore)"
            dot={{ fill: "#111827", r: 5, strokeWidth: 2, stroke: "#fff" }}
            activeDot={{ r: 7, strokeWidth: 2, stroke: "#fff" }}
          />
        </AreaChart>
      </ResponsiveContainer>
      <div className="mt-4 flex items-center justify-between text-sm text-gray-500">
        <span>Total Analyses: {data.length}</span>
        <span>
          Average Score:{" "}
          {Math.round(
            data.reduce((sum, item) => sum + item.ats_score, 0) / data.length
          )}
        </span>
      </div>
    </div>
  );
}

