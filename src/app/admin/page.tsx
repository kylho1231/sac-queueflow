'use client';

import React from 'react';
import Link from 'next/link';
import { QueueProvider } from '@/context/QueueContext';
import { NavigationHeader } from '@/components/NavigationHeader';
import { AdminAnalytics } from '@/components/AdminAnalytics';
import { ToastContainer } from '@/components/ToastContainer';
import { ArrowLeft, ShieldCheck, UserCheck, Tv } from 'lucide-react';

export default function AdminPortalPage() {
  return (
    <QueueProvider>
      <div className="min-h-screen bg-[#F0FDFA] text-[#134E4A] flex flex-col font-sans selection:bg-teal-200">
        <NavigationHeader />

        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6">
          {/* Admin Breadcrumb Navigation */}
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3 bg-white/80 backdrop-blur-md p-3.5 rounded-2xl border border-teal-100/90 shadow-2xs">
            <div className="flex items-center space-x-2 text-xs font-medium text-slate-700">
              <Link 
                href="/" 
                className="inline-flex items-center space-x-1 text-slate-500 hover:text-teal-700 transition-colors font-semibold"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Return to Student Portal</span>
              </Link>
              <span className="text-slate-300">/</span>
              <span className="text-teal-900 font-bold flex items-center space-x-1.5">
                <ShieldCheck className="w-4 h-4 text-teal-600" />
                <span>Executive Administration & Analytics</span>
              </span>
            </div>

            <div className="flex items-center space-x-2.5">
              <Link
                href="/staff"
                className="bg-teal-50 hover:bg-teal-100 text-teal-900 text-xs font-semibold px-3 py-1.5 rounded-xl border border-teal-200 transition-colors flex items-center space-x-1.5 cursor-pointer"
              >
                <UserCheck className="w-3.5 h-3.5 text-teal-600" />
                <span>Switch to Staff Desk</span>
              </Link>

              <Link
                href="/display"
                className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold px-3 py-1.5 rounded-xl flex items-center space-x-1.5 shadow-xs transition-colors cursor-pointer"
              >
                <Tv className="w-3.5 h-3.5 text-amber-400" aria-hidden="true" />
                <span>Launch TV Display</span>
              </Link>
            </div>
          </div>

          {/* Dedicated Administration & Analytics Dashboard */}
          <AdminAnalytics />

          {/* Toast Notification Container */}
          <ToastContainer />
        </main>

        <footer className="border-t border-teal-100/80 bg-white/90 py-6 px-4 text-xs text-slate-500 mt-12 text-center">
          <p className="font-semibold text-slate-700">
            SAC QueueFlow Administration &bull; Institutional Governance & Audits
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">
            St. Anthony&apos;s College &bull; San Jose de Buenavista, Antique, Philippines
          </p>
        </footer>
      </div>
    </QueueProvider>
  );
}
