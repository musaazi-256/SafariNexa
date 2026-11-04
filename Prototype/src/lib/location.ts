export type LocationResult = { address: string; city?: string; latitude: number; longitude: number };

export function coordinates(latitude: unknown, longitude: unknown) {
  if (latitude == null || longitude == null || String(latitude).trim() === "" || String(longitude).trim() === "") return null;
  const lat = Number(latitude), lon = Number(longitude);
  return Number.isFinite(lat) && Number.isFinite(lon) && Math.abs(lat) <= 90 && Math.abs(lon) <= 180
    ? { latitude: lat, longitude: lon } : null;
}

/** Prefer a place's actual pin over the map camera's @lat,lon viewport. */
export function parseLocationPin(input: string) {
  let text: string;
  try { text = decodeURIComponent(input.trim()); } catch { return null; }
  const pair = (value: string) => {
    const match = value.match(/^\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)\s*$/);
    return match ? coordinates(match[1], match[2]) : null;
  };
  const direct = pair(text);
  if (direct) return direct;
  let url: URL;
  try { url = new URL(text); } catch { return null; }
  if (!isMapUrl(url)) return null;
  const place = text.match(/!3d(-?\d+(?:\.\d+)?)!4d(-?\d+(?:\.\d+)?)/);
  if (place) return coordinates(place[1], place[2]);
  for (const key of ["query", "q", "ll", "destination"]) {
    const value = url.searchParams.get(key);
    if (value && pair(value)) return pair(value);
  }
  const marker = text.match(/(?:@|#map=\d+\/)(-?\d+(?:\.\d+)?)[,/](-?\d+(?:\.\d+)?)/);
  if (marker) return coordinates(marker[1], marker[2]);
  return coordinates(url.searchParams.get("mlat"), url.searchParams.get("mlon"));
}

export function isMapUrl(url: URL) {
  return url.protocol === "https:" && !url.username && !url.password && (!url.port || url.port === "443") &&
    ["maps.app.goo.gl", "goo.gl", "maps.google.com", "www.google.com", "google.com", "maps.apple.com", "www.openstreetmap.org", "openstreetmap.org"].includes(url.hostname);
}
