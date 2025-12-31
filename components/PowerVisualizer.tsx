
import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface PowerVisualizerProps {
  powerLevel?: number;
}

const initialData = [
  { name: 'ذهن', value: 85, color: '#8B5CF6' },
  { name: 'اراده', value: 92, color: '#EC4899' },
  { name: 'خلاقیت', value: 78, color: '#F59E0B' },
  { name: 'تمرکز', value: 65, color: '#10B981' },
];

export const PowerVisualizer: React.FC<PowerVisualizerProps> = ({ powerLevel }) => {
  const [chartData, setChartData] = useState(initialData);
  const [isBouncing, setIsBouncing] = useState(false);

  useEffect(() => {
    if (powerLevel !== undefined) {
      // Trigger a subtle bounce animation for the whole container
      setIsBouncing(true);
      const timer = setTimeout(() => setIsBouncing(false), 600);

      // Update the chart data to reflect the new power level
      setChartData(prev => prev.map(item => {
        if (item.name === 'اراده') {
          // Boost willpower slightly based on power level
          return { ...item, value: Math.min(100, Math.max(item.value, powerLevel)) };
        }
        if (item.name === 'ذهن') {
          // Sync Mind value closely with the AI's power level assessment
          return { ...item, value: powerLevel };
        }
        return item;
      }));

      return () => clearTimeout(timer);
    }
  }, [powerLevel]);

  return (
    <div className={`w-full h-[400px] bg-black/40 rounded-[3rem] p-8 border border-white/5 backdrop-blur-2xl transition-all duration-300 ${isBouncing ? 'animate-bounce-subtle border-cyan-500/30' : ''}`}>
      <h3 className="text-2xl font-bold mb-8 text-center text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-violet-400">
        آنالیز پتانسیل درونی
      </h3>
      <ResponsiveContainer width="100%" height="80%">
        <BarChart data={chartData}>
          <XAxis 
            dataKey="name" 
            axisLine={false} 
            tickLine={false} 
            tick={{ fill: '#9CA3AF', fontSize: 14 }}
            dy={10}
          />
          <YAxis hide domain={[0, 100]} />
          <Tooltip 
            cursor={{ fill: 'rgba(255,255,255,0.02)' }}
            contentStyle={{ backgroundColor: '#000', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', color: '#fff' }}
          />
          <Bar 
            dataKey="value" 
            radius={[12, 12, 0, 0]} 
            barSize={40} 
            animationDuration={1500}
            animationEasing="ease-out"
          >
            {chartData.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={entry.color} 
                style={{ filter: isBouncing ? 'brightness(1.5) drop-shadow(0 0 10px currentColor)' : 'none', transition: 'filter 0.3s ease' }} 
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      <div className="mt-4 text-center text-gray-500 text-xs uppercase tracking-[0.2em] font-bold">
        {isBouncing ? 'در حال همگام‌سازی انرژی...' : 'جریان انرژی پایدار'}
      </div>
    </div>
  );
};
