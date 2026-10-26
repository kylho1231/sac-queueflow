import { NextRequest, NextResponse } from 'next/server';
import { INITIAL_CASHIER_TICKETS, CASHIER_COUNTERS } from '@/lib/cashier-data';
import { QueueTicket, ServiceCounter } from '@/types/queue';
import { ActiveCallNotification, WindowNumber } from '@/context/CashierQueueContext';
import { getNextSeqTicketNumber, formatTicketNumber, isSeniorCitizenTicket } from '@/lib/utils';
import fs from 'fs';
import path from 'path';

interface ServerQueueState {
  tickets: QueueTicket[];
  counters: ServiceCounter[];
  latestCallNotification: ActiveCallNotification | null;
  lastUpdated: number;
}

// In-memory global state for serverless lifetime
declare global {
  // eslint-disable-next-line no-var
  var __SAC_SERVER_QUEUE_STATE: ServerQueueState | undefined;
}

const TMP_FILE_PATH = path.join('/tmp', 'sac_queue_state.json');

function getInitialState(): ServerQueueState {
  return {
    tickets: JSON.parse(JSON.stringify(INITIAL_CASHIER_TICKETS)),
    counters: JSON.parse(JSON.stringify(CASHIER_COUNTERS)),
    latestCallNotification: {
      id: 'init-c002',
      ticketNumber: 'C-002',
      windowNumber: 2,
      studentName: 'Ticket C-002',
      calledAt: new Date().toISOString(),
      isRecall: false,
    },
    lastUpdated: 0,
  };
}

function loadState(): ServerQueueState {
  if (globalThis.__SAC_SERVER_QUEUE_STATE) {
    return globalThis.__SAC_SERVER_QUEUE_STATE;
  }

  try {
    if (fs.existsSync(TMP_FILE_PATH)) {
      const data = fs.readFileSync(TMP_FILE_PATH, 'utf-8');
      const parsed = JSON.parse(data);
      globalThis.__SAC_SERVER_QUEUE_STATE = parsed;
      return parsed;
    }
  } catch {}

  const initial = getInitialState();
  globalThis.__SAC_SERVER_QUEUE_STATE = initial;
  return initial;
}

function saveState(state: ServerQueueState) {
  state.lastUpdated = Date.now();
  globalThis.__SAC_SERVER_QUEUE_STATE = state;
  try {
    fs.writeFileSync(TMP_FILE_PATH, JSON.stringify(state), 'utf-8');
  } catch {}
}

export async function GET() {
  const state = loadState();
  return NextResponse.json(state, {
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
    },
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const state = loadState();
    const action = body.action as string;
    const nowIso = new Date().toISOString();

    // 1. Direct state sync from client (guarantees zero divergence between cashier & server)
    if (action === 'SYNC_CLIENT_STATE' || (body.tickets && Array.isArray(body.tickets))) {
      if (body.tickets && Array.isArray(body.tickets)) {
        state.tickets = body.tickets;
      }
      if (body.counters && Array.isArray(body.counters)) {
        state.counters = body.counters;
      }
      if ('latestCallNotification' in body) {
        state.latestCallNotification = body.latestCallNotification ?? null;
      }
      saveState(state);
      return NextResponse.json({ success: true, state });
    }

    if (action === 'CALL_NEXT') {
      const counterNumber = (body.counterNumber || 1) as WindowNumber;
      const counter = state.counters.find((c) => c.counterNumber === counterNumber);
      const isSeniorRequest = body.isSeniorCitizen || body.preference === 'SENIOR_CITIZEN';

      // Check for waiting tickets
      const waitingList = state.tickets
        .filter((t) => t.status === 'WAITING')
        .sort((a, b) => new Date(a.issuedAt).getTime() - new Date(b.issuedAt).getTime());

      let nextTicket: QueueTicket;

      if (isSeniorRequest) {
        const waitingSenior = waitingList.find((t) => isSeniorCitizenTicket(t));
        if (waitingSenior) {
          nextTicket = waitingSenior;
        } else {
          // Auto-generate the next sequential Senior Citizen number (S-001 to S-1000)
          const nextNum = getNextSeqTicketNumber(state.tickets, 'S');
          nextTicket = {
            id: `tkt-senior-${Date.now()}`,
            ticketNumber: nextNum,
            officeId: 'off-cashier',
            serviceId: 'srv-exam-period-payment',
            studentId: `senior-${Date.now()}`,
            studentName: `Senior Citizen (${nextNum})`,
            isWalkIn: true,
            qrToken: `SAC-PASS-${nextNum}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
            lookupCode: `${nextNum}-${Math.floor(1000 + Math.random() * 9000)}`,
            status: 'WAITING',
            issuedAt: nowIso,
            defermentCount: 0,
            maxDefermentsAllowed: 1,
            isSeniorCitizen: true,
            ticketType: 'SENIOR_CITIZEN',
            notes: 'Priority Lane • Senior Citizen',
          };
          state.tickets.push(nextTicket);
        }
      } else if (body.preference === 'REGULAR') {
        const waitingRegular = waitingList.find((t) => !isSeniorCitizenTicket(t));
        if (waitingRegular) {
          nextTicket = waitingRegular;
        } else {
          const nextNum = getNextSeqTicketNumber(state.tickets, 'C');
          nextTicket = {
            id: `tkt-csh-${Date.now()}`,
            ticketNumber: nextNum,
            officeId: 'off-cashier',
            serviceId: 'srv-exam-period-payment',
            studentId: `walkin-${Date.now()}`,
            studentName: `Ticket ${nextNum}`,
            isWalkIn: true,
            qrToken: `SAC-PASS-${nextNum}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
            lookupCode: `${nextNum}-${Math.floor(1000 + Math.random() * 9000)}`,
            status: 'WAITING',
            issuedAt: nowIso,
            defermentCount: 0,
            maxDefermentsAllowed: 1,
            isSeniorCitizen: false,
            ticketType: 'REGULAR',
          };
          state.tickets.push(nextTicket);
        }
      } else {
        if (waitingList.length > 0) {
          nextTicket = waitingList[0];
        } else {
          // Auto-generate the next sequential regular number (C-001 to C-1000)
          const nextNum = getNextSeqTicketNumber(state.tickets, 'C');
          nextTicket = {
            id: `tkt-csh-${Date.now()}`,
            ticketNumber: nextNum,
            officeId: 'off-cashier',
            serviceId: 'srv-exam-period-payment',
            studentId: `walkin-${Date.now()}`,
            studentName: `Ticket ${nextNum}`,
            isWalkIn: true,
            qrToken: `SAC-PASS-${nextNum}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
            lookupCode: `${nextNum}-${Math.floor(1000 + Math.random() * 9000)}`,
            status: 'WAITING',
            issuedAt: nowIso,
            defermentCount: 0,
            maxDefermentsAllowed: 1,
            isSeniorCitizen: false,
            ticketType: 'REGULAR',
          };
          state.tickets.push(nextTicket);
        }
      }

      // Mark the ticket as CALLED, and complete any prior ticket on this counter
      state.tickets = state.tickets.map((t) => {
        if (t.assignedCounterNumber === counterNumber && t.id !== nextTicket.id && (t.status === 'CALLED' || t.status === 'SERVING')) {
          return {
            ...t,
            status: 'COMPLETED' as const,
            completedAt: nowIso,
          };
        }
        if (t.id === nextTicket.id) {
          return {
            ...t,
            status: 'CALLED' as const,
            calledAt: nowIso,
            assignedCounterId: counter?.id || `cnt-csh-${counterNumber}`,
            assignedCounterNumber: counterNumber,
          };
        }
        return t;
      });

      // Update counter status
      state.counters = state.counters.map((c) => {
        if (c.counterNumber === counterNumber) {
          return {
            ...c,
            currentTicketId: nextTicket.id,
            statusText: `Calling ${nextTicket.ticketNumber}`,
          };
        }
        return c;
      });

      const isSenior = isSeniorCitizenTicket(nextTicket);
      const callNotif: ActiveCallNotification = {
        id: `call-${nextTicket.id}-${Date.now()}`,
        ticketNumber: nextTicket.ticketNumber,
        windowNumber: counterNumber,
        studentName: nextTicket.studentName,
        calledAt: nowIso,
        isRecall: false,
        isSeniorCitizen: isSenior,
      };

      state.latestCallNotification = callNotif;
      saveState(state);

      return NextResponse.json({ success: true, state, calledTicket: nextTicket });
    }

    if (action === 'COMPLETE_AND_CALL_NEXT') {
      const { ticketId, counterNumber = 1, isSeniorCitizen, preference } = body;
      const counterNum = counterNumber as WindowNumber;
      const counter = state.counters.find((c) => c.counterNumber === counterNum);
      const isSeniorRequest = isSeniorCitizen || preference === 'SENIOR_CITIZEN';

      // 1. Complete existing ticket if provided
      if (ticketId) {
        state.tickets = state.tickets.map((t) => {
          if (t.id === ticketId) {
            return { ...t, status: 'COMPLETED' as const, completedAt: nowIso };
          }
          return t;
        });
      }

      // 2. Find next waiting or auto-generate
      const waitingList = state.tickets
        .filter((t) => t.status === 'WAITING')
        .sort((a, b) => new Date(a.issuedAt).getTime() - new Date(b.issuedAt).getTime());

      let nextTicket: QueueTicket;

      if (isSeniorRequest) {
        const waitingSenior = waitingList.find((t) => isSeniorCitizenTicket(t));
        if (waitingSenior) {
          nextTicket = waitingSenior;
        } else {
          const nextNum = getNextSeqTicketNumber(state.tickets, 'S');
          nextTicket = {
            id: `tkt-senior-${Date.now()}`,
            ticketNumber: nextNum,
            officeId: 'off-cashier',
            serviceId: 'srv-exam-period-payment',
            studentId: `senior-${Date.now()}`,
            studentName: `Senior Citizen (${nextNum})`,
            isWalkIn: true,
            qrToken: `SAC-PASS-${nextNum}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
            lookupCode: `${nextNum}-${Math.floor(1000 + Math.random() * 9000)}`,
            status: 'WAITING',
            issuedAt: nowIso,
            defermentCount: 0,
            maxDefermentsAllowed: 1,
            isSeniorCitizen: true,
            ticketType: 'SENIOR_CITIZEN',
            notes: 'Priority Lane • Senior Citizen',
          };
          state.tickets.push(nextTicket);
        }
      } else if (body.preference === 'REGULAR') {
        const waitingRegular = waitingList.find((t) => !isSeniorCitizenTicket(t));
        if (waitingRegular) {
          nextTicket = waitingRegular;
        } else {
          const nextNum = getNextSeqTicketNumber(state.tickets, 'C');
          nextTicket = {
            id: `tkt-csh-${Date.now()}`,
            ticketNumber: nextNum,
            officeId: 'off-cashier',
            serviceId: 'srv-exam-period-payment',
            studentId: `walkin-${Date.now()}`,
            studentName: `Ticket ${nextNum}`,
            isWalkIn: true,
            qrToken: `SAC-PASS-${nextNum}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
            lookupCode: `${nextNum}-${Math.floor(1000 + Math.random() * 9000)}`,
            status: 'WAITING',
            issuedAt: nowIso,
            defermentCount: 0,
            maxDefermentsAllowed: 1,
            isSeniorCitizen: false,
            ticketType: 'REGULAR',
          };
          state.tickets.push(nextTicket);
        }
      } else {
        if (waitingList.length > 0) {
          nextTicket = waitingList[0];
        } else {
          const nextNum = getNextSeqTicketNumber(state.tickets, 'C');
          nextTicket = {
            id: `tkt-csh-${Date.now()}`,
            ticketNumber: nextNum,
            officeId: 'off-cashier',
            serviceId: 'srv-exam-period-payment',
            studentId: `walkin-${Date.now()}`,
            studentName: `Ticket ${nextNum}`,
            isWalkIn: true,
            qrToken: `SAC-PASS-${nextNum}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
            lookupCode: `${nextNum}-${Math.floor(1000 + Math.random() * 9000)}`,
            status: 'WAITING',
            issuedAt: nowIso,
            defermentCount: 0,
            maxDefermentsAllowed: 1,
            isSeniorCitizen: false,
            ticketType: 'REGULAR',
          };
          state.tickets.push(nextTicket);
        }
      }

      // 3. Mark next ticket as CALLED, and complete any prior ticket on this counter
      state.tickets = state.tickets.map((t) => {
        if (t.assignedCounterNumber === counterNum && t.id !== nextTicket.id && (t.status === 'CALLED' || t.status === 'SERVING')) {
          return {
            ...t,
            status: 'COMPLETED' as const,
            completedAt: nowIso,
          };
        }
        if (t.id === nextTicket.id) {
          return {
            ...t,
            status: 'CALLED' as const,
            calledAt: nowIso,
            assignedCounterId: counter?.id || `cnt-csh-${counterNum}`,
            assignedCounterNumber: counterNum,
          };
        }
        return t;
      });

      state.counters = state.counters.map((c) => {
        if (c.counterNumber === counterNum) {
          return {
            ...c,
            currentTicketId: nextTicket.id,
            statusText: `Calling ${nextTicket.ticketNumber}`,
          };
        }
        return c;
      });

      const isSenior = isSeniorCitizenTicket(nextTicket);
      const callNotif: ActiveCallNotification = {
        id: `call-${nextTicket.id}-${Date.now()}`,
        ticketNumber: nextTicket.ticketNumber,
        windowNumber: counterNum,
        studentName: nextTicket.studentName,
        calledAt: nowIso,
        isRecall: false,
        isSeniorCitizen: isSenior,
      };

      state.latestCallNotification = callNotif;
      saveState(state);

      return NextResponse.json({ success: true, state, calledTicket: nextTicket });
    }

    if (action === 'COMPLETE') {
      const { ticketId } = body;
      state.tickets = state.tickets.map((t) => {
        if (t.id === ticketId) {
          return { ...t, status: 'COMPLETED' as const, completedAt: nowIso };
        }
        return t;
      });
      state.counters = state.counters.map((c) => {
        if (c.currentTicketId === ticketId) {
          return { ...c, currentTicketId: undefined, statusText: 'Available' };
        }
        return c;
      });
      saveState(state);
      return NextResponse.json({ success: true, state });
    }

    if (action === 'RECALL') {
      const { ticketId, counterNumber = 1 } = body;
      const tkt = state.tickets.find((t) => t.id === ticketId);
      if (tkt) {
        const isSenior = isSeniorCitizenTicket(tkt);
        const callNotif: ActiveCallNotification = {
          id: `recall-${tkt.id}-${Date.now()}`,
          ticketNumber: tkt.ticketNumber,
          windowNumber: (tkt.assignedCounterNumber || counterNumber) as WindowNumber,
          studentName: tkt.studentName,
          calledAt: nowIso,
          isRecall: true,
          isSeniorCitizen: isSenior,
        };
        state.latestCallNotification = callNotif;
        saveState(state);
      }
      return NextResponse.json({ success: true, state });
    }

    if (action === 'SKIP' || action === 'NO_SHOW') {
      const { ticketId, counterNumber, callNext = true } = body;
      const targetStatus = action === 'SKIP' ? ('SKIPPED' as const) : ('NO_SHOW' as const);

      state.tickets = state.tickets.map((t) => {
        if (t.id === ticketId) {
          return { ...t, status: targetStatus };
        }
        return t;
      });

      // If callNext is requested, immediately summon the next ticket
      if (callNext && counterNumber) {
        const counterNum = counterNumber as WindowNumber;
        const counter = state.counters.find((c) => c.counterNumber === counterNum);
        let nextTicket = state.tickets
          .filter((t) => t.status === 'WAITING')
          .sort((a, b) => new Date(a.issuedAt).getTime() - new Date(b.issuedAt).getTime())[0];

        if (!nextTicket) {
          const nextNum = getNextSeqTicketNumber(state.tickets);
          nextTicket = {
            id: `tkt-csh-${Date.now()}`,
            ticketNumber: nextNum,
            officeId: 'off-cashier',
            serviceId: 'srv-exam-period-payment',
            studentId: `walkin-${Date.now()}`,
            studentName: `Ticket ${nextNum}`,
            isWalkIn: true,
            qrToken: `SAC-PASS-${nextNum}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
            lookupCode: `${nextNum}-${Math.floor(1000 + Math.random() * 9000)}`,
            status: 'WAITING',
            issuedAt: nowIso,
            defermentCount: 0,
            maxDefermentsAllowed: 1,
          };
          state.tickets.push(nextTicket);
        }

        state.tickets = state.tickets.map((t) => {
          if (t.id === nextTicket.id) {
            return {
              ...t,
              status: 'CALLED' as const,
              calledAt: nowIso,
              assignedCounterId: counter?.id || `cnt-csh-${counterNum}`,
              assignedCounterNumber: counterNum,
            };
          }
          return t;
        });

        state.counters = state.counters.map((c) => {
          if (c.counterNumber === counterNum) {
            return {
              ...c,
              currentTicketId: nextTicket.id,
              statusText: `Calling ${nextTicket.ticketNumber}`,
            };
          }
          return c;
        });

        const callNotif: ActiveCallNotification = {
          id: `call-${nextTicket.id}-${Date.now()}`,
          ticketNumber: nextTicket.ticketNumber,
          windowNumber: counterNum,
          studentName: nextTicket.studentName,
          calledAt: nowIso,
          isRecall: false,
        };
        state.latestCallNotification = callNotif;
      }

      saveState(state);
      return NextResponse.json({ success: true, state });
    }

    if (action === 'START_SERVING') {
      const { ticketId } = body;
      state.tickets = state.tickets.map((t) => {
        if (t.id === ticketId) {
          return { ...t, status: 'SERVING' as const, serviceStartedAt: nowIso };
        }
        return t;
      });
      saveState(state);
      return NextResponse.json({ success: true, state });
    }

    if (action === 'ADD_TICKET') {
      const isSenior = Boolean(body.isSeniorCitizen);
      const prefix = isSenior ? 'S' : 'C';
      const nextNum = getNextSeqTicketNumber(state.tickets, prefix);
      const defaultName = isSenior ? `Senior Citizen (${nextNum})` : `Ticket ${nextNum}`;
      const newTicket: QueueTicket = {
        id: `tkt-${prefix.toLowerCase()}-${Date.now()}`,
        ticketNumber: nextNum,
        officeId: 'off-cashier',
        serviceId: body.serviceId || 'srv-exam-period-payment',
        studentId: `${isSenior ? 'senior' : 'walkin'}-${Date.now()}`,
        studentName: body.studentName || defaultName,
        studentNumber: body.studentNumber || (isSenior ? 'SC-PRIORITY' : ''),
        isWalkIn: true,
        qrToken: `SAC-PASS-${nextNum}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
        lookupCode: `${nextNum}-${Math.floor(1000 + Math.random() * 9000)}`,
        status: 'WAITING',
        issuedAt: nowIso,
        defermentCount: 0,
        maxDefermentsAllowed: 1,
        isSeniorCitizen: isSenior,
        ticketType: isSenior ? 'SENIOR_CITIZEN' : 'REGULAR',
        notes: isSenior ? 'Priority Lane • Senior Citizen' : undefined,
      };
      state.tickets.push(newTicket);
      saveState(state);
      return NextResponse.json({ success: true, state, ticket: newTicket });
    }

    if (action === 'SYNC_CLIENT_STATE') {
      // If client provides state and it is newer, merge
      if (body.tickets && Array.isArray(body.tickets)) {
        state.tickets = body.tickets;
      }
      if (body.counters && Array.isArray(body.counters)) {
        state.counters = body.counters;
      }
      if (body.latestCallNotification) {
        state.latestCallNotification = body.latestCallNotification;
      }
      saveState(state);
      return NextResponse.json({ success: true, state });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
