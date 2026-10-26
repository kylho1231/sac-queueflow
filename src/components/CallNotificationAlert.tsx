'use client';

import React, { useEffect, useState } from 'react';
import { ActiveCallNotification } from '@/context/CashierQueueContext';
import { BellRing, Volume2, X, ArrowRight, User, HeartHandshake } from 'lucide-react';

interface CallNotificationAlertProps {
  notification: ActiveCallNotification | null;
  onDismiss: () => void;
  onReplayAudio?: (notif: ActiveCallNotification) => void;
}

export function CallNotificationAlert({
  notification,
  onDismiss,
  onReplayAudio,
}: CallNotificationAlertProps) {
  const [progress, setProgress] = useState<number>(100);

  useEffect(() => {
    if (!notification) {
      setProgress(100);
      return;
    }

    setProgress(100);
    const duration = 12000; // 12 seconds
    const intervalTime = 100;
    const step = (intervalTime / duration) * 100;

    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          onDismiss();
          return 0;
        }
        return prev - step;
      });
    }, intervalTime);

    return () => clearInterval(timer);
  }, [notification?.id, onDismiss, notification]);

  if (!notification) return null;

  const isSenior = notification.isSeniorCitizen || notification.ticketNumber.startsWith('S-');

  return (
    <div
      role="alert"
      aria-live="assertive"
      className="fixed top-3 sm:top-5 left-1/2 -translate-x-1/2 z-50 w-[95%] sm:w-[90%] max-w-2xl animate-in fade-in slide-in-from-top-6 duration-300 pointer-events-auto"
    >
      <div className={`bg-white rounded-3xl border-3 shadow-2xl shadow-amber-950/20 overflow-hidden relative ${
        isSenior ? 'border-[#EA671B] ring-4 ring-[#EA671B]/20' : 'border-[#EA671B]'
      }`}>
        {/* Top Accent Strip */}
        <div className={`${isSenior ? 'bg-[#5A1212]' : 'bg-[#751A1A]'} px-4 sm:px-6 py-2.5 flex items-center justify-between text-white`}>
          <div className="flex items-center space-x-2">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#EA671B] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-[#EA671B]"></span>
            </span>
            {isSenior ? (
              <HeartHandshake className="w-4 h-4 text-amber-200 animate-pulse" aria-hidden="true" />
            ) : (
              <BellRing className="w-4 h-4 text-[#EA671B] animate-bounce" aria-hidden="true" />
            )}
            <span className="text-xs sm:text-sm font-black uppercase tracking-widest text-[#FFF8F1]">
              {isSenior
                ? (notification.isRecall ? 'ATTENTION: SENIOR CITIZEN RECALLED' : 'SENIOR CITIZEN PRIORITY CALL')
                : (notification.isRecall ? 'ATTENTION: TICKET RECALLED' : 'NOW CALLING NUMBER IN QUEUE')}
            </span>
          </div>

          <button
            onClick={onDismiss}
            className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl text-white/90 hover:text-white hover:bg-white/20 transition-colors cursor-pointer"
            aria-label="Dismiss call notification"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-6 bg-gradient-to-b from-[#FFF8F1] via-white to-white flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Giant Number Callout */}
          <div className="text-center sm:text-left flex-1 min-w-0">
            <div className="flex items-center space-x-2 justify-center sm:justify-start">
              <span className="text-[10px] sm:text-xs font-black uppercase tracking-widest text-[#B44606] block">
                ASSIGNED NUMBER IS NOW IN:
              </span>
              {isSenior && (
                <span className="bg-[#EA671B] text-white text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider inline-flex items-center space-x-1">
                  <HeartHandshake className="w-3 h-3 text-white shrink-0" aria-hidden="true" />
                  <span>Priority Lane</span>
                </span>
              )}
            </div>
            <div className="text-5xl sm:text-6xl md:text-7xl font-mono font-black text-[#751A1A] tracking-tight leading-none my-1">
              {notification.ticketNumber}
            </div>
            {notification.studentName && (
              <p className="text-xs sm:text-sm font-bold text-slate-700 flex items-center justify-center sm:justify-start space-x-1.5 mt-1 truncate">
                <User className="w-3.5 h-3.5 text-[#EA671B] shrink-0" aria-hidden="true" />
                <span className="truncate">{notification.studentName}</span>
              </p>
            )}
          </div>

          {/* Window Destination Badge */}
          <div className="flex flex-col items-center sm:items-end space-y-2 shrink-0">
            <div className="bg-[#751A1A] text-white px-4 py-2.5 rounded-2xl shadow-md border border-[#EA671B]/40 text-center">
              <span className="text-[10px] uppercase font-bold text-amber-200 tracking-wider block">
                PROCEED IMMEDIATELY TO
              </span>
              <span className="text-lg sm:text-xl font-black tracking-tight flex items-center justify-center space-x-1.5 text-white">
                <span>CASHIER WINDOW {notification.windowNumber}</span>
                <ArrowRight className="w-4 h-4 text-[#EA671B]" aria-hidden="true" />
              </span>
            </div>

            {/* Replay Announcement Button */}
            {onReplayAudio && (
              <button
                type="button"
                onClick={() => onReplayAudio(notification)}
                className="min-h-[44px] px-3.5 py-2 inline-flex items-center space-x-1.5 text-xs font-bold text-[#751A1A] hover:text-[#B44606] bg-white border border-slate-200 hover:border-[#EA671B]/50 rounded-xl shadow-2xs transition-all cursor-pointer"
                title="Replay Voice Callout &amp; Chime"
                aria-label="Replay Voice Callout &amp; Chime"
              >
                <Volume2 className="w-4 h-4 text-[#EA671B]" aria-hidden="true" />
                <span>Replay Voice Chime</span>
              </button>
            )}
          </div>
        </div>

        {/* Progress Bar */}
        <div className="h-1.5 bg-slate-100 w-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-[#EA671B] to-[#751A1A] transition-all duration-100 ease-linear"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  );
}
