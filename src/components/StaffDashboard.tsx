'use client';

import React, { useState, useEffect } from 'react';
import { useQueue } from '@/context/QueueContext';
import { 
  PhoneCall, 
  RotateCcw, 
  Play, 
  CheckCircle, 
  SkipForward, 
  UserX, 
  Pause, 
  QrCode, 
  PlusCircle, 
  Clock, 
  Users
} from 'lucide-react';

export function StaffDashboard() {
  const {
    currentStaffOfficeId,
    setCurrentStaffOfficeId,
    offices,
    services,
    counters,
    tickets,
    callNextTicket,
    recallTicket,
    startServing,
    completeServing,
    skipTicket,
    markNoShow,
    pauseCounter,
    resumeCounter,
    createWalkInTicket,
    showToast
  } = useQueue();

  const currentOffice = offices.find(o => o.id === currentStaffOfficeId) || offices[0];
  const officeCounters = counters.filter(c => c.officeId === currentStaffOfficeId);
  const [selectedCounterId, setSelectedCounterId] = useState<string>(officeCounters[0]?.id || '');
  const [walkInServiceId, setWalkInServiceId] = useState<string>('');
  const [showWalkInModal, setShowWalkInModal] = useState(false);
  const [verificationCodeInput, setVerificationCodeInput] = useState<string>('');

  const [currentTimeMs, setCurrentTimeMs] = useState<number>(0);

  useEffect(() => {
    setCurrentTimeMs(Date.now());
    const interval = setInterval(() => setCurrentTimeMs(Date.now()), 30000);
    return () => clearInterval(interval);
  }, []);

  const activeCounter = officeCounters.find(c => c.id === selectedCounterId) || officeCounters[0];
  
  // Find current ticket for selected counter
  const currentCounterTicket = tickets.find(
    t => t.assignedCounterId === activeCounter?.id && (t.status === 'CALLED' || t.status === 'SERVING')
  );

  // Tickets waiting in this office
  const waitingTickets = tickets
    .filter(t => t.officeId === currentStaffOfficeId && t.status === 'WAITING')
    .sort((a, b) => new Date(a.issuedAt).getTime() - new Date(b.issuedAt).getTime());

  // Tickets deferred (in class)
  const deferredTickets = tickets.filter(
    t => t.officeId === currentStaffOfficeId && t.status === 'DEFERRED'
  );

  // Completed today in office
  const completedToday = tickets.filter(
    t => t.officeId === currentStaffOfficeId && t.status === 'COMPLETED'
  );

  const handleManualVerification = (e: React.FormEvent) => {
    e.preventDefault();
    if (!verificationCodeInput) return;
    const found = tickets.find(
      t => t.lookupCode.toLowerCase() === verificationCodeInput.trim().toLowerCase() ||
           t.ticketNumber.toLowerCase() === verificationCodeInput.trim().toLowerCase()
    );
    if (found) {
      showToast('Student Pass Verified', `${found.ticketNumber} • ${found.studentName}`, 'success');
      setVerificationCodeInput('');
    } else {
      showToast('Validation Error', `No active ticket found for "${verificationCodeInput}".`, 'alert');
    }
  };

  const handleCreateWalkIn = (e: React.FormEvent) => {
    e.preventDefault();
    if (!walkInServiceId) {
      alert('Select service category');
      return;
    }
    const newTkt = createWalkInTicket(currentStaffOfficeId, walkInServiceId);
    setShowWalkInModal(false);
    alert(`Walk-in ticket generated: ${newTkt.ticketNumber}. Printed pass token: ${newTkt.lookupCode}`);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Office Selector Bar */}
      <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-semibold text-teal-800 uppercase tracking-wider block">
            Operations Workspace
          </span>
          <h1 className="text-xl font-black text-slate-900 mt-0.5">
            {currentOffice.name} — Staff Operations Console
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage student queues, call tickets, monitor service times, and log walk-in transactions.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Switch Office */}
          <div className="flex items-center space-x-2">
            <span className="text-xs font-medium text-slate-500">Office:</span>
            <select
              value={currentStaffOfficeId}
              onChange={e => {
                setCurrentStaffOfficeId(e.target.value);
                const nextCounters = counters.filter(c => c.officeId === e.target.value);
                if (nextCounters[0]) setSelectedCounterId(nextCounters[0].id);
              }}
              className="bg-slate-50 border border-slate-300 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-800 outline-hidden focus:ring-2 focus:ring-teal-600"
            >
              {offices.map(o => (
                <option key={o.id} value={o.id}>{o.name}</option>
              ))}
            </select>
          </div>

          {/* Switch Counter */}
          <div className="flex items-center space-x-2">
            <span className="text-xs font-medium text-slate-500">Counter:</span>
            <select
              value={selectedCounterId}
              onChange={e => setSelectedCounterId(e.target.value)}
              className="bg-teal-50 border border-teal-300 rounded-xl px-3 py-1.5 text-xs font-bold text-teal-950 outline-hidden"
            >
              {officeCounters.map(c => (
                <option key={c.id} value={c.id}>
                  Counter #{c.counterNumber} ({c.isPaused ? 'Paused' : 'Active'})
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={() => setShowWalkInModal(true)}
            className="bg-amber-500 hover:bg-amber-400 text-teal-950 font-bold px-3 py-1.5 rounded-xl text-xs flex items-center space-x-1.5 shadow-xs transition-colors cursor-pointer"
          >
            <PlusCircle className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Issue Walk-in Ticket</span>
          </button>
        </div>
      </div>

      {/* METRICS ROW */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
          <span className="text-xs text-slate-500 flex items-center space-x-1.5">
            <Users className="w-3.5 h-3.5 text-teal-600" aria-hidden="true" />
            <span>Waiting in Line</span>
          </span>
          <span className="text-2xl font-black text-slate-900 mt-1 block">
            {waitingTickets.length}
          </span>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
          <span className="text-xs text-slate-500 flex items-center space-x-1.5">
            <Clock className="w-3.5 h-3.5 text-blue-600" aria-hidden="true" />
            <span>Class Deferments</span>
          </span>
          <span className="text-2xl font-black text-blue-900 mt-1 block">
            {deferredTickets.length}
          </span>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
          <span className="text-xs text-slate-500 flex items-center space-x-1.5">
            <CheckCircle className="w-3.5 h-3.5 text-emerald-600" aria-hidden="true" />
            <span>Completed Today</span>
          </span>
          <span className="text-2xl font-black text-emerald-800 mt-1 block">
            {completedToday.length}
          </span>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
          <span className="text-xs text-slate-500 flex items-center space-x-1.5">
            <Clock className="w-3.5 h-3.5 text-amber-600" aria-hidden="true" />
            <span>Avg Service Time</span>
          </span>
          <span className="text-2xl font-black text-amber-900 mt-1 block">
            {currentOffice.averageServiceMinutes} mins
          </span>
        </div>
      </div>

      {/* MAIN OPERATIONAL SPLIT */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT 2 COLUMNS: ACTIVE COUNTER CONTROLS */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm relative overflow-hidden">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <span className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
                <h2 className="text-base font-bold text-slate-900">
                  Counter #{activeCounter?.counterNumber || 1} Dispatcher
                </h2>
              </div>
              <span className="text-xs font-medium text-slate-500">
                Staff: {activeCounter?.assignedStaffName || 'Officer in Charge'}
              </span>
            </div>

            {/* Current Active Ticket Card */}
            <div className="mt-6 p-6 rounded-2xl bg-gradient-to-b from-slate-50 to-slate-100 border border-slate-200 text-center">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 block">
                Current Ticket at Counter
              </span>

              {currentCounterTicket ? (
                <div className="my-4">
                  <span className="text-5xl sm:text-6xl font-black text-teal-950 tracking-tight block">
                    {currentCounterTicket.ticketNumber}
                  </span>
                  <div className="mt-2 text-sm text-slate-700">
                    <span className="font-semibold">{currentCounterTicket.studentName}</span>
                    {currentCounterTicket.studentNumber && (
                      <span className="text-xs text-slate-500 ml-1">({currentCounterTicket.studentNumber})</span>
                    )}
                  </div>
                  <div className="mt-1 text-xs text-teal-800 font-medium">
                    {services.find(s => s.id === currentCounterTicket.serviceId)?.name}
                  </div>
                  <div className="mt-3 inline-flex items-center space-x-2 text-xs font-semibold px-3 py-1 rounded-full bg-amber-100 text-amber-900 border border-amber-300">
                    <span className="w-2 h-2 rounded-full bg-amber-600 animate-pulse" />
                    <span>Status: {currentCounterTicket.status}</span>
                  </div>

                  {/* Active Service Duration Indicator */}
                  {currentCounterTicket.status === 'SERVING' && currentCounterTicket.serviceStartedAt && (
                    <div className="mt-3 inline-flex items-center space-x-2 text-xs font-mono font-bold px-3 py-1 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-300">
                      <Clock className="w-3.5 h-3.5 text-emerald-600" />
                      <span>
                        Service Duration: {Math.max(1, Math.round((currentTimeMs - new Date(currentCounterTicket.serviceStartedAt).getTime()) / 60000))} mins
                      </span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="my-8">
                  <span className="text-3xl font-extrabold text-slate-400 block">
                    No Active Ticket
                  </span>
                  <span className="text-xs text-slate-500 mt-1 block">
                    Counter is currently idle. Click &quot;Call Next Student&quot; below.
                  </span>
                </div>
              )}
            </div>

            {/* ACTION BUTTON GRID */}
            <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3">
              {/* Call Next */}
              <button
                onClick={() => {
                  if (activeCounter) callNextTicket(activeCounter.id);
                }}
                disabled={activeCounter?.isPaused || waitingTickets.length === 0}
                className="col-span-2 sm:col-span-1 bg-teal-700 hover:bg-teal-800 disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold py-3 px-4 rounded-xl shadow-xs transition-colors text-xs flex flex-col items-center justify-center space-y-1 cursor-pointer disabled:cursor-not-allowed"
              >
                <PhoneCall className="w-5 h-5" aria-hidden="true" />
                <span>CALL NEXT</span>
              </button>

              {/* Recall */}
              <button
                onClick={() => {
                  if (currentCounterTicket) recallTicket(currentCounterTicket.id);
                }}
                disabled={!currentCounterTicket}
                className="bg-amber-500 hover:bg-amber-400 disabled:bg-slate-200 disabled:text-slate-400 text-teal-950 font-bold py-3 px-4 rounded-xl shadow-xs transition-colors text-xs flex flex-col items-center justify-center space-y-1 cursor-pointer disabled:cursor-not-allowed"
              >
                <RotateCcw className="w-5 h-5" aria-hidden="true" />
                <span>RECALL</span>
              </button>

              {/* Start Service */}
              <button
                onClick={() => {
                  if (currentCounterTicket) startServing(currentCounterTicket.id);
                }}
                disabled={!currentCounterTicket || currentCounterTicket.status === 'SERVING'}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold py-3 px-4 rounded-xl shadow-xs transition-colors text-xs flex flex-col items-center justify-center space-y-1 cursor-pointer disabled:cursor-not-allowed"
              >
                <Play className="w-5 h-5" aria-hidden="true" />
                <span>START SERVICE</span>
              </button>

              {/* Complete Service */}
              <button
                onClick={() => {
                  if (currentCounterTicket) completeServing(currentCounterTicket.id);
                }}
                disabled={!currentCounterTicket}
                className="bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold py-3 px-4 rounded-xl shadow-xs transition-colors text-xs flex flex-col items-center justify-center space-y-1 cursor-pointer disabled:cursor-not-allowed"
              >
                <CheckCircle className="w-5 h-5" aria-hidden="true" />
                <span>COMPLETE</span>
              </button>
            </div>

            {/* SECONDARY ACTIONS */}
            <div className="mt-4 pt-4 border-t border-slate-100 flex flex-wrap gap-2 justify-between items-center text-xs">
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => {
                    if (currentCounterTicket) skipTicket(currentCounterTicket.id);
                  }}
                  disabled={!currentCounterTicket}
                  className="text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 disabled:opacity-50 px-3 py-1.5 rounded-lg flex items-center space-x-1 cursor-pointer"
                >
                  <SkipForward className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Skip Ticket</span>
                </button>

                <button
                  onClick={() => {
                    if (currentCounterTicket) markNoShow(currentCounterTicket.id);
                  }}
                  disabled={!currentCounterTicket}
                  className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 disabled:opacity-50 px-3 py-1.5 rounded-lg flex items-center space-x-1 cursor-pointer"
                >
                  <UserX className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Mark No-Show</span>
                </button>
              </div>

              {activeCounter && (
                activeCounter.isPaused ? (
                  <button
                    onClick={() => resumeCounter(activeCounter.id)}
                    className="text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-lg font-semibold flex items-center space-x-1 cursor-pointer"
                  >
                    <Play className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>Resume Counter</span>
                  </button>
                ) : (
                  <button
                    onClick={() => pauseCounter(activeCounter.id)}
                    className="text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg font-medium flex items-center space-x-1 cursor-pointer"
                  >
                    <Pause className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>Pause Counter</span>
                  </button>
                )
              )}
            </div>
          </div>

          {/* Quick Ticket QR / Code Lookup tool */}
          <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2 flex items-center space-x-1.5">
              <QrCode className="w-4 h-4 text-teal-600" aria-hidden="true" />
              <span>Verify Student Ticket / QR Pass</span>
            </h3>
            <form onSubmit={handleManualVerification} className="flex gap-2">
              <input
                type="text"
                placeholder="Scan QR token or type verification code (e.g. R-036 or R036-9932)..."
                value={verificationCodeInput}
                onChange={e => setVerificationCodeInput(e.target.value)}
                className="flex-1 bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 outline-hidden focus:ring-2 focus:ring-teal-600 font-mono"
              />
              <button
                type="submit"
                className="bg-teal-700 hover:bg-teal-800 text-white font-semibold text-xs px-4 py-2 rounded-xl transition-colors cursor-pointer"
              >
                Validate Pass
              </button>
            </form>
          </div>
        </div>

        {/* RIGHT 1 COLUMN: LIVE QUEUE LIST FOR THIS OFFICE */}
        <div className="space-y-4">
          <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-slate-900 text-sm flex items-center space-x-2">
                <span>Waiting Queue ({waitingTickets.length})</span>
              </h3>
              <span className="text-[11px] text-slate-400">Next in order</span>
            </div>

            <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1 divide-y divide-slate-100">
              {waitingTickets.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-400">
                  No students in queue right now.
                </div>
              ) : (
                waitingTickets.map((tkt, idx) => (
                  <div key={tkt.id} className="pt-2 first:pt-0 flex items-center justify-between text-xs">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-mono font-bold text-slate-900">{tkt.ticketNumber}</span>
                        {idx === 0 && (
                          <span className="bg-teal-100 text-teal-800 text-[10px] font-bold px-1.5 py-0.2 rounded-sm">
                            NEXT
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-600 truncate max-w-[150px]">{tkt.studentName}</p>
                    </div>
                    <span className="text-[10px] text-slate-400">
                      {currentTimeMs > 0 ? `${Math.max(1, Math.round((currentTimeMs - new Date(tkt.issuedAt).getTime()) / 60000))}m ago` : 'recently'}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Deferred Tickets in Class */}
          <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-bold text-blue-950 text-sm flex items-center space-x-1.5">
                <Clock className="w-4 h-4 text-blue-600" aria-hidden="true" />
                <span>Class Deferments ({deferredTickets.length})</span>
              </h3>
            </div>
            <p className="text-[11px] text-slate-500 mb-3">
              Held for students currently in lectures or exams.
            </p>

            <div className="space-y-2 max-h-48 overflow-y-auto">
              {deferredTickets.length === 0 ? (
                <span className="text-xs text-slate-400 block text-center py-2">
                  No pending deferments.
                </span>
              ) : (
                deferredTickets.map(tkt => (
                  <div key={tkt.id} className="p-2.5 bg-blue-50/60 rounded-xl border border-blue-100 text-xs flex items-center justify-between">
                    <div>
                      <span className="font-mono font-bold text-blue-950">{tkt.ticketNumber}</span>
                      <p className="text-[10px] text-blue-800">{tkt.defermentReason}</p>
                    </div>
                    <span className="text-[10px] text-blue-600 font-semibold">
                      #{tkt.defermentCount} Defer
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* MODAL: CREATE WALK-IN TICKET */}
      {showWalkInModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <h3 className="text-lg font-bold text-slate-900">Issue Walk-in Physical Queue Ticket</h3>
            <p className="text-xs text-slate-500 mt-1">
              For students, parents, or alumni transacting without smartphones.
            </p>

            <form onSubmit={handleCreateWalkIn} className="mt-4 space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Office
                </label>
                <div className="p-2.5 bg-slate-100 rounded-xl text-xs font-bold text-slate-800">
                  {currentOffice.name}
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Service Category
                </label>
                <select
                  value={walkInServiceId}
                  onChange={e => setWalkInServiceId(e.target.value)}
                  required
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs text-slate-900 outline-hidden focus:ring-2 focus:ring-teal-600"
                >
                  <option value="">-- Choose Transaction Category --</option>
                  {services.filter(s => s.officeId === currentStaffOfficeId && s.isActive).map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowWalkInModal(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-amber-500 hover:bg-amber-400 text-teal-950 text-xs font-bold px-4 py-2.5 rounded-xl transition-colors cursor-pointer"
                >
                  Issue & Print Physical Slip
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
