"use client";

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { formatUGX } from "@/lib/booking";

const mockRevenueData = [
  { date: '1 Aug', gross: 180000, net: 100000 },
  { date: '6 Aug', gross: 300000, net: 150000 },
  { date: '11 Aug', gross: 250000, net: 120000 },
  { date: '16 Aug', gross: 500000, net: 220000 },
  { date: '21 Aug', gross: 150000, net: 80000 },
  { date: '26 Aug', gross: 350000, net: 180000 },
  { date: '31 Aug', gross: 420000, net: 230000 },
];

export function RevenueOverviewChart() {
  return (
    <div className="h-[250px] w-full mt-4">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={mockRevenueData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
          <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dy={10} />
          <YAxis 
            axisLine={false} 
            tickLine={false} 
            tick={{ fontSize: 12, fill: '#64748b' }} 
            tickFormatter={(value) => value === 0 ? "UGX 0" : `UGX ${(value/1000)}k`} 
          />
          <Tooltip 
            formatter={(value: any) => formatUGX(Number(value))}
            contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
          />
          <Line type="monotone" dataKey="gross" name="Gross revenue" stroke="#16a34a" strokeWidth={2} dot={false} activeDot={{ r: 6 }} fill="url(#colorGross)" />
          <Line type="monotone" dataKey="net" name="Net payout" stroke="#22c55e" strokeWidth={2} strokeDasharray="5 5" dot={false} activeDot={{ r: 6 }} />
          <defs>
            <linearGradient id="colorGross" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#16a34a" stopOpacity={0.1}/>
              <stop offset="95%" stopColor="#16a34a" stopOpacity={0}/>
            </linearGradient>
          </defs>
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

const mockPayoutData = [
  { name: 'Paid to you', value: 5614400, color: '#16a34a' },
  { name: 'Processing', value: 180000, color: '#4ade80' },
  { name: 'On hold', value: 40000, color: '#fde047' },
];

export function PayoutBreakdownChart({ netMinor }: { netMinor: number }) {
  return (
    <div className="relative h-[200px] w-[200px] mx-auto mt-6">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={mockPayoutData}
            cx="50%"
            cy="50%"
            innerRadius={70}
            outerRadius={90}
            paddingAngle={2}
            dataKey="value"
            stroke="none"
          >
            {mockPayoutData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip formatter={(value: any) => formatUGX(Number(value))} />
        </PieChart>
      </ResponsiveContainer>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">UGX</p>
        <p className="text-lg font-extrabold text-slate-900 leading-tight">5,834,400</p>
        <p className="text-[10px] font-semibold text-slate-400">Net payout</p>
      </div>
    </div>
  );
}

export function Sparkline({ data, color }: { data: number[], color: string }) {
  const chartData = data.map((val, i) => ({ val, i }));
  return (
    <div className="h-[40px] w-full mt-2 -mb-2">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData}>
          <Line type="monotone" dataKey="val" stroke={color} strokeWidth={2} dot={false} isAnimationActive={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
