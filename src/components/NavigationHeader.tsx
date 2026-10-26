'use client';

import React, { useState } from 'react';
import { useQueue } from '@/context/QueueContext';
import { UserRole } from '@/types/queue';
import { 
  Building2, 
  GraduationCap, 
  UserCheck, 
  ShieldCheck, 
  Tv, 
  Bell, 
  CheckCircle,
  HelpCircle
} from 'lucide-react';

export function NavigationHeader() {
  const { 
    currentRole, 
    setCurrentRole, 
    notifications, 
    markNotificationRead, 
    clearNotifications 
  } = useQueue();

  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const unreadCount = notifications.filter(n => !n.read).length;

  const handleRoleChange = (role: UserRole) => {
    setCurrentRole(role);
  };

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
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-teal-100 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Branding */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-teal-700 to-teal-500 flex items-center justify-center text-white shadow-sm ring-2 ring-teal-100">
              <Building2 className="w-6 h-6 text-white" aria-hidden="true" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-lg text-teal-950 tracking-tight">SAC QueueFlow</span>
                <span className="bg-teal-100/70 text-teal-800 text-[11px] font-semibold px-2 py-0.5 rounded-full border border-teal-200">
                  SAC Antique
                </span>
              </div>
              <p className="text-xs text-slate-500 hidden sm:block">
                St. Anthony's College • Smart Campus Queuing
              </p>
            </div>
          </div>

          {/* Quick Role Switcher (MVP Demonstration Mode) */}
          <div className="hidden md:flex items-center bg-slate-100/80 p-1 rounded-xl border border-slate-200 text-xs font-medium">
            <button
              onClick={() => handleRoleChange('student')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                currentRole === 'student'
                  ? 'bg-white text-teal-900 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <GraduationCap className="w-3.5 h-3.5 text-teal-600" aria-hidden="true" />
              <span>Student View</span>
            </button>
            <button
              onClick={() => handleRoleChange('staff')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                currentRole === 'staff'
                  ? 'bg-white text-teal-900 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <UserCheck className="w-3.5 h-3.5 text-teal-600" aria-hidden="true" />
              <span>Staff Desk</span>
            </button>
            <button
              onClick={() => handleRoleChange('admin')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                currentRole === 'admin'
                  ? 'bg-white text-teal-900 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5 text-teal-600" aria-hidden="true" />
              <span>Admin & Analytics</span>
            </button>
          </div>

          {/* Action icons & Live TV display link */}
          <div className="flex items-center space-x-2">
            <button
              onClick={requestBrowserPermission}
              className="text-xs font-medium text-slate-600 hover:text-teal-700 bg-teal-50/60 hover:bg-teal-100/60 px-3 py-1.5 rounded-lg border border-teal-200/80 transition-colors hidden sm:flex items-center space-x-1 cursor-pointer"
              title="Enable Browser Alerts for when your queue is called"
            >
              <span>🔔 Enable Push Alerts</span>
            </button>

            {/* Notifications Bell */}
            <div className="relative">
              <button
                onClick={() => setShowNotifDropdown(!showNotifDropdown)}
                className="relative p-2 text-slate-600 hover:text-teal-700 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                aria-label="Queue notifications"
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
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-xl border border-slate-200 py-3 z-50">
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
          </div>
        </div>
      </div>
    </header>
  );
}
