import React from "react";
import {
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Area, AreaChart,
} from "recharts";

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="glass-card px-3 py-2 shadow-xl text-xs">
        <p className="text-muted-foreground mb-1">{payload[0]?.payload?.date}</p>
        <p className="text-primary font-bold text-base">{payload[0]?.value}<span className="text-muted-foreground font-normal"> / 100</span></p>
      </div>
    );
  }
  return null;
};

export default function ScoreGraph({ data }) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 border border-dashed border-border rounded-xl">
        <p className="text-muted-foreground text-sm">No score history yet</p>
      </div>
    );
  }

  const chartData = [...data]
    .reverse()
    .map((item, index) => ({
      name: `#${index + 1}`,
      score: item.ats_score,
      date: new Date(item.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    }));

  const avg = Math.round(data.reduce((s, i) => s + i.ats_score, 0) / data.length);
  const best = Math.max(...data.map(i => i.ats_score));

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-base font-semibold text-foreground">Score History</h3>
          <p className="text-xs text-muted-foreground mt-0.5">Your ATS score progression over time</p>
        </div>
        <div className="flex gap-4">
          <div className="text-right">
            <p className="text-xs text-muted-foreground">Average</p>
            <p className="text-lg font-bold text-foreground">{avg}<span className="text-xs text-muted-foreground font-normal"> /100</span></p>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground">Best</p>
            <p className="text-lg font-bold text-primary">{best}<span className="text-xs text-muted-foreground font-normal"> /100</span></p>
          </div>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={240}>
        <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="scoreGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor="hsl(246 100% 67%)" stopOpacity={0.3} />
              <stop offset="95%" stopColor="hsl(246 100% 67%)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(217 33% 16%)" />
          <XAxis
            dataKey="name"
            stroke="hsl(215 20% 40%)"
            tick={{ fill: 'hsl(215 20% 55%)', fontSize: 11, fontFamily: 'Inter' }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            domain={[0, 100]}
            stroke="hsl(215 20% 40%)"
            tick={{ fill: 'hsl(215 20% 55%)', fontSize: 11, fontFamily: 'Inter' }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip content={<CustomTooltip />} />
          <Area
            type="monotone"
            dataKey="score"
            stroke="hsl(246 100% 67%)"
            strokeWidth={2.5}
            fill="url(#scoreGrad)"
            dot={{ fill: 'hsl(246 100% 67%)', r: 4, strokeWidth: 0 }}
            activeDot={{ r: 6, stroke: 'white', strokeWidth: 2, fill: 'hsl(246 100% 67%)' }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
