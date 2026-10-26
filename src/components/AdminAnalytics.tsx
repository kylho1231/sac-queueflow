'use client';

import React, { useState } from 'react';
import { useQueue } from '@/context/QueueContext';
import { 
  BarChart3, 
  TrendingUp, 
  Clock, 
  Users, 
  FileSpreadsheet, 
  ShieldCheck, 
  AlertCircle,
  Building2,
  Calendar,
  Filter
} from 'lucide-react';

export function AdminAnalytics() {
  const { offices, services, counters, tickets, announcements } = useQueue();
  const [selectedOfficeFilter, setSelectedOfficeFilter] = useState<string>('all');

  // Filtered tickets based on office
  const filteredTickets = selectedOfficeFilter === 'all'
    ? tickets
    : tickets.filter(t => t.officeId === selectedOfficeFilter);

  const totalIssued = filteredTickets.length;
  const totalCompleted = filteredTickets.filter(t => t.status === 'COMPLETED').length;
  const totalDeferred = filteredTickets.filter(t => t.status === 'DEFERRED').length;
  const totalCancelled = filteredTickets.filter(t => t.status === 'CANCELLED').length;
  const totalNoShow = filteredTickets.filter(t => t.status === 'NO_SHOW' || t.status === 'SKIPPED').length;

  const completionRate = totalIssued > 0 ? Math.round((totalCompleted / totalIssued) * 100) : 0;
  const noShowRate = totalIssued > 0 ? Math.round((totalNoShow / totalIssued) * 100) : 0;

  // Export CSV Handler
  const handleExportCSV = () => {
    const headers = ['Ticket Number', 'Office', 'Student Name', 'Status', 'Issued At', 'Deferment Count'];
    const rows = filteredTickets.map(t => [
      t.ticketNumber,
      offices.find(o => o.id === t.officeId)?.name || 'Unknown',
      t.studentName,
      t.status,
      t.issuedAt,
      t.defermentCount.toString()
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + 
      [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `sac-queueflow-audit-report-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Title & Filter Bar */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-semibold text-teal-800 uppercase tracking-wider block">
            Executive Analytics & Audit
          </span>
          <h1 className="text-xl font-black text-slate-900 mt-0.5">
            Institutional Queue Performance & Throughput
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Monitor transaction volumes, waiting times, counter utilization, and peak-hour metrics.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2 bg-slate-50 border border-slate-300 rounded-xl px-3 py-1.5 text-xs">
            <Filter className="w-3.5 h-3.5 text-slate-400" aria-hidden="true" />
            <select
              value={selectedOfficeFilter}
              onChange={e => setSelectedOfficeFilter(e.target.value)}
              className="bg-transparent font-medium text-slate-800 outline-hidden cursor-pointer"
            >
              <option value="all">All Campus Offices</option>
              {offices.map(o => (
                <option key={o.id} value={o.id}>{o.name}</option>
              ))}
            </select>
          </div>

          <button
            onClick={handleExportCSV}
            className="bg-teal-700 hover:bg-teal-800 text-white font-semibold text-xs px-3.5 py-2 rounded-xl shadow-xs transition-colors flex items-center space-x-1.5 cursor-pointer"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* KPI CARDS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
          <span className="text-xs text-slate-500 block">Total Tickets Issued</span>
          <span className="text-3xl font-black text-slate-900 mt-1 block">{totalIssued}</span>
          <span className="text-[11px] text-teal-700 font-semibold mt-1 block">Live queue count</span>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
          <span className="text-xs text-slate-500 block">Completion Rate</span>
          <span className="text-3xl font-black text-emerald-800 mt-1 block">{completionRate}%</span>
          <span className="text-[11px] text-slate-400 block mt-1">{totalCompleted} served successfully</span>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
          <span className="text-xs text-slate-500 block">Class Deferments</span>
          <span className="text-3xl font-black text-blue-900 mt-1 block">{totalDeferred}</span>
          <span className="text-[11px] text-slate-400 block mt-1">Students paused in class</span>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
          <span className="text-xs text-slate-500 block">No-Show / Skipped</span>
          <span className="text-3xl font-black text-rose-800 mt-1 block">{noShowRate}%</span>
          <span className="text-[11px] text-slate-400 block mt-1">{totalNoShow} missed arrivals</span>
        </div>
      </div>

      {/* OFFICE BENCHMARK & COUNTERS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Office Summary */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs">
          <h2 className="text-sm font-bold text-slate-900 mb-4 flex items-center space-x-2">
            <Building2 className="w-4 h-4 text-teal-600" aria-hidden="true" />
            <span>Campus Office Breakdown</span>
          </h2>

          <div className="space-y-4">
            {offices.map(office => {
              const offTickets = tickets.filter(t => t.officeId === office.id);
              const offCompleted = offTickets.filter(t => t.status === 'COMPLETED').length;
              const offWaiting = offTickets.filter(t => t.status === 'WAITING').length;

              return (
                <div key={office.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-bold text-slate-900 text-sm">{office.name}</h3>
                      <p className="text-xs text-slate-500">{office.location}</p>
                    </div>
                    <span className="text-xs font-bold text-teal-800 bg-teal-100 px-2 py-0.5 rounded-full">
                      {office.activeCountersCount} Active Counters
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-slate-200 text-center text-xs">
                    <div>
                      <span className="text-[10px] text-slate-400 block">Waiting</span>
                      <span className="font-bold text-slate-800 text-sm">{offWaiting}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">Completed</span>
                      <span className="font-bold text-emerald-700 text-sm">{offCompleted}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">Avg Duration</span>
                      <span className="font-bold text-amber-800 text-sm">{office.averageServiceMinutes}m</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Counter Activity Roster */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs">
          <h2 className="text-sm font-bold text-slate-900 mb-4 flex items-center space-x-2">
            <Users className="w-4 h-4 text-teal-600" aria-hidden="true" />
            <span>Counter Roster & Status</span>
          </h2>

          <div className="space-y-3">
            {counters.map(counter => (
              <div key={counter.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-xs">
                <div>
                  <span className="font-bold text-slate-900 block">{counter.name}</span>
                  <span className="text-slate-500 text-[11px]">Staff: {counter.assignedStaffName}</span>
                </div>
                <div className="text-right">
                  <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    counter.isPaused 
                      ? 'bg-amber-100 text-amber-800' 
                      : 'bg-emerald-100 text-emerald-800'
                  }`}>
                    {counter.isPaused ? 'Paused' : 'Online & Active'}
                  </span>
                  <span className="text-[10px] text-slate-400 block mt-0.5 font-mono">
                    {counter.statusText || 'Available'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* RECENT TICKETS AUDIT LOG TABLE */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs">
        <h2 className="text-sm font-bold text-slate-900 mb-3 flex items-center space-x-2">
          <ShieldCheck className="w-4 h-4 text-teal-600" aria-hidden="true" />
          <span>Real-Time Audit Trail (Philippine Data Privacy Compliant)</span>
        </h2>
        <p className="text-xs text-slate-500 mb-4">
          All queue actions and state transitions are recorded chronologically.
        </p>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-400 uppercase text-[10px] tracking-wider">
                <th className="pb-2">Ticket #</th>
                <th className="pb-2">Office</th>
                <th className="pb-2">Status</th>
                <th className="pb-2">Issued Time</th>
                <th className="pb-2">Deferments</th>
                <th className="pb-2">Security Token</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredTickets.slice(-8).reverse().map(t => (
                <tr key={t.id} className="hover:bg-slate-50">
                  <td className="py-2.5 font-mono font-bold text-slate-900">{t.ticketNumber}</td>
                  <td className="py-2.5">{offices.find(o => o.id === t.officeId)?.code}</td>
                  <td className="py-2.5">
                    <span className="font-semibold text-[11px]">{t.status}</span>
                  </td>
                  <td className="py-2.5 text-slate-400">
                    {new Date(t.issuedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </td>
                  <td className="py-2.5">{t.defermentCount}</td>
                  <td className="py-2.5 font-mono text-slate-500">{t.lookupCode}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
