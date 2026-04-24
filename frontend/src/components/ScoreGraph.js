import React from "react";
import {
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
      <div className="flex items-center justify-center h-64 bg-muted border-4 border-foreground border-dashed">
        <p className="text-muted-foreground font-mono font-bold uppercase">NO_SCORE_HISTORY_DATA</p>
      </div>
    );
  }

  const chartData = [...data]
    .reverse()
    .map((item, index) => ({
      name: `V${data.length - index}`,
      score: item.ats_score,
      date: new Date(item.created_at).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      }),
      fullDate: new Date(item.created_at).toLocaleDateString(),
    }));

  return (
    <div className="bg-white p-8 border-4 border-foreground shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
      <h3 className="text-xl font-black uppercase text-foreground mb-8 flex items-center font-mono">
        [HISTORICAL_SCORE_VECTORS]
      </h3>
      <ResponsiveContainer width="100%" height={300}>
        <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="0" stroke="hsl(var(--border))" />
          <XAxis
            dataKey="name"
            stroke="black"
            style={{ fontSize: "10px", fontWeight: "800", fontFamily: "JetBrains Mono" }}
            tick={{ fill: "black" }}
            axisLine={{ strokeWidth: 2 }}
          />
          <YAxis
            domain={[0, 100]}
            stroke="black"
            style={{ fontSize: "10px", fontWeight: "800", fontFamily: "JetBrains Mono" }}
            tick={{ fill: "black" }}
            axisLine={{ strokeWidth: 2 }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "black",
              color: "white",
              border: "4px solid black",
              borderRadius: "0px",
              padding: "10px",
              fontFamily: "JetBrains Mono"
            }}
            itemStyle={{ color: "white", fontWeight: "900", textTransform: "uppercase" }}
            labelStyle={{ color: "rgba(255,255,255,0.5)", fontWeight: "bold", fontSize: "10px", marginBottom: "4px" }}
            cursor={{ stroke: 'black', strokeWidth: 2 }}
            formatter={(value) => [
              `${value} / 100`,
              "SCORE"
            ]}
          />
          <Area
            type="stepAfter"
            dataKey="score"
            stroke="black"
            strokeWidth={4}
            fillOpacity={0.1}
            fill="black"
            dot={{ fill: "black", r: 4, strokeWidth: 2, stroke: "black" }}
            activeDot={{ r: 6, strokeWidth: 4, stroke: "black" }}
          />
        </AreaChart>
      </ResponsiveContainer>
      <div className="mt-8 pt-6 border-t-2 border-foreground flex items-center justify-between text-[10px] font-black font-mono uppercase tracking-widest">
        <span>LOGS_COUNT: {data.length}</span>
        <span>
          MEAN_AVG:{" "}
          {Math.round(
            data.reduce((sum, item) => sum + item.ats_score, 0) / data.length
          )}
        </span>
      </div>
    </div>
  );
}
