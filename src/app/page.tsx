'use client';

import React from 'react';
import Link from 'next/link';
import { QueueProvider } from '@/context/CashierQueueContext';
import StudentLiveTVMonitor from '@/components/StudentLiveTVMonitor';
import { ToastContainer } from '@/components/ToastContainer';
import { Lock } from 'lucide-react';

export default function StudentLivePortalPage() {
  return (
    <QueueProvider>
      <div className="relative min-h-screen bg-[#0A192F] text-white flex flex-col font-sans">
        {/* Main Live TV / PWA Campus Monitor */}
        <StudentLiveTVMonitor />

        {/* Discreet Authorized Cashier Portal Access (Separated Portal) */}
        <div className="fixed bottom-3 right-3 z-40">
          <Link
            href="/cashier"
            className="bg-blue-950/70 hover:bg-[#1E3A8A] text-blue-300 hover:text-white text-[11px] font-semibold px-3 py-1.5 rounded-full border border-blue-800/60 backdrop-blur-md transition-all flex items-center space-x-1.5 shadow-lg"
            title="Authorized Cashier Window Login"
          >
            <Lock className="w-3 h-3 text-amber-400" />
            <span>Cashier Terminal</span>
          </Link>
        </div>

        {/* Global Toast Container */}
        <ToastContainer />
      </div>
    </QueueProvider>
  );
}
