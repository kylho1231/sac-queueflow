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
 * Default prefix is 'C' (Cashier Regular, e.g. C-001 to C-1000).
 * Senior Citizen prefix is 'S' (Senior Citizen Priority, e.g. S-001 to S-1000).
 * Above 1000, wraps around back to 1.
 */
export function formatTicketNumber(num: number, prefix: string = 'C'): string {
  const normalized = ((Math.max(1, num) - 1) % 1000) + 1;
  const padded = normalized < 1000 ? String(normalized).padStart(3, '0') : '1000';
  return `${prefix}-${padded}`;
}

/**
 * Check if a ticket number or ticket object represents a Senior Citizen.
 */
export function isSeniorCitizenTicket(
  ticketOrNumber?: string | { ticketNumber?: string; isSeniorCitizen?: boolean; ticketType?: string } | null
): boolean {
  if (!ticketOrNumber) return false;
  if (typeof ticketOrNumber === 'string') {
    return ticketOrNumber.startsWith('S-');
  }
  if (ticketOrNumber.isSeniorCitizen || ticketOrNumber.ticketType === 'SENIOR_CITIZEN') {
    return true;
  }
  return ticketOrNumber.ticketNumber?.startsWith('S-') || false;
}

/**
 * Calculate the next sequential ticket number from a tickets array for the specified prefix.
 * 'C' = Regular Cashier Queue (C-001 to C-1000)
 * 'S' = Senior Citizen Priority Queue (S-001 to S-1000)
 */
export function getNextSeqTicketNumber(
  ticketsList: { ticketNumber: string; issuedAt?: string }[],
  prefix: 'C' | 'S' = 'C'
): string {
  if (!ticketsList || ticketsList.length === 0) {
    return `${prefix}-001`;
  }

  // Filter only tickets that match the requested prefix
  const validTickets = ticketsList.filter(
    (t) => t && typeof t.ticketNumber === 'string' && t.ticketNumber.startsWith(`${prefix}-`)
  );

  if (validTickets.length === 0) {
    return `${prefix}-001`;
  }

  // Find the highest sequence number in the list
  let maxNum = 0;
  for (const tkt of validTickets) {
    const match = tkt.ticketNumber.match(/\d+/);
    if (match) {
      const num = parseInt(match[0], 10);
      if (!isNaN(num) && num > maxNum) {
        maxNum = num;
      }
    }
  }

  if (maxNum === 0) {
    return `${prefix}-001`;
  }

  const nextNum = maxNum >= 1000 ? 1 : maxNum + 1;
  return formatTicketNumber(nextNum, prefix);
}
