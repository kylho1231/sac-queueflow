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
    <div className="min-h-screen bg-white text-slate-900 flex flex-col justify-center items-center p-6 text-center font-sans">
      <SACLogo className="w-20 h-20 mb-4 drop-shadow-sm" />
      <span className="text-xs font-bold text-[#B44606] uppercase tracking-widest block mb-1">
        ST. ANTHONY&apos;S COLLEGE &bull; SAN JOSE, ANTIQUE
      </span>
      <h1 className="text-2xl font-black text-[#751A1A] mb-2">Staff Portal has transitioned to Cashier Terminal</h1>
      <p className="text-sm text-slate-600 max-w-md mb-6 font-medium">
        Redirecting you to the authorized Cashier Terminal for Windows 1 to 5...
      </p>
      <Link
        href="/cashier"
        className="min-h-[44px] bg-[#EA671B] hover:bg-[#D95B11] text-white font-black px-6 py-3 rounded-2xl text-sm transition-all shadow-md inline-flex items-center space-x-2 cursor-pointer"
      >
        <span>Proceed to Cashier Terminal</span>
        <ArrowRight className="w-4 h-4" aria-hidden="true" />
      </Link>
    </div>
  );
}
