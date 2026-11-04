import { isMapUrl, parseLocationPin } from "./location";
test("reads coordinate pairs including zero and rejects invalid ranges", () => {
  expect(parseLocationPin("0, 32.5")).toEqual({latitude:0,longitude:32.5});
  for (const value of ["91, 32", "0, 181", "NaN, 3", "hello", "https://example.com/?q=0,32"]) expect(parseLocationPin(value)).toBeNull();
});
test("reads Google, Apple, OSM pins and prefers place coordinates to the viewport", () => {
  expect(parseLocationPin("https://www.google.com/maps/place/KFC/@0.3,32.5,15z/data=!3d0.35!4d32.6")).toEqual({latitude:0.35,longitude:32.6});
  for (const value of ["https://maps.google.com/?q=0.35%2C32.6", "https://maps.apple.com/?ll=0.35,32.6", "https://www.openstreetmap.org/?mlat=0.35&mlon=32.6", "https://www.openstreetmap.org/#map=18/0.35/32.6"]) expect(parseLocationPin(value)).toEqual({latitude:0.35,longitude:32.6});
});
test("allows only secure map hosts without credentials or custom ports", () => {
  for (const value of ["http://google.com", "https://google.com.evil.com", "https://user:pass@google.com", "https://google.com:8080"]) expect(isMapUrl(new URL(value))).toBe(false);
});
