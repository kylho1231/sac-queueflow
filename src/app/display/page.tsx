'use client';

import React from 'react';
import Link from 'next/link';
import { QueueProvider } from '@/context/QueueContext';
import { TVQueueDisplay } from '@/components/TVQueueDisplay';
import { ArrowLeft } from 'lucide-react';

export default function TVDisplayPage() {
  return (
    <QueueProvider>
      <div className="relative min-h-screen bg-slate-950">
        {/* Floating return pill */}
        <div className="fixed top-4 right-4 z-50 flex items-center space-x-2">
          <Link
            href="/"
            className="bg-slate-900/90 hover:bg-slate-800 text-white text-xs font-bold px-3.5 py-2 rounded-xl border border-slate-700 shadow-lg cursor-pointer transition-all flex items-center space-x-1.5 backdrop-blur-md"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-teal-400" />
            <span>Exit to Student Portal</span>
          </Link>
        </div>

        {/* Full-Screen TV View */}
        <TVQueueDisplay />
      </div>
    </QueueProvider>
  );
}
