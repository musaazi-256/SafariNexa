"use client";

import { useEffect, useRef, useState } from "react";
import { MapPin, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { parseLocationPin, type LocationResult } from "@/lib/location";

type Initial = { address?: string; city?: string; latitude?: number | null; longitude?: number | null; locationDirections?: string | null };
export function ListingLocationFields({ initial }: { initial?: Initial }) {
  const [query, setQuery] = useState(initial?.address || "");
  const [city, setCity] = useState(initial?.city || "");
  const [point, setPoint] = useState({ latitude: initial?.latitude == null ? "" : String(initial.latitude), longitude: initial?.longitude == null ? "" : String(initial.longitude) });
  const [results, setResults] = useState<LocationResult[]>([]);
  const [message, setMessage] = useState("");
  const [searching, setSearching] = useState(false);
  const [editing, setEditing] = useState(false);
  const [active, setActive] = useState(-1);
  const input = useRef<HTMLInputElement>(null);
  useEffect(() => {
    input.current?.setCustomValidity(point.latitude !== "" && point.longitude !== "" ? "" : "Select a search result or paste a map pin to fill the coordinates.");
  }, [point]);
  function select(result: LocationResult) {
    setQuery(result.address); setPoint({ latitude: String(result.latitude), longitude: String(result.longitude) });
    if (result.city) setCity(result.city);
    setEditing(false); setResults([]); setActive(-1); setMessage("Location selected. Coordinates filled automatically.");
  }
  useEffect(() => {
    if (!editing || query.trim().length < 3) return;
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const response = await fetch(`/api/locations?q=${encodeURIComponent(query.trim())}`, { signal: controller.signal });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Could not search locations.");
        if (controller.signal.aborted) return;
        if (parseLocationPin(query) || /^https?:\/\//i.test(query)) {
          if (data.results?.[0]) select(data.results[0]);
          else setMessage("No pin found. Try searching the place name.");
        } else { setResults(data.results || []); setMessage(data.results?.length ? "Choose a location below." : "No locations found. Try a nearby landmark or paste a map pin."); }
      } catch (error) {
        if (!controller.signal.aborted) setMessage(error instanceof Error ? error.message : "Location search is unavailable.");
      } finally { if (!controller.signal.aborted) setSearching(false); }
    }, 650);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [query, editing]);
  return <>
    <input type="hidden" name="locationSelectionRequired" value="true" />
    <div className="flex flex-col gap-1.5 sm:col-span-2">
      <Label htmlFor="listingLocation">Location <span className="text-red-500">*</span></Label>
      <p id="location-help" className="text-xs text-muted-foreground">Search a place or paste a map pin link or coordinates. Select a result to fill the latitude and longitude.</p>
      <div className="relative">
        <Search aria-hidden="true" className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" />
        <Input ref={input} id="listingLocation" name="address" value={query} required maxLength={1500} autoComplete="off" className="pl-9" placeholder="Search a location or paste a map pin" role="combobox" aria-autocomplete="list" aria-expanded={results.length > 0} aria-controls="location-results" aria-activedescendant={active >= 0 ? `location-result-${active}` : undefined} aria-describedby="location-help location-status" onChange={event => {
          const value = event.target.value; setQuery(value); setEditing(true); setResults([]); setActive(-1); setMessage(""); setSearching(false);
          const pin = parseLocationPin(value); setPoint(pin ? { latitude: String(pin.latitude), longitude: String(pin.longitude) } : { latitude: "", longitude: "" });
        }} onKeyDown={event => {
          if (event.key === "Escape") { setResults([]); setEditing(false); }
          if (event.key === "ArrowDown" || event.key === "ArrowUp") { event.preventDefault(); setActive(index => results.length ? (index + (event.key === "ArrowDown" ? 1 : -1) + results.length) % results.length : -1); }
          if (event.key === "Enter" && editing) { event.preventDefault(); if (results[active >= 0 ? active : 0]) select(results[active >= 0 ? active : 0]); }
        }} />
        {results.length > 0 && <ul id="location-results" role="listbox" aria-label="Location suggestions" className="absolute z-20 mt-1 max-h-64 w-full overflow-auto rounded-md border bg-popover p-1 shadow-md">
          {results.map((result, index) => <li id={`location-result-${index}`} key={`${result.latitude}-${result.longitude}-${index}`} role="option" aria-selected={index === active} className={`flex cursor-pointer gap-2 rounded-sm p-3 text-sm hover:bg-accent ${index === active ? "bg-accent" : ""}`} onMouseDown={event => event.preventDefault()} onClick={() => { select(result); input.current?.focus(); }}><MapPin aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />{result.address}</li>)}
        </ul>}
      </div>
      <p id="location-status" role="status" className="text-xs text-muted-foreground">{searching ? "Searching locations…" : message}</p>
      <p className="text-xs text-muted-foreground">Location search uses <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer" className="underline">OpenStreetMap</a> data.</p>
    </div>
    <div className="flex flex-col gap-1.5"><Label htmlFor="city">City / town <span className="text-red-500">*</span></Label><Input id="city" name="city" value={city} onChange={event => setCity(event.target.value)} required placeholder="Filled from your selected location" /></div>
    <div className="flex flex-col gap-1.5"><Label htmlFor="locationDirections">Directions / nearby landmark</Label><Input id="locationDirections" name="locationDirections" defaultValue={initial?.locationDirections || ""} maxLength={250} placeholder="e.g. Opposite KFC, next to the main entrance" /><p className="text-xs text-muted-foreground">Add a short description to help guests find you.</p></div>
    <div className="flex flex-col gap-1.5"><Label htmlFor="latitude">Latitude</Label><Input id="latitude" name="latitude" value={point.latitude} readOnly placeholder="Filled automatically" /></div>
    <div className="flex flex-col gap-1.5"><Label htmlFor="longitude">Longitude</Label><Input id="longitude" name="longitude" value={point.longitude} readOnly placeholder="Filled automatically" /></div>
  </>;
}
