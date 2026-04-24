import React from 'react';
import {
  Radar, RadarChart, PolarGrid,
  PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip
} from 'recharts';

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    return (
      <div className="glass-card px-3 py-2 text-xs font-semibold text-foreground shadow-lg">
        <span className="text-muted-foreground">{payload[0]?.payload?.subject}: </span>
        <span className="text-primary">{payload[0]?.value}%</span>
      </div>
    );
  }
  return null;
};

const ResumeRadarChart = ({ data }) => {
  const chartData = data && data.length > 0
    ? data.map(d => ({ ...d, fullMark: 100 }))
    : [
        { subject: 'Technical',  A: 0, fullMark: 100 },
        { subject: 'Impact',     A: 0, fullMark: 100 },
        { subject: 'Brevity',    A: 0, fullMark: 100 },
        { subject: 'Structure',  A: 0, fullMark: 100 },
        { subject: 'Language',   A: 0, fullMark: 100 },
        { subject: 'Experience', A: 0, fullMark: 100 },
      ];

  return (
    <div className="flex flex-col h-full">
      <h4 className="text-sm font-semibold text-foreground mb-1">Skill Dimensions</h4>
      <p className="text-xs text-muted-foreground mb-3">Six-axis resume competency breakdown</p>
      <div className="flex-1 min-h-0" style={{ minHeight: '200px' }}>
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart cx="50%" cy="50%" outerRadius="65%" data={chartData}>
            <PolarGrid stroke="hsl(var(--border))" strokeWidth={1} />
            <PolarAngleAxis
              dataKey="subject"
              tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10, fontFamily: 'JetBrains Mono', fontWeight: 600, letterSpacing: '0.05em' }}
            />
            <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
            <Tooltip content={<CustomTooltip />} />
            <Radar
              name="Resume"
              dataKey="A"
              stroke="hsl(var(--primary))"
              strokeWidth={3}
              fill="hsl(var(--primary))"
              fillOpacity={0.2}
              dot={{ fill: 'hsl(var(--primary))', r: 4, strokeWidth: 0 }}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default ResumeRadarChart;
