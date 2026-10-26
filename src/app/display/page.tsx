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
            className="bg-white/95 hover:bg-[#FFF8F1] text-[#751A1A] hover:text-[#EA671B] text-xs font-bold px-3 py-1.5 rounded-xl border border-slate-200 shadow-md cursor-pointer transition-all flex items-center space-x-1.5 backdrop-blur-md"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-[#EA671B]" />
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
