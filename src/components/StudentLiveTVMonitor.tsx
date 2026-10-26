'use client';

import React, { useState, useEffect } from 'react';
import { useCashierQueue } from '@/context/CashierQueueContext';
import { SACLogo } from '@/components/SACLogo';
import { 
  Volume2, 
  VolumeX, 
  Maximize2, 
  Minimize2, 
  Receipt, 
  Sparkles,
  Layers
} from 'lucide-react';

export default function StudentLiveTVMonitor() {
  const { tickets, announcements, nowServingTicket, upNextTickets } = useCashierQueue();
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
    <div className="min-h-screen bg-white text-slate-900 flex flex-col justify-between p-3 sm:p-6 lg:p-8 font-sans overflow-x-hidden w-full max-w-full selection:bg-[#EA671B] selection:text-white">
      {/* TOP HEADER: ST. ANTHONY'S COLLEGE BRANDING & REAL-TIME CLOCK */}
      <header className="bg-white rounded-2xl sm:rounded-3xl p-3.5 sm:p-5 border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-3 sm:gap-4">
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
              Campus TV &amp; PWA Display &bull; Present Completed Slip (Form FO 07)
            </p>
          </div>
        </div>

        {/* TIME & ACCESSIBILITY CONTROLS */}
        <div className="w-full md:w-auto flex items-center justify-between md:justify-end space-x-2 sm:space-x-3 bg-[#FFF8F1] p-2 sm:p-2.5 rounded-2xl border border-[#EA671B]/25 shadow-xs shrink-0">
          <div className="text-left sm:text-right px-2 sm:px-3 border-r border-[#EA671B]/20 flex-1 sm:flex-initial">
            <span className="text-[9px] sm:text-[10px] text-slate-500 uppercase tracking-wider block font-medium leading-none">Standard Time</span>
            <span className="text-base sm:text-xl md:text-2xl font-mono font-black text-[#751A1A] leading-tight block mt-0.5">{currentTime || '8:00:00 AM'}</span>
          </div>

          <div className="flex items-center space-x-1.5 sm:space-x-2 shrink-0">
            {/* Audio Voice Announcements Toggle */}
            <button
              onClick={() => {
                setAudioEnabled(!audioEnabled);
                if (!audioEnabled) {
                  playVoice("St. Anthony's College Live Audio Announcement Enabled");
                }
              }}
              className={`min-w-[40px] min-h-[40px] sm:min-w-[44px] sm:min-h-[44px] p-2 sm:p-2.5 rounded-xl transition-all cursor-pointer flex items-center justify-center ${
                audioEnabled 
                  ? 'bg-[#EA671B] text-white shadow-xs font-bold' 
                  : 'text-slate-500 hover:text-[#751A1A] hover:bg-white border border-transparent hover:border-slate-200'
              }`}
              title={audioEnabled ? "Voice Announcements On" : "Voice Announcements Off"}
              aria-label="Toggle Voice Announcements"
            >
              {audioEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
            </button>

            {/* Fullscreen Button */}
            <button
              onClick={toggleFullscreen}
              className="min-w-[40px] min-h-[40px] sm:min-w-[44px] sm:min-h-[44px] p-2 sm:p-2.5 text-slate-500 hover:text-[#751A1A] hover:bg-white rounded-xl transition-colors cursor-pointer flex items-center justify-center border border-transparent hover:border-slate-200"
              title="Toggle Fullscreen"
              aria-label="Toggle Fullscreen"
            >
              {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </header>

      {/* CENTER SECTION: 2 ACTIVE CASHIER WINDOWS (CASHIER 1 & CASHIER 2) */}
      <main className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6 my-4 sm:my-6 flex-1 items-stretch">
        {/* LEFT 8 COLS: CASHIER 1 AND CASHIER 2 CALLING BOARDS */}
        <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          {/* CASHIER WINDOW 1 */}
          <div className="bg-white rounded-2xl sm:rounded-3xl border-2 border-[#EA671B]/30 hover:border-[#EA671B] p-5 sm:p-8 flex flex-col justify-between text-center shadow-lg shadow-amber-950/5 relative overflow-hidden transition-all">
            {/* Top Badge */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 gap-2">
              <span className="bg-[#751A1A] text-white font-black text-xs sm:text-sm px-3 sm:px-4 py-1 rounded-full uppercase tracking-wider shadow-xs">
                WINDOW 1
              </span>
              <span className="inline-flex items-center space-x-1.5 text-[11px] sm:text-xs text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 font-bold shrink-0">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                <span>ONLINE</span>
              </span>
            </div>

            <div className="my-auto py-6 sm:py-8">
              <span className="text-[11px] sm:text-xs uppercase tracking-widest text-[#EA671B] font-black block mb-1 sm:mb-2">
                NOW SERVING
              </span>
              <span className="text-6xl xs:text-7xl sm:text-8xl font-black font-mono text-[#751A1A] tracking-tight block leading-none my-2 sm:my-3">
                {servingC1 ? servingC1.ticketNumber : 'STANDBY'}
              </span>

              <div className="mt-4 p-3 sm:p-3.5 bg-[#FFF8F1] rounded-2xl border border-[#EA671B]/20 max-w-full sm:max-w-xs mx-auto shadow-2xs">
                <span className="text-xs sm:text-sm font-bold text-[#751A1A] block truncate">
                  {servingC1 ? servingC1.studentName : 'Window Ready'}
                </span>
                <span className="text-[11px] sm:text-xs text-[#EA671B] font-mono font-semibold block mt-0.5">
                  {servingC1 ? `Token: ${servingC1.lookupCode}` : 'Waiting for next ticket call'}
                </span>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-center space-x-2 text-[11px] sm:text-xs text-slate-600 font-semibold">
              <Receipt className="w-4 h-4 text-[#EA671B]" />
              <span>Cashier Officer #1 &bull; Window 1</span>
            </div>
          </div>

          {/* CASHIER WINDOW 2 */}
          <div className="bg-white rounded-2xl sm:rounded-3xl border-2 border-[#EA671B]/30 hover:border-[#EA671B] p-5 sm:p-8 flex flex-col justify-between text-center shadow-lg shadow-amber-950/5 relative overflow-hidden transition-all">
            {/* Top Badge */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 gap-2">
              <span className="bg-[#751A1A] text-white font-black text-xs sm:text-sm px-3 sm:px-4 py-1 rounded-full uppercase tracking-wider shadow-xs">
                WINDOW 2
              </span>
              <span className="inline-flex items-center space-x-1.5 text-[11px] sm:text-xs text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 font-bold shrink-0">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                <span>ONLINE</span>
              </span>
            </div>

            <div className="my-auto py-6 sm:py-8">
              <span className="text-[11px] sm:text-xs uppercase tracking-widest text-[#EA671B] font-black block mb-1 sm:mb-2">
                NOW SERVING
              </span>
              <span className="text-6xl xs:text-7xl sm:text-8xl font-black font-mono text-[#751A1A] tracking-tight block leading-none my-2 sm:my-3">
                {servingC2 ? servingC2.ticketNumber : 'STANDBY'}
              </span>

              <div className="mt-4 p-3 sm:p-3.5 bg-[#FFF8F1] rounded-2xl border border-[#EA671B]/20 max-w-full sm:max-w-xs mx-auto shadow-2xs">
                <span className="text-xs sm:text-sm font-bold text-[#751A1A] block truncate">
                  {servingC2 ? servingC2.studentName : 'Window Ready'}
                </span>
                <span className="text-[11px] sm:text-xs text-[#EA671B] font-mono font-semibold block mt-0.5">
                  {servingC2 ? `Token: ${servingC2.lookupCode}` : 'Waiting for next ticket call'}
                </span>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-center space-x-2 text-[11px] sm:text-xs text-slate-600 font-semibold">
              <Receipt className="w-4 h-4 text-[#EA671B]" />
              <span>Cashier Officer #2 &bull; Window 2</span>
            </div>
          </div>
        </div>

        {/* RIGHT 4 COLS: UP NEXT QUEUE ROSTER */}
        <div className="lg:col-span-4 bg-white rounded-2xl sm:rounded-3xl border border-slate-200 p-4 sm:p-6 flex flex-col justify-between shadow-md">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 gap-2">
              <h2 className="text-sm sm:text-base font-black text-[#751A1A] tracking-wider uppercase flex items-center space-x-2">
                <Layers className="w-4 h-4 text-[#EA671B]" />
                <span>UP NEXT IN LINE</span>
              </h2>
              <span className="bg-[#FFF8F1] text-[#751A1A] text-xs font-bold px-2.5 py-0.5 rounded-full border border-[#EA671B]/30 shrink-0">
                {upNextTickets.length} Waiting
              </span>
            </div>

            <p className="text-[11px] text-slate-500 mt-2">
              Have your physical printed queue ticket &amp; Payment Slip Form FO 07 ready.
            </p>

            <div className="mt-3 sm:mt-4 space-y-2 sm:space-y-2.5 max-h-72 overflow-y-auto">
              {upNextTickets.length === 0 ? (
                <div className="py-8 sm:py-12 text-center text-slate-400 text-xs sm:text-sm">
                  No pending tickets in line.
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

          {/* Institutional Compliance Notice Box */}
          <div className="mt-4 sm:mt-6 p-3.5 sm:p-4 rounded-2xl bg-[#FFF8F1] border border-[#EA671B]/30 text-xs text-slate-700 space-y-1 shadow-2xs">
            <div className="flex items-center space-x-1.5 text-[#751A1A] font-bold">
              <Sparkles className="w-4 h-4 text-[#EA671B] shrink-0" />
              <span>Antonian Cashier Reminder:</span>
            </div>
            <p className="text-[11px] leading-relaxed text-slate-600">
              Please present your official physical <strong>Payment Slip (Form Code: FO 07)</strong> with exact student number and stated fees to the cashier window when called.
            </p>
          </div>
        </div>
      </main>

      {/* BOTTOM TICKER: COLLEGE ANNOUNCEMENTS */}
      <footer className="bg-white rounded-2xl p-3 sm:p-3.5 border border-slate-200/80 shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between text-[11px] sm:text-xs text-slate-600 gap-2">
        <div className="flex items-center space-x-2 min-w-0 max-w-full sm:max-w-3xl">
          <span className="bg-[#EA671B] text-white text-[9px] sm:text-[10px] font-black px-2 py-0.5 rounded-sm uppercase tracking-wider shrink-0">
            NOTICE
          </span>
          <span className="truncate text-slate-800 font-medium">
            {announcements[0]?.content || "Form Code: FO 07, Rev 1 required for all cashier transactions. Office hours 8:00 AM – 5:00 PM."}
          </span>
        </div>

        <span className="font-semibold text-[#751A1A] shrink-0 font-mono text-[10px] sm:text-xs">
          SAC QueueFlow &bull; San Jose de Buenavista, Antique
        </span>
      </footer>
    </div>
  );
}
