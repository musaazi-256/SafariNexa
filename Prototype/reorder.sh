#!/bin/bash
FILE="src/components/rooms/reservation-fields.tsx"

# We'll use a Node script to cleanly reorder the JSX elements
node -e '
const fs = require("fs");
let content = fs.readFileSync("src/components/rooms/reservation-fields.tsx", "utf8");

// The main return block starts with <div id="reservation-card"
const startIdx = content.indexOf("<div id=\"reservation-card\"");
if (startIdx === -1) process.exit(1);

// We want to reorder the chunks inside the reservation card.
// Let us identify the chunks using regex.

// 1. Check-in/Check-out dates (lines 166-195)
const datesMatch = content.match(/<div className="grid grid-cols-2 gap-3">[\s\S]*?<\/div>\n\s*<\/div>/);

// 2. Guests (lines 197-213)
const guestsMatch = content.match(/<div className="flex flex-col gap-1">\n\s*<label className="text-xs font-semibold text-muted-foreground">Guests<\/label>[\s\S]*?<\/div>\n\s*<\/div>/);

// 3. Room type (lines 215-271)
const roomTypeMatch = content.match(/\{roomTypes\.length > 0 \? \([\s\S]*?\) : null\}/);

// 4. Availability Calendar (line 273)
const calendarMatch = content.match(/\{mode === "link" && selectedRoom \? <AvailabilityCalendar[^>]+> : null\}/);

// 5. Add-ons (lines 275-304)
const addonsMatch = content.match(/\{addOns\.length > 0 \? \([\s\S]*?\) : null\}/);

if (!datesMatch || !guestsMatch || !roomTypeMatch || !calendarMatch) {
  console.log("Could not find all chunks!");
  process.exit(1);
}

// Remove them from the content
let newContent = content
  .replace(datesMatch[0], "<!-- DATES_CHUNK -->")
  .replace(guestsMatch[0], "<!-- GUESTS_CHUNK -->")
  .replace(roomTypeMatch[0], "<!-- ROOMTYPE_CHUNK -->")
  .replace(calendarMatch[0], "<!-- CALENDAR_CHUNK -->")
  .replace(addonsMatch[0], "<!-- ADDONS_CHUNK -->");

// Now we want to insert them in the new order:
// Room type -> Guests -> Addons -> Calendar -> Dates

const newOrder = [
  roomTypeMatch[0],
  guestsMatch[0],
  addonsMatch[0],
  calendarMatch[0],
  datesMatch[0]
].join("\n\n      ");

// Find the start of the reservation card content
// The original order had Dates -> Guests -> RoomType -> Calendar -> Addons
// So the first placeholder should be DATES_CHUNK
const replacePattern = /<!-- DATES_CHUNK -->\s*<!-- GUESTS_CHUNK -->\s*<!-- ROOMTYPE_CHUNK -->\s*<!-- CALENDAR_CHUNK -->\s*<!-- ADDONS_CHUNK -->/;

newContent = newContent.replace(replacePattern, newOrder);

// Write back
fs.writeFileSync("src/components/rooms/reservation-fields.tsx", newContent);
console.log("Reordered successfully.");
'
