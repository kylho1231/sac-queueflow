'use client';

import React, { useState, useEffect } from 'react';
import { useQueue } from '@/context/QueueContext';
import { Volume2, VolumeX, Maximize2, Minimize2, Megaphone } from 'lucide-react';

export function TVQueueDisplay() {
  const { offices, tickets, counters, announcements } = useQueue();
  const [selectedOfficeId, setSelectedOfficeId] = useState<string>('off-registrar');
  const [audioEnabled, setAudioEnabled] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const currentOffice = offices.find(o => o.id === selectedOfficeId) || offices[0];
  const officeCounters = counters.filter(c => c.officeId === selectedOfficeId);

  // Tickets currently called or being served for this office
  const nowServingTickets = tickets.filter(
    t => t.officeId === selectedOfficeId && (t.status === 'CALLED' || t.status === 'SERVING')
  );

  // Up Next tickets (waiting)
  const upNextTickets = tickets
    .filter(t => t.officeId === selectedOfficeId && t.status === 'WAITING')
    .sort((a, b) => new Date(a.issuedAt).getTime() - new Date(b.issuedAt).getTime())
    .slice(0, 5);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  // Optional Voice synthesizer for calling
  const speakAnnouncement = (text: string) => {
    if (!audioEnabled || typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.95;
    utterance.pitch = 1.0;
    window.speechSynthesis.speak(utterance);
  };

  const primaryServing = nowServingTickets[0];

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col justify-between p-6 sm:p-10 font-sans">
      {/* Top Header */}
      <div className="flex items-center justify-between pb-6 border-b border-slate-800">
        <div>
          <span className="text-xs sm:text-sm font-bold text-teal-400 uppercase tracking-widest block">
            ST. ANTHONY&apos;S COLLEGE • SAN JOSE DE BUENAVISTA, ANTIQUE
          </span>
          <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight mt-1">
            {currentOffice.name} — Live TV Display
          </h1>
        </div>

        {/* Display Controls & Clock */}
        <div className="flex items-center space-x-4">
          <div className="text-right hidden sm:block">
            <span className="text-xs text-slate-400 block uppercase font-mono">Philippine Standard Time</span>
            <span className="text-2xl font-mono font-bold text-amber-400">{currentTime}</span>
          </div>

          <div className="flex items-center space-x-2 bg-slate-900 border border-slate-800 p-1.5 rounded-2xl">
            <select
              value={selectedOfficeId}
              onChange={e => setSelectedOfficeId(e.target.value)}
              aria-label="Select office queue to display"
              className="bg-transparent text-xs sm:text-sm font-bold text-teal-300 px-3 py-1 outline-hidden cursor-pointer min-h-[44px]"
            >
              {offices.map(o => (
                <option key={o.id} value={o.id} className="bg-slate-900 text-white">
                  {o.name}
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={() => {
                setAudioEnabled(!audioEnabled);
                if (!audioEnabled && primaryServing) {
                  speakAnnouncement(`Queue number ${primaryServing.ticketNumber}, please proceed to counter ${primaryServing.assignedCounterNumber || 1}`);
                }
              }}
              className={`min-w-[44px] min-h-[44px] flex items-center justify-center p-2 rounded-xl transition-colors cursor-pointer ${
                audioEnabled ? 'bg-teal-500/20 text-teal-400' : 'text-slate-500 hover:text-white'
              }`}
              title="Toggle Audio Voice Announcements"
              aria-label={audioEnabled ? "Disable audio voice announcements" : "Enable audio voice announcements"}
              aria-pressed={audioEnabled}
            >
              {audioEnabled ? <Volume2 className="w-5 h-5" aria-hidden="true" /> : <VolumeX className="w-5 h-5" aria-hidden="true" />}
            </button>

            <button
              type="button"
              onClick={toggleFullscreen}
              className="min-w-[44px] min-h-[44px] flex items-center justify-center p-2 text-slate-400 hover:text-white rounded-xl transition-colors cursor-pointer"
              title="Toggle Fullscreen"
              aria-label={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
              aria-pressed={isFullscreen}
            >
              {isFullscreen ? <Minimize2 className="w-5 h-5" aria-hidden="true" /> : <Maximize2 className="w-5 h-5" aria-hidden="true" />}
            </button>
          </div>
        </div>
      </div>

      {/* Main Center Display Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 my-8 flex-1 items-stretch">
        {/* Left 2 Cols: NOW SERVING BIG HERO */}
        <div className="lg:col-span-2 bg-gradient-to-br from-slate-900 via-teal-950/40 to-slate-900 rounded-3xl border-2 border-teal-500/30 p-8 sm:p-12 flex flex-col justify-center items-center text-center shadow-2xl relative overflow-hidden">
          <div className="absolute top-6 left-6 inline-flex items-center space-x-2 bg-rose-500/20 border border-rose-500/40 px-4 py-1.5 rounded-full text-rose-400 font-bold text-sm tracking-wider uppercase animate-pulse">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
            <span>NOW SERVING</span>
          </div>

          {primaryServing ? (
            <div className="space-y-4 my-auto">
              <span className="text-8xl sm:text-9xl font-black text-amber-400 tracking-tight block font-mono drop-shadow-md">
                {primaryServing.ticketNumber}
              </span>
              <div className="text-2xl sm:text-4xl font-extrabold text-white tracking-wide">
                PLEASE PROCEED TO{' '}
                <span className="text-teal-400 underline decoration-teal-500">
                  COUNTER {primaryServing.assignedCounterNumber || 1}
                </span>
              </div>
              <p className="text-slate-400 text-sm sm:text-base font-medium">
                Student: {primaryServing.studentName} • Status: {primaryServing.status}
              </p>
            </div>
          ) : (
            <div className="my-auto space-y-3">
              <span className="text-5xl sm:text-7xl font-extrabold text-slate-700 block font-mono">
                STANDBY
              </span>
              <p className="text-slate-400 text-lg">
                Counters are preparing to dispatch the next ticket.
              </p>
            </div>
          )}

          {/* Active Counters Status Bar */}
          <div className="w-full mt-auto pt-6 border-t border-slate-800 grid grid-cols-2 sm:grid-cols-3 gap-3">
            {officeCounters.map(c => {
              const servingTkt = tickets.find(t => t.assignedCounterId === c.id && (t.status === 'CALLED' || t.status === 'SERVING'));
              return (
                <div key={c.id} className="bg-slate-900/80 rounded-2xl p-3 border border-slate-800 text-left">
                  <span className="text-xs text-slate-400 block font-semibold">Counter #{c.counterNumber}</span>
                  <span className="text-base font-mono font-bold text-teal-300">
                    {servingTkt ? servingTkt.ticketNumber : 'Available'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right 1 Col: UP NEXT QUEUE */}
        <div className="bg-slate-900/90 rounded-3xl border border-slate-800 p-6 sm:p-8 flex flex-col justify-between shadow-xl">
          <div>
            <h2 className="text-lg font-bold text-slate-200 tracking-wider uppercase pb-3 border-b border-slate-800 flex items-center justify-between">
              <span>UP NEXT IN LINE</span>
              <span className="text-xs font-semibold text-teal-400">{upNextTickets.length} Pending</span>
            </h2>

            <div className="mt-4 space-y-3">
              {upNextTickets.length === 0 ? (
                <div className="py-12 text-center text-slate-500 text-sm">
                  No pending waiting tickets.
                </div>
              ) : (
                upNextTickets.map((tkt, idx) => (
                  <div
                    key={tkt.id}
                    className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800/80 flex items-center justify-between"
                  >
                    <div className="flex items-center space-x-3">
                      <span className="w-7 h-7 rounded-full bg-slate-800 text-slate-300 font-bold text-xs flex items-center justify-center">
                        {idx + 1}
                      </span>
                      <span className="text-2xl font-black font-mono text-white tracking-wide">
                        {tkt.ticketNumber}
                      </span>
                    </div>
                    <span className="text-xs text-teal-400 font-medium">Ready</span>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="mt-6 p-4 rounded-2xl bg-teal-950/40 border border-teal-800/40 text-xs text-teal-200/80 leading-relaxed">
            <strong className="text-teal-300 mb-1 flex items-center space-x-1.5">
              <Megaphone className="w-4 h-4 text-teal-300 shrink-0" aria-hidden="true" />
              <span>Antonian Reminder:</span>
            </strong>
            Students attending lecture classes may use the SAC QueueFlow mobile app to track queue progress or request class deferment.
          </div>
        </div>
      </div>

      {/* Bottom Announcements Ticker */}
      <div className="pt-4 border-t border-slate-900 text-xs text-slate-400 flex items-center justify-between">
        <div className="flex items-center space-x-2 truncate">
          <span className="bg-teal-900 text-teal-300 text-[10px] font-bold px-2 py-0.5 rounded-sm uppercase tracking-wider">
            ANNOUNCEMENT
          </span>
          <span className="truncate">
            {announcements[0]?.content || "Regular office hours: 8:00 AM – 12:00 PM and 1:00 PM – 5:00 PM. Have your requirements ready."}
          </span>
        </div>

        <span className="font-semibold text-slate-500 hidden sm:inline">
          SAC QueueFlow v1.0 • San Jose de Buenavista, Antique
        </span>
      </div>
    </div>
  );
}
