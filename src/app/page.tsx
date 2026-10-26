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
      <div className="relative min-h-screen bg-white text-slate-900 flex flex-col font-sans selection:bg-[#EA671B] selection:text-white">
        {/* Main Live TV / PWA Campus Monitor */}
        <StudentLiveTVMonitor />

        {/* Discreet Authorized Cashier Portal Access (Separated Portal) */}
        <div className="fixed bottom-3 right-3 z-40">
          <Link
            href="/cashier"
            className="bg-white/95 hover:bg-[#FFF8F1] text-[#751A1A] hover:text-[#EA671B] text-[11px] font-bold px-3 py-1.5 rounded-full border border-slate-200/90 shadow-md backdrop-blur-md transition-all flex items-center space-x-1.5 cursor-pointer"
            title="Authorized Cashier Window Login"
          >
            <Lock className="w-3 h-3 text-[#EA671B]" />
            <span>Cashier Terminal</span>
          </Link>
        </div>

        {/* Global Toast Container */}
        <ToastContainer />
      </div>
    </QueueProvider>
  );
}
