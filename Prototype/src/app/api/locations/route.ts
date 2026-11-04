import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { coordinates, isMapUrl, parseLocationPin, type LocationResult } from "@/lib/location";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user || !session.user.businessIds?.length) return NextResponse.json({ error: "Sign in to a business account to search locations." }, { status: 401 });
  const query = request.nextUrl.searchParams.get("q")?.trim() || "";
  if (query.length < 3 || query.length > 1500) return NextResponse.json({ error: "Enter a location or map pin (3–1500 characters)." }, { status: 400 });
  try {
    let pin = parseLocationPin(query);
    if (!pin && /^https?:\/\//i.test(query)) {
      let url = new URL(query);
      // Resolve only known map providers, validating every redirect before fetching.
      for (let step = 0; step < 5; step++) {
        if (!isMapUrl(url)) throw new Error("Use a Google Maps, Apple Maps, or OpenStreetMap pin.");
        const response = await fetch(url, { redirect: "manual", signal: AbortSignal.timeout(6000) });
        const location = response.headers.get("location");
        await response.body?.cancel();
        if (!location) break;
        url = new URL(location, url);
        if (!isMapUrl(url)) throw new Error("This map link redirects to an unsupported provider.");
        pin = parseLocationPin(url.href);
        if (pin) break;
      }
      if (!pin) return NextResponse.json({ error: "This link has no readable pin. Copy the location’s coordinates from the map and paste them here." }, { status: 422 });
    }
    const endpoint = new URL(pin ? "/reverse" : "/api", process.env.PHOTON_BASE_URL || "https://photon.komoot.io");
    endpoint.searchParams.set("limit", "5");
    endpoint.searchParams.set("lang", "en");
    if (pin) { endpoint.searchParams.set("lat", String(pin.latitude)); endpoint.searchParams.set("lon", String(pin.longitude)); }
    else { endpoint.searchParams.set("q", query); endpoint.searchParams.set("lat", "0.3476"); endpoint.searchParams.set("lon", "32.5825"); }
    let results: LocationResult[] = [];
    try {
      const response = await fetch(endpoint, { next: { revalidate: 86400 }, signal: AbortSignal.timeout(8000) });
      if (!response.ok) throw new Error("Location search is unavailable. Try again or paste coordinates.");
      const data = await response.json();
      results = (data.features || []).flatMap((feature: { geometry?: { coordinates?: number[] }; properties?: Record<string, string> }) => {
        const point = coordinates(feature.geometry?.coordinates?.[1], feature.geometry?.coordinates?.[0]);
        if (!point) return [];
        const p = feature.properties || {};
        const address = Array.from(new Set([p.name, [p.housenumber, p.street].filter(Boolean).join(" "), p.city || p.town || p.village, p.state, p.country].filter(Boolean))).join(", ");
        return [{ ...point, address: address || `${point.latitude}, ${point.longitude}`, city: p.city || p.town || p.village }];
      });
    } catch (error) { if (!pin) throw error; }
    if (pin) results = [{ ...pin, address: results[0]?.address || `${pin.latitude}, ${pin.longitude}`, city: results[0]?.city }];
    return NextResponse.json({ results });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Location search is unavailable. Try again." }, { status: 502 });
  }
}
