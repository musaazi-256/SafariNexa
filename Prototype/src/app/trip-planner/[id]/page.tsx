"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, GripVertical, Plus, MapPin, Calendar, Clock } from "lucide-react";

import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export default function TripPlannerBuilder({ params }: { params: { id: string } }) {
  const isNew = params.id === "new";
  const [title, setTitle] = useState(isNew ? "Untitled Itinerary" : "Murchison Falls Safari");

  // Mock days
  const [days, setDays] = useState([
    {
      id: 1,
      title: "Day 1",
      items: [
        { id: 101, time: "09:00 AM", title: "Depart from Kampala", type: "transport" },
        { id: 102, time: "02:00 PM", title: "Check-in at Paraa Safari Lodge", type: "accommodation" },
        { id: 103, time: "04:00 PM", title: "Evening Game Drive", type: "activity" }
      ]
    },
    {
      id: 2,
      title: "Day 2",
      items: [
        { id: 201, time: "06:30 AM", title: "Morning Safari", type: "activity" },
        { id: 202, time: "02:00 PM", title: "Boat Cruise to the Falls", type: "activity" }
      ]
    }
  ]);

  return (
    <div className="min-h-screen bg-muted/20">
      <SiteHeader />
      
      <div className="border-b bg-background">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" asChild>
              <Link href="/trip-planner"><ArrowLeft className="h-4 w-4" /></Link>
            </Button>
            <Input 
              value={title} 
              onChange={(e) => setTitle(e.target.value)} 
              className="text-lg font-bold border-transparent px-0 hover:border-input focus:border-input focus-visible:ring-0 w-80 bg-transparent"
            />
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline">Share</Button>
            <Button>Save Itinerary</Button>
          </div>
        </div>
      </div>

      <main className="container py-8 max-w-4xl">
        <div className="space-y-8">
          {days.map((day) => (
            <div key={day.id} className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold">{day.title}</h2>
                <Button variant="ghost" size="sm"><Plus className="mr-2 h-4 w-4" /> Add Item</Button>
              </div>
              
              <div className="space-y-3">
                {day.items.map((item) => (
                  <Card key={item.id} className="group">
                    <CardContent className="p-4 flex items-center gap-4">
                      <GripVertical className="h-5 w-5 text-muted-foreground cursor-grab opacity-50 group-hover:opacity-100" />
                      <div className="flex w-24 flex-col items-center justify-center rounded-md bg-muted px-2 py-1 text-sm font-medium">
                        {item.time}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">{item.title}</p>
                        <div className="flex items-center text-xs text-muted-foreground mt-1 gap-4">
                          <span className="flex items-center capitalize"><MapPin className="mr-1 h-3 w-3" /> {item.type}</span>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100">Edit</Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))}

          <Button variant="outline" className="w-full border-dashed py-8"><Plus className="mr-2 h-5 w-5" /> Add Another Day</Button>
        </div>
      </main>
    </div>
  );
}
