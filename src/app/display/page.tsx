'use client';

import React from 'react';
import Link from 'next/link';
import { QueueProvider } from '@/context/CashierQueueContext';
import StudentLiveTVMonitor from '@/components/StudentLiveTVMonitor';
import { ToastContainer } from '@/components/ToastContainer';
import { ArrowLeft } from 'lucide-react';

export default function TVDisplayPage() {
  return (
    <QueueProvider>
      <div className="relative min-h-screen bg-white text-slate-900">
        {/* Floating return pill */}
        <div className="fixed top-4 right-4 z-50 flex items-center space-x-2">
          <Link
            href="/"
            className="min-h-[44px] bg-white/95 hover:bg-[#FFF8F1] text-[#751A1A] hover:text-[#B44606] text-xs font-bold px-3.5 py-2 rounded-xl border border-slate-200 shadow-md cursor-pointer transition-all flex items-center space-x-1.5 backdrop-blur-md"
          >
            <ArrowLeft className="w-4 h-4 text-[#EA671B]" aria-hidden="true" />
            <span>Main Monitor</span>
          </Link>
        </div>

        {/* Live TV Monitor */}
        <StudentLiveTVMonitor />

        <ToastContainer />
      </div>
    </QueueProvider>
  );
}
