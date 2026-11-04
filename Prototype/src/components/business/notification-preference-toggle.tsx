"use client";
import { useEffect, useState } from "react";
import { Switch } from "@/components/ui/switch";
export function NotificationPreferenceToggle({ preferenceKey, label, demo, defaultEnabled = true }: {preferenceKey:string;label:string;demo:boolean;defaultEnabled?:boolean}) {
  const [enabled,setEnabled]=useState(defaultEnabled);
  const [error,setError]=useState("");
  useEffect(()=>{try{const saved=localStorage.getItem(preferenceKey);setEnabled(saved===null?defaultEnabled:saved!=="off");}catch{setError("This browser could not load the saved preference.");}},[preferenceKey,defaultEnabled]);
  return <div><div className="flex items-center gap-3"><Switch aria-label={label} checked={enabled} disabled={!demo} onCheckedChange={next=>{try{localStorage.setItem(preferenceKey,next?"on":"off");setEnabled(next);setError("");}catch{setError("This browser could not save the preference. Please try again.");}}}/><span className="w-6 text-xs text-muted-foreground">{enabled?"On":"Off"}</span></div>{error&&<p role="alert" className="mt-1 text-xs text-destructive">{error}</p>}</div>;
}
