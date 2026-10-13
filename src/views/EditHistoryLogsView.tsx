/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { ArrowLeft, CheckCheck, History, ArrowRight } from 'lucide-react';
import { usePOS } from '../context/POSContext';

export const EditHistoryLogsView: React.FC = () => {
  const {
    editHistory,
    markAllEditsAsRead,
    setActiveView
  } = usePOS();

  return (
    <div className="space-y-4 pb-12">
      {/* Top Header */}
      <div className="flex items-center justify-between bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-xs">
        <button
          type="button"
          onClick={() => setActiveView('back_cash')}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-[#2c3e50] hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back</span>
        </button>

        <h2 className="text-base sm:text-lg font-black text-slate-800 text-center tracking-tight flex items-center gap-1.5">
          <History className="w-4 h-4 text-blue-600" />
          <span>Edit History Logs</span>
        </h2>

        <button
          type="button"
          onClick={markAllEditsAsRead}
          className="flex items-center gap-1 px-3 py-1.5 bg-[#27ae60] hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors shadow-xs"
        >
          <CheckCheck className="w-3.5 h-3.5" />
          <span>Read Clear</span>
        </button>
      </div>

      {/* Logs Table */}
      <div className="bg-white rounded-2xl p-4 shadow-xs border border-slate-200/80 space-y-3">
        <div className="divide-y divide-slate-100">
          {editHistory.length > 0 ? (
            editHistory.map(log => (
              <div
                key={log.id}
                className={`py-3.5 flex items-center justify-between gap-3 text-xs ${
                  !log.is_read ? 'bg-rose-50/50 p-2.5 rounded-xl border border-rose-100 mb-2' : ''
                }`}
              >
                <div className="flex-1 min-w-0 space-y-1">
                  <b className="text-slate-800 text-[13px] block">{log.note || 'No Note / General'}</b>

                  <div className="text-[11px] text-slate-400 space-x-2">
                    {log.transaction_date && <span>Date: {log.transaction_date}</span>}
                    <span>•</span>
                    <span>
                      {new Date(log.edited_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                    </span>
                  </div>
                </div>

                {/* Amount Change */}
                <div className="text-center px-2">
                  <div className="font-bold flex items-center gap-1.5 text-xs">
                    <span className="line-through text-rose-500 font-mono">
                      Rs. {log.old_amount.toLocaleString()}
                    </span>
                    <ArrowRight className="w-3 h-3 text-slate-400" />
                    <span className="text-emerald-600 font-mono font-black">
                      Rs. {log.new_amount.toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* Role badge */}
                <div className="text-right">
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded text-white uppercase ${
                      log.edited_by === 'admin' ? 'bg-[#2ecc71]' : 'bg-[#34495e]'
                    }`}
                  >
                    {log.edited_by}
                  </span>
                </div>
              </div>
            ))
          ) : (
            <div className="py-12 text-center text-slate-400 text-xs">
              Koi edit history mojood nahi hai.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
