'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useCashierQueue, ActiveCallNotification, WindowNumber } from '@/context/CashierQueueContext';
import { QueueTicket } from '@/types/queue';
import { isSeniorCitizenTicket } from '@/lib/utils';
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
  AlertCircle,
  HeartHandshake
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
  const [mobileViewTab, setMobileViewTab] = useState<'windows' | 'queue' | 'recent'>('windows');
  const [showAudioConsentBanner, setShowAudioConsentBanner] = useState<boolean>(false);

  const handleSelectMobileTab = (tab: 'windows' | 'queue' | 'recent') => {
    setMobileViewTab(tab);
    if (tab === 'queue') setActiveRosterTab('waiting');
    if (tab === 'recent') setActiveRosterTab('recent');
  };

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

  // Active window serving tickets: perfectly synchronized with latestCallNotification for zero-latency UI matching across Windows 1 to 5
  const getServingTicketForWindow = (win: WindowNumber) => {
    const rawServing = nowServingTicket(win);
    if (latestCallNotification?.windowNumber === win && latestCallNotification.ticketNumber) {
      // Check if this ticket was finished / completed so we do not resurrect completed tickets
      const isFinished = tickets.some(
        t => t.ticketNumber === latestCallNotification.ticketNumber && (t.status === 'COMPLETED' || t.status === 'SKIPPED' || t.status === 'NO_SHOW')
      );
      if (isFinished) {
        return rawServing;
      }
      if (rawServing?.ticketNumber === latestCallNotification.ticketNumber) {
        return rawServing;
      }
      return {
        ...rawServing,
        id: latestCallNotification.id,
        ticketNumber: latestCallNotification.ticketNumber,
        studentName: latestCallNotification.studentName || `Ticket ${latestCallNotification.ticketNumber}`,
        calledAt: latestCallNotification.calledAt,
        status: 'CALLED' as const,
        assignedCounterNumber: win,
      } as QueueTicket;
    }
    return rawServing;
  };

  const servingWindows: Record<WindowNumber, QueueTicket | undefined> = {
    1: getServingTicketForWindow(1),
    2: getServingTicketForWindow(2),
    3: getServingTicketForWindow(3),
    4: getServingTicketForWindow(4),
    5: getServingTicketForWindow(5),
  };

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
            <span className="text-[10px] sm:text-xs md:text-sm font-extrabold text-[#B44606] uppercase tracking-wider sm:tracking-widest block truncate">
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
                className="min-h-[44px] bg-white hover:bg-slate-50 text-[#751A1A] border border-[#EA671B]/40 hover:border-[#EA671B] text-xs font-bold px-3 py-2 rounded-xl transition-all cursor-pointer shadow-2xs flex items-center space-x-1.5"
                title="Get alerted when your number is in now"
                aria-label="Enable browser push notifications"
              >
                <BellRing className="w-4 h-4 text-[#EA671B] animate-bounce" aria-hidden="true" />
                <span className="hidden xs:inline">Enable Alerts</span>
              </button>
            ) : (
              <div 
                className="min-h-[44px] bg-emerald-50 text-emerald-800 border border-emerald-300 text-xs font-bold px-3 py-2 rounded-xl flex items-center space-x-1.5"
                title="Browser Notifications Active: You will be alerted when a ticket is called."
              >
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span className="hidden xs:inline">Alerts On</span>
              </div>
            )}

            {/* Audio Voice Announcements Toggle */}
            <button
              type="button"
              onClick={() => {
                const nextState = !audioEnabled;
                setAudioEnabled(nextState);
                if (nextState) {
                  playQueueChime();
                }
              }}
              className={`min-w-[44px] min-h-[44px] p-2.5 rounded-xl transition-all cursor-pointer flex items-center justify-center ${
                audioEnabled 
                  ? 'bg-[#EA671B] text-white shadow-xs font-bold' 
                  : 'text-slate-500 hover:text-[#751A1A] hover:bg-white border border-transparent hover:border-slate-200'
              }`}
              title={audioEnabled ? "Voice Announcements On (Click to Mute)" : "Voice Announcements Muted (Click to Unmute)"}
              aria-label={audioEnabled ? "Voice Announcements On (Click to Mute)" : "Voice Announcements Muted (Click to Unmute)"}
              aria-pressed={audioEnabled}
            >
              {audioEnabled ? <Volume2 className="w-5 h-5" aria-hidden="true" /> : <VolumeX className="w-5 h-5" aria-hidden="true" />}
            </button>

            {/* Fullscreen Button */}
            <button
              type="button"
              onClick={toggleFullscreen}
              className="min-w-[44px] min-h-[44px] p-2.5 text-slate-500 hover:text-[#751A1A] hover:bg-white rounded-xl transition-colors cursor-pointer flex items-center justify-center border border-transparent hover:border-slate-200"
              title="Toggle Fullscreen"
              aria-label={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
              aria-pressed={isFullscreen}
            >
              {isFullscreen ? <Minimize2 className="w-5 h-5" aria-hidden="true" /> : <Maximize2 className="w-5 h-5" aria-hidden="true" />}
            </button>
          </div>
        </div>
      </header>

      {/* "WHAT NUMBER IS IN NOW" PERSISTENT NOTIFICATION STATUS BAR */}
      <section 
        aria-label="Live calling queue status"
        className="bg-gradient-to-r from-[#FFF8F1] via-white to-[#FFF8F1] border-2 border-[#EA671B]/35 rounded-2xl sm:rounded-3xl p-3 sm:p-4 my-3 sm:my-4 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-3"
      >
        <div className="flex items-center space-x-2.5 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-[#751A1A] text-white flex items-center justify-center shadow-xs shrink-0">
            <Radio className="w-4 h-4 text-[#EA671B] animate-pulse" aria-hidden="true" />
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

        {/* Live Active Number Badges across Windows 1 to 5 */}
        <div 
          aria-live="polite" 
          aria-atomic="true"
          className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-5 gap-1.5 sm:gap-2 w-full md:w-auto"
        >
          {([1, 2, 3, 4, 5] as const).map((win) => {
            const serv = servingWindows[win];
            const isSen = serv ? isSeniorCitizenTicket(serv) : false;
            return (
              <div 
                key={win}
                className={`rounded-xl px-2.5 py-1.5 shadow-2xs flex items-center justify-between border-2 transition-all ${
                  serv
                    ? 'bg-emerald-50/90 border-emerald-500 text-emerald-950 ring-2 ring-emerald-500/20'
                    : 'bg-rose-50/90 border-rose-500 text-rose-950'
                }`}
              >
                <div className="flex items-center space-x-1.5 min-w-0">
                  <span className={`text-[10px] sm:text-xs font-black uppercase tracking-wider block ${
                    serv ? 'text-emerald-900' : 'text-rose-900'
                  }`}>
                    W-{win}:
                  </span>
                  <span className={`text-xs sm:text-sm font-black font-mono leading-none truncate ${
                    serv ? 'text-emerald-950' : 'text-rose-800'
                  }`}>
                    {serv ? serv.ticketNumber : 'STANDBY'}
                  </span>
                  {isSen && (
                    <span className="text-[8px] font-black bg-[#EA671B] text-white px-1 py-0.2 rounded uppercase shrink-0">
                      SR
                    </span>
                  )}
                </div>

                {/* Highlight badge indicator: Green when online, Red when offline/standby */}
                <span className={`text-[8px] sm:text-[9px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider ml-1 shrink-0 ${
                  serv
                    ? 'bg-emerald-600 text-white'
                    : 'bg-rose-600 text-white'
                }`}>
                  {serv ? 'ONLINE' : 'OFFLINE'}
                </span>
              </div>
            );
          })}

          {/* Last Call Pill */}
          {latestCallNotification && (
            <div className="hidden lg:flex items-center space-x-1.5 bg-[#751A1A] text-white px-3 py-1.5 rounded-xl text-xs font-bold shadow-2xs col-span-full xl:col-auto">
              <Bell className="w-3.5 h-3.5 text-[#EA671B]" aria-hidden="true" />
              <span>Latest Call: <strong>{latestCallNotification.ticketNumber}</strong> (W-{latestCallNotification.windowNumber})</span>
            </div>
          )}
        </div>
      </section>

      {/* MOBILE-RESPONSIVE VIEW SWITCHER: Gives students on phones instant 1-tap switching without endless scrolling */}
      <div className="flex lg:hidden items-center justify-between bg-[#FFF8F1] p-1.5 rounded-2xl my-2 border border-[#EA671B]/30 gap-1 shrink-0">
        <button
          type="button"
          onClick={() => handleSelectMobileTab('windows')}
          className={`flex-1 min-h-[44px] py-2 px-1.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-1 cursor-pointer ${
            mobileViewTab === 'windows'
              ? 'bg-[#751A1A] text-white shadow-xs'
              : 'text-slate-700 hover:text-[#751A1A]'
          }`}
        >
          <Receipt className="w-3.5 h-3.5" />
          <span>Windows (1-5)</span>
        </button>

        <button
          type="button"
          onClick={() => handleSelectMobileTab('queue')}
          className={`flex-1 min-h-[44px] py-2 px-1.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-1 cursor-pointer ${
            mobileViewTab === 'queue'
              ? 'bg-[#751A1A] text-white shadow-xs'
              : 'text-slate-700 hover:text-[#751A1A]'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Up Next ({upNextTickets.length})</span>
        </button>

        <button
          type="button"
          onClick={() => handleSelectMobileTab('recent')}
          className={`flex-1 min-h-[44px] py-2 px-1.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-1 cursor-pointer ${
            mobileViewTab === 'recent'
              ? 'bg-[#751A1A] text-white shadow-xs'
              : 'text-slate-700 hover:text-[#751A1A]'
          }`}
        >
          <History className="w-3.5 h-3.5" />
          <span>Called ({recentlyCalledTickets.length})</span>
        </button>
      </div>

      {/* CENTER SECTION: 5 ACTIVE CASHIER WINDOWS & QUEUE ROSTER */}
      <main className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6 my-2 sm:my-3 flex-1 items-stretch">
        {/* LEFT 8 COLS: CASHIER WINDOWS 1 TO 5 CALLING BOARDS */}
        <div className={`lg:col-span-8 ${mobileViewTab === 'windows' ? 'grid' : 'hidden lg:grid'} grid-cols-1 xs:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4.5`}>
          {([1, 2, 3, 4, 5] as const).map((win) => {
            const serv = servingWindows[win];
            const isSenior = serv ? isSeniorCitizenTicket(serv) : false;
            return (
              <div
                key={win}
                className={`bg-white rounded-2xl sm:rounded-3xl border-2 sm:border-3 p-3.5 sm:p-5 flex flex-col justify-between text-center shadow-md relative overflow-hidden transition-all ${
                  serv 
                    ? 'border-emerald-500 bg-gradient-to-b from-emerald-50/25 via-white to-white shadow-emerald-950/5 ring-1 ring-emerald-500/20' 
                    : 'border-rose-400 bg-gradient-to-b from-rose-50/20 via-white to-white'
                } ${win === 5 ? 'xs:col-span-2 xl:col-span-1' : ''}`}
              >
                {/* Top Badge */}
                <div className="flex items-center justify-between pb-2 sm:pb-2.5 border-b border-slate-100 gap-1.5">
                  <div className="flex items-center space-x-1.5">
                    <span className="bg-[#751A1A] text-white font-black text-xs sm:text-sm px-2.5 sm:px-3 py-1 rounded-full uppercase tracking-wider shadow-xs">
                      WINDOW {win}
                    </span>
                    {serv && (
                      <span className="bg-[#EA671B] text-white font-black text-[9px] sm:text-[10px] px-2 py-0.5 rounded-full uppercase">
                        IN NOW
                      </span>
                    )}
                  </div>
                  <span className={`inline-flex items-center space-x-1 text-[10px] sm:text-[11px] px-2.5 py-0.5 rounded-full border font-bold shrink-0 ${
                    serv 
                      ? 'text-emerald-800 bg-emerald-50 border-emerald-300' 
                      : 'text-rose-800 bg-rose-50 border-rose-300'
                  }`}>
                    <span>{serv ? 'ONLINE' : 'OFFLINE'}</span>
                  </span>
                </div>

                <div className="my-auto py-2.5 sm:py-4">
                  <div className="flex items-center justify-center space-x-1.5 mb-1">
                    <span className="text-[10px] sm:text-xs uppercase tracking-widest text-[#B44606] font-black block">
                      NOW SERVING NUMBER
                    </span>
                    {isSenior && (
                      <span className="bg-[#EA671B] text-white text-[9px] sm:text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider shadow-2xs inline-flex items-center space-x-1">
                        <HeartHandshake className="w-2.5 h-2.5 text-white shrink-0" aria-hidden="true" />
                        <span>Priority Lane</span>
                      </span>
                    )}
                  </div>
                  <span className={`text-4xl xs:text-4xl sm:text-5xl xl:text-6xl font-black font-mono tracking-tight block leading-none my-1.5 sm:my-2 ${
                    serv ? 'text-[#751A1A]' : 'text-rose-700'
                  }`}>
                    {serv ? serv.ticketNumber : 'STANDBY'}
                  </span>

                  <div className={`mt-2 p-2 sm:p-2.5 rounded-2xl border max-w-full sm:max-w-xs mx-auto shadow-2xs ${
                    serv 
                      ? 'bg-[#FFF8F1] border-[#EA671B]/20' 
                      : 'bg-rose-50/60 border-rose-200'
                  }`}>
                    <span className={`text-xs sm:text-sm font-bold block truncate ${
                      serv ? 'text-[#751A1A]' : 'text-rose-900'
                    }`}>
                      {serv ? serv.studentName : 'Cashier Standby / Idle'}
                    </span>
                    <span className="text-[10px] sm:text-[11px] text-slate-500 font-mono font-semibold block mt-0.5">
                      {serv 
                        ? `Called: ${formatTimeAgo(serv.calledAt)}` 
                        : 'Awaiting next queue number call'}
                    </span>
                  </div>
                </div>

                <div className="pt-2 sm:pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-600 font-semibold px-1">
                  <div className="flex items-center space-x-1.5">
                    <Receipt className="w-3.5 h-3.5 text-[#EA671B]" aria-hidden="true" />
                    <span>Cashier Officer #{win}</span>
                  </div>
                  {serv && (
                    <button
                      type="button"
                      onClick={() => handleReplayAudio({
                        id: serv.id,
                        ticketNumber: serv.ticketNumber,
                        windowNumber: win,
                        studentName: serv.studentName,
                        calledAt: serv.calledAt || '',
                      })}
                      className="min-h-[44px] px-2 py-1 text-[#751A1A] hover:text-[#B44606] flex items-center space-x-1 font-bold cursor-pointer"
                      title={`Replay Voice Chime for Window ${win}`}
                      aria-label={`Replay Voice Chime for Window ${win}`}
                    >
                      <Volume2 className="w-3.5 h-3.5 text-[#EA671B]" aria-hidden="true" />
                      <span>Chime</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* RIGHT 4 COLS: DUAL-TAB ROSTER (UP NEXT & RECENTLY CALLED NOTIFICATIONS) */}
        <div className={`lg:col-span-4 ${mobileViewTab !== 'windows' ? 'flex' : 'hidden lg:flex'} bg-white rounded-2xl sm:rounded-3xl border border-slate-200 p-3.5 sm:p-6 flex-col justify-between shadow-md`}>
          <div>
            {/* Tab Selector Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 gap-2 flex-wrap">
              <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-2xl">
                <button
                  type="button"
                  onClick={() => setActiveRosterTab('waiting')}
                  className={`min-h-[44px] px-3 sm:px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center space-x-1.5 ${
                    activeRosterTab === 'waiting'
                      ? 'bg-white text-[#751A1A] shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Layers className="w-3.5 h-3.5 text-[#EA671B]" aria-hidden="true" />
                  <span>Up Next ({upNextTickets.length})</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveRosterTab('recent')}
                  className={`min-h-[44px] px-3 sm:px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center space-x-1.5 ${
                    activeRosterTab === 'recent'
                      ? 'bg-white text-[#751A1A] shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <History className="w-3.5 h-3.5 text-[#EA671B]" aria-hidden="true" />
                  <span>Called ({recentlyCalledTickets.length})</span>
                </button>
              </div>

              {/* Mobile Back Button */}
              <button
                type="button"
                onClick={() => setMobileViewTab('windows')}
                className="lg:hidden text-xs text-[#751A1A] hover:underline font-bold py-1 px-2 cursor-pointer flex items-center space-x-1"
              >
                <span>&larr; View Windows</span>
              </button>

              <span className="text-xs font-bold text-[#B44606] hidden lg:inline">
                Live Feed
              </span>
            </div>

            {/* TAB CONTENT 1: UP NEXT WAITING TICKETS */}
            {activeRosterTab === 'waiting' && (
              <div className="mt-3">
                <p className="text-[11px] text-slate-500 mb-2.5">
                  Tickets lined up in queue. Numbers are summoned sequentially to Windows 1 to 5.
                </p>

                <div className="space-y-2 sm:space-y-2.5 max-h-72 overflow-y-auto pr-1">
                  {upNextTickets.length === 0 ? (
                    <div className="py-8 sm:py-12 text-center text-slate-400 text-xs sm:text-sm">
                      <p>No pending tickets in line.</p>
                      <p className="text-[11px] text-slate-400 mt-1">Cashiers are ready for new students.</p>
                    </div>
                  ) : (
                    upNextTickets.map((tkt, idx) => {
                      const isSenior = isSeniorCitizenTicket(tkt);
                      return (
                        <div
                          key={tkt.id}
                          className={`p-3 sm:p-3.5 rounded-2xl bg-white border shadow-2xs flex items-center justify-between gap-2 transition-colors ${
                            isSenior ? 'border-[#EA671B]/60 bg-[#FFF8F1]/40' : 'border-slate-200 hover:border-[#EA671B]/60'
                          }`}
                        >
                          <div className="flex items-center space-x-2.5 sm:space-x-3 min-w-0 flex-1">
                            <span className={`w-6 h-6 sm:w-7 sm:h-7 rounded-xl font-black text-xs flex items-center justify-center font-mono border shrink-0 ${
                              isSenior
                                ? 'bg-[#EA671B] text-white border-[#EA671B]'
                                : 'bg-[#FFF8F1] text-[#751A1A] border-[#EA671B]/20'
                            }`}>
                              {idx + 1}
                            </span>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center space-x-1.5">
                                <span className="text-xl sm:text-2xl font-black font-mono text-[#751A1A] tracking-wide block leading-none">
                                  {tkt.ticketNumber}
                                </span>
                                {isSenior && (
                                  <span className="text-[9px] font-black bg-[#EA671B] text-white px-1.5 py-0.5 rounded-full uppercase inline-flex items-center space-x-0.5">
                                    <HeartHandshake className="w-2.5 h-2.5 text-white shrink-0" aria-hidden="true" />
                                    <span>Priority</span>
                                  </span>
                                )}
                              </div>
                              <span className="text-[10px] sm:text-[11px] text-slate-600 font-semibold truncate block max-w-full sm:max-w-[130px] mt-0.5">
                                {tkt.studentName}
                              </span>
                            </div>
                          </div>

                          <span className={`text-[11px] sm:text-xs font-bold px-2.5 py-1 rounded-lg border shrink-0 ${
                            isSenior
                              ? 'bg-[#751A1A] text-white border-[#751A1A]'
                              : 'text-[#B44606] bg-[#FFF8F1] border-[#EA671B]/30'
                          }`}>
                            {isSenior ? 'Priority' : 'Standby'}
                          </span>
                        </div>
                      );
                    })
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
                      const isSenior = isSeniorCitizenTicket(tkt);
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
                              <div className="flex items-center space-x-1.5">
                                <span className="text-xs font-bold text-slate-800 block truncate">
                                  Window {tkt.assignedCounterNumber || 1}
                                </span>
                                {isSenior && (
                                  <span className="text-[9px] font-black bg-[#EA671B] text-white px-1.5 py-0.5 rounded uppercase inline-flex items-center space-x-0.5">
                                    <HeartHandshake className="w-2.5 h-2.5 text-white shrink-0" aria-hidden="true" />
                                    <span>Senior</span>
                                  </span>
                                )}
                              </div>
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
            Cashier Windows 1 to 5 are actively calling. Listen for audio chimes and watch for your number.
          </span>
        </div>

        <span className="font-semibold text-[#751A1A] shrink-0 font-mono text-[10px] sm:text-xs">
          SAC QueueFlow &bull; San Jose de Buenavista, Antique
        </span>
      </footer>
    </div>
  );
}
