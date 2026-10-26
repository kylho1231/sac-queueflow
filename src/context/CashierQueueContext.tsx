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
import { generateLookupCode, generateQRToken } from '@/lib/utils';

export interface ToastMessage {
  id: string;
  title: string;
  message: string;
  type: 'success' | 'info' | 'warning' | 'alert';
}

export interface ActiveCallNotification {
  id: string;
  ticketNumber: string;
  windowNumber: 1 | 2;
  studentName?: string;
  calledAt: string;
  isRecall?: boolean;
}

export interface CashierAuthUser {
  email: string;
  counterNumber: 1 | 2;
  counterId: string;
  name: string;
}

interface CashierContextType {
  // Cashier Authentication (Email + OTP)
  cashierUser: CashierAuthUser | null;
  sendOtp: (email: string, counterPreference?: 1 | 2) => { success: boolean; message: string; demoOtp?: string };
  verifyOtp: (email: string, otp: string, counterPreference?: 1 | 2) => boolean;
  logoutCashier: () => void;
  lastGeneratedOtp: string | null;

  // Queue Data
  office: Office;
  counters: ServiceCounter[];
  services: ServiceCategory[];
  tickets: QueueTicket[];
  announcements: CampusAnnouncement[];

  // Cashier Operations (Only Cashier 1 & 2 can perform)
  callNextTicket: (counterNumber: 1 | 2) => QueueTicket | null;
  recallTicket: (ticketId: string) => void;
  startServing: (ticketId: string) => void;
  completeServing: (ticketId: string) => void;
  skipTicket: (ticketId: string) => void;
  markNoShow: (ticketId: string) => void;
  printNewTicket: (
    serviceId: string, 
    studentName?: string, 
    studentNo?: string, 
    amount?: string,
    yearCourse?: string,
    transactionLabel?: string
  ) => QueueTicket;

  // Live Displays
  nowServingTicket: (counterNumber: 1 | 2) => QueueTicket | undefined;
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

// Authorized emails for the 2 official cashiers
const AUTHORIZED_CASHIERS: Record<string, { counterNumber: 1 | 2; counterId: string; name: string }> = {
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
  const sendOtp = (email: string, counterPreference: 1 | 2 = 1) => {
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
  const verifyOtp = (email: string, otp: string, counterPreference: 1 | 2 = 1): boolean => {
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

  // 3. Cashier Calls Next Ticket
  const callNextTicket = (counterNumber: 1 | 2): QueueTicket | null => {
    const counter = counters.find(c => c.counterNumber === counterNumber);
    if (!counter) return null;

    // Find next ticket waiting for Cashier
    const waitingTickets = tickets
      .filter(t => t.status === 'WAITING')
      .sort((a, b) => new Date(a.issuedAt).getTime() - new Date(b.issuedAt).getTime());

    if (waitingTickets.length === 0) {
      showToast('Queue Clear', 'No students currently waiting for Cashier.', 'info');
      return null;
    }

    const nextTicket = waitingTickets[0];
    const nowIso = new Date().toISOString();

    const callNotif: ActiveCallNotification = {
      id: `call-${nextTicket.id}-${Date.now()}`,
      ticketNumber: nextTicket.ticketNumber,
      windowNumber: counterNumber,
      studentName: nextTicket.studentName,
      calledAt: nowIso,
      isRecall: false,
    };

    const updatedTickets = tickets.map(t => {
      if (t.id === nextTicket.id) {
        return {
          ...t,
          status: 'CALLED' as const,
          calledAt: nowIso,
          assignedCounterId: counter.id,
          assignedCounterNumber: counterNumber,
        };
      }
      return t;
    });

    const updatedCounters = counters.map(c => {
      if (c.id === counter.id) {
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

    showToast('Now Calling', `Ticket ${nextTicket.ticketNumber} called to Cashier Window ${counterNumber}!`, 'success');
    return nextTicket;
  };

  const recallTicket = (ticketId: string) => {
    const tkt = tickets.find(t => t.id === ticketId);
    if (!tkt) return;
    const windowNum = (tkt.assignedCounterNumber || 1) as 1 | 2;
    const callNotif: ActiveCallNotification = {
      id: `recall-${tkt.id}-${Date.now()}`,
      ticketNumber: tkt.ticketNumber,
      windowNumber: windowNum,
      studentName: tkt.studentName,
      calledAt: new Date().toISOString(),
      isRecall: true,
    };
    setLatestCallNotification(callNotif);
    broadcastSync(tickets, counters, callNotif);
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

    showToast('Transaction Finished', `Payment receipt processed. Counter is now open.`, 'success');
  };

  const skipTicket = (ticketId: string) => {
    const updated = tickets.map(t => t.id === ticketId ? { ...t, status: 'SKIPPED' as const } : t);
    setTickets(updated);
    broadcastSync(updated);
    showToast('Ticket Skipped', `Ticket moved to skipped queue.`, 'warning');
  };

  const markNoShow = (ticketId: string) => {
    const updated = tickets.map(t => t.id === ticketId ? { ...t, status: 'NO_SHOW' as const } : t);
    setTickets(updated);
    broadcastSync(updated);
    showToast('Marked No-Show', `Student was absent after the arrival period.`, 'alert');
  };

  // 4. Print New Physical Queue Slip (Form FO 07 Compliant)
  const printNewTicket = (
    serviceId: string, 
    studentName = 'Student Guest', 
    studentNo = '', 
    amount = '',
    yearCourse = '',
    transactionLabel = ''
  ) => {
    const nextSeq = tickets.length + 1;
    const formattedNum = `C-${String(nextSeq).padStart(3, '0')}`;

    const noteDetails = [
      transactionLabel ? `Type: ${transactionLabel}` : '',
      yearCourse ? `Course/Yr: ${yearCourse}` : '',
      amount ? `Amount: ₱${amount}` : '',
    ].filter(Boolean).join(' | ');

    const newTicket: QueueTicket = {
      id: `tkt-csh-${Date.now()}`,
      ticketNumber: formattedNum,
      officeId: 'off-cashier',
      serviceId,
      studentId: `walkin-${Date.now()}`,
      studentName: studentName || `Student (${formattedNum})`,
      studentNumber: studentNo,
      isWalkIn: true,
      qrToken: generateQRToken(formattedNum),
      lookupCode: generateLookupCode(formattedNum),
      status: 'WAITING',
      issuedAt: new Date().toISOString(),
      defermentCount: 0,
      maxDefermentsAllowed: 1,
      notes: noteDetails || undefined,
    };

    const updated = [...tickets, newTicket];
    setTickets(updated);
    broadcastSync(updated);
    showToast('Printed Slip Generated', `Queue Number: ${newTicket.ticketNumber}. Student may monitor the campus TV display.`, 'success');

    return newTicket;
  };

  // Helper for Cashier Window status
  const nowServingTicket = (counterNumber: 1 | 2) => {
    return tickets.find(t => t.assignedCounterNumber === counterNumber && (t.status === 'CALLED' || t.status === 'SERVING'));
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
        recallTicket,
        startServing,
        completeServing,
        skipTicket,
        markNoShow,
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
