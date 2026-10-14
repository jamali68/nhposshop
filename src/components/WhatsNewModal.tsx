/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Sparkles, X, Check } from 'lucide-react';
import { usePOS } from '../context/POSContext';
import { useAppVersion } from '../utils/version';

export const WhatsNewModal: React.FC = () => {
  const { showWhatsNewModal, setShowWhatsNewModal } = usePOS();
  const { version: appVersion } = useAppVersion();

  if (!showWhatsNewModal) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-[#1b263b] text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-400" />
            <h3 className="font-bold text-base">What&apos;s New in Version {appVersion}</h3>
          </div>

          <button
            type="button"
            onClick={() => setShowWhatsNewModal(false)}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-700/50 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Content */}
        <div className="p-6 max-h-80 overflow-y-auto">
          <div className="space-y-3 text-left">
            <p className="text-xs text-slate-500 font-medium">
              We have released version {appVersion} with exciting updates, performance enhancements, and bug fixes:
            </p>
            <ul className="text-xs text-slate-700 space-y-3 list-disc pl-4 leading-relaxed">
              <li>
                <span className="font-bold text-slate-900">Multi-User Cloud SaaS Architecture:</span> Every store owner logs in with their authentic Google account with complete data isolation, starting fresh from 0.
              </li>
              <li>
                <span className="font-bold text-slate-900">Staff Credentials Management:</span> Shop owners can create restricted staff accounts (cashier, manager, salesman) with custom usernames and passwords.
              </li>
              <li>
                <span className="font-bold text-slate-900">Live Easy Load Ledger:</span> Direct tracking of Jazz, Telenor, Zong, and Ufone closing, purchase, and opening balances without any dummy numbers.
              </li>
              <li>
                <span className="font-bold text-slate-900">Items Price List Feature:</span> Added a dedicated items price management section in the sidebar for rapid price adjustments.
              </li>
              <li>
                <span className="font-bold text-slate-900">System Maintenance Mode:</span> Added an admin maintenance lock feature with an active countdown timer.
              </li>
              <li>
                <span className="font-bold text-slate-900">Progressive Web App (PWA):</span> Enhanced offline caching, fast loading, and desktop/mobile installability.
              </li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-50 border-t border-slate-100 p-4 flex justify-center">
          <button
            type="button"
            onClick={() => setShowWhatsNewModal(false)}
            className="flex items-center gap-1.5 px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-emerald-600/20 active:scale-95"
          >
            <Check className="w-4 h-4" />
            <span>Got it, Thanks!</span>
          </button>
        </div>
      </div>
    </div>
  );
};
