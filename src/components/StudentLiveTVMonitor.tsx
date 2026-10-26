'use client';

import React, { useState, useEffect } from 'react';
import { useCashierQueue } from '@/context/CashierQueueContext';
import { SACLogo } from '@/components/SACLogo';
import { 
  Volume2, 
  VolumeX, 
  Maximize2, 
  Minimize2, 
  Clock, 
  Receipt, 
  Sparkles,
  Layers,
  ChevronRight
} from 'lucide-react';

export default function StudentLiveTVMonitor() {
  const { counters, tickets, announcements, nowServingTicket, upNextTickets } = useCashierQueue();
  const [currentTime, setCurrentTime] = useState<string>('');
  const [audioEnabled, setAudioEnabled] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  useEffect(() => {
    const update = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      );
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  const playVoice = (text: string) => {
    if (!audioEnabled || typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.rate = 0.95;
    window.speechSynthesis.speak(u);
  };

  const servingC1 = nowServingTicket(1);
  const servingC2 = nowServingTicket(2);

  const [lastAnnouncedC1, setLastAnnouncedC1] = useState<string | undefined>();
  const [lastAnnouncedC2, setLastAnnouncedC2] = useState<string | undefined>();

  useEffect(() => {
    if (audioEnabled && servingC1?.ticketNumber && servingC1.ticketNumber !== lastAnnouncedC1) {
      setLastAnnouncedC1(servingC1.ticketNumber);
      playVoice(`Now calling ticket ${servingC1.ticketNumber.split('').join(' ')} to Cashier Window 1.`);
    }
  }, [servingC1?.ticketNumber, audioEnabled, lastAnnouncedC1]);

  useEffect(() => {
    if (audioEnabled && servingC2?.ticketNumber && servingC2.ticketNumber !== lastAnnouncedC2) {
      setLastAnnouncedC2(servingC2.ticketNumber);
      playVoice(`Now calling ticket ${servingC2.ticketNumber.split('').join(' ')} to Cashier Window 2.`);
    }
  }, [servingC2?.ticketNumber, audioEnabled, lastAnnouncedC2]);

  return (
    <div className="min-h-screen bg-[#0A192F] text-white flex flex-col justify-between p-4 sm:p-8 font-sans selection:bg-amber-400 selection:text-blue-950">
      {/* TOP HEADER: ST. ANTHONY'S COLLEGE BRANDING & REAL-TIME CLOCK */}
      <header className="flex flex-col md:flex-row items-center justify-between pb-6 border-b border-blue-900/60 gap-4">
        <div className="flex items-center space-x-4">
          <SACLogo className="w-16 h-16 sm:w-20 sm:h-20 drop-shadow-md" />
          <div>
            <span className="text-xs sm:text-sm font-extrabold text-amber-400 uppercase tracking-widest block">
              ST. ANTHONY&apos;S COLLEGE &bull; SAN JOSE DE BUENAVISTA, ANTIQUE
            </span>
            <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight mt-0.5">
              CASHIER&apos;S OFFICE &bull; LIVE QUEUE MONITOR
            </h1>
            <p className="text-xs text-blue-200/80 font-medium">
              Official Campus TV &amp; PWA Display &bull; Present Completed Payment Slip (Form FO 07)
            </p>
          </div>
        </div>

        {/* TIME & CONTROLS */}
        <div className="flex items-center space-x-4 bg-[#112240] p-2.5 rounded-2xl border border-blue-800/60 shadow-lg">
          <div className="text-right px-3">
            <span className="text-[10px] text-blue-300 uppercase tracking-wider block font-mono">Philippine Standard Time</span>
            <span className="text-xl sm:text-2xl font-mono font-bold text-amber-400">{currentTime || '8:00:00 AM'}</span>
          </div>

          <button
            onClick={() => {
              setAudioEnabled(!audioEnabled);
              if (!audioEnabled) {
                playVoice("St. Anthony's College Live Audio Announcement Enabled");
              }
            }}
            className={`p-2.5 rounded-xl transition-all cursor-pointer ${
              audioEnabled ? 'bg-amber-500 text-blue-950 font-bold' : 'text-blue-400 hover:text-white'
            }`}
            title="Toggle Voice Announcements"
            aria-label="Toggle Voice Announcements"
          >
            {audioEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
          </button>

          <button
            onClick={toggleFullscreen}
            className="p-2.5 text-blue-400 hover:text-white rounded-xl transition-colors cursor-pointer"
            title="Toggle Fullscreen"
            aria-label="Toggle Fullscreen"
          >
            {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
          </button>
        </div>
      </header>

      {/* CENTER SECTION: 2 ACTIVE CASHIER WINDOWS (CASHIER 1 & CASHIER 2) */}
      <main className="grid grid-cols-1 lg:grid-cols-12 gap-6 my-6 flex-1 items-stretch">
        {/* LEFT 8 COLS: CASHIER 1 AND CASHIER 2 CALLING BOARDS */}
        <div className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-2 gap-6">
          {/* CASHIER WINDOW 1 */}
          <div className="bg-gradient-to-b from-[#112240] to-[#0D1B2A] rounded-3xl border-2 border-amber-500/40 p-6 sm:p-8 flex flex-col justify-between text-center shadow-2xl relative overflow-hidden">
            {/* Top Badge */}
            <div className="flex items-center justify-between pb-3 border-b border-blue-900/60">
              <span className="bg-blue-900/80 text-amber-300 font-extrabold text-xs px-3 py-1 rounded-full uppercase tracking-wider border border-amber-500/30">
                WINDOW 1
              </span>
              <span className="inline-flex items-center space-x-1.5 text-xs text-emerald-400 font-bold">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
                <span>ONLINE &bull; ACTIVE</span>
              </span>
            </div>

            <div className="my-auto py-6">
              <span className="text-xs uppercase tracking-widest text-blue-300 font-bold block mb-2">
                NOW SERVING
              </span>
              <span className="text-7xl sm:text-8xl font-black font-mono text-amber-400 tracking-tight block drop-shadow-lg">
                {servingC1 ? servingC1.ticketNumber : 'STANDBY'}
              </span>

              <div className="mt-4 p-3 bg-blue-950/60 rounded-2xl border border-blue-800/60 max-w-xs mx-auto">
                <span className="text-xs font-bold text-white block">
                  {servingC1 ? servingC1.studentName : 'Window Ready'}
                </span>
                <span className="text-[11px] text-amber-200/90 font-mono">
                  {servingC1 ? `Token: ${servingC1.lookupCode}` : 'Waiting for next ticket call'}
                </span>
              </div>
            </div>

            <div className="pt-3 border-t border-blue-900/60 flex items-center justify-center space-x-2 text-xs text-blue-300 font-semibold">
              <Receipt className="w-4 h-4 text-amber-400" />
              <span>Cashier Officer #1 &bull; Window 1</span>
            </div>
          </div>

          {/* CASHIER WINDOW 2 */}
          <div className="bg-gradient-to-b from-[#112240] to-[#0D1B2A] rounded-3xl border-2 border-amber-500/40 p-6 sm:p-8 flex flex-col justify-between text-center shadow-2xl relative overflow-hidden">
            {/* Top Badge */}
            <div className="flex items-center justify-between pb-3 border-b border-blue-900/60">
              <span className="bg-blue-900/80 text-amber-300 font-extrabold text-xs px-3 py-1 rounded-full uppercase tracking-wider border border-amber-500/30">
                WINDOW 2
              </span>
              <span className="inline-flex items-center space-x-1.5 text-xs text-emerald-400 font-bold">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
                <span>ONLINE &bull; ACTIVE</span>
              </span>
            </div>

            <div className="my-auto py-6">
              <span className="text-xs uppercase tracking-widest text-blue-300 font-bold block mb-2">
                NOW SERVING
              </span>
              <span className="text-7xl sm:text-8xl font-black font-mono text-amber-400 tracking-tight block drop-shadow-lg">
                {servingC2 ? servingC2.ticketNumber : 'STANDBY'}
              </span>

              <div className="mt-4 p-3 bg-blue-950/60 rounded-2xl border border-blue-800/60 max-w-xs mx-auto">
                <span className="text-xs font-bold text-white block">
                  {servingC2 ? servingC2.studentName : 'Window Ready'}
                </span>
                <span className="text-[11px] text-amber-200/90 font-mono">
                  {servingC2 ? `Token: ${servingC2.lookupCode}` : 'Waiting for next ticket call'}
                </span>
              </div>
            </div>

            <div className="pt-3 border-t border-blue-900/60 flex items-center justify-center space-x-2 text-xs text-blue-300 font-semibold">
              <Receipt className="w-4 h-4 text-amber-400" />
              <span>Cashier Officer #2 &bull; Window 2</span>
            </div>
          </div>
        </div>

        {/* RIGHT 4 COLS: UP NEXT QUEUE ROSTER */}
        <div className="lg:col-span-4 bg-[#112240]/90 rounded-3xl border border-blue-800/70 p-6 flex flex-col justify-between shadow-xl">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-blue-800/60">
              <h2 className="text-base font-extrabold text-white tracking-wider uppercase flex items-center space-x-2">
                <Layers className="w-4 h-4 text-amber-400" />
                <span>UP NEXT IN LINE</span>
              </h2>
              <span className="bg-amber-400/20 text-amber-300 text-xs font-bold px-2.5 py-0.5 rounded-full border border-amber-400/30">
                {upNextTickets.length} Waiting
              </span>
            </div>

            <p className="text-[11px] text-blue-200/70 mt-2">
              Have your physical printed queue ticket &amp; Payment Slip Form FO 07 ready.
            </p>

            <div className="mt-4 space-y-2.5">
              {upNextTickets.length === 0 ? (
                <div className="py-12 text-center text-blue-300 text-sm">
                  No pending tickets in line.
                </div>
              ) : (
                upNextTickets.map((tkt, idx) => (
                  <div
                    key={tkt.id}
                    className="p-3.5 rounded-2xl bg-[#0A192F]/80 border border-blue-800/50 flex items-center justify-between hover:border-amber-400/50 transition-colors"
                  >
                    <div className="flex items-center space-x-3">
                      <span className="w-7 h-7 rounded-xl bg-blue-900 text-amber-300 font-bold text-xs flex items-center justify-center font-mono">
                        {idx + 1}
                      </span>
                      <div>
                        <span className="text-2xl font-black font-mono text-white tracking-wide block">
                          {tkt.ticketNumber}
                        </span>
                        <span className="text-[10px] text-blue-300 font-medium truncate block max-w-[130px]">
                          {tkt.studentName}
                        </span>
                      </div>
                    </div>

                    <span className="text-xs font-bold text-amber-400 bg-amber-400/10 px-2.5 py-1 rounded-lg border border-amber-400/20">
                      Standby
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Institutional Compliance Notice Box */}
          <div className="mt-6 p-4 rounded-2xl bg-blue-950/80 border border-blue-700/40 text-xs text-blue-200 space-y-1.5 shadow-inner">
            <div className="flex items-center space-x-1.5 text-amber-400 font-bold">
              <Sparkles className="w-4 h-4" />
              <span>Antonian Cashier Reminder:</span>
            </div>
            <p className="text-[11px] leading-relaxed text-blue-100/90">
              Please present your official physical <strong>Payment Slip (Form Code: FO 07)</strong> with exact student number and stated fees to the cashier window when your number is called.
            </p>
          </div>
        </div>
      </main>

      {/* BOTTOM TICKER: COLLEGE ANNOUNCEMENTS */}
      <footer className="pt-4 border-t border-blue-900/60 flex flex-col sm:flex-row items-center justify-between text-xs text-blue-300/80 gap-2">
        <div className="flex items-center space-x-2 truncate max-w-3xl">
          <span className="bg-amber-500 text-blue-950 text-[10px] font-black px-2 py-0.5 rounded-sm uppercase tracking-wider shrink-0">
            NOTICE
          </span>
          <span className="truncate text-white font-medium">
            {announcements[0]?.content || "Form Code: FO 07, Rev 1 required for all cashier transactions. Office hours 8:00 AM – 5:00 PM."}
          </span>
        </div>

        <span className="font-semibold text-blue-400 shrink-0 font-mono">
          SAC QueueFlow &bull; San Jose de Buenavista, Antique
        </span>
      </footer>
    </div>
  );
}
