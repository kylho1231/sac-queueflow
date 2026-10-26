'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  Office, 
  ServiceCategory, 
  ServiceCounter, 
  QueueTicket, 
  QueueEvent, 
  QueueNotification, 
  CampusAnnouncement,
  UserRole,
  TicketStatus
} from '@/types/queue';
import { 
  INITIAL_OFFICES, 
  INITIAL_SERVICES, 
  INITIAL_COUNTERS, 
  INITIAL_TICKETS, 
  INITIAL_NOTIFICATIONS, 
  INITIAL_ANNOUNCEMENTS 
} from '@/lib/initial-data';
import { generateLookupCode, generateQRToken } from '@/lib/utils';

interface QueueContextType {
  // Current user state
  currentRole: UserRole;
  setCurrentRole: (role: UserRole) => void;
  currentStudentId: string;
  currentStaffOfficeId: string;
  setCurrentStaffOfficeId: (officeId: string) => void;

  // Data
  offices: Office[];
  services: ServiceCategory[];
  counters: ServiceCounter[];
  tickets: QueueTicket[];
  events: QueueEvent[];
  notifications: QueueNotification[];
  announcements: CampusAnnouncement[];

  // Student Actions
  joinQueue: (officeId: string, serviceId: string, studentName?: string, studentNumber?: string) => QueueTicket;
  requestDeferment: (ticketId: string, reason: string) => boolean;
  resumeDeferredTicket: (ticketId: string) => boolean;
  cancelTicket: (ticketId: string, reason?: string) => boolean;
  markNotificationRead: (notifId: string) => void;
  clearNotifications: () => void;

  // Staff Actions
  callNextTicket: (counterId: string) => QueueTicket | null;
  recallTicket: (ticketId: string) => void;
  startServing: (ticketId: string) => void;
  completeServing: (ticketId: string) => void;
  skipTicket: (ticketId: string) => void;
  markNoShow: (ticketId: string) => void;
  pauseCounter: (counterId: string) => void;
  resumeCounter: (counterId: string) => void;

  // Walk-in and Kiosk
  createWalkInTicket: (officeId: string, serviceId: string) => QueueTicket;

  // Real-time helper
  nowServingTicket: (officeId: string) => QueueTicket | undefined;
  getOfficeTickets: (officeId: string) => QueueTicket[];
}

const QueueContext = createContext<QueueContextType | undefined>(undefined);

export function QueueProvider({ children }: { children: React.ReactNode }) {
  const [currentRole, setCurrentRole] = useState<UserRole>('student');
  const [currentStudentId] = useState<string>('stud-sample');
  const [currentStaffOfficeId, setCurrentStaffOfficeId] = useState<string>('off-registrar');

  const [offices, setOffices] = useState<Office[]>(INITIAL_OFFICES);
  const [services, setServices] = useState<ServiceCategory[]>(INITIAL_SERVICES);
  const [counters, setCounters] = useState<ServiceCounter[]>(INITIAL_COUNTERS);
  const [tickets, setTickets] = useState<QueueTicket[]>(INITIAL_TICKETS);
  const [events, setEvents] = useState<QueueEvent[]>([]);
  const [notifications, setNotifications] = useState<QueueNotification[]>(INITIAL_NOTIFICATIONS);
  const [announcements, setAnnouncements] = useState<CampusAnnouncement[]>(INITIAL_ANNOUNCEMENTS);

  // Helper: Find ticket currently being served for an office
  const nowServingTicket = (officeId: string) => {
    return tickets.find(t => t.officeId === officeId && (t.status === 'SERVING' || t.status === 'CALLED'));
  };

  const getOfficeTickets = (officeId: string) => {
    return tickets.filter(t => t.officeId === officeId);
  };

  // Add notification with deduplication
  const addNotification = (notif: Omit<QueueNotification, 'id' | 'timestamp' | 'read'>) => {
    const newNotif: QueueNotification = {
      ...notif,
      id: 'notif-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
      timestamp: 'Just now',
      read: false,
    };
    setNotifications(prev => [newNotif, ...prev]);

    // Native browser push notification if permitted
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification(notif.title, {
          body: notif.message,
          icon: '/favicon.ico',
        });
      } catch (err) {
        console.error('Push notification trigger error', err);
      }
    }
  };

  // Check and dispatch approaching notifications
  const checkApproachingTurnNotifications = (officeId: string, updatedTickets: QueueTicket[]) => {
    const officeTickets = updatedTickets.filter(t => t.officeId === officeId && t.status === 'WAITING');
    // Sort chronologically
    officeTickets.sort((a, b) => new Date(a.issuedAt).getTime() - new Date(b.issuedAt).getTime());

    officeTickets.forEach((tkt, index) => {
      // index 0 is next in line, index 1 is 2nd in line
      if (index === 0 && tkt.studentId === currentStudentId) {
        addNotification({
          ticketId: tkt.id,
          studentId: tkt.studentId,
          title: '🚨 You are NEXT in line!',
          message: `Ticket ${tkt.ticketNumber}: Only 1 student remains ahead. Please head to the office now.`,
          type: 'APPROACHING',
        });
      } else if (index === 2 && tkt.studentId === currentStudentId) {
        addNotification({
          ticketId: tkt.id,
          studentId: tkt.studentId,
          title: 'Upcoming Turn Notification',
          message: `Ticket ${tkt.ticketNumber}: 2 students ahead. If you are in class, wrap up or request deferment.`,
          type: 'APPROACHING',
        });
      }
    });
  };

  // 1. Join Queue (Student)
  const joinQueue = (officeId: string, serviceId: string, studentName = 'John Carlo Javier (You)', studentNumber = '2023-08812') => {
    const office = offices.find(o => o.id === officeId);
    const prefix = office ? office.prefix : 'Q';

    // Calculate next sequence
    const existingOfficeTickets = tickets.filter(t => t.officeId === officeId);
    const nextSeq = existingOfficeTickets.length + 1;
    const formattedNum = `${prefix}-${String(nextSeq).padStart(3, '0')}`;

    const newTicket: QueueTicket = {
      id: `tkt-${office?.code.toLowerCase()}-${Date.now()}`,
      ticketNumber: formattedNum,
      officeId,
      serviceId,
      studentId: currentStudentId,
      studentName,
      studentEmail: 'jc.javier@sac.edu.ph',
      studentNumber,
      isWalkIn: false,
      qrToken: generateQRToken(formattedNum),
      lookupCode: generateLookupCode(formattedNum),
      status: 'WAITING',
      issuedAt: new Date().toISOString(),
      defermentCount: 0,
      maxDefermentsAllowed: 2,
    };

    setTickets(prev => [...prev, newTicket]);

    // Record Event
    const newEvent: QueueEvent = {
      id: `evt-${Date.now()}`,
      ticketId: newTicket.id,
      ticketNumber: newTicket.ticketNumber,
      officeId,
      eventType: 'CREATED',
      performedByRole: 'student',
      performedById: currentStudentId,
      timestamp: new Date().toISOString(),
      details: `Student joined queue for ${office?.name}`,
    };
    setEvents(prev => [newEvent, ...prev]);

    addNotification({
      ticketId: newTicket.id,
      studentId: newTicket.studentId,
      title: `Queue Ticket Issued: ${newTicket.ticketNumber}`,
      message: `You are in line for ${office?.name}. Keep your app open to receive live updates.`,
      type: 'INFO',
    });

    return newTicket;
  };

  // 2. Class-Conflict Deferment
  const requestDeferment = (ticketId: string, reason: string): boolean => {
    const tkt = tickets.find(t => t.id === ticketId);
    if (!tkt) return false;
    if (tkt.defermentCount >= tkt.maxDefermentsAllowed) {
      alert('Maximum deferment limit reached (2 deferments permitted per ticket to maintain fairness).');
      return false;
    }

    const expiryTime = new Date(Date.now() + 45 * 60000).toISOString(); // 45-minute class duration default

    setTickets(prev => prev.map(t => {
      if (t.id === ticketId) {
        return {
          ...t,
          status: 'DEFERRED' as TicketStatus,
          defermentCount: t.defermentCount + 1,
          defermentReason: reason,
          defermentExpiresAt: expiryTime,
        };
      }
      return t;
    }));

    addNotification({
      ticketId,
      studentId: tkt.studentId,
      title: 'Class Deferment Activated',
      message: `Ticket ${tkt.ticketNumber} is held. You may resume when your class concludes (expires in 45 mins).`,
      type: 'DEFERRED',
    });

    return true;
  };

  const resumeDeferredTicket = (ticketId: string): boolean => {
    const tkt = tickets.find(t => t.id === ticketId);
    if (!tkt) return false;

    setTickets(prev => prev.map(t => {
      if (t.id === ticketId) {
        return {
          ...t,
          status: 'WAITING' as TicketStatus,
          defermentReason: undefined,
          defermentExpiresAt: undefined,
        };
      }
      return t;
    }));

    addNotification({
      ticketId,
      studentId: tkt.studentId,
      title: 'Queue Position Resumed',
      message: `Ticket ${tkt.ticketNumber} is back in the active queue. Please remain nearby.`,
      type: 'INFO',
    });

    return true;
  };

  // 3. Cancel Ticket
  const cancelTicket = (ticketId: string, reason = 'Student requested cancellation'): boolean => {
    const tkt = tickets.find(t => t.id === ticketId);
    if (!tkt) return false;

    setTickets(prev => prev.map(t => {
      if (t.id === ticketId) {
        return {
          ...t,
          status: 'CANCELLED' as TicketStatus,
          cancelledAt: new Date().toISOString(),
          notes: reason,
        };
      }
      return t;
    }));

    addNotification({
      ticketId,
      studentId: tkt.studentId,
      title: 'Queue Ticket Cancelled',
      message: `Ticket ${tkt.ticketNumber} was successfully cancelled.`,
      type: 'WARNING',
    });

    return true;
  };

  // 4. Staff: Call Next Ticket
  const callNextTicket = (counterId: string): QueueTicket | null => {
    const counter = counters.find(c => c.id === counterId);
    if (!counter || counter.isPaused) return null;

    const officeId = counter.officeId;
    
    // Complete existing ticket if serving
    if (counter.currentTicketId) {
      completeServing(counter.currentTicketId);
    }

    // Atomic find next WAITING ticket in this office (chronological)
    const waitingTickets = tickets
      .filter(t => t.officeId === officeId && t.status === 'WAITING')
      .sort((a, b) => new Date(a.issuedAt).getTime() - new Date(b.issuedAt).getTime());

    if (waitingTickets.length === 0) {
      alert('No students currently waiting in this office queue.');
      return null;
    }

    const nextTicket = waitingTickets[0];
    const nowIso = new Date().toISOString();

    const updated = tickets.map(t => {
      if (t.id === nextTicket.id) {
        return {
          ...t,
          status: 'CALLED' as TicketStatus,
          calledAt: nowIso,
          assignedCounterId: counterId,
          assignedCounterNumber: counter.counterNumber,
        };
      }
      return t;
    });

    setTickets(updated);

    // Update counter
    setCounters(prev => prev.map(c => {
      if (c.id === counterId) {
        return {
          ...c,
          currentTicketId: nextTicket.id,
          statusText: `Calling ${nextTicket.ticketNumber}`,
        };
      }
      return c;
    }));

    // Notify student
    addNotification({
      ticketId: nextTicket.id,
      studentId: nextTicket.studentId,
      title: `🔔 Ticket ${nextTicket.ticketNumber} is CALLED!`,
      message: `Please proceed immediately to Counter ${counter.counterNumber}. You have a 3-minute grace window.`,
      type: 'CALLED',
    });

    // Check approaching alerts for remaining students
    checkApproachingTurnNotifications(officeId, updated);

    return nextTicket;
  };

  // 5. Staff: Recall Ticket
  const recallTicket = (ticketId: string) => {
    const tkt = tickets.find(t => t.id === ticketId);
    if (!tkt) return;

    addNotification({
      ticketId: tkt.id,
      studentId: tkt.studentId,
      title: `🔔 FINAL RECALL: Ticket ${tkt.ticketNumber}`,
      message: `Ticket ${tkt.ticketNumber} is being recalled at Counter ${tkt.assignedCounterNumber || 1}! Please proceed now.`,
      type: 'CALLED',
    });
  };

  // 6. Staff: Start Serving
  const startServing = (ticketId: string) => {
    const nowIso = new Date().toISOString();
    setTickets(prev => prev.map(t => {
      if (t.id === ticketId) {
        return {
          ...t,
          status: 'SERVING' as TicketStatus,
          serviceStartedAt: nowIso,
        };
      }
      return t;
    }));
  };

  // 7. Staff: Complete Service
  const completeServing = (ticketId: string) => {
    const nowIso = new Date().toISOString();
    const tkt = tickets.find(t => t.id === ticketId);
    
    setTickets(prev => prev.map(t => {
      if (t.id === ticketId) {
        return {
          ...t,
          status: 'COMPLETED' as TicketStatus,
          completedAt: nowIso,
        };
      }
      return t;
    }));

    // Release counter
    if (tkt?.assignedCounterId) {
      setCounters(prev => prev.map(c => {
        if (c.id === tkt.assignedCounterId) {
          return {
            ...c,
            currentTicketId: undefined,
            statusText: 'Available',
          };
        }
        return c;
      }));
    }

    if (tkt) {
      addNotification({
        ticketId: tkt.id,
        studentId: tkt.studentId,
        title: `Transaction Completed: ${tkt.ticketNumber}`,
        message: 'Thank you for transacting with St. Anthony\'s College. Have a great day!',
        type: 'COMPLETED',
      });
    }
  };

  // 8. Staff: Skip / No-show
  const skipTicket = (ticketId: string) => {
    setTickets(prev => prev.map(t => {
      if (t.id === ticketId) {
        return { ...t, status: 'SKIPPED' as TicketStatus };
      }
      return t;
    }));
  };

  const markNoShow = (ticketId: string) => {
    setTickets(prev => prev.map(t => {
      if (t.id === ticketId) {
        return { ...t, status: 'NO_SHOW' as TicketStatus };
      }
      return t;
    }));
  };

  const pauseCounter = (counterId: string) => {
    setCounters(prev => prev.map(c => {
      if (c.id === counterId) return { ...c, isPaused: true, statusText: 'Paused' };
      return c;
    }));
  };

  const resumeCounter = (counterId: string) => {
    setCounters(prev => prev.map(c => {
      if (c.id === counterId) return { ...c, isPaused: false, statusText: 'Available' };
      return c;
    }));
  };

  // 9. Walk-in / Kiosk ticket creation
  const createWalkInTicket = (officeId: string, serviceId: string): QueueTicket => {
    const office = offices.find(o => o.id === officeId);
    const prefix = office ? office.prefix : 'W';
    const existingOfficeTickets = tickets.filter(t => t.officeId === officeId);
    const nextSeq = existingOfficeTickets.length + 1;
    const formattedNum = `${prefix}-${String(nextSeq).padStart(3, '0')}`;

    const newTicket: QueueTicket = {
      id: `tkt-walkin-${Date.now()}`,
      ticketNumber: formattedNum,
      officeId,
      serviceId,
      studentId: `walkin-${Date.now()}`,
      studentName: `Walk-in Guest (${formattedNum})`,
      isWalkIn: true,
      qrToken: generateQRToken(formattedNum),
      lookupCode: generateLookupCode(formattedNum),
      status: 'WAITING',
      issuedAt: new Date().toISOString(),
      defermentCount: 0,
      maxDefermentsAllowed: 1,
    };

    setTickets(prev => [...prev, newTicket]);
    return newTicket;
  };

  const markNotificationRead = (notifId: string) => {
    setNotifications(prev => prev.map(n => n.id === notifId ? { ...n, read: true } : n));
  };

  const clearNotifications = () => {
    setNotifications([]);
  };

  return (
    <QueueContext.Provider
      value={{
        currentRole,
        setCurrentRole,
        currentStudentId,
        currentStaffOfficeId,
        setCurrentStaffOfficeId,
        offices,
        services,
        counters,
        tickets,
        events,
        notifications,
        announcements,
        joinQueue,
        requestDeferment,
        resumeDeferredTicket,
        cancelTicket,
        markNotificationRead,
        clearNotifications,
        callNextTicket,
        recallTicket,
        startServing,
        completeServing,
        skipTicket,
        markNoShow,
        pauseCounter,
        resumeCounter,
        createWalkInTicket,
        nowServingTicket,
        getOfficeTickets,
      }}
    >
      {children}
    </QueueContext.Provider>
  );
}

export function useQueue() {
  const context = useContext(QueueContext);
  if (!context) {
    throw new Error('useQueue must be used within a QueueProvider');
  }
  return context;
}
