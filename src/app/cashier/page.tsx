'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { QueueProvider, useCashierQueue } from '@/context/CashierQueueContext';
import { SACLogo } from '@/components/SACLogo';
import { ToastContainer } from '@/components/ToastContainer';
import { CallNotificationAlert } from '@/components/CallNotificationAlert';
import { playFullAudioCall } from '@/lib/notifications';
import { 
  KeyRound, 
  Mail, 
  CheckCircle2, 
  UserCheck, 
  Volume2, 
  LogOut, 
  Tv, 
  Clock, 
  Receipt, 
  RefreshCw,
  PhoneCall,
  UserX,
  Play,
  Check,
  Send,
  PlusCircle,
  Users,
  Radio
} from 'lucide-react';

function CashierTerminalContent() {
  const {
    cashierUser,
    sendOtp,
    verifyOtp,
    logoutCashier,
    lastGeneratedOtp,
    callNextTicket,
    recallTicket,
    startServing,
    completeServing,
    skipTicket,
    markNoShow,
    printNewTicket,
    tickets,
    nowServingTicket,
    latestCallNotification,
    dismissCallNotification,
  } = useCashierQueue();

  // Login form state
  const [emailInput, setEmailInput] = useState<string>('cashier1@sac.edu.ph');
  const [windowChoice, setWindowChoice] = useState<1 | 2>(1);
  const [otpInput, setOtpInput] = useState<string>('');
  const [otpSent, setOtpSent] = useState<boolean>(false);
  const [otpMessage, setOtpMessage] = useState<string>('');
  const [isSendingOtp, setIsSendingOtp] = useState<boolean>(false);
  const [isVerifying, setIsVerifying] = useState<boolean>(false);

  // Service timer calculation
  const [servingDuration, setServingDuration] = useState<string>('00:00');

  // Currently serving ticket for this cashier's window
  const activeCounterNum = cashierUser?.counterNumber || 1;
  const currentTicket = tickets.find(
    t => t.assignedCounterNumber === activeCounterNum && (t.status === 'CALLED' || t.status === 'SERVING')
  );

  const servingC1 = nowServingTicket(1);
  const servingC2 = nowServingTicket(2);

  const waitingTickets = tickets
    .filter(t => t.status === 'WAITING')
    .sort((a, b) => new Date(a.issuedAt).getTime() - new Date(b.issuedAt).getTime());

  // Timer effect
  useEffect(() => {
    if (!currentTicket?.serviceStartedAt && !currentTicket?.calledAt) {
      setServingDuration('00:00');
      return;
    }
    const startTime = new Date(currentTicket.serviceStartedAt || currentTicket.calledAt!).getTime();
    const timer = setInterval(() => {
      const diffSec = Math.floor((Date.now() - startTime) / 1000);
      const mins = String(Math.floor(diffSec / 60)).padStart(2, '0');
      const secs = String(diffSec % 60).padStart(2, '0');
      setServingDuration(`${mins}:${secs}`);
    }, 1000);
    return () => clearInterval(timer);
  }, [currentTicket]);

  // Voice & Audio Chime announcement helper
  const announceTicket = (ticketNum: string, windowNum: number, isRecall = false) => {
    playFullAudioCall({
      ticketNumber: ticketNum,
      windowNumber: windowNum as 1 | 2,
      isRecall,
    }).catch(() => {});
  };

  // Handle Send OTP
  const handleSendOtp = () => {
    setIsSendingOtp(true);
    setTimeout(() => {
      const res = sendOtp(emailInput, windowChoice);
      setIsSendingOtp(false);
      if (res.success) {
        setOtpSent(true);
        setOtpMessage(res.message);
      } else {
        alert(res.message);
      }
    }, 400);
  };

  // Handle Verify OTP
  const handleVerifyOtp = () => {
    setIsVerifying(true);
    setTimeout(() => {
      const ok = verifyOtp(emailInput, otpInput, windowChoice);
      setIsVerifying(false);
      if (ok) {
        setOtpSent(false);
        setOtpInput('');
      }
    }, 400);
  };

  // Call Next Ticket Handler
  const handleCallNext = () => {
    const called = callNextTicket(activeCounterNum);
    if (called) {
      announceTicket(called.ticketNumber, activeCounterNum);
    }
  };

  // Recall Handler
  const handleRecall = () => {
    if (currentTicket) {
      recallTicket(currentTicket.id);
      announceTicket(currentTicket.ticketNumber, activeCounterNum, true);
    }
  };

  // Quick Issue Next Sequential Ticket
  const handleQuickAddTicket = () => {
    printNewTicket('srv-exam-period-payment', 'Student Guest');
  };

  // -------------------------------------------------------------
  // VIEW 1: AUTHENTICATION SCREEN (WHITE BASE + LOGO COLORS)
  // -------------------------------------------------------------
  if (!cashierUser) {
    return (
      <div className="min-h-screen bg-white text-slate-900 flex flex-col justify-center items-center p-4 sm:p-6 font-sans">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-xl border-2 border-[#EA671B]/20 overflow-hidden">
          {/* Header Banner with Maroon & Amber Accents */}
          <div className="bg-[#751A1A] p-6 text-center text-white relative">
            <div className="flex justify-center mb-3">
              <SACLogo className="w-20 h-20 drop-shadow-md" />
            </div>
            <span className="text-[10px] font-extrabold text-[#EA671B] bg-white px-2.5 py-0.5 rounded-full uppercase tracking-widest inline-block mb-1">
              ST. ANTHONY&apos;S COLLEGE &bull; SAN JOSE, ANTIQUE
            </span>
            <h1 className="text-2xl font-black tracking-tight mt-1 text-white">
              Cashier Terminal Login
            </h1>
            <p className="text-xs text-amber-100/90 mt-1 font-medium">
              Window 1 &amp; Window 2 Authorized Desk &bull; Gmail OTP Authentication
            </p>
          </div>

          <div className="p-6 sm:p-8 space-y-6 bg-white">
            {/* Quick Switch for Cashier 1 vs Cashier 2 */}
            <div>
              <label className="block text-xs font-bold text-[#751A1A] uppercase tracking-wider mb-2">
                Select Official Cashier Window:
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setWindowChoice(1);
                    setEmailInput('cashier1@sac.edu.ph');
                  }}
                  className={`p-3 rounded-2xl text-xs font-bold border-2 transition-all cursor-pointer flex flex-col items-center justify-center ${
                    windowChoice === 1
                      ? 'bg-[#FFF8F1] border-[#EA671B] text-[#751A1A] shadow-xs'
                      : 'border-slate-200 text-slate-600 hover:border-slate-300'
                  }`}
                >
                  <span className="text-base font-black">WINDOW 1</span>
                  <span className="text-[10px] text-slate-500 font-normal">cashier1@sac.edu.ph</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setWindowChoice(2);
                    setEmailInput('cashier2@sac.edu.ph');
                  }}
                  className={`p-3 rounded-2xl text-xs font-bold border-2 transition-all cursor-pointer flex flex-col items-center justify-center ${
                    windowChoice === 2
                      ? 'bg-[#FFF8F1] border-[#EA671B] text-[#751A1A] shadow-xs'
                      : 'border-slate-200 text-slate-600 hover:border-slate-300'
                  }`}
                >
                  <span className="text-base font-black">WINDOW 2</span>
                  <span className="text-[10px] text-slate-500 font-normal">cashier2@sac.edu.ph</span>
                </button>
              </div>
            </div>

            {/* Email Address Input */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Cashier Gmail / Official Email:
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="email"
                  value={emailInput}
                  onChange={e => setEmailInput(e.target.value)}
                  placeholder="e.g. cashier1@sac.edu.ph"
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-300 text-slate-800 text-sm font-medium focus:ring-2 focus:ring-[#EA671B] focus:border-[#EA671B] outline-none"
                />
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                Passwordless access: An OTP passcode will be dispatched to this Gmail.
              </p>
            </div>

            {/* Send OTP Button */}
            {!otpSent ? (
              <button
                type="button"
                onClick={handleSendOtp}
                disabled={isSendingOtp || !emailInput}
                className="w-full bg-[#751A1A] hover:bg-[#5A1212] text-white font-black py-3 px-4 rounded-xl text-sm transition-all shadow-md flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50"
              >
                {isSendingOtp ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
                <span>Send One-Time Passcode (OTP)</span>
              </button>
            ) : (
              /* OTP Code Input Box */
              <div className="space-y-4 pt-2 border-t border-slate-100">
                <div className="p-3 bg-[#FFF8F1] border border-[#EA671B]/30 rounded-2xl text-xs text-[#751A1A] flex items-start space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-[#EA671B] mt-0.5 shrink-0" />
                  <div>
                    <p className="font-bold">Passcode Dispatched to Gmail!</p>
                    <p className="text-[11px] text-slate-600 mt-0.5">
                      {otpMessage || `OTP sent to ${emailInput}.`}
                    </p>
                    {lastGeneratedOtp && (
                      <div className="mt-2 bg-white px-2.5 py-1 rounded-lg border border-[#EA671B]/40 inline-block font-mono font-black text-[#751A1A] text-sm tracking-widest shadow-2xs">
                        Demo Passcode: {lastGeneratedOtp}
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Enter 6-Digit Gmail OTP:
                  </label>
                  <div className="relative">
                    <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                    <input
                      type="text"
                      maxLength={6}
                      value={otpInput}
                      onChange={e => setOtpInput(e.target.value.replace(/\D/g, ''))}
                      placeholder="e.g. 123456"
                      className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-300 text-slate-900 text-lg font-mono font-bold tracking-widest focus:ring-2 focus:ring-[#EA671B] focus:border-[#EA671B] outline-none text-center"
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleVerifyOtp}
                  disabled={isVerifying || otpInput.length < 4}
                  className="w-full bg-[#EA671B] hover:bg-[#D95B11] text-white font-black py-3 px-4 rounded-xl text-sm transition-all shadow-md flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50"
                >
                  {isVerifying ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <UserCheck className="w-4 h-4" />
                  )}
                  <span>Verify OTP &amp; Unlock Terminal</span>
                </button>

                <div className="text-center">
                  <button
                    type="button"
                    onClick={handleSendOtp}
                    className="text-xs text-[#751A1A] hover:underline font-semibold cursor-pointer"
                  >
                    Didn&apos;t get code? Resend OTP
                  </button>
                </div>
              </div>
            )}

            {/* Student Monitor Quick Access Link */}
            <div className="pt-4 border-t border-slate-200 text-center">
              <Link
                href="/"
                className="inline-flex items-center space-x-1.5 text-xs text-slate-600 hover:text-[#751A1A] font-semibold"
              >
                <Tv className="w-3.5 h-3.5 text-[#EA671B]" />
                <span>Go to Campus TV Display (Student View)</span>
              </Link>
            </div>
          </div>
        </div>

        <p className="text-[11px] text-slate-500 mt-6 text-center max-w-sm">
          St. Anthony&apos;s College &bull; Secure Cashier Queue System &bull; San Jose, Antique
        </p>

        <ToastContainer />
      </div>
    );
  }

  // -------------------------------------------------------------
  // VIEW 2: AUTHENTICATED CASHIER CALLING DESK (PURE CALLING STATION)
  // -------------------------------------------------------------
  return (
    <div className="min-h-screen bg-white text-slate-900 flex flex-col font-sans overflow-x-hidden w-full max-w-full">
      {/* Top Bar for Cashier Desk */}
      <header className="bg-white border-b border-slate-200 px-3.5 sm:px-8 py-3 sm:py-3.5 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center space-x-3 min-w-0">
          <SACLogo className="w-10 h-10 sm:w-11 sm:h-11 drop-shadow-xs shrink-0" />
          <div className="min-w-0 flex-1">
            <div className="flex items-center space-x-2 flex-wrap gap-1">
              <span className="font-black text-[#751A1A] text-sm sm:text-base tracking-tight truncate">
                ST. ANTHONY&apos;S COLLEGE
              </span>
              <span className="bg-[#EA671B] text-white font-black text-[9px] sm:text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider shrink-0">
                CASHIER CALLING DESK
              </span>
            </div>
            <p className="text-[11px] sm:text-xs text-slate-600 font-medium truncate">
              Logged in as: <strong className="text-[#751A1A]">{cashierUser.name}</strong>
            </p>
          </div>
        </div>

        {/* Action Pills */}
        <div className="flex items-center space-x-2 sm:space-x-2.5 w-full sm:w-auto justify-between sm:justify-end">
          <div className="bg-[#FFF8F1] border border-[#EA671B]/30 text-[#751A1A] text-[11px] sm:text-xs px-2.5 sm:px-3 py-1.5 rounded-xl flex items-center space-x-1.5 sm:space-x-2 shrink-0">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-bold">WINDOW #{cashierUser.counterNumber} ACTIVE</span>
          </div>

          <div className="flex items-center space-x-2 shrink-0">
            <Link
              href="/"
              target="_blank"
              className="bg-white hover:bg-[#FFF8F1] text-slate-700 hover:text-[#751A1A] text-[11px] sm:text-xs font-semibold px-2.5 sm:px-3 py-1.5 rounded-xl flex items-center space-x-1.5 transition-colors cursor-pointer border border-slate-200 shadow-2xs min-h-[36px]"
              title="Open Campus TV Display in New Tab"
            >
              <Tv className="w-3.5 h-3.5 text-[#EA671B]" />
              <span className="hidden xs:inline">Live Campus TV</span>
            </Link>

            <button
              onClick={logoutCashier}
              className="bg-[#751A1A] hover:bg-[#5A1212] text-white text-[11px] sm:text-xs font-semibold px-2.5 sm:px-3 py-1.5 rounded-xl flex items-center space-x-1.5 transition-colors cursor-pointer shadow-2xs min-h-[36px]"
              title="Log Out of Terminal"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </header>

      {/* Floating Call Notification Alert Flash */}
      <CallNotificationAlert
        notification={latestCallNotification}
        onDismiss={dismissCallNotification}
      />

      {/* Live Windows Status Strip (What number is in now across Windows 1 & 2) */}
      <div className="bg-[#FFF8F1] border-b border-[#EA671B]/25 px-3.5 sm:px-8 py-2.5 flex flex-col sm:flex-row items-start sm:items-center justify-between text-xs gap-2">
        <div className="flex items-center space-x-2">
          <Radio className="w-3.5 h-3.5 text-[#EA671B] animate-pulse" />
          <span className="font-extrabold text-[#751A1A] uppercase tracking-wider">
            Live Calling Status (What Number is In Now):
          </span>
        </div>
        <div className="flex items-center space-x-2.5 font-mono font-bold flex-wrap">
          <span className="bg-white px-2.5 py-1 rounded-lg border border-[#EA671B]/30 text-slate-800 flex items-center space-x-1.5 shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>Window 1: <strong className="text-[#751A1A]">{servingC1 ? servingC1.ticketNumber : 'Standby'}</strong></span>
          </span>
          <span className="bg-white px-2.5 py-1 rounded-lg border border-[#EA671B]/30 text-slate-800 flex items-center space-x-1.5 shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>Window 2: <strong className="text-[#751A1A]">{servingC2 ? servingC2.ticketNumber : 'Standby'}</strong></span>
          </span>
        </div>
      </div>

      {/* Main Operations Area: Focused 100% on Calling Out Numbers */}
      <main className="max-w-6xl w-full mx-auto p-3 sm:p-6 lg:p-8 flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 bg-white items-start">
        {/* PRIMARY CALLING STATION (7 Cols) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white rounded-3xl p-5 sm:p-8 shadow-md border-2 border-[#EA671B]/30 relative overflow-hidden">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 gap-2">
              <div className="flex items-center space-x-2">
                <Receipt className="w-5 h-5 text-[#EA671B]" />
                <h2 className="text-base sm:text-xl font-black text-[#751A1A] tracking-tight">
                  Cashier Window {activeCounterNum} Station
                </h2>
              </div>

              <span className={`text-xs font-bold px-3 py-1 rounded-full shrink-0 ${
                currentTicket 
                  ? currentTicket.status === 'SERVING' 
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' 
                    : 'bg-[#FFF8F1] text-[#751A1A] border border-[#EA671B]/40'
                  : 'bg-slate-100 text-slate-600'
              }`}>
                {currentTicket ? `Status: ${currentTicket.status}` : 'Window Idle'}
              </span>
            </div>

            {/* Giant Active Ticket Display */}
            <div className="my-6 text-center py-8 sm:py-10 bg-[#FFF8F1]/60 rounded-2xl border border-[#EA671B]/20 shadow-inner">
              <span className="text-xs uppercase tracking-widest text-[#EA671B] font-black block mb-1">
                CURRENT TICKET ASSIGNED
              </span>
              <span className="text-6xl xs:text-7xl sm:text-8xl font-black font-mono text-[#751A1A] tracking-tight block leading-none my-2">
                {currentTicket ? currentTicket.ticketNumber : '---'}
              </span>

              {currentTicket ? (
                <div className="mt-3 space-y-1">
                  <span className="text-base sm:text-lg font-bold text-slate-900 block truncate">
                    {currentTicket.studentName}
                  </span>
                  <div className="text-xs font-mono text-slate-500 flex items-center justify-center space-x-1 mt-1">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>Serving Duration: {servingDuration}</span>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-slate-400 mt-2">
                  No ticket currently called. Tap &quot;Call Next Student&quot; to summon the next in line.
                </p>
              )}
            </div>

            {/* Giant Action Call Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Call Next Button */}
              <button
                type="button"
                onClick={handleCallNext}
                disabled={waitingTickets.length === 0}
                className="w-full min-h-[54px] bg-[#751A1A] hover:bg-[#5A1212] text-white font-black py-4 px-5 rounded-2xl shadow-md hover:shadow-lg transition-all flex items-center justify-center space-x-2.5 cursor-pointer disabled:opacity-40 text-sm sm:text-base"
              >
                <PhoneCall className="w-5 h-5 text-[#EA671B]" />
                <span>Call Next Student ({waitingTickets.length})</span>
              </button>

              {/* Recall Audio Voice */}
              <button
                type="button"
                onClick={handleRecall}
                disabled={!currentTicket}
                className="w-full min-h-[54px] bg-[#EA671B] hover:bg-[#D95B11] text-white font-bold py-4 px-5 rounded-2xl shadow-xs hover:shadow-md transition-all flex items-center justify-center space-x-2.5 cursor-pointer disabled:opacity-40 text-sm sm:text-base"
              >
                <Volume2 className="w-5 h-5" />
                <span>Recall Ticket (Audio)</span>
              </button>
            </div>

            {/* Secondary Controls (Start Serving, Complete, Skip, No-show) */}
            {currentTicket && (
              <div className="mt-5 pt-4 border-t border-slate-100 grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <button
                  type="button"
                  onClick={() => startServing(currentTicket.id)}
                  disabled={currentTicket.status === 'SERVING'}
                  className="min-h-[44px] p-2.5 rounded-xl text-xs font-bold bg-[#FFF8F1] text-[#751A1A] border border-[#EA671B]/30 hover:bg-white transition-colors flex items-center justify-center space-x-1 cursor-pointer disabled:opacity-50"
                >
                  <Play className="w-3.5 h-3.5 text-[#EA671B]" />
                  <span>Start Serving</span>
                </button>

                <button
                  type="button"
                  onClick={() => completeServing(currentTicket.id)}
                  className="min-h-[44px] p-2.5 rounded-xl text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-700 transition-colors flex items-center justify-center space-x-1 cursor-pointer shadow-xs"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Complete</span>
                </button>

                <button
                  type="button"
                  onClick={() => skipTicket(currentTicket.id)}
                  className="min-h-[44px] p-2.5 rounded-xl text-xs font-semibold bg-slate-50 text-slate-700 border border-slate-200 hover:bg-slate-100 transition-colors flex items-center justify-center space-x-1 cursor-pointer"
                >
                  <span>Skip</span>
                </button>

                <button
                  type="button"
                  onClick={() => markNoShow(currentTicket.id)}
                  className="min-h-[44px] p-2.5 rounded-xl text-xs font-semibold bg-red-50 text-red-800 border border-red-200 hover:bg-red-100 transition-colors flex items-center justify-center space-x-1 cursor-pointer"
                >
                  <UserX className="w-3.5 h-3.5 text-red-600" />
                  <span>No-Show</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* WAITING QUEUE ROSTER & QUICK ISSUANCE (5 Cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white rounded-3xl p-5 sm:p-6 shadow-sm border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 gap-2">
              <div className="flex items-center space-x-2">
                <Users className="w-4 h-4 text-[#EA671B]" />
                <h3 className="text-sm font-black text-[#751A1A] uppercase tracking-wider">
                  Waiting Queue ({waitingTickets.length})
                </h3>
              </div>

              {/* Quick sequence number dispenser */}
              <button
                type="button"
                onClick={handleQuickAddTicket}
                className="bg-[#FFF8F1] hover:bg-white text-[#751A1A] border border-[#EA671B]/30 hover:border-[#EA671B] text-xs font-bold px-2.5 py-1 rounded-xl transition-all flex items-center space-x-1 cursor-pointer shadow-2xs"
                title="Add next sequential ticket number to queue"
              >
                <PlusCircle className="w-3.5 h-3.5 text-[#EA671B]" />
                <span>+ Add Number</span>
              </button>
            </div>

            <p className="text-[11px] text-slate-500 mt-2">
              Tickets waiting to be called. Numbers are summoned in FIFO order.
            </p>

            <div className="mt-3 divide-y divide-slate-100 max-h-96 overflow-y-auto">
              {waitingTickets.length === 0 ? (
                <div className="py-12 text-center text-xs text-slate-400">
                  <p>Queue is currently clear.</p>
                  <button
                    type="button"
                    onClick={handleQuickAddTicket}
                    className="mt-3 text-[#EA671B] font-bold text-xs underline cursor-pointer"
                  >
                    + Generate next queue ticket
                  </button>
                </div>
              ) : (
                waitingTickets.map((t, idx) => (
                  <div key={t.id} className="py-3 flex items-center justify-between gap-2">
                    <div className="flex items-center space-x-3 min-w-0">
                      <span className="w-6 h-6 rounded-lg bg-[#FFF8F1] text-[#751A1A] font-black text-xs flex items-center justify-center font-mono border border-[#EA671B]/25 shrink-0">
                        {idx + 1}
                      </span>
                      <div className="min-w-0">
                        <span className="text-base font-black font-mono text-[#751A1A] block leading-none">
                          {t.ticketNumber}
                        </span>
                        <span className="text-xs text-slate-500 truncate block mt-0.5">
                          {t.studentName}
                        </span>
                      </div>
                    </div>

                    <span className="text-[11px] font-mono text-slate-400 shrink-0">
                      Waiting in lobby
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </main>

      <ToastContainer />
    </div>
  );
}

export default function CashierPage() {
  return (
    <QueueProvider>
      <CashierTerminalContent />
    </QueueProvider>
  );
}
