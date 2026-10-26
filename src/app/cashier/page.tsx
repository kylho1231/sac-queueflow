'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { QueueProvider, useCashierQueue } from '@/context/CashierQueueContext';
import { SACLogo } from '@/components/SACLogo';
import { ToastContainer } from '@/components/ToastContainer';
import { 
  KeyRound, 
  Mail, 
  CheckCircle2, 
  AlertCircle, 
  Printer, 
  UserCheck, 
  Volume2, 
  LogOut, 
  Tv, 
  Clock, 
  Receipt, 
  Sparkles, 
  RefreshCw,
  PhoneCall,
  UserX,
  Play,
  Check,
  Send
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
    services,
  } = useCashierQueue();

  // Login form state
  const [emailInput, setEmailInput] = useState<string>('cashier1@sac.edu.ph');
  const [windowChoice, setWindowChoice] = useState<1 | 2>(1);
  const [otpInput, setOtpInput] = useState<string>('');
  const [otpSent, setOtpSent] = useState<boolean>(false);
  const [otpMessage, setOtpMessage] = useState<string>('');
  const [isSendingOtp, setIsSendingOtp] = useState<boolean>(false);
  const [isVerifying, setIsVerifying] = useState<boolean>(false);

  // Ticket Printing Modal / Form State (Form Code: FO 07, Rev 1)
  const [studentNo, setStudentNo] = useState<string>('');
  const [studentName, setStudentName] = useState<string>('');
  const [yearCourse, setYearCourse] = useState<string>('');
  const [amount, setAmount] = useState<string>('');
  const [selectedServiceId, setSelectedServiceId] = useState<string>('srv-exam-period-payment');
  const [selectedQuarter, setSelectedQuarter] = useState<string>('1st');
  const [otherSpecify, setOtherSpecify] = useState<string>('');
  const [printedSlipData, setPrintedSlipData] = useState<{
    ticketNumber: string;
    studentNo: string;
    studentName: string;
    yearCourse: string;
    amount: string;
    categoryText: string;
    date: string;
    lookupCode: string;
  } | null>(null);

  // Service timer calculation
  const [servingDuration, setServingDuration] = useState<string>('00:00');

  // Currently serving ticket for this cashier's window
  const activeCounterNum = cashierUser?.counterNumber || 1;
  const currentTicket = tickets.find(
    t => t.assignedCounterNumber === activeCounterNum && (t.status === 'CALLED' || t.status === 'SERVING')
  );

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

  // Voice announcement helper
  const announceTicket = (ticketNum: string, windowNum: number) => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(
        `Ticket number ${ticketNum.split('').join(' ')}, please proceed to Cashier Window ${windowNum}.`
      );
      u.rate = 0.9;
      window.speechSynthesis.speak(u);
    }
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

  // Handle Print New Ticket (Form FO 07, Rev 1)
  const handlePrintSlip = (e: React.FormEvent) => {
    e.preventDefault();
    const serviceObj = services.find(s => s.id === selectedServiceId);
    let categoryText = serviceObj?.name || 'Cashier Transaction';
    if (selectedServiceId === 'srv-exam-period-payment') {
      categoryText = `Prelim / Midterm / Finals (${selectedQuarter} Quarter)`;
    } else if (selectedServiceId === 'srv-others-specified' && otherSpecify.trim()) {
      categoryText = `Others: ${otherSpecify.trim()}`;
    }

    const tkt = printNewTicket(
      selectedServiceId,
      studentName.trim() || `Student ${studentNo || ''}`,
      studentNo.trim(),
      amount.trim(),
      yearCourse.trim(),
      categoryText
    );

    const nowFormatted = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    setPrintedSlipData({
      ticketNumber: tkt.ticketNumber,
      studentNo: studentNo.trim() || 'N/A',
      studentName: studentName.trim() || 'Walk-in Student',
      yearCourse: yearCourse.trim() || 'SAC College Student',
      amount: amount.trim() || '0.00',
      categoryText,
      date: nowFormatted,
      lookupCode: tkt.lookupCode,
    });

    // Reset form fields
    setStudentNo('');
    setStudentName('');
    setYearCourse('');
    setAmount('');
    setOtherSpecify('');

    // Trigger Print after modal renders
    setTimeout(() => {
      window.print();
    }, 300);
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
      announceTicket(currentTicket.ticketNumber, activeCounterNum);
    }
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
  // VIEW 2: AUTHENTICATED CASHIER TERMINAL (WHITE BASE)
  // -------------------------------------------------------------
  return (
    <div className="min-h-screen bg-white text-slate-900 flex flex-col font-sans">
      {/* Top Bar for Cashier Desk */}
      <header className="bg-white border-b border-slate-200 px-4 sm:px-8 py-3.5 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <SACLogo className="w-11 h-11 drop-shadow-xs" />
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-black text-[#751A1A] text-base tracking-tight">
                ST. ANTHONY&apos;S COLLEGE
              </span>
              <span className="bg-[#EA671B] text-white font-black text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider">
                CASHIER TERMINAL
              </span>
            </div>
            <p className="text-xs text-slate-600 font-medium">
              Logged in as: <strong className="text-[#751A1A]">{cashierUser.name}</strong> ({cashierUser.email})
            </p>
          </div>
        </div>

        {/* Action Pills */}
        <div className="flex items-center space-x-2.5">
          <div className="bg-[#FFF8F1] border border-[#EA671B]/30 text-[#751A1A] text-xs px-3 py-1.5 rounded-xl flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-bold">WINDOW #{cashierUser.counterNumber} ACTIVE</span>
          </div>

          <Link
            href="/"
            target="_blank"
            className="bg-white hover:bg-[#FFF8F1] text-slate-700 hover:text-[#751A1A] text-xs font-semibold px-3 py-1.5 rounded-xl flex items-center space-x-1.5 transition-colors cursor-pointer border border-slate-200 shadow-2xs"
            title="Open Campus TV Display in New Tab"
          >
            <Tv className="w-3.5 h-3.5 text-[#EA671B]" />
            <span className="hidden sm:inline">Live Campus TV</span>
          </Link>

          <button
            onClick={logoutCashier}
            className="bg-[#751A1A] hover:bg-[#5A1212] text-white text-xs font-semibold px-3 py-1.5 rounded-xl flex items-center space-x-1.5 transition-colors cursor-pointer shadow-2xs"
            title="Log Out of Terminal"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </header>

      {/* Main Operations Grid */}
      <main className="max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 bg-white">
        {/* LEFT COLUMN: ACTIVE CALLING & SERVICE CONTROLS (7 Cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Cashier Calling Card */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-md border-2 border-[#EA671B]/25 relative overflow-hidden">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <Receipt className="w-5 h-5 text-[#EA671B]" />
                <h2 className="text-lg font-black text-[#751A1A] tracking-tight">
                  Window {activeCounterNum} Serving Station
                </h2>
              </div>

              <span className={`text-xs font-bold px-3 py-1 rounded-full ${
                currentTicket 
                  ? currentTicket.status === 'SERVING' 
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' 
                    : 'bg-[#FFF8F1] text-[#751A1A] border border-[#EA671B]/40'
                  : 'bg-slate-100 text-slate-600'
              }`}>
                {currentTicket ? `Status: ${currentTicket.status}` : 'Window Idle'}
              </span>
            </div>

            {/* Big Ticket Display */}
            <div className="my-6 text-center py-6 bg-[#FFF8F1]/60 rounded-2xl border border-[#EA671B]/20">
              <span className="text-xs uppercase tracking-widest text-[#EA671B] font-black block mb-1">
                CURRENT TICKET ASSIGNED
              </span>
              <span className="text-6xl sm:text-7xl font-black font-mono text-[#751A1A] tracking-tight block">
                {currentTicket ? currentTicket.ticketNumber : '---'}
              </span>

              {currentTicket ? (
                <div className="mt-3 space-y-1">
                  <span className="text-base font-bold text-slate-900 block">
                    {currentTicket.studentName}
                  </span>
                  <div className="text-xs text-slate-600 flex items-center justify-center space-x-2">
                    {currentTicket.studentNumber && (
                      <span className="font-mono bg-white px-2 py-0.5 rounded border border-slate-200">
                        ID: {currentTicket.studentNumber}
                      </span>
                    )}
                    <span className="text-[#EA671B] font-semibold">
                      {currentTicket.notes || 'Payment Slip Verification'}
                    </span>
                  </div>
                  <div className="mt-2 text-xs font-mono text-slate-500 flex items-center justify-center space-x-1">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>Duration: {servingDuration}</span>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-slate-400 mt-2">
                  No ticket currently active. Click &quot;Call Next Student&quot; below.
                </p>
              )}
            </div>

            {/* Action Buttons Toolbar */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Call Next Button */}
              <button
                type="button"
                onClick={handleCallNext}
                disabled={waitingTickets.length === 0}
                className="w-full bg-[#751A1A] hover:bg-[#5A1212] text-white font-black py-3.5 px-4 rounded-2xl shadow-md transition-all flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-40"
              >
                <PhoneCall className="w-5 h-5 text-[#EA671B]" />
                <span>Call Next Student ({waitingTickets.length} in line)</span>
              </button>

              {/* Recall Audio Voice */}
              <button
                type="button"
                onClick={handleRecall}
                disabled={!currentTicket}
                className="w-full bg-[#EA671B] hover:bg-[#D95B11] text-white font-bold py-3.5 px-4 rounded-2xl shadow-xs transition-all flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-40"
              >
                <Volume2 className="w-5 h-5" />
                <span>Recall Ticket (Audio)</span>
              </button>
            </div>

            {/* Secondary Controls (Start, Complete, Skip, No-show) */}
            {currentTicket && (
              <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-2 sm:grid-cols-4 gap-2">
                <button
                  type="button"
                  onClick={() => startServing(currentTicket.id)}
                  disabled={currentTicket.status === 'SERVING'}
                  className="p-2.5 rounded-xl text-xs font-bold bg-[#FFF8F1] text-[#751A1A] border border-[#EA671B]/30 hover:bg-white transition-colors flex items-center justify-center space-x-1 cursor-pointer disabled:opacity-50"
                >
                  <Play className="w-3.5 h-3.5 text-[#EA671B]" />
                  <span>Start Serving</span>
                </button>

                <button
                  type="button"
                  onClick={() => completeServing(currentTicket.id)}
                  className="p-2.5 rounded-xl text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-700 transition-colors flex items-center justify-center space-x-1 cursor-pointer shadow-xs"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Complete &amp; Receipt</span>
                </button>

                <button
                  type="button"
                  onClick={() => skipTicket(currentTicket.id)}
                  className="p-2.5 rounded-xl text-xs font-semibold bg-slate-50 text-slate-700 border border-slate-200 hover:bg-slate-100 transition-colors flex items-center justify-center space-x-1 cursor-pointer"
                >
                  <span>Skip Ticket</span>
                </button>

                <button
                  type="button"
                  onClick={() => markNoShow(currentTicket.id)}
                  className="p-2.5 rounded-xl text-xs font-semibold bg-red-50 text-red-800 border border-red-200 hover:bg-red-100 transition-colors flex items-center justify-center space-x-1 cursor-pointer"
                >
                  <UserX className="w-3.5 h-3.5 text-red-600" />
                  <span>Mark No-Show</span>
                </button>
              </div>
            )}
          </div>

          {/* Up Next in Line Table */}
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-sm font-extrabold text-[#751A1A] uppercase tracking-wider flex items-center space-x-2">
                <Clock className="w-4 h-4 text-[#EA671B]" />
                <span>Waiting Queue Roster ({waitingTickets.length})</span>
              </h3>
              <span className="text-xs text-slate-500 font-medium">
                Auto-assigned in FIFO order
              </span>
            </div>

            <div className="mt-3 divide-y divide-slate-100 max-h-64 overflow-y-auto">
              {waitingTickets.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400">
                  No pending students in line. All caught up!
                </div>
              ) : (
                waitingTickets.map((t, idx) => (
                  <div key={t.id} className="py-3 flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <span className="w-6 h-6 rounded-lg bg-[#FFF8F1] text-[#751A1A] font-black text-xs flex items-center justify-center font-mono border border-[#EA671B]/25">
                        {idx + 1}
                      </span>
                      <div>
                        <span className="text-base font-black font-mono text-[#751A1A]">
                          {t.ticketNumber}
                        </span>
                        <span className="text-xs text-slate-700 ml-2 font-medium">
                          {t.studentName}
                        </span>
                      </div>
                    </div>

                    <span className="text-xs text-slate-500 font-mono">
                      {t.notes || 'Payment Slip Form FO 07'}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: ISSUE & PRINT OFFICIAL PAYMENT SLIP (FORM FO 07, REV 1) (5 Cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white rounded-3xl p-6 shadow-md border-2 border-[#EA671B]/30">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <Printer className="w-5 h-5 text-[#EA671B]" />
                <h3 className="text-base font-black text-[#751A1A] tracking-tight">
                  Issue &amp; Print Payment Slip
                </h3>
              </div>
              <span className="text-[10px] font-extrabold bg-[#FFF8F1] text-[#751A1A] px-2 py-0.5 rounded-full border border-[#EA671B]/30">
                FORM CODE: FO 07, REV 1
              </span>
            </div>

            <p className="text-xs text-slate-500 mt-2">
              Physical ticket issuance: prints official St. Anthony&apos;s College queue receipt for student to hold while monitoring the TV.
            </p>

            {/* Issuance Form */}
            <form onSubmit={handlePrintSlip} className="mt-4 space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Student Number:
                </label>
                <input
                  type="text"
                  placeholder="e.g. 2024-01824"
                  value={studentNo}
                  onChange={e => setStudentNo(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs text-slate-800 font-mono focus:ring-2 focus:ring-[#EA671B] outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Student Full Name:
                </label>
                <input
                  type="text"
                  placeholder="e.g. Juan A. Dela Cruz"
                  value={studentName}
                  onChange={e => setStudentName(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs text-slate-800 font-medium focus:ring-2 focus:ring-[#EA671B] outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Year &amp; Course:
                </label>
                <input
                  type="text"
                  placeholder="e.g. BS Information Technology - 3rd Year"
                  value={yearCourse}
                  onChange={e => setYearCourse(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs text-slate-800 font-medium focus:ring-2 focus:ring-[#EA671B] outline-none"
                />
              </div>

              {/* Form FO 07 Categories Selection */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Payment Purpose (Check Applicable):
                </label>
                <div className="space-y-2 bg-[#FFF8F1]/50 p-3 rounded-2xl border border-[#EA671B]/20">
                  <label className="flex items-center space-x-2 text-xs text-slate-800 cursor-pointer">
                    <input
                      type="radio"
                      name="serviceCategory"
                      checked={selectedServiceId === 'srv-enrollment-downpayment'}
                      onChange={() => setSelectedServiceId('srv-enrollment-downpayment')}
                      className="text-[#EA671B] focus:ring-[#EA671B]"
                    />
                    <span className="font-semibold">Enrollment Downpayment</span>
                  </label>

                  <div className="space-y-1">
                    <label className="flex items-center space-x-2 text-xs text-slate-800 cursor-pointer">
                      <input
                        type="radio"
                        name="serviceCategory"
                        checked={selectedServiceId === 'srv-exam-period-payment'}
                        onChange={() => setSelectedServiceId('srv-exam-period-payment')}
                        className="text-[#EA671B] focus:ring-[#EA671B]"
                      />
                      <span className="font-semibold">Prelim / Midterm / Finals</span>
                    </label>

                    {selectedServiceId === 'srv-exam-period-payment' && (
                      <div className="ml-6 flex items-center space-x-2 pt-1">
                        {['1st', '2nd', '3rd', '4th'].map(q => (
                          <button
                            key={q}
                            type="button"
                            onClick={() => setSelectedQuarter(q)}
                            className={`px-2 py-0.5 rounded text-[10px] font-bold border transition-colors ${
                              selectedQuarter === q
                                ? 'bg-[#751A1A] text-white border-[#751A1A]'
                                : 'bg-white text-slate-600 border-slate-300'
                            }`}
                          >
                            {q} Qtr
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  <label className="flex items-center space-x-2 text-xs text-slate-800 cursor-pointer">
                    <input
                      type="radio"
                      name="serviceCategory"
                      checked={selectedServiceId === 'srv-old-accounts'}
                      onChange={() => setSelectedServiceId('srv-old-accounts')}
                      className="text-[#EA671B] focus:ring-[#EA671B]"
                    />
                    <span className="font-semibold">Old Accounts</span>
                  </label>

                  <div className="space-y-1">
                    <label className="flex items-center space-x-2 text-xs text-slate-800 cursor-pointer">
                      <input
                        type="radio"
                        name="serviceCategory"
                        checked={selectedServiceId === 'srv-others-specified'}
                        onChange={() => setSelectedServiceId('srv-others-specified')}
                        className="text-[#EA671B] focus:ring-[#EA671B]"
                      />
                      <span className="font-semibold">Others, pls. specify</span>
                    </label>

                    {selectedServiceId === 'srv-others-specified' && (
                      <input
                        type="text"
                        placeholder="e.g. Graduation Fee / Transcript of Records"
                        value={otherSpecify}
                        onChange={e => setOtherSpecify(e.target.value)}
                        className="w-full ml-6 mt-1 px-2.5 py-1 text-xs border border-slate-300 rounded-lg outline-none"
                      />
                    )}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Amount (PHP ₱):
                </label>
                <div className="relative">
                  <span className="text-slate-400 font-bold absolute left-3 top-2 text-xs">₱</span>
                  <input
                    type="text"
                    placeholder="0.00"
                    value={amount}
                    onChange={e => setAmount(e.target.value)}
                    className="w-full pl-7 pr-3 py-2 rounded-xl border border-slate-300 text-xs font-mono font-bold text-slate-800 focus:ring-2 focus:ring-[#EA671B] outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-[#EA671B] hover:bg-[#D95B11] text-white font-black py-3 px-4 rounded-xl text-xs transition-all shadow-md flex items-center justify-center space-x-2 cursor-pointer mt-2"
              >
                <Printer className="w-4 h-4" />
                <span>Print Official Slip (FO 07) &amp; Ticket</span>
              </button>
            </form>
          </div>

          {/* Quick Notice Card */}
          <div className="p-4 bg-[#FFF8F1] border border-[#EA671B]/20 rounded-3xl text-xs text-slate-700 space-y-1">
            <span className="font-bold flex items-center space-x-1.5 text-[#751A1A]">
              <Sparkles className="w-4 h-4 text-[#EA671B]" />
              <span>Campus Policy:</span>
            </span>
            <p className="text-[11px] leading-relaxed text-slate-600">
              Students do not require accounts to access the live display. They monitor their assigned ticket on the Campus TV / PWA while waiting in the lobby.
            </p>
          </div>
        </div>
      </main>

      {/* ============================================================== */}
      {/* PRINTABLE SLIP TEMPLATE (Targeted by @media print) */}
      {/* Exact replication of St. Anthony's College Form Code: FO 07, Rev 1 */}
      {/* ============================================================== */}
      {printedSlipData && (
        <div id="printable-slip" className="hidden print:block font-sans text-black">
          <div className="border border-black p-4 text-center">
            {/* Header */}
            <div className="text-center pb-2 border-b border-black">
              <h2 className="text-sm font-bold uppercase tracking-tight">ST. ANTHONY&apos;S COLLEGE</h2>
              <p className="text-[10px]">San Jose de Buenavista, Antique</p>
              <h3 className="text-xs font-black uppercase mt-1">PAYMENT SLIP</h3>
              <p className="text-[9px] font-mono">FORM CODE: FO 07, REV 1</p>
            </div>

            {/* BIG QUEUE NUMBER */}
            <div className="my-3 py-2 border-y-2 border-black">
              <span className="text-[10px] uppercase font-bold block">QUEUE NUMBER</span>
              <span className="text-4xl font-black font-mono tracking-tight block">
                {printedSlipData.ticketNumber}
              </span>
              <span className="text-[9px] font-mono">
                Verify Code: {printedSlipData.lookupCode}
              </span>
            </div>

            {/* Details */}
            <div className="text-left text-[11px] space-y-1 my-2">
              <div>
                <strong>Date:</strong> {printedSlipData.date}
              </div>
              <div>
                <strong>Student No:</strong> {printedSlipData.studentNo}
              </div>
              <div>
                <strong>Name:</strong> {printedSlipData.studentName}
              </div>
              <div>
                <strong>Year/Course:</strong> {printedSlipData.yearCourse}
              </div>
            </div>

            {/* Purpose */}
            <div className="text-left text-[10px] border-t border-black pt-2 space-y-0.5">
              <p className="font-bold">Transaction / Fee:</p>
              <p className="font-mono text-xs font-bold pl-2">&bull; {printedSlipData.categoryText}</p>
              <p className="text-right font-black text-sm pt-1">
                Amount: ₱{printedSlipData.amount || '0.00'}
              </p>
            </div>

            {/* Footer */}
            <div className="border-t border-black pt-2 mt-2 text-[9px] text-center">
              <p className="font-bold">Please watch the Campus TV Display.</p>
              <p>Proceed to Window 1 or 2 when called.</p>
              <p className="mt-1 font-mono text-[8px]">SAC QueueFlow System</p>
            </div>
          </div>
        </div>
      )}

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
