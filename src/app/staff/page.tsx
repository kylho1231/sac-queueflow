'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { SACLogo } from '@/components/SACLogo';
import { ArrowRight } from 'lucide-react';

export default function StaffRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    // Automatically redirect staff to cashier terminal
    router.replace('/cashier');
  }, [router]);

  return (
    <div className="min-h-screen bg-[#0A192F] text-white flex flex-col justify-center items-center p-6 text-center font-sans">
      <SACLogo className="w-16 h-16 mb-4 drop-shadow-md" />
      <span className="text-xs font-bold text-amber-400 uppercase tracking-widest block mb-1">
        ST. ANTHONY&apos;S COLLEGE
      </span>
      <h1 className="text-2xl font-black mb-2">Staff Portal has transitioned to Cashier Terminal</h1>
      <p className="text-sm text-blue-200 max-w-md mb-6">
        Redirecting you to the authorized Cashier Terminal for Window 1 and Window 2...
      </p>
      <Link
        href="/cashier"
        className="bg-amber-500 hover:bg-amber-600 text-blue-950 font-black px-6 py-3 rounded-2xl text-sm transition-all shadow-md inline-flex items-center space-x-2"
      >
        <span>Proceed to Cashier Terminal</span>
        <ArrowRight className="w-4 h-4" />
      </Link>
    </div>
  );
}
