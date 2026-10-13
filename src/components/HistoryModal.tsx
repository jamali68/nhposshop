/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { History, X } from 'lucide-react';
import { usePOS } from '../context/POSContext';

interface HistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  transactionId: string;
}

export const HistoryModal: React.FC<HistoryModalProps> = ({
  isOpen,
  onClose,
  transactionId
}) => {
  const { editHistory } = usePOS();

  if (!isOpen) return null;

  const logs = editHistory.filter(h => h.transaction_id === transactionId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white text-slate-800 w-full max-w-xs rounded-2xl shadow-2xl overflow-hidden border border-slate-100 p-5">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
          <div className="flex items-center gap-2 text-slate-800 font-bold text-sm">
            <History className="w-4 h-4 text-blue-600" />
            <span>Edit History</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-rose-500 p-1 rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="max-h-56 overflow-y-auto space-y-2.5">
          {logs.length > 0 ? (
            logs.map(log => (
              <div key={log.id} className="text-xs p-2.5 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
                <div className="flex items-center gap-1.5 font-medium">
                  <span className="text-slate-500 line-through">Rs. {log.old_amount.toLocaleString()}</span>
                  <span className="text-slate-400">➔</span>
                  <span className="text-emerald-600 font-bold">Rs. {log.new_amount.toLocaleString()}</span>
                </div>
                <div className="text-[10px] text-slate-400 flex items-center justify-between pt-0.5">
                  <span>
                    By: <b className="uppercase text-slate-700">{log.edited_by}</b>
                  </span>
                  <span>{new Date(log.edited_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-6 text-xs text-slate-400">
              <History className="w-6 h-6 mx-auto mb-1 text-slate-300 opacity-60" />
              <span>No prior amount edits recorded.</span>
            </div>
          )}
        </div>

        <div className="mt-4 pt-3 border-t border-slate-100 text-center">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
