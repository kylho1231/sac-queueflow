import React from 'react';

export function SACLogo({ className = "w-12 h-12", withText = false }: { className?: string; withText?: boolean }) {
  return (
    <div className="flex items-center space-x-3">
      {/* Official St. Anthony's College Seal */}
      <img
        src="/sac-logo.png"
        alt="St. Anthony's College Official Seal"
        className={`${className} object-contain rounded-full shadow-sm select-none shrink-0`}
      />

      {withText && (
        <div>
          <div className="flex items-center space-x-2">
            <span className="font-extrabold text-lg text-slate-900 tracking-tight">
              ST. ANTHONY&apos;S COLLEGE
            </span>
            <span className="bg-[#FFF3E8] text-[#751A1A] text-[10px] font-bold px-2 py-0.5 rounded-full border border-[#EA671B]/30">
              San Jose, Antique
            </span>
          </div>
          <p className="text-[11px] text-[#751A1A] font-semibold">
            Cashier&apos;s Office &bull; Smart Queuing &amp; TV Monitor
          </p>
        </div>
      )}
    </div>
  );
}
