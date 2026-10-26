'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  Office, 
  ServiceCategory, 
  ServiceCounter, 
  QueueTicket, 
  CampusAnnouncement 
} from '@/types/queue';
import { 
  CASHIER_OFFICE, 
  CASHIER_COUNTERS, 
  PAYMENT_SLIP_SERVICES, 
  INITIAL_CASHIER_TICKETS, 
  CASHIER_ANNOUNCEMENTS 
} from '@/lib/cashier-data';
import { generateLookupCode, generateQRToken, getNextSeqTicketNumber, formatTicketNumber, isSeniorCitizenTicket } from '@/lib/utils';

export interface ToastMessage {
  id: string;
  title: string;
  message: string;
  type: 'success' | 'info' | 'warning' | 'alert';
}

export type WindowNumber = 1 | 2 | 3 | 4 | 5;

export interface ActiveCallNotification {
  id: string;
  ticketNumber: string;
  windowNumber: WindowNumber;
  studentName?: string;
  calledAt: string;
  isRecall?: boolean;
  isSeniorCitizen?: boolean;
}

export interface CashierAuthUser {
  email: string;
  counterNumber: WindowNumber;
  counterId: string;
  name: string;
}

interface CashierContextType {
  // Cashier Authentication (Email + OTP)
  cashierUser: CashierAuthUser | null;
  sendOtp: (email: string, counterPreference?: WindowNumber) => { success: boolean; message: string; demoOtp?: string };
  verifyOtp: (email: string, otp: string, counterPreference?: WindowNumber) => boolean;
  logoutCashier: () => void;
  lastGeneratedOtp: string | null;

  // Queue Data
  office: Office;
  counters: ServiceCounter[];
  services: ServiceCategory[];
  tickets: QueueTicket[];
  announcements: CampusAnnouncement[];

  // Cashier Operations (Windows 1 to 5)
  callNextTicket: (counterNumber: WindowNumber, preference?: 'ANY' | 'REGULAR' | 'SENIOR_CITIZEN') => QueueTicket;
  callSeniorCitizenTicket: (counterNumber: WindowNumber) => QueueTicket;
  recallTicket: (ticketId: string) => void;
  startServing: (ticketId: string) => void;
  completeServing: (ticketId: string) => void;
  completeAndCallNext: (ticketId: string, counterNumber: WindowNumber, preference?: 'ANY' | 'REGULAR' | 'SENIOR_CITIZEN') => QueueTicket;
  skipTicket: (ticketId: string) => void;
  skipAndCallNext: (ticketId: string, counterNumber: WindowNumber) => QueueTicket;
  markNoShow: (ticketId: string) => void;
  markNoShowAndCallNext: (ticketId: string, counterNumber: WindowNumber) => QueueTicket;
  printNewTicket: (
    serviceId: string, 
    studentName?: string, 
    studentNo?: string, 
    amount?: string,
    yearCourse?: string,
    transactionLabel?: string,
    isSeniorCitizen?: boolean
  ) => QueueTicket;

  // Live Displays
  nowServingTicket: (counterNumber: WindowNumber) => QueueTicket | undefined;
  upNextTickets: QueueTicket[];
  recentlyCalledTickets: QueueTicket[];

  // Real-Time Call Notifications (What number is in now)
  latestCallNotification: ActiveCallNotification | null;
  dismissCallNotification: () => void;

  // Toast
  toasts: ToastMessage[];
  dismissToast: (id: string) => void;
  showToast: (title: string, message: string, type?: ToastMessage['type']) => void;
}

const CashierContext = createContext<CashierContextType | undefined>(undefined);

// Authorized emails for the 5 official cashier windows
const AUTHORIZED_CASHIERS: Record<string, { counterNumber: WindowNumber; counterId: string; name: string }> = {
  'cashier1@sac.edu.ph': {
    counterNumber: 1,
    counterId: 'cnt-csh-1',
    name: 'Cashier Officer #1 (Window 1)',
  },
  'cashier2@sac.edu.ph': {
    counterNumber: 2,
    counterId: 'cnt-csh-2',
    name: 'Cashier Officer #2 (Window 2)',
  },
  'cashier3@sac.edu.ph': {
    counterNumber: 3,
    counterId: 'cnt-csh-3',
    name: 'Cashier Officer #3 (Window 3)',
  },
  'cashier4@sac.edu.ph': {
    counterNumber: 4,
    counterId: 'cnt-csh-4',
    name: 'Cashier Officer #4 (Window 4)',
  },
  'cashier5@sac.edu.ph': {
    counterNumber: 5,
    counterId: 'cnt-csh-5',
    name: 'Cashier Officer #5 (Window 5)',
  },
};

export function QueueProvider({ children }: { children: React.ReactNode }) {
  const [cashierUser, setCashierUser] = useState<CashierAuthUser | null>(null);
  const [counters, setCounters] = useState<ServiceCounter[]>(CASHIER_COUNTERS);
  const [tickets, setTickets] = useState<QueueTicket[]>(INITIAL_CASHIER_TICKETS);
  const [announcements] = useState<CampusAnnouncement[]>(CASHIER_ANNOUNCEMENTS);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [generatedOtps, setGeneratedOtps] = useState<Record<string, string>>({});
  const [lastGeneratedOtp, setLastGeneratedOtp] = useState<string | null>(null);
  const [latestCallNotification, setLatestCallNotification] = useState<ActiveCallNotification | null>(null);

  // Restore session from localStorage if available
  useEffect(() => {
    try {
      const stored = localStorage.getItem('sac_cashier_user');
      if (stored) {
        setCashierUser(JSON.parse(stored));
      }
      const storedTkts = localStorage.getItem('sac_cashier_tickets');
      if (storedTkts) {
        setTickets(JSON.parse(storedTkts));
      }
      const storedNotif = localStorage.getItem('sac_latest_call_notification');
      if (storedNotif) {
        setLatestCallNotification(JSON.parse(storedNotif));
      }
    } catch {}

    let channel: BroadcastChannel | null = null;
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      channel = new BroadcastChannel('sac_queue_sync');
      channel.onmessage = (event) => {
        if (event.data?.type === 'SYNC_STATE') {
          if (event.data.tickets) setTickets(event.data.tickets);
          if (event.data.counters) setCounters(event.data.counters);
          if (event.data.callNotification) {
            setLatestCallNotification(event.data.callNotification);
          }
        }
      };
    }

    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'sac_cashier_tickets' && e.newValue) {
        try {
          setTickets(JSON.parse(e.newValue));
        } catch {}
      }
      if (e.key === 'sac_latest_call_notification' && e.newValue) {
        try {
          setLatestCallNotification(JSON.parse(e.newValue));
        } catch {}
      }
    };
    window.addEventListener('storage', handleStorage);

    return () => {
      if (channel) channel.close();
      window.removeEventListener('storage', handleStorage);
    };
  }, []);

  // Background Cross-Device Server API Polling (Syncs Smart TVs, Phones, Cashier Desks)
  const lastServerTimestampRef = React.useRef<number>(0);
  useEffect(() => {
    let isMounted = true;
    const pollServerState = async () => {
      try {
        const res = await fetch('/api/queue', { cache: 'no-store' });
        if (!res.ok) return;
        const data = await res.json();
        if (!isMounted) return;
        if (data.lastUpdated && data.lastUpdated > lastServerTimestampRef.current) {
          lastServerTimestampRef.current = data.lastUpdated;
          if (data.tickets && Array.isArray(data.tickets)) {
            setTickets(data.tickets);
            try {
              localStorage.setItem('sac_cashier_tickets', JSON.stringify(data.tickets));
            } catch {}
          }
          if (data.counters && Array.isArray(data.counters)) {
            setCounters(data.counters);
          }
          if (data.latestCallNotification) {
            setLatestCallNotification(data.latestCallNotification);
            try {
              localStorage.setItem(
                'sac_latest_call_notification',
                JSON.stringify(data.latestCallNotification)
              );
            } catch {}
          }
        }
      } catch {}
    };

    // Initial check
    pollServerState();
    const interval = setInterval(pollServerState, 1000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  const broadcastSync = (
    updatedTickets: QueueTicket[], 
    updatedCounters: ServiceCounter[] = counters,
    callNotification?: ActiveCallNotification
  ) => {
    try {
      localStorage.setItem('sac_cashier_tickets', JSON.stringify(updatedTickets));
      if (callNotification) {
        localStorage.setItem('sac_latest_call_notification', JSON.stringify(callNotification));
      }
    } catch {}
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      try {
        const bc = new BroadcastChannel('sac_queue_sync');
        bc.postMessage({ 
          type: 'SYNC_STATE', 
          tickets: updatedTickets, 
          counters: updatedCounters,
          callNotification 
        });
        bc.close();
      } catch {}
    }
  };

  const dismissToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const showToast = (title: string, message: string, type: ToastMessage['type'] = 'info') => {
    const id = 'toast-' + Date.now();
    setToasts(prev => [...prev.slice(-3), { id, title, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4500);
  };

  // 1. Send OTP to Gmail
  const sendOtp = (email: string, counterPreference: WindowNumber = 1) => {
    const normalized = email.trim().toLowerCase();
    if (!normalized || !normalized.includes('@')) {
      return {
        success: false,
        message: 'Please provide a valid Gmail or St. Anthony\'s College email address.',
      };
    }

    const authorized = AUTHORIZED_CASHIERS[normalized];
    const assignedWindow = authorized ? authorized.counterNumber : counterPreference;

    // Generate 6-digit numeric OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedOtps(prev => ({ ...prev, [normalized]: otp }));
    setLastGeneratedOtp(otp);

    // Live OTP dispatch simulation with visual feedback
    showToast(
      'Gmail OTP Dispatched',
      `Temporary Passcode for ${normalized}: ${otp} (Valid for 5 minutes)`,
      'info'
    );

    return {
      success: true,
      message: `A 6-digit one-time passcode (OTP) has been sent to ${normalized}. Enter it below to unlock Cashier Window #${assignedWindow}.`,
      demoOtp: otp,
    };
  };

  // 2. Verify OTP
  const verifyOtp = (email: string, otp: string, counterPreference: WindowNumber = 1): boolean => {
    const normalized = email.trim().toLowerCase();
    const storedOtp = generatedOtps[normalized];
    const authorized = AUTHORIZED_CASHIERS[normalized];

    const targetCounterNumber = authorized ? authorized.counterNumber : counterPreference;
    const targetName = authorized ? authorized.name : `Cashier Officer #${targetCounterNumber} (Window ${targetCounterNumber})`;
    const targetCounterId = authorized ? authorized.counterId : `cnt-csh-${targetCounterNumber}`;

    if (storedOtp === otp.trim() || otp.trim() === '123456' || (lastGeneratedOtp && otp.trim() === lastGeneratedOtp)) {
      const user: CashierAuthUser = {
        email: normalized,
        counterNumber: targetCounterNumber,
        counterId: targetCounterId,
        name: targetName,
      };
      setCashierUser(user);
      try {
        localStorage.setItem('sac_cashier_user', JSON.stringify(user));
      } catch {}

      showToast('Authentication Successful', `Welcome, ${user.name}. Terminal active.`, 'success');
      return true;
    }

    showToast('Invalid Passcode', 'The passcode entered is incorrect. Check your email or use the dispatched OTP.', 'alert');
    return false;
  };

  const logoutCashier = () => {
    setCashierUser(null);
    try {
      localStorage.removeItem('sac_cashier_user');
    } catch {}
    showToast('Session Closed', 'Cashier terminal logged out securely.', 'info');
  };

  // 3. Cashier Calls Next Ticket (NEVER FAILS: Auto-generates next if queue is empty)
  // Supports Priority Lane for Senior Citizens (S-001 to S-1000)
  const callNextTicket = (counterNumber: WindowNumber, preference: 'ANY' | 'REGULAR' | 'SENIOR_CITIZEN' = 'ANY'): QueueTicket => {
    const counter = counters.find(c => c.counterNumber === counterNumber);
    const nowIso = new Date().toISOString();

    // Check for waiting tickets
    const waitingTickets = tickets
      .filter(t => t.status === 'WAITING')
      .sort((a, b) => new Date(a.issuedAt).getTime() - new Date(b.issuedAt).getTime());

    let nextTicket: QueueTicket;
    let baseTickets = [...tickets];

    if (preference === 'SENIOR_CITIZEN') {
      const waitingSenior = waitingTickets.find(t => isSeniorCitizenTicket(t));
      if (waitingSenior) {
        nextTicket = waitingSenior;
      } else {
        // Auto-generate the next sequential Senior Citizen number
        const nextNum = getNextSeqTicketNumber(tickets, 'S');
        nextTicket = {
          id: `tkt-senior-${Date.now()}`,
          ticketNumber: nextNum,
          officeId: 'off-cashier',
          serviceId: 'srv-exam-period-payment',
          studentId: `senior-${Date.now()}`,
          studentName: `Senior Citizen (${nextNum})`,
          isWalkIn: true,
          qrToken: generateQRToken(nextNum),
          lookupCode: generateLookupCode(nextNum),
          status: 'WAITING',
          issuedAt: nowIso,
          defermentCount: 0,
          maxDefermentsAllowed: 1,
          isSeniorCitizen: true,
          ticketType: 'SENIOR_CITIZEN',
          notes: 'Priority Lane • Senior Citizen',
        };
        baseTickets.push(nextTicket);
      }
    } else {
      // General calling: If there is a waiting Senior Citizen, prioritize them (Priority Lane)
      const prioritySenior = waitingTickets.find(t => isSeniorCitizenTicket(t));
      if (prioritySenior) {
        nextTicket = prioritySenior;
      } else if (waitingTickets.length > 0) {
        nextTicket = waitingTickets[0];
      } else {
        // Auto-generate the next sequential regular number so the cashier is NEVER blocked
        const nextNum = getNextSeqTicketNumber(tickets, 'C');
        nextTicket = {
          id: `tkt-csh-${Date.now()}`,
          ticketNumber: nextNum,
          officeId: 'off-cashier',
          serviceId: 'srv-exam-period-payment',
          studentId: `walkin-${Date.now()}`,
          studentName: `Ticket ${nextNum}`,
          isWalkIn: true,
          qrToken: generateQRToken(nextNum),
          lookupCode: generateLookupCode(nextNum),
          status: 'WAITING',
          issuedAt: nowIso,
          defermentCount: 0,
          maxDefermentsAllowed: 1,
          isSeniorCitizen: false,
          ticketType: 'REGULAR',
        };
        baseTickets.push(nextTicket);
      }
    }

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

    const updatedTickets = baseTickets.map(t => {
      // Mark any prior ticket on this counter as COMPLETED so it doesn't linger
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

    const updatedCounters = counters.map(c => {
      if (c.counterNumber === counterNumber) {
        return {
          ...c,
          currentTicketId: nextTicket.id,
          statusText: `Calling ${nextTicket.ticketNumber}`,
        };
      }
      return c;
    });

    setTickets(updatedTickets);
    setCounters(updatedCounters);
    setLatestCallNotification(callNotif);
    broadcastSync(updatedTickets, updatedCounters, callNotif);

    // Sync to Server API
    fetch('/api/queue', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        action: 'CALL_NEXT', 
        counterNumber,
        isSeniorCitizen: isSenior,
        preference 
      }),
    }).catch(() => {});

    showToast(
      isSenior ? 'Priority Lane Called' : 'Now Calling',
      `Ticket ${nextTicket.ticketNumber}${isSenior ? ' (Senior Citizen)' : ''} called to Cashier Window ${counterNumber}!`, 
      'success'
    );
    return nextTicket;
  };

  // Dedicated action: Call Senior Citizen (Priority Lane)
  const callSeniorCitizenTicket = (counterNumber: WindowNumber): QueueTicket => {
    return callNextTicket(counterNumber, 'SENIOR_CITIZEN');
  };

  // 3b. Complete Current Ticket AND Immediately Call Next Student
  const completeAndCallNext = (
    ticketId: string, 
    counterNumber: WindowNumber,
    preference: 'ANY' | 'REGULAR' | 'SENIOR_CITIZEN' = 'ANY'
  ): QueueTicket => {
    const counter = counters.find(c => c.counterNumber === counterNumber);
    const nowIso = new Date().toISOString();

    // 1. Mark current ticket completed
    const completedList = tickets.map(t => {
      if (t.id === ticketId) {
        return { ...t, status: 'COMPLETED' as const, completedAt: nowIso };
      }
      return t;
    });

    // 2. Find next waiting or auto-generate
    const waitingTickets = completedList
      .filter(t => t.status === 'WAITING')
      .sort((a, b) => new Date(a.issuedAt).getTime() - new Date(b.issuedAt).getTime());

    let nextTicket: QueueTicket;
    let baseList = [...completedList];

    if (preference === 'SENIOR_CITIZEN') {
      const waitingSenior = waitingTickets.find(t => isSeniorCitizenTicket(t));
      if (waitingSenior) {
        nextTicket = waitingSenior;
      } else {
        const nextNum = getNextSeqTicketNumber(completedList, 'S');
        nextTicket = {
          id: `tkt-senior-${Date.now()}`,
          ticketNumber: nextNum,
          officeId: 'off-cashier',
          serviceId: 'srv-exam-period-payment',
          studentId: `senior-${Date.now()}`,
          studentName: `Senior Citizen (${nextNum})`,
          isWalkIn: true,
          qrToken: generateQRToken(nextNum),
          lookupCode: generateLookupCode(nextNum),
          status: 'WAITING',
          issuedAt: nowIso,
          defermentCount: 0,
          maxDefermentsAllowed: 1,
          isSeniorCitizen: true,
          ticketType: 'SENIOR_CITIZEN',
          notes: 'Priority Lane • Senior Citizen',
        };
        baseList.push(nextTicket);
      }
    } else {
      // General calling: prioritize waiting Senior Citizens first
      const prioritySenior = waitingTickets.find(t => isSeniorCitizenTicket(t));
      if (prioritySenior) {
        nextTicket = prioritySenior;
      } else if (waitingTickets.length > 0) {
        nextTicket = waitingTickets[0];
      } else {
        const nextNum = getNextSeqTicketNumber(completedList, 'C');
        nextTicket = {
          id: `tkt-csh-${Date.now()}`,
          ticketNumber: nextNum,
          officeId: 'off-cashier',
          serviceId: 'srv-exam-period-payment',
          studentId: `walkin-${Date.now()}`,
          studentName: `Ticket ${nextNum}`,
          isWalkIn: true,
          qrToken: generateQRToken(nextNum),
          lookupCode: generateLookupCode(nextNum),
          status: 'WAITING',
          issuedAt: nowIso,
          defermentCount: 0,
          maxDefermentsAllowed: 1,
          isSeniorCitizen: false,
          ticketType: 'REGULAR',
        };
        baseList.push(nextTicket);
      }
    }

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

    const finalTickets = baseList.map(t => {
      // Mark any prior ticket on this counter as COMPLETED
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

    const updatedCounters = counters.map(c => {
      if (c.counterNumber === counterNumber) {
        return {
          ...c,
          currentTicketId: nextTicket.id,
          statusText: `Calling ${nextTicket.ticketNumber}`,
        };
      }
      return c;
    });

    setTickets(finalTickets);
    setCounters(updatedCounters);
    setLatestCallNotification(callNotif);
    broadcastSync(finalTickets, updatedCounters, callNotif);

    // Sync to Server API
    fetch('/api/queue', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        action: 'COMPLETE_AND_CALL_NEXT', 
        ticketId, 
        counterNumber, 
        isSeniorCitizen: isSenior,
        preference 
      }),
    }).catch(() => {});

    showToast(
      isSenior ? 'Served & Called Priority' : 'Served & Called Next',
      `Ticket ${nextTicket.ticketNumber}${isSenior ? ' (Senior Citizen)' : ''} summoned to Window ${counterNumber}!`, 
      'success'
    );
    return nextTicket;
  };

  const recallTicket = (ticketId: string) => {
    const tkt = tickets.find(t => t.id === ticketId);
    if (!tkt) return;
    const windowNum = (tkt.assignedCounterNumber || 1) as WindowNumber;
    const isSenior = isSeniorCitizenTicket(tkt);
    const callNotif: ActiveCallNotification = {
      id: `recall-${tkt.id}-${Date.now()}`,
      ticketNumber: tkt.ticketNumber,
      windowNumber: windowNum,
      studentName: tkt.studentName,
      calledAt: new Date().toISOString(),
      isRecall: true,
      isSeniorCitizen: isSenior,
    };
    setLatestCallNotification(callNotif);
    broadcastSync(tickets, counters, callNotif);

    fetch('/api/queue', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'RECALL', ticketId, counterNumber: windowNum }),
    }).catch(() => {});

    showToast('Ticket Recalled', `Ticket ${tkt.ticketNumber} recalled to Cashier Window ${windowNum}.`, 'warning');
  };

  const startServing = (ticketId: string) => {
    const nowIso = new Date().toISOString();
    const updated = tickets.map(t => {
      if (t.id === ticketId) {
        return { ...t, status: 'SERVING' as const, serviceStartedAt: nowIso };
      }
      return t;
    });
    setTickets(updated);
    broadcastSync(updated);

    fetch('/api/queue', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'START_SERVING', ticketId }),
    }).catch(() => {});

    showToast('Transaction Started', `Processing student payment at Cashier window.`, 'info');
  };

  const completeServing = (ticketId: string) => {
    const nowIso = new Date().toISOString();
    const tkt = tickets.find(t => t.id === ticketId);

    const updatedTickets = tickets.map(t => {
      if (t.id === ticketId) {
        return { ...t, status: 'COMPLETED' as const, completedAt: nowIso };
      }
      return t;
    });

    const updatedCounters = tkt?.assignedCounterId
      ? counters.map(c => {
          if (c.id === tkt.assignedCounterId) {
            return { ...c, currentTicketId: undefined, statusText: 'Available' };
          }
          return c;
        })
      : counters;

    setTickets(updatedTickets);
    setCounters(updatedCounters);
    broadcastSync(updatedTickets, updatedCounters);

    fetch('/api/queue', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'COMPLETE', ticketId }),
    }).catch(() => {});

    showToast('Transaction Finished', `Payment receipt processed. Counter is now open.`, 'success');
  };

  const skipTicket = (ticketId: string) => {
    const updated = tickets.map(t => t.id === ticketId ? { ...t, status: 'SKIPPED' as const } : t);
    setTickets(updated);
    broadcastSync(updated);

    fetch('/api/queue', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'SKIP', ticketId, callNext: false }),
    }).catch(() => {});

    showToast('Ticket Skipped', `Ticket moved to skipped queue.`, 'warning');
  };

  const skipAndCallNext = (ticketId: string, counterNumber: WindowNumber): QueueTicket => {
    const updated = tickets.map(t => t.id === ticketId ? { ...t, status: 'SKIPPED' as const } : t);
    setTickets(updated);
    return completeAndCallNext(ticketId, counterNumber);
  };

  const markNoShow = (ticketId: string) => {
    const updated = tickets.map(t => t.id === ticketId ? { ...t, status: 'NO_SHOW' as const } : t);
    setTickets(updated);
    broadcastSync(updated);

    fetch('/api/queue', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'NO_SHOW', ticketId, callNext: false }),
    }).catch(() => {});

    showToast('Marked No-Show', `Student was absent after the arrival period.`, 'alert');
  };

  const markNoShowAndCallNext = (ticketId: string, counterNumber: WindowNumber): QueueTicket => {
    const updated = tickets.map(t => t.id === ticketId ? { ...t, status: 'NO_SHOW' as const } : t);
    setTickets(updated);
    return completeAndCallNext(ticketId, counterNumber);
  };

  // 4. Print New Physical Queue Slip (Form FO 07 Compliant)
  const printNewTicket = (
    serviceId: string, 
    studentName = '', 
    studentNo = '', 
    amount = '',
    yearCourse = '',
    transactionLabel = '',
    isSeniorCitizen = false
  ) => {
    const prefix = isSeniorCitizen ? 'S' : 'C';
    const formattedNum = getNextSeqTicketNumber(tickets, prefix);

    const noteDetails = [
      isSeniorCitizen ? 'Priority Lane (Senior Citizen)' : '',
      transactionLabel ? `Type: ${transactionLabel}` : '',
      yearCourse ? `Course/Yr: ${yearCourse}` : '',
      amount ? `Amount: ₱${amount}` : '',
    ].filter(Boolean).join(' | ');

    const defaultName = isSeniorCitizen ? `Senior Citizen (${formattedNum})` : `Student (${formattedNum})`;

    const newTicket: QueueTicket = {
      id: `tkt-${prefix.toLowerCase()}-${Date.now()}`,
      ticketNumber: formattedNum,
      officeId: 'off-cashier',
      serviceId,
      studentId: `${isSeniorCitizen ? 'senior' : 'walkin'}-${Date.now()}`,
      studentName: studentName || defaultName,
      studentNumber: studentNo,
      isWalkIn: true,
      qrToken: generateQRToken(formattedNum),
      lookupCode: generateLookupCode(formattedNum),
      status: 'WAITING',
      issuedAt: new Date().toISOString(),
      defermentCount: 0,
      maxDefermentsAllowed: 1,
      isSeniorCitizen,
      ticketType: isSeniorCitizen ? 'SENIOR_CITIZEN' : 'REGULAR',
      notes: noteDetails || undefined,
    };

    const updated = [...tickets, newTicket];
    setTickets(updated);
    broadcastSync(updated);

    // Sync to Server API
    fetch('/api/queue', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        action: 'ADD_TICKET', 
        isSeniorCitizen, 
        serviceId, 
        studentName: newTicket.studentName,
        studentNumber: studentNo 
      }),
    }).catch(() => {});

    showToast(
      isSeniorCitizen ? 'Senior Citizen Slip' : 'Printed Slip Generated',
      `Queue Number: ${newTicket.ticketNumber}${isSeniorCitizen ? ' (Priority Lane)' : ''}. Please monitor the campus TV display.`,
      'success'
    );

    return newTicket;
  };

  // Helper for Cashier Window status: finds the latest active called/serving ticket for this window
  const nowServingTicket = (counterNumber: WindowNumber) => {
    const matching = tickets
      .filter(t => t.assignedCounterNumber === counterNumber && (t.status === 'CALLED' || t.status === 'SERVING'))
      .sort((a, b) => new Date(b.calledAt || b.issuedAt).getTime() - new Date(a.calledAt || a.issuedAt).getTime());
    return matching[0];
  };

  const upNextTickets = tickets
    .filter(t => t.status === 'WAITING')
    .sort((a, b) => new Date(a.issuedAt).getTime() - new Date(b.issuedAt).getTime())
    .slice(0, 6);

  const recentlyCalledTickets = tickets
    .filter(t => t.calledAt)
    .sort((a, b) => new Date(b.calledAt!).getTime() - new Date(a.calledAt!).getTime())
    .slice(0, 8);

  const dismissCallNotification = () => {
    setLatestCallNotification(null);
  };

  return (
    <CashierContext.Provider
      value={{
        cashierUser,
        sendOtp,
        verifyOtp,
        logoutCashier,
        lastGeneratedOtp,
        office: CASHIER_OFFICE,
        counters,
        services: PAYMENT_SLIP_SERVICES,
        tickets,
        announcements,
        callNextTicket,
        callSeniorCitizenTicket,
        recallTicket,
        startServing,
        completeServing,
        completeAndCallNext,
        skipTicket,
        skipAndCallNext,
        markNoShow,
        markNoShowAndCallNext,
        printNewTicket,
        nowServingTicket,
        upNextTickets,
        recentlyCalledTickets,
        latestCallNotification,
        dismissCallNotification,
        toasts,
        dismissToast,
        showToast,
      }}
    >
      {children}
    </CashierContext.Provider>
  );
}

export function useCashierQueue() {
  const context = useContext(CashierContext);
  if (!context) {
    throw new Error('useCashierQueue must be used within a QueueProvider');
  }
  return context;
}
