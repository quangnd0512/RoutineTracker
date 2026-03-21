// Convert a Date object to a local YYYY-MM-DD string using device timezone
export function toLocalDateString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Return today's date as a local YYYY-MM-DD string
export function todayLocalDateString(): string {
  return toLocalDateString(new Date());
}

// Convert a local YYYY-MM-DD string to a UTC ISO range [start, end) covering that entire local day
export function localDateToUTCRange(localDateStr: string): { start: string; end: string } {
  const [year, month, day] = localDateStr.split('-').map(Number);
  const start = new Date(year, month - 1, day).toISOString();
  const end = new Date(year, month - 1, day + 1).toISOString();
  return { start, end };
}

// Convert a UTC ISO string to a local YYYY-MM-DD string
export function utcToLocalDateString(isoUtc: string): string {
  return toLocalDateString(new Date(isoUtc));
}
