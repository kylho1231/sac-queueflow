'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { QueueProvider, useCashierQueue, WindowNumber } from '@/context/CashierQueueContext';
import { SACLogo } from '@/components/SACLogo';
import { ToastContainer } from '@/components/ToastContainer';
import { CallNotificationAlert } from '@/components/CallNotificationAlert';
import { CashierAnalytics } from '@/components/CashierAnalytics';
import { playFullAudioCall } from '@/lib/notifications';
import { isSeniorCitizenTicket, getTodayDateString, getTicketDateString } from '@/lib/utils';
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
  Radio,
  HeartHandshake,
  BarChart3,
  ArrowRight
} from 'lucide-react';

function CashierTerminalContent() {
  const {
    cashierUser,
    sendOtp,
    verifyOtp,
    logoutCashier,
    lastGeneratedOtp,
    callNextTicket,
    callSeniorCitizenTicket,
    recallTicket,
    startServing,
    completeServing,
    completeAndCallNext,
    skipTicket,
    skipAndCallNext,
    markNoShow,
    markNoShowAndCallNext,
    printNewTicket,
    tickets,
    nowServingTicket,
    latestCallNotification,
    dismissCallNotification,
  } = useCashierQueue();

  // Login form state
  const [emailInput, setEmailInput] = useState<string>('cashier1@sac.edu.ph');
  const [windowChoice, setWindowChoice] = useState<WindowNumber>(1);
  const [otpInput, setOtpInput] = useState<string>('');
  const [otpSent, setOtpSent] = useState<boolean>(false);
  const [otpMessage, setOtpMessage] = useState<string>('');
  const [isSendingOtp, setIsSendingOtp] = useState<boolean>(false);
  const [isVerifying, setIsVerifying] = useState<boolean>(false);

  // Service timer calculation
  const [servingDuration, setServingDuration] = useState<string>('00:00');

  // Currently serving ticket for this cashier's window (always picks the newest active ticket)
  const activeCounterNum = (cashierUser?.counterNumber || 1) as WindowNumber;
  const currentTicket = nowServingTicket(activeCounterNum);

  const waitingTickets = tickets
    .filter(t => t.status === 'WAITING')
    .sort((a, b) => new Date(a.issuedAt).getTime() - new Date(b.issuedAt).getTime());

  const waitingSeniorsCount = waitingTickets.filter(t => isSeniorCitizenTicket(t)).length;

  // Tab view: 'terminal' (Calling station) or 'analytics' (Transaction statistics)
  const [activeTab, setActiveTab] = useState<'terminal' | 'analytics'>('terminal');

  // Daily transaction metrics (evaluated safely post-hydration to allow Next.js prerendering)
  const [todayStr, setTodayStr] = useState<string>('');
  useEffect(() => {
    setTodayStr(getTodayDateString());
  }, []);

  const completedTodayTickets = todayStr
    ? tickets.filter(t => t.status === 'COMPLETED' && getTicketDateString(t.issuedAt) === todayStr)
    : [];
  const completedTodayCount = completedTodayTickets.length;
  const regularCompletedToday = completedTodayTickets.filter(t => !isSeniorCitizenTicket(t)).length;
  const seniorCompletedToday = completedTodayTickets.filter(t => isSeniorCitizenTicket(t)).length;

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
      windowNumber: windowNum as WindowNumber,
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

  // Call Next Ticket Handler (General Regular Student Queue)
  const handleCallNext = () => {
    const called = callNextTicket(activeCounterNum, 'REGULAR');
    if (called) {
      announceTicket(called.ticketNumber, activeCounterNum);
    }
  };

  // Call Senior Citizen Priority Handler (Dedicated Priority Lane)
  const handleCallSeniorCitizen = () => {
    const called = callSeniorCitizenTicket(activeCounterNum);
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

  // Complete and Immediately Call Next Student Handler
  const handleCompleteAndCallNext = () => {
    if (currentTicket) {
      const pref = isSeniorCitizenTicket(currentTicket) && waitingSeniorsCount > 0 ? 'SENIOR_CITIZEN' : 'REGULAR';
      const nextTkt = completeAndCallNext(currentTicket.id, activeCounterNum, pref);
      if (nextTkt) {
        announceTicket(nextTkt.ticketNumber, activeCounterNum);
      }
    } else {
      handleCallNext();
    }
  };

  // Skip and Call Next Student Handler
  const handleSkipAndCallNext = () => {
    if (currentTicket) {
      const nextTkt = skipAndCallNext(currentTicket.id, activeCounterNum);
      if (nextTkt) {
        announceTicket(nextTkt.ticketNumber, activeCounterNum);
      }
    }
  };

  // Mark No-Show and Call Next Student Handler
  const handleNoShowAndCallNext = () => {
    if (currentTicket) {
      const nextTkt = markNoShowAndCallNext(currentTicket.id, activeCounterNum);
      if (nextTkt) {
        announceTicket(nextTkt.ticketNumber, activeCounterNum);
      }
    }
  };

  // Quick Issue Next Regular Ticket (C-xxx)
  const handleQuickAddTicket = () => {
    printNewTicket('srv-exam-period-payment', 'Student Guest', '', '', '', '', false);
  };

  // Quick Issue Next Senior Citizen Ticket (S-xxx Priority Lane)
  const handleQuickAddSeniorTicket = () => {
    printNewTicket('srv-exam-period-payment', '', '', '', '', '', true);
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
            <span className="text-[10px] font-extrabold text-[#B44606] bg-white px-2.5 py-0.5 rounded-full uppercase tracking-widest inline-block mb-1">
              ST. ANTHONY&apos;S COLLEGE &bull; SAN JOSE, ANTIQUE
            </span>
            <h1 className="text-2xl font-black tracking-tight mt-1 text-white">
              Cashier Terminal Login
            </h1>
            <p className="text-xs text-amber-100/90 mt-1 font-medium">
              Windows 1 to 5 Authorized Desk &bull; Gmail OTP Authentication
            </p>
          </div>

          <div className="p-6 sm:p-8 space-y-6 bg-white">
            {/* Quick Switch for Cashier Windows 1 to 5 */}
            <div>
              <label className="block text-xs font-bold text-[#751A1A] uppercase tracking-wider mb-2">
                Select Official Cashier Window:
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {([1, 2, 3, 4, 5] as const).map((win) => (
                  <button
                    key={win}
                    type="button"
                    onClick={() => {
                      setWindowChoice(win);
                      setEmailInput(`cashier${win}@sac.edu.ph`);
                    }}
                    className={`p-2.5 rounded-2xl text-xs font-bold border-2 transition-all cursor-pointer flex flex-col items-center justify-center ${
                      windowChoice === win
                        ? 'bg-[#FFF8F1] border-[#EA671B] text-[#751A1A] shadow-xs ring-2 ring-[#EA671B]/20'
                        : 'border-slate-200 text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    <span className="text-sm font-black">WINDOW {win}</span>
                    <span className="text-[9px] text-slate-500 font-normal truncate max-w-full">cashier{win}@sac.edu.ph</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Email Address Input */}
            <div>
              <label htmlFor="cashier-email-input" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Cashier Gmail / Official Email:
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" aria-hidden="true" />
                <input
                  id="cashier-email-input"
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
                className="w-full min-h-[44px] bg-[#751A1A] hover:bg-[#5A1212] text-white font-black py-3 px-4 rounded-xl text-sm transition-all shadow-md flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50"
              >
                {isSendingOtp ? (
                  <RefreshCw className="w-4 h-4 animate-spin" aria-hidden="true" />
                ) : (
                  <Send className="w-4 h-4" aria-hidden="true" />
                )}
                <span>Send One-Time Passcode (OTP)</span>
              </button>
            ) : (
              /* OTP Code Input Box */
              <div className="space-y-4 pt-2 border-t border-slate-100">
                <div className="p-3 bg-[#FFF8F1] border border-[#EA671B]/30 rounded-2xl text-xs text-[#751A1A] flex items-start space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-[#EA671B] mt-0.5 shrink-0" aria-hidden="true" />
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
                  <label htmlFor="cashier-otp-input" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Enter 6-Digit Gmail OTP:
                  </label>
                  <div className="relative">
                    <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" aria-hidden="true" />
                    <input
                      id="cashier-otp-input"
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
                  className="w-full min-h-[44px] bg-[#EA671B] hover:bg-[#D95B11] text-white font-black py-3 px-4 rounded-xl text-sm transition-all shadow-md flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50"
                >
                  {isVerifying ? (
                    <RefreshCw className="w-4 h-4 animate-spin" aria-hidden="true" />
                  ) : (
                    <UserCheck className="w-4 h-4" aria-hidden="true" />
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

        {/* View Switcher Tabs: Calling Desk vs Transaction Analytics */}
        <div className="flex items-center bg-[#FFF8F1] p-1 rounded-2xl border border-[#EA671B]/30 self-stretch sm:self-auto justify-center">
          <button
            type="button"
            onClick={() => setActiveTab('terminal')}
            className={`min-h-[40px] px-3.5 sm:px-4 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer ${
              activeTab === 'terminal'
                ? 'bg-[#751A1A] text-white shadow-xs'
                : 'text-slate-700 hover:text-[#751A1A]'
            }`}
          >
            <Radio className="w-3.5 h-3.5 text-amber-200" />
            <span>Calling Desk</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('analytics')}
            className={`min-h-[40px] px-3.5 sm:px-4 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 cursor-pointer ${
              activeTab === 'analytics'
                ? 'bg-[#751A1A] text-white shadow-xs'
                : 'text-slate-700 hover:text-[#751A1A]'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5 text-amber-200" />
            <span>Analytics</span>
            <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-black ${
              activeTab === 'analytics'
                ? 'bg-[#EA671B] text-white'
                : 'bg-[#751A1A] text-white'
            }`}>
              {completedTodayCount}
            </span>
          </button>
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
              <span className="hidden xs:inline">Campus TV</span>
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

      {activeTab === 'analytics' ? (
        <main className="flex-1 bg-white">
          <CashierAnalytics onBackToTerminal={() => setActiveTab('terminal')} />
        </main>
      ) : (
        <>
          {/* Live Windows Status Strip (What number is in now across Windows 1 to 5) */}
          <div className="bg-[#FFF8F1] border-b border-[#EA671B]/25 px-3.5 sm:px-8 py-2.5 flex flex-col sm:flex-row items-start sm:items-center justify-between text-xs gap-2">
            <div className="flex items-center space-x-2">
              <Radio className="w-3.5 h-3.5 text-[#EA671B] animate-pulse" aria-hidden="true" />
              <span className="font-extrabold text-[#751A1A] uppercase tracking-wider">
                Live Calling Status (What Number is In Now):
              </span>
            </div>
            <div className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-5 gap-1.5 sm:gap-2 w-full sm:w-auto font-mono font-bold">
              {([1, 2, 3, 4, 5] as const).map((win) => {
                const serv = nowServingTicket(win);
                return (
                  <span 
                    key={win} 
                    className={`px-2.5 py-1 rounded-xl border-2 flex items-center justify-between space-x-1.5 shadow-2xs transition-all ${
                      serv 
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-950 ring-1 ring-emerald-500/20' 
                        : 'bg-rose-50 border-rose-500 text-rose-950'
                    }`}
                  >
                    <span className="flex items-center space-x-1">
                      <span className={`text-[10px] font-extrabold uppercase ${serv ? 'text-emerald-900' : 'text-rose-900'}`}>
                        {`W-${win}:`}
                      </span>
                      <strong className={`text-xs ${serv ? 'text-emerald-950 font-black' : 'text-rose-800'}`}>
                        {serv ? serv.ticketNumber : 'STANDBY'}
                      </strong>
                    </span>
                    <span className={`text-[8px] font-black px-1.5 py-0.2 rounded uppercase ${
                      serv ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'
                    }`}>
                      {serv ? 'Online' : 'Offline'}
                    </span>
                  </span>
                );
              })}
            </div>
          </div>

          {/* Real-time Throughput Strip on Calling Desk */}
          <div className="max-w-6xl w-full mx-auto px-3 sm:px-6 lg:px-8 pt-4 sm:pt-6">
            <div className="bg-[#FFF8F1] border-2 border-[#EA671B]/30 rounded-2xl sm:rounded-3xl p-3.5 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
              <div className="flex items-center space-x-3 min-w-0">
                <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-[#751A1A] text-white flex items-center justify-center shrink-0 shadow-2xs">
                  <BarChart3 className="w-5 h-5 text-amber-200" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center space-x-2 flex-wrap gap-1">
                    <span className="text-[10px] font-black uppercase tracking-wider text-[#B44606]">
                      TODAY&apos;S CASHIER TRANSACTIONS
                    </span>
                    <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.2 rounded-full border border-emerald-200">
                      Resets Daily #1
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-800 font-bold mt-0.5">
                    <strong className="text-[#751A1A] font-black text-base sm:text-lg">{completedTodayCount}</strong> students transacted today
                    <span className="text-xs font-normal text-slate-600 ml-1.5">
                      ({regularCompletedToday} Regular &bull; {seniorCompletedToday} Senior Citizen)
                    </span>
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setActiveTab('analytics')}
                className="min-h-[44px] bg-white hover:bg-[#FFF8F1] text-[#751A1A] hover:text-[#5A1212] border-2 border-[#EA671B]/40 hover:border-[#EA671B] text-xs font-bold px-4 py-2 rounded-xl transition-all flex items-center space-x-2 cursor-pointer shadow-2xs shrink-0 self-stretch sm:self-auto justify-center"
              >
                <span>View Full Analytics Dashboard</span>
                <ArrowRight className="w-3.5 h-3.5 text-[#EA671B]" />
              </button>
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
              <div className="flex items-center justify-center space-x-2 mb-1">
                <span className="text-xs uppercase tracking-widest text-[#B44606] font-black block">
                  CURRENT TICKET ASSIGNED
                </span>
                {currentTicket && isSeniorCitizenTicket(currentTicket) && (
                  <span className="bg-[#EA671B] text-white text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider shadow-2xs inline-flex items-center space-x-1">
                    <HeartHandshake className="w-3 h-3 text-white shrink-0" aria-hidden="true" />
                    <span>Senior Citizen</span>
                  </span>
                )}
              </div>
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
                <p className="text-xs text-slate-500 mt-2 font-medium">
                  No ticket currently called. Tap &quot;Call Next Student&quot; or &quot;Call Senior Citizen&quot; to summon.
                </p>
              )}
            </div>

            {/* Primary Action Call Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3">
              {/* Call Next Button (Always Active - Auto-generates next number if queue is empty) */}
              <button
                type="button"
                onClick={handleCallNext}
                className="w-full min-h-[58px] bg-[#751A1A] hover:bg-[#5A1212] text-white font-black py-3 px-3.5 rounded-2xl shadow-md hover:shadow-lg transition-all flex flex-col items-center justify-center cursor-pointer text-xs sm:text-sm border border-[#EA671B]/30"
                title="Call next student in queue (auto-prioritizes senior citizens if waiting)"
              >
                <div className="flex items-center space-x-1.5">
                  <PhoneCall className="w-4 h-4 text-[#EA671B]" />
                  <span>Call Next</span>
                </div>
                <span className="text-[10px] font-normal text-amber-200/90 mt-0.5 text-center leading-tight">
                  {waitingTickets.length > 0 
                    ? `(${waitingTickets.length} waiting)` 
                    : '(Auto-issues C)'}
                </span>
              </button>

              {/* Call Senior Citizen Button (Priority Lane) */}
              <button
                type="button"
                onClick={handleCallSeniorCitizen}
                className="w-full min-h-[58px] bg-gradient-to-br from-[#EA671B] to-[#D95B11] hover:from-[#D95B11] hover:to-[#B84705] text-white font-black py-3 px-3.5 rounded-2xl shadow-md hover:shadow-lg transition-all flex flex-col items-center justify-center cursor-pointer text-xs sm:text-sm border border-amber-300"
                title="Call next Senior Citizen ticket (S-xxx) from Priority Lane"
              >
                <div className="flex items-center space-x-1.5">
                  <HeartHandshake className="w-4 h-4 text-amber-100" />
                  <span>Call Senior (Priority)</span>
                </div>
                <span className="text-[10px] font-normal text-amber-100 mt-0.5 text-center leading-tight">
                  {waitingSeniorsCount > 0 
                    ? `(${waitingSeniorsCount} waiting • Priority)` 
                    : '(Auto-issues S)'}
                </span>
              </button>

              {/* Recall Audio Voice */}
              <button
                type="button"
                onClick={handleRecall}
                disabled={!currentTicket}
                className="w-full min-h-[58px] bg-white hover:bg-[#FFF8F1] text-[#751A1A] font-bold py-3 px-3.5 rounded-2xl shadow-xs hover:shadow-md transition-all flex flex-col items-center justify-center cursor-pointer disabled:opacity-40 text-xs sm:text-sm border-2 border-[#EA671B]/30 hover:border-[#EA671B]"
                title="Repeat voice chime and audio callout"
              >
                <div className="flex items-center space-x-1.5">
                  <Volume2 className="w-4 h-4 text-[#EA671B]" />
                  <span>Recall Audio</span>
                </div>
                <span className="text-[10px] font-normal text-slate-500 mt-0.5 text-center leading-tight">
                  {currentTicket ? `Replay ${currentTicket.ticketNumber}` : 'Window Idle'}
                </span>
              </button>
            </div>

            {/* Serving Lifecycle Actions */}
            {currentTicket && (
              <div className="mt-5 pt-4 border-t border-slate-100 space-y-3">
                {/* 1-Click Complete & Call Next (Primary recommended cashier action) */}
                <button
                  type="button"
                  onClick={handleCompleteAndCallNext}
                  className="w-full min-h-[50px] bg-emerald-600 hover:bg-emerald-700 text-white font-black py-3 px-4 rounded-2xl shadow-md hover:shadow-lg transition-all flex items-center justify-center space-x-2 cursor-pointer text-sm sm:text-base"
                  title="Finish current transaction and immediately call the next number"
                >
                  <CheckCircle2 className="w-5 h-5 text-emerald-200" />
                  <span>Complete &amp; Call Next Student</span>
                </button>

                {/* Secondary status actions */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <button
                    type="button"
                    onClick={() => startServing(currentTicket.id)}
                    disabled={currentTicket.status === 'SERVING'}
                    className="min-h-[44px] p-2 rounded-xl text-xs font-bold bg-[#FFF8F1] text-[#751A1A] border border-[#EA671B]/30 hover:bg-white transition-colors flex items-center justify-center space-x-1 cursor-pointer disabled:opacity-50"
                  >
                    <Play className="w-3.5 h-3.5 text-[#EA671B]" aria-hidden="true" />
                    <span>Start Serving</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => completeServing(currentTicket.id)}
                    className="min-h-[44px] p-2 rounded-xl text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200 hover:bg-slate-200 transition-colors flex items-center justify-center space-x-1 cursor-pointer"
                    title="Complete payment and leave window available"
                  >
                    <Check className="w-3.5 h-3.5 text-slate-500" aria-hidden="true" />
                    <span>Finish (Standby)</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleSkipAndCallNext}
                    className="min-h-[44px] p-2 rounded-xl text-xs font-semibold bg-amber-50 text-amber-900 border border-amber-200 hover:bg-amber-100 transition-colors flex items-center justify-center space-x-1 cursor-pointer"
                    title="Skip student and immediately call next"
                  >
                    <span>Skip &amp; Next</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleNoShowAndCallNext}
                    className="min-h-[44px] p-2 rounded-xl text-xs font-semibold bg-red-50 text-red-800 border border-red-200 hover:bg-red-100 transition-colors flex items-center justify-center space-x-1 cursor-pointer"
                    title="Mark absent and immediately call next"
                  >
                    <UserX className="w-3.5 h-3.5 text-red-600" aria-hidden="true" />
                    <span>No-Show &amp; Next</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* WAITING QUEUE ROSTER & QUICK ISSUANCE (5 Cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white rounded-3xl p-5 sm:p-6 shadow-sm border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 gap-2">
              <div className="flex items-center space-x-2">
                <Users className="w-4 h-4 text-[#EA671B]" aria-hidden="true" />
                <h3 className="text-sm font-black text-[#751A1A] uppercase tracking-wider">
                  Waiting Queue ({waitingTickets.length})
                </h3>
              </div>

              {/* Quick sequence number dispenser */}
              <div className="flex items-center space-x-1.5 flex-wrap gap-1">
                <button
                  type="button"
                  onClick={handleQuickAddTicket}
                  className="min-h-[44px] bg-[#FFF8F1] hover:bg-white text-[#751A1A] border border-[#EA671B]/30 hover:border-[#EA671B] text-[11px] sm:text-xs font-bold px-2.5 py-1.5 rounded-xl transition-all flex items-center space-x-1 cursor-pointer shadow-2xs"
                  title="Add next regular ticket (C-xxx) to queue"
                >
                  <PlusCircle className="w-3.5 h-3.5 text-[#EA671B]" aria-hidden="true" />
                  <span>+ Regular (C)</span>
                </button>

                <button
                  type="button"
                  onClick={handleQuickAddSeniorTicket}
                  className="min-h-[44px] bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 text-[11px] sm:text-xs font-bold px-2.5 py-1.5 rounded-xl transition-all flex items-center space-x-1 cursor-pointer shadow-2xs"
                  title="Add next Senior Citizen ticket (S-xxx) to priority queue"
                >
                  <HeartHandshake className="w-3.5 h-3.5 text-amber-700" aria-hidden="true" />
                  <span>+ Senior (S)</span>
                </button>
              </div>
            </div>

            <p className="text-[11px] text-slate-500 mt-2">
              Tickets waiting to be called. Priority lane senior citizens (S-xxx) are summoned first.
            </p>

            <div className="mt-3 divide-y divide-slate-100 max-h-96 overflow-y-auto">
              {waitingTickets.length === 0 ? (
                <div className="py-12 text-center text-xs text-slate-400">
                  <p>Queue is currently clear.</p>
                  <div className="flex items-center justify-center space-x-3 mt-3">
                    <button
                      type="button"
                      onClick={handleQuickAddTicket}
                      className="text-[#B44606] hover:text-[#751A1A] font-bold text-xs underline cursor-pointer"
                    >
                      + Regular Ticket (C)
                    </button>
                    <button
                      type="button"
                      onClick={handleQuickAddSeniorTicket}
                      className="text-amber-800 hover:text-amber-950 font-bold text-xs underline cursor-pointer"
                    >
                      + Senior Citizen (S)
                    </button>
                  </div>
                </div>
              ) : (
                waitingTickets.map((t, idx) => {
                  const isSenior = isSeniorCitizenTicket(t);
                  return (
                    <div 
                      key={t.id} 
                      className={`py-3 flex items-center justify-between gap-2 ${
                        isSenior ? 'bg-amber-50/70 px-2.5 rounded-xl border border-amber-300/70 my-1' : ''
                      }`}
                    >
                      <div className="flex items-center space-x-3 min-w-0">
                        <span className={`w-6 h-6 rounded-lg font-black text-xs flex items-center justify-center font-mono border shrink-0 ${
                          isSenior 
                            ? 'bg-[#EA671B] text-white border-[#EA671B]' 
                            : 'bg-[#FFF8F1] text-[#751A1A] border-[#EA671B]/25'
                        }`}>
                          {idx + 1}
                        </span>
                        <div className="min-w-0">
                          <div className="flex items-center space-x-1.5">
                            <span className="text-base font-black font-mono text-[#751A1A] block leading-none">
                              {t.ticketNumber}
                            </span>
                            {isSenior && (
                              <span className="text-[9px] font-black bg-[#EA671B] text-white px-1.5 py-0.5 rounded-full uppercase inline-flex items-center space-x-0.5">
                                <HeartHandshake className="w-2.5 h-2.5 text-white shrink-0" aria-hidden="true" />
                                <span>Priority</span>
                              </span>
                            )}
                          </div>
                          <span className="text-xs text-slate-500 truncate block mt-0.5">
                            {t.studentName}
                          </span>
                        </div>
                      </div>

                      <span className={`text-[11px] font-mono shrink-0 ${
                        isSenior ? 'text-amber-800 font-bold' : 'text-slate-400'
                      }`}>
                        {isSenior ? 'Priority Lane' : 'Waiting in lobby'}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </main>
      </>
      )}

      <ToastContainer />
    </div>
  );
}

export default function CashierPage() {
  return (
    <React.Suspense fallback={<div className="min-h-screen bg-white" />}>
      <QueueProvider>
        <CashierTerminalContent />
      </QueueProvider>
    </React.Suspense>
  );
}
