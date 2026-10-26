import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatMinutes(minutes: number): string {
  if (minutes < 1) return "< 1 min";
  if (minutes === 1) return "1 min";
  if (minutes < 60) return `${minutes} mins`;
  const hrs = Math.floor(minutes / 60);
  const remainingMins = minutes % 60;
  return remainingMins > 0 ? `${hrs}h ${remainingMins}m` : `${hrs}h`;
}

export function generateLookupCode(prefix: string): string {
  const randNum = Math.floor(1000 + Math.random() * 9000);
  return `${prefix}-${randNum}`;
}

export function generateQRToken(ticketNumber: string): string {
  const randomPart = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `SAC-PASS-${ticketNumber}-${randomPart}`;
}

/**
 * Format queue ticket number starting from 1 up to maximum 1000.
 * Examples: 1 -> C-001, 999 -> C-999, 1000 -> C-1000.
 * Above 1000, wraps around back to 1 (C-001).
 */
export function formatTicketNumber(num: number): string {
  const normalized = ((Math.max(1, num) - 1) % 1000) + 1;
  const padded = normalized < 1000 ? String(normalized).padStart(3, '0') : '1000';
  return `C-${padded}`;
}

/**
 * Calculate the next sequential ticket number from a tickets array.
 * Starts at C-001, progresses up to C-1000, and loops back to C-001 after 1000.
 */
export function getNextSeqTicketNumber(ticketsList: { ticketNumber: string; issuedAt?: string }[]): string {
  if (!ticketsList || ticketsList.length === 0) {
    return 'C-001';
  }

  const validTickets = ticketsList.filter(t => t && typeof t.ticketNumber === 'string');
  if (validTickets.length === 0) {
    return 'C-001';
  }

  // Sort by issuedAt descending (newest first)
  const sorted = [...validTickets].sort((a, b) => {
    const timeA = a.issuedAt ? new Date(a.issuedAt).getTime() : 0;
    const timeB = b.issuedAt ? new Date(b.issuedAt).getTime() : 0;
    if (timeA !== timeB) return timeB - timeA;
    return validTickets.indexOf(b) - validTickets.indexOf(a);
  });

  for (const tkt of sorted) {
    const match = tkt.ticketNumber.match(/\d+/);
    if (match) {
      const num = parseInt(match[0], 10);
      if (!isNaN(num) && num >= 1) {
        const nextNum = num >= 1000 ? 1 : num + 1;
        return formatTicketNumber(nextNum);
      }
    }
  }

  return 'C-001';
}
