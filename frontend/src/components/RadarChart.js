import React from 'react';
import {
  Radar, RadarChart, PolarGrid,
  PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer
} from 'recharts';

const ResumeRadarChart = ({ data }) => {
  const chartData = data || [
    { subject: 'TECH', A: 80, fullMark: 100 },
    { subject: 'IMPACT', A: 70, fullMark: 100 },
    { subject: 'STYLE', A: 90, fullMark: 100 },
    { subject: 'STRUCT', A: 60, fullMark: 100 },
    { subject: 'SOFT', A: 75, fullMark: 100 },
    { subject: 'EXP', A: 85, fullMark: 100 },
  ];

  return (
    <div className="w-full h-80 bg-white p-6 border-4 border-foreground shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] flex flex-col">
      <h4 className="text-xs font-black text-foreground uppercase tracking-widest mb-4 font-mono">[SKILL_DIMENSIONS]</h4>
      <div className="flex-1 min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart cx="50%" cy="50%" outerRadius="65%" data={chartData}>
            <PolarGrid stroke="black" strokeWidth={1} />
            <PolarAngleAxis 
              dataKey="subject" 
              tick={{ fill: 'black', fontSize: 10, fontWeight: 800, fontFamily: 'JetBrains Mono' }}
            />
            <PolarRadiusAxis 
              angle={30} 
              domain={[0, 100]} 
              tick={false} 
              axisLine={false}
            />
            <Radar
              name="Resume"
              dataKey="A"
              stroke="black"
              strokeWidth={3}
              fill="black"
              fillOpacity={0.2}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default ResumeRadarChart;
