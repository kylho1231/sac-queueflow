'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useQueue } from '@/context/QueueContext';
import { 
  Building2, 
  GraduationCap, 
  Bell 
} from 'lucide-react';

export function NavigationHeader() {
  const { notifications, markNotificationRead, clearNotifications } = useQueue();
  const [showNotifDropdown, setShowNotifDropdown] = React.useState(false);
  const unreadCount = notifications.filter(n => !n.read).length;
  const pathname = usePathname();

  // Detect which portal is currently active
  const isStudentPortal = pathname === '/';
  const isStaffPortal = pathname?.startsWith('/staff');
  const isAdminPortal = pathname?.startsWith('/admin');
  const isDisplayPortal = pathname?.startsWith('/display');

  const requestBrowserPermission = async () => {
    if ('Notification' in window) {
      const res = await Notification.requestPermission();
      if (res === 'granted') {
        alert('Web Push Notifications successfully enabled for SAC QueueFlow!');
      } else {
        alert('Notification permission: ' + res);
      }
    } else {
      alert('Browser does not support desktop notifications.');
    }
  };

  return (
    <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-xl border-b border-teal-100/90 shadow-sm transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Branding linking back to student home */}
          <Link href="/" className="flex items-center space-x-3.5 group cursor-pointer">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-teal-800 via-teal-700 to-emerald-500 flex items-center justify-center text-white shadow-md shadow-teal-900/10 ring-2 ring-teal-200/50 group-hover:scale-105 transition-transform">
              <Building2 className="w-6 h-6 text-white" aria-hidden="true" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-extrabold text-xl text-teal-950 tracking-tight">SAC QueueFlow</span>
                <span className="bg-gradient-to-r from-teal-100 to-emerald-100 text-teal-900 text-[11px] font-bold px-2.5 py-0.5 rounded-full border border-teal-300/60 shadow-2xs">
                  {isStaffPortal ? 'Staff Portal' : isAdminPortal ? 'Admin Portal' : isDisplayPortal ? 'Live Display' : 'Student Portal'}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 hidden sm:block font-medium">
                St. Anthony&apos;s College &bull; San Jose de Buenavista, Antique
              </p>
            </div>
          </Link>

          {/* Action icons & portal navigation */}
          <div className="flex items-center space-x-3">
            {/* Student View Specific Header Extras */}
            {isStudentPortal && (
              <button
                type="button"
                onClick={requestBrowserPermission}
                className="min-h-[44px] text-xs font-semibold text-teal-800 hover:text-teal-950 bg-teal-50 hover:bg-teal-100 px-3.5 py-2 rounded-xl border border-teal-200/90 transition-all hidden sm:flex items-center space-x-1.5 cursor-pointer shadow-2xs"
                title="Enable Browser Alerts for when your queue is called"
                aria-label="Enable Push Alerts for queue calls"
              >
                <Bell className="w-3.5 h-3.5 text-teal-700" aria-hidden="true" />
                <span>Enable Push Alerts</span>
              </button>
            )}

            {/* Notifications Bell (for student alerts) */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowNotifDropdown(!showNotifDropdown)}
                className="min-w-[44px] min-h-[44px] flex items-center justify-center relative p-2.5 text-slate-600 hover:text-teal-700 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
                aria-label="Queue notifications"
                aria-expanded={showNotifDropdown}
              >
                <Bell className="w-5 h-5" aria-hidden="true" />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center ring-2 ring-white">
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* Notification Dropdown */}
              {showNotifDropdown && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-xl border border-slate-200 py-3 z-50 animate-in fade-in-50 zoom-in-95 duration-150">
                  <div className="flex items-center justify-between px-4 pb-2 border-b border-slate-100">
                    <h4 className="font-semibold text-sm text-slate-900">Notifications & Alerts</h4>
                    {notifications.length > 0 && (
                      <button
                        onClick={clearNotifications}
                        className="text-xs text-slate-500 hover:text-teal-600 cursor-pointer"
                      >
                        Clear all
                      </button>
                    )}
                  </div>

                  <div className="max-h-72 overflow-y-auto divide-y divide-slate-50">
                    {notifications.length === 0 ? (
                      <div className="p-4 text-center text-xs text-slate-400">
                        No recent queue notifications.
                      </div>
                    ) : (
                      notifications.map(notif => (
                        <div
                          key={notif.id}
                          onClick={() => markNotificationRead(notif.id)}
                          className={`p-3.5 hover:bg-slate-50 transition-colors cursor-pointer ${
                            !notif.read ? 'bg-teal-50/40' : ''
                          }`}
                        >
                          <div className="flex items-start space-x-2.5">
                            <div className="mt-0.5">
                              {notif.type === 'APPROACHING' || notif.type === 'CALLED' ? (
                                <div className="w-2 h-2 rounded-full bg-rose-500 ring-2 ring-rose-200 animate-ping" />
                              ) : (
                                <div className="w-2 h-2 rounded-full bg-teal-500" />
                              )}
                            </div>
                            <div className="flex-1">
                              <p className="text-xs font-semibold text-slate-900">{notif.title}</p>
                              <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">{notif.message}</p>
                              <span className="text-[10px] text-slate-400 mt-1 block">{notif.timestamp}</span>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* If on staff or admin portal, provide clear link back to Student Portal */}
            {!isStudentPortal && (
              <Link
                href="/"
                className="bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold px-3.5 py-2 rounded-xl border border-slate-300 transition-colors flex items-center space-x-1.5 cursor-pointer"
              >
                <GraduationCap className="w-4 h-4 text-teal-600" />
                <span>Student Portal</span>
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
