"use client";

import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Info } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const bookingData = [
  { name: 'May 1', completed: 20, upcoming: 10, cancelled: 2 },
  { name: 'May 8', completed: 35, upcoming: 15, cancelled: 5 },
  { name: 'May 15', completed: 40, upcoming: 20, cancelled: 3 },
  { name: 'May 22', completed: 35, upcoming: 25, cancelled: 4 },
  { name: 'May 31', completed: 45, upcoming: 20, cancelled: 6 },
];

const revenueData = [
  { name: 'May 1', amount: 150000 },
  { name: 'May 4', amount: 200000 },
  { name: 'May 8', amount: 260000 },
  { name: 'May 11', amount: 210000 },
  { name: 'May 15', amount: 120000 },
  { name: 'May 18', amount: 110000 },
  { name: 'May 22', amount: 230000 },
  { name: 'May 25', amount: 310000 },
  { name: 'May 28', amount: 140000 },
  { name: 'May 31', amount: 350000 },
];

export function DashboardCharts() {
  return (
    <div className="grid gap-6 lg:grid-cols-2 mt-6">
      <Card className="rounded-2xl shadow-sm border-slate-100">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div className="flex items-center gap-2">
            <CardTitle className="text-base font-bold text-slate-900">Bookings overview</CardTitle>
            <Info className="h-4 w-4 text-muted-foreground" />
          </div>
          <Select defaultValue="this-month">
            <SelectTrigger className="w-[120px] h-8 text-xs font-medium">
              <SelectValue placeholder="Period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="this-month">This month</SelectItem>
              <SelectItem value="last-month">Last month</SelectItem>
            </SelectContent>
          </Select>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-8 mb-6 mt-2">
            <div>
              <p className="text-sm text-slate-500">Total bookings</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-2xl font-bold text-slate-900">124</span>
                <span className="flex items-center text-xs font-semibold text-green-700 bg-green-50 px-1.5 py-0.5 rounded">
                  ↑ 22%
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">vs last month</p>
            </div>
            
            <div className="flex flex-col gap-2 mt-2 sm:mt-0 text-sm">
              <div className="flex items-center justify-between min-w-[120px]">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-[#0B4928]" />
                  <span className="text-slate-600">Completed</span>
                </div>
                <span className="font-semibold text-slate-900">96</span>
              </div>
              <div className="flex items-center justify-between min-w-[120px]">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-blue-500" />
                  <span className="text-slate-600">Upcoming</span>
                </div>
                <span className="font-semibold text-slate-900">20</span>
              </div>
              <div className="flex items-center justify-between min-w-[120px]">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-red-500" />
                  <span className="text-slate-600">Cancelled</span>
                </div>
                <span className="font-semibold text-slate-900">8</span>
              </div>
            </div>
          </div>
          
          <div className="h-[200px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={bookingData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} />
                <Tooltip />
                <Line type="monotone" dataKey="completed" stroke="#0B4928" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
                <Line type="monotone" dataKey="upcoming" stroke="#3b82f6" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
                <Line type="monotone" dataKey="cancelled" stroke="#ef4444" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-2xl shadow-sm border-slate-100">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div className="flex items-center gap-2">
            <CardTitle className="text-base font-bold text-slate-900">Revenue overview</CardTitle>
            <Info className="h-4 w-4 text-muted-foreground" />
          </div>
          <Select defaultValue="this-month">
            <SelectTrigger className="w-[120px] h-8 text-xs font-medium">
              <SelectValue placeholder="Period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="this-month">This month</SelectItem>
              <SelectItem value="last-month">Last month</SelectItem>
            </SelectContent>
          </Select>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-8 mb-6 mt-2">
            <div>
              <p className="text-sm text-slate-500">Total revenue</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-2xl font-bold text-slate-900">UGX 995,000</span>
              </div>
              <div className="flex items-center gap-1.5 mt-1">
                <span className="flex items-center text-xs font-semibold text-green-700 bg-green-50 px-1.5 py-0.5 rounded">
                  ↑ 18.6%
                </span>
                <span className="text-xs text-slate-500">vs last month</span>
              </div>
            </div>
            
            <div className="flex flex-col justify-center gap-3">
              <div>
                <p className="text-xs text-slate-500">Net revenue</p>
                <p className="text-sm font-semibold text-slate-900 mt-0.5">UGX 865,650</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Commission</p>
                <p className="text-sm font-semibold text-slate-900 mt-0.5">UGX 129,350</p>
              </div>
            </div>
          </div>

          <div className="h-[200px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={revenueData} margin={{ top: 5, right: 5, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} dy={10} />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fill: '#64748b' }} 
                  tickFormatter={(value) => `${value / 1000}K`}
                />
                <Tooltip formatter={(value: any) => `UGX ${Number(value).toLocaleString()}`} />
                <Bar dataKey="amount" fill="#0B4928" radius={[2, 2, 0, 0]} barSize={16} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
