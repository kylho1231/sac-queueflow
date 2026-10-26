import { QueueTicket, Office, QueueEstimate, TicketStatus } from '@/types/queue';

/**
 * Calculates a realistic waiting time range for a student in a specific office queue.
 * Takes into account:
 * - Number of active service counters (minimum 1 assumed)
 * - Average transaction duration of the office / service
 * - Students currently waiting ahead in chronological sequence
 * - Deferments and paused counters
 */
export function calculateQueueEstimate(
  targetTicket: QueueTicket,
  allOfficeTickets: QueueTicket[],
  office: Office
): QueueEstimate {
  // Count how many tickets are ahead with status 'WAITING'
  const targetIssuedTime = new Date(targetTicket.issuedAt).getTime();

  const waitingAhead = allOfficeTickets.filter((t) => {
    if (t.officeId !== targetTicket.officeId) return false;
    if (t.id === targetTicket.id) return false;
    if (t.status !== 'WAITING') return false;
    
    // Check if issued before our target ticket
    return new Date(t.issuedAt).getTime() < targetIssuedTime;
  });

  const studentsAheadCount = waitingAhead.length;

  const activeCounters = Math.max(1, office.activeCountersCount);
  const avgMinutes = office.averageServiceMinutes || 4;

  if (targetTicket.status === 'SERVING') {
    return {
      studentsAhead: 0,
      estimatedWaitMinutesMin: 0,
      estimatedWaitMinutesMax: 0,
      formattedEstimate: 'Now being served',
      activeCounters,
      isAvailable: true,
    };
  }

  if (targetTicket.status === 'CALLED') {
    return {
      studentsAhead: 0,
      estimatedWaitMinutesMin: 0,
      estimatedWaitMinutesMax: 2,
      formattedEstimate: 'Proceed to counter immediately',
      activeCounters,
      isAvailable: true,
    };
  }

  if (targetTicket.status === 'COMPLETED' || targetTicket.status === 'CANCELLED') {
    return {
      studentsAhead: 0,
      estimatedWaitMinutesMin: 0,
      estimatedWaitMinutesMax: 0,
      formattedEstimate: targetTicket.status.toLowerCase(),
      activeCounters,
      isAvailable: false,
    };
  }

  if (targetTicket.status === 'DEFERRED') {
    return {
      studentsAhead: studentsAheadCount,
      estimatedWaitMinutesMin: 0,
      estimatedWaitMinutesMax: 0,
      formattedEstimate: 'Ticket paused (In class)',
      activeCounters,
      isAvailable: true,
    };
  }

  // Calculation for WAITING state:
  // Total expected queue minutes = (studentsAhead * avgMinutes) / activeCounters
  const baselineMinutes = Math.ceil((studentsAheadCount * avgMinutes) / activeCounters);
  const minWait = Math.max(1, Math.round(baselineMinutes * 0.8));
  const maxWait = Math.max(minWait + 2, Math.round(baselineMinutes * 1.3));

  let formatted = '';
  if (studentsAheadCount === 0) {
    formatted = 'You are next in line (~1–3 mins)';
  } else {
    formatted = `Approximately ${minWait}–${maxWait} mins`;
  }

  return {
    studentsAhead: studentsAheadCount,
    estimatedWaitMinutesMin: minWait,
    estimatedWaitMinutesMax: maxWait,
    formattedEstimate: formatted,
    activeCounters,
    isAvailable: true,
  };
}

/**
 * Returns badge styling classes for queue statuses complying with SAC design tokens
 */
export function getStatusBadgeConfig(status: TicketStatus) {
  switch (status) {
    case 'WAITING':
      return {
        bg: 'bg-amber-50 text-amber-800 border-amber-200',
        dot: 'bg-amber-500',
        label: 'In Queue',
      };
    case 'CALLED':
      return {
        bg: 'bg-rose-50 text-rose-800 border-rose-300 animate-pulse',
        dot: 'bg-rose-600',
        label: 'Now Calling!',
      };
    case 'SERVING':
      return {
        bg: 'bg-emerald-50 text-emerald-800 border-emerald-300',
        dot: 'bg-emerald-600',
        label: 'Serving at Counter',
      };
    case 'DEFERRED':
      return {
        bg: 'bg-blue-50 text-blue-800 border-blue-200',
        dot: 'bg-blue-500',
        label: 'Deferred (In Class)',
      };
    case 'COMPLETED':
      return {
        bg: 'bg-slate-100 text-slate-700 border-slate-200',
        dot: 'bg-slate-400',
        label: 'Completed',
      };
    case 'SKIPPED':
    case 'NO_SHOW':
      return {
        bg: 'bg-zinc-100 text-zinc-700 border-zinc-200',
        dot: 'bg-zinc-400',
        label: status === 'NO_SHOW' ? 'No Show' : 'Skipped',
      };
    case 'CANCELLED':
      return {
        bg: 'bg-red-50 text-red-700 border-red-200',
        dot: 'bg-red-400',
        label: 'Cancelled',
      };
    default:
      return {
        bg: 'bg-slate-100 text-slate-700 border-slate-200',
        dot: 'bg-slate-400',
        label: status,
      };
  }
}
