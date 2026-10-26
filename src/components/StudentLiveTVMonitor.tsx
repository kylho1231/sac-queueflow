'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useCashierQueue, ActiveCallNotification } from '@/context/CashierQueueContext';
import { SACLogo } from '@/components/SACLogo';
import { CallNotificationAlert } from '@/components/CallNotificationAlert';
import {
  playFullAudioCall,
  playQueueChime,
  checkNotificationPermission,
  requestNotificationPermission,
  sendBrowserNotification,
} from '@/lib/notifications';
import { 
  Volume2, 
  VolumeX, 
  Maximize2, 
  Minimize2, 
  Receipt, 
  Sparkles,
  Layers,
  Bell,
  BellRing,
  History,
  Clock,
  Radio,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

export default function StudentLiveTVMonitor() {
  const { 
    tickets, 
    nowServingTicket, 
    upNextTickets, 
    recentlyCalledTickets,
    latestCallNotification,
    dismissCallNotification
  } = useCashierQueue();

  const [currentTime, setCurrentTime] = useState<string>('');
  const [nowMs, setNowMs] = useState<number | null>(null);
  const [audioEnabled, setAudioEnabled] = useState<boolean>(true);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [notificationPerm, setNotificationPerm] = useState<NotificationPermission | 'unsupported'>('default');
  const [activeRosterTab, setActiveRosterTab] = useState<'waiting' | 'recent'>('waiting');
  const [showAudioConsentBanner, setShowAudioConsentBanner] = useState<boolean>(false);

  const lastHandledCallIdRef = useRef<string | null>(null);

  // Clock ticker & live timer update
  useEffect(() => {
    const update = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      );
      setNowMs(now.getTime());
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, []);

  // Check notification permission on mount
  useEffect(() => {
    setNotificationPerm(checkNotificationPermission());
  }, []);

  // Fullscreen toggle
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  // Replay audio helper
  const handleReplayAudio = (notif: ActiveCallNotification) => {
    playFullAudioCall({
      ticketNumber: notif.ticketNumber,
      windowNumber: notif.windowNumber,
      studentName: notif.studentName,
      isRecall: notif.isRecall,
    });
  };

  // Enable Notification button handler
  const handleEnableNotifications = async () => {
    const perm = await requestNotificationPermission();
    setNotificationPerm(perm);
    if (audioEnabled) {
      playQueueChime();
    }
  };

  // Handle new incoming call notifications (Audio Chime + TTS Voice + Browser Push Notification)
  useEffect(() => {
    if (!latestCallNotification) return;
    if (lastHandledCallIdRef.current === latestCallNotification.id) return;

    lastHandledCallIdRef.current = latestCallNotification.id;

    // 1. Play Full Audio (Chime + Voice) if audio is on
    if (audioEnabled) {
      playFullAudioCall({
        ticketNumber: latestCallNotification.ticketNumber,
        windowNumber: latestCallNotification.windowNumber,
        studentName: latestCallNotification.studentName,
        isRecall: latestCallNotification.isRecall,
      }).catch(() => {
        // If autoplay blocked by browser policy, show consent banner
        setShowAudioConsentBanner(true);
      });
    }

    // 2. Dispatch Desktop / Mobile Push Notification
    sendBrowserNotification({
      ticketNumber: latestCallNotification.ticketNumber,
      windowNumber: latestCallNotification.windowNumber,
      studentName: latestCallNotification.studentName,
      isRecall: latestCallNotification.isRecall,
    });
  }, [latestCallNotification, audioEnabled]);

  // Active window serving tickets: perfectly synchronized with latestCallNotification for zero-latency UI matching
  const rawServingC1 = nowServingTicket(1);
  const rawServingC2 = nowServingTicket(2);

  const servingC1 = (latestCallNotification?.windowNumber === 1 && latestCallNotification.ticketNumber)
    ? (rawServingC1?.ticketNumber === latestCallNotification.ticketNumber ? rawServingC1 : {
        ...rawServingC1,
        id: latestCallNotification.id,
        ticketNumber: latestCallNotification.ticketNumber,
        studentName: latestCallNotification.studentName || `Ticket ${latestCallNotification.ticketNumber}`,
        calledAt: latestCallNotification.calledAt,
        status: 'CALLED' as const,
        assignedCounterNumber: 1,
      })
    : rawServingC1;

  const servingC2 = (latestCallNotification?.windowNumber === 2 && latestCallNotification.ticketNumber)
    ? (rawServingC2?.ticketNumber === latestCallNotification.ticketNumber ? rawServingC2 : {
        ...rawServingC2,
        id: latestCallNotification.id,
        ticketNumber: latestCallNotification.ticketNumber,
        studentName: latestCallNotification.studentName || `Ticket ${latestCallNotification.ticketNumber}`,
        calledAt: latestCallNotification.calledAt,
        status: 'CALLED' as const,
        assignedCounterNumber: 2,
      })
    : rawServingC2;

  // Time format helper for recent tickets (SSR / prerender-safe)
  const formatTimeAgo = (isoString?: string) => {
    if (!isoString) return '';
    if (!nowMs) return 'Recent';
    try {
      const diffSec = Math.floor((nowMs - new Date(isoString).getTime()) / 1000);
      if (diffSec < 60) return 'Just now';
      const mins = Math.floor(diffSec / 60);
      if (mins < 60) return `${mins}m ago`;
      const hrs = Math.floor(mins / 60);
      return `${hrs}h ago`;
    } catch {
      return '';
    }
  };

  return (
    <div className="min-h-screen bg-white text-slate-900 flex flex-col justify-between p-3 sm:p-5 lg:p-7 font-sans overflow-x-hidden w-full max-w-full selection:bg-[#EA671B] selection:text-white relative">
      {/* ACTIVE CALL FLOATING NOTIFICATION POPUP */}
      <CallNotificationAlert
        notification={latestCallNotification}
        onDismiss={dismissCallNotification}
        onReplayAudio={handleReplayAudio}
      />

      {/* AUTOPLAY AUDIO CONSENT BANNER (IF BROWSER RESTRICTED INITIAL AUDIO) */}
      {showAudioConsentBanner && (
        <div className="bg-[#FFF8F1] border-2 border-[#EA671B] rounded-2xl p-3 px-4 mb-3 flex items-center justify-between text-xs sm:text-sm text-[#751A1A] shadow-md animate-in fade-in">
          <div className="flex items-center space-x-2 font-bold">
            <Volume2 className="w-4 h-4 text-[#EA671B] animate-pulse" />
            <span>Click here to unlock live voice announcements &amp; audio chimes for this screen:</span>
          </div>
          <button
            onClick={() => {
              playQueueChime();
              setShowAudioConsentBanner(false);
              setAudioEnabled(true);
            }}
            className="bg-[#EA671B] hover:bg-[#D95B11] text-white font-black px-3.5 py-1.5 rounded-xl cursor-pointer text-xs shadow-xs"
          >
            Enable Audio Now
          </button>
        </div>
      )}

      {/* TOP HEADER: ST. ANTHONY'S COLLEGE BRANDING & CONTROLS */}
      <header className="bg-white rounded-2xl sm:rounded-3xl p-3.5 sm:p-5 border border-slate-200/90 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-3 sm:gap-4">
        {/* College Seal & Headings */}
        <div className="flex items-center space-x-3 sm:space-x-4 min-w-0 w-full md:w-auto">
          <SACLogo className="w-12 h-12 xs:w-14 xs:h-14 sm:w-16 sm:h-16 md:w-20 md:h-20 drop-shadow-sm shrink-0" />
          <div className="min-w-0 flex-1">
            <span className="text-[10px] sm:text-xs md:text-sm font-extrabold text-[#EA671B] uppercase tracking-wider sm:tracking-widest block truncate">
              ST. ANTHONY&apos;S COLLEGE &bull; SAN JOSE, ANTIQUE
            </span>
            <h1 className="text-xl xs:text-2xl sm:text-3xl lg:text-4xl font-black text-[#751A1A] tracking-tight leading-tight mt-0.5 truncate">
              CASHIER&apos;S OFFICE &bull; LIVE QUEUE MONITOR
            </h1>
            <p className="text-[11px] sm:text-xs text-slate-600 font-medium leading-tight sm:leading-normal mt-0.5">
              Live Notifications &bull; Campus TV &amp; PWA Display &bull; Real-time Callouts
            </p>
          </div>
        </div>

        {/* TIME & ACCESSIBILITY CONTROLS */}
        <div className="w-full md:w-auto flex items-center justify-between md:justify-end space-x-2 sm:space-x-3 bg-[#FFF8F1] p-2 sm:p-2.5 rounded-2xl border border-[#EA671B]/25 shadow-xs shrink-0 flex-wrap gap-2">
          {/* Clock */}
          <div className="text-left sm:text-right px-2 sm:px-3 border-r border-[#EA671B]/20 flex-1 sm:flex-initial">
            <span className="text-[9px] sm:text-[10px] text-slate-500 uppercase tracking-wider block font-medium leading-none">Standard Time</span>
            <span className="text-base sm:text-xl md:text-2xl font-mono font-black text-[#751A1A] leading-tight block mt-0.5">{currentTime || '8:00:00 AM'}</span>
          </div>

          <div className="flex items-center space-x-1.5 sm:space-x-2 shrink-0">
            {/* Browser Push Notification Permission Button */}
            {notificationPerm !== 'granted' ? (
              <button
                type="button"
                onClick={handleEnableNotifications}
                className="bg-white hover:bg-slate-50 text-[#751A1A] border border-[#EA671B]/40 hover:border-[#EA671B] text-[11px] sm:text-xs font-bold px-2.5 sm:px-3 py-1.5 rounded-xl transition-all cursor-pointer shadow-2xs flex items-center space-x-1.5"
                title="Get alerted when your number is in now"
              >
                <BellRing className="w-3.5 h-3.5 text-[#EA671B] animate-bounce" />
                <span className="hidden xs:inline">Enable Alerts</span>
              </button>
            ) : (
              <div 
                className="bg-emerald-50 text-emerald-800 border border-emerald-300 text-[10px] sm:text-[11px] font-bold px-2.5 py-1 rounded-xl flex items-center space-x-1"
                title="Browser Notifications Active: You will be alerted when a ticket is called."
              >
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span className="hidden xs:inline">Alerts On</span>
              </div>
            )}

            {/* Audio Voice Announcements Toggle */}
            <button
              onClick={() => {
                const nextState = !audioEnabled;
                setAudioEnabled(nextState);
                if (nextState) {
                  playQueueChime();
                }
              }}
              className={`min-w-[38px] min-h-[38px] sm:min-w-[42px] sm:min-h-[42px] p-2 rounded-xl transition-all cursor-pointer flex items-center justify-center ${
                audioEnabled 
                  ? 'bg-[#EA671B] text-white shadow-xs font-bold' 
                  : 'text-slate-500 hover:text-[#751A1A] hover:bg-white border border-transparent hover:border-slate-200'
              }`}
              title={audioEnabled ? "Voice Announcements On (Click to Mute)" : "Voice Announcements Muted (Click to Unmute)"}
              aria-label="Toggle Voice Announcements"
            >
              {audioEnabled ? <Volume2 className="w-4 h-4 sm:w-5 sm:h-5" /> : <VolumeX className="w-4 h-4 sm:w-5 sm:h-5" />}
            </button>

            {/* Fullscreen Button */}
            <button
              onClick={toggleFullscreen}
              className="min-w-[38px] min-h-[38px] sm:min-w-[42px] sm:min-h-[42px] p-2 text-slate-500 hover:text-[#751A1A] hover:bg-white rounded-xl transition-colors cursor-pointer flex items-center justify-center border border-transparent hover:border-slate-200"
              title="Toggle Fullscreen"
              aria-label="Toggle Fullscreen"
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4 sm:w-5 sm:h-5" /> : <Maximize2 className="w-4 h-4 sm:w-5 sm:h-5" />}
            </button>
          </div>
        </div>
      </header>

      {/* "WHAT NUMBER IS IN NOW" PERSISTENT NOTIFICATION STATUS BAR */}
      <section className="bg-gradient-to-r from-[#FFF8F1] via-white to-[#FFF8F1] border-2 border-[#EA671B]/35 rounded-2xl sm:rounded-3xl p-3 sm:p-4 my-3 sm:my-4 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
        <div className="flex items-center space-x-2.5 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-[#751A1A] text-white flex items-center justify-center shadow-xs shrink-0">
            <Radio className="w-4 h-4 text-[#EA671B] animate-pulse" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-[10px] sm:text-xs font-black uppercase tracking-wider text-[#751A1A]">
                LIVE NOTIFICATION STATUS
              </span>
              <span className="inline-flex items-center space-x-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                <span>WHAT NUMBER IS IN NOW</span>
              </span>
            </div>
            <p className="text-[11px] sm:text-xs text-slate-600 font-medium">
              Real-time numbers actively summoned and being processed by Cashier Officers
            </p>
          </div>
        </div>

        {/* Live Active Number Badges */}
        <div className="flex items-center space-x-2 sm:space-x-3 w-full md:w-auto justify-between md:justify-end flex-wrap gap-2">
          {/* Window 1 Badge */}
          <div className="bg-white border-2 border-[#EA671B]/30 rounded-xl px-3 py-1.5 shadow-2xs flex items-center space-x-2 flex-1 md:flex-initial">
            <span className="text-[10px] font-extrabold text-[#751A1A] uppercase tracking-wider block">W-1:</span>
            <span className="text-base sm:text-lg font-black font-mono text-[#751A1A] leading-none">
              {servingC1 ? servingC1.ticketNumber : 'STANDBY'}
            </span>
            {servingC1 && (
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" title="Window 1 Active" />
            )}
          </div>

          {/* Window 2 Badge */}
          <div className="bg-white border-2 border-[#EA671B]/30 rounded-xl px-3 py-1.5 shadow-2xs flex items-center space-x-2 flex-1 md:flex-initial">
            <span className="text-[10px] font-extrabold text-[#751A1A] uppercase tracking-wider block">W-2:</span>
            <span className="text-base sm:text-lg font-black font-mono text-[#751A1A] leading-none">
              {servingC2 ? servingC2.ticketNumber : 'STANDBY'}
            </span>
            {servingC2 && (
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" title="Window 2 Active" />
            )}
          </div>

          {/* Last Call Pill */}
          {latestCallNotification && (
            <div className="hidden lg:flex items-center space-x-1.5 bg-[#751A1A] text-white px-3 py-1.5 rounded-xl text-xs font-bold shadow-2xs">
              <Bell className="w-3.5 h-3.5 text-[#EA671B]" />
              <span>Latest Call: <strong>{latestCallNotification.ticketNumber}</strong> (W-{latestCallNotification.windowNumber})</span>
            </div>
          )}
        </div>
      </section>

      {/* CENTER SECTION: 2 ACTIVE CASHIER WINDOWS & QUEUE ROSTER */}
      <main className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6 my-2 sm:my-3 flex-1 items-stretch">
        {/* LEFT 8 COLS: CASHIER 1 AND CASHIER 2 CALLING BOARDS */}
        <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          {/* CASHIER WINDOW 1 */}
          <div className="bg-white rounded-2xl sm:rounded-3xl border-3 border-[#EA671B]/40 hover:border-[#EA671B] p-5 sm:p-7 flex flex-col justify-between text-center shadow-lg shadow-amber-950/5 relative overflow-hidden transition-all">
            {/* Top Badge */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 gap-2">
              <div className="flex items-center space-x-2">
                <span className="bg-[#751A1A] text-white font-black text-xs sm:text-sm px-3 sm:px-4 py-1 rounded-full uppercase tracking-wider shadow-xs">
                  WINDOW 1
                </span>
                {servingC1 && (
                  <span className="bg-[#EA671B] text-white font-black text-[10px] px-2 py-0.5 rounded-full uppercase">
                    IN NOW
                  </span>
                )}
              </div>
              <span className="inline-flex items-center space-x-1.5 text-[11px] sm:text-xs text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 font-bold shrink-0">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                <span>ONLINE</span>
              </span>
            </div>

            <div className="my-auto py-5 sm:py-8">
              <span className="text-[11px] sm:text-xs uppercase tracking-widest text-[#EA671B] font-black block mb-1 sm:mb-2">
                NOW SERVING NUMBER
              </span>
              <span className="text-6xl xs:text-7xl sm:text-8xl font-black font-mono text-[#751A1A] tracking-tight block leading-none my-2 sm:my-3">
                {servingC1 ? servingC1.ticketNumber : 'STANDBY'}
              </span>

              <div className="mt-4 p-3 sm:p-3.5 bg-[#FFF8F1] rounded-2xl border border-[#EA671B]/20 max-w-full sm:max-w-xs mx-auto shadow-2xs">
                <span className="text-xs sm:text-sm font-bold text-[#751A1A] block truncate">
                  {servingC1 ? servingC1.studentName : 'Window Ready'}
                </span>
                <span className="text-[11px] sm:text-xs text-[#EA671B] font-mono font-semibold block mt-0.5">
                  {servingC1 
                    ? `Called: ${formatTimeAgo(servingC1.calledAt)}` 
                    : 'Awaiting next queue number call'}
                </span>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] sm:text-xs text-slate-600 font-semibold px-1">
              <div className="flex items-center space-x-1.5">
                <Receipt className="w-4 h-4 text-[#EA671B]" />
                <span>Cashier Officer #1</span>
              </div>
              {servingC1 && (
                <button
                  type="button"
                  onClick={() => handleReplayAudio({
                    id: servingC1.id,
                    ticketNumber: servingC1.ticketNumber,
                    windowNumber: 1,
                    studentName: servingC1.studentName,
                    calledAt: servingC1.calledAt || '',
                  })}
                  className="text-[#751A1A] hover:text-[#EA671B] flex items-center space-x-1 font-bold cursor-pointer"
                  title="Replay Voice Chime for Window 1"
                >
                  <Volume2 className="w-3.5 h-3.5 text-[#EA671B]" />
                  <span>Chime</span>
                </button>
              )}
            </div>
          </div>

          {/* CASHIER WINDOW 2 */}
          <div className="bg-white rounded-2xl sm:rounded-3xl border-3 border-[#EA671B]/40 hover:border-[#EA671B] p-5 sm:p-7 flex flex-col justify-between text-center shadow-lg shadow-amber-950/5 relative overflow-hidden transition-all">
            {/* Top Badge */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 gap-2">
              <div className="flex items-center space-x-2">
                <span className="bg-[#751A1A] text-white font-black text-xs sm:text-sm px-3 sm:px-4 py-1 rounded-full uppercase tracking-wider shadow-xs">
                  WINDOW 2
                </span>
                {servingC2 && (
                  <span className="bg-[#EA671B] text-white font-black text-[10px] px-2 py-0.5 rounded-full uppercase">
                    IN NOW
                  </span>
                )}
              </div>
              <span className="inline-flex items-center space-x-1.5 text-[11px] sm:text-xs text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 font-bold shrink-0">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                <span>ONLINE</span>
              </span>
            </div>

            <div className="my-auto py-5 sm:py-8">
              <span className="text-[11px] sm:text-xs uppercase tracking-widest text-[#EA671B] font-black block mb-1 sm:mb-2">
                NOW SERVING NUMBER
              </span>
              <span className="text-6xl xs:text-7xl sm:text-8xl font-black font-mono text-[#751A1A] tracking-tight block leading-none my-2 sm:my-3">
                {servingC2 ? servingC2.ticketNumber : 'STANDBY'}
              </span>

              <div className="mt-4 p-3 sm:p-3.5 bg-[#FFF8F1] rounded-2xl border border-[#EA671B]/20 max-w-full sm:max-w-xs mx-auto shadow-2xs">
                <span className="text-xs sm:text-sm font-bold text-[#751A1A] block truncate">
                  {servingC2 ? servingC2.studentName : 'Window Ready'}
                </span>
                <span className="text-[11px] sm:text-xs text-[#EA671B] font-mono font-semibold block mt-0.5">
                  {servingC2 
                    ? `Called: ${formatTimeAgo(servingC2.calledAt)}` 
                    : 'Awaiting next queue number call'}
                </span>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] sm:text-xs text-slate-600 font-semibold px-1">
              <div className="flex items-center space-x-1.5">
                <Receipt className="w-4 h-4 text-[#EA671B]" />
                <span>Cashier Officer #2</span>
              </div>
              {servingC2 && (
                <button
                  type="button"
                  onClick={() => handleReplayAudio({
                    id: servingC2.id,
                    ticketNumber: servingC2.ticketNumber,
                    windowNumber: 2,
                    studentName: servingC2.studentName,
                    calledAt: servingC2.calledAt || '',
                  })}
                  className="text-[#751A1A] hover:text-[#EA671B] flex items-center space-x-1 font-bold cursor-pointer"
                  title="Replay Voice Chime for Window 2"
                >
                  <Volume2 className="w-3.5 h-3.5 text-[#EA671B]" />
                  <span>Chime</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT 4 COLS: DUAL-TAB ROSTER (UP NEXT & RECENTLY CALLED NOTIFICATIONS) */}
        <div className="lg:col-span-4 bg-white rounded-2xl sm:rounded-3xl border border-slate-200 p-4 sm:p-6 flex flex-col justify-between shadow-md">
          <div>
            {/* Tab Selector Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 gap-2">
              <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-2xl">
                <button
                  type="button"
                  onClick={() => setActiveRosterTab('waiting')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center space-x-1.5 ${
                    activeRosterTab === 'waiting'
                      ? 'bg-white text-[#751A1A] shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Layers className="w-3.5 h-3.5 text-[#EA671B]" />
                  <span>Up Next ({upNextTickets.length})</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveRosterTab('recent')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center space-x-1.5 ${
                    activeRosterTab === 'recent'
                      ? 'bg-white text-[#751A1A] shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <History className="w-3.5 h-3.5 text-[#EA671B]" />
                  <span>Called Log ({recentlyCalledTickets.length})</span>
                </button>
              </div>

              <span className="text-[11px] font-bold text-[#EA671B] hidden sm:inline">
                Live Feed
              </span>
            </div>

            {/* TAB CONTENT 1: UP NEXT WAITING TICKETS */}
            {activeRosterTab === 'waiting' && (
              <div className="mt-3">
                <p className="text-[11px] text-slate-500 mb-2.5">
                  Tickets lined up in queue. Numbers are summoned sequentially to Windows 1 &amp; 2.
                </p>

                <div className="space-y-2 sm:space-y-2.5 max-h-72 overflow-y-auto pr-1">
                  {upNextTickets.length === 0 ? (
                    <div className="py-8 sm:py-12 text-center text-slate-400 text-xs sm:text-sm">
                      <p>No pending tickets in line.</p>
                      <p className="text-[11px] text-slate-400 mt-1">Cashiers are ready for new students.</p>
                    </div>
                  ) : (
                    upNextTickets.map((tkt, idx) => (
                      <div
                        key={tkt.id}
                        className="p-3 sm:p-3.5 rounded-2xl bg-white border border-slate-200 hover:border-[#EA671B]/60 shadow-2xs flex items-center justify-between gap-2 transition-colors"
                      >
                        <div className="flex items-center space-x-2.5 sm:space-x-3 min-w-0 flex-1">
                          <span className="w-6 h-6 sm:w-7 sm:h-7 rounded-xl bg-[#FFF8F1] text-[#751A1A] font-black text-xs flex items-center justify-center font-mono border border-[#EA671B]/20 shrink-0">
                            {idx + 1}
                          </span>
                          <div className="min-w-0 flex-1">
                            <span className="text-xl sm:text-2xl font-black font-mono text-[#751A1A] tracking-wide block leading-none">
                              {tkt.ticketNumber}
                            </span>
                            <span className="text-[10px] sm:text-[11px] text-slate-600 font-semibold truncate block max-w-full sm:max-w-[130px] mt-0.5">
                              {tkt.studentName}
                            </span>
                          </div>
                        </div>

                        <span className="text-[11px] sm:text-xs font-bold text-[#EA671B] bg-[#FFF8F1] px-2.5 py-1 rounded-lg border border-[#EA671B]/30 shrink-0">
                          Standby
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* TAB CONTENT 2: RECENTLY CALLED NOTIFICATIONS HISTORY */}
            {activeRosterTab === 'recent' && (
              <div className="mt-3">
                <p className="text-[11px] text-slate-500 mb-2.5">
                  Recently called numbers and their assigned cashier windows.
                </p>

                <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                  {recentlyCalledTickets.length === 0 ? (
                    <div className="py-8 sm:py-12 text-center text-slate-400 text-xs sm:text-sm">
                      No tickets called yet today.
                    </div>
                  ) : (
                    recentlyCalledTickets.map((tkt) => {
                      const isNowIn = tkt.status === 'CALLED' || tkt.status === 'SERVING';
                      return (
                        <div
                          key={tkt.id}
                          className={`p-3 rounded-2xl border shadow-2xs flex items-center justify-between gap-2 transition-colors ${
                            isNowIn
                              ? 'bg-[#FFF8F1] border-[#EA671B]/50'
                              : 'bg-white border-slate-200'
                          }`}
                        >
                          <div className="flex items-center space-x-2.5 min-w-0 flex-1">
                            <span className="text-lg sm:text-xl font-black font-mono text-[#751A1A] tracking-tight">
                              {tkt.ticketNumber}
                            </span>
                            <div className="min-w-0">
                              <span className="text-xs font-bold text-slate-800 block truncate">
                                Window {tkt.assignedCounterNumber || 1}
                              </span>
                              <span className="text-[10px] text-slate-500 block">
                                {formatTimeAgo(tkt.calledAt)}
                              </span>
                            </div>
                          </div>

                          <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md shrink-0 ${
                            isNowIn
                              ? 'bg-[#EA671B] text-white animate-pulse'
                              : 'bg-slate-100 text-slate-600'
                          }`}>
                            {isNowIn ? 'IN NOW' : tkt.status}
                          </span>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Institutional Compliance Notice Box */}
          <div className="mt-4 sm:mt-6 p-3.5 sm:p-4 rounded-2xl bg-[#FFF8F1] border border-[#EA671B]/30 text-xs text-slate-700 space-y-1 shadow-2xs">
            <div className="flex items-center space-x-1.5 text-[#751A1A] font-bold">
              <Sparkles className="w-4 h-4 text-[#EA671B] shrink-0" />
              <span>Antonian Notification System:</span>
            </div>
            <p className="text-[11px] leading-relaxed text-slate-600">
              When your assigned number flashes on this screen or chimes over the audio speakers, proceed directly to the called Cashier Window.
            </p>
          </div>
        </div>
      </main>

      {/* BOTTOM TICKER: COLLEGE ANNOUNCEMENTS */}
      <footer className="bg-white rounded-2xl p-3 sm:p-3.5 border border-slate-200/90 shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between text-[11px] sm:text-xs text-slate-600 gap-2">
        <div className="flex items-center space-x-2 min-w-0 max-w-full sm:max-w-3xl">
          <span className="bg-[#EA671B] text-white text-[9px] sm:text-[10px] font-black px-2 py-0.5 rounded-sm uppercase tracking-wider shrink-0">
            NOTICE
          </span>
          <span className="truncate text-slate-800 font-medium">
            Cashier Windows 1 &amp; 2 are actively calling. Listen for audio chimes and watch for your number.
          </span>
        </div>

        <span className="font-semibold text-[#751A1A] shrink-0 font-mono text-[10px] sm:text-xs">
          SAC QueueFlow &bull; San Jose de Buenavista, Antique
        </span>
      </footer>
    </div>
  );
}
