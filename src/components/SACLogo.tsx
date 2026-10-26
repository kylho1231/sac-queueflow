import React from 'react';

export function SACLogo({ className = "w-10 h-10", withText = false }: { className?: string; withText?: boolean }) {
  return (
    <div className="flex items-center space-x-3">
      {/* Official St. Anthony's College Seal Vector */}
      <svg
        viewBox="0 0 100 100"
        className={className}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-label="St. Anthony's College Seal"
      >
        {/* Outer Ring - Royal Blue with Gold Trim */}
        <circle cx="50" cy="50" r="48" fill="#1E3A8A" stroke="#F59E0B" strokeWidth="3" />
        <circle cx="50" cy="50" r="43" fill="#1E3A8A" stroke="#FEF08A" strokeWidth="0.8" strokeDasharray="2 2" />

        {/* Circular Inscribed Text: ST. ANTHONY'S COLLEGE • ANTIQUE */}
        <path id="textCircleTop" d="M 18,50 A 32,32 0 1,1 82,50" fill="none" />
        <path id="textCircleBottom" d="M 82,50 A 32,32 0 1,1 18,50" fill="none" />
        
        <text fill="#FFFFFF" fontSize="6.2" fontWeight="bold" letterSpacing="0.8">
          <textPath href="#textCircleTop" startOffset="50%" textAnchor="middle">
            ST. ANTHONY&apos;S COLLEGE
          </textPath>
        </text>

        <text fill="#FEF08A" fontSize="5.5" fontWeight="bold" letterSpacing="1.2">
          <textPath href="#textCircleBottom" startOffset="50%" textAnchor="middle">
            SAN JOSE &bull; ANTIQUE
          </textPath>
        </text>

        {/* Inner Shield / Center Badge */}
        <circle cx="50" cy="50" r="28" fill="#FFFFFF" stroke="#F59E0B" strokeWidth="2" />

        {/* Quadrant Cross Dividing the 4 Symbols (Hammer, Book, Bush of Grain, Palm Tree) */}
        <line x1="50" y1="23" x2="50" y2="77" stroke="#1E3A8A" strokeWidth="1.5" />
        <line x1="23" y1="50" x2="77" y2="50" stroke="#1E3A8A" strokeWidth="1.5" />

        {/* 1. Top-Left: The Hammer of St. Anthony */}
        <path d="M37 32 H43 V35 H41 V44 H39 V35 H37 Z" fill="#D97706" />

        {/* 2. Top-Right: The Holy Scripture / Book */}
        <path d="M57 33 C61 32 66 33 66 33 V43 C66 43 61 42 57 43 Z" fill="#1E3A8A" />
        <path d="M57 33 C53 32 48 33 48 33 V43 C48 43 53 42 57 43 Z" fill="#1E3A8A" />

        {/* 3. Bottom-Left: Bush of Grain / Agriculture */}
        <ellipse cx="37" cy="62" rx="4" ry="7" fill="#10B981" transform="rotate(-15 37 62)" />
        <ellipse cx="40" cy="60" rx="3" ry="6" fill="#F59E0B" transform="rotate(15 40 60)" />

        {/* 4. Bottom-Right: The Palm Tree of Life */}
        <path d="M60 70 C60 62 61 58 61 56" stroke="#92400E" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M58 56 Q63 53 66 56 Q61 58 58 56 Z" fill="#059669" />
        <path d="M62 56 Q66 57 67 62 Q61 60 62 56 Z" fill="#059669" />
        <path d="M60 56 Q55 54 53 58 Q57 59 60 56 Z" fill="#059669" />

        {/* Center Banner Motto Ribbon: RELIGIO ET ARTIBUS */}
        <rect x="30" y="47.5" width="40" height="5.5" rx="1.5" fill="#F59E0B" stroke="#1E3A8A" strokeWidth="0.8" />
        <text x="50" y="51.8" fill="#1E3A8A" fontSize="3.6" fontWeight="900" textAnchor="middle" letterSpacing="0.4">
          RELIGIO ET ARTIBUS
        </text>
      </svg>

      {withText && (
        <div>
          <div className="flex items-center space-x-2">
            <span className="font-extrabold text-lg text-slate-900 tracking-tight">ST. ANTHONY&apos;S COLLEGE</span>
            <span className="bg-amber-100 text-amber-900 text-[10px] font-bold px-2 py-0.5 rounded-full border border-amber-300">
              Antique
            </span>
          </div>
          <p className="text-[11px] text-blue-900 font-medium">
            Cashier&apos;s Office &bull; Smart Queuing &amp; TV Monitor
          </p>
        </div>
      )}
    </div>
  );
}
