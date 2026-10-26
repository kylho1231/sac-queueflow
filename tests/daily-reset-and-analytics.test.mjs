import { test } from 'node:test';
import assert from 'node:assert/strict';
import { 
  getNextSeqTicketNumber, 
  formatTicketNumber, 
  isSeniorCitizenTicket,
  getTodayDateString,
  getTicketDateString 
} from '../src/lib/utils.ts';

test('Philippine Standard Time Date Formatting', () => {
  const today = getTodayDateString();
  assert.match(today, /^\d{4}-\d{2}-\d{2}$/, 'Date format should be YYYY-MM-DD');

  const iso = '2026-10-26T14:30:00.000Z';
  const ticketDate = getTicketDateString(iso);
  assert.equal(ticketDate, '2026-10-26');
});

test('Ticket format and max limit 1000', () => {
  assert.equal(formatTicketNumber(1, 'C'), 'C-001');
  assert.equal(formatTicketNumber(99, 'C'), 'C-099');
  assert.equal(formatTicketNumber(999, 'C'), 'C-999');
  assert.equal(formatTicketNumber(1000, 'C'), 'C-1000');
  // Over 1000 wraps back to 1
  assert.equal(formatTicketNumber(1001, 'C'), 'C-001');

  // Senior Citizen prefix
  assert.equal(formatTicketNumber(1, 'S'), 'S-001');
  assert.equal(formatTicketNumber(1000, 'S'), 'S-1000');
  assert.equal(formatTicketNumber(1001, 'S'), 'S-001');
});

test('Automatic sequence reset to #1 on the next day', () => {
  const yesterday = '2026-10-25';
  const today = '2026-10-26';

  // Yesterday had many tickets (up to C-842 and S-115) during cashier hours (PST UTC+8)
  const ticketsHistory = [
    { ticketNumber: 'C-001', issuedAt: `${yesterday}T01:00:00.000Z` }, // 09:00 AM PST
    { ticketNumber: 'C-050', issuedAt: `${yesterday}T03:00:00.000Z` }, // 11:00 AM PST
    { ticketNumber: 'C-842', issuedAt: `${yesterday}T08:00:00.000Z` }, // 04:00 PM PST
    { ticketNumber: 'S-001', issuedAt: `${yesterday}T01:30:00.000Z` },
    { ticketNumber: 'S-115', issuedAt: `${yesterday}T07:00:00.000Z` },
  ];

  // When next day (today) begins, the sequence MUST reset back to C-001 and S-001!
  const firstRegularToday = getNextSeqTicketNumber(ticketsHistory, 'C', today);
  assert.equal(firstRegularToday, 'C-001', 'First ticket of the new day must be C-001');

  const firstSeniorToday = getNextSeqTicketNumber(ticketsHistory, 'S', today);
  assert.equal(firstSeniorToday, 'S-001', 'First Senior ticket of the new day must be S-001');

  // Once today's tickets are added, it increments within today
  ticketsHistory.push({ ticketNumber: 'C-001', issuedAt: `${today}T08:05:00.000Z` });
  const secondRegularToday = getNextSeqTicketNumber(ticketsHistory, 'C', today);
  assert.equal(secondRegularToday, 'C-002', 'Next ticket of today must be C-002');

  ticketsHistory.push({ ticketNumber: 'S-001', issuedAt: `${today}T08:10:00.000Z` });
  const secondSeniorToday = getNextSeqTicketNumber(ticketsHistory, 'S', today);
  assert.equal(secondSeniorToday, 'S-002', 'Next Senior ticket of today must be S-002');
});

test('Ticket rollover after reaching C-1000', () => {
  const today = getTodayDateString();
  const tickets = [
    { ticketNumber: 'C-1000', issuedAt: new Date().toISOString() }
  ];
  const nextTicket = getNextSeqTicketNumber(tickets, 'C', today);
  assert.equal(nextTicket, 'C-001', 'After reaching C-1000, next ticket must roll over to C-001');
});

test('Senior Citizen classification detection', () => {
  assert.equal(isSeniorCitizenTicket('S-001'), true);
  assert.equal(isSeniorCitizenTicket('C-001'), false);
  assert.equal(isSeniorCitizenTicket({ ticketNumber: 'S-042' }), true);
  assert.equal(isSeniorCitizenTicket({ ticketNumber: 'C-042', isSeniorCitizen: true }), true);
  assert.equal(isSeniorCitizenTicket({ ticketNumber: 'C-042', ticketType: 'SENIOR_CITIZEN' }), true);
  assert.equal(isSeniorCitizenTicket({ ticketNumber: 'C-042' }), false);
});

test('Cashier Analytics KPI and Window Throughput Computation', () => {
  const today = getTodayDateString();
  const mockTickets = [
    { id: '1', ticketNumber: 'C-001', status: 'COMPLETED', assignedCounterNumber: 1, issuedAt: `${today}T01:00:00.000Z`, serviceId: 'srv-exam-period-payment' },
    { id: '2', ticketNumber: 'C-002', status: 'COMPLETED', assignedCounterNumber: 1, issuedAt: `${today}T01:10:00.000Z`, serviceId: 'srv-enrollment-downpayment' },
    { id: '3', ticketNumber: 'S-001', status: 'COMPLETED', assignedCounterNumber: 2, issuedAt: `${today}T01:15:00.000Z`, isSeniorCitizen: true, serviceId: 'srv-exam-period-payment' },
    { id: '4', ticketNumber: 'C-003', status: 'COMPLETED', assignedCounterNumber: 3, issuedAt: `${today}T01:20:00.000Z`, serviceId: 'srv-old-accounts' },
    { id: '5', ticketNumber: 'C-004', status: 'COMPLETED', assignedCounterNumber: 4, issuedAt: `${today}T01:25:00.000Z`, serviceId: 'srv-others-specified' },
    { id: '6', ticketNumber: 'C-005', status: 'COMPLETED', assignedCounterNumber: 5, issuedAt: `${today}T01:30:00.000Z`, serviceId: 'srv-exam-period-payment' },
    { id: '7', ticketNumber: 'C-006', status: 'WAITING', issuedAt: `${today}T01:35:00.000Z` },
    // Ticket from yesterday should NOT count in today's completed transactions
    { id: '8', ticketNumber: 'C-099', status: 'COMPLETED', assignedCounterNumber: 1, issuedAt: '2026-10-25T01:00:00.000Z' },
  ];

  // 1. Total Completed Today
  const todayCompleted = mockTickets.filter(
    t => t.status === 'COMPLETED' && getTicketDateString(t.issuedAt) === today
  );
  assert.equal(todayCompleted.length, 6, 'Total students transacted today should be 6');

  // 2. Category Breakdown
  const regularCount = todayCompleted.filter(t => !isSeniorCitizenTicket(t)).length;
  const seniorCount = todayCompleted.filter(t => isSeniorCitizenTicket(t)).length;
  assert.equal(regularCount, 5, 'Regular students transacted today should be 5');
  assert.equal(seniorCount, 1, 'Senior citizens transacted today should be 1');

  // 3. Window Throughput (Windows 1 to 5)
  const window1Count = todayCompleted.filter(t => t.assignedCounterNumber === 1).length;
  const window2Count = todayCompleted.filter(t => t.assignedCounterNumber === 2).length;
  const window3Count = todayCompleted.filter(t => t.assignedCounterNumber === 3).length;
  const window4Count = todayCompleted.filter(t => t.assignedCounterNumber === 4).length;
  const window5Count = todayCompleted.filter(t => t.assignedCounterNumber === 5).length;

  assert.equal(window1Count, 2);
  assert.equal(window2Count, 1);
  assert.equal(window3Count, 1);
  assert.equal(window4Count, 1);
  assert.equal(window5Count, 1);
});

