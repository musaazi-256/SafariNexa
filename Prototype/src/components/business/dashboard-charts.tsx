"use client";
import { formatUGX } from "@/lib/booking";
import { PLATFORM_COMMISSION_RATE } from "@/lib/revenue";


import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Info } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function DashboardCharts({bookingData,revenueData}:{bookingData:Array<{name:string;completed:number;upcoming:number;cancelled:number}>;revenueData:Array<{name:string;amount:number}>}) {
  const completed=bookingData.reduce((s,r)=>s+r.completed,0),upcoming=bookingData.reduce((s,r)=>s+r.upcoming,0),cancelled=bookingData.reduce((s,r)=>s+r.cancelled,0);
  const revenue=revenueData.reduce((s,r)=>s+r.amount,0);
  return (
    <div className="grid gap-6 lg:grid-cols-2 mt-6">
      <Card className="rounded-2xl shadow-card border-slate-100">
        <CardHeader className="flex flex-col items-start justify-between gap-3 pb-2 sm:flex-row sm:items-center">
          <div className="flex flex-wrap items-center gap-2">
            <CardTitle className="text-base font-semibold text-slate-800">Bookings overview</CardTitle>
            <Info className="h-4 w-4 text-muted-foreground" />
          </div>
          <Select defaultValue="this-month">
            <SelectTrigger className="w-[120px] h-8 text-xs font-medium">
              <SelectValue placeholder="Period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="this-month">This month</SelectItem>
            </SelectContent>
          </Select>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-8 mb-6 mt-2">
            <div>
              <p className="text-sm text-slate-500 leading-relaxed">Total bookings</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-2xl font-semibold text-slate-800">{completed+upcoming+cancelled}</span>
                <span className="flex items-center text-xs font-medium text-green-700 bg-green-50 px-1.5 py-0.5 rounded">
                  Recorded
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">this month</p>
            </div>
            
            <div className="flex flex-col gap-2 mt-2 sm:mt-0 text-sm">
              <div className="flex items-center justify-between min-w-[120px]">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-[#0B4928]" />
                  <span className="text-slate-600">Completed</span>
                </div>
                <span className="font-semibold text-slate-900">{completed}</span>
              </div>
              <div className="flex items-center justify-between min-w-[120px]">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-blue-500" />
                  <span className="text-slate-600">Upcoming</span>
                </div>
                <span className="font-semibold text-slate-900">{upcoming}</span>
              </div>
              <div className="flex items-center justify-between min-w-[120px]">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-red-500" />
                  <span className="text-slate-600">Cancelled</span>
                </div>
                <span className="font-semibold text-slate-900">{cancelled}</span>
              </div>
            </div>
          </div>
          
          <div className="h-[200px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={bookingData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                <Tooltip />
                <Line type="monotone" dataKey="completed" stroke="#0B4928" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
                <Line type="monotone" dataKey="upcoming" stroke="#3b82f6" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
                <Line type="monotone" dataKey="cancelled" stroke="#ef4444" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-2xl shadow-card border-slate-100">
        <CardHeader className="flex flex-col items-start justify-between gap-3 pb-2 sm:flex-row sm:items-center">
          <div className="flex flex-wrap items-center gap-2">
            <CardTitle className="text-base font-semibold text-slate-800">Revenue overview</CardTitle>
            <Info className="h-4 w-4 text-muted-foreground" />
          </div>
          <Select defaultValue="this-month">
            <SelectTrigger className="w-[120px] h-8 text-xs font-medium">
              <SelectValue placeholder="Period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="this-month">This month</SelectItem>
            </SelectContent>
          </Select>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-8 mb-6 mt-2">
            <div>
              <p className="text-sm text-slate-500 leading-relaxed">Total revenue</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-2xl font-semibold text-slate-800">{formatUGX(revenue)}</span>
              </div>
              <div className="flex items-center gap-1.5 mt-1">
                <span className="flex items-center text-xs font-medium text-green-700 bg-green-50 px-1.5 py-0.5 rounded">
                  Recorded
                </span>
                <span className="text-xs text-slate-500">this month</span>
              </div>
            </div>
            
            <div className="flex flex-col justify-center gap-3">
              <div>
                <p className="text-xs text-slate-500">Net revenue</p>
                <p className="text-sm font-semibold text-slate-900 mt-0.5 leading-relaxed">{formatUGX(Math.round(revenue*(1-PLATFORM_COMMISSION_RATE)))}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Commission</p>
                <p className="text-sm font-semibold text-slate-900 mt-0.5 leading-relaxed">{formatUGX(Math.round(revenue*PLATFORM_COMMISSION_RATE))}</p>
              </div>
            </div>
          </div>

          <div className="h-[200px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={revenueData} margin={{ top: 5, right: 5, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dy={10} />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 12, fill: '#64748b' }}
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
