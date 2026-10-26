'use client';

import React, { useState } from 'react';
import { useQueue } from '@/context/QueueContext';
import { calculateQueueEstimate, getStatusBadgeConfig } from '@/lib/queue-engine';
import { QueueTicket } from '@/types/queue';
import { 
  Clock, 
  Users, 
  QrCode, 
  PauseCircle, 
  PlayCircle, 
  XCircle, 
  MapPin, 
  AlertTriangle, 
  Sparkles, 
  Calendar, 
  Building, 
  Info,
  Lightbulb 
} from 'lucide-react';
import QRCode from 'qrcode';

export function StudentDashboard() {
  const { 
    tickets, 
    offices, 
    services, 
    currentStudentId, 
    joinQueue, 
    requestDeferment, 
    resumeDeferredTicket, 
    cancelTicket,
    announcements,
    nowServingTicket,
    showToast
  } = useQueue();

  // Dialog / Modal states
  const [selectedOfficeId, setSelectedOfficeId] = useState<string>('off-registrar');
  const [selectedServiceId, setSelectedServiceId] = useState<string>('');
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [showQRModal, setShowQRModal] = useState<QueueTicket | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [showDeferModal, setShowDeferModal] = useState<QueueTicket | null>(null);
  const [deferReason, setDeferReason] = useState<string>('Attending ongoing lecture / laboratory class');

  // Filter student's tickets
  const myTickets = tickets.filter(
    t => t.studentId === currentStudentId && t.status !== 'CANCELLED' && t.status !== 'COMPLETED'
  );

  const completedTickets = tickets.filter(
    t => t.studentId === currentStudentId && (t.status === 'COMPLETED' || t.status === 'CANCELLED')
  );

  // Handle open QR Code modal
  const handleViewQR = async (ticket: QueueTicket) => {
    setShowQRModal(ticket);
    try {
      const url = await QRCode.toDataURL(ticket.qrToken, { width: 256, margin: 2 });
      setQrDataUrl(url);
    } catch (err) {
      console.error(err);
    }
  };

  const handleJoinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOfficeId || !selectedServiceId) {
      alert('Please select both an office and a specific service.');
      return;
    }
    const created = joinQueue(selectedOfficeId, selectedServiceId);
    showToast(`Queue Ticket Issued: ${created.ticketNumber}`, 'Your pass is now active in line. Live updates enabled.', 'success');
    setShowJoinModal(false);
    setSelectedServiceId('');
  };

  const handleConfirmDefer = () => {
    if (showDeferModal) {
      requestDeferment(showDeferModal.id, deferReason);
      showToast('Class Deferment Activated', `Ticket ${showDeferModal.ticketNumber} is held. Resume when lecture ends.`, 'warning');
      setShowDeferModal(null);
    }
  };

  const selectedOfficeServices = services.filter(s => s.officeId === selectedOfficeId && s.isActive);

  return (
    <div className="space-y-6 pb-12">
      {/* Welcome Hero Banner (Banner-Design Spec: Aurora Emerald & Gold Institutional Glow) */}
      <div className="relative rounded-3xl overflow-hidden shadow-xl border border-teal-600/30 bg-gradient-to-br from-[#093533] via-[#0D4D47] to-[#0A2624] text-white p-6 sm:p-10 transition-all">
        {/* Ambient Aurora Orbs */}
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-teal-400/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-1/2 -right-20 w-80 h-80 bg-amber-400/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(45,212,191,0.15),transparent_50%)] pointer-events-none" />

        {/* Structural Background Pattern */}
        <div className="absolute right-0 top-0 bottom-0 opacity-10 pointer-events-none flex items-center pr-6 hidden sm:flex">
          <Building className="w-96 h-96 text-teal-200" aria-hidden="true" />
        </div>

        <div className="relative z-10 max-w-3xl">
          {/* Institutional Badge Pill */}
          <div className="inline-flex items-center space-x-2 bg-teal-950/70 backdrop-blur-md px-3.5 py-1.5 rounded-full text-xs font-semibold text-teal-200 mb-4 border border-teal-500/30 shadow-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <Sparkles className="w-3.5 h-3.5 text-amber-300" aria-hidden="true" />
            <span>St. Anthony&apos;s College &bull; Official Campus Queue Hub</span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-tight text-white drop-shadow-xs">
            Your Time Matters. <br className="hidden sm:inline" />
            <span className="bg-gradient-to-r from-teal-200 via-teal-100 to-amber-300 bg-clip-text text-transparent">
              Your Queue, Anywhere.
            </span>
          </h1>

          <div className="mt-4 flex flex-wrap items-center gap-y-2 gap-x-4 text-xs sm:text-sm text-teal-100/90 font-medium">
            <div className="flex items-center space-x-1.5 bg-black/20 px-3 py-1 rounded-lg border border-white/10 backdrop-blur-xs">
              <span className="text-teal-300 font-semibold">Student:</span>
              <span>John Carlo Javier</span>
              <span className="text-teal-400 font-mono">(2023-08812)</span>
            </div>
            <div className="flex items-center space-x-1.5 bg-black/20 px-3 py-1 rounded-lg border border-white/10 backdrop-blur-xs">
              <Calendar className="w-3.5 h-3.5 text-amber-300" aria-hidden="true" />
              <span>A.Y. 2026–2027 &bull; Regular Hours 8AM–5PM</span>
            </div>
          </div>

          <p className="mt-3 text-xs sm:text-sm text-teal-100/80 leading-relaxed max-w-2xl">
            Never miss an exam or lecture while waiting for Registrar or Cashier clearances. Get a digital ticket, attend your classes in peace, and return when your number is called.
          </p>

          {/* Quick CTA Actions */}
          <div className="mt-6 flex flex-wrap gap-3 items-center">
            <button
              onClick={() => setShowJoinModal(true)}
              className="bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-teal-950 font-black px-5 py-3 rounded-2xl shadow-lg shadow-amber-950/20 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer text-sm flex items-center space-x-2 border border-amber-300"
            >
              <span>+ Get a Queue Ticket</span>
            </button>
            <a
              href="#campus-offices"
              className="bg-white/10 hover:bg-white/20 text-white font-semibold px-5 py-3 rounded-2xl backdrop-blur-md transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer text-sm border border-white/15 shadow-sm"
            >
              View Office Status
            </a>
          </div>
        </div>
      </div>

      {/* Campus Announcements Ticker */}
      {announcements.length > 0 && (
        <div className="bg-amber-50/80 border border-amber-200/90 rounded-2xl p-4 flex items-start space-x-3 text-amber-950">
          <Info className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" aria-hidden="true" />
          <div className="flex-1 text-xs sm:text-sm">
            <span className="font-semibold text-amber-900">{announcements[0].title}: </span>
            <span className="text-amber-800">{announcements[0].content}</span>
          </div>
        </div>
      )}

      {/* ACTIVE QUEUE TICKETS SECTION */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold text-slate-900 flex items-center space-x-2">
            <span>Your Active Queue Passes</span>
            <span className="bg-teal-100 text-teal-800 text-xs px-2.5 py-0.5 rounded-full font-semibold">
              {myTickets.length} Active
            </span>
          </h2>
          {myTickets.length > 0 && (
            <span className="text-xs text-slate-500">Live updating automatically</span>
          )}
        </div>

        {myTickets.length === 0 ? (
          <div className="bg-white rounded-3xl border border-dashed border-slate-300 p-8 sm:p-12 text-center shadow-xs">
            <div className="w-16 h-16 bg-teal-50 rounded-2xl flex items-center justify-center mx-auto text-teal-700 mb-4">
              <Clock className="w-8 h-8" aria-hidden="true" />
            </div>
            <h3 className="text-base font-semibold text-slate-800">You are not in any queue right now</h3>
            <p className="text-slate-500 text-xs sm:text-sm mt-1 max-w-md mx-auto">
              Need to process your documents, clearances, or tuition payments? Join a queue remotely and monitor your turn while staying in class.
            </p>
            <button
              onClick={() => setShowJoinModal(true)}
              className="mt-5 bg-teal-700 hover:bg-teal-800 text-white font-semibold text-xs sm:text-sm px-5 py-2.5 rounded-xl shadow-xs transition-all cursor-pointer"
            >
              Join a Campus Queue Now
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {myTickets.map(ticket => {
              const office = offices.find(o => o.id === ticket.officeId)!;
              const service = services.find(s => s.id === ticket.serviceId);
              const estimate = calculateQueueEstimate(ticket, tickets, office);
              const badge = getStatusBadgeConfig(ticket.status);
              const serving = nowServingTicket(ticket.officeId);

              const isCalled = ticket.status === 'CALLED';
              const isServing = ticket.status === 'SERVING';
              const isDeferred = ticket.status === 'DEFERRED';

              return (
                <div
                  key={ticket.id}
                  className={`bg-white rounded-3xl border transition-all duration-300 p-6 sm:p-7 shadow-md hover:shadow-xl relative overflow-hidden ${
                    isCalled 
                      ? 'border-rose-400 ring-4 ring-rose-300/40 bg-gradient-to-b from-rose-50/40 to-white' 
                      : isServing 
                      ? 'border-emerald-400 ring-4 ring-emerald-200/50 bg-gradient-to-b from-emerald-50/40 to-white' 
                      : isDeferred
                      ? 'border-blue-300 ring-2 ring-blue-100 bg-gradient-to-b from-blue-50/30 to-white'
                      : 'border-teal-100/80 hover:border-teal-300'
                  }`}
                >
                  {/* Top Office & Status badge */}
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <div>
                      <span className="text-xs font-extrabold text-teal-800 uppercase tracking-widest block">
                        {office?.name}
                      </span>
                      <span className="text-xs text-slate-500 font-semibold mt-0.5 block">
                        {service?.name}
                      </span>
                    </div>

                    <div className={`inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold border shadow-2xs ${badge.bg}`}>
                      <span className={`w-2 h-2 rounded-full ${badge.dot}`} />
                      <span>{badge.label}</span>
                    </div>
                  </div>

                  {/* Main Queue Number Display with Enhanced Typography */}
                  <div className="mt-5 text-center bg-gradient-to-b from-slate-50 to-teal-50/30 rounded-2xl p-5 border border-teal-100/60 shadow-inner">
                    <span className="text-[11px] text-teal-800/80 font-bold uppercase tracking-widest block">
                      Assigned Queue Number
                    </span>
                    <span className="text-5xl sm:text-6xl font-black text-teal-950 tracking-tight block my-1 font-mono drop-shadow-2xs">
                      {ticket.ticketNumber}
                    </span>
                    <span className="text-xs text-slate-500 font-medium">
                      Opaque Pass Token: <span className="font-mono text-teal-800 font-bold bg-white px-2 py-0.5 rounded-md border border-teal-200">{ticket.lookupCode}</span>
                    </span>
                  </div>

                  {/* Live Queue Progress Indicators */}
                  <div className="grid grid-cols-2 gap-3.5 mt-4">
                    <div className="bg-slate-50/90 rounded-2xl p-3.5 border border-slate-200/80 shadow-2xs">
                      <span className="text-[11px] text-slate-500 font-semibold flex items-center space-x-1.5">
                        <Users className="w-4 h-4 text-teal-600" aria-hidden="true" />
                        <span>Students Ahead</span>
                      </span>
                      <span className="text-2xl font-black text-slate-900 mt-1 block" role="status" aria-atomic="true">
                        {isServing ? '0 (At Window)' : isCalled ? '0 (Your Turn)' : estimate.studentsAhead}
                      </span>
                    </div>

                    <div className="bg-slate-50/90 rounded-2xl p-3.5 border border-slate-200/80 shadow-2xs">
                      <span className="text-[11px] text-slate-500 font-semibold flex items-center space-x-1.5">
                        <Clock className="w-4 h-4 text-teal-600" aria-hidden="true" />
                        <span>Estimated Wait</span>
                      </span>
                      <span className="text-xs font-bold text-teal-900 mt-1 block truncate" title={estimate.formattedEstimate} role="status">
                        {estimate.formattedEstimate}
                      </span>
                    </div>
                  </div>

                  {/* Multi-step Visual Queue Progression Track */}
                  <div className="mt-4 p-3 bg-slate-50/80 rounded-2xl border border-slate-200/70">
                    <div className="flex items-center justify-between text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                      <span className={ticket.status === 'WAITING' ? 'text-teal-800' : ''}>1. In Line</span>
                      <span className={estimate.studentsAhead <= 2 && ticket.status === 'WAITING' ? 'text-amber-800' : ''}>2. Approaching</span>
                      <span className={isCalled ? 'text-rose-700 animate-pulse' : ''}>3. Called</span>
                      <span className={isServing ? 'text-emerald-700' : ''}>4. At Window</span>
                    </div>
                    <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden flex">
                      <div 
                        className={`h-full transition-all duration-500 ${
                          isServing 
                            ? 'w-full bg-emerald-500' 
                            : isCalled 
                            ? 'w-3/4 bg-rose-500' 
                            : estimate.studentsAhead <= 2 
                            ? 'w-1/2 bg-amber-500' 
                            : 'w-1/4 bg-teal-600'
                        }`} 
                      />
                    </div>
                  </div>

                  {/* Currently Serving Counter Info */}
                  <div className="mt-3 bg-teal-50/60 rounded-xl px-3.5 py-2.5 border border-teal-100 text-xs flex items-center justify-between">
                    <span className="text-teal-900">
                      Currently Calling in Office:
                    </span>
                    <span className="font-bold font-mono text-teal-950">
                      {serving ? serving.ticketNumber : 'Standby'}
                    </span>
                  </div>

                  {/* Class-Conflict or Grace warning */}
                  {isCalled && (
                    <div className="mt-3 bg-rose-100 border border-rose-300 rounded-xl p-3 text-xs text-rose-950 font-medium flex items-start space-x-2 animate-bounce">
                      <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" aria-hidden="true" />
                      <div>
                        <strong>Please proceed immediately to Counter {ticket.assignedCounterNumber || 1}!</strong>
                        <p className="text-[11px] text-rose-800 mt-0.5">
                          Standard arrival window: 3 minutes before the number is recalled or marked skipped.
                        </p>
                      </div>
                    </div>
                  )}

                  {isDeferred && (
                    <div className="mt-3 bg-blue-50 border border-blue-200 rounded-xl p-3 text-xs text-blue-950">
                      <strong>Class Conflict Active</strong>: &quot;{ticket.defermentReason}&quot;.
                      <p className="text-[11px] text-blue-800 mt-0.5">
                        Deferment #{ticket.defermentCount} of {ticket.maxDefermentsAllowed}. Resume when your class concludes.
                      </p>
                    </div>
                  )}

                  {/* Action Controls */}
                  <div className="mt-5 pt-4 border-t border-slate-100 flex flex-wrap gap-2 justify-between items-center">
                    <button
                      onClick={() => handleViewQR(ticket)}
                      className="text-xs font-medium text-slate-700 hover:text-teal-700 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg transition-colors flex items-center space-x-1.5 cursor-pointer"
                    >
                      <QrCode className="w-3.5 h-3.5" aria-hidden="true" />
                      <span>Digital QR Pass</span>
                    </button>

                    <div className="flex items-center space-x-2">
                      {ticket.status === 'DEFERRED' ? (
                        <button
                          onClick={() => resumeDeferredTicket(ticket.id)}
                          className="text-xs font-medium text-blue-700 bg-blue-100 hover:bg-blue-200 px-3 py-1.5 rounded-lg transition-colors flex items-center space-x-1 cursor-pointer"
                        >
                          <PlayCircle className="w-3.5 h-3.5" aria-hidden="true" />
                          <span>Resume Queue</span>
                        </button>
                      ) : (
                        ticket.status === 'WAITING' && (
                          <button
                            onClick={() => setShowDeferModal(ticket)}
                            className="text-xs font-medium text-slate-600 hover:text-blue-700 bg-slate-100 hover:bg-blue-50 px-2.5 py-1.5 rounded-lg transition-colors flex items-center space-x-1 cursor-pointer"
                            title="Attending class? Defer queue temporarily"
                          >
                            <PauseCircle className="w-3.5 h-3.5 text-blue-600" aria-hidden="true" />
                            <span>In-Class Defer</span>
                          </button>
                        )
                      )}

                      {ticket.status !== 'SERVING' && (
                        <button
                          onClick={() => {
                            if (confirm(`Cancel queue ticket ${ticket.ticketNumber}? This action cannot be undone.`)) {
                              cancelTicket(ticket.id);
                            }
                          }}
                          className="text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 px-2 py-1.5 rounded-lg transition-colors cursor-pointer"
                          title="Cancel ticket"
                        >
                          <XCircle className="w-3.5 h-3.5" aria-hidden="true" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* CAMPUS OFFICES OVERVIEW CARDS */}
      <div id="campus-offices" className="pt-4">
        <h2 className="text-lg font-bold text-slate-900 mb-3">Campus Service Offices</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {offices.map(office => {
            const officeTickets = tickets.filter(t => t.officeId === office.id && t.status === 'WAITING');
            const nowServing = nowServingTicket(office.id);

            return (
              <div key={office.id} className="bg-white rounded-3xl border border-slate-200 p-5 shadow-xs">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-bold text-slate-900 text-base">{office.name}</h3>
                    <p className="text-xs text-slate-500 flex items-center space-x-1 mt-0.5">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" aria-hidden="true" />
                      <span>{office.location}</span>
                    </p>
                  </div>
                  <span className="bg-teal-50 text-teal-800 text-[11px] font-semibold px-2.5 py-1 rounded-full border border-teal-200">
                    {office.activeCountersCount} Counters Open
                  </span>
                </div>

                <p className="text-xs text-slate-600 mt-2.5 line-clamp-2">
                  {office.description}
                </p>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-slate-400 block text-[11px]">Now Serving</span>
                    <span className="font-bold font-mono text-teal-900 text-sm">
                      {nowServing ? nowServing.ticketNumber : 'Available'}
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-400 block text-[11px]">Waiting in Line</span>
                    <span className="font-bold text-slate-800 text-sm">
                      {officeTickets.length} students
                    </span>
                  </div>

                  <button
                    onClick={() => {
                      setSelectedOfficeId(office.id);
                      setShowJoinModal(true);
                    }}
                    className="bg-teal-50 hover:bg-teal-100 text-teal-800 font-semibold px-3.5 py-2 rounded-xl transition-colors cursor-pointer border border-teal-200"
                  >
                    Join Queue
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* RECENT TICKET HISTORY */}
      {completedTickets.length > 0 && (
        <div className="pt-2">
          <h3 className="text-sm font-bold text-slate-700 mb-2">Past Queue History</h3>
          <div className="bg-white rounded-2xl border border-slate-200 divide-y divide-slate-100 overflow-hidden">
            {completedTickets.map(tkt => (
              <div key={tkt.id} className="p-3 sm:px-4 flex items-center justify-between text-xs">
                <div className="flex items-center space-x-3">
                  <span className="font-mono font-bold text-slate-800">{tkt.ticketNumber}</span>
                  <span className="text-slate-500">
                    {offices.find(o => o.id === tkt.officeId)?.name}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                    tkt.status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'
                  }`}>
                    {tkt.status}
                  </span>
                  <span className="text-[11px] text-slate-400">
                    {new Date(tkt.issuedAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MODAL 1: JOIN QUEUE MODAL */}
      {showJoinModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <h3 className="text-lg font-bold text-slate-900">Get a Smart Queue Ticket</h3>
            <p className="text-xs text-slate-500 mt-1">
              Select your destination department and service inquiry.
            </p>

            <form onSubmit={handleJoinSubmit} className="mt-4 space-y-4">
              <div>
                <label htmlFor="join-office-select" className="text-xs font-semibold text-slate-700 block mb-1">
                  Target Campus Office
                </label>
                <select
                  id="join-office-select"
                  value={selectedOfficeId}
                  onChange={e => {
                    setSelectedOfficeId(e.target.value);
                    setSelectedServiceId('');
                  }}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs text-slate-900 focus:ring-2 focus:ring-teal-600 outline-hidden"
                >
                  {offices.map(o => (
                    <option key={o.id} value={o.id}>{o.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="join-service-select" className="text-xs font-semibold text-slate-700 block mb-1">
                  Specific Transaction / Service
                </label>
                <select
                  id="join-service-select"
                  value={selectedServiceId}
                  onChange={e => setSelectedServiceId(e.target.value)}
                  required
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs text-slate-900 focus:ring-2 focus:ring-teal-600 outline-hidden"
                >
                  <option value="">-- Choose transaction category --</option>
                  {selectedOfficeServices.map(s => (
                    <option key={s.id} value={s.id}>{s.name} (~{s.estimatedMinutes} mins)</option>
                  ))}
                </select>
              </div>

              <div className="bg-teal-50 rounded-xl p-3 border border-teal-200 text-xs text-teal-900 space-y-1">
                <p className="font-semibold flex items-center space-x-1.5">
                  <Lightbulb className="w-3.5 h-3.5 text-teal-700 shrink-0" aria-hidden="true" />
                  <span>Student Tip:</span>
                </p>
                <p className="text-[11px] leading-relaxed text-teal-800">
                  You can safely attend your classes while waiting. SAC QueueFlow will notify you before your turn.
                </p>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowJoinModal(false)}
                  className="min-h-[44px] px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="min-h-[44px] bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-colors cursor-pointer"
                >
                  Confirm & Generate Pass
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: QR CODE PASS */}
      {showQRModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 text-center">
            <span className="text-[11px] font-bold text-teal-800 uppercase tracking-wider block">
              St. Anthony&apos;s College Pass
            </span>
            <h3 className="text-xl font-black text-slate-900 mt-1">
              Ticket {showQRModal.ticketNumber}
            </h3>
            <p className="text-xs text-slate-500">
              {offices.find(o => o.id === showQRModal.officeId)?.name}
            </p>

            <div className="my-5 p-3 bg-white border border-slate-200 rounded-2xl inline-block shadow-inner">
              {qrDataUrl ? (
                <img src={qrDataUrl} alt="Queue QR Pass" className="w-48 h-48 mx-auto" />
              ) : (
                <div className="w-48 h-48 bg-slate-100 flex items-center justify-center text-xs text-slate-400">
                  Generating secure token...
                </div>
              )}
            </div>

            <div className="bg-slate-50 rounded-xl p-3 text-xs text-slate-600 mb-4 border border-slate-200">
              <span className="block text-slate-400 text-[10px]">VERIFICATION CODE</span>
              <span className="font-mono font-bold text-slate-900 text-sm">{showQRModal.lookupCode}</span>
              <p className="text-[10px] text-slate-500 mt-1">
                Staff can scan this QR code or type the verification code at the counter.
              </p>
            </div>

            <button
              onClick={() => setShowQRModal(null)}
              className="w-full bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs py-2.5 rounded-xl cursor-pointer"
            >
              Close Pass
            </button>
          </div>
        </div>
      )}

      {/* MODAL 3: CLASS CONFLICT DEFERMENT MODAL */}
      {showDeferModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <h3 className="text-lg font-bold text-slate-900 flex items-center space-x-2">
              <PauseCircle className="w-5 h-5 text-blue-600" aria-hidden="true" />
              <span>Request Class-Conflict Deferment</span>
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Ticket: <strong className="text-slate-800">{showDeferModal.ticketNumber}</strong> • Deferments used: {showDeferModal.defermentCount} of {showDeferModal.maxDefermentsAllowed}
            </p>

            <div className="mt-4 space-y-3">
              <div>
                <label htmlFor="defer-reason-select" className="text-xs font-semibold text-slate-700 block mb-1">
                  Reason for deferment:
                </label>
                <select
                  id="defer-reason-select"
                  value={deferReason}
                  onChange={e => setDeferReason(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs text-slate-900 outline-hidden"
                >
                  <option value="Attending ongoing lecture / laboratory class">Attending ongoing lecture / laboratory class</option>
                  <option value="Taking a major examination / quiz">Taking a major examination / quiz</option>
                  <option value="Departmental faculty meeting / consultation">Departmental faculty meeting / consultation</option>
                </select>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-xs text-blue-900 leading-relaxed space-y-1">
                <span className="font-semibold block">Institutional Fairness Policy:</span>
                <p className="text-[11px] text-blue-800">
                  • Your ticket will be paused and will NOT be called while you are in class.
                </p>
                <p className="text-[11px] text-blue-800">
                  • Deferment expires automatically after 45 minutes if not resumed.
                </p>
                <p className="text-[11px] text-blue-800">
                  • Maximum of 2 deferments per ticket to prevent queue hoarding.
                </p>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowDeferModal(null)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDefer}
                  className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-colors cursor-pointer"
                >
                  Confirm Class Deferment
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
