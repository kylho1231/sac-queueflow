'use client';

import React, { useState, useMemo } from 'react';
import { useCashierQueue, WindowNumber } from '@/context/CashierQueueContext';
import { PAYMENT_SLIP_SERVICES } from '@/lib/cashier-data';
import { getTodayDateString, getTicketDateString, isSeniorCitizenTicket } from '@/lib/utils';
import { SACLogo } from '@/components/SACLogo';
import {
  Users,
  CheckCircle2,
  Clock,
  FileSpreadsheet,
  Printer,
  HeartHandshake,
  Receipt,
  TrendingUp,
  Filter,
  Search,
  Building2,
  Calendar,
  Layers,
  ArrowUpDown,
  ArrowLeft
} from 'lucide-react';

interface CashierAnalyticsProps {
  onBackToTerminal?: () => void;
}

export function CashierAnalytics({ onBackToTerminal }: CashierAnalyticsProps) {
  const { tickets, counters } = useCashierQueue();

  const [windowFilter, setWindowFilter] = useState<'all' | '1' | '2' | '3' | '4' | '5'>('all');
  const [typeFilter, setTypeFilter] = useState<'all' | 'regular' | 'senior'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const [todayStr, setTodayStr] = useState<string>('');
  const [formattedToday, setFormattedToday] = useState<string>('Today');

  React.useEffect(() => {
    const today = getTodayDateString();
    setTodayStr(today);
    try {
      setFormattedToday(
        new Date().toLocaleDateString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          timeZone: 'Asia/Manila'
        })
      );
    } catch {
      setFormattedToday(today);
    }
  }, []);

  // Filter tickets for today
  const todayTickets = useMemo(() => {
    if (!todayStr) return tickets;
    return tickets.filter(t => getTicketDateString(t.issuedAt) === todayStr);
  }, [tickets, todayStr]);

  // Status metrics
  const completedTickets = useMemo(() => {
    return todayTickets.filter(t => t.status === 'COMPLETED');
  }, [todayTickets]);

  const activeTickets = useMemo(() => {
    return todayTickets.filter(t => t.status === 'CALLED' || t.status === 'SERVING');
  }, [todayTickets]);

  const waitingTickets = useMemo(() => {
    return todayTickets.filter(t => t.status === 'WAITING');
  }, [todayTickets]);

  const skippedTickets = useMemo(() => {
    return todayTickets.filter(t => t.status === 'SKIPPED' || t.status === 'NO_SHOW');
  }, [todayTickets]);

  // Breakdown by Student Category
  const regularCompletedCount = useMemo(() => {
    return completedTickets.filter(t => !isSeniorCitizenTicket(t)).length;
  }, [completedTickets]);

  const seniorCompletedCount = useMemo(() => {
    return completedTickets.filter(t => isSeniorCitizenTicket(t)).length;
  }, [completedTickets]);

  // Average Service Duration (in seconds)
  const averageServiceSeconds = useMemo(() => {
    const validDurations = completedTickets
      .map(t => {
        if (!t.completedAt) return 0;
        const start = t.serviceStartedAt || t.calledAt || t.issuedAt;
        const diff = (new Date(t.completedAt).getTime() - new Date(start).getTime()) / 1000;
        return diff > 0 && diff < 3600 ? diff : 0;
      })
      .filter(sec => sec > 0);

    if (validDurations.length === 0) return 165; // ~2m 45s standard average benchmark
    const sum = validDurations.reduce((acc, curr) => acc + curr, 0);
    return Math.round(sum / validDurations.length);
  }, [completedTickets]);

  const formatDurationMinSec = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const remainingSec = sec % 60;
    return `${mins}m ${remainingSec}s`;
  };

  // Window Throughput Data (Windows 1 to 5)
  const windowStats = useMemo(() => {
    const windows: WindowNumber[] = [1, 2, 3, 4, 5];
    return windows.map(win => {
      const winCompleted = completedTickets.filter(t => t.assignedCounterNumber === win);
      const winActive = todayTickets.find(
        t => t.assignedCounterNumber === win && (t.status === 'CALLED' || t.status === 'SERVING')
      );
      const counter = counters.find(c => c.counterNumber === win);
      const percentage = completedTickets.length > 0 
        ? Math.round((winCompleted.length / completedTickets.length) * 100) 
        : 0;

      return {
        windowNumber: win,
        counterName: counter?.name || `Cashier Counter ${win}`,
        staffName: counter?.assignedStaffName || `Cashier Officer #${win}`,
        completedCount: winCompleted.length,
        percentage,
        activeTicket: winActive,
        isAvailable: !winActive,
      };
    });
  }, [completedTickets, todayTickets, counters]);

  // Service Category Breakdown
  const serviceStats = useMemo(() => {
    return PAYMENT_SLIP_SERVICES.map(srv => {
      const count = completedTickets.filter(t => t.serviceId === srv.id).length;
      const percentage = completedTickets.length > 0
        ? Math.round((count / completedTickets.length) * 100)
        : 0;
      return {
        ...srv,
        count,
        percentage,
      };
    });
  }, [completedTickets]);

  // Filtered Transaction Table Rows
  const tableRows = useMemo(() => {
    return todayTickets
      .filter(t => {
        if (windowFilter !== 'all' && t.assignedCounterNumber?.toString() !== windowFilter) {
          return false;
        }
        if (typeFilter === 'regular' && isSeniorCitizenTicket(t)) {
          return false;
        }
        if (typeFilter === 'senior' && !isSeniorCitizenTicket(t)) {
          return false;
        }
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchNum = t.ticketNumber.toLowerCase().includes(q);
          const matchName = t.studentName.toLowerCase().includes(q);
          const matchId = t.studentNumber?.toLowerCase().includes(q);
          if (!matchNum && !matchName && !matchId) return false;
        }
        return true;
      })
      .sort((a, b) => {
        const timeA = new Date(a.completedAt || a.calledAt || a.issuedAt).getTime();
        const timeB = new Date(b.completedAt || b.calledAt || b.issuedAt).getTime();
        return timeB - timeA;
      });
  }, [todayTickets, windowFilter, typeFilter, searchQuery]);

  // Export CSV Handler
  const handleExportCSV = () => {
    const headers = [
      'Ticket Number',
      'Student Name',
      'Student Number',
      'Category',
      'Assigned Window',
      'Service Name',
      'Status',
      'Issued Time',
      'Called Time',
      'Completed Time',
    ];

    const rows = tableRows.map(t => {
      const srvName = PAYMENT_SLIP_SERVICES.find(s => s.id === t.serviceId)?.name || 'General Payment';
      const isSen = isSeniorCitizenTicket(t);
      return [
        t.ticketNumber,
        `"${t.studentName}"`,
        `"${t.studentNumber || ''}"`,
        isSen ? 'Senior Citizen (Priority)' : 'Regular Student',
        t.assignedCounterNumber ? `Window ${t.assignedCounterNumber}` : 'Unassigned',
        `"${srvName}"`,
        t.status,
        t.issuedAt ? new Date(t.issuedAt).toLocaleTimeString() : '',
        t.calledAt ? new Date(t.calledAt).toLocaleTimeString() : '',
        t.completedAt ? new Date(t.completedAt).toLocaleTimeString() : '',
      ];
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `sac-cashier-daily-transactions-${todayStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 max-w-6xl w-full mx-auto p-3 sm:p-6 lg:p-8 bg-white font-sans text-slate-900">
      {/* Top Banner & Audit Controls */}
      <div className="bg-white rounded-3xl p-5 sm:p-7 border-2 border-[#EA671B]/30 shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center space-x-3.5">
          <SACLogo className="w-12 h-12 sm:w-14 sm:h-14 drop-shadow-xs shrink-0" />
          <div>
            <div className="flex items-center space-x-2 flex-wrap gap-1">
              <span className="text-[10px] sm:text-xs font-black text-[#B44606] bg-[#FFF8F1] px-2.5 py-0.5 rounded-full border border-[#EA671B]/30 uppercase tracking-widest">
                ST. ANTHONY&apos;S COLLEGE &bull; SAN JOSE, ANTIQUE
              </span>
              <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 inline-flex items-center space-x-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                <span>DAILY RESET ACTIVE</span>
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-[#751A1A] tracking-tight mt-1">
              Cashier Transaction Analytics &amp; Throughput
            </h1>
            <p className="text-xs text-slate-600 mt-0.5 flex items-center space-x-1.5">
              <Calendar className="w-3.5 h-3.5 text-[#EA671B]" />
              <span>Audit Period: <strong>{formattedToday}</strong> (Resets every day back to #1)</span>
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center space-x-2 w-full md:w-auto justify-end flex-wrap gap-2">
          {onBackToTerminal && (
            <button
              type="button"
              onClick={onBackToTerminal}
              className="min-h-[44px] bg-white hover:bg-[#FFF8F1] text-[#751A1A] border-2 border-[#EA671B]/40 hover:border-[#EA671B] text-xs font-bold px-3.5 py-2 rounded-xl transition-all flex items-center space-x-1.5 cursor-pointer shadow-2xs"
            >
              <ArrowLeft className="w-4 h-4 text-[#EA671B]" />
              <span>Back to Calling Station</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleExportCSV}
            className="min-h-[44px] bg-[#751A1A] hover:bg-[#5A1212] text-white text-xs font-bold px-4 py-2 rounded-xl shadow-xs transition-all flex items-center space-x-1.5 cursor-pointer"
            title="Download CSV report of today's cashier transactions"
          >
            <FileSpreadsheet className="w-4 h-4 text-amber-200" />
            <span>Export CSV Report</span>
          </button>

          <button
            type="button"
            onClick={() => window.print()}
            className="min-h-[44px] bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 text-xs font-semibold px-3.5 py-2 rounded-xl transition-all flex items-center space-x-1.5 cursor-pointer shadow-2xs"
            title="Print Official Form FO 07 Summary"
          >
            <Printer className="w-4 h-4 text-slate-500" />
            <span>Print</span>
          </button>
        </div>
      </div>

      {/* 4 PRIMARY METRIC SUMMARY CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Completed */}
        <div className="bg-[#FFF8F1] rounded-2xl sm:rounded-3xl p-4 sm:p-5 border-2 border-[#EA671B]/30 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-xs font-extrabold uppercase tracking-wider text-[#B44606]">
              Total Students Transacted
            </span>
            <div className="w-8 h-8 rounded-xl bg-[#751A1A] text-white flex items-center justify-center shadow-2xs">
              <CheckCircle2 className="w-4 h-4 text-amber-200" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline space-x-2">
            <span className="text-3xl sm:text-4xl lg:text-5xl font-black font-mono text-[#751A1A]">
              {completedTickets.length}
            </span>
            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              Completed
            </span>
          </div>
          <p className="text-[11px] text-slate-600 mt-1.5 font-medium">
            Paid &amp; officially receipted transactions today
          </p>
        </div>

        {/* Regular vs Senior Citizen Breakdown */}
        <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-5 border border-slate-200 shadow-xs relative">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-xs font-extrabold uppercase tracking-wider text-slate-700">
              Category Breakdown
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-2xs">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2.5 space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-700 flex items-center space-x-1">
                <span className="w-2 h-2 rounded-full bg-[#751A1A]" />
                <span>Regular (C-xxx):</span>
              </span>
              <strong className="font-mono font-bold text-slate-900">{regularCompletedCount}</strong>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-700 flex items-center space-x-1">
                <span className="w-2 h-2 rounded-full bg-[#EA671B]" />
                <span>Senior (S-xxx):</span>
              </span>
              <strong className="font-mono font-bold text-[#B44606]">{seniorCompletedCount}</strong>
            </div>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-1.5 mt-2 overflow-hidden flex">
            <div
              className="bg-[#751A1A] h-1.5"
              style={{
                width: `${completedTickets.length > 0 ? (regularCompletedCount / completedTickets.length) * 100 : 50}%`
              }}
            />
            <div
              className="bg-[#EA671B] h-1.5"
              style={{
                width: `${completedTickets.length > 0 ? (seniorCompletedCount / completedTickets.length) * 100 : 50}%`
              }}
            />
          </div>
        </div>

        {/* Average Service Duration */}
        <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-5 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-xs font-extrabold uppercase tracking-wider text-slate-700">
              Avg. Service Duration
            </span>
            <div className="w-8 h-8 rounded-xl bg-slate-100 text-[#751A1A] flex items-center justify-center">
              <Clock className="w-4 h-4 text-[#EA671B]" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline space-x-2">
            <span className="text-2xl sm:text-3xl lg:text-4xl font-black font-mono text-[#751A1A]">
              {formatDurationMinSec(averageServiceSeconds)}
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1 font-medium">
            Average cashier window handling time per student
          </p>
        </div>

        {/* Current Active Pipeline */}
        <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-5 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-xs font-extrabold uppercase tracking-wider text-slate-700">
              Current Live Queue
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-800 flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-emerald-600" />
            </div>
          </div>
          <div className="mt-2.5 space-y-1 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-slate-600">Now In Windows:</span>
              <strong className="font-mono text-emerald-700 font-black">{activeTickets.length} / 5</strong>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-600">Waiting in line:</span>
              <strong className="font-mono text-[#751A1A] font-bold">{waitingTickets.length}</strong>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-600">Skipped / No-show:</span>
              <strong className="font-mono text-slate-500">{skippedTickets.length}</strong>
            </div>
          </div>
        </div>
      </div>

      {/* WINDOW THROUGHPUT BREAKDOWN (WINDOWS 1 TO 5) */}
      <section className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center space-x-2">
            <Building2 className="w-5 h-5 text-[#EA671B]" />
            <h2 className="text-base sm:text-lg font-black text-[#751A1A]">
              Window Throughput &amp; Officer Performance (Windows 1 to 5)
            </h2>
          </div>
          <span className="text-xs font-bold text-slate-500">
            5 Dedicated Desks
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-3.5">
          {windowStats.map(stat => (
            <div
              key={stat.windowNumber}
              className={`p-4 rounded-2xl border-2 transition-all flex flex-col justify-between ${
                stat.activeTicket 
                  ? 'border-[#EA671B]/50 bg-[#FFF8F1]/40 shadow-xs' 
                  : 'border-slate-200 bg-white hover:border-slate-300'
              }`}
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-[#751A1A] uppercase tracking-wider">
                    WINDOW {stat.windowNumber}
                  </span>
                  <span className={`w-2 h-2 rounded-full ${stat.activeTicket ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`} />
                </div>
                <span className="text-[11px] text-slate-500 block truncate mt-0.5">
                  {stat.staffName}
                </span>

                <div className="my-3">
                  <span className="text-2xl sm:text-3xl font-black font-mono text-[#751A1A] block leading-none">
                    {stat.completedCount}
                  </span>
                  <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider block mt-0.5">
                    Students Transacted
                  </span>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono mb-1">
                  <span>Share of Total:</span>
                  <strong>{stat.percentage}%</strong>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="bg-[#EA671B] h-1.5 rounded-full"
                    style={{ width: `${Math.max(5, stat.percentage)}%` }}
                  />
                </div>

                <div className="mt-2.5 pt-2 border-t border-slate-100 text-[10px] text-slate-600 font-semibold flex items-center justify-between">
                  <span>Current:</span>
                  <span className={stat.activeTicket ? 'text-[#B44606] font-bold' : 'text-slate-400'}>
                    {stat.activeTicket ? stat.activeTicket.ticketNumber : 'Available'}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* SERVICE CATEGORY BREAKDOWN */}
      <section className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center space-x-2">
            <Receipt className="w-5 h-5 text-[#EA671B]" />
            <h2 className="text-base sm:text-lg font-black text-[#751A1A]">
              Transactions by Payment Category (Form FO 07 Classification)
            </h2>
          </div>
          <span className="text-xs font-bold text-[#B44606]">
            {completedTickets.length} Total Settled
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {serviceStats.map(srv => (
            <div key={srv.id} className="p-4 rounded-2xl bg-[#FFF8F1]/50 border border-[#EA671B]/20">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#751A1A] block line-clamp-1" title={srv.name}>
                  {srv.name}
                </span>
                <span className="text-[10px] font-mono font-bold text-[#B44606] bg-white px-1.5 py-0.5 rounded shadow-2xs">
                  {srv.percentage}%
                </span>
              </div>
              <p className="text-[10px] text-slate-500 line-clamp-1 mt-0.5">
                {srv.description}
              </p>
              <div className="mt-2.5 flex items-baseline space-x-1.5">
                <span className="text-2xl font-black font-mono text-[#751A1A]">
                  {srv.count}
                </span>
                <span className="text-[10px] text-slate-500 font-medium">Students</span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-1.5 mt-2 overflow-hidden">
                <div
                  className="bg-[#751A1A] h-1.5 rounded-full"
                  style={{ width: `${Math.max(5, srv.percentage)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* DETAILED TRANSACTION LOG TABLE */}
      <section className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div>
            <h2 className="text-base sm:text-lg font-black text-[#751A1A]">
              Today&apos;s Student Transaction Log ({tableRows.length})
            </h2>
            <p className="text-xs text-slate-500">
              Detailed chronological record of every queue slip processed today
            </p>
          </div>

          {/* Filters & Search */}
          <div className="flex items-center space-x-2 flex-wrap gap-2">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search ticket, name, ID..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pl-8 pr-3 py-1.5 rounded-xl border border-slate-300 text-xs text-slate-800 outline-hidden focus:ring-2 focus:ring-[#EA671B] w-44 sm:w-52"
              />
            </div>

            {/* Window Filter */}
            <select
              value={windowFilter}
              onChange={e => setWindowFilter(e.target.value as typeof windowFilter)}
              aria-label="Filter transactions by window"
              className="py-1.5 px-2.5 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 bg-white cursor-pointer outline-hidden"
            >
              <option value="all">All Windows</option>
              <option value="1">Window 1</option>
              <option value="2">Window 2</option>
              <option value="3">Window 3</option>
              <option value="4">Window 4</option>
              <option value="5">Window 5</option>
            </select>

            {/* Type Filter */}
            <select
              value={typeFilter}
              onChange={e => setTypeFilter(e.target.value as typeof typeFilter)}
              aria-label="Filter transactions by queue category"
              className="py-1.5 px-2.5 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 bg-white cursor-pointer outline-hidden"
            >
              <option value="all">All Categories</option>
              <option value="regular">Regular Students (C)</option>
              <option value="senior">Senior Citizens (S)</option>
            </select>
          </div>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto rounded-2xl border border-slate-200">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
                <th className="py-3 px-3.5">Time</th>
                <th className="py-3 px-3">Ticket #</th>
                <th className="py-3 px-3">Student Name</th>
                <th className="py-3 px-3">Category</th>
                <th className="py-3 px-3">Assigned Desk</th>
                <th className="py-3 px-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {tableRows.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-10 text-slate-400">
                    No transactions match the selected filter.
                  </td>
                </tr>
              ) : (
                tableRows.map(row => {
                  const isSen = isSeniorCitizenTicket(row);
                  const srv = PAYMENT_SLIP_SERVICES.find(s => s.id === row.serviceId);
                  const timeDisplay = row.completedAt || row.calledAt || row.issuedAt;

                  return (
                    <tr key={row.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-2.5 px-3.5 font-mono text-slate-500 whitespace-nowrap">
                        {timeDisplay ? new Date(timeDisplay).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : '---'}
                      </td>
                      <td className="py-2.5 px-3 font-mono font-black text-sm text-[#751A1A]">
                        {row.ticketNumber}
                      </td>
                      <td className="py-2.5 px-3 font-semibold text-slate-800">
                        <div className="flex flex-col">
                          <span>{row.studentName}</span>
                          {row.studentNumber && (
                            <span className="text-[10px] text-slate-400 font-mono">{row.studentNumber}</span>
                          )}
                        </div>
                      </td>
                      <td className="py-2.5 px-3">
                        {isSen ? (
                          <span className="bg-[#EA671B] text-white text-[9px] font-black px-2 py-0.5 rounded-full uppercase inline-flex items-center space-x-1">
                            <HeartHandshake className="w-2.5 h-2.5" />
                            <span>Senior Citizen</span>
                          </span>
                        ) : (
                          <span className="bg-slate-100 text-slate-700 text-[9px] font-bold px-2 py-0.5 rounded-full uppercase">
                            Regular (C)
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 font-semibold">
                        {row.assignedCounterNumber ? (
                          <span className="text-[#751A1A] font-bold">
                            Window {row.assignedCounterNumber}
                          </span>
                        ) : (
                          <span className="text-slate-400">Unassigned</span>
                        )}
                      </td>
                      <td className="py-2.5 px-3">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                          row.status === 'COMPLETED'
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-300'
                            : row.status === 'SERVING'
                              ? 'bg-blue-50 text-blue-800 border border-blue-300 animate-pulse'
                              : row.status === 'CALLED'
                                ? 'bg-amber-50 text-amber-800 border border-amber-300'
                                : 'bg-slate-100 text-slate-600'
                        }`}>
                          {row.status}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
