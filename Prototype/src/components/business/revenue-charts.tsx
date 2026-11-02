"use client";
import { LineChart,Line,XAxis,YAxis,CartesianGrid,Tooltip,ResponsiveContainer } from "recharts";
import { formatUGX } from "@/lib/booking";
export function RevenueOverviewChart({data}:{data:Array<{date:string;gross:number;net:number}>}){
 if(!data.length)return <p className="py-10 text-sm text-muted-foreground">No confirmed payment history yet.</p>;
 return <div className="mt-4 h-64 min-w-0 w-full" role="img" aria-label="Recorded gross collections and estimated net earnings over time. Exact booking shares are available in the table below."><ResponsiveContainer width="100%" height="100%"><LineChart data={data} margin={{top:5,right:10,left:0,bottom:5}}><CartesianGrid strokeDasharray="3 3"/><XAxis dataKey="date" tick={{fontSize:11}}/><YAxis width={60} tick={{fontSize:10}} tickFormatter={v=>`${v/1000}k`}/><Tooltip formatter={v=>formatUGX(Number(v))}/><Line dataKey="gross" name="Collected" stroke="#087a3e"/><Line dataKey="net" name="Estimated net" stroke="#4a8460" strokeDasharray="5 5"/></LineChart></ResponsiveContainer></div>;
}
