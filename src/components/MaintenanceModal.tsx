/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Wrench, Clock, ShieldAlert, Cog } from 'lucide-react';
import { usePOS } from '../context/POSContext';

export const MaintenanceModal: React.FC = () => {
  const { isMaintenanceMode, maintenanceNotice, toggleMaintenanceMode, currentUser } = usePOS();
  const [timeLeft, setTimeLeft] = useState<number>(3600); // 1 hour countdown

  useEffect(() => {
    if (!isMaintenanceMode) return;
    const interval = setInterval(() => {
      setTimeLeft(prev => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [isMaintenanceMode]);

  if (!isMaintenanceMode) return null;

  const hours = Math.floor(timeLeft / 3600);
  const minutes = Math.floor((timeLeft % 3600) / 60);
  const seconds = timeLeft % 60;
  const timerStr = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  const isSuperOrAdmin = currentUser?.role === 'super_admin' || currentUser?.role === 'admin';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md animate-in fade-in duration-300">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200/80 max-w-md w-full p-6 sm:p-8 text-center relative overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Top Decorative Alert Bar */}
        <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600" />

        {/* Animated Gears Icon */}
        <div className="flex items-center justify-center gap-3 text-[#e67e22] mb-4">
          <Cog className="w-12 h-12 animate-spin [animation-duration:4s]" />
          <Wrench className="w-10 h-10 animate-bounce [animation-duration:2s]" />
        </div>

        <div>
          <h2 className="text-xl font-bold text-slate-800 mb-2">System Under Maintenance</h2>
          <div className="w-16 h-0.5 bg-slate-200 mx-auto my-3" />
          
          {/* Real Live Broadcast / Notice Message */}
          <div className="p-3 bg-amber-50 border border-amber-200/80 rounded-2xl text-xs font-semibold text-amber-900 leading-relaxed mb-4 text-center">
            {maintenanceNotice || 'System is under maintenance. Please do not upload any data or sync to live systems.'}
          </div>

          <p className="text-[11px] text-slate-500 leading-relaxed mb-4">
            PWA offline mode is operational. Data is safely cached locally on your device and will be synced once maintenance finishes.
          </p>
        </div>

        {/* Countdown Box */}
        <div className="bg-[#fff5e6] border border-[#ffe0b2] rounded-xl p-3 text-[#d35400] text-xs font-bold flex items-center justify-center gap-2 mb-4">
          <Clock className="w-4 h-4" />
          <span>Estimated Completion Time:</span>
          <span className="font-mono bg-[#e67e22] text-white px-2 py-0.5 rounded text-sm tracking-wider">
            {timerStr}
          </span>
        </div>

        <p className="text-[11px] text-slate-400 mb-2">
          Thank you for your patience and cooperation!
        </p>

        {isSuperOrAdmin && (
          <div className="mt-4 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={toggleMaintenanceMode}
              className="text-xs text-amber-700 bg-amber-50 hover:bg-amber-100 px-3 py-1.5 rounded-lg font-bold transition-colors cursor-pointer"
            >
              Super Admin: Turn Off Maintenance Mode
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
