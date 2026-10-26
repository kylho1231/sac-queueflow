'use client';

import React from 'react';
import { QueueProvider } from '@/context/CashierQueueContext';
import StudentLiveTVMonitor from '@/components/StudentLiveTVMonitor';
import { ToastContainer } from '@/components/ToastContainer';

export default function StudentLivePortalPage() {
  return (
    <QueueProvider>
      <div className="relative min-h-screen bg-white text-slate-900 flex flex-col font-sans selection:bg-[#EA671B] selection:text-white">
        {/* Main Live TV / PWA Campus Monitor (Student View Only) */}
        <StudentLiveTVMonitor />

        {/* Global Toast Container */}
        <ToastContainer />
      </div>
    </QueueProvider>
  );
}
