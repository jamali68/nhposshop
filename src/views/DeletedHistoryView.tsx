/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { ArrowLeft, RotateCcw, Trash2, History, AlertTriangle } from 'lucide-react';
import { usePOS } from '../context/POSContext';

export const DeletedHistoryView: React.FC = () => {
  const {
    deletedHistory,
    restoreDeletedEntry,
    permanentDeleteEntry,
    currentUser,
    setActiveView
  } = usePOS();

  const handleRestore = (id: string) => {
    if (window.confirm('Do you want to restore this entry back to its active account?')) {
      restoreDeletedEntry(id);
    }
  };

  const handlePermanentDelete = (id: string) => {
    if (window.confirm('Permanently delete this entry? This action cannot be undone.')) {
      permanentDeleteEntry(id);
    }
  };

  const getSourceBadge = (source: string) => {
    switch (source) {
      case 'wholesaler_khata':
        return <span className="bg-[#d35400] text-white px-2 py-0.5 rounded text-[9px] font-bold">WHOLESALER</span>;
      case 'customer_khata':
        return <span className="bg-[#8e44ad] text-white px-2 py-0.5 rounded text-[9px] font-bold">CUSTOMER</span>;
      case 'shop_cash':
        return <span className="bg-[#27ae60] text-white px-2 py-0.5 rounded text-[9px] font-bold">SHOP CASH</span>;
      case 'back_cash':
        return <span className="bg-[#2980b9] text-white px-2 py-0.5 rounded text-[9px] font-bold">BACK CASH</span>;
      default:
        return <span className="bg-slate-500 text-white px-2 py-0.5 rounded text-[9px] font-bold">LOG</span>;
    }
  };

  return (
    <div className="space-y-4 pb-12">
      {/* Top Header */}
      <div className="flex items-center justify-between bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-xs">
        <button
          type="button"
          onClick={() => setActiveView('dashboard')}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-[#2c3e50] hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back</span>
        </button>

        <h2 className="text-base sm:text-lg font-black text-slate-800 text-center tracking-tight flex items-center gap-1.5">
          <History className="w-4 h-4 text-slate-500" />
          <span>Deleted Logs (90 Days)</span>
        </h2>

        <div className="flex gap-1.5">
          <button
            type="button"
            onClick={() => setActiveView('daily_cash')}
            className="px-2.5 py-1 bg-emerald-600 text-white rounded-lg text-xs font-bold"
          >
            Shop
          </button>
          <button
            type="button"
            onClick={() => setActiveView('back_cash')}
            className="px-2.5 py-1 bg-blue-600 text-white rounded-lg text-xs font-bold"
          >
            Back
          </button>
        </div>
      </div>

      {/* Notice Banner */}
      <div className="bg-amber-50 border border-amber-200 text-amber-800 p-3 rounded-xl text-xs font-bold flex items-center gap-2">
        <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
        <span>Note: Entries 90 din baad automatic permanently delete ho jati hain.</span>
      </div>

      {/* Logs Table */}
      <div className="bg-white rounded-2xl p-4 shadow-xs border border-slate-200/80 space-y-3">
        <div className="flex justify-between items-center text-xs text-slate-500 font-bold">
          <span>Deleted Items Log</span>
          <span>{deletedHistory.length} records</span>
        </div>

        <div className="divide-y divide-slate-100">
          {deletedHistory.length > 0 ? (
            deletedHistory.map(item => (
              <div key={item.id} className="py-3.5 flex items-center justify-between gap-3 text-xs">
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="bg-slate-200 text-slate-800 px-2 py-0.5 rounded text-[10px] font-extrabold uppercase">
                      {item.type}
                    </span>
                    {getSourceBadge(item.source)}
                    <span
                      className={`text-[9px] font-bold px-1.5 py-0.2 rounded text-white ${
                        item.deleted_by === 'admin' ? 'bg-rose-600' : 'bg-slate-700'
                      }`}
                    >
                      {item.deleted_by.toUpperCase()}
                    </span>
                  </div>

                  <b className="text-slate-800 text-[13px] block">{item.note || 'No Description'}</b>

                  <div className="text-[11px] text-slate-400 space-x-2">
                    <span>Orig. Date: {item.transaction_date}</span>
                    <span>•</span>
                    <span className="text-orange-600 font-medium">
                      Deleted: {new Date(item.deleted_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 pt-1.5">
                    <button
                      type="button"
                      onClick={() => handleRestore(item.id)}
                      className="px-2.5 py-1 text-emerald-700 hover:bg-emerald-50 border border-emerald-600 rounded-lg font-bold text-[11px] flex items-center gap-1 transition-colors"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>Restore</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handlePermanentDelete(item.id)}
                      className="px-2.5 py-1 text-rose-700 hover:bg-rose-50 border border-rose-600 rounded-lg font-bold text-[11px] flex items-center gap-1 transition-colors"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>Permanent Delete</span>
                    </button>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-sm font-black font-mono text-slate-900">
                    Rs. {item.amount.toLocaleString()}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="py-12 text-center text-slate-400 text-xs space-y-1">
              <History className="w-6 h-6 mx-auto opacity-30" />
              <p>Koi delete record maujood nahi hai.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
