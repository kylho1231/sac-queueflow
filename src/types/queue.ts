// SAC QueueFlow Core Types & Data Definitions
// Institution: St. Anthony's College, San Jose de Buenavista, Antique, Philippines

export type UserRole = 'student' | 'staff' | 'admin';

export type TicketStatus = 
  | 'WAITING'
  | 'NOTIFIED'
  | 'CALLED'
  | 'SERVING'
  | 'COMPLETED'
  | 'DEFERRED'
  | 'SKIPPED'
  | 'NO_SHOW'
  | 'CANCELLED';

export interface Office {
  id: string;
  name: string;
  code: string; // e.g., 'REG', 'CSH'
  description: string;
  prefix: string; // e.g., 'R', 'C'
  location: string;
  isOpen: boolean;
  activeCountersCount: number;
  averageServiceMinutes: number;
}

export interface ServiceCategory {
  id: string;
  officeId: string;
  name: string;
  description: string;
  estimatedMinutes: number;
  isActive: boolean;
}

export interface ServiceCounter {
  id: string;
  officeId: string;
  counterNumber: number;
  name: string;
  assignedStaffId?: string;
  assignedStaffName?: string;
  currentTicketId?: string;
  isPaused: boolean;
  statusText?: string;
}

export interface QueueTicket {
  id: string;
  ticketNumber: string; // e.g., 'R-042'
  officeId: string;
  serviceId: string;
  studentId: string;
  studentName: string;
  studentEmail?: string;
  studentNumber?: string;
  isWalkIn: boolean;
  qrToken: string;
  lookupCode: string;
  status: TicketStatus;
  issuedAt: string;
  calledAt?: string;
  serviceStartedAt?: string;
  completedAt?: string;
  cancelledAt?: string;
  assignedCounterId?: string;
  assignedCounterNumber?: number;
  defermentCount: number;
  maxDefermentsAllowed: number;
  defermentReason?: string;
  defermentExpiresAt?: string;
  notes?: string;
}

export interface QueueEvent {
  id: string;
  ticketId: string;
  ticketNumber: string;
  officeId: string;
  eventType: 
    | 'CREATED'
    | 'POSITION_UPDATE'
    | 'NOTIFIED'
    | 'CALLED'
    | 'RECALLED'
    | 'SERVICE_STARTED'
    | 'SERVICE_COMPLETED'
    | 'DEFERRED'
    | 'SKIPPED'
    | 'NO_SHOW'
    | 'CANCELLED'
    | 'TRANSFERRED';
  performedByRole: UserRole | 'SYSTEM';
  performedById?: string;
  timestamp: string;
  details?: string;
}

export interface QueueNotification {
  id: string;
  ticketId: string;
  studentId: string;
  title: string;
  message: string;
  type: 'INFO' | 'APPROACHING' | 'CALLED' | 'DEFERRED' | 'COMPLETED' | 'WARNING';
  read: boolean;
  timestamp: string;
}

export interface CampusAnnouncement {
  id: string;
  title: string;
  content: string;
  officeId?: string;
  priority: 'NORMAL' | 'URGENT';
  date: string;
  isActive: boolean;
}

export interface QueueEstimate {
  studentsAhead: number;
  estimatedWaitMinutesMin: number;
  estimatedWaitMinutesMax: number;
  formattedEstimate: string;
  activeCounters: number;
  isAvailable: boolean;
}
