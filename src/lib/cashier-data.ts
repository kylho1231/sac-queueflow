import { 
  Office, 
  ServiceCategory, 
  ServiceCounter, 
  QueueTicket, 
  CampusAnnouncement 
} from '@/types/queue';

// Single Office: St. Anthony's College Cashier's Office
export const CASHIER_OFFICE: Office = {
  id: 'off-cashier',
  name: "Cashier's Office",
  code: 'CSH',
  description: 'Tuition and fee settlement, examination permits, downpayment, and official receipts.',
  prefix: 'C',
  location: 'Main Administration Building, Ground Floor',
  isOpen: true,
  activeCountersCount: 2,
  averageServiceMinutes: 3,
};

// 2 Exclusive Dedicated Cashier Counters (Cashier 1 & Cashier 2)
export const CASHIER_COUNTERS: ServiceCounter[] = [
  {
    id: 'cnt-csh-1',
    officeId: 'off-cashier',
    counterNumber: 1,
    name: 'Cashier Counter 1 (Window 1)',
    assignedStaffName: 'Cashier Officer #1',
    isPaused: false,
    statusText: 'Available',
  },
  {
    id: 'cnt-csh-2',
    officeId: 'off-cashier',
    counterNumber: 2,
    name: 'Cashier Counter 2 (Window 2)',
    assignedStaffName: 'Cashier Officer #2',
    isPaused: false,
    statusText: 'Available',
  }
];

// Payment Categories matching the official SAC Payment Slip (Form Code: FO 07, Rev 1)
export const PAYMENT_SLIP_SERVICES: ServiceCategory[] = [
  {
    id: 'srv-enrollment-downpayment',
    officeId: 'off-cashier',
    name: 'Enrollment Downpayment',
    description: 'Initial semester fee and enrollment confirmation downpayment',
    estimatedMinutes: 3,
    isActive: true,
  },
  {
    id: 'srv-exam-period-payment',
    officeId: 'off-cashier',
    name: 'Prelim / Midterm / Finals Exam Fee',
    description: '1st / 2nd / 3rd / 4th Quarter examination permit validation and settlement',
    estimatedMinutes: 3,
    isActive: true,
  },
  {
    id: 'srv-old-accounts',
    officeId: 'off-cashier',
    name: 'Old Accounts & Past Balances',
    description: 'Settlement of previous semester outstanding balances and clearances',
    estimatedMinutes: 4,
    isActive: true,
  },
  {
    id: 'srv-others-specified',
    officeId: 'off-cashier',
    name: 'Others / Miscellaneous / Document Fees',
    description: 'Graduation fee, transcript fee, diploma, ID replacement, or other fees',
    estimatedMinutes: 3,
    isActive: true,
  }
];

// Seed tickets for Cashier 1 & Cashier 2
export const INITIAL_CASHIER_TICKETS: QueueTicket[] = [
  {
    id: 'tkt-c-101',
    ticketNumber: 'C-101',
    officeId: 'off-cashier',
    serviceId: 'srv-exam-period-payment',
    studentId: 'stud-walkin-1',
    studentName: 'Ticket C-101',
    studentNumber: '2023-01824',
    isWalkIn: true,
    qrToken: 'SAC-PASS-C101-7891',
    lookupCode: 'C101-4412',
    status: 'SERVING',
    issuedAt: new Date(Date.now() - 15 * 60000).toISOString(),
    calledAt: new Date(Date.now() - 3 * 60000).toISOString(),
    serviceStartedAt: new Date(Date.now() - 2 * 60000).toISOString(),
    assignedCounterId: 'cnt-csh-1',
    assignedCounterNumber: 1,
    defermentCount: 0,
    maxDefermentsAllowed: 1,
  },
  {
    id: 'tkt-c-102',
    ticketNumber: 'C-102',
    officeId: 'off-cashier',
    serviceId: 'srv-enrollment-downpayment',
    studentId: 'stud-walkin-2',
    studentName: 'Ticket C-102',
    studentNumber: '2022-09411',
    isWalkIn: true,
    qrToken: 'SAC-PASS-C102-1209',
    lookupCode: 'C102-9901',
    status: 'CALLED',
    issuedAt: new Date(Date.now() - 12 * 60000).toISOString(),
    calledAt: new Date(Date.now() - 1 * 60000).toISOString(),
    assignedCounterId: 'cnt-csh-2',
    assignedCounterNumber: 2,
    defermentCount: 0,
    maxDefermentsAllowed: 1,
  },
  {
    id: 'tkt-c-103',
    ticketNumber: 'C-103',
    officeId: 'off-cashier',
    serviceId: 'srv-exam-period-payment',
    studentId: 'stud-walkin-3',
    studentName: 'Ticket C-103',
    studentNumber: '2024-00122',
    isWalkIn: true,
    qrToken: 'SAC-PASS-C103-6612',
    lookupCode: 'C103-8871',
    status: 'WAITING',
    issuedAt: new Date(Date.now() - 8 * 60000).toISOString(),
    defermentCount: 0,
    maxDefermentsAllowed: 1,
  },
  {
    id: 'tkt-c-104',
    ticketNumber: 'C-104',
    officeId: 'off-cashier',
    serviceId: 'srv-old-accounts',
    studentId: 'stud-walkin-4',
    studentName: 'Ticket C-104',
    studentNumber: '2021-08123',
    isWalkIn: true,
    qrToken: 'SAC-PASS-C104-3321',
    lookupCode: 'C104-1102',
    status: 'WAITING',
    issuedAt: new Date(Date.now() - 5 * 60000).toISOString(),
    defermentCount: 0,
    maxDefermentsAllowed: 1,
  },
  {
    id: 'tkt-c-105',
    ticketNumber: 'C-105',
    officeId: 'off-cashier',
    serviceId: 'srv-others-specified',
    studentId: 'stud-walkin-5',
    studentName: 'Ticket C-105',
    isWalkIn: true,
    qrToken: 'SAC-PASS-C105-9981',
    lookupCode: 'C105-7731',
    status: 'WAITING',
    issuedAt: new Date(Date.now() - 2 * 60000).toISOString(),
    defermentCount: 0,
    maxDefermentsAllowed: 1,
  }
];

export const CASHIER_ANNOUNCEMENTS: CampusAnnouncement[] = [
  {
    id: 'anc-csh-1',
    title: 'Cashier Queuing Active',
    content: 'Cashier Windows 1 & 2 are currently calling. Please proceed promptly when your queue number is announced.',
    priority: 'URGENT',
    date: 'Today',
    isActive: true,
  }
];
