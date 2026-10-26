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
      <div className="relative min-h-screen bg-[#0A192F] text-white">
        {/* Floating return pill */}
        <div className="fixed top-4 right-4 z-50 flex items-center space-x-2">
          <Link
            href="/"
            className="bg-blue-950/80 hover:bg-blue-900 text-blue-200 text-xs font-bold px-3 py-1.5 rounded-xl border border-blue-800/60 shadow-lg cursor-pointer transition-all flex items-center space-x-1.5 backdrop-blur-md"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-amber-400" />
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
