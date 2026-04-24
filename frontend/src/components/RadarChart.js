import React from 'react';
import {
  Radar, RadarChart, PolarGrid,
  PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer
} from 'recharts';

const ResumeRadarChart = ({ data }) => {
  // Fallback data if none provided
  const chartData = data || [
    { subject: 'Technical', A: 80, fullMark: 100 },
    { subject: 'Impact', A: 70, fullMark: 100 },
    { subject: 'Brevity', A: 90, fullMark: 100 },
    { subject: 'Structure', A: 60, fullMark: 100 },
    { subject: 'Soft Skills', A: 75, fullMark: 100 },
    { subject: 'Experience', A: 85, fullMark: 100 },
  ];

  return (
    <div className="w-full h-80 bg-white p-4 rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
      <h4 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-2 ml-2">Skill Dimensions</h4>
      <ResponsiveContainer width="100%" height="90%">
        <RadarChart cx="50%" cy="50%" outerRadius="70%" data={chartData}>
          <PolarGrid stroke="#f3f4f6" />
          <PolarAngleAxis 
            dataKey="subject" 
            tick={{ fill: '#6b7280', fontSize: 12, fontWeight: 600 }}
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
            stroke="#111827"
            strokeWidth={2}
            fill="#111827"
            fillOpacity={0.1}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default ResumeRadarChart;
