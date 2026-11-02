export function dailyOpeningWindow(value: unknown): {open:number;close:number}|null {
  const summary = value && typeof value === "object" && "summary" in value ? String(value.summary) : "";
  const match = summary.match(/^daily\s*[·:]?\s*(\d{1,2}):(\d{2})\s*[-–]\s*(\d{1,2}):(\d{2})$/i);
  if(!match)return null;
  const open=Number(match[1])*60+Number(match[2]),close=Number(match[3])*60+Number(match[4]);
  if(Number(match[1])>23||Number(match[3])>23||Number(match[2])>59||Number(match[4])>59||close<=open)return null;
  return {open,close};
}
export function transportIsPerPerson(model?:string|null) {
  return /^PER_PERSON:/i.test(model??"") || /per\s+(person|passenger)/i.test(model??"");
}
